// Cookie-toestemming (AVG): noodzakelijke cookies altijd, analytische/tracking pas na toestemming.
const KEY = 'alra_cookie_consent';
export const CONSENT_EVENT = 'alra-consent-changed';

export function getConsent() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw && typeof raw === 'object') return { analytics: !!raw.analytics, decided: true };
  } catch (e) { /* geen opslag beschikbaar */ }
  return { analytics: false, decided: false };
}

export function setConsent(analytics) {
  try { localStorage.setItem(KEY, JSON.stringify({ analytics: !!analytics, ts: Date.now() })); } catch (e) { /* ignore */ }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: { analytics: !!analytics } }));
}

export function resetConsent() {
  try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: { analytics: false, reopen: true } }));
}
