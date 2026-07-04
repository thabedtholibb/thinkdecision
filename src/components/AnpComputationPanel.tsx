import React, { useState, FC } from 'react';

interface ANPResults {
  status: string;
  method: string;
  anp_weights: Record<string, number>;
  convergence_iterations: number;
  convergence_achieved: boolean;
  computation_time_ms: number;
}

interface Notification {
  type: 'success' | 'error' | 'info';
  message: string;
}

type ComputationStatus = 'idle' | 'validating' | 'computing' | 'converging' | 'complete' | 'error';

interface AnpComputationPanelProps {
  caseId: string;
  hasComparisons?: boolean;
  hasDependencies?: boolean;
  onComputationStart?: () => void;
  onComputationComplete?: (results: ANPResults) => void;
  onComputationError?: (error: Error) => void;
}

const AnpComputationPanel: FC<AnpComputationPanelProps> = ({
  caseId,
  hasComparisons = false,
  hasDependencies = false,
  onComputationStart = null,
  onComputationComplete = null,
  onComputationError = null,
}) => {
  const [isComputing, setIsComputing] = useState(false);
  const [computationProgress, setComputationProgress] = useState(0);
  const [computationStatus, setComputationStatus] = useState<ComputationStatus>('idle');
  const [results, setResults] = useState<ANPResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [convergenceIterations, setConvergenceIterations] = useState(0);
  const [notification, setNotification] = useState<Notification | null>(null);

  const canCompute = (): boolean => {
    return hasComparisons && hasDependencies;
  };

  const getBlockedReason = (): string | null => {
    if (!hasComparisons) return 'All pairwise comparisons must be completed';
    if (!hasDependencies) return 'Network dependencies must be defined';
    return null;
  };

  const handleComputeANP = async () => {
    if (!canCompute()) {
      setNotification({
        type: 'error',
        message: getBlockedReason() || 'Cannot compute',
      });
      return;
    }

    setIsComputing(true);
    setError(null);
    setResults(null);
    setComputationProgress(0);

    try {
      if (onComputationStart) {
        onComputationStart();
      }

      setComputationStatus('validating');
      setComputationProgress(10);
      await new Promise((resolve) => setTimeout(resolve, 500));

      setComputationStatus('computing');
      setComputationProgress(30);
      await new Promise((resolve) => setTimeout(resolve, 800));

      setComputationStatus('converging');
      setComputationProgress(60);

      const response = await fetch(`/api/cases/${caseId}/compute-anp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force_recompute: false }),
      });

      if (!response.ok) {
        throw new Error(`ANP computation failed: ${response.statusText}`);
      }

      const computedResults = await response.json();

      for (let i = 60; i < 95; i += 5) {
        setComputationProgress(i);
        setConvergenceIterations(computedResults.convergence_iterations || Math.floor((i - 60) / 5));
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      setComputationStatus('complete');
      setComputationProgress(100);
      setResults(computedResults);
      setConvergenceIterations(computedResults.convergence_iterations);

      setNotification({
        type: 'success',
        message: `✓ ANP computation complete (${computedResults.convergence_iterations} iterations)`,
      });

      if (onComputationComplete) {
        onComputationComplete(computedResults);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setComputationStatus('error');
      setError(errorMessage);
      setNotification({
        type: 'error',
        message: `Error: ${errorMessage}`,
      });

      if (onComputationError && err instanceof Error) {
        onComputationError(err);
      }
    } finally {
      setIsComputing(false);
    }
  };

  return (
    <div className="space-y-6">
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

      {!isComputing && computationStatus === 'idle' && (
        <div className="p-6 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900">
          <h3 className="text-xl font-black mb-4 text-ink-900 dark:text-ink-50">ANP Computation Readiness</h3>

          <div className="space-y-3 mb-6">
            <div
              className={`p-4 rounded-lg flex items-center gap-3 transition-colors ${
                hasComparisons
                  ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900'
                  : 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900'
              }`}
            >
              <div className="text-2xl">{hasComparisons ? '✅' : '❌'}</div>
              <div>
                <div className={`font-bold ${hasComparisons ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                  Pairwise Comparisons
                </div>
                <div className={`text-sm ${hasComparisons ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {hasComparisons ? 'All comparisons completed' : 'All experts must submit comparisons'}
                </div>
              </div>
            </div>

            <div
              className={`p-4 rounded-lg flex items-center gap-3 transition-colors ${
                hasDependencies
                  ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900'
                  : 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900'
              }`}
            >
              <div className="text-2xl">{hasDependencies ? '✅' : '❌'}</div>
              <div>
                <div className={`font-bold ${hasDependencies ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                  Network Dependencies
                </div>
                <div className={`text-sm ${hasDependencies ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {hasDependencies ? 'Network structure defined' : 'Define which criteria influence others'}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleComputeANP}
            disabled={!canCompute()}
            className={`w-full p-4 rounded-lg font-bold text-lg transition-colors ${
              canCompute()
                ? 'bg-[var(--td-green)] hover:bg-[var(--td-green-dark)] text-white'
                : 'bg-ink-300 dark:bg-ink-700 text-ink-600 dark:text-ink-400 cursor-not-allowed'
            }`}
          >
            {canCompute() ? '🚀 Compute ANP' : '⏳ ' + (getBlockedReason() || 'Not ready')}
          </button>
        </div>
      )}

      {isComputing && (
        <div className="p-6 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30">
          <h3 className="text-xl font-black mb-4 text-blue-900 dark:text-blue-300">Computing ANP Results</h3>

          <div className="space-y-2 mb-6">
            {computationStatus === 'validating' && (
              <div className="text-blue-700 dark:text-blue-300 font-bold">
                🔍 Validating network structure...
              </div>
            )}
            {computationStatus === 'computing' && (
              <div className="text-blue-700 dark:text-blue-300 font-bold">
                📊 Building supermatrix...
              </div>
            )}
            {computationStatus === 'converging' && (
              <div className="text-blue-700 dark:text-blue-300 font-bold">
                ⚙️ Computing limit matrix (iteration {convergenceIterations})...
              </div>
            )}
          </div>

          <div className="mb-4">
            <div className="w-full h-8 rounded-lg bg-blue-200 dark:bg-blue-900 overflow-hidden">
              <div
                className="h-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-bold text-sm transition-all"
                style={{ width: `${computationProgress}%` }}
              >
                {computationProgress > 10 && `${computationProgress}%`}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 rounded bg-white dark:bg-blue-900/50">
              <div className="text-xs text-blue-700 dark:text-blue-400">Status</div>
              <div className="font-bold text-blue-900 dark:text-blue-100 capitalize">
                {computationStatus}
              </div>
            </div>
            <div className="p-3 rounded bg-white dark:bg-blue-900/50">
              <div className="text-xs text-blue-700 dark:text-blue-400">Iterations</div>
              <div className="font-bold text-blue-900 dark:text-blue-100">
                {convergenceIterations > 0 ? convergenceIterations : '—'}
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-blue-700 dark:text-blue-300">
            <p>
              This process may take a few seconds. The system is computing the converged limit
              matrix of the ANP supermatrix to determine final alternative priorities.
            </p>
          </div>
        </div>
      )}

      {results && computationStatus === 'complete' && (
        <div className="p-6 rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30">
          <h3 className="text-xl font-black mb-4 text-green-900 dark:text-green-300">
            ✅ ANP Computation Complete
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="p-3 rounded-lg bg-white dark:bg-green-900/50 border border-green-200 dark:border-green-800">
              <div className="text-xs text-green-700 dark:text-green-400 font-bold">Convergence</div>
              <div className="text-2xl font-black text-green-900 dark:text-green-100">
                {results.convergence_achieved ? '✓' : '✗'}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white dark:bg-green-900/50 border border-green-200 dark:border-green-800">
              <div className="text-xs text-green-700 dark:text-green-400 font-bold">Iterations</div>
              <div className="text-2xl font-black text-green-900 dark:text-green-100">
                {results.convergence_iterations}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white dark:bg-green-900/50 border border-green-200 dark:border-green-800">
              <div className="text-xs text-green-700 dark:text-green-400 font-bold">Time</div>
              <div className="text-2xl font-black text-green-900 dark:text-green-100">
                {results.computation_time_ms}ms
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white dark:bg-green-900/50 border border-green-200 dark:border-green-800">
              <div className="text-xs text-green-700 dark:text-green-400 font-bold">Method</div>
              <div className="text-2xl font-black text-green-900 dark:text-green-100">
                {results.method}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-white dark:bg-green-900/50 border border-green-200 dark:border-green-800">
            <h4 className="font-bold text-green-900 dark:text-green-100 mb-3">Top Ranked Alternatives</h4>
            <div className="space-y-2">
              {results.anp_weights &&
                Object.entries(results.anp_weights)
                  .sort((a, b) => (b[1] as number) - (a[1] as number))
                  .map(([altId, weight], idx) => (
                    <div key={altId} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/30 rounded">
                      <div className="font-bold">#{idx + 1} {altId}</div>
                      <div className="font-mono font-bold text-green-700 dark:text-green-300">
                        {((weight as number) * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
            </div>
          </div>

          <button
            onClick={() => {
              setComputationStatus('idle');
              setResults(null);
              setComputationProgress(0);
            }}
            className="w-full mt-4 p-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold transition-colors"
          >
            📊 View Full Results
          </button>
        </div>
      )}

      {error && computationStatus === 'error' && (
        <div className="p-6 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30">
          <h3 className="text-xl font-black mb-4 text-red-900 dark:text-red-300">❌ Computation Failed</h3>

          <div className="p-4 rounded-lg bg-white dark:bg-red-900/50 border border-red-200 dark:border-red-800 mb-4">
            <div className="text-sm text-red-700 dark:text-red-300">
              <strong>Error:</strong> {error}
            </div>
          </div>

          <div className="text-sm text-red-700 dark:text-red-300 mb-4">
            <p>Common causes:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Network dependencies contain cycles</li>
              <li>Missing or invalid pairwise comparisons</li>
              <li>Matrix dimension mismatch</li>
              <li>Convergence threshold too strict</li>
            </ul>
          </div>

          <button
            onClick={() => {
              setComputationStatus('idle');
              setError(null);
              setResults(null);
            }}
            className="w-full p-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-colors"
          >
            🔄 Try Again
          </button>
        </div>
      )}

      <div className="p-4 rounded-lg bg-ink-100 dark:bg-ink-800 border border-ink-200 dark:border-ink-700">
        <h5 className="font-bold text-ink-900 dark:text-ink-50 mb-2">💡 About ANP Computation</h5>
        <ul className="text-sm text-ink-700 dark:text-ink-300 space-y-1">
          <li>• ANP builds on AHP by adding feedback loops between criteria</li>
          <li>• The supermatrix W is raised to successive powers until convergence</li>
          <li>• Final weights come from the limit matrix W^∞</li>
          <li>• Typically converges in 50-200 iterations</li>
          <li>• More complex networks may require more iterations</li>
        </ul>
      </div>
    </div>
  );
};

export default AnpComputationPanel;
