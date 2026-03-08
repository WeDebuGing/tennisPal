import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
        <div className="bg-white rounded-xl shadow p-6 w-full max-w-sm space-y-4 text-center">
          <h1 className="text-2xl font-bold text-green-700">🎾 TennisPal</h1>
          <div className="text-4xl">📧</div>
          <h2 className="text-lg font-semibold text-gray-800">Check your email</h2>
          <p className="text-sm text-gray-500">
            If an account with that email exists, we've sent a password reset link. It expires in 1 hour.
          </p>
          <Link to="/login" className="block text-green-600 font-semibold text-sm hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
      <form onSubmit={submit} className="bg-white rounded-xl shadow p-6 w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-green-700 text-center">🎾 TennisPal</h1>
        <h2 className="text-lg font-semibold text-gray-800 text-center">Forgot your password?</h2>
        <p className="text-sm text-gray-500 text-center">
          Enter your email and we'll send you a link to reset your password.
        </p>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input
          className="w-full border rounded-lg p-3"
          type="email"
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <button
          className="w-full bg-green-600 text-white rounded-lg p-3 font-semibold hover:bg-green-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Sending…' : 'Send Reset Link'}
        </button>
        <p className="text-center text-sm text-gray-500">
          <Link to="/login" className="text-green-600 font-semibold">Back to Login</Link>
        </p>
      </form>
    </div>
  );
}
