import { useState } from 'react';

export default function CreateShop() {
  const [namaToko, setNamaToko] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const token = localStorage.getItem('token');

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
        // === NAIK PANGKAT: Update role di localStorage ===
        // Backend sudah mengubah role dari 'customer' menjadi 'seller' di database.
        // Sekarang kita sinkronkan di sisi client agar React tahu role barunya.
        if (data.new_role) {
          let updatedUser = JSON.parse(localStorage.getItem('user'));
          updatedUser.role = data.new_role; // 'seller'
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }

        alert(`Toko "${data.shop.nama_toko}" berhasil dibuat! Anda kini resmi menjadi Seller.`);
        
        // Redirect ke Seller Dashboard dengan full-reload agar navbar & route ter-update
        window.location.href = '/seller';
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
    <div className="min-h-screen bg-gray-950 pt-10">
      <div className="max-w-xl mx-auto p-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-2xl animate-fade-in">
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-tr from-cyan-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.3)]">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-cyan-400 mb-2">Buka Toko Anda</h2>
            <p className="text-gray-400 text-sm">
              Halo, <span className="text-white font-semibold">{user?.name}</span>! Daftarkan toko Anda untuk mulai berjualan di NEXUS Marketplace.
            </p>
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

          <p className="text-center text-gray-600 text-xs mt-6">
            Dengan membuka toko, akun Anda akan otomatis menjadi <span className="text-cyan-500 font-semibold">Seller</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
