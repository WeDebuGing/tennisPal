import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
        <div className="bg-white rounded-xl shadow p-6 w-full max-w-sm space-y-4 text-center">
          <h1 className="text-2xl font-bold text-green-700">🎾 TennisPal</h1>
          <p className="text-red-500 text-sm">Invalid reset link. No token provided.</p>
          <Link to="/forgot-password" className="block text-green-600 font-semibold text-sm hover:underline">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
        <div className="bg-white rounded-xl shadow p-6 w-full max-w-sm space-y-4 text-center">
          <h1 className="text-2xl font-bold text-green-700">🎾 TennisPal</h1>
          <div className="text-4xl">✅</div>
          <h2 className="text-lg font-semibold text-gray-800">Password reset!</h2>
          <p className="text-sm text-gray-500">Your password has been updated. You can now log in.</p>
          <Link
            to="/login"
            className="block w-full bg-green-600 text-white rounded-lg p-3 font-semibold hover:bg-green-700 text-center"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
      <form onSubmit={submit} className="bg-white rounded-xl shadow p-6 w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-green-700 text-center">🎾 TennisPal</h1>
        <h2 className="text-lg font-semibold text-gray-800 text-center">Set a new password</h2>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input
          className="w-full border rounded-lg p-3"
          type="password"
          placeholder="New password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <input
          className="w-full border rounded-lg p-3"
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
        />
        <button
          className="w-full bg-green-600 text-white rounded-lg p-3 font-semibold hover:bg-green-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Resetting…' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}
