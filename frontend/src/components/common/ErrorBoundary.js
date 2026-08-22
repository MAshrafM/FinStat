import React from 'react';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('UI Crash Caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-wrapper">
          <div className="error-boundary-card">
            <div className="error-boundary-icon-badge">
              <AlertOctagon size={48} className="error-boundary-icon" />
            </div>
            <h2 className="error-boundary-title">Something went wrong</h2>
            <p className="error-boundary-desc">
              An unexpected UI error occurred while rendering this page. You can reload or navigate back to the dashboard.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="error-boundary-debug">
                {this.state.error.toString()}
              </pre>
            )}
            <div className="error-boundary-actions">
              <button
                className="error-boundary-btn error-boundary-btn-primary"
                onClick={this.handleReload}
              >
                <RotateCcw size={16} />
                Reload Page
              </button>
              <button
                className="error-boundary-btn error-boundary-btn-secondary"
                onClick={this.handleGoHome}
              >
                <Home size={16} />
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
