import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', ntrp: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const nav = useNavigate();
  const set = (k: string, v: string) => setForm({ ...form, [k]: v });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/register', { ...form, ntrp: form.ntrp || null });
      login(data.token, data.user);
      nav('/');
    } catch (err: any) { setError(err.response?.data?.error || 'Registration failed'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
      <form onSubmit={submit} className="bg-white rounded-xl shadow p-6 w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-green-700 text-center">Join TennisPal 🎾</h1>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input className="w-full border rounded-lg p-3" placeholder="Name" value={form.name} onChange={e => set('name', e.target.value)} required />
        <input className="w-full border rounded-lg p-3" placeholder="Email" value={form.email} onChange={e => set('email', e.target.value)} />
        <input className="w-full border rounded-lg p-3" placeholder="Phone" value={form.phone} onChange={e => set('phone', e.target.value)} />
        <input className="w-full border rounded-lg p-3" type="password" placeholder="Password" value={form.password} onChange={e => set('password', e.target.value)} required />
        <input className="w-full border rounded-lg p-3" placeholder="NTRP Level (optional)" value={form.ntrp} onChange={e => set('ntrp', e.target.value)} />
        <button className="w-full bg-green-600 text-white rounded-lg p-3 font-semibold hover:bg-green-700">Register</button>
        <p className="text-center text-sm text-gray-500">Already have an account? <Link to="/login" className="text-green-600 font-semibold">Log In</Link></p>
      </form>
    </div>
  );
}
