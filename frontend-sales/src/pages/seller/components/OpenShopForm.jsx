import { useState } from 'react';

export default function OpenShopForm({ token, onShopCreated }) {
  const [namaToko, setNamaToko] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8888/api/shop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nama_toko: namaToko,
          deskripsi: deskripsi
        })
      });

      const data = await response.json();

      if (response.ok && data.shop) {
        onShopCreated(data.shop.id);
      } else {
        setError(data.message || 'Gagal membuka toko. Silakan coba lagi.');
      }
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan jaringan. Gagal terhubung ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-2xl animate-fade-in max-w-xl mx-auto mt-10">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-cyan-400 mb-2">Buka Toko Anda</h2>
        <p className="text-gray-400 text-sm">Anda belum memiliki toko. Silakan daftar terlebih dahulu untuk mulai berjualan.</p>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm mb-6 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-400 text-sm font-semibold mb-2" htmlFor="namaToko">
            Nama Toko <span className="text-red-500">*</span>
          </label>
          <input
            id="namaToko"
            type="text"
            required
            value={namaToko}
            onChange={(e) => setNamaToko(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-lg px-4 py-3 text-white transition-colors"
            placeholder="Contoh: Nexus Tech Store"
          />
        </div>

        <div>
          <label className="block text-gray-400 text-sm font-semibold mb-2" htmlFor="deskripsi">
            Deskripsi Toko
          </label>
          <textarea
            id="deskripsi"
            rows="4"
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-lg px-4 py-3 text-white transition-colors"
            placeholder="Jelaskan secara singkat apa yang toko Anda jual..."
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full font-bold py-3 px-4 rounded-lg uppercase tracking-wider transition-all duration-300 shadow-[0_0_15px_rgba(34,211,238,0.2)] ${
            isLoading 
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
              : 'bg-cyan-600 hover:bg-cyan-500 text-white hover:shadow-[0_0_25px_rgba(34,211,238,0.4)]'
          }`}
        >
          {isLoading ? 'Mendaftarkan Toko...' : 'Buka Toko Sekarang'}
        </button>
      </form>
    </div>
  );
}
