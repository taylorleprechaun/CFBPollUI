import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/auth-context';
import { PageVisibilityProvider } from './contexts/page-visibility-context';
import { SeasonProvider } from './contexts/season-context';
import { ThemeProvider } from './contexts/theme-context';
import { ErrorBoundary } from './components/error';
import './index.css';
import App from './App.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <PageVisibilityProvider>
              <AuthProvider>
                <SeasonProvider>
                  <App />
                </SeasonProvider>
              </AuthProvider>
            </PageVisibilityProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);
