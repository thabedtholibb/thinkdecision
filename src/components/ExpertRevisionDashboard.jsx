/**
 * Expert Revision Dashboard Component
 *
 * Shows expert any pending revision requests and allows them to review
 * peer judgments and submit revised values.
 *
 * Props:
 *   caseId: UUID - Case ID
 *   revisionRequests: [{pair, item_a, item_b, reason, requested_at}]
 *   peerData: {pair: {your_value, peer_range, peer_median, peer_mean}}
 *   onRevisionSubmitted: () => {} - Callback after revision submitted
 *   isLoading: boolean
 *
 * @component
 * @example
 * <ExpertRevisionDashboard
 *   caseId={caseId}
 *   revisionRequests={requests}
 *   peerData={peerComparisons}
 *   onRevisionSubmitted={() => refetch()}
 * />
 */

import React, { useState } from 'react';

function ExpertRevisionDashboard({
  caseId,
  revisionRequests = [],
  peerData = {},
  onRevisionSubmitted = null,
  isLoading = false
}) {
  // ===========================
  // STATE
  // ===========================

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [revisedValue, setRevisedValue] = useState(null);
  const [acceptanceNotes, setAcceptanceNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedRequests, setCompletedRequests] = useState(new Set());
  const [notification, setNotification] = useState(null);

  // ===========================
  // DATA VALIDATION
  // ===========================

  if (!revisionRequests || revisionRequests.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✓</span>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <div className="font-semibold">No pending revision requests</div>
            <div className="text-xs mt-1">You're all set! No further action needed for this case.</div>
          </div>
        </div>
      </div>
    );
  }

  // ===========================
  // HANDLERS
  // ===========================

  const handleSelectRequest = (request) => {
    setSelectedRequest(request);
    const pairKey = `${request.pair[0]}-${request.pair[1]}`;
    setRevisedValue(peerData[pairKey]?.your_value || null);
    setAcceptanceNotes('');
  };

  const handleSubmitRevision = async () => {
    if (revisedValue === null) {
      setNotification({ type: 'error', message: 'Please enter a revised value' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Call API to submit revision
      const response = await fetch(`/api/cases/${caseId}/submit-revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pair: selectedRequest.pair,
          new_value: revisedValue,
          acceptance_notes: acceptanceNotes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit revision');
      }

      // Success
      const pairKey = `${selectedRequest.pair[0]}-${selectedRequest.pair[1]}`;
      setCompletedRequests(new Set([...completedRequests, pairKey]));
      setNotification({
        type: 'success',
        message: `✓ Your revised judgment has been saved`
      });

      // Reset form
      setSelectedRequest(null);
      setRevisedValue(null);
      setAcceptanceNotes('');

      // Callback to parent
      if (onRevisionSubmitted && typeof onRevisionSubmitted === 'function') {
        onRevisionSubmitted();
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

  const handleKeepOriginal = () => {
    if (selectedRequest) {
      const pairKey = `${selectedRequest.pair[0]}-${selectedRequest.pair[1]}`;
      setCompletedRequests(new Set([...completedRequests, pairKey]));
      setNotification({
        type: 'info',
        message: '✓ You decided to keep your original judgment'
      });
      setSelectedRequest(null);
      setRevisedValue(null);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // ===========================
  // HELPERS
  // ===========================

  const getPeerRecommendation = (yourValue, peerMedian, peerStd) => {
    if (peerStd === 0) {
      return 'Other experts are unanimous on this.';
    }

    const zScore = (yourValue - peerMedian) / peerStd;

    if (Math.abs(zScore) < 1.0) {
      return '✓ Your judgment is close to the group median.';
    } else if (Math.abs(zScore) < 2.0) {
      return '⚠️ Your judgment differs somewhat from the group. Consider reviewing.';
    } else {
      return '⚠️ Your judgment differs significantly from the group. Please review carefully.';
    }
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
              : notification.type === 'error'
              ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
              : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="p-3 rounded-lg bg-ink-50 dark:bg-ink-950/40 border border-ink-200 dark:border-ink-800">
          <div className="text-xs text-ink-600 dark:text-ink-400 font-semibold">Pending</div>
          <div className="text-lg font-bold text-ink-900 dark:text-ink-50">
            {revisionRequests.length - completedRequests.size}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900">
          <div className="text-xs text-green-600 dark:text-green-400 font-semibold">Completed</div>
          <div className="text-lg font-bold text-green-900 dark:text-green-50">
            {completedRequests.size}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
          <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Total</div>
          <div className="text-lg font-bold text-blue-900 dark:text-blue-50">
            {revisionRequests.length}
          </div>
        </div>
      </div>

      {/* Request List */}
      <div className="space-y-2">
        {revisionRequests.map((request, idx) => {
          const pairKey = `${request.pair[0]}-${request.pair[1]}`;
          const isSelected = selectedRequest && selectedRequest.pair[0] === request.pair[0] && selectedRequest.pair[1] === request.pair[1];
          const isCompleted = completedRequests.has(pairKey);
          const peerInfo = peerData[pairKey] || {};

          return (
            <button
              key={`request-${idx}`}
              onClick={() => !isCompleted && handleSelectRequest(request)}
              disabled={isCompleted}
              className={`
                w-full p-4 rounded-lg border text-left transition-all
                ${isSelected
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20 ring-2 ring-brand-500'
                  : isCompleted
                  ? 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20 opacity-60 cursor-not-allowed'
                  : 'border-ink-200 dark:border-ink-800 hover:border-brand-400 dark:hover:border-brand-600 hover:bg-ink-50 dark:hover:bg-ink-900/20'
                }
              `}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  {/* Title */}
                  <div className="font-semibold text-ink-900 dark:text-ink-50">
                    Revise: {request.item_a} vs {request.item_b}
                  </div>

                  {/* Current Value & Peer Info */}
                  <div className="text-xs text-ink-600 dark:text-ink-400 mt-2 space-y-1">
                    <div>
                      <strong>Your current judgment:</strong> {peerInfo.your_value?.toFixed(1) || '—'}
                    </div>
                    <div>
                      <strong>Other experts:</strong> {peerInfo.peer_range ? `${peerInfo.peer_range[0].toFixed(1)} - ${peerInfo.peer_range[1].toFixed(1)}` : '—'} (median: {peerInfo.peer_median?.toFixed(1) || '—'})
                    </div>
                  </div>

                  {/* Creator's Reason */}
                  {request.reason && (
                    <div className="mt-2 p-2 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                      <div className="text-xs text-amber-700 dark:text-amber-300">
                        <strong>Creator's reason:</strong> {request.reason}
                      </div>
                    </div>
                  )}
                </div>

                {isCompleted && (
                  <div className="text-green-600 dark:text-green-400 font-semibold text-sm">✓ Done</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail View */}
      {selectedRequest && !completedRequests.has(`${selectedRequest.pair[0]}-${selectedRequest.pair[1]}`) && (
        <div className="border-2 border-brand-500 dark:border-brand-600 rounded-lg p-4 bg-brand-50/30 dark:bg-brand-950/30 space-y-4">
          <div className="text-sm font-semibold text-ink-900 dark:text-ink-50">
            📝 Review & Revise: {selectedRequest.item_a} vs {selectedRequest.item_b}
          </div>

          {/* Peer Comparison */}
          {peerData[`${selectedRequest.pair[0]}-${selectedRequest.pair[1]}`] && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800">
                <div className="text-ink-600 dark:text-ink-400 font-semibold">Your Judgment</div>
                <div className="text-2xl font-bold text-ink-900 dark:text-ink-50 mt-2">
                  {peerData[`${selectedRequest.pair[0]}-${selectedRequest.pair[1]}`].your_value?.toFixed(1)}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800">
                <div className="text-ink-600 dark:text-ink-400 font-semibold">Peer Median</div>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
                  {peerData[`${selectedRequest.pair[0]}-${selectedRequest.pair[1]}`].peer_median?.toFixed(1)}
                </div>
              </div>
            </div>
          )}

          {/* Recommendation */}
          {peerData[`${selectedRequest.pair[0]}-${selectedRequest.pair[1]}`] && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-sm text-blue-700 dark:text-blue-300">
              {getPeerRecommendation(
                peerData[`${selectedRequest.pair[0]}-${selectedRequest.pair[1]}`].your_value,
                peerData[`${selectedRequest.pair[0]}-${selectedRequest.pair[1]}`].peer_median,
                0.5 // placeholder std dev
              )}
            </div>
          )}

          {/* Revised Value Input */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-ink-900 dark:text-ink-50">
              Your Revised Judgment (Saaty Scale 1-9)
            </label>
            <input
              type="range"
              min="1"
              max="9"
              step="1"
              value={revisedValue || '1'}
              onChange={(e) => setRevisedValue(parseInt(e.target.value))}
              className="w-full cursor-pointer"
            />
            <div className="text-right text-sm font-bold text-brand-600 dark:text-brand-400">
              {revisedValue || '—'}
            </div>
          </div>

          {/* Optional Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-ink-900 dark:text-ink-50">
              Optional Notes
            </label>
            <textarea
              value={acceptanceNotes}
              onChange={(e) => setAcceptanceNotes(e.target.value)}
              placeholder="Why did you revise (or keep) this judgment?"
              className="w-full p-2 rounded-lg border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSubmitRevision}
              disabled={isSubmitting || isLoading || revisedValue === null}
              className="flex-1 p-2 rounded-lg bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '📤 Saving...' : '📤 Submit Revised Judgment'}
            </button>

            <button
              onClick={handleKeepOriginal}
              disabled={isSubmitting || isLoading}
              className="flex-1 p-2 rounded-lg bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✓ Keep Original
            </button>
          </div>

          <div className="text-xs text-ink-600 dark:text-ink-400">
            💡 You can submit a revised value or keep your original judgment. Either way, your decision helps improve our group consensus.
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpertRevisionDashboard;
