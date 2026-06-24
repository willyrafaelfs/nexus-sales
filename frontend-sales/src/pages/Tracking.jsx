import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';

const API = 'http://localhost:8888/api';

// Label & warna status pengiriman
const STATUS_STYLE = {
  shipped:    { dot: 'bg-yellow-400', label: 'Menunggu Penjemputan' },
  picked_up:  { dot: 'bg-blue-400',   label: 'Dijemput Kurir' },
  in_transit: { dot: 'bg-cyan-400',   label: 'Dalam Perjalanan' },
  delivered:  { dot: 'bg-green-400',  label: 'Terkirim' },
};

function Tracking() {
  const { orderId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTracking = useCallback(async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/orders/${orderId}/shipments`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (res.status === 401) { setError('Sesi berakhir, silakan login kembali.'); return; }
      if (res.status === 403) { setError('Anda tidak berhak melihat pengiriman order ini.'); return; }
      if (!res.ok) { setError('Gagal memuat data pengiriman.'); return; }
      const json = await res.json();
      setData(json.data);
    } catch (e) {
      setError('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { fetchTracking(); }, [fetchTracking]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl mt-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
              LACAK PENGIRIMAN
            </h1>
            <p className="text-gray-500 text-sm mt-1 uppercase tracking-widest">Order #NEX-{orderId}</p>
          </div>
          <Link to="/orders" className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold">&larr; Pesanan Saya</Link>
        </div>

        {loading && <p className="text-cyan-400">Memuat...</p>}

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-sm">{error}</div>
        )}

        {data && (
          <div className="space-y-6">
            {/* Shipment per shop */}
            {data.shipments.length === 0 && data.unshipped_items.length === 0 && (
              <p className="text-gray-500">Belum ada item pada order ini.</p>
            )}

            {data.shipments.map((s) => {
              const style = STATUS_STYLE[s.status] || { dot: 'bg-gray-500', label: s.status };
              return (
                <div key={s.shipment_id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-800">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Toko</p>
                      <p className="font-semibold text-white">{s.shop || '—'}</p>
                      <p className="text-xs text-gray-500 uppercase mt-2">Resi</p>
                      <p className="font-mono text-cyan-400">{s.tracking_number}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase">Kurir</p>
                      <p className="font-semibold">{s.courier} ({s.service})</p>
                      <span className="inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                        {style.label}
                      </span>
                    </div>
                  </div>

                  {/* Item dalam shipment ini */}
                  <div className="mb-4 text-sm text-gray-400">
                    {s.items.map((it, i) => (
                      <span key={i} className="inline-block bg-gray-950 border border-gray-800 rounded px-2 py-0.5 mr-2 mb-1">
                        {it.name} &times;{it.quantity}
                      </span>
                    ))}
                  </div>

                  {/* Timeline NYATA dari tracking_events */}
                  <ol className="relative border-l border-gray-700 ml-3">
                    {[...s.tracking_events].reverse().map((ev, i) => {
                      const evStyle = STATUS_STYLE[ev.code] || { dot: 'bg-gray-500', label: ev.code };
                      const isLatest = i === 0;
                      return (
                        <li key={i} className="mb-6 ml-6">
                          <span className={`absolute -left-2.5 w-5 h-5 rounded-full border-2 border-gray-950 ${evStyle.dot} ${isLatest ? 'ring-4 ring-cyan-500/20' : ''}`}></span>
                          <h3 className={`font-semibold text-sm ${isLatest ? 'text-cyan-400' : 'text-gray-300'}`}>{evStyle.label}</h3>
                          <p className="text-xs text-gray-400">{ev.description}</p>
                          <time className="text-xs text-gray-600">{new Date(ev.time).toLocaleString('id-ID')}</time>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              );
            })}

            {/* Item yang belum dikirim penjual */}
            {data.unshipped_items.length > 0 && (
              <div className="bg-gray-900 border border-amber-500/30 rounded-2xl p-6">
                <h3 className="font-semibold text-amber-400 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
                  Diproses — belum dikirim penjual
                </h3>
                <div className="space-y-2">
                  {data.unshipped_items.map((it) => (
                    <div key={it.order_item_id} className="flex justify-between text-sm text-gray-300 bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2">
                      <span>{it.name} <span className="text-gray-500">&times;{it.quantity}</span></span>
                      <span className="text-amber-400 text-xs">{it.shop} · menunggu penjual</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Tracking;
