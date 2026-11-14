import { getContent, setContent } from './contentRepo';
import { LEGAL_RETURNS } from '../seed/legalReturns';

// Zet het retourbeleid eenmalig in het CMS wanneer de pagina nog leeg is. Bestaande, door jullie ingevulde tekst wordt nooit overschreven.
const FLAG = 'seed_legal_returns_v1';

export async function seedLegalReturns(): Promise<void> {
  try {
    if (await getContent(FLAG)) return;
    const current = (await getContent('legal_returns')) as any;
    const hasContent = current && typeof current === 'object' && String(current.content || '').replace(/<[^>]*>/g, '').trim().length > 40;
    if (!hasContent) await setContent('legal_returns', { ...(current || {}), ...LEGAL_RETURNS } as any);
    await setContent(FLAG, { done: true, seeded: !hasContent, at: new Date().toISOString() });
    console.log(`[seed] retourbeleid ${hasContent ? 'bestond al, niet overschreven' : 'toegevoegd'}`);
  } catch (err) {
    console.error('[seed] retourbeleid seeden mislukt:', err);
  }
}
