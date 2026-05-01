import { Request, Response } from 'express';
import OpenAI from 'openai';
import { listProducts } from '../db/productsRepo';
import { getContent } from '../db/contentRepo';
import nodemailer from 'nodemailer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { randomUUID } from 'node:crypto';

const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

interface AISettings {
  openaiApiKey?: string;
  groqApiKey?: string;
  googleApiKey?: string;
  chatgptAccessToken?: string;
  preferredProvider?: string;
  preferredImageProvider?: string;
  nanoBananaModel?: string;
}

const getAISettings = async (): Promise<AISettings> => {
  const settings = await getContent('ai_settings');
  return (settings || {}) as AISettings;
};

interface AIClient {
  openai: OpenAI;
  model: string;
  isGoogle?: boolean;
  googleModel?: any;
}

const getClient = async (): Promise<AIClient> => {
  const settings = await getAISettings();
  const provider = settings.preferredProvider || 'groq';

  if (provider === 'bridge' && settings.chatgptAccessToken) {
    // Return a special client for the ChatGPT Bridge
    return {
      isBridge: true,
      accessToken: settings.chatgptAccessToken,
      openai: null as any,
      model: 'gpt-4o'
    } as any;
  }

  if (provider === 'openai') {
    const key = settings.openaiApiKey;
    if (!key) throw new Error('OpenAI API Key is niet geconfigureerd in het CRM');
    return {
      openai: new OpenAI({ apiKey: key }),
      model: 'gpt-4o-mini'
    };
  } else if (provider === 'google') {
    const key = settings.googleApiKey;
    if (!key) throw new Error('Google / Nano Banana API Key is niet geconfigureerd in het CRM');
    
    const genAI = new GoogleGenerativeAI(key);
    
    // Select model based on Nano Banana settings
    let modelId = 'gemini-1.5-flash';
    if (settings.nanoBananaModel === 'pro' || settings.nanoBananaModel === 'thinking') {
      modelId = 'gemini-1.5-pro';
    }
    
    const model = genAI.getGenerativeModel({ model: modelId });

    return {
      isGoogle: true,
      googleModel: model,
      openai: null as any,
      model: modelId
    };
  } else {
    const key = settings.groqApiKey;
    if (!key) throw new Error('Groq API Key is niet geconfigureerd in het CRM');
    return {
      openai: new OpenAI({
        baseURL: 'https://api.groq.com/openai/v1',
        apiKey: key,
      }),
      model: process.env.AI_MODEL || DEFAULT_MODEL
    };
  }
};

export const callBridge = async (accessToken: string, prompt: string) => {
  try {
    const response = await fetch('https://chatgpt.com/backend-api/conversation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.trim()}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        action: 'next',
        messages: [{
          id: randomUUID(),
          author: { role: 'user' },
          content: { content_type: 'text', parts: [prompt] },
          metadata: {}
        }],
        model: 'gpt-4o',
        parent_message_id: randomUUID(),
        timezone_offset_min: -60,
        history_and_training_disabled: true,
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Bridge HTTP Error:', response.status, err);
      if (response.status === 401 || response.status === 403) {
        throw new Error('ChatGPT Bridge: Je Access Token is ongeldig of verlopen. Vernieuw je sessie op chatgpt.com.');
      }
      throw new Error(`ChatGPT Bridge Error (${response.status}): ${err.slice(0, 100)}`);
    }

    const text = await response.text();
    if (!text) throw new Error('ChatGPT Bridge: Leeg antwoord ontvangen.');

    const lines = text.split('\n');
    let finalResult = '';

    // Loop backwards to find the last valid data object
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i]!.trim();
      if (!line.startsWith('data: ')) continue;
      if (line.includes('[DONE]')) continue;

      try {
        const jsonStr = line.substring(6);
        const data = JSON.parse(jsonStr);
        const content = data.message?.content?.parts?.[0];
        if (content) {
          finalResult = content;
          break;
        }
      } catch (e) {
        // Skip invalid JSON lines
        continue;
      }
    }

    if (!finalResult) {
      console.error('Bridge parsing failed. Raw response snippet:', text.slice(-200));
      throw new Error('ChatGPT Bridge: Kon geen tekst extraheren uit het antwoord.');
    }

    return finalResult;
  } catch (err: any) {
    console.error('Bridge Fatal Error:', err);
    throw err;
  }
};

// New function to generate images via ChatGPT Plus (DALL-E 3)
export const callBridgeImage = async (accessToken: string, prompt: string): Promise<string> => {
  try {
    const response = await fetch('https://chatgpt.com/backend-api/conversation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.trim()}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        action: 'next',
        messages: [{
          id: randomUUID(),
          author: { role: 'user' },
          content: { content_type: 'text', parts: [prompt] },
          metadata: {}
        }],
        model: 'gpt-4o',
        parent_message_id: randomUUID(),
        timezone_offset_min: -60,
        history_and_training_disabled: true,
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Bridge Image HTTP Error:', response.status, err);
      if (response.status === 401 || response.status === 403) {
        throw new Error('ChatGPT Bridge: Je Access Token is ongeldig of verlopen. Vernieuw je sessie op chatgpt.com.');
      }
      throw new Error(`ChatGPT Bridge Error (${response.status}): ${err.slice(0, 100)}`);
    }

    const text = await response.text();
    if (!text) throw new Error('ChatGPT Bridge: Leeg antwoord ontvangen.');

    const lines = text.split('\n');
    let imageUrl: string | null = null;

    // Look for image generation in the SSE response
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i]!.trim();
      if (!line.startsWith('data: ')) continue;
      if (line.includes('[DONE]')) continue;

      try {
        const jsonStr = line.substring(6);
        const data = JSON.parse(jsonStr);
        
        // Check for image content in the message
        const message = data.message;
        if (message && message.content) {
          // Check for image parts (DALL-E 3 generates images as content parts)
          const parts = message.content.parts || [];
          for (const part of parts) {
            if (typeof part === 'object' && part.content_type === 'image_asset_pointer') {
              // Found an image reference
              imageUrl = part.asset_pointer || null;
              if (imageUrl) break;
            }
          }
          
          // Also check for attachments (alternative format)
          if (!imageUrl && message.attachments) {
            for (const attachment of message.attachments) {
              if (attachment.name && (attachment.name.endsWith('.png') || attachment.name.endsWith('.jpg'))) {
                imageUrl = attachment.url || attachment.asset_pointer || null;
                if (imageUrl) break;
              }
            }
          }
        }
        
        // Check metadata for image info
        if (!imageUrl && data.generation_metadata?.image) {
          imageUrl = data.generation_metadata.image.url || null;
        }
        
        if (imageUrl) break;
      } catch (e) {
        continue;
      }
    }

    if (!imageUrl) {
      console.error('Bridge image parsing failed. Raw response snippet:', text.slice(-500));
      throw new Error('ChatGPT Bridge: Geen afbeelding gevonden in het antwoord. Zorg dat je Plus abonnement actief is en DALL-E 3 beschikbaar is.');
    }

    // The asset_pointer might need to be resolved to a full URL
    // Sometimes it's a relative path or needs the ChatGPT file service
    if (imageUrl.startsWith('file-service://') || imageUrl.startsWith('sandbox://')) {
      // Convert to ChatGPT file service URL
      const fileId = imageUrl.replace('file-service://', '').replace('sandbox://', '');
      imageUrl = `https://chatgpt.com/backend-api/files/${fileId}/download`;
    }

    // Download the image
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken.trim()}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });

    if (!imageResponse.ok) {
      throw new Error(`Kon de gegenereerde afbeelding niet downloaden: ${imageResponse.status}`);
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    return imageBuffer.toString('base64');
  } catch (err: any) {
    console.error('Bridge Image Fatal Error:', err);
    throw err;
  }
};

// -- POST /api/ai/test-connection --------------------------------
export const testAIConnection = async (req: Request, res: Response) => {
  console.log('[aiController] Testing AI connection...');
  try {
    const client = await getClient();
    const prompt = "Reageer alleen met het woord 'CONNECTIE_OK'.";
    
    let text = '';
    if ((client as any).isBridge) {
      text = await callBridge((client as any).accessToken, prompt);
    } else if ((client as any).isGoogle) {
      const result = await (client as any).googleModel.generateContent(prompt);
      text = result.response.text().trim();
    } else {
      const completion = await client.openai.chat.completions.create({
        model: client.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 10,
      });
      text = completion.choices[0]?.message?.content?.trim() ?? '';
    }

    res.json({ ok: true, result: text });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Verbinding mislukt' });
  }
};

// ── POST /api/ai/product-description ────────────────────────────
export const generateProductDescription = async (req: Request, res: Response) => {
  try {
    const { name, category, keywords } = req.body;
    if (!name) return res.status(400).json({ error: 'Product naam is verplicht' });

    const client = await getClient();
    const prompt = [
      `Schrijf een professionele productomschrijving in het Nederlands voor een B2B LED-verlichtingsbedrijf (ALRA LED Solutions).`,
      `Productnaam: ${name}`,
      category ? `Categorie: ${category}` : '',
      keywords ? `Extra trefwoorden: ${keywords}` : '',
      `Eisen:`,
      `- 2 tot 3 zinnen, zakelijk en overtuigend`,
      `- Noem concrete voordelen (bijv. energiebesparing, lange levensduur, IP-rating)`,
      `- Eindig met een call-to-action`,
      `- Geen markdown, gewone tekst`,
    ].filter(Boolean).join('\n');

    let text = '';
    if ((client as any).isBridge) {
      text = await callBridge((client as any).accessToken, prompt);
    } else if ((client as any).isGoogle) {
      const result = await (client as any).googleModel.generateContent(prompt);
      text = result.response.text().trim();
    } else {
      const completion = await client.openai.chat.completions.create({
        model: client.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.7,
      });
      text = completion.choices[0]?.message?.content?.trim() ?? '';
    }

    res.json({ result: text });
  } catch (err: any) {
    const msg = err?.message || 'AI generatie mislukt';
    res.status(500).json({ error: msg });
  }
};

// ── POST /api/ai/page-text ───────────────────────────────────────
export const generatePageText = async (req: Request, res: Response) => {
  try {
    const { section, context, tone, length } = req.body;
    if (!section) return res.status(400).json({ error: 'Sectie is verplicht' });

    const client = await getClient();
    const wordCount = length === 'kort' ? '20-40' : length === 'lang' ? '80-120' : '40-70';
    const prompt = [
      `Schrijf webtekst in het Nederlands voor ALRA LED Solutions, een B2B LED-verlichtingsspecialist.`,
      `Sectie: ${section}`,
      context ? `Context / onderwerp: ${context}` : '',
      `Toon: ${tone || 'professioneel en zakelijk'}`,
      `Lengte: ${wordCount} woorden`,
      `Geen markdown, geen aanhalingstekens, gewone lopende tekst.`,
    ].filter(Boolean).join('\n');

    let text = '';
    if ((client as any).isBridge) {
      text = await callBridge((client as any).accessToken, prompt);
    } else if ((client as any).isGoogle) {
      const result = await (client as any).googleModel.generateContent(prompt);
      text = result.response.text().trim();
    } else {
      const completion = await client.openai.chat.completions.create({
        model: client.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.75,
      });
      text = completion.choices[0]?.message?.content?.trim() ?? '';
    }

    res.json({ result: text });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'AI generatie mislukt' });
  }
};

// ── POST /api/ai/chat ────────────────────────────────────────────
export const chat = async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is verplicht' });
    }

    const client = await getClient();
    let text = '';

    if ((client as any).isBridge) {
      text = await callBridge((client as any).accessToken, messages[messages.length - 1].content);
    } else if ((client as any).isGoogle) {
      const history = messages.slice(0, -1).map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));
      const lastMsg = messages[messages.length - 1].content;
      
      const chat = (client as any).googleModel.startChat({
        history,
        generationConfig: { maxOutputTokens: 1000 }
      });
      const result = await chat.sendMessage(lastMsg);
      text = result.response.text().trim();
    } else {
      const completion = await client.openai.chat.completions.create({
        model: client.model,
        messages: [
          {
            role: 'system',
            content: [
              'Je bent een behulpzame AI-assistent voor ALRA LED Solutions, een B2B LED-verlichtingsbedrijf.',
              'Je helpt bij het schrijven van teksten, productomschrijvingen, e-mails en marketingcontent.',
              'Antwoord altijd in het Nederlands, tenzij de gebruiker een andere taal gebruikt.',
              'Houd antwoorden beknopt en praktisch bruikbaar.',
            ].join(' '),
          },
          ...messages,
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });
      text = completion.choices[0]?.message?.content?.trim() ?? '';
    }

    res.json({ result: text });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Chat mislukt' });
  }
};

// ── POST /api/ai/storefront-chat (public) ────────────────────────
export const storefrontChat = async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is verplicht' });
    }

    // Fetch current product stock for the AI context
    let stockContext = '';
    try {
      const allProducts = await listProducts();
      if (allProducts.length > 0) {
        const lines = allProducts.map(p => {
          const stockStatus = p.stock <= 0 ? 'uitverkocht' : p.stock <= 5 ? `bijna op (${p.stock} stuks)` : `op voorraad (${p.stock} stuks)`;
          return `- ${p.name}${p.category ? ` [${p.category}]` : ''}: €${p.price} — ${stockStatus}`;
        }).join('\n');
        stockContext = `\n\nActuele productvoorraad:\n${lines}`;
      }
    } catch { /* voorraad ophalen mislukt, ga verder zonder */ }

    const client = await getClient();
    let reply = '';

    const systemPrompt = [
      'Je bent een vriendelijke verkoopassistent voor ALRA LED Solutions, specialist in professionele LED-verlichting voor bedrijfswagens, bouwplaatsen en werkplaatsen.',
      'Je helpt bezoekers met productvragen, technische specs, levertijden en offertes.',
      'Houd antwoorden kort (max 3 zinnen), professioneel en in het Nederlands.',
      'Als je het antwoord niet weet, verwijs je vriendelijk naar contact@alraled.nl of tel. voor een offerte.',
      'Nooit prijzen noemen tenzij de klant er specifiek naar vraagt.',
      'Je hebt toegang tot de actuele productcatalogus inclusief voorraadstatus. Gebruik deze informatie om voorraadvragen correct te beantwoorden.',
      stockContext,
    ].filter(Boolean).join(' ');

    if ((client as any).isBridge) {
      reply = await callBridge((client as any).accessToken, systemPrompt + "\n\nUser message: " + messages[messages.length - 1].content);
    } else if ((client as any).isGoogle) {
      const history = messages.slice(0, -1).map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));
      const lastMsg = messages[messages.length - 1].content;
      
      const chat = (client as any).googleModel.startChat({
        history,
        generationConfig: { maxOutputTokens: 500 },
        systemInstruction: systemPrompt
      });
      const result = await chat.sendMessage(lastMsg);
      reply = result.response.text().trim();
    } else {
      const completion = await client.openai.chat.completions.create({
        model: client.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-8),
        ],
        max_tokens: 300,
        temperature: 0.6,
      });
      reply = completion.choices[0]?.message?.content?.trim() ?? '';
    }

    res.json({ result: reply });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'AI tijdelijk niet beschikbaar' });
  }
};

// ── POST /api/ai/website-block ───────────────────────────────────
const SECTION_SCHEMAS: Record<string, { label: string; fields: string; example: string }> = {
  hero: {
    label: 'Hero (bovenste sectie)',
    fields: 'title, subtitle, primaryButtonText, secondaryButtonText',
    example: '{"title":"Verlichting die werkt","subtitle":"Professionele LED-oplossingen","primaryButtonText":"START PROJECT","secondaryButtonText":"BEKIJK CASES"}',
  },
  introSection: {
    label: 'Intro sectie',
    fields: 'badge, heading, description, linkText, deliveryTitle, deliverySubtitle',
    example: '{"badge":"Over ALRA LED","heading":"Professionele LED-oplossingen","description":"Wij zijn specialist...","linkText":"Meer over ons","deliveryTitle":"Direct leverbaar","deliverySubtitle":"Snelle levering in heel Nederland"}',
  },
  specializations: {
    label: 'Specialisaties (kaartjes)',
    fields: 'array van items, elk met: title, description, icon (emoji)',
    example: '[{"title":"Bedrijfswagens","description":"Robuuste LED-balken","icon":"🚐"},{"title":"Bouwplaatsen","description":"Krachtige werklampen","icon":"🏗️"}]',
  },
  stats: {
    label: 'Statistieken / cijfers',
    fields: 'array van items, elk met: number, label',
    example: '[{"number":"10+","label":"Jaar ervaring"},{"number":"500+","label":"Klanten"}]',
  },
  process: {
    label: 'Ontwikkeling / Process sectie',
    fields: 'title, description, buttonText, steps (array van { title, description })',
    example: '{"title":"Ons proces","description":"Van advies tot installatie","buttonText":"Neem contact op","steps":[{"title":"Advies","description":"Wij analyseren jouw situatie"}]}',
  },
  cta: {
    label: 'Call-to-action sectie',
    fields: 'title, subtitle, primaryButton, secondaryButton',
    example: '{"title":"Klaar om te beginnen?","subtitle":"Vraag een vrijblijvende offerte aan","primaryButton":"OFFERTE AANVRAGEN","secondaryButton":"MEER INFO"}',
  },
  about: {
    label: 'Over Ons pagina',
    fields: 'title, description',
    example: '{"title":"Over ALRA LED Solutions","description":"Al meer dan 10 jaar leveren wij..."}',
  },
};

export const generateWebsiteBlock = async (req: Request, res: Response) => {
  try {
    const { sectionKey, description } = req.body;
    if (!sectionKey || !description) {
      return res.status(400).json({ error: 'sectionKey en description zijn verplicht' });
    }
    const schema = SECTION_SCHEMAS[sectionKey];
    if (!schema) return res.status(400).json({ error: `Onbekende sectie: ${sectionKey}` });

    const client = await getClient();
    const prompt = [
      `Je genereert website-content in JSON voor ALRA LED Solutions, een B2B LED-verlichtingsbedrijf.`,
      `Sectie: ${schema.label}`,
      `Velden: ${schema.fields}`,
      `Opdracht: ${description}`,
      `Retourneer ALLEEN valide JSON, geen uitleg, geen markdown, geen code-blokken.`,
      `Voorbeeld formaat: ${schema.example}`,
    ].join('\n');

    let raw = '';
    if ((client as any).isGoogle) {
      const result = await (client as any).googleModel.generateContent(prompt);
      raw = result.response.text().trim();
    } else if ((client as any).isBridge) {
      raw = await callBridge((client as any).accessToken, prompt);
    } else {
      const completion = await client.openai.chat.completions.create({
        model: client.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.7,
      });
      raw = completion.choices[0]?.message?.content?.trim() ?? '';
    }

    const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

    let parsed: unknown;
    try { parsed = JSON.parse(cleaned); }
    catch { return res.status(500).json({ error: 'AI retourneerde geen valide JSON. Probeer opnieuw.', raw }); }

    res.json({ result: parsed });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'AI generatie mislukt' });
  }
};

// ── POST /api/ai/new-block ───────────────────────────────────────
const BLOCK_SCHEMAS: Record<string, { label: string; example: object }> = {
  banner:       { label: 'Banner (brede tekstbalk)',       example: { heading: 'Groot voordeel', subtext: 'Korte beschrijving', buttonText: 'Meer info', bgColor: '#0c4684', textColor: '#ffffff' } },
  text_block:   { label: 'Tekstblok (koptekst + alinea)', example: { heading: 'Onze aanpak', body: 'Wij werken nauw samen met onze klanten om de beste oplossing te vinden.' } },
  feature_grid: { label: 'Voordelen grid (kaartjes)',      example: { heading: 'Waarom ALRA LED?', items: [{ icon: '⚡', title: 'Snel geleverd', description: 'Uit voorraad leverbaar' }, { icon: '🛡️', title: '5 jaar garantie', description: 'Op alle producten' }] } },
  image_text:   { label: 'Afbeelding + tekst',            example: { heading: 'Over ons', body: 'Al meer dan 10 jaar dé specialist.', imageUrl: '', imagePosition: 'left' } },
  stats_row:    { label: 'Statistieken rij',              example: { items: [{ number: '10+', label: 'Jaar ervaring' }, { number: '500+', label: 'Tevreden klanten' }] } },
  cta_block:    { label: 'Call-to-action',                example: { heading: 'Klaar om te starten?', subtext: 'Vraag vandaag een offerte aan.', primaryButton: 'Offerte aanvragen', secondaryButton: 'Meer info' } },
  steps:        { label: 'Stappen / proces',              example: { heading: 'Ons proces', items: [{ number: '01', title: 'Advies', description: 'Persoonlijk gesprek' }, { number: '02', title: 'Offerte', description: 'Transparante prijzen' }] } },
};

export const generateNewBlock = async (req: Request, res: Response) => {
  try {
    const { blockType, description } = req.body;
    if (!blockType || !description) return res.status(400).json({ error: 'blockType en description zijn verplicht' });

    const schema = BLOCK_SCHEMAS[blockType];
    if (!schema) return res.status(400).json({ error: `Onbekend bloktype: ${blockType}` });

    const client = await getClient();
    const prompt = [
      `Je genereert website-content in JSON voor ALRA LED Solutions, een B2B LED-verlichtingsbedrijf.`,
      `Bloktype: ${schema.label}`,
      `Opdracht van de gebruiker: ${description}`,
      `Retourneer ALLEEN valide JSON zonder uitleg of markdown.`,
      `Verplicht formaat (vul alle velden in passend bij de opdracht): ${JSON.stringify(schema.example)}`,
    ].join('\n');

    let raw = '';
    if ((client as any).isGoogle) {
      const result = await (client as any).googleModel.generateContent(prompt);
      raw = result.response.text().trim();
    } else if ((client as any).isBridge) {
      raw = await callBridge((client as any).accessToken, prompt);
    } else {
      const completion = await client.openai.chat.completions.create({
        model: client.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 700,
        temperature: 0.7,
      });
      raw = completion.choices[0]?.message?.content?.trim() ?? '';
    }

    const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

    let parsed: unknown;
    try { parsed = JSON.parse(cleaned); }
    catch { return res.status(500).json({ error: 'AI retourneerde geen valide JSON. Probeer opnieuw.', raw }); }

    res.json({ result: parsed });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'AI generatie mislukt' });
  }
};

// -- POST /api/ai/test-email --------------------------------------
export const testEmail = async (req: Request, res: Response) => {
  try {
    const { to, settings } = req.body;
    if (!to || !settings?.host || !settings?.user || !settings?.pass) {
      return res.status(400).json({ error: 'to, host, user en pass zijn verplicht' });
    }
    const transport = nodemailer.createTransport({
      host: settings.host,
      port: settings.port || 587,
      secure: settings.secure || false,
      auth: { user: settings.user, pass: settings.pass },
    });
    await transport.sendMail({
      from: `"${settings.fromName || 'ALRA LED Solutions'}" <${settings.fromEmail || settings.user}>`,
      to,
      subject: 'Test email � ALRA LED Solutions CRM',
      text: 'Dit is een test email vanuit het ALRA LED CRM systeem. Als u dit ontvangt, werkt de configuratie correct!',
    });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Verzenden mislukt' });
  }
};
