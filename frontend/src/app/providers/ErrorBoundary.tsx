import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/shared/ui';

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

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary перехопив помилку:', error, info);
  }

  private handleReset = (): void => {
    this.setState({ error: null });
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Щось пішло не так</h1>
          <p className="max-w-md text-sm text-slate-500">{this.state.error.message}</p>
          <Button onClick={this.handleReset}>На головну</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
