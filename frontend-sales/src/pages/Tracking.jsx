import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API = 'http://localhost:8888/api';

// Warna status untuk timeline
const STATUS_STYLE = {
  created:    { dot: 'bg-yellow-400', label: 'Dibuat' },
  picked_up:  { dot: 'bg-blue-400',   label: 'Dijemput' },
  in_transit: { dot: 'bg-cyan-400',   label: 'Dalam Perjalanan' },
  delivered:  { dot: 'bg-green-400',  label: 'Terkirim' },
};

function Tracking() {
  const { tracking } = useParams();
  const navigate = useNavigate();

  const [resi, setResi] = useState(tracking || '');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchTracking = useCallback(async (code) => {
    if (!code) return;
    setLoading(true);
    setError('');
    setData(null);
    try {
      const res = await fetch(`${API}/shipments/${code}/track`);
      const json = await res.json();
      if (res.ok && json.data) {
        setData(json.data);
      } else {
        setError(json.message || 'Resi tidak ditemukan.');
      }
    } catch (e) {
      setError('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch jika resi ada di URL
  useEffect(() => {
    if (tracking) fetchTracking(tracking);
  }, [tracking, fetchTracking]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (resi) navigate(`/track/${resi}`);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 p-6 flex flex-col items-center">
      <div className="w-full max-w-xl mt-10">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-2">
          LACAK PENGIRIMAN
        </h1>
        <p className="text-gray-500 text-sm mb-6 uppercase tracking-widest">Masukkan nomor resi</p>

        <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
          <input
            value={resi}
            onChange={(e) => setResi(e.target.value)}
            placeholder="KRM..."
            className="flex-1 bg-gray-900 border border-gray-800 px-4 py-3 rounded-lg focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            className="bg-cyan-600 hover:bg-cyan-500 px-6 rounded-lg font-bold transition-all"
          >
            Lacak
          </button>
        </form>

        {loading && <p className="text-cyan-400">Memuat...</p>}

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {data && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-800">
              <div>
                <p className="text-xs text-gray-500 uppercase">Resi</p>
                <p className="font-mono text-cyan-400">{data.tracking_number}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase">Kurir</p>
                <p className="font-semibold">{data.courier} ({data.service})</p>
              </div>
            </div>

            {/* Timeline status */}
            <ol className="relative border-l border-gray-700 ml-3">
              {data.history.map((h, i) => {
                const style = STATUS_STYLE[h.status] || { dot: 'bg-gray-500', label: h.status };
                const isLatest = i === data.history.length - 1;
                return (
                  <li key={i} className="mb-8 ml-6">
                    <span className={`absolute -left-2.5 w-5 h-5 rounded-full border-2 border-gray-950 ${style.dot} ${isLatest ? 'ring-4 ring-cyan-500/20' : ''}`}></span>
                    <h3 className={`font-semibold ${isLatest ? 'text-cyan-400' : 'text-gray-300'}`}>
                      {style.label}
                    </h3>
                    <p className="text-sm text-gray-400">{h.description}</p>
                    <time className="text-xs text-gray-600">
                      {new Date(h.timestamp).toLocaleString('id-ID')}
                    </time>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

export default Tracking;
