/* Error Boundary — gracefully handle component crashes */
const { Component } = React;

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-screen flex items-center justify-center bg-ink-50 dark:bg-ink-950 p-4">
          <div className="max-w-md w-full">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center mx-auto mb-4">
                <Icon name="warn" className="w-8 h-8 text-rose-600 dark:text-rose-400" />
              </div>
              <h2 className="text-xl font-semibold text-ink-900 dark:text-ink-50 mb-2">Oops, Ada Masalah</h2>
              <p className="text-sm text-ink-600 dark:text-ink-400 mb-6">
                Aplikasi mengalami kesalahan yang tidak terduga. Coba muat ulang halaman atau kembali ke beranda.
                Jika masalah berlanjut, hubungi tim dukungan.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 h-10 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium text-sm transition-colors"
                >
                  Muat Ulang
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex-1 h-10 bg-ink-200 dark:bg-ink-800 text-ink-900 dark:text-ink-100 rounded-lg hover:bg-ink-300 dark:hover:bg-ink-700 font-medium text-sm transition-colors"
                >
                  Ke Beranda
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Export for use in other files
if (typeof window !== 'undefined') {
  window.ErrorBoundary = ErrorBoundary;
}
