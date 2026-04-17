import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { 
  Ticket, Plus, Trash2, Edit2, Save, X, 
  CheckCircle, AlertCircle, Calendar, Hash
} from 'lucide-react';

const iCls = 'w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all bg-white border-gray-200';

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}

export default function DiscountCodes() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [isNew, setIsNew] = useState(false);

  const loadCodes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/discounts');
      setCodes(res.data);
    } catch (err) {
      console.error('Failed to load discount codes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCodes();
  }, []);

  const handleSave = async () => {
    try {
      if (isNew) {
        await api.post('/discounts', editing);
      } else {
        await api.put(`/discounts/${editing.id}`, editing);
      }
      setEditing(null);
      setIsNew(false);
      loadCodes();
    } catch (err) {
      alert('Opslaan mislukt');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Weet je zeker dat je deze kortingscode wilt verwijderen?')) return;
    try {
      await api.delete(`/discounts/${id}`);
      loadCodes();
    } catch (err) {
      alert('Verwijderen mislukt');
    }
  };

  const handleToggleActive = async (code) => {
    try {
      await api.put(`/discounts/${code.id}`, { active: code.active ? 0 : 1 });
      loadCodes();
    } catch (err) {
      alert('Status wijzigen mislukt');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Kortingscodes</h1>
          <p className="text-sm text-gray-400 font-medium mt-1">Beheer promoties en kortingen voor je klanten.</p>
        </div>
        <button 
          onClick={() => {
            setEditing({ code: '', type: 'PERCENTAGE', value: 0, minOrderAmount: 0, active: 1 });
            setIsNew(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200"
        >
          <Plus size={16} /> Nieuwe Code
        </button>
      </div>

      {editing && (
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-black text-gray-900">{isNew ? 'Nieuwe Kortingscode' : 'Code Bewerken'}</h3>
            <button onClick={() => { setEditing(null); setIsNew(false); }} className="p-2 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Field label="Code (bv. WELKOM10)">
              <input 
                className={iCls} 
                value={editing.code} 
                onChange={e => setEditing({ ...editing, code: e.target.value.toUpperCase() })} 
                placeholder="PROMO2024"
              />
            </Field>
            <Field label="Type">
              <select 
                className={iCls} 
                value={editing.type} 
                onChange={e => setEditing({ ...editing, type: e.target.value })}
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Vast Bedrag (€)</option>
              </select>
            </Field>
            <Field label="Waarde">
              <input 
                type="number"
                className={iCls} 
                value={editing.value} 
                onChange={e => setEditing({ ...editing, value: parseFloat(e.target.value) })} 
              />
            </Field>
            <Field label="Min. Bestelbedrag (€)">
              <input 
                type="number"
                className={iCls} 
                value={editing.minOrderAmount} 
                onChange={e => setEditing({ ...editing, minOrderAmount: parseFloat(e.target.value) })} 
              />
            </Field>
            <Field label="Startdatum">
              <input 
                type="date"
                className={iCls} 
                value={editing.startDate?.split('T')[0] || ''} 
                onChange={e => setEditing({ ...editing, startDate: e.target.value })} 
              />
            </Field>
            <Field label="Einddatum">
              <input 
                type="date"
                className={iCls} 
                value={editing.endDate?.split('T')[0] || ''} 
                onChange={e => setEditing({ ...editing, endDate: e.target.value })} 
              />
            </Field>
            <Field label="Gebruikslimiet (leeg = onbeperkt)">
              <input 
                type="number"
                className={iCls} 
                value={editing.usageLimit || ''} 
                onChange={e => setEditing({ ...editing, usageLimit: parseInt(e.target.value) || undefined })} 
              />
            </Field>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
            <button 
              onClick={() => { setEditing(null); setIsNew(false); }}
              className="px-6 py-2.5 rounded-xl text-xs font-black text-gray-400 hover:text-gray-600 transition-all"
            >
              Annuleren
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              <Save size={16} /> Code Opslaan
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Kortingscode</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Waarde</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Geldigheid</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Gebruik</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acties</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {codes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400 font-medium">
                  Geen kortingscodes gevonden.
                </td>
              </tr>
            ) : codes.map(code => (
              <tr key={code.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center">
                      <Ticket size={16} />
                    </div>
                    <span className="text-sm font-black text-gray-900">{code.code}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-bold text-gray-700">
                    {code.type === 'PERCENTAGE' ? `${code.value}%` : `€${code.value}`}
                  </span>
                  {code.minOrderAmount > 0 && (
                    <p className="text-[10px] text-gray-400">Min. €{code.minOrderAmount}</p>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                      <Calendar size={12} className="text-gray-300" />
                      {code.startDate ? new Date(code.startDate).toLocaleDateString('nl-NL') : 'Altijd'} - {code.endDate ? new Date(code.endDate).toLocaleDateString('nl-NL') : 'Altijd'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                    <Hash size={12} className="text-gray-300" />
                    {code.usageCount} / {code.usageLimit || '∞'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => handleToggleActive(code)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${code.active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}
                  >
                    {code.active ? <CheckCircle size={10} /> : <X size={10} />}
                    {code.active ? 'Actief' : 'Pauze'}
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => { setEditing(code); setIsNew(false); }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(code.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
