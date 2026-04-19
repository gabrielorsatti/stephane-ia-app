import { AlertTriangle, RefreshCw } from "lucide-react";
import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card w-full max-w-sm text-center space-y-4 py-8">
          <div className="w-12 h-12 rounded-full bg-rose-500/15 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <p className="text-sm font-medium">Une erreur est survenue</p>
            <p className="text-xs text-text-muted mt-1">
              {this.state.error.message.slice(0, 200)}
            </p>
          </div>
          <button
            className="btn-primary mx-auto"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-4 h-4" />
            Recharger
          </button>
        </div>
      </div>
    );
  }
}
