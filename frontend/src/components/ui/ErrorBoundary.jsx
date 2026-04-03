import { Component } from "react";
import { Link } from "react-router-dom";

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production, send to your error tracking service (Sentry, etc.)
    console.error("[ErrorBoundary] Uncaught error:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "var(--bg)" }}
      >
        <div className="text-center max-w-md">
          <div
            className="text-6xl mb-4"
            style={{ animation: "float 3s ease-in-out infinite" }}
          >
            😵
          </div>
          <h1
            className="font-display font-bold text-2xl mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Something went wrong
          </h1>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            An unexpected error occurred. Our team has been notified.
          </p>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <pre
              className="text-left text-xs p-4 rounded-2xl mb-6 overflow-auto"
              style={{
                background: "rgba(239,68,68,0.08)",
                color: "#ef4444",
                border: "1px solid rgba(239,68,68,0.2)",
                maxHeight: 200,
              }}
            >
              {this.state.error.toString()}
            </pre>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="btn btn-brand text-sm"
            >
              Reload Page
            </button>
            <Link to="/" className="btn btn-ghost text-sm">
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }
}