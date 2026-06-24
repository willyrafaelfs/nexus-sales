import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const { addToCart, updateQuantity, cart, setIsCartOpen } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`http://localhost:8888/api/products/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Product not found');
        return res.json();
      })
      .then(json => {
        setProduct(json.data);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;

    // GERBANG: tamu (belum login) tidak boleh menambah ke keranjang
    if (!localStorage.getItem('token')) {
      localStorage.setItem('returnTo', window.location.pathname); // kembali ke sini setelah login
      alert('Masuk dulu untuk berbelanja.');
      navigate('/login');
      return;
    }

    // Check if already in cart
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      updateQuantity(product.id, quantity);
      setIsCartOpen(true);
    } else {
      addToCart({ ...product, quantity });
      // addToCart currently hardcodes quantity: 1, let's fix it slightly by using a modified addToCart or updating right after.
      // Actually, since addToCart from context just adds with quantity: 1 if it doesn't exist, we can use updateQuantity after.
      // Wait, let's just implement a better logic here:
      if (quantity > 1) {
          setTimeout(() => updateQuantity(product.id, quantity - 1), 50);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col justify-center items-center text-gray-100">
        <svg className="w-16 h-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
        <Link to="/" className="text-cyan-400 hover:underline">Return to Store</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 py-12 px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <Link to="/" className="inline-flex items-center text-gray-400 hover:text-cyan-400 transition-colors mb-8 text-sm font-semibold uppercase tracking-wider">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Catalog
        </Link>
        
        <div className="flex flex-col md:flex-row gap-12 bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl">
          {/* Image Section */}
          <div className="w-full md:w-1/2 flex justify-center items-center bg-gray-800 rounded-xl overflow-hidden aspect-square border border-gray-700">
            {product.image ? (
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <svg className="w-24 h-24 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            )}
          </div>

          {/* Details Section */}
          <div className="w-full md:w-1/2 flex flex-col justify-center">
            {product.shop && (
              <span className="inline-block bg-gray-800 text-cyan-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 w-max border border-gray-700">
                {product.shop.nama_toko}
              </span>
            )}
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
              {product.name}
            </h1>
            
            <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-6">
              Rp {Number(product.price).toLocaleString('id-ID')}
            </p>
            
            <div className="border-t border-b border-gray-800 py-6 mb-8">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Description</h3>
              <p className="text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">
                {product.description || "No description provided for this product."}
              </p>
            </div>

            {/* Quantity and Cart Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-center mt-auto">
              <div className="flex items-center bg-gray-950 border border-gray-700 rounded-lg p-1 w-full sm:w-auto justify-between">
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors text-xl font-bold"
                >
                  &minus;
                </button>
                <span className="w-12 text-center font-bold text-lg text-white">{quantity}</span>
                <button 
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors text-xl font-bold"
                >
                  &#43;
                </button>
              </div>

              <button 
                onClick={handleAddToCart}
                className="flex-1 w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3.5 px-6 rounded-lg transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                ADD TO CART
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
