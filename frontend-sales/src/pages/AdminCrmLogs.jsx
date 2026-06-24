import { useState, useEffect, useCallback, Fragment } from 'react';
import { Link } from 'react-router-dom';

const API = 'http://localhost:8888/api';

const EVENT_STYLE = {
  order_paid:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  order_shipped: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  order_created: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
};

export default function AdminCrmLogs() {
  const [page, setPage] = useState(1);
  const [paginator, setPaginator] = useState(null); // response paginator dari Laravel
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [forbidden, setForbidden] = useState(false);
  const [expanded, setExpanded] = useState({}); // { [logId]: true }

  const fetchLogs = useCallback(async (pageNum) => {
    setIsLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/admin/crm/logs?page=${pageNum}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (res.status === 403) { setForbidden(true); setIsLoading(false); return; }
      if (!res.ok) throw new Error('Gagal mengambil log CRM.');
      const json = await res.json();
      setPaginator(json.data); // paginator: {data:[], current_page, last_page, ...}
    } catch (e) {
      setError(e.message || 'Terjadi kesalahan koneksi.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(page); }, [page, fetchLogs]);

  const toggleExpand = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  if (forbidden) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col justify-center items-center p-6 text-white">
        <h2 className="text-2xl font-black uppercase tracking-wider mb-2">Akses Ditolak</h2>
        <p className="text-gray-400 text-sm mb-6">Hanya Super Admin yang boleh melihat log CRM.</p>
        <Link to="/" className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold text-xs uppercase">Beranda</Link>
      </div>
    );
  }

  const rows = paginator?.data || [];
  const currentPage = paginator?.current_page || 1;
  const lastPage = paginator?.last_page || 1;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-900 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-wider text-white uppercase">
              CRM <span className="text-cyan-500">Activity Logs</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">Jejak interaksi pelanggan: pembayaran, pengiriman, dan event lainnya.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchLogs(page)}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 border border-gray-800 hover:border-cyan-500/50 rounded-xl text-xs font-semibold transition-all text-gray-300 hover:text-white disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 19v-3" />
              </svg>
              Segarkan
            </button>
            <Link to="/admin" className="px-4 py-2.5 bg-gray-900 border border-gray-800 hover:border-cyan-500/50 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition-all">
              &larr; Dashboard
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-500/40 rounded-lg text-red-400 text-sm">{error}</div>
        )}

        {/* Tabel */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-950/50 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-850">
                  <th className="p-4 font-bold">Waktu</th>
                  <th className="p-4 font-bold">Event</th>
                  <th className="p-4 font-bold">Customer</th>
                  <th className="p-4 font-bold">Order</th>
                  <th className="p-4 font-bold">Deskripsi</th>
                  <th className="p-4 font-bold text-center">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-850">
                {isLoading ? (
                  <tr><td colSpan="6" className="p-10 text-center text-gray-500 text-sm">Memuat...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan="6" className="p-10 text-center text-gray-500 text-sm">Belum ada aktivitas CRM tercatat.</td></tr>
                ) : (
                  rows.map((log) => (
                    <Fragment key={log.id}>
                      <tr className="hover:bg-gray-850/30 transition-colors align-top">
                        <td className="p-4 text-xs text-gray-400 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('id-ID')}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${EVENT_STYLE[log.event_type] || 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                            {log.event_type}
                          </span>
                        </td>
                        <td className="p-4 text-sm">
                          {log.user ? (
                            <div>
                              <p className="text-white font-medium">{log.user.name}</p>
                              <p className="text-gray-500 text-xs">{log.user.email}</p>
                            </div>
                          ) : <span className="text-gray-600 text-xs">—</span>}
                        </td>
                        <td className="p-4 text-sm font-mono text-cyan-400">
                          {log.order_id ? `#${log.order_id}` : <span className="text-gray-600">—</span>}
                        </td>
                        <td className="p-4 text-sm text-gray-300 max-w-xs">{log.description || '—'}</td>
                        <td className="p-4 text-center">
                          {log.payload ? (
                            <button
                              onClick={() => toggleExpand(log.id)}
                              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 underline"
                            >
                              {expanded[log.id] ? 'Tutup' : 'Lihat'}
                            </button>
                          ) : <span className="text-gray-600 text-xs">—</span>}
                        </td>
                      </tr>
                      {expanded[log.id] && log.payload && (
                        <tr className="bg-gray-950/60">
                          <td colSpan="6" className="p-4">
                            <pre className="text-xs text-cyan-300 bg-gray-950 border border-gray-800 rounded-lg p-4 overflow-x-auto">
{JSON.stringify(log.payload, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-gray-850 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Halaman {currentPage} dari {lastPage} &middot; total {paginator?.total ?? 0} log
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || isLoading}
                className="px-3 py-1.5 bg-gray-950 border border-gray-800 rounded-lg text-xs font-semibold text-gray-300 disabled:opacity-40 hover:border-cyan-500/50 transition-all"
              >
                Sebelumnya
              </button>
              <button
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                disabled={currentPage >= lastPage || isLoading}
                className="px-3 py-1.5 bg-gray-950 border border-gray-800 rounded-lg text-xs font-semibold text-gray-300 disabled:opacity-40 hover:border-cyan-500/50 transition-all"
              >
                Berikutnya
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
