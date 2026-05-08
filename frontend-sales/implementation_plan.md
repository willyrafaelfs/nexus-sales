# Arsitektur Seller Dashboard (React)

Berdasarkan ekosistem yang sudah ada, berikut adalah arsitektur yang dirancang untuk mengelola Seller Dashboard. Arsitektur ini mencakup pembagian peran (RBAC), alur "Buka Toko" dinamis, dan mekanisme formulir produk (upload gambar).

## 1. Pembagian Struktur Komponen (Folder Structure)

Untuk menjaga *clean code*, kita akan membagi komponen menjadi:

*   `src/components/routes/ProtectedCustomerRoute.jsx`: *Middleware* pembatas akses untuk Customer/Seller.
*   `src/pages/seller/SellerDashboard.jsx`: *Smart Component* yang mengecek apakah user sudah punya toko atau belum, dan menampilkan form yang sesuai.
*   `src/pages/seller/components/OpenShopForm.jsx`: Komponen untuk mendaftarkan toko baru.
*   `src/pages/seller/components/ProductForm.jsx`: Komponen untuk upload barang dengan `multipart/form-data`.

---

## 2. Setup RBAC & Routing (App.jsx)

Kita tambahkan `ProtectedCustomerRoute` untuk memastikan hanya akun dengan *role* `customer` yang bisa mengakses Seller Dashboard.

```jsx
// src/App.jsx (Pembaruan)
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import SellerDashboard from './pages/seller/SellerDashboard';

// Gembok Keamanan Admin (Sudah Ada)
const ProtectedAdminRoute = ({ children }) => {
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;
  return children;
};

// [NEW] Gembok Keamanan Customer / Seller
const ProtectedCustomerRoute = ({ children }) => {
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  // Jika belum login atau rolenya bukan customer, tendang ke login
  if (!user || user.role !== 'customer') return <Navigate to="/login" replace />;
  return children;
};

function App() {
  // ... Navbar dan state sebelumnya ...
  
  return (
    <BrowserRouter>
      {/* ... Navbar ... */}
      <Routes>
        {/* ... Rute Publik ... */}
        
        {/* Rute Admin */}
        <Route path="/admin" element={
          <ProtectedAdminRoute><Admin /></ProtectedAdminRoute>
        } />

        {/* Rute Seller / Customer */}
        <Route path="/seller/*" element={
          <ProtectedCustomerRoute><SellerDashboard /></ProtectedCustomerRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 3. Logika "Buka Toko" vs "Tambah Produk" (SellerDashboard.jsx)

Komponen ini bertanggung jawab mengecek API backend untuk melihat apakah pengguna saat ini sudah memiliki toko.

```jsx
// src/pages/seller/SellerDashboard.jsx
import { useState, useEffect } from 'react';
import OpenShopForm from './components/OpenShopForm';
import ProductForm from './components/ProductForm';

export default function SellerDashboard() {
  const [shopStatus, setShopStatus] = useState('checking'); // checking | no_shop | has_shop
  const [shopId, setShopId] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token')); // Ambil bearer token

  useEffect(() => {
    // Pengecekan ke backend apakah user punya toko
    const checkUserShop = async () => {
      try {
        const response = await fetch('http://localhost:8888/api/my-shop', {
          headers: { 'Authorization': `Bearer ${token}` }
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

    checkUserShop();
  }, [token]);

  // Callback sukses buka toko
  const handleShopCreated = (newShopId) => {
    setShopId(newShopId);
    setShopStatus('has_shop');
  };

  if (shopStatus === 'checking') {
    return <div className="p-8 text-center text-white">Memeriksa status toko...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 text-white">
      {shopStatus === 'no_shop' ? (
        <OpenShopForm token={token} onShopCreated={handleShopCreated} />
      ) : (
        <ProductForm token={token} shopId={shopId} />
      )}
    </div>
  );
}
```

---

## 4. ProductForm.jsx (Multipart Upload & UX Realtime)

Formulir ini memastikan data dikirim sebagai `FormData()` dan merender URL gambar secara real-time dari response MinIO.

```jsx
// src/pages/seller/components/ProductForm.jsx
import { useState, useRef } from 'react';

export default function ProductForm({ token, shopId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadedProduct, setUploadedProduct] = useState(null); // Menyimpan hasil upload
  const formRef = useRef(null);

  // Handle perubahan file untuk memunculkan Image Preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // [PENTING] Menggunakan FormData untuk Multipart Upload
    const formData = new FormData(formRef.current);
    
    // Otomatis menempelkan shopId milik user saat ini (tidak hardcode)
    formData.append('shop_id', shopId);

    try {
      const response = await fetch('http://localhost:8888/api/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
          // Catatan: Jangan set Content-Type ke application/json saat pakai FormData!
          // Browser akan otomatis menyetel Content-Type multipart boundary.
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        // [UX] Simpan hasil produk untuk ditampilkan real-time
        setUploadedProduct(data.product); 
        formRef.current.reset();
        setPreviewUrl(null);
      } else {
        alert(data.message || 'Gagal upload produk');
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan koneksi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-cyan-400">Tambah Produk Baru</h2>
      
      <form ref={formRef} onSubmit={handleSubmit} className="bg-gray-900 p-6 rounded-xl border border-gray-800 space-y-4">
        <div>
          <label className="block text-gray-400 text-sm mb-2">Nama Produk</label>
          <input type="text" name="name" required className="w-full bg-gray-800 rounded px-4 py-2" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">Harga</label>
            <input type="number" name="price" required className="w-full bg-gray-800 rounded px-4 py-2" />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-2">Kategori</label>
            <input type="text" name="category" required className="w-full bg-gray-800 rounded px-4 py-2" />
          </div>
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-2">Deskripsi</label>
          <textarea name="description" rows="3" required className="w-full bg-gray-800 rounded px-4 py-2"></textarea>
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-2">Foto Produk</label>
          <input type="file" name="foto_produk" accept="image/*" onChange={handleFileChange} required className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-600/20 file:text-cyan-400 hover:file:bg-cyan-600 hover:file:text-white transition-colors" />
        </div>

        {/* Image Preview */}
        {previewUrl && (
          <div className="mt-4">
            <p className="text-sm text-gray-400 mb-2">Preview:</p>
            <img src={previewUrl} alt="Preview" className="h-32 rounded-lg border border-gray-700" />
          </div>
        )}

        <button type="submit" disabled={isLoading} className="w-full mt-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg transition-colors">
          {isLoading ? 'Sedang Mengunggah...' : 'Upload Produk'}
        </button>
      </form>

      {/* UX Pasca-Upload: Tampilkan Card Real-time */}
      {uploadedProduct && (
        <div className="mt-8 bg-green-900/20 border border-green-500/50 p-6 rounded-xl animate-fade-in">
          <h3 className="text-green-400 font-bold mb-4">Upload Berhasil!</h3>
          <div className="flex gap-4 items-center">
            {/* Menggunakan URL dari MinIO langsung (link_gambar) */}
            <img src={uploadedProduct.link_gambar} alt={uploadedProduct.name} className="w-24 h-24 object-cover rounded shadow" />
            <div>
              <p className="font-bold text-lg">{uploadedProduct.name}</p>
              <p className="text-cyan-400 font-mono">Rp {uploadedProduct.price}</p>
              <p className="text-sm text-gray-400 line-clamp-2">{uploadedProduct.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

## User Review Required
> [!IMPORTANT]
> Saat ini, pada backend Laravel, belum terdapat endpoint API `GET /api/my-shop` (untuk memeriksa status toko user) dan `POST /api/shops` (untuk membuat toko baru). Apakah Anda ingin saya **hanya** membuat kerangka front-end React-nya terlebih dahulu seperti desain di atas, atau Anda ingin saya juga **sekaligus membuatkan controller dan routes backend** untuk fitur `shops` ini?
