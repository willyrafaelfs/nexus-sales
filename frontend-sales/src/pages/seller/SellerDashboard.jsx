import { useState, useEffect } from 'react';
import ProductForm from './components/ProductForm';
import IncomingOrders from './components/IncomingOrders';

export default function SellerDashboard() {
  const [shopId, setShopId] = useState(null);
  const [shopData, setShopData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, my-products, incoming-orders, add-product

  // Data Analitik & Produk Khusus Toko
  const [metrics, setMetrics] = useState({ total_products: 0, total_revenue: 0 });
  const [products, setProducts] = useState([]);
  const [isMetricsLoading, setIsMetricsLoading] = useState(false);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState(null);
  const [productsError, setProductsError] = useState(null);

  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const token = localStorage.getItem('token');

  // Fetch Data Metrik Toko
  const fetchMetrics = async () => {
    if (!token) return;
    setIsMetricsLoading(true);
    setMetricsError(null);
    try {
      const response = await fetch('http://localhost:8888/api/seller/metrics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (response.ok) {
        const json = await response.json();
        setMetrics(json.data || { total_products: 0, total_revenue: 0 });
      } else {
        throw new Error('Gagal mengambil metrik toko.');
      }
    } catch (err) {
      console.error(err);
      setMetricsError(err.message || 'Terjadi kesalahan saat memuat metrik.');
    } finally {
      setIsMetricsLoading(false);
    }
  };

  // Fetch Data Produk Toko
  const fetchProducts = async () => {
    if (!token) return;
    setIsProductsLoading(true);
    setProductsError(null);
    try {
      const response = await fetch('http://localhost:8888/api/seller/products', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (response.ok) {
        const json = await response.json();
        setProducts(json.data || []);
      } else {
        throw new Error('Gagal mengambil daftar produk toko.');
      }
    } catch (err) {
      console.error(err);
      setProductsError(err.message || 'Terjadi kesalahan saat memuat produk.');
    } finally {
      setIsProductsLoading(false);
    }
  };

  // Fetch Profil Toko pada Mount
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

  // Sync Fetch saat Active Tab berubah
  useEffect(() => {
    if (token) {
      if (activeTab === 'overview') {
        fetchMetrics();
      } else if (activeTab === 'my-products') {
        fetchProducts();
      }
    }
  }, [activeTab, token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col justify-center items-center gap-4">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
        <div className="text-cyan-400 text-sm font-bold tracking-widest uppercase animate-pulse">Memuat Merchant Platform...</div>
      </div>
    );
  }

  // Definisikan Navigasi Menu Tabs
  const tabs = [
    {
      id: 'overview',
      label: 'Ikhtisar',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      )
    },
    {
      id: 'my-products',
      label: 'Etalase Saya',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    {
      id: 'incoming-orders',
      label: 'Pesanan Masuk',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    {
      id: 'add-product',
      label: 'Tambah Produk',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 sm:p-8 font-sans selection:bg-cyan-500 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Dashboard */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-900 pb-6 relative overflow-hidden">
          <div>
            <h1 className="text-3xl font-extrabold tracking-wider text-white uppercase">
              Seller <span className="text-cyan-500 font-black">Dashboard</span>
            </h1>
            <p className="text-gray-400 mt-2 text-sm">
              Toko: <span className="text-cyan-400 font-bold tracking-wide">{shopData?.nama_toko || 'Merchant Baru'}</span> 
              <span className="text-gray-600 mx-2">|</span> 
              Owner: <span className="text-gray-300 font-medium">{user?.name}</span>
            </p>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/30 px-4 py-2.5 rounded-full text-cyan-400 text-xs font-bold uppercase tracking-widest animate-pulse">
            Status: Active Merchant
          </div>
        </div>

        {/* Tab Navigation (Modern Sticky Glassmorphic Tabs) */}
        <div className="flex flex-wrap gap-2 bg-gray-900/50 p-1.5 rounded-2xl border border-gray-850 backdrop-blur-md max-w-2xl">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2.5 ${
                  isActive
                    ? 'bg-cyan-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] border border-cyan-400/25'
                    : 'text-gray-400 hover:text-white hover:bg-gray-850/40 border border-transparent'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area with smooth animations */}
        <div className="min-h-[500px]">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-cyan-500 rounded-full"></span>
                  Analitik Toko Anda
                </h2>
                <button 
                  onClick={fetchMetrics} 
                  disabled={isMetricsLoading}
                  className="p-2 bg-gray-900 border border-gray-800 rounded-lg hover:border-cyan-500/50 hover:bg-gray-850/50 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className={`w-4 h-4 ${isMetricsLoading ? 'animate-spin text-cyan-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 19v-3" />
                  </svg>
                </button>
              </div>

              {isMetricsLoading ? (
                /* Overview Skeleton */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2].map((n) => (
                    <div key={n} className="bg-gray-900 border border-gray-850 p-8 rounded-2xl h-36 animate-pulse space-y-4">
                      <div className="h-4 bg-gray-800 rounded w-1/4"></div>
                      <div className="h-8 bg-gray-800 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : metricsError ? (
                <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl text-center">
                  <p className="text-red-400 text-sm font-semibold mb-2">Terjadi kendala saat memuat metrik: {metricsError}</p>
                  <button onClick={fetchMetrics} className="text-xs uppercase tracking-wider text-cyan-400 hover:text-cyan-300 font-bold">Coba Lagi</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Metric Card 1: Total Produk */}
                  <div 
                    onClick={() => setActiveTab('my-products')}
                    className="bg-gray-900 border border-gray-800 hover:border-cyan-500/40 p-8 rounded-2xl shadow-xl relative overflow-hidden group transition-all cursor-pointer"
                  >
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all"></div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Total Produk Aktif</span>
                      <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-4xl font-extrabold text-white tracking-tight">{metrics.total_products}</h3>
                    <p className="text-cyan-400 text-xs mt-3 font-semibold uppercase tracking-wider flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Buka etalase produk saya 
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </p>
                  </div>

                  {/* Metric Card 2: Pendapatan Riil */}
                  <div className="bg-gray-900 border border-gray-800 hover:border-emerald-500/40 p-8 rounded-2xl shadow-xl relative overflow-hidden group transition-all">
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Pendapatan Riil Lunas</span>
                      <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-4xl font-extrabold text-emerald-400 tracking-tight">
                      Rp {Number(metrics.total_revenue).toLocaleString('id-ID')}
                    </h3>
                    <p className="text-gray-400 text-xs mt-3 font-medium">Berdasarkan transaksi yang berhasil dibayar pembeli</p>
                  </div>

                </div>
              )}

              {/* Quick Actions Panel */}
              <div className="bg-gray-900 border border-gray-800/80 rounded-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.02]">
                  <svg className="w-40 h-40 text-cyan-400" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                </div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-cyan-500 rounded-full"></span>
                  Akses Cepat Pintasan
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={() => setActiveTab('add-product')} 
                    className="p-4 bg-gray-950 hover:bg-cyan-950/20 border border-gray-850 hover:border-cyan-500/30 rounded-xl text-left transition-all group flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors">Tambah Barang Baru</h4>
                      <p className="text-xs text-gray-500 mt-1">Upload katalog produk ke etalase utama toko</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  </button>

                  <button 
                    onClick={() => setActiveTab('incoming-orders')} 
                    className="p-4 bg-gray-950 hover:bg-purple-950/20 border border-gray-850 hover:border-purple-500/30 rounded-xl text-left transition-all group flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-white group-hover:text-purple-400 transition-colors">Lihat Pesanan Masuk</h4>
                      <p className="text-xs text-gray-500 mt-1">Proses pengiriman pesanan dan input nomor resi</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: MY PRODUCTS */}
          {activeTab === 'my-products' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <span className="w-1.5 h-6 bg-cyan-500 rounded-full"></span>
                    Etalase Toko Anda
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">Daftar semua barang yang Anda jual di marketplace platform.</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button 
                    onClick={fetchProducts} 
                    disabled={isProductsLoading}
                    className="p-2 bg-gray-900 border border-gray-800 rounded-lg hover:border-cyan-500/50 hover:bg-gray-850/50 text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className={`w-4 h-4 ${isProductsLoading ? 'animate-spin text-cyan-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 19v-3" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => setActiveTab('add-product')} 
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 transition-colors text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    Tambah Produk
                  </button>
                </div>
              </div>

              {isProductsLoading ? (
                /* Products Skeleton Loader */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="bg-gray-900 border border-gray-850 rounded-2xl h-80 animate-pulse space-y-4 p-4">
                      <div className="h-44 bg-gray-800 rounded-xl"></div>
                      <div className="h-4 bg-gray-800 rounded w-2/3"></div>
                      <div className="h-4 bg-gray-800 rounded w-1/3"></div>
                    </div>
                  ))}
                </div>
              ) : productsError ? (
                <div className="bg-red-500/10 border border-red-500/30 p-8 rounded-2xl text-center">
                  <p className="text-red-400 text-sm font-semibold mb-2">Gagal mengambil data produk: {productsError}</p>
                  <button onClick={fetchProducts} className="text-xs uppercase tracking-wider text-cyan-400 hover:text-cyan-300 font-bold">Segarkan Halaman</button>
                </div>
              ) : products.length === 0 ? (
                /* Empty State */
                <div className="bg-gray-900 border border-gray-850 rounded-3xl p-12 text-center max-w-md mx-auto space-y-6 shadow-2xl animate-zoom-in">
                  <div className="w-20 h-20 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white">Etalase Masih Kosong</h3>
                    <p className="text-gray-400 text-sm">Anda belum menambahkan produk apa pun untuk dijual di platform ini.</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('add-product')} 
                    className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 transition-colors text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-md"
                  >
                    Tambah Produk Pertama Saya
                  </button>
                </div>
              ) : (
                /* Products Grid Display */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div key={product.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-cyan-500/40 shadow-xl transition-all group flex flex-col justify-between">
                      <div className="relative overflow-hidden bg-gray-950 flex items-center justify-center h-48 border-b border-gray-850">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                        ) : (
                          <div className="text-gray-600 text-xs font-mono select-none">TIDAK ADA GAMBAR</div>
                        )}
                        <span className="absolute top-3 left-3 bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md backdrop-blur-md">
                          {product.category}
                        </span>
                      </div>
                      
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <h4 className="text-white font-bold text-base line-clamp-1 group-hover:text-cyan-400 transition-colors" title={product.name}>
                            {product.name}
                          </h4>
                          <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed h-8">
                            {product.description || 'Tidak ada deskripsi produk.'}
                          </p>
                        </div>
                        
                        <div className="pt-2 border-t border-gray-850 flex items-center justify-between">
                          <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Harga Retail</span>
                          <span className="text-base font-mono font-bold text-cyan-400">
                            Rp {Number(product.price).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INCOMING ORDERS */}
          {activeTab === 'incoming-orders' && (
            <div className="animate-fade-in">
              <IncomingOrders />
            </div>
          )}

          {/* TAB 4: ADD PRODUCT */}
          {activeTab === 'add-product' && (
            <div className="max-w-2xl mx-auto">
              <ProductForm token={token} shopId={shopId} />
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
