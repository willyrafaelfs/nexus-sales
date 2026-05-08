import { useState, useEffect } from 'react';
import OpenShopForm from './components/OpenShopForm';
import ProductForm from './components/ProductForm';

export default function SellerDashboard() {
  const [shopStatus, setShopStatus] = useState('checking'); // checking | no_shop | has_shop
  const [shopId, setShopId] = useState(null);
  
  // Ambil user dan token dari localStorage
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const token = localStorage.getItem('token');

  useEffect(() => {
    const checkUserShop = async () => {
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
          setShopStatus('has_shop');
        } else {
          setShopStatus('no_shop');
        }
      } catch (error) {
        console.error("Gagal mengecek status toko", error);
        setShopStatus('no_shop');
      }
    };

    if (token) {
      checkUserShop();
    } else {
      setShopStatus('no_shop');
    }
  }, [token]);

  const handleShopCreated = (newShopId) => {
    setShopId(newShopId);
    setShopStatus('has_shop');
  };

  if (shopStatus === 'checking') {
    return (
      <div className="min-h-screen bg-gray-950 flex justify-center items-center">
        <div className="text-cyan-400 text-xl font-bold animate-pulse">Memeriksa status toko...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pt-10">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-wider uppercase border-b border-gray-800 pb-4">
            Seller <span className="text-cyan-500">Dashboard</span>
          </h1>
          <p className="text-gray-400 mt-2">Selamat datang, {user?.name}</p>
        </div>

        {shopStatus === 'no_shop' ? (
          <OpenShopForm token={token} onShopCreated={handleShopCreated} />
        ) : (
          <ProductForm token={token} shopId={shopId} />
        )}
      </div>
    </div>
  );
}
