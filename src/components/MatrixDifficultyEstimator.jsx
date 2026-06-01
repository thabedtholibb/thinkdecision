/**
 * MatrixDifficultyEstimator Component
 *
 * Displays:
 * - Total pairs to compare
 * - Estimated completion time
 * - Difficulty level (Easy/Moderate/Challenging/Complex)
 * - Smart recommendations (e.g., start with top criteria)
 *
 * Props:
 *   criteriaCount: number of criteria to compare
 *   alternativeCount: number of alternatives per criterion
 *   onDifficultyChange: callback when difficulty level changes (optional)
 *
 * @component
 * @example
 * <MatrixDifficultyEstimator criteriaCount={3} alternativeCount={5} />
 */

function MatrixDifficultyEstimator({
  criteriaCount = 0,
  alternativeCount = 0,
  onDifficultyChange = null
}) {
  // ===========================
  // INPUT VALIDATION
  // ===========================

  const validateCount = (count, fieldName) => {
    const num = Number(count);
    if (isNaN(num) || num < 0) {
      console.warn(`Invalid ${fieldName}: ${count}. Using 0.`);
      return 0;
    }
    return Math.floor(num); // Ensure integer
  };

  const validCriteriaCount = validateCount(criteriaCount, 'criteriaCount');
  const validAlternativeCount = validateCount(alternativeCount, 'alternativeCount');

  // ===========================
  // CALCULATIONS
  // ===========================

  // Total pairs calculation
  // Criteria pairs: n*(n-1)/2
  // Alternative pairs per criterion: m*(m-1)/2
  // Total: criteria_pairs + (criteria_count * alternatives_pairs)

  const criteriaPairs = validCriteriaCount > 0
    ? (validCriteriaCount * (validCriteriaCount - 1)) / 2
    : 0;

  const alternativePairsPerCriterion = validAlternativeCount > 0
    ? (validAlternativeCount * (validAlternativeCount - 1)) / 2
    : 0;

  const totalPairs = criteriaPairs + (validCriteriaCount * alternativePairsPerCriterion);

  // Time estimate (1.5 minutes per pair on average)
  const timePerPair = 1.5; // minutes
  const estimatedMinutes = Math.ceil(totalPairs * timePerPair);

  // Convert to readable format
  const getTimeLabel = (minutes) => {
    if (minutes === 0) return 'No comparisons';
    if (minutes < 1) return '< 1 minute';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.ceil(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  const timeLabel = getTimeLabel(estimatedMinutes);

  // Difficulty assessment
  const getDifficultyLevel = (pairs) => {
    if (pairs === 0) return { level: 'NONE', label: 'No comparisons', color: 'bg-gray-50', textColor: 'text-gray-700', icon: '○' };
    if (pairs <= 6) return { level: 'EASY', label: 'Easy (5-10 min)', color: 'bg-green-50 dark:bg-green-950/20', textColor: 'text-green-700 dark:text-green-300', icon: '✓', borderColor: 'border-green-200 dark:border-green-900' };
    if (pairs <= 15) return { level: 'MODERATE', label: 'Moderate (15-25 min)', color: 'bg-blue-50 dark:bg-blue-950/20', textColor: 'text-blue-700 dark:text-blue-300', icon: '●', borderColor: 'border-blue-200 dark:border-blue-900' };
    if (pairs <= 28) return { level: 'CHALLENGING', label: 'Challenging (30-45 min)', color: 'bg-amber-50 dark:bg-amber-950/20', textColor: 'text-amber-700 dark:text-amber-300', icon: '⚠', borderColor: 'border-amber-200 dark:border-amber-900' };
    return { level: 'COMPLEX', label: 'Complex (60+ min)', color: 'bg-red-50 dark:bg-red-950/20', textColor: 'text-red-700 dark:text-red-300', icon: '❗', borderColor: 'border-red-200 dark:border-red-900' };
  };

  const difficulty = getDifficultyLevel(totalPairs);

  // Notify parent of difficulty change
  React.useEffect(() => {
    if (onDifficultyChange && typeof onDifficultyChange === 'function') {
      onDifficultyChange(difficulty.level);
    }
  }, [difficulty.level, onDifficultyChange]);

  // Smart recommendation
  const getRecommendation = () => {
    if (totalPairs === 0) {
      return null;
    }

    if (totalPairs <= 6) {
      return {
        icon: '✓',
        text: 'Great! This is a quick task. You can complete it in one session.',
        color: 'text-green-700 dark:text-green-300'
      };
    }

    if (totalPairs <= 15) {
      return {
        icon: '💡',
        text: 'Take your time and do this carefully. Review examples before starting.',
        color: 'text-blue-700 dark:text-blue-300'
      };
    }

    if (totalPairs <= 28) {
      return {
        icon: '⏱️',
        text: `This will take ~${estimatedMinutes} minutes. Start with top ${Math.ceil(validCriteriaCount / 2)} criteria first, then add others.`,
        color: 'text-amber-700 dark:text-amber-300'
      };
    }

    return {
      icon: '🎯',
      text: `Complex task (${estimatedMinutes}+ minutes). Strongly recommend breaking into multiple sessions. Start with 3-4 most important criteria.`,
      color: 'text-red-700 dark:text-red-300'
    };
  };

  const recommendation = getRecommendation();

  // ===========================
  // RENDER
  // ===========================

  return (
    <div className="space-y-3">
      {/* Main Difficulty Card */}
      <div className={`p-4 rounded-lg border ${difficulty.color} ${difficulty.borderColor || 'border-gray-200 dark:border-gray-800'}`}>
        <div className="flex items-start justify-between gap-3">
          {/* Left: Icon + Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{difficulty.icon}</span>
              <div>
                <div className={`font-bold text-sm ${difficulty.textColor}`}>
                  {difficulty.label}
                </div>
                <div className="text-xs text-ink-500 dark:text-ink-400">
                  {totalPairs} pairs to compare
                </div>
              </div>
            </div>
          </div>

          {/* Right: Time Estimate */}
          <div className="text-right flex-shrink-0">
            <div className="text-sm font-mono font-bold text-ink-900 dark:text-ink-50">
              {estimatedMinutes > 0 ? '⏱️ ' : ''}{timeLabel}
            </div>
            {estimatedMinutes > 0 && (
              <div className="text-xs text-ink-500 dark:text-ink-400 mt-1">
                {estimatedMinutes === 1 ? '~1 min' : `~${estimatedMinutes} min`}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Breakdown Details */}
      {totalPairs > 0 && (
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-ink-50 dark:bg-ink-950/40 border border-ink-200 dark:border-ink-800">
            <div className="text-ink-600 dark:text-ink-400 font-semibold">Criteria Pairs</div>
            <div className="text-lg font-bold text-ink-900 dark:text-ink-50 mt-1">
              {criteriaPairs}
            </div>
            <div className="text-ink-500 dark:text-ink-400 text-[11px] mt-0.5">
              comparing {validCriteriaCount} criteria
            </div>
          </div>

          <div className="p-3 rounded-lg bg-ink-50 dark:bg-ink-950/40 border border-ink-200 dark:border-ink-800">
            <div className="text-ink-600 dark:text-ink-400 font-semibold">Alt Pairs</div>
            <div className="text-lg font-bold text-ink-900 dark:text-ink-50 mt-1">
              {validCriteriaCount * alternativePairsPerCriterion}
            </div>
            <div className="text-ink-500 dark:text-ink-400 text-[11px] mt-0.5">
              {validCriteriaCount} criteria × {alternativePairsPerCriterion} each
            </div>
          </div>
        </div>
      )}

      {/* Smart Recommendation */}
      {recommendation && (
        <div className="p-3 rounded-lg bg-gradient-to-r from-transparent to-ink-50/50 dark:to-ink-950/50 border border-ink-200 dark:border-ink-800">
          <div className={`flex items-start gap-2 ${recommendation.color}`}>
            <span className="flex-shrink-0 text-lg">{recommendation.icon}</span>
            <div className="text-sm leading-relaxed">{recommendation.text}</div>
          </div>
        </div>
      )}

      {/* Info Box: How Time is Estimated */}
      <details className="text-xs">
        <summary className="cursor-pointer font-semibold text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-100">
          How is time estimated?
        </summary>
        <div className="mt-2 p-3 rounded-lg bg-ink-50 dark:bg-ink-950/40 text-ink-700 dark:text-ink-200 space-y-1">
          <div>• Average: 1.5 minutes per pairwise comparison</div>
          <div>• Based on: Understanding Saaty scale + entering judgment + validation</div>
          <div>• Variable: Depends on your familiarity with the criteria</div>
          <div>• Tip: First experts usually take 20% longer. Experts 2+ are 20% faster</div>
        </div>
      </details>
    </div>
  );
}

// Default export
export default MatrixDifficultyEstimator;
