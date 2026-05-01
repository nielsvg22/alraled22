import { Request, Response } from 'express';
import OpenAI from 'openai';
import { listProducts } from '../db/productsRepo';
import { getContent } from '../db/contentRepo';
import nodemailer from 'nodemailer';

const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

const getAISettings = async () => {
  const settings = await getContent('ai_settings');
  return settings || {};
};

const getClient = async () => {
  const settings = await getAISettings();
  const provider = settings.preferredProvider || 'groq';

  if (provider === 'openai') {
    const key = settings.openaiApiKey || process.env.OPENAI_API_KEY;
    if (!key) throw new Error('OpenAI API Key is niet geconfigureerd');
    return {
      openai: new OpenAI({ apiKey: key }),
      model: 'gpt-4o-mini' // Default cheap/fast model for OpenAI
    };
  } else {
    const key = settings.groqApiKey || process.env.GROQ_API_KEY;
    if (!key) throw new Error('Groq API Key is niet geconfigureerd');
    return {
      openai: new OpenAI({
        baseURL: 'https://api.groq.com/openai/v1',
        apiKey: key,
      }),
      model: process.env.AI_MODEL || DEFAULT_MODEL
    };
  }
};

// ── POST /api/ai/product-description ────────────────────────────
export const generateProductDescription = async (req: Request, res: Response) => {
  try {
    const { name, category, keywords } = req.body;
    if (!name) return res.status(400).json({ error: 'Product naam is verplicht' });

    const { openai, model } = await getClient();
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

    const completion = await openai.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.7,
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? '';
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

    const { openai, model } = await getClient();
    const wordCount = length === 'kort' ? '20-40' : length === 'lang' ? '80-120' : '40-70';
    const prompt = [
      `Schrijf webtekst in het Nederlands voor ALRA LED Solutions, een B2B LED-verlichtingsspecialist.`,
      `Sectie: ${section}`,
      context ? `Context / onderwerp: ${context}` : '',
      `Toon: ${tone || 'professioneel en zakelijk'}`,
      `Lengte: ${wordCount} woorden`,
      `Geen markdown, geen aanhalingstekens, gewone lopende tekst.`,
    ].filter(Boolean).join('\n');

    const completion = await openai.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.75,
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? '';
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

    const { openai, model } = await getClient();
    const completion = await openai.chat.completions.create({
      model: model,
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

    const text = completion.choices[0]?.message?.content?.trim() ?? '';
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

    const openai = getClient();
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: 'system',
          content: [
            'Je bent een vriendelijke verkoopassistent voor ALRA LED Solutions, specialist in professionele LED-verlichting voor bedrijfswagens, bouwplaatsen en werkplaatsen.',
            'Je helpt bezoekers met productvragen, technische specs, levertijden en offertes.',
            'Houd antwoorden kort (max 3 zinnen), professioneel en in het Nederlands.',
            'Als je het antwoord niet weet, verwijs je vriendelijk naar contact@alraled.nl of tel. voor een offerte.',
            'Nooit prijzen noemen tenzij de klant er specifiek naar vraagt.',
            'Je hebt toegang tot de actuele productcatalogus inclusief voorraadstatus. Gebruik deze informatie om voorraadvragen correct te beantwoorden.',
            stockContext,
          ].filter(Boolean).join(' '),
        },
        ...messages.slice(-8),
      ],
      max_tokens: 300,
      temperature: 0.6,
    });
    const reply = completion.choices[0]?.message?.content?.trim() ?? '';
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

    const openai = getClient();
    const prompt = [
      `Je genereert website-content in JSON voor ALRA LED Solutions, een B2B LED-verlichtingsbedrijf.`,
      `Sectie: ${schema.label}`,
      `Velden: ${schema.fields}`,
      `Opdracht: ${description}`,
      `Retourneer ALLEEN valide JSON, geen uitleg, geen markdown, geen code-blokken.`,
      `Voorbeeld formaat: ${schema.example}`,
    ].join('\n');

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
      temperature: 0.7,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? '';
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

    const openai = getClient();
    const prompt = [
      `Je genereert website-content in JSON voor ALRA LED Solutions, een B2B LED-verlichtingsbedrijf.`,
      `Bloktype: ${schema.label}`,
      `Opdracht van de gebruiker: ${description}`,
      `Retourneer ALLEEN valide JSON zonder uitleg of markdown.`,
      `Verplicht formaat (vul alle velden in passend bij de opdracht): ${JSON.stringify(schema.example)}`,
    ].join('\n');

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 700,
      temperature: 0.7,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? '';
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
