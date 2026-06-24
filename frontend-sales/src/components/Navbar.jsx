import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function Navbar() {
  const userString = localStorage.getItem('user');
  const currentUser = userString ? JSON.parse(userString) : null;
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { cart, setIsCartOpen, clearCartForLogout } = useCart();

  const handleLogout = () => {
    // Bersihkan keranjang user ini DULU (perlu baca user id sebelum dihapus)
    clearCartForLogout();
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="bg-gray-950 border-b border-gray-800 px-8 py-4 relative z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl font-bold tracking-widest text-white hover:opacity-80 transition-opacity">
            NEXUS <span className="text-cyan-500">SYS</span>
          </Link>
        </div>
        
        <div className="flex gap-6 items-center">
          {/* Cart Icon */}
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative text-gray-400 hover:text-cyan-400 transition-colors p-2"
            aria-label="Open Cart"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            {totalCartItems > 0 && (
              <span className="absolute top-0 right-0 bg-cyan-500 text-gray-950 text-[10px] font-bold px-1.5 py-0.5 rounded-full transform translate-x-1/4 -translate-y-1/4">
                {totalCartItems}
              </span>
            )}
          </button>

          {/* Logika Tombol Profil Dropdown */}
          {currentUser ? (
            <div className="relative border-l border-gray-800 pl-6 ml-2">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 bg-gray-900 border border-gray-800 hover:border-cyan-500/50 px-3 py-1.5 rounded-full transition-all group"
              >
                {/* Lingkaran Inisial Nama */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center text-white text-sm font-bold shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-gray-200 group-hover:text-cyan-400 transition-colors hidden sm:block">
                  {currentUser.name}
                </span>
                {/* Ikon Panah */}
                <svg className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>

              {/* Kotak Menu Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden py-2 animate-fade-in">
                  <div className="px-4 py-3 border-b border-gray-800/50 mb-2">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Signed in as</p>
                    <p className="text-sm font-bold text-cyan-400 truncate">{currentUser.email}</p>
                    <p className="text-xs text-gray-400 mt-1 capitalize bg-gray-800 inline-block px-2 py-0.5 rounded-md">Role: {currentUser.role}</p>
                  </div>
                  
                  {/* Menu Navigasi Sesuai Role */}
                  {currentUser.role === 'admin' && (
                    <Link to="/admin" className="block px-4 py-2.5 text-sm font-semibold text-gray-300 hover:bg-gray-800 hover:text-cyan-400 transition-colors">
                      Command Center
                    </Link>
                  )}
                  {currentUser.role === 'seller' && (
                    <Link to="/seller" className="block px-4 py-2.5 text-sm font-semibold text-gray-300 hover:bg-gray-800 hover:text-cyan-400 transition-colors">
                      Dashboard Penjual
                    </Link>
                  )}
                  {currentUser.role === 'customer' && (
                    <Link to="/create-shop" className="block px-4 py-2.5 text-sm font-semibold text-gray-300 hover:bg-gray-800 hover:text-cyan-400 transition-colors">
                      Buka Toko
                    </Link>
                  )}
                  
                  <Link to="/orders" className="block px-4 py-2.5 text-sm font-semibold text-gray-300 hover:bg-gray-800 hover:text-cyan-400 transition-colors">
                    Pesanan Saya
                  </Link>

                  <div className="border-t border-gray-800/50 mt-2 mb-2"></div>
                  
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors flex items-center gap-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-3">
              <Link to="/login" className="text-gray-300 hover:text-cyan-400 font-semibold px-4 py-2 text-sm uppercase tracking-wider transition-colors">
                Login
              </Link>
              <Link to="/register" className="bg-cyan-600/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-600 hover:text-white px-5 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(34,211,238,0.1)] hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                Daftar
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
