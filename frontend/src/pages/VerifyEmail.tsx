import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import Spinner from '../components/Spinner';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const { user, updateUser } = useAuth();

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('No verification token provided.'); return; }
    api.post('/auth/verify-email', { token })
      .then(r => {
        setStatus('success');
        setMessage(r.data.message);
        if (r.data.user && user) updateUser(r.data.user);
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification failed.');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
      <div className="bg-white rounded-xl shadow p-8 w-full max-w-sm text-center space-y-4">
        {status === 'loading' && <Spinner text="Verifying your email…" />}
        {status === 'success' && (
          <>
            <div className="text-4xl">✅</div>
            <h1 className="text-xl font-bold text-green-700">{message}</h1>
            <Link to="/" className="inline-block bg-green-600 text-white rounded-lg px-6 py-3 font-semibold hover:bg-green-700">
              Go to TennisPal
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-4xl">❌</div>
            <h1 className="text-xl font-bold text-red-600">Verification Failed</h1>
            <p className="text-gray-600">{message}</p>
            <Link to="/" className="inline-block text-green-600 font-semibold">Go Home</Link>
          </>
        )}
      </div>
    </div>
  );
}
