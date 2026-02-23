import { useState } from 'react';
import { useAvailability, useAddAvailability, useRemoveAvailability } from '../hooks/useAvailability';
import { Spinner, ErrorBox, EmptyState } from '../components/ui';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AvailabilityPage() {
  const [form, setForm] = useState({ day_of_week: '0', start_time: '09:00', end_time: '11:00' });
  const { data: slots, isLoading, error, refetch } = useAvailability();
  const addMutation = useAddAvailability();
  const removeMutation = useRemoveAvailability();

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate(form);
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
        <button disabled={addMutation.isPending} className="w-full bg-green-600 text-white rounded-lg p-3 font-semibold hover:bg-green-700 active:bg-green-800 disabled:opacity-50 transition-colors">
          {addMutation.isPending ? 'Adding...' : 'Add Slot'}
        </button>
      </form>

      {isLoading ? <Spinner text="Loading slots..." /> :
       error ? <ErrorBox message="Failed to load availability" onRetry={refetch} /> :
       !slots?.length ? <EmptyState icon="📅" title="No availability set" subtitle="Add your available times above" /> : (
        <div className="space-y-2">
          {slots.map(s => (
            <div key={s.id} className="flex items-center justify-between bg-white rounded-xl shadow-sm p-4">
              <span className="text-sm text-gray-700">{DAYS[s.day_of_week]} {s.start_time}–{s.end_time}</span>
              <button onClick={() => removeMutation.mutate(s.id)} className="text-red-500 text-sm hover:underline active:text-red-700">Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
