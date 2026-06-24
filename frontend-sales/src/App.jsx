import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Shop from './pages/Shop';
import AdminDashboard from './pages/AdminDashboard';
import AdminCrmLogs from './pages/AdminCrmLogs';
import Login from './pages/Login';
import SellerDashboard from './pages/seller/SellerDashboard';
import CreateShop from './pages/seller/CreateShop';
import ProductDetail from './pages/ProductDetail';
import MyOrders from './pages/MyOrders';
import Tracking from './pages/Tracking';
import Navbar from './components/Navbar';
import CartPanel from './components/CartPanel';
import { CartProvider } from './context/CartContext';

// === GEMBOK KEAMANAN 1: Hanya Admin ===
// Jika bukan admin, tendang ke Beranda.
const ProtectedAdminRoute = ({ children }) => {
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

// === GEMBOK KEAMANAN 2: Hanya Seller ===
// Jika customer (belum punya toko), arahkan ke halaman buat toko.
// Jika admin, tendang ke Beranda.
const ProtectedSellerRoute = ({ children }) => {
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/" replace />;
  if (user.role === 'customer') return <Navigate to="/create-shop" replace />;
  if (user.role !== 'seller') return <Navigate to="/" replace />;
  return children;
};

// === GEMBOK KEAMANAN 3: Customer & Seller (Belanja) ===
// Izinkan customer dan seller untuk berbelanja, blokir admin.
const ProtectedCustomerRoute = ({ children }) => {
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Navbar />
        <CartPanel />

      {/* Pengatur Jalan (Router) */}
      <Routes>
        <Route path="/" element={<Shop />} />
        <Route path="/login" element={<Login />} />
        
        {/* Rute Admin — hanya role admin */}
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />

        {/* CRM Activity Logs — hanya admin */}
        <Route
          path="/admin/crm"
          element={
            <ProtectedAdminRoute>
              <AdminCrmLogs />
            </ProtectedAdminRoute>
          }
        />

        {/* Rute Seller Dashboard — hanya role seller */}
        <Route 
          path="/seller/*" 
          element={
            <ProtectedSellerRoute>
              <SellerDashboard />
            </ProtectedSellerRoute>
          } 
        />

        {/* Rute Buka Toko — customer yang ingin naik pangkat */}
        <Route 
          path="/create-shop" 
          element={
            <ProtectedCustomerRoute>
              <CreateShop />
            </ProtectedCustomerRoute>
          } 
        />

        <Route 
          path="/orders" 
          element={
            <ProtectedCustomerRoute>
              <MyOrders />
            </ProtectedCustomerRoute>
          } 
        />

        <Route path="/product/:id" element={<ProductDetail />} />

        {/* Tracking pengiriman per-order — wajib login & pemilik order */}
        <Route
          path="/orders/:orderId/tracking"
          element={
            <ProtectedCustomerRoute>
              <Tracking />
            </ProtectedCustomerRoute>
          }
        />
      </Routes>
    </BrowserRouter>
    </CartProvider>
  );
}

export default App;