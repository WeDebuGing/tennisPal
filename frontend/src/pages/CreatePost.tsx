import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useCourts } from '../hooks/useCourts';

export default function CreatePost() {
  const nav = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ play_date: today, start_time: '10:00', end_time: '12:00', court: '', match_type: 'singles', level_min: '', level_max: '' });
  const [customCourt, setCustomCourt] = useState('');
  const set = (k: string, v: string) => setForm({ ...form, [k]: v });
  const { data: courts } = useCourts();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const court = form.court === '__other__' ? customCourt : form.court;
    await api.post('/posts', { ...form, court: court || 'Flexible', level_min: form.level_min || null, level_max: form.level_max || null });
    nav('/');
  };

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-green-700 mb-4">➕ Looking to Play</h1>
      <form onSubmit={submit} className="bg-white rounded-xl shadow p-5 space-y-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input type="date" min={today} className="w-full border rounded-lg p-3" value={form.play_date} onChange={e => set('play_date', e.target.value)} required /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
            <input type="time" className="w-full border rounded-lg p-3" value={form.start_time} onChange={e => set('start_time', e.target.value)} required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">End</label>
            <input type="time" className="w-full border rounded-lg p-3" value={form.end_time} onChange={e => set('end_time', e.target.value)} required /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Court</label>
          <select className="w-full border rounded-lg p-3" value={form.court} onChange={e => set('court', e.target.value)}>
            <option value="">Flexible</option>
            {(courts ?? []).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            <option value="__other__">Other…</option>
          </select>
          {form.court === '__other__' && (
            <input className="w-full border rounded-lg p-3 mt-2" placeholder="Enter court name" value={customCourt} onChange={e => setCustomCourt(e.target.value)} />
          )}
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select className="w-full border rounded-lg p-3" value={form.match_type} onChange={e => set('match_type', e.target.value)}>
            <option value="singles">Singles</option><option value="doubles">Doubles</option><option value="hitting">Hitting</option>
          </select></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Min Level</label>
            <input className="w-full border rounded-lg p-3" placeholder="e.g. 3.0" value={form.level_min} onChange={e => set('level_min', e.target.value)} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Max Level</label>
            <input className="w-full border rounded-lg p-3" placeholder="e.g. 4.5" value={form.level_max} onChange={e => set('level_max', e.target.value)} /></div>
        </div>
        <button className="w-full bg-green-600 text-white rounded-lg p-3 font-semibold hover:bg-green-700">Post</button>
      </form>
    </div>
  );
}
