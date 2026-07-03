import React, { useState } from 'react';
import api from '../lib/api';
import { Upload, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';

export default function Import() {
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleImport = async () => {
    setStatus('running');
    setError('');
    setResult(null);
    try {
      const res = await api.post('/import/wordpress');
      setResult(res.data);
      setStatus(res.data.status === 'completed' ? 'done' : 'error');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setStatus('error');
    }
  };

  const btnBase = 'flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50';

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Importeer Producten</h1>
        <p className="text-sm text-gray-400 mt-1">
          Importeer producten van de oude WordPress website naar de nieuwe webshop.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50 flex items-center gap-2">
          <Upload className="w-4 h-4 text-gray-400" />
          <h3 className="font-black text-gray-600 text-xs uppercase tracking-widest">WordPress Import</h3>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs text-blue-700 font-bold mb-1">Importeer van alra-led.com</p>
            <p className="text-[10px] text-blue-600 leading-relaxed">
              Het script scrapet alle producten van de oude WordPress website via{' '}
              <a href="https://alra-led.com/webshop/" target="_blank" rel="noopener noreferrer"
                className="underline font-bold inline-flex items-center gap-0.5">
                alra-led.com/webshop <ExternalLink size={10} />
              </a>
              {' '}en importeert ze in de database. Dit kan 30-60 seconden duren.
            </p>
          </div>

          <button
            onClick={handleImport}
            disabled={status === 'running'}
            className={`${btnBase} ${status === 'running' ? 'bg-gray-400 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            {status === 'running' ? (
              <><Loader2 size={16} className="animate-spin" /> Bezig met importeren...</>
            ) : (
              <><Upload size={16} /> Start Import</>
            )}
          </button>
        </div>
      </div>

      {status === 'running' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-3">
          <Loader2 size={20} className="animate-spin text-blue-600" />
          <span className="text-sm text-gray-600">Producten worden opgehaald en geimporteerd...</span>
        </div>
      )}

      {result && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className={`px-6 py-4 border-b flex items-center gap-2 ${result.status === 'completed' ? 'bg-green-50' : 'bg-red-50'}`}>
            {result.status === 'completed'
              ? <CheckCircle className="w-4 h-4 text-green-600" />
              : <AlertCircle className="w-4 h-4 text-red-600" />
            }
            <h3 className={`font-black text-xs uppercase tracking-widest ${result.status === 'completed' ? 'text-green-700' : 'text-red-700'}`}>
              {result.status === 'completed' ? 'Import Voltooid' : 'Import Mislukt'}
            </h3>
          </div>

          <div className="p-6 space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Producten gevonden" value={result.totalUrlsFound} />
              <Stat label="Uitgelezen" value={result.scraped} />
              <Stat label="Geimporteerd" value={result.imported} color="text-green-600" />
              <Stat label="Mislukt" value={result.failed} color="text-red-600" />
            </div>

            {result.scrapeErrors?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Scrape Fouten</p>
                <ul className="space-y-1">
                  {result.scrapeErrors.map((err, i) => (
                    <li key={i} className="text-xs text-red-500 flex items-start gap-1">
                      <span>•</span> {err}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.importErrors?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Import Fouten</p>
                <ul className="space-y-1">
                  {result.importErrors.map((err, i) => (
                    <li key={i} className="text-xs text-red-500 flex items-start gap-1">
                      <span>•</span> {err}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2">
          <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color = 'text-gray-900' }) {
  return (
    <div className="bg-gray-50 rounded-xl px-4 py-3">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      <p className={`text-2xl font-black mt-0.5 ${color}`}>{value ?? '-'}</p>
    </div>
  );
}
