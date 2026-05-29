import React, { createContext, useState, useContext, useEffect } from 'react';
import analytics from './analytics';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [guestId, setGuestId] = useState(null);

  // Laad cart en guest_id uit localStorage bij opstarten
  useEffect(() => {
    const savedCart = localStorage.getItem('alra_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Fout bij laden cart", e);
      }
    }

    let savedGuestId = localStorage.getItem('alra_guest_id');
    if (!savedGuestId) {
      savedGuestId = 'guest_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      localStorage.setItem('alra_guest_id', savedGuestId);
    }
    setGuestId(savedGuestId);
  }, []);

  // Sla cart op bij wijzigingen
  useEffect(() => {
    localStorage.setItem('alra_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find(item => item.id === product.id);
      const newQty = existingItem ? existingItem.quantity + 1 : 1;
      const price = product.attributes?.price || product.price || 0;
      analytics.trackAddToCart(product.id, price, newQty);
      if (existingItem) {
        return prevItems.map(item => 
          item.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) => {
      const item = prevItems.find(i => i.id === productId);
      if (item) {
        const price = item.attributes?.price || item.price || 0;
        analytics.trackRemoveFromCart(productId, price, item.quantity);
      }
      return prevItems.filter(item => item.id !== productId);
    });
  };

  const updateQuantity = (productId, delta) => {
    setCartItems((prevItems) => prevItems.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const clearCart = () => setCartItems([]);

  const cartTotal = cartItems.reduce((total, item) => {
    const price = item.attributes?.price || item.price || 0;
    return total + (price * item.quantity);
  }, 0);

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      isCartOpen, 
      setIsCartOpen,
      cartTotal,
      cartCount,
      guestId
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
