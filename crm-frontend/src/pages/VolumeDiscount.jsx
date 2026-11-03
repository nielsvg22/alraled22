import React, { useEffect, useState } from 'react';
import { Save, CheckCircle, Plus, Trash2, Percent } from 'lucide-react';
import api from '../lib/api';
import { errorText } from '../lib/errorText';

const iCls = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';
const DEFAULT = { enabled: true, tiers: [{ minQty: 10, percent: 10 }] };
const eur = (n) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);

// Staffelkorting: automatisch korting per product vanaf een aantal stuks (webshop, bestellingen en offertes)
export default function VolumeDiscount() {
  const [cfg, setCfg] = useState(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [example, setExample] = useState({ price: 100, qty: 10 });

  useEffect(() => {
    api.get('/content/volume_discount')
      .then(r => { const d = r.data; if (d && typeof d === 'object') setCfg({ enabled: d.enabled !== false, tiers: Array.isArray(d.tiers) ? d.tiers : DEFAULT.tiers }); })
      .catch(() => setCfg(DEFAULT))
      .finally(() => setLoading(false));
  }, []);

  const setTier = (i, patch) => setCfg(c => ({ ...c, tiers: c.tiers.map((t, j) => j === i ? { ...t, ...patch } : t) }));

  const clean = () => ({
    enabled: cfg.enabled,
    tiers: cfg.tiers
      .map(t => ({ minQty: Math.floor(Number(t.minQty)), percent: Number(t.percent) }))
      .filter(t => t.minQty >= 2 && t.percent > 0 && t.percent <= 90)
      .sort((a, b) => a.minQty - b.minQty),
  });

  const save = async () => {
    setSaving(true); setError('');
    try {
      const body = clean();
      await api.put('/content/volume_discount', body);
      setCfg(body);
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (e) { setError(`Opslaan mislukt: ${errorText(e, 'onbekende fout')}`); }
    finally { setSaving(false); }
  };

  const applied = (() => {
    if (!cfg.enabled) return 0;
    let best = 0;
    clean().tiers.forEach(t => { if (example.qty >= t.minQty && t.percent >= best) best = t.percent; });
    return best;
  })();
  const unit = Math.round(example.price * (1 - applied / 100) * 100) / 100;

  if (loading) return <div className="p-8 text-gray-400 text-sm animate-pulse">Laden...</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3"><Percent className="w-7 h-7 text-blue-600" /> Staffelkorting</h1>
          <p className="text-sm text-gray-400 font-medium mt-1">Automatisch korting vanaf een aantal stuks van hetzelfde product</p>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black text-white transition-all active:scale-95 disabled:opacity-50"
          style={{ background: saved ? 'linear-gradient(135deg,#065f46,#10b981)' : 'linear-gradient(135deg,#1e40af,#3b82f6)' }}>
          {saved ? <><CheckCircle size={15} /> Opgeslagen!</> : saving ? 'Opslaan…' : <><Save size={15} /> Opslaan</>}
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" className="w-5 h-5" checked={cfg.enabled} onChange={e => setCfg({ ...cfg, enabled: e.target.checked })} />
          <span className="font-black text-gray-900">Staffelkorting staat {cfg.enabled ? 'aan' : 'uit'}</span>
        </label>

        <div className={cfg.enabled ? '' : 'opacity-50 pointer-events-none'}>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2">Staffels</p>
          <div className="space-y-2">
            {cfg.tiers.map((t, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm text-gray-500 w-14">Vanaf</span>
                <input type="number" min="2" className={`${iCls} w-28`} value={t.minQty} onChange={e => setTier(i, { minQty: e.target.value })} />
                <span className="text-sm text-gray-500">stuks</span>
                <input type="number" min="1" max="90" step="0.5" className={`${iCls} w-28`} value={t.percent} onChange={e => setTier(i, { percent: e.target.value })} />
                <span className="text-sm text-gray-500">% korting</span>
                <button type="button" aria-label="Staffel verwijderen" onClick={() => setCfg(c => ({ ...c, tiers: c.tiers.filter((_, j) => j !== i) }))} className="text-gray-400 hover:text-red-500 p-2"><Trash2 size={15} /></button>
              </div>
            ))}
            <button type="button" onClick={() => setCfg(c => ({ ...c, tiers: [...c.tiers, { minQty: 25, percent: 15 }] }))} className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-800"><Plus size={15} /> Staffel toevoegen</button>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2">Voorbeeld</p>
          <div className="flex items-center gap-3 flex-wrap text-sm text-gray-600">
            <span>Product van</span>
            <input type="number" min="0" step="0.01" className={`${iCls} w-28`} value={example.price} onChange={e => setExample({ ...example, price: Number(e.target.value) })} />
            <span>excl. btw, aantal</span>
            <input type="number" min="1" className={`${iCls} w-24`} value={example.qty} onChange={e => setExample({ ...example, qty: Number(e.target.value) })} />
          </div>
          <p className="mt-3 text-sm font-bold text-gray-900">
            {applied > 0
              ? <>Korting {applied}% → {eur(unit)} per stuk, totaal {eur(unit * example.qty)} <span className="text-emerald-600">(bespaart {eur((example.price - unit) * example.qty)})</span></>
              : <>Geen korting bij {example.qty} stuks → {eur(example.price)} per stuk</>}
          </p>
        </div>
      </div>

      <div className="text-xs text-gray-500 space-y-1 bg-gray-50 border border-gray-100 rounded-2xl p-4">
        <p>• De korting geldt <b>per product</b>: 10 stuks van hetzelfde product. Verschillende producten worden niet opgeteld.</p>
        <p>• Hij staat automatisch op <b>de offerte</b> (met "Staffelkorting 10% vanaf 10 stuks" en de normale prijs), in de winkelwagen en bij het afrekenen.</p>
        <p>• Heeft een product een eigen staffelprijs, dan geldt die en wordt er niets bovenop gedaan. Een klantgroep-korting blijft gewoon gelden.</p>
        <p>• Wijzigingen werken binnen een halve minuut door.</p>
      </div>
    </div>
  );
}
