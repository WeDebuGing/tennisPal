import { useEffect, useState } from 'react';
import api from '../api/client';
import { Availability } from '../types';
import { Spinner, ErrorBox, EmptyState } from '../components/ui';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AvailabilityPage() {
  const [slots, setSlots] = useState<Availability[]>([]);
  const [form, setForm] = useState({ day_of_week: '0', start_time: '09:00', end_time: '11:00' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    setError('');
    api.get('/availability')
      .then(r => setSlots(r.data.slots))
      .catch(() => setError('Failed to load availability'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/availability', form);
      load();
    } catch { setError('Failed to add slot'); }
    finally { setSubmitting(false); }
  };

  const remove = async (id: number) => {
    await api.delete(`/availability/${id}`);
    load();
  };

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-green-700">📅 My Availability</h1>
      <form onSubmit={add} className="bg-white rounded-xl shadow-sm p-4 space-y-3">
        <select className="w-full border rounded-lg p-3 text-gray-700" value={form.day_of_week} onChange={e => setForm({ ...form, day_of_week: e.target.value })}>
          {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <input type="time" className="border rounded-lg p-3" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
          <input type="time" className="border rounded-lg p-3" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
        </div>
        <button disabled={submitting} className="w-full bg-green-600 text-white rounded-lg p-3 font-semibold hover:bg-green-700 active:bg-green-800 disabled:opacity-50 transition-colors">
          {submitting ? 'Adding...' : 'Add Slot'}
        </button>
      </form>

      {loading ? <Spinner text="Loading slots..." /> :
       error ? <ErrorBox message={error} onRetry={load} /> :
       slots.length === 0 ? <EmptyState icon="📅" title="No availability set" subtitle="Add your available times above" /> : (
        <div className="space-y-2">
          {slots.map(s => (
            <div key={s.id} className="flex items-center justify-between bg-white rounded-xl shadow-sm p-4">
              <span className="text-sm text-gray-700">{DAYS[s.day_of_week]} {s.start_time}–{s.end_time}</span>
              <button onClick={() => remove(s.id)} className="text-red-500 text-sm hover:underline active:text-red-700">Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
