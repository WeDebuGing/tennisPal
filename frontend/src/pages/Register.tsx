import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_RE = /^\+?[\d\s\-()]{7,15}$/;

interface PasswordCheck {
  label: string;
  test: (pw: string) => boolean;
}

const PASSWORD_CHECKS: PasswordCheck[] = [
  { label: 'At least 8 characters', test: pw => pw.length >= 8 },
  { label: 'One uppercase letter', test: pw => /[A-Z]/.test(pw) },
  { label: 'One lowercase letter', test: pw => /[a-z]/.test(pw) },
  { label: 'One number', test: pw => /\d/.test(pw) },
  { label: 'One special character (!@#$...)', test: pw => /[^A-Za-z0-9]/.test(pw) },
];

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', ntrp: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { login } = useAuth();
  const nav = useNavigate();

  const set = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    setFieldErrors(fe => ({ ...fe, [k]: '' }));
  };

  const touch = (k: string) => setTouched(t => ({ ...t, [k]: true }));

  const passwordStrength = useMemo(() => {
    const passed = PASSWORD_CHECKS.filter(c => c.test(form.password)).length;
    return passed;
  }, [form.password]);

  const strengthLabel = useMemo(() => {
    if (!form.password) return '';
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 3) return 'Fair';
    if (passwordStrength <= 4) return 'Good';
    return 'Strong';
  }, [form.password, passwordStrength]);

  const strengthColor = useMemo(() => {
    if (passwordStrength <= 2) return 'bg-red-400';
    if (passwordStrength <= 3) return 'bg-yellow-400';
    if (passwordStrength <= 4) return 'bg-blue-400';
    return 'bg-green-500';
  }, [passwordStrength]);

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
      else if (passwordStrength < 5) errs.password = 'Password does not meet all requirements.';
    }
    if (field === 'confirmPassword') {
      if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password.';
      else if (form.confirmPassword !== form.password) errs.confirmPassword = 'Passwords do not match.';
    }
    setFieldErrors(fe => ({ ...fe, ...errs, ...(Object.keys(errs).length === 0 ? { [field]: '' } : {}) }));
  };

  const canSubmit = useMemo(() => {
    const hasName = form.name.trim().length > 0;
    const hasContact = form.email.trim().length > 0 || form.phone.trim().length > 0;
    const strongPassword = passwordStrength === 5;
    const passwordsMatch = form.password === form.confirmPassword && form.confirmPassword.length > 0;
    const emailOk = !form.email.trim() || EMAIL_RE.test(form.email.trim());
    const phoneOk = !form.phone.trim() || PHONE_RE.test(form.phone.trim());
    return hasName && hasContact && strongPassword && passwordsMatch && emailOk && phoneOk;
  }, [form, passwordStrength]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { name, email, phone, password, ntrp } = form;
      const { data } = await api.post('/auth/register', { name, email, phone, password, ntrp: ntrp || null });
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
          <input className={inputClass('email')} placeholder="Email" type="email" value={form.email}
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

          {/* Password strength bar */}
          {form.password && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Password strength:</span>
                <span className={`text-xs font-semibold ${
                  passwordStrength <= 2 ? 'text-red-500' :
                  passwordStrength <= 3 ? 'text-yellow-600' :
                  passwordStrength <= 4 ? 'text-blue-500' : 'text-green-600'
                }`}>{strengthLabel}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${strengthColor}`}
                  style={{ width: `${(passwordStrength / 5) * 100}%` }}
                />
              </div>

              {/* Requirements checklist */}
              <ul className="mt-2 space-y-0.5">
                {PASSWORD_CHECKS.map(check => {
                  const passed = check.test(form.password);
                  return (
                    <li key={check.label} className={`text-xs flex items-center gap-1 ${passed ? 'text-green-600' : 'text-gray-400'}`}>
                      <span>{passed ? '✓' : '○'}</span>
                      <span>{check.label}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
        <FieldError field="password" />

        <div>
          <label className="text-sm font-medium text-gray-700">Confirm Password <span className="text-red-500">*</span></label>
          <input className={inputClass('confirmPassword')} type="password" placeholder="Confirm password" value={form.confirmPassword}
            onChange={e => set('confirmPassword', e.target.value)} onBlur={() => { touch('confirmPassword'); validate('confirmPassword'); }} />
        </div>
        <FieldError field="confirmPassword" />

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
