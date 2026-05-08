import { useState, useEffect } from 'react';

function Admin() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mengambil data pesanan dari API Laravel
    fetch('http://localhost:8888/api/orders')
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  // Menghitung total pendapatan (Revenue)
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_price), 0);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8 font-sans selection:bg-cyan-500 selection:text-white">
      <header className="max-w-6xl mx-auto mb-10">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
          COMMAND CENTER
        </h1>
        <p className="text-gray-400 text-sm tracking-widest mt-1">SYSTEM REVENUE & ORDER TRACKING</p>
      </header>

      <main className="max-w-6xl mx-auto">
        {/* Ringkasan Data (Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.05)]">
            <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Total Orders</h3>
            <p className="text-4xl font-bold text-white">{orders.length}</p>
          </div>
          <div className="bg-gray-900 border border-cyan-900/50 p-6 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.1)] relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl"></div>
            <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Total Revenue</h3>
            <p className="text-4xl font-bold text-cyan-400">Rp {totalRevenue.toLocaleString('id-ID')}</p>
          </div>
        </div>

        {/* Tabel Pesanan */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-gray-800">
            <h2 className="text-lg font-bold text-gray-200">Recent Transactions</h2>
          </div>
          
          {isLoading ? (
             <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500"></div></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-950/50 text-gray-400 text-sm uppercase tracking-wider">
                    <th className="p-4 font-medium">Order ID</th>
                    <th className="p-4 font-medium">Customer</th>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Total Price</th>
                    <th className="p-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {orders.length === 0 ? (
                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">No transactions found.</td></tr>
                  ) : (
                    orders.map(order => (
                      <tr key={order.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="p-4 font-mono text-cyan-500">#{order.id}</td>
                        <td className="p-4 text-gray-200 font-medium">{order.customer_name}</td>
                        <td className="p-4 text-gray-400 text-sm">{new Date(order.created_at).toLocaleDateString('id-ID')}</td>
                        <td className="p-4 font-bold text-gray-300">Rp {Number(order.total_price).toLocaleString('id-ID')}</td>
                        <td className="p-4">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                            {order.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Admin;