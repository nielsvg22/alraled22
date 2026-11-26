import { getContent, setContent } from './contentRepo';
import { LEGAL_COMPLAINTS } from '../seed/legalComplaints';

// Eenmalig: alleen als de pagina nog de oude tekst heeft (oud e-mailadres of het gesloten ODR-platform). Een door jullie aangepaste tekst blijft ongemoeid.
const FLAG = 'seed_legal_complaints_v1';

export async function seedLegalComplaints(): Promise<void> {
  try {
    if (await getContent(FLAG)) return;
    const current = (await getContent('legal_complaints')) as any;
    const text = String(current?.content || '');
    const isOld = /info@alra-led\.com/i.test(text) || /ec\.europa\.eu\/odr|ODR-platform/i.test(text);
    if (isOld) await setContent('legal_complaints', { ...(current || {}), ...LEGAL_COMPLAINTS } as any);
    await setContent(FLAG, { done: true, replaced: isOld, at: new Date().toISOString() });
    console.log(`[seed] klachten en retouren ${isOld ? 'bijgewerkt' : 'ongewijzigd gelaten'}`);
  } catch (err) {
    console.error('[seed] klachten seeden mislukt:', err);
  }
}
