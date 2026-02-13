import { useState, useMemo } from 'react';
import { Match, SetScore } from '../types';

type MatchFormat = 'best_of_3' | 'best_of_5' | 'pro_set';

interface Props {
  match: Match;
  onSubmit: (sets: SetScore[], matchFormat: MatchFormat) => Promise<void>;
}

const GAME_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7];

const FORMAT_LABELS: Record<MatchFormat, string> = {
  best_of_3: 'Best of 3 Sets',
  best_of_5: 'Best of 5 Sets',
  pro_set: 'Pro Set (first to 8)',
};

function maxSets(fmt: MatchFormat): number {
  if (fmt === 'pro_set') return 1;
  if (fmt === 'best_of_3') return 3;
  return 5;
}

function setsToWin(fmt: MatchFormat): number {
  if (fmt === 'pro_set') return 1;
  if (fmt === 'best_of_3') return 2;
  return 3;
}

function needsTiebreak(p1: number, p2: number): boolean {
  return (p1 === 7 && p2 === 6) || (p1 === 6 && p2 === 7);
}

function isSetComplete(p1: number, p2: number): boolean {
  const high = Math.max(p1, p2);
  const low = Math.min(p1, p2);
  if (high < 6) return false;
  if (high === 6 && low <= 4) return true;
  if (high === 7 && (low === 5 || low === 6)) return true;
  return false;
}

function getSetWinner(s: SetScore): 'p1' | 'p2' | null {
  if (!isSetComplete(s.p1, s.p2)) return null;
  if (s.p1 > s.p2) return 'p1';
  if (s.p2 > s.p1) return 'p2';
  return null;
}

function computeWinner(sets: SetScore[], fmt: MatchFormat): { winner: 'p1' | 'p2' | null; complete: boolean } {
  let p1w = 0, p2w = 0;
  const target = setsToWin(fmt);
  for (const s of sets) {
    const w = getSetWinner(s);
    if (!w) return { winner: null, complete: false };
    if (needsTiebreak(s.p1, s.p2) && !s.tiebreak) return { winner: null, complete: false };
    if (w === 'p1') p1w++;
    else p2w++;
    if (p1w === target) return { winner: 'p1', complete: true };
    if (p2w === target) return { winner: 'p2', complete: true };
  }
  return { winner: null, complete: false };
}

export default function ScoreSubmission({ match, onSubmit }: Props) {
  const [format, setFormat] = useState<MatchFormat>('best_of_3');
  const [sets, setSets] = useState<SetScore[]>([{ p1: 0, p2: 0 }, { p1: 0, p2: 0 }]);
  const [step, setStep] = useState<'input' | 'confirm'>('input');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleFormatChange = (fmt: MatchFormat) => {
    setFormat(fmt);
    const count = fmt === 'pro_set' ? 1 : 2;
    setSets(Array.from({ length: count }, () => ({ p1: 0, p2: 0 })));
    setError('');
  };

  const updateSet = (idx: number, side: 'p1' | 'p2', val: number) => {
    setSets(prev => {
      const next = prev.map((s, i) => i === idx ? { ...s, [side]: val } : s);
      // Clear tiebreak if no longer 7-6
      const s = next[idx];
      if (!needsTiebreak(s.p1, s.p2)) {
        delete next[idx].tiebreak;
      }
      return next;
    });
    setError('');
  };

  const updateTiebreak = (idx: number, side: 'p1' | 'p2', val: number) => {
    setSets(prev => prev.map((s, i) =>
      i === idx ? { ...s, tiebreak: { ...(s.tiebreak || { p1: 0, p2: 0 }), [side]: val } } : s
    ));
    setError('');
  };

  const addSet = () => {
    if (sets.length < maxSets(format)) {
      setSets([...sets, { p1: 0, p2: 0 }]);
    }
  };

  const removeSet = () => {
    if (sets.length > (format === 'pro_set' ? 1 : 2)) {
      setSets(sets.slice(0, -1));
    }
  };

  const result = useMemo(() => computeWinner(sets, format), [sets, format]);

  const scoreDisplay = useMemo(() => {
    return sets.map(s => {
      let part = `${s.p1}-${s.p2}`;
      if (s.tiebreak && needsTiebreak(s.p1, s.p2)) {
        part += `(${Math.min(s.tiebreak.p1, s.tiebreak.p2)})`;
      }
      return part;
    }).join(', ');
  }, [sets]);

  const winnerName = result.winner === 'p1' ? match.player1.name : result.winner === 'p2' ? match.player2.name : null;

  const handleReview = () => {
    if (!result.complete) {
      setError('Match is not complete. Please enter valid scores for all sets.');
      return;
    }
    setStep('confirm');
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(sets, format);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to submit score.');
      setStep('input');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'confirm') {
    return (
      <div className="bg-white rounded-xl shadow p-5 space-y-4">
        <h2 className="font-semibold text-gray-700 text-lg">Confirm Score</h2>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
          <p className="text-sm text-gray-500">{FORMAT_LABELS[format]}</p>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className={`font-semibold ${result.winner === 'p1' ? 'text-green-700' : 'text-gray-700'}`}>
                {match.player1.name}
              </span>
              {result.winner === 'p1' && <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Winner</span>}
            </div>
            <div className="flex items-center gap-3">
              <span className={`font-semibold ${result.winner === 'p2' ? 'text-green-700' : 'text-gray-700'}`}>
                {match.player2.name}
              </span>
              {result.winner === 'p2' && <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Winner</span>}
            </div>
          </div>
          <div className="mt-3 flex gap-3 justify-center">
            {sets.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-xs text-gray-400 mb-1">Set {i + 1}</div>
                <div className={`text-lg font-bold ${s.p1 > s.p2 ? 'text-green-700' : 'text-gray-500'}`}>{s.p1}</div>
                <div className={`text-lg font-bold ${s.p2 > s.p1 ? 'text-green-700' : 'text-gray-500'}`}>{s.p2}</div>
                {s.tiebreak && needsTiebreak(s.p1, s.p2) && (
                  <div className="text-xs text-gray-400">TB: {s.tiebreak.p1}-{s.tiebreak.p2}</div>
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-sm font-medium mt-2">{scoreDisplay}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setStep('input')} className="flex-1 bg-gray-100 text-gray-700 rounded-lg p-3 font-semibold hover:bg-gray-200">
            ← Edit
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex-1 bg-green-600 text-white rounded-lg p-3 font-semibold hover:bg-green-700 disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Score ✓'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-5 space-y-4">
      <h2 className="font-semibold text-gray-700 text-lg">Submit Score</h2>

      {/* Format selector */}
      <div>
        <label className="text-sm text-gray-500 block mb-1">Match Format</label>
        <div className="flex gap-2">
          {(Object.keys(FORMAT_LABELS) as MatchFormat[]).map(fmt => (
            <button key={fmt} onClick={() => handleFormatChange(fmt)}
              className={`flex-1 text-sm rounded-lg p-2 border transition ${format === fmt ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'}`}>
              {FORMAT_LABELS[fmt]}
            </button>
          ))}
        </div>
      </div>

      {/* Player names header */}
      <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center text-sm font-medium text-gray-500">
        <div></div>
        <div className="w-16 text-center">{match.player1.name.split(' ')[0]}</div>
        <div className="w-16 text-center">{match.player2.name.split(' ')[0]}</div>
      </div>

      {/* Set-by-set entry */}
      {sets.map((s, i) => (
        <div key={i} className="space-y-2">
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
            <label className="text-sm text-gray-600 font-medium">
              {format === 'pro_set' ? 'Pro Set' : `Set ${i + 1}`}
            </label>
            <select value={s.p1} onChange={e => updateSet(i, 'p1', +e.target.value)}
              className="w-16 border rounded-lg p-2 text-center text-lg font-semibold">
              {GAME_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <select value={s.p2} onChange={e => updateSet(i, 'p2', +e.target.value)}
              className="w-16 border rounded-lg p-2 text-center text-lg font-semibold">
              {GAME_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          {needsTiebreak(s.p1, s.p2) && (
            <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center ml-4">
              <label className="text-xs text-gray-400">Tiebreak</label>
              <input type="number" min={0} max={99} value={s.tiebreak?.p1 ?? 0}
                onChange={e => updateTiebreak(i, 'p1', Math.max(0, +e.target.value))}
                className="w-16 border rounded-lg p-2 text-center text-sm" />
              <input type="number" min={0} max={99} value={s.tiebreak?.p2 ?? 0}
                onChange={e => updateTiebreak(i, 'p2', Math.max(0, +e.target.value))}
                className="w-16 border rounded-lg p-2 text-center text-sm" />
            </div>
          )}
        </div>
      ))}

      {/* Add/remove set */}
      {format !== 'pro_set' && (
        <div className="flex gap-2">
          {sets.length < maxSets(format) && (
            <button onClick={addSet} className="text-sm text-green-600 hover:text-green-700 font-medium">
              + Add Set
            </button>
          )}
          {sets.length > 2 && (
            <button onClick={removeSet} className="text-sm text-red-500 hover:text-red-600 font-medium">
              − Remove Set
            </button>
          )}
        </div>
      )}

      {/* Auto-determined winner preview */}
      {result.complete && winnerName && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-sm text-gray-500">Winner</p>
          <p className="font-bold text-green-700">{winnerName}</p>
          <p className="text-xs text-gray-400 mt-1">{scoreDisplay}</p>
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button onClick={handleReview} disabled={!result.complete}
        className="w-full bg-green-600 text-white rounded-lg p-3 font-semibold hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
        Review Score →
      </button>
    </div>
  );
}
