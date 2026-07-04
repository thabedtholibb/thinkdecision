export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-2 border-[var(--td-border)] border-t-[var(--td-green)] rounded-full animate-spin"></div>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 bg-[var(--td-surface)] rounded-[var(--td-radius-card)] animate-pulse"></div>
      ))}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="td-error">
      {message}
    </div>
  );
}
