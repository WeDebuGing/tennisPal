import { Link } from 'react-router-dom';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { Spinner, ErrorBox, EmptyState } from '../components/ui';

export default function Leaderboard() {
  const { data: board, isLoading, error, refetch } = useLeaderboard();

  if (isLoading) return <div className="p-4 pb-24 max-w-lg mx-auto"><Spinner text="Loading leaderboard..." /></div>;
  if (error) return <div className="p-4 pb-24 max-w-lg mx-auto"><ErrorBox message="Failed to load leaderboard" onRetry={refetch} /></div>;

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-green-700 mb-4">🏆 Leaderboard</h1>
      {!board?.length ? <EmptyState icon="🏆" title="No rankings yet" subtitle="Play some matches to get ranked!" /> : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-green-600 text-white">
                <tr>
                  <th className="p-2.5 text-left w-8">#</th>
                  <th className="p-2.5 text-left">Player</th>
                  <th className="p-2.5 text-center w-16">Rating</th>
                  <th className="p-2.5 text-center w-16">W-L</th>
                </tr>
              </thead>
              <tbody>
                {board.map((p, i) => (
                  <tr key={p.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-green-50'} active:bg-green-100`}>
                    <td className="p-2.5 font-bold text-gray-400">{i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</td>
                    <td className="p-2.5">
                      <div className="flex items-center gap-2">
                        <Link to={`/players/${p.id}`} className="text-green-700 hover:underline font-semibold truncate">{p.name}</Link>
                        {p.ntrp != null && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-100 text-green-700 whitespace-nowrap">
                            {p.ntrp}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-2.5 text-center font-semibold">{p.elo}</td>
                    <td className="p-2.5 text-center">
                      <span className="text-green-600 font-semibold">{p.wins}</span>
                      <span className="text-gray-400">-</span>
                      <span className="text-red-500">{p.losses}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
