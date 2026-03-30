import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Spinner, ErrorBox } from '../components/ui';
import {
  useLeague, useLeagueStandings, useLeagueMembers, useLeagueMatches,
  useJoinLeague, useLeaveLeague, useChallengePlayer,
  useApproveMember, useRemoveMember, usePromoteMember,
} from '../hooks/useLeagues';

type Tab = 'standings' | 'members' | 'matches';

export default function LeagueDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('standings');

  const { data: league, isLoading, error } = useLeague(slug);
  const { data: standings } = useLeagueStandings(slug);
  const { data: members } = useLeagueMembers(slug);
  const { data: matches } = useLeagueMatches(slug);

  const joinMutation = useJoinLeague();
  const leaveMutation = useLeaveLeague();
  const challengeMutation = useChallengePlayer(slug);
  const approveMutation = useApproveMember(slug);
  const removeMutation = useRemoveMember(slug);
  const promoteMutation = usePromoteMember(slug);

  if (isLoading) return <div className="p-4"><Spinner text="Loading league..." /></div>;
  if (error || !league) return <div className="p-4"><ErrorBox message="Failed to load league" /></div>;

  const isAdmin = league.user_role === 'admin';
  const isMember = league.user_role === 'admin' || league.user_role === 'member';

  const handleJoin = () => {
    joinMutation.mutate(slug!, {
      onSuccess: () => toast(league.require_approval ? 'Request sent! Waiting for approval.' : 'Joined league! 🏆'),
      onError: (err: any) => toast(err?.response?.data?.error || 'Failed to join', 'error'),
    });
  };

  const handleLeave = () => {
    if (!confirm('Leave this league?')) return;
    leaveMutation.mutate(slug!, {
      onSuccess: () => toast('Left league'),
      onError: (err: any) => toast(err?.response?.data?.error || 'Failed to leave', 'error'),
    });
  };

  const handleChallenge = (targetId: number, name: string) => {
    if (!confirm(`Challenge ${name} to a match?`)) return;
    challengeMutation.mutate(targetId, {
      onSuccess: () => toast(`Challenge sent to ${name}! ⚔️`),
      onError: (err: any) => toast(err?.response?.data?.error || 'Failed to challenge', 'error'),
    });
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'standings', label: '📊 Standings' },
    { key: 'members', label: '👥 Members' },
    { key: 'matches', label: '🎾 Matches' },
  ];

  const pendingMembers = members?.filter(m => m.status === 'pending') ?? [];
  const approvedMembers = members?.filter(m => m.status === 'approved') ?? [];

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <Link to="/leagues" className="text-sm text-violet-600 hover:underline mb-3 inline-block">← All Leagues</Link>
      <div className="bg-white rounded-xl shadow-sm p-5 mb-4 border-t-4 border-violet-500">
        <h1 className="text-xl font-bold text-violet-700">{league.name}</h1>
        {league.season && <p className="text-sm text-violet-500 font-medium">{league.season}</p>}
        {league.description && <p className="text-sm text-gray-600 mt-2">{league.description}</p>}
        <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
          <span>👥 {league.member_count} members</span>
          {league.start_date && <span>📅 {league.start_date} — {league.end_date}</span>}
          {league.require_approval && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Approval required</span>}
        </div>
        <div className="mt-4 flex gap-2">
          {user && !isMember && (
            <button onClick={handleJoin} disabled={joinMutation.isPending} className="bg-violet-600 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors">
              {joinMutation.isPending ? 'Joining...' : league.require_approval ? 'Request to Join' : 'Join League'}
            </button>
          )}
          {isMember && !isAdmin && (
            <button onClick={handleLeave} disabled={leaveMutation.isPending} className="border border-gray-300 text-gray-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">
              Leave League
            </button>
          )}
          {isMember && <span className="text-xs bg-violet-100 text-violet-700 px-3 py-1.5 rounded-full self-center capitalize">{league.user_role}</span>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex-1 text-sm font-medium py-2 rounded-lg transition-colors ${tab === t.key ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Standings */}
      {tab === 'standings' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {!standings?.length ? (
            <p className="p-6 text-center text-sm text-gray-400">No standings yet — play some matches!</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-violet-50 text-violet-700">
                <tr>
                  <th className="text-left py-2.5 px-3 font-semibold">#</th>
                  <th className="text-left py-2.5 px-3 font-semibold">Player</th>
                  <th className="text-center py-2.5 px-1 font-semibold">W</th>
                  <th className="text-center py-2.5 px-1 font-semibold">L</th>
                  <th className="text-center py-2.5 px-3 font-semibold">Played</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s, i) => (
                  <tr key={s.user_id} className={`border-t ${user?.id === s.user_id ? 'bg-violet-50' : ''}`}>
                    <td className="py-2.5 px-3 font-bold text-violet-600">{s.rank ?? i + 1}</td>
                    <td className="py-2.5 px-3">
                      <Link to={`/players/${s.user_id}`} className="text-violet-700 hover:underline font-medium">{s.user_name}</Link>
                      {s.ntrp && <span className="ml-1.5 text-xs text-gray-400">({s.ntrp})</span>}
                    </td>
                    <td className="text-center py-2.5 px-1 text-green-600 font-semibold">{s.wins}</td>
                    <td className="text-center py-2.5 px-1 text-red-500 font-semibold">{s.losses}</td>
                    <td className="text-center py-2.5 px-3 text-gray-500">{s.matches_played}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Members */}
      {tab === 'members' && (
        <div className="space-y-3">
          {/* Pending approvals (admin only) */}
          {isAdmin && pendingMembers.length > 0 && (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <h3 className="text-sm font-semibold text-amber-700 mb-2">⏳ Pending Approval ({pendingMembers.length})</h3>
              <div className="space-y-2">
                {pendingMembers.map(m => (
                  <div key={m.user_id} className="flex items-center justify-between">
                    <Link to={`/players/${m.user_id}`} className="text-sm text-violet-700 hover:underline font-medium">{m.user_name}</Link>
                    <div className="flex gap-2">
                      <button onClick={() => approveMutation.mutate(m.user_id)} className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700">Approve</button>
                      <button onClick={() => removeMutation.mutate(m.user_id)} className="text-xs bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {approvedMembers.length === 0 ? (
            <p className="bg-white rounded-xl shadow-sm p-6 text-center text-sm text-gray-400">No members yet</p>
          ) : (
            <div className="bg-white rounded-xl shadow-sm divide-y">
              {approvedMembers.map(m => (
                <div key={m.user_id} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2">
                    <Link to={`/players/${m.user_id}`} className="text-sm text-violet-700 hover:underline font-medium">{m.user_name}</Link>
                    {m.ntrp && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">NTRP {m.ntrp}</span>}
                    {m.role === 'admin' && <span className="text-xs bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded">Admin</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {isMember && user?.id !== m.user_id && (
                      <button onClick={() => handleChallenge(m.user_id, m.user_name)} disabled={challengeMutation.isPending} className="text-xs bg-violet-600 text-white px-3 py-1 rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors">
                        ⚔️ Challenge
                      </button>
                    )}
                    {isAdmin && user?.id !== m.user_id && (
                      <>
                        {m.role !== 'admin' && (
                          <button onClick={() => promoteMutation.mutate(m.user_id)} className="text-xs text-violet-500 hover:text-violet-700">Promote</button>
                        )}
                        <button onClick={() => { if (confirm(`Remove ${m.user_name}?`)) removeMutation.mutate(m.user_id); }} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Matches */}
      {tab === 'matches' && (
        <div className="space-y-2">
          {!matches?.length ? (
            <p className="bg-white rounded-xl shadow-sm p-6 text-center text-sm text-gray-400">No matches yet — challenge someone!</p>
          ) : (
            matches.map(m => (
              <Link key={m.id} to={`/matches/${m.id}`} className="block bg-white rounded-xl shadow-sm p-3 border-l-4 border-violet-400 active:bg-violet-50 transition-colors">
                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    <span className="font-medium text-gray-800">{m.player1.name}</span>
                    <span className="text-gray-400 mx-1.5">vs</span>
                    <span className="font-medium text-gray-800">{m.player2.name}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${m.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{m.status}</span>
                </div>
                {m.score && <p className="text-sm text-violet-600 font-semibold mt-1">{m.score}</p>}
                <p className="text-xs text-gray-400 mt-1">📅 {m.play_date}</p>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
