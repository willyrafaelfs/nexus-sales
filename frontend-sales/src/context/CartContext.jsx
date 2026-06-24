import { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

// Ambil user yang sedang login dari localStorage (key sama dengan alur login)
const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
};

// Key keranjang DI-NAMESPACE per user agar tidak bocor antar-akun / ke kondisi tamu
const cartKeyFor = (user) => (user && user.id ? `nexus_cart:${user.id}` : 'nexus_cart:guest');

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    // Bersihkan key global lama (legacy) supaya data lama tidak bocor
    localStorage.removeItem('nexus_cart');
    const saved = localStorage.getItem(cartKeyFor(getCurrentUser()));
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Sinkron ke localStorage milik user yang sedang aktif
  useEffect(() => {
    localStorage.setItem(cartKeyFor(getCurrentUser()), JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) => prev.map(item => {
      if (item.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Dipanggil saat LOGOUT: hapus keranjang user ini dari localStorage + reset memori,
  // sehingga kondisi tanpa-login / login akun lain mulai dari keranjang kosong.
  const clearCartForLogout = () => {
    localStorage.removeItem(cartKeyFor(getCurrentUser()));
    setCart([]);
  };

  return (
    <CartContext.Provider value={{ cart, setCart, isCartOpen, setIsCartOpen, addToCart, updateQuantity, removeFromCart, clearCart, clearCartForLogout }}>
      {children}
    </CartContext.Provider>
  );
};
