import {Component, type ErrorInfo, type ReactNode} from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {hasError: false, message: ''};
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let display = error.message || 'An unexpected error occurred.';
    try {
      const parsed = JSON.parse(display);
      if (parsed && typeof parsed.error === 'string') {
        display = parsed.error;
      }
    } catch {
      // Plain error message
    }
    return {hasError: true, message: display};
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#EDEDEB] text-[#111111] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white rounded-3xl border border-black/10 p-8 space-y-5">
            <p className="text-xs font-medium text-[#52524E]">IdeaCircuit · Application Notice</p>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#111111]">
              Something interrupted this view.
            </h1>
            <p className="text-sm text-[#52524E] leading-relaxed">{this.state.message}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => this.setState({hasError: false, message: ''})}
                className="bg-[#B9F53A] hover:bg-[#A8E828] text-[#111111] text-sm font-semibold px-5 py-2.5 rounded-full transition-colors cursor-pointer"
              >
                Try Again
              </button>
              <a
                href="/"
                onClick={() => this.setState({hasError: false, message: ''})}
                className="bg-[#EDEDEB] hover:bg-[#E3E3DF] text-[#111111] text-sm font-semibold px-5 py-2.5 rounded-full transition-colors"
              >
                Return Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
