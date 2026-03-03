import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function EmailVerificationBanner() {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState('');

  if (!user || user.email_verified) return null;

  const resend = async () => {
    setSending(true); setMsg('');
    try {
      const { data } = await api.post('/auth/resend-verification');
      setMsg(data.message);
    } catch (err: any) {
      setMsg(err.response?.data?.error || 'Failed to resend.');
    } finally { setSending(false); }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-sm text-amber-800 flex items-center justify-between">
      <span>⚠️ Please verify your email to access all features.</span>
      <button onClick={resend} disabled={sending}
        className="ml-3 text-amber-700 font-semibold underline hover:text-amber-900 disabled:opacity-50">
        {sending ? 'Sending…' : msg || 'Resend'}
      </button>
    </div>
  );
}
