import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Shop() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // 1. Ambil data produk saat web dibuka
  useEffect(() => {
    fetch('http://localhost:8888/api/products')
      .then(res => res.json())
      .then(json => {
        setProducts(json.data || []);
        setIsLoading(false);
      })
      .catch(err => console.error("Gagal load produk:", err));
  }, []);

  // === FITUR PENCARIAN ===
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8 font-sans selection:bg-cyan-500 selection:text-white">
      
      {/* --- HEADER & SEARCH --- */}
      <header className="max-w-6xl mx-auto mb-12 flex flex-col items-center gap-6">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
          EXPLORE CATALOG
        </h1>
        <div className="w-full max-w-2xl relative">
          <input 
            type="text" 
            placeholder="Search for modern tech, fashion, or accessories..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 text-gray-200 pl-12 pr-4 py-4 rounded-full focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all shadow-lg"
          />
          <svg className="w-6 h-6 text-gray-500 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
      </header>

      {/* --- GRID PRODUK --- */}
      <main className="max-w-6xl mx-auto">
        {isLoading ? (
           <div className="flex justify-center items-center h-40">
             <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500"></div>
           </div>
        ) : filteredProducts.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-64 text-gray-500">
             <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             <p className="text-xl">No products found for "{search}"</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Link 
                to={`/product/${product.id}`}
                key={product.id} 
                className="group bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all duration-300 flex flex-col justify-between shadow-lg hover:shadow-cyan-500/5 cursor-pointer block"
              >
                {/* Gambar Produk */}
                <div className="relative w-full h-56 bg-gray-800 overflow-hidden">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  {/* Fallback */}
                  <div 
                    className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center"
                    style={{ display: product.image ? 'none' : 'flex' }}
                  >
                    <svg className="w-12 h-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  {/* Nama Toko Penjual */}
                  {product.shop && (
                    <span className="text-xs font-semibold text-cyan-500 uppercase tracking-wider mb-1 block truncate">
                      {product.shop.nama_toko}
                    </span>
                  )}
                  <h2 className="text-lg font-bold text-gray-100 mb-2 leading-tight group-hover:text-cyan-400 transition-colors">
                    {product.name}
                  </h2>
                  <p className="text-xl font-light text-gray-300 mb-2 mt-auto">
                    Rp {Number(product.price).toLocaleString('id-ID')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Shop;