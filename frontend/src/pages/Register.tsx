import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_RE = /^\+?[\d\s\-()]{7,15}$/;

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', ntrp: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { login } = useAuth();
  const nav = useNavigate();

  const set = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    // Clear field error on change
    setFieldErrors(fe => ({ ...fe, [k]: '' }));
  };

  const touch = (k: string) => setTouched(t => ({ ...t, [k]: true }));

  // Validate on blur
  const validate = (field: string) => {
    const errs: Record<string, string> = {};
    if (field === 'name' && !form.name.trim()) errs.name = 'Name is required.';
    if (field === 'email') {
      if (!form.email.trim() && !form.phone.trim()) errs.email = 'Email or phone is required.';
      else if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) errs.email = 'Invalid email format.';
    }
    if (field === 'phone') {
      if (form.phone.trim() && !PHONE_RE.test(form.phone.trim())) errs.phone = 'Invalid phone format (e.g. +1234567890).';
    }
    if (field === 'password') {
      if (!form.password) errs.password = 'Password is required.';
      else if (form.password.length < 8) errs.password = 'Must be at least 8 characters.';
    }
    setFieldErrors(fe => ({ ...fe, ...errs, ...(Object.keys(errs).length === 0 ? { [field]: '' } : {}) }));
  };

  const canSubmit = useMemo(() => {
    const hasName = form.name.trim().length > 0;
    const hasContact = form.email.trim().length > 0 || form.phone.trim().length > 0;
    const hasPassword = form.password.length >= 8;
    const emailOk = !form.email.trim() || EMAIL_RE.test(form.email.trim());
    const phoneOk = !form.phone.trim() || PHONE_RE.test(form.phone.trim());
    return hasName && hasContact && hasPassword && emailOk && phoneOk;
  }, [form]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/register', { ...form, ntrp: form.ntrp || null });
      login(data.token, data.user);
      nav('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  const inputClass = (field: string) =>
    `w-full border rounded-lg p-3 ${touched[field] && fieldErrors[field] ? 'border-red-400' : ''}`;

  const FieldError = ({ field }: { field: string }) =>
    touched[field] && fieldErrors[field] ? <p className="text-red-500 text-xs -mt-2">{fieldErrors[field]}</p> : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
      <form onSubmit={submit} className="bg-white rounded-xl shadow p-6 w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-green-700 text-center">Join TennisPal 🎾</h1>
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div>
          <label className="text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
          <input className={inputClass('name')} placeholder="Name" value={form.name}
            onChange={e => set('name', e.target.value)} onBlur={() => { touch('name'); validate('name'); }} />
        </div>
        <FieldError field="name" />

        <div>
          <label className="text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
          <input className={inputClass('email')} placeholder="Email" value={form.email}
            onChange={e => set('email', e.target.value)} onBlur={() => { touch('email'); validate('email'); }} />
        </div>
        <FieldError field="email" />

        <div>
          <label className="text-sm font-medium text-gray-700">Phone</label>
          <input className={inputClass('phone')} placeholder="Phone (optional)" value={form.phone}
            onChange={e => set('phone', e.target.value)} onBlur={() => { touch('phone'); validate('phone'); }} />
        </div>
        <FieldError field="phone" />

        <div>
          <label className="text-sm font-medium text-gray-700">Password <span className="text-red-500">*</span></label>
          <input className={inputClass('password')} type="password" placeholder="Password" value={form.password}
            onChange={e => set('password', e.target.value)} onBlur={() => { touch('password'); validate('password'); }} />
          <p className="text-xs text-gray-400 mt-1">Minimum 8 characters</p>
        </div>
        <FieldError field="password" />

        <input className="w-full border rounded-lg p-3" placeholder="NTRP Level (optional)" value={form.ntrp} onChange={e => set('ntrp', e.target.value)} />

        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full rounded-lg p-3 font-semibold text-white ${canSubmit ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed'}`}
        >Register</button>
        <p className="text-center text-sm text-gray-500">Already have an account? <Link to="/login" className="text-green-600 font-semibold">Log In</Link></p>
      </form>
    </div>
  );
}
