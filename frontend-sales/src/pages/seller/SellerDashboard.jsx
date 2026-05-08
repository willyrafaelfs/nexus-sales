import { useState, useEffect } from 'react';
import ProductForm from './components/ProductForm';

export default function SellerDashboard() {
  const [shopId, setShopId] = useState(null);
  const [shopData, setShopData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchMyShop = async () => {
      try {
        const response = await fetch('http://localhost:8888/api/shop', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        const data = await response.json();
        
        if (data.shop) {
          setShopId(data.shop.id);
          setShopData(data.shop);
        }
      } catch (error) {
        console.error("Gagal mengambil data toko", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchMyShop();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex justify-center items-center">
        <div className="text-cyan-400 text-xl font-bold animate-pulse">Memuat Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pt-10 pb-20">
      <div className="max-w-6xl mx-auto p-6">
        
        {/* Header Dashboard */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-wider uppercase">
              Seller <span className="text-cyan-500">Dashboard</span>
            </h1>
            <p className="text-gray-400 mt-2">
              Toko: <span className="text-cyan-400 font-bold">{shopData?.nama_toko || 'N/A'}</span> — Pemilik: <span className="text-white">{user?.name}</span>
            </p>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/50 px-4 py-2 rounded-full text-cyan-400 text-xs font-bold uppercase tracking-widest">
            Status: Active Merchant
          </div>
        </div>

        {/* Ringkasan Statistik (Premium Look) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl relative overflow-hidden group hover:border-cyan-500/50 transition-all">
             <div className="absolute -right-4 -top-4 w-20 h-20 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all"></div>
             <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Total Produk</p>
             <h3 className="text-3xl font-extrabold text-white">12</h3>
             <p className="text-cyan-500 text-xs mt-2 font-medium">+2 bulan ini</p>
          </div>
          
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl relative overflow-hidden group hover:border-green-500/50 transition-all">
             <div className="absolute -right-4 -top-4 w-20 h-20 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-all"></div>
             <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Estimasi Pendapatan</p>
             <h3 className="text-3xl font-extrabold text-white">Rp 4.520.000</h3>
             <p className="text-green-500 text-xs mt-2 font-medium">+15.4% dari kemarin</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl relative overflow-hidden group hover:border-purple-500/50 transition-all">
             <div className="absolute -right-4 -top-4 w-20 h-20 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all"></div>
             <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Pesanan Baru</p>
             <h3 className="text-3xl font-extrabold text-white">3</h3>
             <p className="text-purple-500 text-xs mt-2 font-medium">Perlu dikirim segera</p>
          </div>
        </div>

        {/* Form Tambah Produk */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-10">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <svg className="w-32 h-32 text-cyan-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
             </div>
             <div className="relative z-10">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                   <span className="w-1.5 h-6 bg-cyan-500 rounded-full"></span>
                   Management Produk
                </h2>
                <ProductForm token={token} shopId={shopId} />
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
