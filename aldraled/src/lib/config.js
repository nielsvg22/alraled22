export const VAT_RATE = 0.21;

// Op het eigen domein (alra-led.com) praat de site met api.alra-led.com; op het tijdelijke adres
// (en lokaal) met het adres uit de build-instelling REACT_APP_API_URL. Zo werken beide naast elkaar.
const ENV_API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000').trim();
export const IS_PRODUCTION_DOMAIN = typeof window !== 'undefined' && /(^|\.)alra-led\.com$/i.test(window.location.hostname);
export const API_URL = IS_PRODUCTION_DOMAIN ? 'https://api.alra-led.com' : ENV_API_URL;
