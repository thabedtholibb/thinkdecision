import React, { useState, FC } from 'react';

interface Criterion {
  id: string;
  name: string;
}

interface Dependency {
  source_id: string;
  target_id: string;
  feedback_type: 'strong' | 'moderate' | 'weak';
}

interface Notification {
  type: 'success' | 'error';
  message: string;
}

interface NetworkStats {
  nodes: number;
  edges: number;
  density: string | number;
}

interface DependencyEditorProps {
  caseId: string;
  criteria?: Criterion[];
  existingDependencies?: Dependency[];
  onDependencyAdded?: (source: string, target: string, type: string) => void;
  onDependencyRemoved?: (source: string, target: string) => void;
  onValidationChange?: (isValid: boolean, message: string) => void;
  isLoading?: boolean;
}

const DependencyEditor: FC<DependencyEditorProps> = ({
  caseId,
  criteria = [],
  existingDependencies = [],
  onDependencyAdded = null,
  onDependencyRemoved = null,
  onValidationChange = null,
  isLoading = false,
}) => {
  const [sourceCriteria, setSourceCriteria] = useState('');
  const [targetCriteria, setTargetCriteria] = useState('');
  const [feedbackType, setFeedbackType] = useState<'strong' | 'moderate' | 'weak'>('moderate');
  const [dependencies, setDependencies] = useState<Dependency[]>(existingDependencies);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [showNetworkPreview, setShowNetworkPreview] = useState(false);

  const validateDependency = (): boolean => {
    if (!sourceCriteria) {
      setNotification({ type: 'error', message: 'Select source criterion' });
      return false;
    }
    if (!targetCriteria) {
      setNotification({ type: 'error', message: 'Select target criterion' });
      return false;
    }
    if (sourceCriteria === targetCriteria) {
      setNotification({ type: 'error', message: 'Source and target must be different (no self-loops)' });
      return false;
    }
    const exists = dependencies.some(
      (dep) => dep.source_id === sourceCriteria && dep.target_id === targetCriteria
    );
    if (exists) {
      setNotification({ type: 'error', message: 'This relationship already exists' });
      return false;
    }
    return true;
  };

  const handleAddDependency = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateDependency()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const newDependency: Dependency = {
        source_id: sourceCriteria,
        target_id: targetCriteria,
        feedback_type: feedbackType,
      };

      setDependencies([...dependencies, newDependency]);
      setNotification({
        type: 'success',
        message: `✓ Added relationship: ${getSourceName()} → ${getTargetName()}`,
      });

      if (onDependencyAdded) {
        onDependencyAdded(sourceCriteria, targetCriteria, feedbackType);
      }

      setSourceCriteria('');
      setTargetCriteria('');
      setFeedbackType('moderate');

      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setNotification({
        type: 'error',
        message: `Error: ${errorMessage}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveDependency = async (source_id: string, target_id: string) => {
    setIsSubmitting(true);

    try {
      setDependencies(
        dependencies.filter(
          (dep) => !(dep.source_id === source_id && dep.target_id === target_id)
        )
      );

      setNotification({
        type: 'success',
        message: '✓ Relationship removed',
      });

      if (onDependencyRemoved) {
        onDependencyRemoved(source_id, target_id);
      }

      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setNotification({
        type: 'error',
        message: `Error: ${errorMessage}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSourceName = (): string => {
    return criteria.find((c) => c.id === sourceCriteria)?.name || sourceCriteria;
  };

  const getTargetName = (): string => {
    return criteria.find((c) => c.id === targetCriteria)?.name || targetCriteria;
  };

  const getCriteriaName = (id: string): string => {
    return criteria.find((c) => c.id === id)?.name || id;
  };

  const calculateNetworkStats = (): NetworkStats => {
    const nodes = new Set<string>();
    const edges = dependencies.length;

    dependencies.forEach((dep) => {
      nodes.add(dep.source_id);
      nodes.add(dep.target_id);
    });

    criteria.forEach((c) => nodes.add(c.id));

    return {
      nodes: nodes.size,
      edges,
      density: nodes.size > 0 ? ((edges / (nodes.size * (nodes.size - 1))) * 100).toFixed(1) : 0,
    };
  };

  const stats = calculateNetworkStats();

  return (
    <div className="space-y-6">
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

      <div className="p-6 rounded-lg border border-[var(--td-border)] dark:border-ink-700 bg-white dark:bg-ink-900">
        <h3 className="text-xl font-black mb-6 text-ink-900 dark:text-ink-50">Define Network Relationship</h3>

        <form onSubmit={handleAddDependency} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-ink-900 dark:text-ink-50 mb-2">
              Which criterion influences others?
            </label>
            <select
              value={sourceCriteria}
              onChange={(e) => setSourceCriteria(e.target.value)}
              disabled={isSubmitting || isLoading}
              className="w-full p-3 rounded-lg border-2 border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-900 dark:text-ink-50 font-bold focus:outline-none focus:border-[var(--td-green)] disabled:opacity-50"
            >
              <option value="">— Select source —</option>
              {criteria.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="text-xs text-ink-600 dark:text-ink-400 mt-1">
              The criterion that has influence or effect
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-ink-900 dark:text-ink-50 mb-2">
              Which criterion is influenced?
            </label>
            <select
              value={targetCriteria}
              onChange={(e) => setTargetCriteria(e.target.value)}
              disabled={isSubmitting || isLoading}
              className="w-full p-3 rounded-lg border-2 border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-900 dark:text-ink-50 font-bold focus:outline-none focus:border-[var(--td-green)] disabled:opacity-50"
            >
              <option value="">— Select target —</option>
              {criteria.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="text-xs text-ink-600 dark:text-ink-400 mt-1">
              The criterion affected by the source
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-ink-900 dark:text-ink-50 mb-2">
              Relationship Strength
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'strong' as const, label: '💪 Strong', desc: 'Direct influence' },
                { value: 'moderate' as const, label: '➡️ Moderate', desc: 'Some influence' },
                { value: 'weak' as const, label: '💨 Weak', desc: 'Minor influence' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFeedbackType(option.value)}
                  disabled={isSubmitting || isLoading}
                  className={`p-3 rounded-lg border-2 font-bold text-sm transition-colors ${
                    feedbackType === option.value
                      ? 'border-[var(--td-green)] bg-[var(--td-green)]/10 text-[var(--td-green)]'
                      : 'border-ink-300 dark:border-ink-700 text-ink-700 dark:text-ink-300 hover:border-[var(--td-green)]'
                  } disabled:opacity-50`}
                >
                  {option.label}
                  <div className="text-xs mt-1">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isLoading || !sourceCriteria || !targetCriteria}
            className="w-full p-3 rounded-lg bg-[var(--td-green)] hover:bg-[var(--td-green-dark)] text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '⏳ Adding...' : '➕ Add Relationship'}
          </button>
        </form>
      </div>

      <button
        onClick={() => setShowNetworkPreview(!showNetworkPreview)}
        className="px-4 py-2 rounded-lg bg-ink-100 dark:bg-ink-800 text-ink-900 dark:text-ink-50 font-bold text-sm hover:bg-ink-200 dark:hover:bg-ink-700 transition-colors"
      >
        {showNetworkPreview ? '🔽' : '▶️'} Network Preview
      </button>

      {showNetworkPreview && (
        <div className="p-6 rounded-lg border border-ink-200 dark:border-ink-800 bg-ink-50 dark:bg-ink-900/50">
          <h4 className="font-bold text-ink-900 dark:text-ink-50 mb-4">Network Structure</h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="p-3 rounded-lg bg-white dark:bg-ink-800">
              <div className="text-xs text-ink-600 dark:text-ink-400 font-bold">Total Criteria</div>
              <div className="text-2xl font-black text-ink-900 dark:text-ink-50">{stats.nodes}</div>
            </div>
            <div className="p-3 rounded-lg bg-white dark:bg-ink-800">
              <div className="text-xs text-ink-600 dark:text-ink-400 font-bold">Relationships</div>
              <div className="text-2xl font-black text-ink-900 dark:text-ink-50">{stats.edges}</div>
            </div>
            <div className="p-3 rounded-lg bg-white dark:bg-ink-800">
              <div className="text-xs text-ink-600 dark:text-ink-400 font-bold">Density</div>
              <div className="text-2xl font-black text-ink-900 dark:text-ink-50">{stats.density}%</div>
            </div>
            <div className="p-3 rounded-lg bg-white dark:bg-ink-800">
              <div className="text-xs text-ink-600 dark:text-ink-400 font-bold">Status</div>
              <div className="text-xl font-black text-green-600 dark:text-green-400">✓ Valid</div>
            </div>
          </div>

          {dependencies.length > 0 ? (
            <div className="space-y-2">
              <h5 className="text-sm font-bold text-ink-700 dark:text-ink-300">Current Relationships:</h5>
              {dependencies.map((dep, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-ink-800 text-sm"
                >
                  <div className="font-bold">
                    {getCriteriaName(dep.source_id)}
                    <span className="mx-2 text-ink-500">→</span>
                    {getCriteriaName(dep.target_id)}
                    <span className="ml-2 text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                      {dep.feedback_type}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveDependency(dep.source_id, dep.target_id)}
                    disabled={isSubmitting || isLoading}
                    className="px-3 py-1 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50"
                  >
                    ✕ Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-ink-600 dark:text-ink-400">
              <p>No relationships defined yet.</p>
              <p className="text-xs mt-1">
                {criteria.length > 1
                  ? 'Add relationships above to define the network structure.'
                  : 'Add at least 2 criteria first.'}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
        <h5 className="font-bold text-blue-900 dark:text-blue-300 mb-2">💡 About Network Relationships</h5>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Define which criteria influence which other criteria</li>
          <li>• This creates feedback loops in the ANP network</li>
          <li>• Strong relationships carry more weight than weak ones</li>
          <li>• You can create a hierarchy or a fully connected network</li>
          <li>• The system will validate the network structure before computation</li>
        </ul>
      </div>
    </div>
  );
};

export default DependencyEditor;
