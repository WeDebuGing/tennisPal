import { useState } from 'react';
import { useReviewTags, useSubmitReview } from '../hooks/useReviews';
import { Spinner } from './ui';

const CATEGORY_LABELS: Record<string, string> = {
  play_style: '🎾 Play Style',
  sportsmanship: '🤝 Sportsmanship',
  logistics: '📅 Logistics',
  vibe: '✨ Vibe',
};

const CATEGORY_ORDER = ['play_style', 'sportsmanship', 'logistics', 'vibe'];

interface Props {
  matchId: number | string;
  opponentName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ReviewModal({ matchId, opponentName, onClose, onSuccess }: Props) {
  const { data: tagsByCategory, isLoading } = useReviewTags();
  const submitReview = useSubmitReview(matchId);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggle = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selected.size === 0) return;
    await submitReview.mutateAsync(Array.from(selected));
    onSuccess?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-xl rounded-t-xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Review {opponentName}</h2>
            <p className="text-sm text-gray-500">Select tags that describe your opponent</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-5 space-y-5">
          {isLoading ? <Spinner /> : tagsByCategory && CATEGORY_ORDER.map(cat => {
            const tags = tagsByCategory[cat];
            if (!tags?.length) return null;
            return (
              <div key={cat}>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">{CATEGORY_LABELS[cat] || cat}</h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <button key={tag.id} onClick={() => toggle(tag.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selected.has(tag.id)
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}>
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="sticky bottom-0 bg-white border-t p-4 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors">
            Skip
          </button>
          <button onClick={handleSubmit} disabled={selected.size === 0 || submitReview.isPending}
            className="flex-1 py-3 rounded-lg bg-green-600 text-white font-semibold disabled:opacity-50 hover:bg-green-700 active:bg-green-800 transition-colors">
            {submitReview.isPending ? 'Submitting...' : `Submit (${selected.size})`}
          </button>
        </div>
      </div>
    </div>
  );
}
