import { Component } from "react";

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-dvh flex items-center justify-center bg-green-50 px-4 text-center">
        <div>
          <p className="text-5xl">⚠️</p>
          <h1 className="text-xl font-bold text-gray-800 mt-3">Something went wrong</h1>
          <p className="text-gray-600 mt-1">Please reload the page. Your data is safe.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;