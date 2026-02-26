import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMatch, useSubmitScore, useConfirmScore, useCancelMatch } from '../hooks/useMatches';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import ScoreSubmission from '../components/ScoreSubmission';
import ReviewModal from '../components/ReviewModal';
import { Spinner, ErrorBox } from '../components/ui';
import { SetScore } from '../types';
import { useReviewStatus } from '../hooks/useReviews';

export default function MatchDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: match, isLoading, error, refetch } = useMatch(id);
  const submitScore = useSubmitScore(id);
  const confirmScore = useConfirmScore(id);
  const cancelMatch = useCancelMatch(id);
  const { data: reviewData } = useReviewStatus(id);
  const [showReviewModal, setShowReviewModal] = useState(false);

  if (isLoading) return <div className="p-4 pb-24 max-w-lg mx-auto"><Spinner /></div>;
  if (error || !match) return <div className="p-4 pb-24 max-w-lg mx-auto"><ErrorBox message={error ? 'Failed to load match' : 'Match not found'} onRetry={refetch} /></div>;

  const canSubmitScore = match.status === 'scheduled' && user && (user.id === match.player1.id || user.id === match.player2.id);
  const canConfirm = match.status === 'completed' && !match.score_confirmed && !match.score_disputed && user && match.score_submitted_by !== user.id;

  const handleStructuredSubmit = async (sets: SetScore[], matchFormat: string) => {
    await submitScore.mutateAsync({ sets, match_format: matchFormat });
  };

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h1 className="text-xl font-bold text-green-700">{match.player1.name} vs {match.player2.name}</h1>
        <p className="text-sm text-gray-500 mt-1">📅 {match.play_date} · {match.match_type}</p>
        <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${match.status === 'completed' ? 'bg-green-100 text-green-700' : match.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>{match.status}</span>
        {match.score && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            {match.sets ? (
              <div className="space-y-2">
                <div className="flex gap-4 justify-center">
                  {match.sets.map((s, i) => (
                    <div key={i} className="text-center">
                      <div className="text-xs text-gray-400 mb-1">Set {i + 1}</div>
                      <div className={`text-lg font-bold ${s.p1 > s.p2 ? 'text-green-700' : 'text-gray-500'}`}>{s.p1}</div>
                      <div className={`text-lg font-bold ${s.p2 > s.p1 ? 'text-green-700' : 'text-gray-500'}`}>{s.p2}</div>
                      {s.tiebreak && (s.p1 + s.p2 === 13) && (
                        <div className="text-xs text-gray-400">({Math.min(s.tiebreak.p1, s.tiebreak.p2)})</div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-6 text-sm text-gray-500">
                  <span>{match.player1.name}</span>
                  <span>{match.player2.name}</span>
                </div>
              </div>
            ) : (
              <p className="font-semibold">{match.score}</p>
            )}
            <p className="text-sm text-gray-500 mt-2 text-center">Winner: {match.winner_name}</p>
            <p className="text-xs text-gray-400 text-center">{match.score_confirmed ? '✅ Confirmed' : match.score_disputed ? '❌ Disputed' : '⏳ Awaiting confirmation'}</p>
          </div>
        )}
      </div>

      {canSubmitScore && (
        <ScoreSubmission match={match} onSubmit={handleStructuredSubmit} />
      )}

      {canConfirm && (
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-gray-700">Confirm Score?</h2>
          <div className="flex gap-2">
            <button onClick={() => confirmScore.mutate('confirm', { onSuccess: () => { toast('Score confirmed ✅'); setShowReviewModal(true); }, onError: () => toast('Failed to confirm', 'error') })}
              disabled={confirmScore.isPending} className="flex-1 bg-green-600 text-white rounded-lg p-3 font-semibold active:bg-green-800 disabled:opacity-50 transition-colors">
              {confirmScore.isPending ? 'Processing...' : 'Confirm ✅'}
            </button>
            <button onClick={() => confirmScore.mutate('dispute', { onSuccess: () => toast('Score disputed'), onError: () => toast('Failed to dispute', 'error') })}
              disabled={confirmScore.isPending} className="flex-1 bg-red-500 text-white rounded-lg p-3 font-semibold active:bg-red-700 disabled:opacity-50 transition-colors">
              Dispute ❌
            </button>
          </div>
        </div>
      )}

      {match.score_confirmed && user && (user.id === match.player1.id || user.id === match.player2.id) && (
        reviewData?.reviewed ? (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-700 mb-2">Your Review</h2>
            <div className="flex flex-wrap gap-2">
              {reviewData.review?.tags.map(t => (
                <span key={t.id} className="px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700">{t.name}</span>
              ))}
            </div>
          </div>
        ) : (
          <button onClick={() => setShowReviewModal(true)}
            className="w-full bg-green-50 text-green-700 rounded-xl p-4 font-semibold hover:bg-green-100 active:bg-green-200 transition-colors">
            ⭐ Review {user.id === match.player1.id ? match.player2.name : match.player1.name}
          </button>
        )
      )}

      {showReviewModal && match && user && (
        <ReviewModal
          matchId={match.id}
          opponentName={user.id === match.player1.id ? match.player2.name : match.player1.name}
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => toast('Review submitted! ⭐')}
        />
      )}

      {match.status === 'scheduled' && user && (
        <button onClick={() => cancelMatch.mutate(undefined, { onSuccess: () => toast('Match cancelled'), onError: () => toast('Failed to cancel', 'error') })}
          disabled={cancelMatch.isPending} className="w-full bg-red-100 text-red-600 rounded-xl p-3 font-semibold active:bg-red-200 disabled:opacity-50 transition-colors">
          {cancelMatch.isPending ? 'Cancelling...' : 'Cancel Match'}
        </button>
      )}
    </div>
  );
}
