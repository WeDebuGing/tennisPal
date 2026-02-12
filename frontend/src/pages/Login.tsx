import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', { identifier, password });
      login(data.token, data.user);
      nav('/');
    } catch (err: any) { setError(err.response?.data?.error || 'Login failed'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
      <form onSubmit={submit} className="bg-white rounded-xl shadow p-6 w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-green-700 text-center">🎾 TennisPal</h1>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input className="w-full border rounded-lg p-3" placeholder="Email or Phone" value={identifier} onChange={e => setIdentifier(e.target.value)} />
        <input className="w-full border rounded-lg p-3" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="w-full bg-green-600 text-white rounded-lg p-3 font-semibold hover:bg-green-700">Log In</button>
        <p className="text-center text-sm text-gray-500">Don't have an account? <Link to="/register" className="text-green-600 font-semibold">Register</Link></p>
      </form>
    </div>
  );
}
