import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function CheckEmail() {
  const { user, updateUser } = useAuth();
  const nav = useNavigate();
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const resend = async () => {
    setResending(true); setMessage(''); setError('');
    try {
      const { data } = await api.post('/auth/resend-verification');
      setMessage(data.message);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend.');
    } finally { setResending(false); }
  };

  const checkStatus = async () => {
    try {
      const { data } = await api.get('/auth/me');
      updateUser(data.user);
      if (data.user.email_verified) nav('/');
      else setError('Email not yet verified. Check your inbox!');
    } catch { setError('Could not check status.'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
      <div className="bg-white rounded-xl shadow p-8 w-full max-w-sm text-center space-y-4">
        <div className="text-4xl">📧</div>
        <h1 className="text-xl font-bold text-green-700">Check your email</h1>
        <p className="text-gray-600">
          We sent a verification link to <strong>{user?.email}</strong>. Click it to activate your account.
        </p>
        {message && <p className="text-green-600 text-sm">{message}</p>}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button onClick={resend} disabled={resending}
          className="w-full border border-green-600 text-green-600 rounded-lg p-3 font-semibold hover:bg-green-50 disabled:opacity-50">
          {resending ? 'Sending…' : 'Resend Email'}
        </button>
        <button onClick={checkStatus}
          className="w-full bg-green-600 text-white rounded-lg p-3 font-semibold hover:bg-green-700">
          I've verified — continue
        </button>
      </div>
    </div>
  );
}
