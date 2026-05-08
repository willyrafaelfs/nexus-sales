import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // FUNGSI BARU: "Jaring" penangkap balasan dari Google
  useEffect(() => {
    // Membaca URL saat ini (misal: /login?auth=eyJ... atau /login?error=...)
    const searchParams = new URLSearchParams(location.search);
    const authData = searchParams.get('auth');
    const authError = searchParams.get('error');

    if (authError) {
      setError('Google Authentication Failed or Cancelled.');
      // Bersihkan URL agar pesan error tidak nyangkut terus
      window.history.replaceState(null, '', '/login'); 
    } else if (authData) {
      try {
        // Menerjemahkan data rahasia (base64) dari Laravel kembali menjadi text
        const decodedData = atob(authData);
        const payload = JSON.parse(decodedData);
        const { user, token } = payload;

        // Simpan KTP & Token user ke browser
        localStorage.setItem('user', JSON.stringify(user));
        if (token) localStorage.setItem('token', token);
        
        alert(`Authentication Successful. Welcome, ${user.name}!`);

        // Arahkan tujuan sesuai jabatan (3 role)
        if (user.role === 'admin') {
          window.location.href = '/admin';
        } else if (user.role === 'seller') {
          window.location.href = '/seller';
        } else {
          window.location.href = '/'; // Customer → Beranda
        }
      } catch (err) {
        setError('Data corruption detected during Google Login.');
      }
    }
  }, [location, navigate]);

  const handleManualLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8888/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.user) {
        // Simpan user ke localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        // Simpan token jika ada
        if (data.token) localStorage.setItem('token', data.token);
        
        alert(`Welcome, ${data.user.name}! Access Granted.`);
        
        if (data.user.role === 'admin') {
          window.location.href = '/admin';
        } else if (data.user.role === 'seller') {
          window.location.href = '/seller';
        } else {
          window.location.href = '/'; // Customer → Beranda
        }
      } else {
        // Server merespons tapi login gagal
        setError(data.message || 'Invalid credentials. Check your email and password.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Connection to server lost. Make sure the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi Pemicu Login Google
  const handleGoogleLogin = () => {
    // Arahkan browser keluar dari React, menuju ke pintu API Laravel kita
    window.location.href = 'http://localhost:8888/api/auth/google';
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col justify-center items-center p-4 selection:bg-cyan-500 selection:text-white">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.05)] relative overflow-hidden">
        
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 text-center mb-8">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
            SYSTEM LOGIN
          </h1>
          <p className="text-gray-500 mt-2 text-sm uppercase tracking-widest">Identify Yourself</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleManualLogin} className="relative z-10 space-y-5">
          <div>
            <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2 font-semibold">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 text-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              placeholder="admin@nexus.com"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2 font-semibold">Security Key (Password)</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 text-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3.5 rounded-lg border border-gray-700 hover:border-gray-500 transition-all mt-4"
          >
            {isLoading ? 'Authenticating...' : 'STANDARD LOGIN'}
          </button>
        </form>

        {/* Garis Pemisah */}
        <div className="relative z-10 flex items-center py-6">
          <div className="flex-grow border-t border-gray-800"></div>
          <span className="flex-shrink-0 mx-4 text-gray-500 text-xs uppercase font-semibold">EXTERNAL OVERRIDE</span>
          <div className="flex-grow border-t border-gray-800"></div>
        </div>

        {/* Tombol Google OAuth */}
        <button 
          onClick={handleGoogleLogin}
          type="button"
          className="relative z-10 w-full bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-cyan-500/50 hover:bg-cyan-600 hover:text-white text-cyan-400 font-bold py-3.5 rounded-lg transition-all flex justify-center items-center gap-3 group shadow-[0_0_15px_rgba(34,211,238,0.1)] hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]"
        >
          {/* Ikon Google Sederhana */}
          <svg className="w-5 h-5 text-current group-hover:text-white transition-colors" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          INITIALIZE WITH GOOGLE
        </button>

      </div>
    </div>
  );
}

export default Login;