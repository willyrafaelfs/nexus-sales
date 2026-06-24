import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null); // null, 403, or 'other'
  const [errorMessage, setErrorMessage] = useState('');

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setErrorStatus(null);
    setErrorMessage('');
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('http://localhost:8888/api/admin/dashboard', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.status === 403) {
        setErrorStatus(403);
        setErrorMessage('Anda tidak memiliki akses ke halaman ini');
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        let errorMsg = 'Gagal mengambil data dashboard admin.';
        try {
          const errJson = await response.json();
          if (errJson && errJson.error) {
            errorMsg = errJson.error;
          } else if (errJson && errJson.message) {
            errorMsg = errJson.message;
          }
        } catch (_) {}
        throw new Error(errorMsg);
      }

      const json = await response.json();
      setDashboardData(json.data || null);
    } catch (err) {
      console.error('Error fetching admin dashboard:', err);
      setErrorStatus('other');
      setErrorMessage(err.message || 'Terjadi kesalahan saat menghubungkan ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Handle Error 403 (Akses Ditolak) - Tampilkan pesan khusus dan jangan render dashboard
  if (errorStatus === 403) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col justify-center items-center p-6 selection:bg-red-500 selection:text-white">
        <div className="bg-gray-900 border border-red-500/30 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-[0_0_50px_rgba(239,68,68,0.1)] relative overflow-hidden animate-zoom-in">
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-red-500/5 rounded-full blur-2xl"></div>
          
          <div className="mx-auto w-20 h-20 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full flex items-center justify-center animate-pulse">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">Akses Ditolak</h2>
            <p className="text-gray-400 text-sm">{errorMessage}</p>
          </div>

          <div className="flex gap-4">
            <a 
              href="/"
              className="flex-1 py-3 px-4 bg-gray-950 hover:bg-gray-850 border border-gray-800 hover:border-gray-700 text-gray-300 font-bold rounded-xl text-xs transition-all uppercase tracking-wider text-center"
            >
              Kembali ke Beranda
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Handle Other Errors (Server Offline, 500, etc)
  if (errorStatus && errorStatus !== 403) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col justify-center items-center p-6 text-white">
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
          <div className="mx-auto w-16 h-16 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Koneksi Bermasalah</h3>
            <p className="text-gray-400 text-sm">{errorMessage}</p>
          </div>
          <button 
            onClick={fetchDashboardData}
            className="w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-500 transition-all text-white font-bold rounded-xl text-xs uppercase tracking-widest"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const metrics = dashboardData?.metrics || { total_users: 0, total_shops: 0, total_revenue: 0 };
  const recentOrders = dashboardData?.recent_orders || [];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 sm:p-8 font-sans selection:bg-cyan-500 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header Dashboard */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-900 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-wider text-white uppercase">
              Super Admin <span className="text-cyan-500">Dashboard</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1 tracking-wide">Pusat kendali, performa bisnis, dan rekap transaksi platform.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              to="/admin/crm"
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 border border-cyan-500/30 hover:border-cyan-500/70 hover:bg-cyan-600 hover:text-white rounded-xl text-xs sm:text-sm font-semibold transition-all text-cyan-400"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              CRM Logs
            </Link>

            <button
              onClick={fetchDashboardData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 border border-gray-800 hover:border-cyan-500/50 hover:bg-gray-850 rounded-xl text-xs sm:text-sm font-semibold transition-all disabled:opacity-50 text-gray-300 hover:text-white"
            >
              <svg className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 19v-3" />
              </svg>
              Segarkan Data
            </button>
          </div>
        </div>

        {isLoading ? (
          /* Main Skeleton Loader */
          <div className="space-y-10">
            {/* Metric Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-gray-900 border border-gray-850 p-6 rounded-2xl h-32 animate-pulse space-y-4">
                  <div className="h-4 bg-gray-800 rounded w-1/3"></div>
                  <div className="h-8 bg-gray-800 rounded w-2/3"></div>
                </div>
              ))}
            </div>

            {/* Table Skeleton */}
            <div className="bg-gray-900 border border-gray-850 rounded-2xl p-6 h-64 animate-pulse space-y-4">
              <div className="h-6 bg-gray-800 rounded w-1/4 mb-6"></div>
              <div className="h-4 bg-gray-800 rounded w-full"></div>
              <div className="h-4 bg-gray-800 rounded w-full"></div>
              <div className="h-4 bg-gray-800 rounded w-full"></div>
            </div>
          </div>
        ) : (
          <>
            {/* Kartu Metrik (Summary Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Total Pengguna */}
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl relative overflow-hidden group hover:border-cyan-500/40 transition-all">
                <div className="absolute -right-4 -top-4 w-20 h-20 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all"></div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Total Pengguna Terdaftar</span>
                  <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-3xl font-extrabold text-white tracking-tight">{metrics.total_users}</h3>
                <p className="text-gray-400 text-xs mt-2 font-medium">Pengguna aktif terdaftar</p>
              </div>

              {/* Card 2: Total Toko */}
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Total Toko Aktif</span>
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-3xl font-extrabold text-white tracking-tight">{metrics.total_shops}</h3>
                <p className="text-gray-400 text-xs mt-2 font-medium">Merchant terverifikasi</p>
              </div>

              {/* Card 3: Total Pendapatan */}
              <div className="bg-gray-900 border border-cyan-900/50 p-6 rounded-2xl shadow-xl relative overflow-hidden group hover:border-cyan-500/40 transition-all">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/15 transition-all"></div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Total Pendapatan</span>
                  <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-3xl font-extrabold text-cyan-400 tracking-tight">
                  Rp {Number(metrics.total_revenue).toLocaleString('id-ID')}
                </h3>
                <p className="text-emerald-400 text-xs mt-2 font-medium">Bruto pendapatan platform</p>
              </div>

            </div>

            {/* Tabel Transaksi Terkini */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-gray-850 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-cyan-500 rounded-full"></span>
                  Transaksi Terkini
                </h2>
                <span className="text-xs text-gray-500 font-mono bg-gray-950 border border-gray-850 px-2.5 py-1 rounded-md">
                  Update Real-time
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-950/50 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-850">
                      <th className="p-5 font-bold">Order ID</th>
                      <th className="p-5 font-bold">Nama Pembeli</th>
                      <th className="p-5 font-bold text-right">Total Harga</th>
                      <th className="p-5 font-bold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-850">
                    {recentOrders.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-10 text-center text-gray-500 text-sm">
                          Belum ada data transaksi terkini di platform.
                        </td>
                      </tr>
                    ) : (
                      recentOrders.map((order) => {
                        const isPaid = order.status === 'paid';
                        const isPending = order.status === 'pending';

                        return (
                          <tr key={order.id} className="hover:bg-gray-850/30 transition-colors group">
                            {/* Order ID */}
                            <td className="p-5 font-mono text-cyan-400 text-sm font-semibold">
                              #{order.id}
                            </td>

                            {/* Customer Name */}
                            <td className="p-5 text-white font-medium text-sm">
                              {order.customer_name}
                            </td>

                            {/* Total Price */}
                            <td className="p-5 text-right font-mono font-bold text-gray-300 text-sm">
                              Rp {Number(order.total_price).toLocaleString('id-ID')}
                            </td>

                            {/* Status Badge */}
                            <td className="p-5 text-center">
                              {isPaid ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5 animate-pulse"></span>
                                  PAID
                                </span>
                              ) : isPending ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mr-1.5"></span>
                                  PENDING
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-800 text-gray-400 border border-gray-750">
                                  {order.status?.toUpperCase() || 'UNKNOWN'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
