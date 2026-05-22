import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';

function CartPanel() {
  const { cart, setCart, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCourier, setSelectedCourier] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  useEffect(() => {
    if (isCartOpen && provinces.length === 0) {
      fetch('http://localhost:8888/api/rajaongkir/provinces')
        .then(res => res.json())
        .then(data => setProvinces(data))
        .catch(err => console.error("Gagal load provinsi:", err));
    }
  }, [isCartOpen, provinces.length]);

  useEffect(() => {
    if (selectedProvince) {
      setCities([]); 
      setSelectedCity('');
      setShippingCost(0); 
      
      fetch(`http://localhost:8888/api/rajaongkir/cities/${selectedProvince}`)
        .then(res => res.json())
        .then(data => setCities(data))
        .catch(err => console.error("Gagal load kota:", err));
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedCity && selectedCourier) {
      setIsCalculatingShipping(true);
      
      fetch('http://localhost:8888/api/rajaongkir/cost', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Accept': 'application/json' 
        },
        body: JSON.stringify({
          destination: selectedCity,
          courier: selectedCourier,
          weight: 1000
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
    const token = localStorage.getItem('token');

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
      const headers = { 
        'Content-Type': 'application/json', 
        'Accept': 'application/json' 
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('http://localhost:8888/api/checkout', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.snap_token) {
          window.snap.pay(data.snap_token, {
            onSuccess: function(result) {
              fetch('http://localhost:8888/api/checkout/success', {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                body: JSON.stringify({ order_id: data.order_id })
              }).then(() => {
                alert(`TRANSAKSI BERHASIL!\\nNomor Pesanan: ${data.order_id}`);
                setCart([]);
                setIsCartOpen(false);
                setShippingCost(0);
                setSelectedCourier('');
                setSelectedCity('');
                setSelectedProvince('');
              }).catch(err => {
                alert("Pembayaran berhasil, tapi gagal update status di server.");
              });
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

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
      
      <div className="w-full max-w-md bg-gray-900 border-l border-gray-800 h-full relative z-10 p-6 flex flex-col shadow-2xl overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-cyan-400">Your Cart</h2>
          <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 mb-4">
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center mt-10">Cart is empty.</p>
          ) : (
            cart.map(item => (
              <div key={item.id} className="bg-gray-800 p-4 rounded-lg mb-3 border border-gray-700 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-gray-200 line-clamp-2 pr-2">{item.name}</h3>
                  <div className="text-cyan-400 font-bold whitespace-nowrap">
                    Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-gray-400">Rp {Number(item.price).toLocaleString('id-ID')}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3 bg-gray-900 px-2 py-1 rounded-md border border-gray-700">
                      <button onClick={() => updateQuantity(item.id, -1)} className="text-gray-400 hover:text-white text-lg font-bold px-1">&minus;</button>
                      <span className="text-sm font-semibold text-gray-200 min-w-[1rem] text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="text-gray-400 hover:text-white text-lg font-bold px-1">&#43;</button>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)} 
                      className="text-red-500 hover:text-red-400 hover:bg-gray-700/50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-gray-800 flex items-center justify-center"
                      title="Hapus dari keranjang"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

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

        {cart.length > 0 && (
          <div className="border-t border-gray-800 pt-5 mt-auto">
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
  );
}

export default CartPanel;
