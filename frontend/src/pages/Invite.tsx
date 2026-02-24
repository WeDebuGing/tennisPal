import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayer } from '../hooks/usePlayers';
import { useSendInvite } from '../hooks/useMatches';
import { useToast } from '../components/Toast';
import { useCourts } from '../hooks/useCourts';

export default function Invite() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: player } = usePlayer(id);
  const sendInvite = useSendInvite();
  const { toast } = useToast();
  const { data: courts } = useCourts();
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ play_date: today, start_time: '10:00', end_time: '12:00', court: '', match_type: 'singles' });
  const [customCourt, setCustomCourt] = useState('');
  const set = (k: string, v: string) => setForm({ ...form, [k]: v });

  const [submitted, setSubmitted] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitted || sendInvite.isPending) return;
    setSubmitted(true);
    try {
      const court = form.court === '__other__' ? customCourt : (form.court || 'TBD');
      await sendInvite.mutateAsync({ ...form, court, to_user_id: id });
      toast('Invite sent! 🎾');
      nav(`/players/${id}`);
    } catch {
      toast('Failed to send invite', 'error');
      setSubmitted(false);
    }
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
          <select className="w-full border rounded-lg p-3" value={form.court} onChange={e => set('court', e.target.value)}>
            <option value="">TBD</option>
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
        <button disabled={submitted || sendInvite.isPending} className="w-full bg-green-600 text-white rounded-lg p-3 font-semibold hover:bg-green-700 disabled:opacity-50">
          {submitted || sendInvite.isPending ? 'Sending...' : 'Send Invite 🎾'}
        </button>
      </form>
    </div>
  );
}
