import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCompleteOnboarding } from '../hooks/useOnboarding';
import { useCourts } from '../hooks/useCourts';

const NTRP_LEVELS = [
  { value: 2.0, label: '2.0', desc: 'Beginner' },
  { value: 2.5, label: '2.5', desc: 'Advanced Beginner' },
  { value: 3.0, label: '3.0', desc: 'Intermediate' },
  { value: 3.5, label: '3.5', desc: 'Advanced Intermediate' },
  { value: 4.0, label: '4.0', desc: 'Advanced' },
  { value: 4.5, label: '4.5', desc: 'Advanced+' },
  { value: 5.0, label: '5.0', desc: 'Expert' },
  { value: 5.5, label: '5.5', desc: 'Elite' },
];

export default function Onboarding() {
  const { user, login, token } = useAuth();
  const [step, setStep] = useState(0);
  const [ntrp, setNtrp] = useState<number | null>(user?.ntrp ?? null);
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [selectedCourts, setSelectedCourts] = useState<string[]>([]);
  const [error, setError] = useState('');

  const { mutateAsync: complete, isPending } = useCompleteOnboarding();
  const { data: courts } = useCourts();

  const toggleCourt = (name: string) => {
    setSelectedCourts(prev =>
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    );
  };

  const finish = async () => {
    try {
      const updated = await complete({
        ntrp,
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        preferred_courts: selectedCourts,
      });
      if (token) login(token, updated);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
  };

  // Step 0: Welcome
  if (step === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center space-y-6">
          <div className="text-6xl">🎾</div>
          <h1 className="text-2xl font-bold text-green-700">Welcome to TennisPal!</h1>
          <p className="text-gray-600">
            Let's get you set up in just a few steps so you can start finding tennis partners.
          </p>
          <button
            onClick={() => setStep(1)}
            className="w-full bg-green-600 text-white rounded-lg p-3 font-semibold hover:bg-green-700 transition"
          >
            Let's Go →
          </button>
        </div>
      </div>
    );
  }

  // Step 1: NTRP Level
  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-green-700">Your Skill Level</h2>
            <span className="text-sm text-gray-400">1 of 3</span>
          </div>
          <p className="text-gray-600 text-sm">
            Select your NTRP rating. This helps us match you with the right partners.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {NTRP_LEVELS.map(l => (
              <button
                key={l.value}
                onClick={() => setNtrp(l.value)}
                className={`p-3 rounded-lg border-2 text-left transition ${
                  ntrp === l.value
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <span className="font-bold text-lg">{l.label}</span>
                <span className="block text-xs text-gray-500">{l.desc}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep(0)}
              className="flex-1 border border-gray-300 rounded-lg p-3 font-semibold text-gray-600 hover:bg-gray-50 transition"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(2)}
              className="flex-1 bg-green-600 text-white rounded-lg p-3 font-semibold hover:bg-green-700 transition"
            >
              Next →
            </button>
          </div>
          <button onClick={() => { setNtrp(null); setStep(2); }} className="w-full text-sm text-gray-400 hover:text-gray-600">
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Profile Setup
  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-green-700">Your Profile</h2>
            <span className="text-sm text-gray-400">2 of 3</span>
          </div>
          <p className="text-gray-600 text-sm">
            Confirm your details so other players can find you.
          </p>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <input
            className="w-full border rounded-lg p-3"
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            className="w-full border rounded-lg p-3"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            className="w-full border rounded-lg p-3"
            placeholder="Phone"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 border border-gray-300 rounded-lg p-3 font-semibold text-gray-600 hover:bg-gray-50 transition"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 bg-green-600 text-white rounded-lg p-3 font-semibold hover:bg-green-700 transition"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Preferred Courts + Done
  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-green-700">Preferred Courts</h2>
          <span className="text-sm text-gray-400">3 of 3</span>
        </div>
        <p className="text-gray-600 text-sm">
          Select courts you play at regularly (optional).
        </p>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="max-h-48 overflow-y-auto space-y-2">
          {courts?.map(c => (
            <button
              key={c.id}
              onClick={() => toggleCourt(c.name)}
              className={`w-full p-3 rounded-lg border-2 text-left transition ${
                selectedCourts.includes(c.name)
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <span className="font-medium">{c.name}</span>
              {c.address && <span className="block text-xs text-gray-500">{c.address}</span>}
            </button>
          ))}
          {(!courts || courts.length === 0) && (
            <p className="text-gray-400 text-sm text-center py-4">No courts available yet</p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setStep(2)}
            className="flex-1 border border-gray-300 rounded-lg p-3 font-semibold text-gray-600 hover:bg-gray-50 transition"
          >
            ← Back
          </button>
          <button
            onClick={finish}
            disabled={isPending}
            className="flex-1 bg-green-600 text-white rounded-lg p-3 font-semibold hover:bg-green-700 transition disabled:opacity-50"
          >
            {isPending ? 'Saving…' : "Done! Let's Play 🎾"}
          </button>
        </div>
      </div>
    </div>
  );
}
