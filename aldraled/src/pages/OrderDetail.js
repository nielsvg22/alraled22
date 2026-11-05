import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../lib/api';
import { ROUTES } from '../lib/routes';
import { formatPrice, getImageSrc } from '../lib/productHelpers';

const STATUS_LABEL = { PENDING: 'In behandeling', PROCESSING: 'Verwerking', SHIPPED: 'Verzonden', DELIVERED: 'Afgeleverd', CANCELLED: 'Geannuleerd' };
const STATUS_COLOR = {
  PENDING: 'bg-yellow-100 text-yellow-700', PROCESSING: 'bg-blue-100 text-blue-700', SHIPPED: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700', CANCELLED: 'bg-red-100 text-red-700',
};
const STEPS = [['PENDING', 'Besteld'], ['PROCESSING', 'In verwerking'], ['SHIPPED', 'Verzonden'], ['DELIVERED', 'Afgeleverd']];
const COUNTRY = { NL: 'Nederland', BE: 'België', DE: 'Duitsland', FR: 'Frankrijk', LU: 'Luxemburg' };

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(res => setOrder(res.data))
      .catch(err => setError(err?.response?.status === 403 ? 'Deze bestelling hoort niet bij jouw account.' : 'Bestelling niet gevonden of je bent niet ingelogd.'))
      .finally(() => setLoading(false));
  }, [id]);

  const downloadInvoice = async () => {
    setDownloading(true);
    try {
      const res = await api.get(`/orders/${id}/invoice`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = `factuur-${id.slice(0, 8)}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { alert('Factuur downloaden is niet gelukt. Probeer het later opnieuw.'); }
    finally { setDownloading(false); }
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-gray-400 animate-pulse">Laden...</div>;
  if (error || !order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-gray-500">{error || 'Bestelling niet gevonden.'}</p>
        <Link to={ROUTES.account} className="text-primary font-bold hover:underline">← Terug naar mijn account</Link>
      </div>
    );
  }

  const items = order.items || [];
  const subtotal = items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 0), 0);
  const discount = Number(order.discountAmount || 0);
  const shipping = Number(order.shippingCost || 0);
  const base = Math.max(0, subtotal - discount + shipping);
  const reverse = !!order.vatReverse;
  const vat = reverse ? 0 : base * 0.21;
  const stepIndex = STEPS.findIndex(([k]) => k === order.status);
  const cancelled = order.status === 'CANCELLED';
  const addressLines = [order.shippingName, order.shippingCompany, order.shippingAddress, [order.shippingPostcode, order.shippingCity].filter(Boolean).join(' '), COUNTRY[order.shippingCountry] || order.shippingCountry].filter(Boolean);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      <Link to={ROUTES.account} className="text-sm font-bold text-gray-500 hover:text-secondary">← Mijn bestellingen</Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Bestelling</p>
          <h1 className="text-3xl md:text-4xl font-black text-secondary">#{order.id.slice(0, 8).toUpperCase()}</h1>
          <p className="text-sm text-gray-500 mt-1">{new Date(order.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-wide ${STATUS_COLOR[order.status] || 'bg-gray-100 text-gray-600'}`}>
          {STATUS_LABEL[order.status] || order.status}
        </span>
      </div>

      {/* Status */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        {cancelled ? (
          <p className="font-bold text-red-600">Deze bestelling is geannuleerd.</p>
        ) : (
          <ol className="grid grid-cols-4 gap-2">
            {STEPS.map(([key, label], i) => {
              const done = i <= stepIndex;
              return (
                <li key={key} className="text-center">
                  <div className={`mx-auto w-9 h-9 rounded-full flex items-center justify-center text-sm font-black ${done ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>{done ? '✓' : i + 1}</div>
                  <p className={`mt-2 text-[11px] sm:text-xs font-bold ${done ? 'text-secondary' : 'text-gray-400'}`}>{label}</p>
                </li>
              );
            })}
          </ol>
        )}
        {(order.trackingNumber || order.trackingUrl) && (
          <p className="mt-5 text-sm text-gray-600 border-t border-gray-100 pt-4">
            Track &amp; trace: {order.trackingUrl
              ? <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:underline">{order.trackingNumber || 'Volg je pakket'}</a>
              : <span className="font-bold">{order.trackingNumber}</span>}
          </p>
        )}
      </div>

      {/* Producten */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <h2 className="px-6 py-4 border-b border-gray-100 font-black text-secondary">Producten</h2>
        <ul className="divide-y divide-gray-50">
          {items.map(item => (
            <li key={item.id} className="flex items-center gap-4 px-6 py-4">
              <div className="w-14 h-14 rounded-xl bg-gray-50 overflow-hidden shrink-0">
                {item.product && <img src={getImageSrc(item.product)} alt={item.product.name} className="w-full h-full object-contain p-1" />}
              </div>
              <div className="flex-1 min-w-0">
                {item.product?.id ? <Link to={ROUTES.product(item.product.id)} className="font-bold text-secondary hover:text-primary text-sm leading-snug">{item.product?.name}</Link> : <p className="font-bold text-secondary text-sm">{item.product?.name || 'Product'}</p>}
                <p className="text-xs text-gray-400 mt-0.5">{item.quantity} × {formatPrice(item.price)} (excl. btw)</p>
              </div>
              <p className="font-black text-secondary text-sm shrink-0">{formatPrice((item.price || 0) * (item.quantity || 0))}</p>
            </li>
          ))}
        </ul>
        <div className="px-6 py-5 bg-gray-50 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600"><span>Subtotaal (excl. btw)</span><span>{formatPrice(subtotal)}</span></div>
          {discount > 0 && <div className="flex justify-between text-emerald-600"><span>Korting</span><span>-{formatPrice(discount)}</span></div>}
          <div className="flex justify-between text-gray-600"><span>Verzending{order.shippingMethod ? '' : ''}</span><span>{shipping > 0 ? formatPrice(shipping) : 'Gratis'}</span></div>
          <div className="flex justify-between text-gray-600"><span>{reverse ? 'BTW verlegd (0%)' : 'BTW (21%)'}</span><span>{formatPrice(vat)}</span></div>
          <div className="flex justify-between text-lg font-black text-secondary border-t border-gray-200 pt-3"><span>Totaal</span><span>{formatPrice(order.total)}</span></div>
          {reverse && order.vatNumber && <p className="text-xs text-gray-400">BTW verlegd (intracommunautaire levering) — BTW-nummer: {order.vatNumber}</p>}
        </div>
      </div>

      {/* Adres + contact */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h2 className="font-black text-secondary mb-3">Verzendadres</h2>
          {addressLines.length ? addressLines.map((l, i) => <p key={i} className="text-sm text-gray-600">{l}</p>) : <p className="text-sm text-gray-400">Niet beschikbaar</p>}
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h2 className="font-black text-secondary mb-3">Contact &amp; verzending</h2>
          {order.customerEmail || order.user?.email ? <p className="text-sm text-gray-600">{order.customerEmail || order.user?.email}</p> : null}
          {order.shippingPhone && <p className="text-sm text-gray-600">{order.shippingPhone}</p>}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={downloadInvoice} disabled={downloading} className="px-6 py-3 rounded-full bg-secondary text-white text-sm font-bold hover:bg-primary transition-colors disabled:opacity-50">
          {downloading ? 'Bezig…' : 'Factuur downloaden (pdf)'}
        </button>
        <Link to={`${ROUTES.returns}?orderId=${order.id}`} className="px-6 py-3 rounded-full border border-gray-200 text-secondary text-sm font-bold hover:border-primary hover:text-primary transition-colors">Retour aanvragen</Link>
      </div>
    </div>
  );
};

export default OrderDetail;
