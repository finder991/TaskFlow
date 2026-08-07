import { BrowserRouter } from 'react-router-dom';
import { useSessionBootstrap } from '@/entities/session';
import { ErrorBoundary } from './providers/ErrorBoundary';
import { QueryProvider } from './providers/QueryProvider';
import { AppRouter } from './router/AppRouter';

function SessionGate() {
  useSessionBootstrap();
  return <AppRouter />;
}

export function App() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <BrowserRouter>
          <SessionGate />
        </BrowserRouter>
      </QueryProvider>
    </ErrorBoundary>
  );
}
