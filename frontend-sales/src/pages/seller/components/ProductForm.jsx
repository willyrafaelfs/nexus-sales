import { useState, useRef } from 'react';

export default function ProductForm({ token, shopId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadedProduct, setUploadedProduct] = useState(null);
  const formRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(formRef.current);

    // Otomatis menempelkan shopId milik user
    formData.append('shop_id', shopId);

    // 1. AMBIL TOKEN LANGSUNG DARI LOCAL STORAGE DI SINI
    const currentToken = localStorage.getItem('token');

    try {
      const response = await fetch('http://localhost:8888/api/products', {
        method: 'POST',
        headers: {
          // 2. GUNAKAN TOKEN YANG BARU DIAMBIL
          'Authorization': `Bearer ${currentToken}`,
          'Accept': 'application/json'
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        setUploadedProduct(data.product);
        formRef.current.reset();
        setPreviewUrl(null);
      } else {
        alert(data.message || 'Gagal upload produk. Pastikan format foto benar.');
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan koneksi server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 shadow-2xl">
        <h2 className="text-2xl font-bold text-cyan-400 mb-6 flex items-center gap-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Tambah Produk Baru
        </h2>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-400 text-sm font-semibold mb-2">Nama Produk</label>
            <input type="text" name="name" required className="w-full bg-gray-950 border border-gray-800 focus:border-cyan-500 rounded-lg px-4 py-3 text-white transition-colors" placeholder="Contoh: Keyboard Mechanical Nexus" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-gray-400 text-sm font-semibold mb-2">Harga (Rp)</label>
              <input type="number" name="price" min="0" required className="w-full bg-gray-950 border border-gray-800 focus:border-cyan-500 rounded-lg px-4 py-3 text-white transition-colors" placeholder="Contoh: 1500000" />
            </div>
            <div>
              <label className="block text-gray-400 text-sm font-semibold mb-2">Kategori</label>
              <input type="text" name="category" required className="w-full bg-gray-950 border border-gray-800 focus:border-cyan-500 rounded-lg px-4 py-3 text-white transition-colors" placeholder="Contoh: Aksesoris PC" />
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-semibold mb-2">Deskripsi Produk</label>
            <textarea name="description" rows="4" required className="w-full bg-gray-950 border border-gray-800 focus:border-cyan-500 rounded-lg px-4 py-3 text-white transition-colors" placeholder="Jelaskan spesifikasi dan detail produk..."></textarea>
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-semibold mb-2">Foto Produk Utama</label>
            <div className="flex items-center gap-6">
              <input
                type="file"
                name="foto_produk"
                accept="image/*"
                onChange={handleFileChange}
                required
                className="text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-cyan-600/20 file:text-cyan-400 hover:file:bg-cyan-600 hover:file:text-white transition-colors cursor-pointer"
              />
            </div>
            {/* Image Preview */}
            {previewUrl && (
              <div className="mt-4 animate-fade-in">
                <p className="text-sm text-gray-500 mb-2">Preview Gambar:</p>
                <div className="relative inline-block border-2 border-dashed border-gray-700 p-2 rounded-lg">
                  <img src={previewUrl} alt="Preview" className="h-40 object-contain rounded" />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full mt-8 font-bold py-3.5 rounded-lg uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(34,211,238,0.2)] ${isLoading
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white hover:shadow-[0_0_25px_rgba(34,211,238,0.4)]'
              }`}
          >
            {isLoading ? 'Sedang Mengunggah...' : 'Upload Produk'}
          </button>
        </form>
      </div>

      {/* UX Pasca-Upload: Tampilkan Card Real-time */}
      {uploadedProduct && (
        <div className="bg-emerald-900/20 border border-emerald-500/50 p-6 rounded-xl animate-fade-in shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-emerald-500 rounded-full p-1 text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h3 className="text-emerald-400 font-bold text-lg">Upload Berhasil!</h3>
          </div>
          <div className="flex gap-6 items-center">
            {uploadedProduct.link_gambar ? (
              <img src={uploadedProduct.link_gambar} alt={uploadedProduct.name} className="w-32 h-32 object-cover rounded-lg shadow border border-gray-700" />
            ) : (
              <div className="w-32 h-32 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
                <span className="text-gray-500 text-xs">No Image</span>
              </div>
            )}
            <div className="flex-1">
              <p className="font-bold text-xl text-white mb-1">{uploadedProduct.name}</p>
              <p className="text-cyan-400 font-mono font-semibold text-lg mb-2">Rp {Number(uploadedProduct.price).toLocaleString('id-ID')}</p>
              <span className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded inline-block mb-3">{uploadedProduct.category}</span>
              <p className="text-sm text-gray-400 line-clamp-2">{uploadedProduct.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
