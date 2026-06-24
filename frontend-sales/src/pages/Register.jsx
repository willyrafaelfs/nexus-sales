import { useState } from 'react';
import { Link } from 'react-router-dom';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState({});     // error per-field dari server (422)
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fieldError = (field) => errors[field]?.[0];

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setGeneralError('');

    try {
      const response = await fetch('http://localhost:8888/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });

      const data = await response.json();

      if (response.ok && data.user) {
        // Simpan user & token PERSIS seperti alur login (key yang sama)
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.token) localStorage.setItem('token', data.token);

        alert(`Akun berhasil dibuat. Selamat datang, ${data.user.name}!`);

        // Auto-login: arahkan sesuai role (akun baru selalu 'customer')
        if (data.user.role === 'admin') {
          window.location.href = '/admin';
        } else if (data.user.role === 'seller') {
          window.location.href = '/seller';
        } else {
          window.location.href = '/';
        }
      } else if (response.status === 422) {
        // Tampilkan error validasi dari server (mis. email sudah terdaftar)
        setErrors(data.errors || {});
        setGeneralError(data.message || 'Periksa kembali isian form.');
      } else {
        setGeneralError(data.message || 'Registrasi gagal. Silakan coba lagi.');
      }
    } catch (err) {
      console.error('Register error:', err);
      setGeneralError('Koneksi ke server gagal. Pastikan server berjalan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col justify-center items-center p-4 selection:bg-cyan-500 selection:text-white">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.05)] relative overflow-hidden">

        <div className="absolute -top-10 -left-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 text-center mb-8">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
            CREATE ACCOUNT
          </h1>
          <p className="text-gray-500 mt-2 text-sm uppercase tracking-widest">Register New Identity</p>
        </div>

        {generalError && (
          <div className="mb-6 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-sm text-center font-medium">
            {generalError}
          </div>
        )}

        <form onSubmit={handleRegister} className="relative z-10 space-y-5">
          <div>
            <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2 font-semibold">Nama Lengkap</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 text-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              placeholder="Budi Santoso"
            />
            {fieldError('name') && <p className="text-red-400 text-xs mt-1">{fieldError('name')}</p>}
          </div>

          <div>
            <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2 font-semibold">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 text-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              placeholder="budi@nexus.com"
            />
            {fieldError('email') && <p className="text-red-400 text-xs mt-1">{fieldError('email')}</p>}
          </div>

          <div>
            <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2 font-semibold">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 text-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              placeholder="Minimal 8 karakter"
            />
            {fieldError('password') && <p className="text-red-400 text-xs mt-1">{fieldError('password')}</p>}
          </div>

          <div>
            <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2 font-semibold">Konfirmasi Password</label>
            <input
              type="password"
              required
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 text-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              placeholder="Ulangi password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold py-3.5 rounded-lg border border-cyan-500/50 transition-all mt-4 uppercase tracking-wider shadow-[0_0_15px_rgba(34,211,238,0.1)] hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]"
          >
            {isLoading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
          </button>
        </form>

        {/* Link silang ke login */}
        <p className="relative z-10 text-center text-gray-500 text-sm mt-6">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
