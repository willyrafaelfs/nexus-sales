import { useState, useEffect } from 'react';

export default function IncomingOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'paid', 'shipped', 'pending'
  
  // State for Toast Alert
  const [toastAlert, setToastAlert] = useState(null);

  // State for Ship Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedItemName, setSelectedItemName] = useState('');
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const [resiNumber, setResiNumber] = useState('');
  const [isShippingSubmit, setIsShippingSubmit] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('http://localhost:8888/api/seller/orders', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
        }
        throw new Error('Gagal mengambil data pesanan dari server.');
      }

      const json = await response.json();
      setOrders(json.data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Terjadi kesalahan saat menghubungi server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openShipModal = (item) => {
    setSelectedItemId(item.id);
    setSelectedItemName(item.product?.name || 'Produk');
    setSelectedCustomerName(item.order?.customer_name || 'Pembeli');
    setResiNumber('');
    setIsModalOpen(true);
  };

  const closeShipModal = () => {
    setIsModalOpen(false);
    setSelectedItemId(null);
    setSelectedItemName('');
    setSelectedCustomerName('');
    setResiNumber('');
  };

  const handleSimpanResi = async (e) => {
    e.preventDefault();
    // Resi OPSIONAL: kosong → backend generate resi otomatis (simulasi)

    setIsShippingSubmit(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`http://localhost:8888/api/seller/orders/${selectedItemId}/ship`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        // Kirim tracking_number hanya jika seller mengisinya
        body: JSON.stringify(resiNumber.trim() ? { tracking_number: resiNumber.trim() } : {})
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || 'Gagal memperbarui status pengiriman.');
      }

      // Success interaction — resi bisa dari input atau hasil generate backend
      const resiHasil = json.data?.tracking_number || resiNumber.trim();
      setToastAlert({
        type: 'success',
        title: 'Barang Berhasil Dikirim!',
        message: `Resi ${resiHasil} aktif untuk pesanan ini.`
      });

      closeShipModal();
      // Reload table dynamically to update UI in real-time
      await fetchOrders();

    } catch (err) {
      console.error('Error shipping item:', err);
      setToastAlert({
        type: 'error',
        title: 'Gagal Mengirim Barang',
        message: err.message || 'Terjadi kesalahan pada server saat menyimpan resi.'
      });
    } finally {
      setIsShippingSubmit(false);
      // Auto close toast after 5 seconds
      setTimeout(() => {
        setToastAlert(null);
      }, 5000);
    }
  };

  // Filter orders based on status tabs
  const filteredOrders = orders.filter(item => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'paid') return item.order?.status === 'paid' && item.status !== 'shipped' && !item.resi;
    if (filterStatus === 'shipped') return item.status === 'shipped' || !!item.resi;
    if (filterStatus === 'pending') return item.order?.status === 'pending';
    return true;
  });

  // Calculate order stats
  const totalIncoming = orders.length;
  const readyToShip = orders.filter(item => item.order?.status === 'paid' && item.status !== 'shipped' && !item.resi).length;
  const shippedCount = orders.filter(item => item.status === 'shipped' || !!item.resi).length;
  const pendingPayment = orders.filter(item => item.order?.status === 'pending').length;

  return (
    <div className="space-y-6 animate-fade-in text-white relative">
      {/* Dynamic Toast Alert for Ship Action */}
      {toastAlert && (
        <div className={`fixed bottom-5 right-5 z-50 px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up max-w-md border ${
          toastAlert.type === 'success' 
            ? 'bg-cyan-950/90 border-cyan-500 text-cyan-200 shadow-[0_0_30px_rgba(6,182,212,0.3)]' 
            : 'bg-red-950/90 border-red-500 text-red-200 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
        } backdrop-blur-md`}>
          <div className={`rounded-full p-1.5 shrink-0 ${toastAlert.type === 'success' ? 'bg-cyan-500 text-gray-950 animate-bounce' : 'bg-red-500 text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {toastAlert.type === 'success' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              )}
            </svg>
          </div>
          <div>
            <p className="font-bold text-sm">{toastAlert.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{toastAlert.message}</p>
          </div>
          <button onClick={() => setToastAlert(null)} className="text-gray-400 hover:text-white shrink-0 ml-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Title & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-cyan-400 flex items-center gap-3">
            <span className="w-1.5 h-6 bg-cyan-500 rounded-full"></span>
            Pesanan Masuk
          </h2>
          <p className="text-gray-400 text-sm mt-1">Pantau dan masukkan resi untuk pesanan yang siap dikirim.</p>
        </div>

        <button 
          onClick={fetchOrders}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 hover:border-cyan-500/50 hover:bg-gray-850 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 text-gray-300 hover:text-white"
        >
          <svg className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 19v-3" />
          </svg>
          Perbarui
        </button>
      </div>

      {/* Mini Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-gray-950 border border-gray-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block">Total Pesanan</span>
            <span className="text-2xl font-bold text-white mt-1 block">{isLoading ? '...' : totalIncoming}</span>
          </div>
          <div className="p-3 rounded-lg bg-gray-900 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
        </div>

        <div className="bg-gray-950 border border-gray-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block">Siap Dikirim</span>
            <span className="text-2xl font-bold text-emerald-400 mt-1 block">{isLoading ? '...' : readyToShip}</span>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-gray-950 border border-gray-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block">Dikirim</span>
            <span className="text-2xl font-bold text-purple-400 mt-1 block">{isLoading ? '...' : shippedCount}</span>
          </div>
          <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
        </div>

        <div className="bg-gray-950 border border-gray-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block">Menunggu Bayar</span>
            <span className="text-2xl font-bold text-amber-400 mt-1 block">{isLoading ? '...' : pendingPayment}</span>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-800 gap-6 overflow-x-auto pb-1">
        <button 
          onClick={() => setFilterStatus('all')}
          className={`pb-3 text-sm font-semibold relative transition-all whitespace-nowrap ${filterStatus === 'all' ? 'text-cyan-400' : 'text-gray-400 hover:text-white'}`}
        >
          Semua ({orders.length})
          {filterStatus === 'all' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full"></div>}
        </button>
        <button 
          onClick={() => setFilterStatus('paid')}
          className={`pb-3 text-sm font-semibold relative transition-all whitespace-nowrap ${filterStatus === 'paid' ? 'text-emerald-400' : 'text-gray-400 hover:text-white'}`}
        >
          Siap Dikirim ({readyToShip})
          {filterStatus === 'paid' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full"></div>}
        </button>
        <button 
          onClick={() => setFilterStatus('shipped')}
          className={`pb-3 text-sm font-semibold relative transition-all whitespace-nowrap ${filterStatus === 'shipped' ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
        >
          Telah Dikirim ({shippedCount})
          {filterStatus === 'shipped' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400 rounded-full"></div>}
        </button>
        <button 
          onClick={() => setFilterStatus('pending')}
          className={`pb-3 text-sm font-semibold relative transition-all whitespace-nowrap ${filterStatus === 'pending' ? 'text-amber-400' : 'text-gray-400 hover:text-white'}`}
        >
          Menunggu Bayar ({pendingPayment})
          {filterStatus === 'pending' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full"></div>}
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        {isLoading ? (
          /* Table Skeleton Loader */
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-6 gap-4 pb-4 border-b border-gray-800">
              <div className="h-4 bg-gray-850 rounded col-span-2 animate-pulse"></div>
              <div className="h-4 bg-gray-850 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-850 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-850 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-850 rounded animate-pulse"></div>
            </div>
            {[1, 2, 3].map((n) => (
              <div key={n} className="grid grid-cols-6 gap-4 py-4 items-center border-b border-gray-850 last:border-0">
                <div className="col-span-2 flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-850 rounded-lg animate-pulse"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-850 rounded w-3/4 animate-pulse"></div>
                    <div className="h-3 bg-gray-850 rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-850 rounded w-2/3 animate-pulse"></div>
                <div className="h-4 bg-gray-850 rounded w-1/2 animate-pulse"></div>
                <div className="h-4 bg-gray-850 rounded w-2/3 animate-pulse"></div>
                <div className="h-8 bg-gray-850 rounded-lg animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="p-12 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-white">Terjadi Kendala Teknis</h4>
            <p className="text-gray-400 max-w-md mx-auto text-sm">{error}</p>
            <button 
              onClick={fetchOrders}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-500 transition-colors text-white font-bold rounded-lg text-sm uppercase tracking-wider"
            >
              Coba Lagi
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          /* Empty State */
          <div className="p-16 text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-gray-850 text-gray-500 border border-gray-800 rounded-full flex items-center justify-center shadow-inner">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Tidak Ada Pesanan</h4>
              <p className="text-gray-400 max-w-sm mx-auto text-sm mt-1">
                {filterStatus === 'all' 
                  ? 'Saat ini belum ada pesanan masuk dari pembeli untuk toko Anda.' 
                  : `Tidak ada pesanan masuk dengan status "${
                      filterStatus === 'paid' 
                        ? 'Siap Dikirim' 
                        : filterStatus === 'shipped' 
                        ? 'Telah Dikirim' 
                        : 'Menunggu Pembayaran'
                    }" saat ini.`}
              </p>
            </div>
          </div>
        ) : (
          /* Modern Responsive Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-950/50">
                  <th className="p-5 text-xs font-bold uppercase tracking-wider text-gray-400">Produk</th>
                  <th className="p-5 text-xs font-bold uppercase tracking-wider text-gray-400">Pembeli</th>
                  <th className="p-5 text-xs font-bold uppercase tracking-wider text-gray-400 text-center">Jumlah</th>
                  <th className="p-5 text-xs font-bold uppercase tracking-wider text-gray-400 text-right">Total Harga</th>
                  <th className="p-5 text-xs font-bold uppercase tracking-wider text-gray-400 text-center">Status</th>
                  <th className="p-5 text-xs font-bold uppercase tracking-wider text-gray-400 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-850">
                {filteredOrders.map((item) => {
                  const totalPrice = item.quantity * item.price;
                  
                  // Check shipped status
                  const isShipped = item.status === 'shipped' || !!item.resi;
                  const isPaid = item.order?.status === 'paid' && !isShipped;
                  const isPending = item.order?.status === 'pending' && !isShipped;

                  return (
                    <tr key={item.id} className="hover:bg-gray-850/30 transition-colors group">
                      {/* Product Thumbnail & Name */}
                      <td className="p-5">
                        <div className="flex items-center gap-3.5">
                          {item.product?.image ? (
                            <img 
                              src={item.product.image} 
                              alt={item.product.name} 
                              className="w-12 h-12 object-cover rounded-lg border border-gray-800 group-hover:scale-105 transition-transform" 
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234b5563'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'/%3E%3C/svg%3E";
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
                              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors truncate max-w-[200px]" title={item.product?.name}>
                              {item.product?.name || 'Produk Tidak Ditemukan'}
                            </p>
                            <span className="text-xs text-gray-500 font-mono">ID Item: #{item.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Customer Name */}
                      <td className="p-5 font-medium text-gray-300 text-sm">
                        {item.order?.customer_name || 'Pembeli Anonim'}
                      </td>

                      {/* Quantity */}
                      <td className="p-5 text-center font-bold text-gray-300 text-sm">
                        {item.quantity}
                      </td>

                      {/* Total Price */}
                      <td className="p-5 text-right font-mono font-bold text-cyan-400 text-sm">
                        Rp {Number(totalPrice).toLocaleString('id-ID')}
                      </td>

                      {/* Status Badge */}
                      <td className="p-5 text-center">
                        {isShipped ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30 shadow-[0_0_10px_rgba(147,51,234,0.1)]">
                            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-1.5 animate-pulse"></span>
                            Dikirim
                          </span>
                        ) : isPaid ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5 animate-pulse"></span>
                            Siap Dikirim
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mr-1.5"></span>
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-800 text-gray-400 border border-gray-750">
                            {item.order?.status || 'Unknown'}
                          </span>
                        )}
                      </td>

                      {/* Action / Receipt Column */}
                      <td className="p-5 text-center">
                        {isShipped ? (
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Resi Pengiriman</span>
                            <span className="px-3 py-1 bg-gray-950 border border-gray-800 rounded font-mono text-xs text-purple-300 font-bold tracking-wider select-all cursor-pointer hover:border-purple-500/30 hover:bg-purple-950/10 transition-all">
                              {item.resi || 'No Resi'}
                            </span>
                          </div>
                        ) : isPaid ? (
                          <button
                            onClick={() => openShipModal(item)}
                            className="px-4 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-all hover:scale-105 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                          >
                            Kirim Barang
                          </button>
                        ) : (
                          <button
                            disabled
                            className="px-4 py-2 text-xs font-bold bg-gray-800 text-gray-500 rounded-lg cursor-not-allowed border border-gray-850"
                          >
                            Menunggu Pembayaran
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modern Pop-up / Modal for Shipping */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop glass */}
          <div 
            onClick={closeShipModal}
            className="absolute inset-0 bg-gray-950/70 backdrop-blur-md transition-opacity duration-300"
          ></div>
          
          {/* Modal Container */}
          <div className="relative bg-gray-900 border border-gray-800 w-full max-w-md rounded-2xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden animate-zoom-in text-left">
            {/* Ambient background glow */}
            <div className="absolute -right-10 -top-10 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl"></div>

            <div className="relative z-10 space-y-5">
              <div className="flex items-center gap-3">
                <div className="bg-cyan-500/10 text-cyan-400 p-2.5 rounded-xl border border-cyan-500/20">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-wide">Kirim Pesanan</h3>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">ID Item: #{selectedItemId}</p>
                </div>
              </div>

              {/* Order Info */}
              <div className="bg-gray-950 border border-gray-850 p-4 rounded-xl space-y-2">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Nama Produk</span>
                  <span className="text-sm font-semibold text-white block truncate">{selectedItemName}</span>
                </div>
                <div className="pt-2 border-t border-gray-850">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Pembeli</span>
                  <span className="text-sm font-semibold text-cyan-400 block">{selectedCustomerName}</span>
                </div>
              </div>

              {/* Form Input Resi (OPSIONAL) */}
              <form onSubmit={handleSimpanResi} className="space-y-5">
                <div>
                  <label className="block text-gray-400 text-sm font-semibold mb-2" htmlFor="resi">
                    Nomor Resi Pengiriman <span className="text-gray-500 font-normal">(opsional)</span>
                  </label>
                  <input
                    type="text"
                    id="resi"
                    autoFocus
                    value={resiNumber}
                    onChange={(e) => setResiNumber(e.target.value)}
                    placeholder="Mis. JNE123456789"
                    className="w-full bg-gray-950 border border-gray-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4 py-3 text-white transition-all text-sm font-mono tracking-wider"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Kosongkan untuk <span className="text-cyan-400">generate resi otomatis</span> (simulasi), atau isi resi kurir asli.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeShipModal}
                    className="flex-1 py-3 px-4 bg-gray-950 hover:bg-gray-850 border border-gray-800 hover:border-gray-700 text-gray-300 font-bold rounded-xl text-sm transition-all text-center uppercase tracking-wider"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isShippingSubmit}
                    className={`flex-1 py-3 px-4 font-bold rounded-xl text-sm transition-all text-center uppercase tracking-wider ${
                      isShippingSubmit
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-850'
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                    }`}
                  >
                    {isShippingSubmit ? 'Mengirim...' : 'Kirim Barang'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
