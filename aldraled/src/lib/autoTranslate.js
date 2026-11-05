// Vertaalt alle zichtbare tekst op de pagina (tekstknopen + placeholder/title/alt/aria-label)
// op basis van een woordenboek (locales/dict.json: Nederlands -> [Engels, Duits]).
// Het origineel (Nederlands) blijft bewaard, zodat terugschakelen naar NL alles herstelt.
// Tekst die niet vertaald mag worden: zet data-no-translate (of class "notranslate") op het element.
import dict from '../locales/dict.json';

const LANG_INDEX = { en: 0, de: 1 };
const ATTRS = ['placeholder', 'title', 'alt', 'aria-label'];
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE']);

const norm = (s) => s.replace(/\s+/g, ' ').trim();
const lower = new Map();
const exact = new Map();
Object.keys(dict).forEach((k) => {
  exact.set(norm(k), dict[k]);
  lower.set(norm(k).toLowerCase(), dict[k]);
});
let extra = null; // extra woordenboek (bv. CMS-teksten), per taal geladen

// Patronen voor tekst met dynamische delen (aantallen, namen).
const RULES = [
  [/^Welkom,\s*(.+)$/i, ['Welcome, $1', 'Willkommen, $1']],
  [/^Totaal:\s*(\d+)$/i, ['Total: $1', 'Gesamt: $1']],
  [/^(\d+)\s+artikelen?$/i, ['$1 item(s)', '$1 Artikel']],
  [/^(\d+)\s+producten$/i, ['$1 products', '$1 Produkte']],
  [/^(\d+)\s+product$/i, ['$1 product', '$1 Produkt']],
  [/^(\d+)\s+min(?:\.|uten)? lezen$/i, ['$1 min read', '$1 Min. Lesezeit']],
  [/^Bestelling\s+#?(.+)$/i, ['Order #$1', 'Bestellung #$1']],
  [/^Order\s+#(.+)$/i, ['Order #$1', 'Bestellung #$1']],
  [/^Bij\s+(\d+)\s*\+?\s*stuks?$/i, ['From $1 pcs', 'Ab $1 Stück']],
  [/^(\d+)\s+stuks?$/i, ['$1 pcs', '$1 Stück']],
  [/^(\d+)\s+dagen retour$/i, ['$1-day returns', '$1 Tage Rückgabe']],
  [/^(\d+)\s+jaar garantie$/i, ['$1 year warranty', '$1 Jahre Garantie']],
  [/^(\d+)\s+vestigingen?$/i, ['$1 branches', '$1 Filialen']],
  [/^Gekocht:\s*(\d+)x?$/i, ['Bought: $1x', 'Gekauft: $1x']],
  [/^Vergelijk\s+(\d+)\s*(?:→|->)?$/i, ['Compare $1 →', '$1 vergleichen →']],
  [/^(\d+)\/3 geselecteerd voor vergelijking$/i, ['$1/3 selected for comparison', '$1/3 zum Vergleich ausgewählt']],
  [/^Bekijk\s+(\d+)\s+resultaten?$/i, ['View $1 results', '$1 Ergebnisse ansehen']],
  [/^Nog\s+(\d+)\s+op voorraad$/i, ['Only $1 left in stock', 'Nur noch $1 auf Lager']],
  [/^Bijna op\s*[–-]\s*(\d+)\s+op voorraad$/i, ['Almost sold out – $1 in stock', 'Fast ausverkauft – $1 auf Lager']],
  [/^(\d+)\s+op voorraad$/i, ['$1 in stock', '$1 auf Lager']],
  [/^(\d+(?:[.,]\d+)?)\s*km$/i, ['$1 km', '$1 km']],
  [/^vanaf (\d+) stuks ([\d.,]+)% korting$/i, ['from $1 pcs $2% discount', 'ab $1 Stück $2 % Rabatt']],
  [/^(.+) verwijderen$/i, ['Remove $1', '$1 entfernen']],
  [/^Toon alle (\d+) verkooppunten$/i, ['Show all $1 points of sale', 'Alle $1 Verkaufsstellen anzeigen']],
  [/^(\d+) verkooppunten$/i, ['$1 points of sale', '$1 Verkaufsstellen']],
];

function pick(part, idx) {
  const k = norm(part);
  const h = exact.get(k) || (extra && extra.exact.get(k)) || lower.get(k.toLowerCase()) || (extra && extra.lower.get(k.toLowerCase()));
  return h && h[idx] ? h[idx] : null;
}

function lookup(text, lang) {
  const idx = LANG_INDEX[lang];
  if (idx === undefined) return null;
  const key = norm(text);
  if (!key) return null;
  let hit = exact.get(key) || (extra && extra.exact.get(key));
  if (!hit) hit = lower.get(key.toLowerCase()) || (extra && extra.lower.get(key.toLowerCase()));
  if (hit && hit[idx]) return hit[idx];
  for (const [re, tpl] of RULES) {
    if (re.test(key)) return key.replace(re, tpl[idx]);
  }
  // "Label: waarde" (specificaties, opsommingen): vertaal beide delen apart.
  const m = key.match(/^([•\-\u2022]\s*)?([^:]{2,60}):\s+(.+)$/);
  if (m) {
    const l = pick(m[2], idx);
    const v = pick(m[3], idx);
    if (l || v) return (m[1] || '') + (l || m[2]) + ': ' + (v || m[3]);
  }
  // Productnamen met "(N stuks)"
  if (/\(\d+ stuks\)/i.test(key)) {
    const head = key.replace(/\s*\(\d+ stuks\)\s*$/i, '');
    const n = key.match(/\((\d+) stuks\)/i)[1];
    const h = pick(head, idx) || head;
    return `${h} (${n} ${idx === 0 ? 'pieces' : 'Stück'})`;
  }
  // Opsomming met ' · '
  if (key.includes(' · ')) {
    const out = key.split(' · ').map((x) => lookup(x, lang));
    if (out.every(Boolean)) return out.join(' · ');
  }
  // Meerdere zinnen: vertaal zin voor zin (bv. alinea's die door <br> in stukken zijn gesplitst)
  const parts = key.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý•→])/);
  if (parts.length > 1) {
    const out = parts.map((x) => pick(x, idx));
    if (out.every(Boolean)) return out.join(' ');
  }
  return null;
}

export function translateText(text, lang) {
  const code = (lang || 'nl').split('-')[0];
  return lookup(text, code) || text;
}

// Behoud de witruimte vóór/na de tekst van de originele knoop.
function applyKeepingSpace(original, translated) {
  const lead = original.match(/^\s*/)[0];
  const trail = original.match(/\s*$/)[0];
  return lead + translated + trail;
}

const textState = new WeakMap(); // Text -> { orig, applied }
const attrState = new WeakMap(); // Element -> { attr: { orig, applied } }
let currentLang = 'nl';
let observer = null;
let scheduled = false;
const pending = new Set();

function skipped(el) {
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
    if (SKIP_TAGS.has(n.tagName)) return true;
    if (n.hasAttribute && (n.hasAttribute('data-no-translate') || n.classList.contains('notranslate'))) return true;
    if (n.isContentEditable) return true;
  }
  return false;
}

function handleText(node) {
  const parent = node.parentElement;
  if (!parent || skipped(parent)) return;
  const st = textState.get(node);
  let orig;
  if (st && st.applied === node.data) orig = st.orig;
  else orig = node.data; // nieuw of door React bijgewerkt
  if (currentLang === 'nl') {
    if (st && st.applied === node.data && orig !== node.data) node.data = orig;
    textState.delete(node);
    return;
  }
  const tr = lookup(orig, currentLang);
  if (tr) {
    const next = applyKeepingSpace(orig, tr);
    if (next !== node.data) node.data = next;
    textState.set(node, { orig, applied: next });
  } else if (st) {
    textState.delete(node);
  }
}

function handleAttrs(el) {
  if (skipped(el)) return;
  let st = attrState.get(el);
  const list = ATTRS.slice();
  if (el.tagName === 'INPUT' && ['submit', 'button', 'reset'].includes(el.type)) list.push('value');
  for (const a of list) {
    if (!el.hasAttribute(a)) continue;
    const cur = el.getAttribute(a);
    const s = st && st[a];
    const orig = s && s.applied === cur ? s.orig : cur;
    if (currentLang === 'nl') {
      if (s && s.applied === cur && orig !== cur) el.setAttribute(a, orig);
      if (st) delete st[a];
      continue;
    }
    const tr = lookup(orig, currentLang);
    if (tr) {
      if (tr !== cur) el.setAttribute(a, tr);
      if (!st) { st = {}; attrState.set(el, st); }
      st[a] = { orig, applied: tr };
    } else if (s) delete st[a];
  }
}

function walk(root) {
  if (!root) return;
  if (root.nodeType === 3) { handleText(root); return; }
  if (root.nodeType !== 1) return;
  if (skipped(root)) return;
  handleAttrs(root);
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let n = tw.nextNode();
  while (n) {
    if (n.nodeType === 3) handleText(n);
    else if (n.nodeType === 1) {
      if (SKIP_TAGS.has(n.tagName)) { n = tw.nextSibling() || tw.nextNode(); continue; }
      handleAttrs(n);
    }
    n = tw.nextNode();
  }
}

function flush() {
  scheduled = false;
  const nodes = Array.from(pending);
  pending.clear();
  if (observer) observer.disconnect();
  try { nodes.forEach((n) => { if (n.isConnected !== false) walk(n); }); } finally { connect(); }
}

function queue(node) {
  pending.add(node);
  if (!scheduled) {
    scheduled = true;
    (window.requestAnimationFrame || setTimeout)(flush);
  }
}

function connect() {
  if (!observer || !document.body) return;
  observer.observe(document.body, {
    childList: true, subtree: true, characterData: true,
    attributes: true, attributeFilter: ATTRS.concat(['value']),
  });
  const title = document.querySelector('title');
  if (title) observer.observe(title, { childList: true, characterData: true, subtree: true });
}

function setDocumentLang(lang) {
  try { document.documentElement.lang = lang; } catch (e) { /* ignore */ }
}

// Voegt extra vertalingen toe (bv. uit het CMS): { "nl tekst": ["en","de"] }
export function addTranslations(map) {
  if (!map) return;
  if (!extra) extra = { exact: new Map(), lower: new Map() };
  Object.keys(map).forEach((k) => {
    extra.exact.set(norm(k), map[k]);
    extra.lower.set(norm(k).toLowerCase(), map[k]);
  });
  if (currentLang !== 'nl' && document.body) queue(document.body);
}

export function setAutoTranslateLanguage(lang) {
  const code = (lang || 'nl').split('-')[0];
  currentLang = LANG_INDEX[code] !== undefined ? code : 'nl';
  setDocumentLang(currentLang);
  if (!observer) {
    observer = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === 'childList') m.addedNodes.forEach((n) => queue(n));
        else if (m.type === 'characterData') queue(m.target);
        else if (m.type === 'attributes') queue(m.target);
      }
    });
  }
  if (observer) observer.disconnect();
  if (document.body) {
    walk(document.body);
    const title = document.querySelector('title');
    if (title) walk(title);
    connect();
  }
}
