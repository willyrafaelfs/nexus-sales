import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Shop from './pages/Shop';
import Admin from './pages/Admin';
import Login from './pages/Login';
import SellerDashboard from './pages/seller/SellerDashboard';

// --- GEMBOK KEAMANAN: Hanya Admin ---
// Jika bukan admin, tendang ke Beranda (bukan login, karena mungkin sudah login sebagai customer).
const ProtectedAdminRoute = ({ children }) => {
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

// --- GEMBOK KEAMANAN: Hanya Customer (Seller) ---
// Admin TIDAK BOLEH mengakses fitur toko (model bisnis C2C).
// Jika belum login → tendang ke /login. Jika admin → tendang ke /.
const ProtectedCustomerRoute = ({ children }) => {
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/" replace />;
  if (user.role !== 'customer') return <Navigate to="/" replace />;
  return children;
};

function App() {
  const userString = localStorage.getItem('user');
  const currentUser = userString ? JSON.parse(userString) : null;
  
  // State baru untuk mengontrol menu dropdown profil
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login'; 
  };

  return (
    <BrowserRouter>
      {/* Navbar Global yang Diperbarui */}
      <nav className="bg-gray-950 border-b border-gray-800 px-8 py-4 relative z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="text-xl font-bold tracking-widest text-white">
            NEXUS <span className="text-cyan-500">SYS</span>
          </div>
          
          <div className="flex gap-6 items-center">
            <Link to="/" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm font-semibold uppercase tracking-wider">
              Storefront
            </Link>
            
            {currentUser?.role === 'admin' && (
              <Link to="/admin" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm font-semibold uppercase tracking-wider">
                Command Center
              </Link>
            )}

            {currentUser?.role === 'customer' && (
              <Link to="/seller" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm font-semibold uppercase tracking-wider">
                Seller Dashboard
              </Link>
            )}

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
                  <span className="text-sm font-semibold text-gray-200 group-hover:text-cyan-400 transition-colors">
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
                    
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors flex items-center gap-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                      Terminate Session
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="bg-cyan-600/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-600 hover:text-white px-5 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(34,211,238,0.1)] hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] ml-4">
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Pengatur Jalan (Router) */}
      <Routes>
        <Route path="/" element={<Shop />} />
        <Route path="/login" element={<Login />} />
        
        {/* Rute Admin yang dibungkus dengan Gembok Keamanan */}
        <Route 
          path="/admin" 
          element={
            <ProtectedAdminRoute>
              <Admin />
            </ProtectedAdminRoute>
          } 
        />

        {/* Rute Seller / Customer */}
        <Route 
          path="/seller/*" 
          element={
            <ProtectedCustomerRoute>
              <SellerDashboard />
            </ProtectedCustomerRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;