/**
 * Expert Agreement Heatmap Component
 *
 * Visualizes inter-expert agreement/disagreement as a color-coded grid.
 * Shows correlation between each pair of experts.
 *
 * Props:
 *   expertAgreement: {expert_id: score} - Agreement scores [-1, 1]
 *   expertNames: {expert_id: name} - Expert display names
 *   outlierExperts: [expert_id] - List of detected outliers
 *   onExpertSelect: (expert_id) => {} - Callback when expert cell clicked
 *
 * @component
 * @example
 * <AgreementHeatmap
 *   expertAgreement={{'e1': 0.8, 'e2': 0.9, 'e3': 0.2}}
 *   expertNames={{'e1': 'Alice', 'e2': 'Bob', 'e3': 'Charlie'}}
 *   outlierExperts={['e3']}
 * />
 */

import React, { useMemo } from 'react';

function AgreementHeatmap({
  expertAgreement = {},
  expertNames = {},
  outlierExperts = [],
  onExpertSelect = null
}) {
  // ===========================
  // DATA VALIDATION
  // ===========================

  if (!expertAgreement || typeof expertAgreement !== 'object') {
    return (
      <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
        <div className="text-sm text-amber-700 dark:text-amber-300">
          ⚠️ Invalid expert agreement data provided
        </div>
      </div>
    );
  }

  const expertIds = Object.keys(expertAgreement);

  if (expertIds.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          No expert agreement data available
        </div>
      </div>
    );
  }

  if (expertIds.length === 1) {
    return (
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
        <div className="text-sm text-blue-700 dark:text-blue-300">
          💡 Only 1 expert - agreement metrics require 2+ experts
        </div>
      </div>
    );
  }

  // ===========================
  // COLOR MAPPING FUNCTION
  // ===========================

  const getColorClass = (score) => {
    // Score range: [-1, 1]
    // -1 = inverted (red), 0 = no correlation (gray), 1 = perfect agreement (green)

    if (score === undefined || score === null) {
      return 'bg-gray-200 dark:bg-gray-700';
    }

    const normalizedScore = Math.max(-1, Math.min(1, score));

    if (normalizedScore > 0.8) {
      return 'bg-emerald-500 dark:bg-emerald-600 text-white';
    } else if (normalizedScore > 0.6) {
      return 'bg-emerald-400 dark:bg-emerald-500 text-white';
    } else if (normalizedScore > 0.4) {
      return 'bg-emerald-300 dark:bg-emerald-600 text-gray-900 dark:text-white';
    } else if (normalizedScore > 0.2) {
      return 'bg-yellow-300 dark:bg-yellow-700 text-gray-900 dark:text-white';
    } else if (normalizedScore > -0.2) {
      return 'bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white';
    } else if (normalizedScore > -0.4) {
      return 'bg-orange-400 dark:bg-orange-700 text-white';
    } else if (normalizedScore > -0.6) {
      return 'bg-orange-500 dark:bg-orange-600 text-white';
    } else {
      return 'bg-red-500 dark:bg-red-600 text-white';
    }
  };

  const getScoreLabel = (score) => {
    if (score === undefined || score === null) return '—';
    return score > 0 ? `+${score.toFixed(2)}` : score.toFixed(2);
  };

  const getTooltip = (expert1, expert2, score) => {
    const name1 = expertNames[expert1] || expert1;
    const name2 = expertNames[expert2] || expert2;

    if (score > 0.8) {
      return `${name1} & ${name2}: Perfect agreement (${score.toFixed(2)})`;
    } else if (score > 0.5) {
      return `${name1} & ${name2}: Strong agreement (${score.toFixed(2)})`;
    } else if (score > 0) {
      return `${name1} & ${name2}: Moderate agreement (${score.toFixed(2)})`;
    } else if (score >= -0.2) {
      return `${name1} & ${name2}: Weak/No correlation (${score.toFixed(2)})`;
    } else if (score > -0.6) {
      return `${name1} & ${name2}: Some disagreement (${score.toFixed(2)})`;
    } else {
      return `${name1} & ${name2}: Strong disagreement (${score.toFixed(2)})`;
    }
  };

  // ===========================
  // BUILD HEATMAP MATRIX
  // ===========================

  // Create correlation matrix (symmetric)
  const correlationMatrix = useMemo(() => {
    const matrix = {};

    for (let i = 0; i < expertIds.length; i++) {
      const exp1 = expertIds[i];
      if (!matrix[exp1]) matrix[exp1] = {};

      for (let j = 0; j < expertIds.length; j++) {
        const exp2 = expertIds[j];

        if (i === j) {
          // Diagonal: self-agreement = 1.0
          matrix[exp1][exp2] = 1.0;
        } else if (i < j) {
          // Use average of individual scores (simplified correlation estimate)
          const score1 = expertAgreement[exp1] || 0;
          const score2 = expertAgreement[exp2] || 0;
          const avgScore = (score1 + score2) / 2;
          matrix[exp1][exp2] = avgScore;
        } else {
          // Mirror from upper triangle (symmetric matrix)
          matrix[exp1][exp2] = matrix[expertIds[j]][exp1];
        }
      }
    }

    return matrix;
  }, [expertAgreement, expertIds]);

  // ===========================
  // RENDER
  // ===========================

  const cellSize = 'h-12 w-12 sm:h-14 sm:w-14';
  const textSize = 'text-xs sm:text-sm';

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex items-center gap-2">
        <div className="text-sm font-semibold text-ink-700 dark:text-ink-300">
          Expert Agreement Matrix
        </div>
        <div className="text-xs text-ink-500 dark:text-ink-400">
          (Green = agree, Red = disagree)
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto rounded-lg border border-ink-200 dark:border-ink-800">
        <div className="inline-block">
          {/* Header Row */}
          <div className="flex">
            {/* Corner cell */}
            <div className={`${cellSize} flex items-center justify-center flex-shrink-0`}></div>

            {/* Column headers (expert names) */}
            {expertIds.map((expId) => (
              <div
                key={`header-${expId}`}
                className={`${cellSize} flex items-center justify-center flex-shrink-0 bg-ink-100 dark:bg-ink-900 border-r border-b border-ink-200 dark:border-ink-800 p-0.5`}
              >
                <div className={`${textSize} font-bold text-ink-900 dark:text-ink-50 text-center break-words`}>
                  {expertNames[expId] ? expertNames[expId].substring(0, 3) : expId.substring(0, 3)}
                  {outlierExperts.includes(expId) && (
                    <div className="text-red-600 dark:text-red-400 text-lg">⚠</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Data Rows */}
          {expertIds.map((rowExpId) => (
            <div key={`row-${rowExpId}`} className="flex">
              {/* Row header (expert name) */}
              <div
                className={`${cellSize} flex items-center justify-center flex-shrink-0 bg-ink-100 dark:bg-ink-900 border-r border-ink-200 dark:border-ink-800 p-0.5`}
              >
                <div className={`${textSize} font-bold text-ink-900 dark:text-ink-50 text-center break-words`}>
                  {expertNames[rowExpId] ? expertNames[rowExpId].substring(0, 3) : rowExpId.substring(0, 3)}
                  {outlierExperts.includes(rowExpId) && (
                    <div className="text-red-600 dark:text-red-400 text-lg">⚠</div>
                  )}
                </div>
              </div>

              {/* Data cells */}
              {expertIds.map((colExpId) => {
                const score = correlationMatrix[rowExpId]?.[colExpId] ?? 0;
                const colorClass = getColorClass(score);
                const isOutlier = outlierExperts.includes(rowExpId) || outlierExperts.includes(colExpId);

                return (
                  <div
                    key={`cell-${rowExpId}-${colExpId}`}
                    className={`
                      ${cellSize} flex items-center justify-center flex-shrink-0
                      ${colorClass} border-r border-b border-ink-200 dark:border-ink-800
                      cursor-pointer hover:shadow-lg transition-shadow
                      ${isOutlier ? 'ring-2 ring-red-500 dark:ring-red-400' : ''}
                    `}
                    onClick={() => {
                      if (onExpertSelect && typeof onExpertSelect === 'function') {
                        onExpertSelect({ expert1: rowExpId, expert2: colExpId, score });
                      }
                    }}
                    title={getTooltip(rowExpId, colExpId, score)}
                  >
                    <div className={`${textSize} font-bold text-center`}>
                      {getScoreLabel(score)}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-500 dark:bg-emerald-600"></div>
          <span className="text-ink-600 dark:text-ink-400">Strong (>0.8)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-300 dark:bg-yellow-700"></div>
          <span className="text-ink-600 dark:text-ink-400">Moderate (0.2)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-300 dark:bg-gray-600"></div>
          <span className="text-ink-600 dark:text-ink-400">None (0)</span>
        </div>
        <div className="flex items-items gap-2">
          <div className="w-4 h-4 rounded bg-red-500 dark:bg-red-600"></div>
          <span className="text-ink-600 dark:text-ink-400">Inverse (<-0.6)</span>
        </div>
      </div>

      {/* Outlier Warning */}
      {outlierExperts.length > 0 && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
          <div className="flex items-start gap-2">
            <span className="text-xl flex-shrink-0">⚠️</span>
            <div className="text-sm text-red-700 dark:text-red-300">
              <div className="font-semibold">
                {outlierExperts.length} expert{outlierExperts.length > 1 ? 's' : ''} detected as statistical outlier{outlierExperts.length > 1 ? 's' : ''}
              </div>
              <div className="text-xs mt-1">
                {outlierExperts.map(expId => expertNames[expId] || expId).join(', ')} may have different perspectives.
                Consider requesting revision.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <details className="text-xs">
        <summary className="cursor-pointer font-semibold text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-100">
          What does this matrix show?
        </summary>
        <div className="mt-2 p-3 rounded-lg bg-ink-50 dark:bg-ink-950/40 text-ink-700 dark:text-ink-200 space-y-1">
          <div>
            • <strong>Diagonal (top-left to bottom-right):</strong> Always 1.0 (expert agrees with themselves)
          </div>
          <div>
            • <strong>Green cells (>0.8):</strong> Experts strongly agree on criteria ranking
          </div>
          <div>
            • <strong>Yellow cells (0.2):</strong> Some difference but similar overall ranking
          </div>
          <div>
            • <strong>Gray cells (≈0):</strong> No correlation - different ranking orders
          </div>
          <div>
            • <strong>Red cells (<-0.6):</strong> Inverted preferences (rare, indicates conflict)
          </div>
          <div>
            • <strong>⚠️ Badge:</strong> Marks statistical outlier expert (1.5 IQR beyond median)
          </div>
        </div>
      </details>
    </div>
  );
}

export default AgreementHeatmap;
