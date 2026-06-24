import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError("Token otentikasi tidak ditemukan. Silakan login kembali.");
      setIsLoading(false);
      return;
    }

    fetch('http://localhost:8888/api/orders', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (res.status === 401 || res.status === 403) {
          throw new Error("Sesi login Anda telah habis atau Anda tidak memiliki akses.");
        }
        if (!res.ok) {
          throw new Error("Gagal mengambil data pesanan.");
        }
        return res.json();
      })
      .then(json => {
        setOrders(json.data || []);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  const handlePayNow = (order) => {
    if (order.snap_token && window.snap) {
      window.snap.pay(order.snap_token, {
        onSuccess: function(result) {
          fetch('http://localhost:8888/api/checkout/success', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ order_id: order.id })
          }).then(() => {
            alert(`Pembayaran berhasil diproses!\nNomor Pesanan: ${order.id}`);
            window.location.reload();
          }).catch(() => {
            alert("Pembayaran sukses, sedang mengupdate sistem.");
            window.location.reload();
          });
        },
        onPending: function(result) {
          alert("Menunggu pembayaran Anda!");
          window.location.reload();
        },
        onError: function(result) {
          alert("Pembayaran gagal. Silakan coba lagi.");
        },
        onClose: function() {
          alert("Anda menutup jendela pembayaran sebelum menyelesaikan transaksi.");
        }
      });
    } else if (order.payment_url) {
      // Fallback: Arahkan langsung ke url pembayaran Midtrans
      window.location.href = order.payment_url;
    } else {
      alert("Tautan pembayaran tidak tersedia. Hubungi penjual.");
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return (
          <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 animate-pulse">
            Menunggu Pembayaran
          </span>
        );
      case 'paid':
      case 'success':
        return (
          <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            Lunas
          </span>
        );
      case 'cancelled':
      case 'failed':
        return (
          <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
            Batal / Gagal
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/30">
            {status}
          </span>
        );
    }
  };

  const getItemStatusBadge = (itemStatus) => {
    switch (itemStatus?.toLowerCase()) {
      case 'pending':
        return <span className="text-xs font-medium text-gray-400">Memproses</span>;
      case 'shipped':
        return <span className="text-xs font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded">Dikirim</span>;
      default:
        return <span className="text-xs font-medium text-gray-400 capitalize">{itemStatus}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col justify-center items-center text-gray-100 p-6">
        <svg className="w-16 h-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="text-2xl font-bold mb-2">Terjadi Gangguan</h2>
        <p className="text-gray-400 text-center max-w-md mb-6">{error}</p>
        <Link to="/login" className="bg-cyan-600 hover:bg-cyan-500 text-gray-950 font-bold px-6 py-2.5 rounded-lg transition-colors">
          Login Ulang
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 py-12 px-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              PESANAN SAYA
            </h1>
            <p className="text-gray-500 text-sm mt-1 uppercase tracking-widest">Riwayat Transaksi Belanja Anda</p>
          </div>
          <Link to="/" className="text-cyan-400 hover:text-cyan-300 font-semibold text-sm flex items-center gap-1 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Belanja Lagi
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center shadow-xl">
            <svg className="w-20 h-20 text-gray-700 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h3 className="text-xl font-bold text-gray-300 mb-2">Belum Ada Transaksi</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-8 text-sm">Anda belum melakukan pemesanan apa pun. Jelajahi katalog kami untuk menemukan produk menarik!</p>
            <Link to="/" className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg shadow-cyan-500/20 transition-all">
              Jelajahi Produk
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl hover:border-cyan-500/20 transition-all duration-300 relative overflow-hidden group"
              >
                {/* Glow Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                {/* Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4 mb-5">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Order ID</p>
                      <p className="font-bold text-gray-200">#NEX-{order.id}</p>
                    </div>
                    <div className="border-l border-gray-800 h-6 mx-2 hidden sm:block"></div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Tanggal</p>
                      <p className="text-sm text-gray-400 font-medium">{new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Card Body - Products List */}
                <div className="space-y-4 mb-6">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="flex gap-4 items-center bg-gray-950/40 p-3.5 rounded-xl border border-gray-800/60">
                      {/* Product Image */}
                      <div className="w-16 h-16 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 border border-gray-700">
                        {item.product?.image ? (
                          <img 
                            src={item.product.image} 
                            alt={item.product.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-200 text-sm sm:text-base truncate group-hover:text-cyan-400 transition-colors">
                          {item.product?.name || "Produk Tidak Ditemukan"}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs sm:text-sm text-gray-400">
                          <p>Rp {Number(item.price).toLocaleString('id-ID')} &times; {item.quantity}</p>
                          <p className="border-l border-gray-800 pl-4">Subtotal: <span className="font-semibold text-gray-200">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span></p>
                        </div>
                        {item.resi && (
                          <div className="mt-2 text-xs text-gray-500 bg-gray-900 border border-gray-800 px-3 py-1 rounded-md w-max flex items-center gap-1.5">
                            <span className="font-bold text-gray-400">No. Resi:</span> 
                            <span className="text-cyan-400 font-mono tracking-wider font-semibold select-all">{item.resi}</span>
                          </div>
                        )}
                      </div>

                      {/* Item Status */}
                      <div className="flex-shrink-0 text-right">
                        {getItemStatusBadge(item.status)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Card Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-gray-800/80 pt-4 mt-4">
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold block">Total Pembayaran</span>
                    <span className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                      Rp {Number(order.total_price).toLocaleString('id-ID')}
                    </span>
                  </div>
                  
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handlePayNow(order)}
                      className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 flex items-center justify-center gap-2 group/btn"
                    >
                      <svg className="w-5 h-5 text-white transition-transform group-hover/btn:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Lanjutkan Pembayaran
                    </button>
                  )}

                  {/* Lacak pengiriman per-order (tampil setelah order lunas) */}
                  {(order.status === 'paid' || order.status === 'success') && (
                    <Link
                      to={`/orders/${order.id}/tracking`}
                      className="border border-cyan-500/40 text-cyan-400 hover:bg-cyan-600 hover:text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      Lacak Pengiriman
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyOrders;
