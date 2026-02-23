import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayer } from '../hooks/usePlayers';
import { useSendInvite } from '../hooks/useMatches';

export default function Invite() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: player } = usePlayer(id);
  const sendInvite = useSendInvite();
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ play_date: today, start_time: '10:00', end_time: '12:00', court: 'TBD', match_type: 'singles' });
  const set = (k: string, v: string) => setForm({ ...form, [k]: v });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendInvite.mutateAsync({ ...form, to_user_id: id });
    nav(`/players/${id}`);
  };

  if (!player) return <div className="p-4 text-center text-gray-400">Loading...</div>;

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-green-700 mb-4">Invite {player.name}</h1>
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
          <input className="w-full border rounded-lg p-3" value={form.court} onChange={e => set('court', e.target.value)} /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select className="w-full border rounded-lg p-3" value={form.match_type} onChange={e => set('match_type', e.target.value)}>
            <option value="singles">Singles</option><option value="doubles">Doubles</option><option value="hitting">Hitting</option>
          </select></div>
        <button className="w-full bg-green-600 text-white rounded-lg p-3 font-semibold hover:bg-green-700">Send Invite 🎾</button>
      </form>
    </div>
  );
}
