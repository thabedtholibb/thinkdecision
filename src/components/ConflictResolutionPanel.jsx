/**
 * Conflict Resolution Panel Component
 *
 * Allows case creator to request expert revisions for conflicted pairs.
 * Shows disagreement context and sends revision request to expert.
 *
 * Props:
 *   caseId: UUID - Case ID for context
 *   disagreementPairs: [{pair, item_a, item_b, variance, expert_views, suggestion}]
 *   experts: {expert_id: {name, email, avatarColor}}
 *   onRevisionRequested: () => {} - Callback after request sent
 *   isLoading: boolean - Show loading state
 *
 * @component
 * @example
 * <ConflictResolutionPanel
 *   caseId={caseId}
 *   disagreementPairs={pairs}
 *   experts={expertList}
 *   onRevisionRequested={() => refetch()}
 * />
 */

import React, { useState } from 'react';

function ConflictResolutionPanel({
  caseId,
  disagreementPairs = [],
  experts = {},
  onRevisionRequested = null,
  isLoading = false
}) {
  // ===========================
  // STATE
  // ===========================

  const [selectedPair, setSelectedPair] = useState(null);
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedPairs, setSubmittedPairs] = useState(new Set());
  const [notification, setNotification] = useState(null);

  // ===========================
  // DATA VALIDATION
  // ===========================

  if (!disagreementPairs || disagreementPairs.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✓</span>
          <div className="text-sm text-green-700 dark:text-green-300">
            <div className="font-semibold">No conflicts detected</div>
            <div className="text-xs mt-1">Expert judgments are well-aligned. No revision requests needed.</div>
          </div>
        </div>
      </div>
    );
  }

  // ===========================
  // HANDLERS
  // ===========================

  const handleRequestRevision = async () => {
    if (!selectedPair || !selectedExpert) {
      setNotification({ type: 'error', message: 'Please select a pair and expert' });
      return;
    }

    setIsSubmitting(true);

    try {
      const reasonText = customReason || `High disagreement on "${selectedPair.item_a}" vs "${selectedPair.item_b}" (variance: ${selectedPair.variance.toFixed(2)})`;

      // Call API to request revision
      const response = await fetch(`/api/cases/${caseId}/request-revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expert_id: selectedExpert,
          reason: reasonText
        })
      });

      if (!response.ok) {
        throw new Error('Failed to request revision');
      }

      // Success
      setSubmittedPairs(new Set([...submittedPairs, `${selectedPair.pair[0]}-${selectedPair.pair[1]}`]));
      setNotification({
        type: 'success',
        message: `✓ Revision request sent to ${experts[selectedExpert]?.name || selectedExpert}`
      });

      // Reset form
      setSelectedPair(null);
      setSelectedExpert(null);
      setCustomReason('');

      // Callback to parent
      if (onRevisionRequested && typeof onRevisionRequested === 'function') {
        onRevisionRequested();
      }

      // Auto-dismiss notification after 3s
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Error: ${error.message}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===========================
  // HELPERS
  // ===========================

  const getSuggestionIcon = (suggestion) => {
    switch (suggestion) {
      case 'HIGH_CONFLICT':
        return '🔴';
      case 'MODERATE_CONFLICT':
        return '🟠';
      case 'REVIEW':
        return '🟡';
      default:
        return '📌';
    }
  };

  const getSuggestionColor = (suggestion) => {
    switch (suggestion) {
      case 'HIGH_CONFLICT':
        return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900';
      case 'MODERATE_CONFLICT':
        return 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900';
      case 'REVIEW':
        return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900';
      default:
        return 'bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-900';
    }
  };

  const getExpertViewsForPair = (pair) => {
    // Find which experts disagreed on this pair
    const fullPair = disagreementPairs.find(p => p.pair[0] === pair[0] && p.pair[1] === pair[1]);
    return fullPair?.expert_views || [];
  };

  // ===========================
  // RENDER
  // ===========================

  return (
    <div className="space-y-4">
      {/* Notification */}
      {notification && (
        <div
          className={`p-3 rounded-lg border ${
            notification.type === 'success'
              ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Step 1: Select Problematic Pair */}
      <div className="border border-ink-200 dark:border-ink-800 rounded-lg p-4">
        <div className="text-sm font-semibold text-ink-900 dark:text-ink-50 mb-3">
          Step 1: Select Pair to Address
        </div>

        <div className="space-y-2">
          {disagreementPairs.map((pair, idx) => {
            const isSelected = selectedPair && selectedPair.pair[0] === pair.pair[0] && selectedPair.pair[1] === pair.pair[1];
            const isSubmitted = submittedPairs.has(`${pair.pair[0]}-${pair.pair[1]}`);

            return (
              <button
                key={`pair-${idx}`}
                onClick={() => !isSubmitted && setSelectedPair(pair)}
                disabled={isSubmitted}
                className={`
                  w-full p-3 rounded-lg border text-left transition-all
                  ${isSelected
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20 ring-2 ring-brand-500'
                    : isSubmitted
                    ? 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20 opacity-60 cursor-not-allowed'
                    : `border-ink-200 dark:border-ink-800 hover:border-brand-400 dark:hover:border-brand-600 hover:bg-ink-50 dark:hover:bg-ink-900/20`
                  }
                `}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-semibold text-ink-900 dark:text-ink-50">
                      {getSuggestionIcon(pair.suggestion)} {pair.item_a} vs {pair.item_b}
                    </div>
                    <div className="text-xs text-ink-600 dark:text-ink-400 mt-1">
                      Variance: {pair.variance.toFixed(2)} | Range: {pair.min.toFixed(1)} - {pair.max.toFixed(1)} | Median: {pair.median.toFixed(1)}
                    </div>

                    {/* Expert views for this pair */}
                    <div className="text-xs text-ink-500 dark:text-ink-400 mt-1 flex flex-wrap gap-1">
                      {getExpertViewsForPair(pair.pair).map((view, i) => (
                        <span key={`view-${i}`} className="bg-ink-100 dark:bg-ink-900 px-2 py-0.5 rounded">
                          {experts[view.expert_id]?.name || view.expert_id.substring(0, 4)}: {view.value.toFixed(1)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {isSubmitted && (
                    <div className="text-green-600 dark:text-green-400 font-semibold">✓ Requested</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Select Expert to Request from */}
      {selectedPair && (
        <div className="border border-ink-200 dark:border-ink-800 rounded-lg p-4">
          <div className="text-sm font-semibold text-ink-900 dark:text-ink-50 mb-3">
            Step 2: Request Revision From
          </div>

          <div className="space-y-2">
            {getExpertViewsForPair(selectedPair.pair).map((view) => {
              const expert = experts[view.expert_id] || {};
              const isSelected = selectedExpert === view.expert_id;
              const isOutlier = expert.is_outlier;

              return (
                <button
                  key={view.expert_id}
                  onClick={() => setSelectedExpert(view.expert_id)}
                  className={`
                    w-full p-3 rounded-lg border text-left transition-all
                    ${isSelected
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20 ring-2 ring-brand-500'
                      : 'border-ink-200 dark:border-ink-800 hover:border-brand-400 dark:hover:border-brand-600 hover:bg-ink-50 dark:hover:bg-ink-900/20'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-ink-900 dark:text-ink-50">
                        {expert.name || 'Unknown Expert'}
                        {isOutlier && <span className="ml-2 text-red-600 dark:text-red-400">⚠️ Outlier</span>}
                      </div>
                      <div className="text-xs text-ink-600 dark:text-ink-400">
                        Their judgment: {view.value.toFixed(1)} (Others: {selectedPair.min.toFixed(1)} - {selectedPair.max.toFixed(1)})
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Custom Reason (Optional) */}
      {selectedPair && selectedExpert && (
        <div className="border border-ink-200 dark:border-ink-800 rounded-lg p-4">
          <div className="text-sm font-semibold text-ink-900 dark:text-ink-50 mb-3">
            Step 3: Custom Reason (Optional)
          </div>

          <textarea
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder="Optional message to expert (leave blank for auto-generated reason)"
            className="w-full p-3 rounded-lg border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            rows={3}
          />

          <div className="mt-3 text-xs text-ink-600 dark:text-ink-400">
            Auto-generated reason:
            <div className="mt-1 p-2 rounded bg-ink-50 dark:bg-ink-900/40 font-mono text-[11px]">
              {customReason || `High disagreement on "${selectedPair.item_a}" vs "${selectedPair.item_b}" (variance: ${selectedPair.variance.toFixed(2)}). Please review your judgment.`}
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      {selectedPair && selectedExpert && (
        <button
          onClick={handleRequestRevision}
          disabled={isSubmitting || isLoading}
          className="w-full p-3 rounded-lg bg-brand-600 hover:bg-brand-700 dark:bg-brand-700 dark:hover:bg-brand-600 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '📤 Sending Request...' : '📤 Send Revision Request'}
        </button>
      )}

      {/* Info Box */}
      <details className="text-xs border border-ink-200 dark:border-ink-800 rounded-lg p-3">
        <summary className="cursor-pointer font-semibold text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-100">
          What happens after I request a revision?
        </summary>
        <div className="mt-2 space-y-1 text-ink-700 dark:text-ink-200">
          <div>
            1. <strong>Expert is notified</strong> - They see a pending revision request in their dashboard
          </div>
          <div>
            2. <strong>Expert reviews peer data</strong> - They see how their judgment compares to peers (range/median only)
          </div>
          <div>
            3. <strong>Expert can revise or keep original</strong> - They have the choice to reconsider
          </div>
          <div>
            4. <strong>Aggregation updates automatically</strong> - Once revised, the case re-aggregates and you see the impact
          </div>
          <div className="mt-2 text-ink-600 dark:text-ink-400">
            💡 Tips: Request revision for HIGH_CONFLICT pairs first. If an expert is marked ⚠️ Outlier,
            their revision request may have the most impact.
          </div>
        </div>
      </details>
    </div>
  );
}

export default ConflictResolutionPanel;
