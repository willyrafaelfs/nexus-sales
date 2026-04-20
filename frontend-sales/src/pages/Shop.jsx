import { useState, useEffect } from 'react';

function Shop() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // === STATE UNTUK ONGKOS KIRIM ===
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCourier, setSelectedCourier] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  // 1. Ambil data produk saat web dibuka
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setIsLoading(false);
      })
      .catch(err => console.error("Gagal load produk:", err));
  }, []);

  // 2. Ambil data Provinsi jika keranjang dibuka 
  useEffect(() => {
    if (isCartOpen && provinces.length === 0) {
      fetch('http://127.0.0.1:8000/api/rajaongkir/provinces')
        .then(res => res.json())
        .then(data => setProvinces(data))
        .catch(err => console.error("Gagal load provinsi:", err));
    }
  }, [isCartOpen, provinces.length]);

  // 3. Ambil data Kota ketika Provinsi dipilih
  useEffect(() => {
    if (selectedProvince) {
      setCities([]); 
      setSelectedCity('');
      setShippingCost(0); 
      
      fetch(`http://127.0.0.1:8000/api/rajaongkir/cities/${selectedProvince}`)
        .then(res => res.json())
        .then(data => setCities(data))
        .catch(err => console.error("Gagal load kota:", err));
    }
  }, [selectedProvince]);

  // 4. Hitung Ongkos Kirim ketika Kota dan Kurir sudah dipilih
  useEffect(() => {
    if (selectedCity && selectedCourier) {
      setIsCalculatingShipping(true);
      
      fetch('http://127.0.0.1:8000/api/rajaongkir/cost', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Accept': 'application/json' 
        },
        body: JSON.stringify({
          destination: selectedCity,
          courier: selectedCourier,
          weight: 1000 // Asumsi berat pengiriman 1kg
        })
      })
      .then(res => res.json())
      .then(data => {
        try {
          if (!Array.isArray(data) || data.length === 0) {
             alert(`Maaf, layanan kurir tidak tersedia untuk rute ini.`);
             setShippingCost(0);
             return;
          }

          const regulerService = data.find(item => 
            ['REG', 'CTC', 'Paket Kilat Khusus', 'EZ'].includes(item.service)
          );
          
          if (regulerService) {
            setShippingCost(regulerService.cost);
          } else {
            setShippingCost(data[0].cost);
          }
        } catch (error) {
          alert("Sistem gagal membaca format harga dari kurir.");
          setShippingCost(0);
        }
      })
      .catch(err => {
        console.error("Gagal hitung ongkir:", err);
        setShippingCost(0);
      })
      .finally(() => setIsCalculatingShipping(false));
    }
  }, [selectedCity, selectedCourier]);

  // === FITUR KERANJANG & PENCARIAN ===
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(search.toLowerCase())
  );

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

  // === PERHITUNGAN TOTAL ===
  const cartSubtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartTotal = cartSubtotal + shippingCost; 

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!selectedCity || !selectedCourier || shippingCost === 0) {
      alert("Mohon lengkapi tujuan pengiriman dan kurir terlebih dahulu!");
      return;
    }
    
    setIsCheckingOut(true);

    const userString = localStorage.getItem('user');
    const currentUser = userString ? JSON.parse(userString) : { name: 'Guest User' };

    const orderData = {
      customer_name: currentUser.name,
      total_price: cartTotal,
      items: cart.map(item => ({ 
        id: item.id, 
        quantity: item.quantity, 
        price: item.price 
      }))
    };

    try {
      // 1. Minta Token ke Laravel
      const response = await fetch('http://127.0.0.1:8000/api/checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Accept': 'application/json' 
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const data = await response.json();
        
        // 2. Jika token berhasil didapat, panggil Pop-up Midtrans!
        if (data.snap_token) {
          window.snap.pay(data.snap_token, {
            onSuccess: function(result) {
              alert(`TRANSAKSI BERHASIL!\nNomor Pesanan: ${data.order_id}`);
              // Kosongkan keranjang setelah sukses dibayar
              setCart([]);
              setIsCartOpen(false);
              setShippingCost(0);
              setSelectedCourier('');
              setSelectedCity('');
              setSelectedProvince('');
            },
            onPending: function(result) {
              alert("Menunggu pembayaran Anda!");
            },
            onError: function(result) {
              alert("Pembayaran gagal. Silakan coba lagi.");
            },
            onClose: function() {
              alert("Anda menutup jendela pembayaran sebelum menyelesaikan transaksi.");
            }
          });
        } else {
          alert('Gagal mendapatkan token pembayaran dari server.');
        }

      } else {
        alert('Gagal memproses pesanan ke server.');
      }
    } catch (error) {
      alert('Koneksi terputus. Pastikan server backend berjalan.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8 font-sans selection:bg-cyan-500 selection:text-white">
      
      {/* --- HEADER --- */}
      <header className="max-w-6xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
            NEXUS STORE
          </h1>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Search products..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-64 bg-gray-900 border border-gray-700 text-gray-200 px-4 py-2 rounded-lg focus:outline-none focus:border-cyan-500 transition-all"
          />
          <button 
            onClick={() => setIsCartOpen(true)} 
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-6 py-2 rounded-lg font-bold relative transition-colors"
          >
            Cart
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-cyan-500 text-gray-950 text-xs px-2 py-1 rounded-full">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* --- GRID PRODUK --- */}
      <main className="max-w-6xl mx-auto">
        {isLoading ? (
           <div className="flex justify-center items-center h-40">
             <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500"></div>
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="group bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-cyan-500/50 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-cyan-500 uppercase tracking-wider mb-2 block">
                    {product.category}
                  </span>
                  <h2 className="text-lg font-bold text-gray-100 mb-2 leading-tight">
                    {product.name}
                  </h2>
                  <p className="text-xl font-light text-gray-300 mb-6">
                    Rp {Number(product.price).toLocaleString('id-ID')}
                  </p>
                </div>
                <button 
                  onClick={() => addToCart(product)} 
                  className="w-full bg-gray-800 hover:bg-cyan-600 text-white font-medium py-2 rounded-lg border border-gray-700 hover:border-cyan-500 transition-colors"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* --- PANEL KERANJANG BELANJA --- */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
          
          <div className="w-full max-w-md bg-gray-900 border-l border-gray-800 h-full relative z-10 p-6 flex flex-col shadow-2xl overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-cyan-400">Your Cart</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
            </div>

            {/* List Barang */}
            <div className="flex-1 overflow-y-auto pr-2 mb-4">
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center mt-10">Cart is empty.</p>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="bg-gray-800 p-4 rounded-lg mb-3 border border-gray-700 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-200">{item.name}</h3>
                      <p className="text-sm text-gray-400">{item.quantity} x Rp {Number(item.price).toLocaleString('id-ID')}</p>
                    </div>
                    <div className="text-cyan-400 font-bold">
                      Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Formulir Pengiriman */}
            {cart.length > 0 && (
              <div className="bg-gray-950 border border-gray-800 p-5 rounded-xl mb-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Tujuan Pengiriman</h3>
                
                <select 
                  className="w-full bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded-lg p-3 mb-3 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value)}
                >
                  <option value="">-- Pilih Provinsi --</option>
                  {provinces.map(prov => (
                    <option key={prov.id} value={prov.id}>{prov.name}</option>
                  ))}
                </select>

                <select 
                  className="w-full bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded-lg p-3 mb-3 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  disabled={!selectedProvince}
                >
                  <option value="">-- Pilih Kota/Kabupaten --</option>
                  {cities.map(city => (
                    <option key={city.id} value={city.id}>{city.name}</option>
                  ))}
                </select>

                {/* Kurir yang tidak didukung telah dihapus */}
                <select 
                  className="w-full bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded-lg p-3 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  value={selectedCourier}
                  onChange={(e) => setSelectedCourier(e.target.value)}
                  disabled={!selectedCity}
                >
                  <option value="">-- Pilih Kurir --</option>
                  <option value="jne">JNE Reguler</option>
                  <option value="jnt">J&T Express</option>
                  <option value="pos">POS Indonesia</option>
                  <option value="tiki">TIKI</option>
                </select>
              </div>
            )}

            {/* Ringkasan & Tombol Checkout */}
            {cart.length > 0 && (
              <div className="border-t border-gray-800 pt-5">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Subtotal</span>
                  <span>Rp {cartSubtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400 mb-4">
                  <span>Shipping Cost</span>
                  <span>
                    {isCalculatingShipping ? 'Menghitung...' : `Rp ${shippingCost.toLocaleString('id-ID')}`}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-gray-300 font-bold uppercase tracking-widest">Total</span>
                  <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                    Rp {cartTotal.toLocaleString('id-ID')}
                  </span>
                </div>
                
                <button 
                  onClick={handleCheckout}
                  disabled={isCheckingOut || isCalculatingShipping || shippingCost === 0} 
                  className={`w-full font-bold py-4 rounded-xl transition-all shadow-lg ${
                    isCheckingOut || isCalculatingShipping || shippingCost === 0
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-500/20'
                  }`}
                >
                  {isCheckingOut ? 'Processing Protocol...' : 'CONFIRM & CHECKOUT'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Shop;