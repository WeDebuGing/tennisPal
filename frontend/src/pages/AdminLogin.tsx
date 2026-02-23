import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function AdminLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/admin/login', { email, password });
      localStorage.setItem('admin_token', data.token);
      nav('/admin');
    } catch {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form onSubmit={submit} className="bg-white rounded-xl shadow-sm p-6 w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-green-700 text-center">🔐 Admin Login</h1>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
          className="w-full border rounded-lg p-3" required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full border rounded-lg p-3" required />
        <button disabled={loading} className="w-full bg-green-600 text-white rounded-lg p-3 font-semibold hover:bg-green-700 disabled:opacity-50">
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
