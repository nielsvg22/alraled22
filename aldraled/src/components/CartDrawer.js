import React from 'react';
import { useCart } from '../lib/CartContext';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const CartDrawer = () => {
  const { t } = useTranslation();
  const { cartItems, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, cartTotal } = useCart();

  return (
    <>
      <div
        className={`fixed inset-0 bg-secondary/80 backdrop-blur-sm z-[100] transition-opacity duration-500 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsCartOpen(false)}
      />
      <div className={`fixed top-0 right-0 h-full w-full md:w-[500px] bg-white z-[101] shadow-2xl transition-transform duration-500 ease-out transform ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-8 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-3xl font-black text-secondary uppercase italic tracking-tighter">
              {t('cart.titlePrefix')}<span className="text-primary">{t('cart.titleHighlight')}</span>
            </h2>
            <button onClick={() => setIsCartOpen(false)} className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-2xl hover:bg-secondary hover:text-white transition-all">
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                <div className="text-8xl opacity-10">🛒</div>
                <p className="text-xl font-black text-secondary uppercase italic opacity-30">{t('cart.emptyTitle')}</p>
                <button onClick={() => setIsCartOpen(false)} className="bg-secondary text-white px-8 py-4 rounded-full font-black uppercase italic">
                  {t('cart.startShopping')}
                </button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="flex gap-6 group">
                  <div className="w-24 h-24 bg-gray-50 rounded-2xl overflow-hidden shrink-0">
                    <img
                      src={item.imageUrl || 'https://via.placeholder.com/150'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between">
                      <h4 className="font-black text-secondary uppercase italic leading-none">{item.name}</h4>
                      <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">✕</button>
                    </div>
                    <p className="text-primary font-black italic">€ {item.price}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border-2 border-gray-100 rounded-xl overflow-hidden">
                        <button onClick={() => updateQuantity(item.id, -1)} className="px-3 py-1 hover:bg-gray-100 font-bold">-</button>
                        <span className="px-3 font-black text-secondary">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="px-3 py-1 hover:bg-gray-100 font-bold">+</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {cartItems.length > 0 && (
            <div className="p-8 bg-gray-50 space-y-6">
              <div className="flex justify-between items-end">
                <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">{t('cart.subtotal')}</span>
                <span className="text-4xl font-black text-secondary italic tracking-tighter">€ {cartTotal.toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-tight">
                {t('cart.shippingNote')}
              </p>
              <Link
                to="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="block w-full bg-primary text-white text-center py-6 rounded-[2rem] font-black text-xl uppercase italic shadow-2xl hover:scale-[1.02] transition-all"
              >
                {t('cart.checkout')}
              </Link>
              <button onClick={() => setIsCartOpen(false)} className="w-full text-center text-xs font-black text-secondary uppercase tracking-widest hover:underline">
                {t('cart.continueShopping')}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
