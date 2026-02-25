import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { useMatches, useRespondInvite } from '../hooks/useMatches';
import { useNotifications } from '../hooks/useNotifications';
import { useSettings, useUpdateSettings } from '../hooks/useSettings';
import { useToast } from '../components/Toast';
import { Spinner, ErrorBox, EmptyState } from '../components/ui';

type SubTab = 'info' | 'matches' | 'notifications' | 'settings';

function InfoSection() {
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="text-2xl font-bold text-green-700">{user.name}</h2>
        <div className="text-sm text-gray-500 mt-1">{user.email} {user.phone && `· ${user.phone}`}</div>
        <div className="flex gap-4 mt-2 text-sm">
          {user.ntrp && <span>NTRP {user.ntrp}</span>}
          <span>ELO {user.elo}</span>
        </div>
      </div>
      <Link to={`/players/${user.id}`} className="block bg-white rounded-xl shadow p-4 text-center text-green-700 font-semibold hover:bg-green-50">View Full Profile</Link>
      <Link to="/availability" className="block bg-white rounded-xl shadow p-4 text-center text-green-700 font-semibold hover:bg-green-50">📅 Manage Availability</Link>
      <Link to="/leaderboard" className="block bg-white rounded-xl shadow p-4 text-center text-green-700 font-semibold hover:bg-green-50">🏆 Leaderboard</Link>
      <button onClick={logout} className="w-full bg-red-100 text-red-600 rounded-xl p-4 font-semibold">Log Out</button>
    </div>
  );
}

function MatchesSection() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useMatches();
  const respondMutation = useRespondInvite();
  const { toast } = useToast();

  const handleRespond = (id: number, action: 'accept' | 'decline') => {
    respondMutation.mutate({ id, action }, {
      onSuccess: () => toast(action === 'accept' ? 'Invite accepted! Match on 🎾' : 'Invite declined'),
      onError: () => toast('Failed to respond to invite', 'error'),
    });
  };

  if (isLoading) return <Spinner text="Loading matches..." />;
  if (error) return <ErrorBox message="Failed to load matches" onRetry={refetch} />;

  const { matches = [], pending_invites: pending = [], sent_invites: sent = [] } = data || {};

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">Pending Invites</h3>
          {pending.map(inv => (
            <div key={inv.id} className="bg-yellow-50 border-l-4 border-yellow-400 rounded-xl p-4 mb-2">
              <p className="text-sm font-semibold">{inv.from_user.name} invited you</p>
              <p className="text-xs text-gray-500 mt-1">{inv.play_date} · {inv.start_time}–{inv.end_time} · {inv.court}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => handleRespond(inv.id, 'accept')} disabled={respondMutation.isPending}
                  className="flex-1 bg-green-600 text-white text-sm py-2 rounded-lg disabled:opacity-50">Accept</button>
                <button onClick={() => handleRespond(inv.id, 'decline')} disabled={respondMutation.isPending}
                  className="flex-1 bg-red-500 text-white text-sm py-2 rounded-lg disabled:opacity-50">Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {sent.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">Sent Invites</h3>
          {sent.map(inv => (
            <div key={inv.id} className="bg-blue-50 border-l-4 border-blue-400 rounded-xl p-4 mb-2">
              <p className="text-sm">Invited <span className="font-semibold">{inv.to_user.name}</span> · {inv.play_date}</p>
              <p className="text-xs text-gray-400 mt-1">⏳ Pending...</p>
            </div>
          ))}
        </div>
      )}
      <div>
        <h3 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">Match History</h3>
        {matches.length === 0 ? <EmptyState icon="🎾" title="No matches yet" subtitle="Find a player and start playing!" /> : (
          <div className="space-y-2">
            {matches.map(m => {
              const opp = m.player1.id === user?.id ? m.player2 : m.player1;
              return (
                <Link key={m.id} to={`/matches/${m.id}`} className="block bg-white rounded-xl shadow-sm p-4 hover:bg-green-50 transition-colors">
                  <div className="flex justify-between items-center gap-2">
                    <div className="min-w-0">
                      <span className="font-semibold text-gray-800">vs {opp.name}</span>
                      <span className="ml-2 text-xs text-gray-400">{m.play_date}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${m.status === 'completed' ? 'bg-green-100 text-green-700' : m.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>{m.status}</span>
                  </div>
                  {m.score && <p className="text-sm text-gray-500 mt-1">{m.score} {m.score_confirmed ? '✅' : m.score_disputed ? '❌' : '⏳'}</p>}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationsSection() {
  const { data: notes, isLoading, error, refetch } = useNotifications();

  if (isLoading) return <Spinner text="Loading notifications..." />;
  if (error) return <ErrorBox message="Failed to load notifications" onRetry={refetch} />;
  if (!notes?.length) return <EmptyState icon="🔔" title="All caught up!" subtitle="No notifications right now" />;

  return (
    <div className="space-y-2">
      {notes.map(n => (
        <div key={n.id} className={`bg-white rounded-xl shadow-sm p-4 transition-colors ${!n.read ? 'border-l-4 border-green-500' : ''}`}>
          <p className="text-sm text-gray-700">{n.message}</p>
          <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}

function SettingsSection() {
  const { data: settings, isLoading } = useSettings();
  const updateMutation = useUpdateSettings();

  if (isLoading || !settings) return <div className="text-center text-gray-400">Loading...</div>;

  const toggle = (key: 'notify_sms' | 'notify_email') => {
    const updated = { ...settings, [key]: !settings[key] };
    updateMutation.mutate(updated);
  };

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl shadow divide-y">
        <label className="flex items-center justify-between p-4 cursor-pointer">
          <div>
            <div className="font-medium">📧 Email Notifications</div>
            <div className="text-sm text-gray-500">Match invites, score updates, etc.</div>
          </div>
          <div onClick={() => toggle('notify_email')} className={`w-12 h-7 rounded-full relative transition-colors ${settings.notify_email ? 'bg-green-500' : 'bg-gray-300'}`}>
            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${settings.notify_email ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
        </label>
        <label className="flex items-center justify-between p-4 cursor-pointer">
          <div>
            <div className="font-medium">📱 SMS Notifications</div>
            <div className="text-sm text-gray-500">Text messages to your phone number</div>
          </div>
          <div onClick={() => toggle('notify_sms')} className={`w-12 h-7 rounded-full relative transition-colors ${settings.notify_sms ? 'bg-green-500' : 'bg-gray-300'}`}>
            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${settings.notify_sms ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
        </label>
      </div>
      {updateMutation.isPending && <div className="text-center text-sm text-gray-400">Saving...</div>}
    </div>
  );
}

const subTabs: { key: SubTab; label: string; icon: string }[] = [
  { key: 'info', label: 'Info', icon: '👤' },
  { key: 'matches', label: 'Matches', icon: '🎾' },
  { key: 'notifications', label: 'Alerts', icon: '🔔' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function Profile() {
  const { user } = useAuth();
  const [tab, setTab] = useState<SubTab>('info');
  if (!user) return null;

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-green-700 mb-3">👤 Profile</h1>

      <div className="flex bg-gray-100 rounded-lg p-1 mb-4 overflow-x-auto">
        {subTabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap px-2 ${tab === t.key ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'info' && <InfoSection />}
      {tab === 'matches' && <MatchesSection />}
      {tab === 'notifications' && <NotificationsSection />}
      {tab === 'settings' && <SettingsSection />}
    </div>
  );
}
