import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-paper px-4">
          <div className="max-w-md w-full">
            <div className="panel px-8 py-10 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#fdeaea] flex items-center justify-center">
                <svg className="w-8 h-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="font-display text-2xl font-bold text-ink mb-2">
                Something went wrong
              </h2>
              <p className="text-sm text-muted mb-6">
                We encountered an unexpected error. Don't worry, your data is safe.
              </p>
              {import.meta.env.DEV && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-xs font-bold text-pine mb-2">
                    Error Details (Development Only)
                  </summary>
                  <div className="bg-[#f7f8f5] border border-line rounded-lg p-3 text-xs font-mono text-danger overflow-auto max-h-60">
                    <div className="font-bold mb-2">{this.state.error.toString()}</div>
                    <div className="text-muted whitespace-pre-wrap">
                      {this.state.errorInfo?.componentStack}
                    </div>
                  </div>
                </details>
              )}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="btn btn-primary"
                >
                  Reload Page
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="btn btn-quiet"
                >
                  Go Home
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

export default ErrorBoundary;
