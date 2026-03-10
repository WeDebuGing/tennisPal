import { useState } from 'react';
import { useAvailability, useAddAvailability, useRemoveAvailability } from '../hooks/useAvailability';
import { useToast } from '../components/Toast';
import { Spinner, ErrorBox, EmptyState } from '../components/ui';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Generate hour labels from 6am to 10pm
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6);

function timeToHour(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h + m / 60;
}

function formatHour(h: number): string {
  const suffix = h >= 12 ? 'p' : 'a';
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}${suffix}`;
}

export default function AvailabilityPage() {
  const [form, setForm] = useState({ day_of_week: '0', start_time: '09:00', end_time: '11:00' });
  const { data: slots, isLoading, error, refetch } = useAvailability();
  const addMutation = useAddAvailability();
  const removeMutation = useRemoveAvailability();
  const { toast } = useToast();

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate(form, {
      onSuccess: () => toast('Availability added'),
      onError: (err: any) => toast(err?.response?.data?.error || 'Failed to add slot', 'error'),
    });
  };

  const remove = (id: number) => {
    if (!window.confirm('Remove this availability slot?')) return;
    removeMutation.mutate(id, {
      onSuccess: () => toast('Slot removed'),
      onError: () => toast('Failed to remove slot', 'error'),
    });
  };

  // Group slots by day
  const slotsByDay: Record<number, typeof slots> = {};
  if (slots) {
    for (const s of slots) {
      if (!slotsByDay[s.day_of_week]) slotsByDay[s.day_of_week] = [];
      slotsByDay[s.day_of_week]!.push(s);
    }
  }

  const minHour = HOURS[0];
  const maxHour = HOURS[HOURS.length - 1] + 1;
  const totalHours = maxHour - minHour;

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-green-700">📅 My Availability</h1>
      <p className="text-sm text-gray-500">
        Set your recurring weekly availability so other players can find you. This helps with matchmaking suggestions.
      </p>

      {/* Add form */}
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

      {/* Weekly grid view */}
      {isLoading ? <Spinner text="Loading slots..." /> :
       error ? <ErrorBox message="Failed to load availability" onRetry={refetch} /> :
       !slots?.length ? <EmptyState icon="📅" title="No availability set" subtitle="Add your available times above" /> : (
        <>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-700 mb-3">Weekly Schedule</h2>
            <div className="space-y-1">
              {/* Hour labels */}
              <div className="flex items-center">
                <div className="w-10 shrink-0" />
                <div className="flex-1 flex justify-between text-[10px] text-gray-400 px-0.5">
                  {HOURS.filter((_, i) => i % 2 === 0).map(h => (
                    <span key={h}>{formatHour(h)}</span>
                  ))}
                </div>
              </div>
              {/* Day rows */}
              {DAYS_SHORT.map((day, dayIdx) => (
                <div key={dayIdx} className="flex items-center">
                  <div className="w-10 shrink-0 text-xs font-medium text-gray-500">{day}</div>
                  <div className="flex-1 h-7 bg-gray-100 rounded relative">
                    {(slotsByDay[dayIdx] || []).map(s => {
                      const start = Math.max(timeToHour(s.start_time), minHour);
                      const end = Math.min(timeToHour(s.end_time), maxHour);
                      const left = ((start - minHour) / totalHours) * 100;
                      const width = ((end - start) / totalHours) * 100;
                      return (
                        <div
                          key={s.id}
                          className="absolute top-0.5 bottom-0.5 bg-green-500 rounded cursor-pointer hover:bg-green-600 transition-colors flex items-center justify-center"
                          style={{ left: `${left}%`, width: `${width}%` }}
                          title={`${s.start_time}–${s.end_time} (click to remove)`}
                          onClick={() => remove(s.id)}
                        >
                          <span className="text-[9px] text-white font-medium truncate px-1">
                            {s.start_time}–{s.end_time}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* List view with delete buttons */}
          <div className="space-y-2">
            {slots.map(s => (
              <div key={s.id} className="flex items-center justify-between bg-white rounded-xl shadow-sm p-4">
                <span className="text-sm text-gray-700">{DAYS[s.day_of_week]} {s.start_time}–{s.end_time}</span>
                <button
                  onClick={() => remove(s.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 active:bg-red-200 transition-colors text-lg font-bold"
                  title="Remove slot"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
