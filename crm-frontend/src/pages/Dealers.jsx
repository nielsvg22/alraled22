import React, { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';

function normalizeText(v) {
  return String(v || '').trim();
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function Dealers() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [showNew, setShowNew] = useState(false);
  const [newDealer, setNewDealer] = useState({
    name: '',
    brand: '',
    website: '',
    phone: '',
    street: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    lat: '',
    lon: '',
  });

  const [query, setQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const canAdd = useMemo(() => {
    return normalizeText(newDealer.name) &&
           normalizeText(newDealer.street) &&
           normalizeText(newDealer.postalCode) &&
           normalizeText(newDealer.city) &&
           normalizeText(newDealer.lat) &&
           normalizeText(newDealer.lon);
  }, [newDealer]);

  useEffect(() => {
    setLoading(true);
    api.get('/content/dealers')
      .then((res) => setItems(Array.isArray(res.data) ? res.data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = normalizeText(query);
    if (!q || q.length < 3) {
      setSearchResults([]);
      return;
    }

    let alive = true;
    setSearchLoading(true);
    const t = setTimeout(() => {
      api.get('/geo/search', { params: { q, limit: 6 } })
        .then((res) => {
          if (!alive) return;
          setSearchResults(Array.isArray(res.data) ? res.data : []);
        })
        .catch(() => { if (alive) setSearchResults([]); })
        .finally(() => { if (alive) setSearchLoading(false); });
    }, 250);

    return () => { alive = false; clearTimeout(t); };
  }, [query]);

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/content/dealers', items);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
    finally { setSaving(false); }
  };

  const add = () => {
    const street = normalizeText(newDealer.street);
    const houseNumber = normalizeText(newDealer.houseNumber);
    const address = houseNumber ? `${street} ${houseNumber}` : street;

    const item = {
      id: crypto.randomUUID(),
      name: normalizeText(newDealer.name),
      brand: normalizeText(newDealer.brand),
      website: normalizeText(newDealer.website),
      phone: normalizeText(newDealer.phone),
      address,
      street,
      houseNumber,
      postalCode: normalizeText(newDealer.postalCode),
      city: normalizeText(newDealer.city),
      lat: toNumber(newDealer.lat),
      lon: toNumber(newDealer.lon),
    };

    setItems((prev) => [item, ...prev]);
    setNewDealer({ name: '', brand: '', website: '', phone: '', street: '', houseNumber: '', postalCode: '', city: '', lat: '', lon: '' });
    setQuery('');
    setSearchResults([]);
    setShowNew(false);
  };

  const remove = (id) => setItems((prev) => prev.filter((x) => x.id !== id));

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Verkooppunten</h1>
          <p className="text-sm text-gray-400 font-medium mt-1">Beheer locaties waar jouw producten te koop zijn.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-200"
          >
            <Plus className="w-4 h-4" /> Nieuw
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${saved ? 'bg-green-600 text-white' : 'bg-gray-900 text-white hover:bg-gray-700'} disabled:opacity-60`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Opslaan...' : saved ? 'Opgeslagen!' : 'Opslaan'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Laden…</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
            <p className="text-sm font-black text-gray-800">Locaties ({items.length})</p>
            <p className="text-xs text-gray-400">Deze lijst komt op de kaartpagina van de storefront.</p>
          </div>
          {items.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              Nog geen locaties. Klik op Nieuw om er één toe te voegen.
            </div>
          ) : (
            <div className="divide-y">
              {items.map((x) => (
                <div key={x.id} className="p-5 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-black text-gray-900 truncate">{x.name}</p>
                    {x.brand && <p className="text-xs text-primary font-semibold mt-0.5">{x.brand}</p>}
                    <p className="text-sm text-gray-500 mt-0.5">
                      {x.street || x.address}
                      {x.houseNumber && ` ${x.houseNumber}`}
                      {x.postalCode && `, ${x.postalCode}`}
                      {x.city && ` ${x.city}`}
                    </p>
                    <div className="text-xs text-gray-400 mt-1 flex flex-wrap gap-3">
                      <span>lat {x.lat}</span>
                      <span>lon {x.lon}</span>
                      {x.phone ? <span>{x.phone}</span> : null}
                      {x.website ? <span className="truncate max-w-[420px]">{x.website}</span> : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(x.id)}
                    className="p-2 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                    title="Verwijderen"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowNew(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
              <p className="font-black text-gray-900">Nieuw verkooppunt</p>
              <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Naam</p>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    value={newDealer.name}
                    onChange={(e) => setNewDealer((p) => ({ ...p, name: e.target.value }))}
                    placeholder="bv. Mastermate Apeldoorn"
                  />
                </div>
                <div>
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Merk / Groep</p>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    value={newDealer.brand}
                    onChange={(e) => setNewDealer((p) => ({ ...p, brand: e.target.value }))}
                    placeholder="bv. Mastermate, AIC Visser, RECO"
                  />
                </div>
                <div>
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Telefoon</p>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    value={newDealer.phone}
                    onChange={(e) => setNewDealer((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="bv. 085-0021 606"
                  />
                </div>
                <div>
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Website</p>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    value={newDealer.website}
                    onChange={(e) => setNewDealer((p) => ({ ...p, website: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Straat</p>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    value={newDealer.street}
                    onChange={(e) => setNewDealer((p) => ({ ...p, street: e.target.value }))}
                    placeholder="bv. Paramariboweg"
                  />
                </div>
                <div>
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Huisnummer</p>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    value={newDealer.houseNumber}
                    onChange={(e) => setNewDealer((p) => ({ ...p, houseNumber: e.target.value }))}
                    placeholder="bv. 99"
                  />
                </div>
                <div>
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Postcode</p>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    value={newDealer.postalCode}
                    onChange={(e) => setNewDealer((p) => ({ ...p, postalCode: e.target.value }))}
                    placeholder="bv. 7333 PA"
                  />
                </div>
                <div>
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Plaats</p>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    value={newDealer.city}
                    onChange={(e) => setNewDealer((p) => ({ ...p, city: e.target.value }))}
                    placeholder="bv. Apeldoorn"
                  />
                </div>
              </div>

              <div>
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Zoek adres (vult straat, huisnummer, postcode, plaats, lat, lon in)</p>
                <div className="relative">
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Typ een plaats of adres..."
                  />
                  {searchLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-300" />
                    </div>
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-2 rounded-xl border border-gray-200 overflow-hidden">
                    {searchResults.map((r) => (
                      <button
                        key={r.place_id}
                        type="button"
                        onClick={() => {
                          const addr = r.address || {};
                          setNewDealer((p) => ({
                            ...p,
                            street: addr.road || addr.street || '',
                            houseNumber: addr.house_number || addr.number || '',
                            postalCode: addr.postcode || '',
                            city: addr.city || addr.town || addr.village || '',
                            lat: String(r.lat),
                            lon: String(r.lon),
                          }));
                          setQuery(r.display_name);
                          setSearchResults([]);
                        }}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
                      >
                        {r.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Latitude</p>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    value={newDealer.lat}
                    onChange={(e) => setNewDealer((p) => ({ ...p, lat: e.target.value }))}
                  />
                </div>
                <div>
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Longitude</p>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    value={newDealer.lon}
                    onChange={(e) => setNewDealer((p) => ({ ...p, lon: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNew(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-600 hover:bg-gray-50"
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={add}
                disabled={!canAdd}
                className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
              >
                Toevoegen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}