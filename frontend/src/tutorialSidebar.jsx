/* Tutorial Sidebar for Expert and Creator */

function TutorialSidebar({ role = 'expert', method = 'AHP', onClose }) {
  const [activeTab, setActiveTab] = React.useState('overview');

  if (role === 'expert') {
    return <ExpertTutorials method={method} />;
  } else {
    return <CreatorTutorials method={method} />;
  }
}

// ============================================================
// SIDEBAR INTEGRATION COMPONENT
// ============================================================

function TutorialPanel({ show, role, method, onClose }) {
  if (!show) return null;

  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-white dark:bg-ink-900 border-l border-ink-200 dark:border-ink-800 shadow-2xl z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-ink-900 border-b border-ink-200 dark:border-ink-800 p-4 flex items-center justify-between">
        <div className="font-semibold text-ink-900 dark:text-ink-50">
          {role === 'expert' ? '📚 Tutorial Pakar' : '📚 Panduan Pembuat'}
        </div>
        <button onClick={onClose} className="text-ink-500 hover:text-ink-900 dark:hover:text-ink-50">
          <Icon name="x" className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <TutorialSidebar role={role} method={method} />
      </div>
    </div>
  );
}

// Export
window.TutorialPanel = TutorialPanel;
window.TutorialSidebar = TutorialSidebar;
