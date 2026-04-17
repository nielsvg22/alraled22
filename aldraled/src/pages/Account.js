import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import api from '../lib/api';

const statusLabel = {
  PENDING: 'In behandeling',
  PROCESSING: 'Verwerking',
  SHIPPED: 'Verzonden',
  DELIVERED: 'Afgeleverd',
  CANCELLED: 'Geannuleerd',
};

const statusColor = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  SHIPPED: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const Account = () => {
  const { user, logout, loading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) { navigate('/login'); }
    if (user) {
      api.get('/orders')
        .then((res) => { setOrders(res.data || []); setOrdersLoading(false); })
        .catch(() => setOrdersLoading(false));
    }
  }, [user, loading, navigate]);

  if (loading || (user && ordersLoading)) {
    return <div className="min-h-screen flex items-center justify-center font-black italic text-secondary text-2xl uppercase tracking-tighter animate-pulse">Checking Account...</div>;
  }

  if (!user) return null;

  return (
    <div className="bg-white min-h-screen">
      <section className="bg-secondary pt-32 pb-16 px-4 md:px-8 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full -ml-72 -mb-72 blur-[100px]"></div>
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <h1 className="text-6xl md:text-[6vw] font-black text-white leading-none uppercase italic tracking-tighter">
              DASH<span className="text-primary">BOARD</span>
            </h1>
            <p className="text-white/40 font-bold uppercase tracking-[0.4em] text-xs mt-4">Welkom, {user.name || user.email}</p>
          </div>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-3 rounded-full font-black uppercase italic transition-all"
          >
            Log Out
          </button>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">

          {/* User Info Sidebar */}
          <div className="space-y-8">
            <div className="bg-gray-50 rounded-[3rem] p-10 space-y-6">
              <h4 className="text-2xl font-black text-secondary uppercase italic tracking-tighter">Profiel</h4>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Naam</p>
                  <p className="text-secondary font-black uppercase italic">{user.name || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">E-mailadres</p>
                  <p className="text-secondary font-black uppercase italic">{user.email}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Rol</p>
                  <p className="text-secondary font-black uppercase italic">{user.role}</p>
                </div>
              </div>
            </div>

            <div className="bg-primary p-10 rounded-[3rem] text-white space-y-4 shadow-2xl">
              <h4 className="text-2xl font-black uppercase italic leading-none">VIP SUPPORT</h4>
              <p className="font-medium opacity-80">Als geregistreerde klant geniet u van voorrang bij technische vragen.</p>
              <button className="w-full bg-white text-primary py-4 rounded-xl font-black uppercase italic hover:bg-secondary hover:text-white transition-all shadow-xl">
                OPEN TICKET
              </button>
            </div>

            <div className="bg-gray-50 rounded-[3rem] p-10 space-y-4">
              <h4 className="text-2xl font-black text-secondary uppercase italic tracking-tighter">Retour</h4>
              <p className="text-gray-500 font-medium">Vraag eenvoudig een retour aan voor een bestelling.</p>
              <Link
                to="/retouren"
                className="inline-flex items-center justify-center w-full bg-secondary text-white py-4 rounded-xl font-black uppercase italic hover:bg-primary transition-all shadow-sm"
              >
                Retour aanvragen
              </Link>
            </div>
          </div>

          {/* Orders Section */}
          <div className="lg:col-span-2 space-y-10">
            <div className="flex justify-between items-center border-b border-gray-100 pb-6">
              <h3 className="text-4xl font-black text-secondary uppercase italic tracking-tighter">Bestellingen</h3>
              <span className="bg-gray-100 px-4 py-1 rounded-full text-gray-400 font-bold uppercase text-[10px]">
                Totaal: {orders.length}
              </span>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-32 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
                <p className="text-2xl text-gray-300 font-black uppercase italic">Geen bestellingen gevonden</p>
                <button onClick={() => navigate('/producten')} className="mt-6 text-primary font-black uppercase italic hover:underline">
                  Start met winkelen →
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white border-2 border-gray-50 rounded-[2.5rem] p-8 md:p-10 hover:border-primary/20 transition-all group shadow-sm hover:shadow-xl">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="flex gap-6 items-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-primary font-black italic text-lg shrink-0">
                          #{order.id.slice(0, 6)}
                        </div>
                        <div className="space-y-1">
                          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                            {new Date(order.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide ${statusColor[order.status] || 'bg-gray-100 text-gray-600'}`}>
                            {statusLabel[order.status] || order.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-black text-secondary italic leading-none">€{order.total.toFixed(2)}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">{order.items?.length || 0} artikel(en)</p>
                      </div>
                    </div>

                    {order.items && order.items.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-gray-50 flex flex-wrap gap-3">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                            {item.product?.imageUrl && (
                              <img src={item.product.imageUrl} alt={item.product.name} className="w-8 h-8 rounded-lg object-cover" />
                            )}
                            <span className="text-xs font-black text-secondary uppercase italic">{item.product?.name}</span>
                            <span className="text-[10px] text-gray-400 font-bold">x{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      <Link
                        to={`/retouren?orderId=${order.id}`}
                        className="inline-flex items-center justify-center bg-gray-50 border border-gray-100 text-secondary px-6 py-3 rounded-full font-black uppercase italic hover:border-primary/30 hover:bg-primary/5 transition-all"
                      >
                        Retour aanvragen
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Account;
