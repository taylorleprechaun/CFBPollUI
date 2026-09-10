import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App.tsx';
import { ErrorBoundary } from './components/error';
import { AuthProvider } from './contexts/auth-context';
import { PageVisibilityProvider } from './contexts/page-visibility-context';
import { SeasonProvider } from './contexts/season-context';
import { ThemeProvider } from './contexts/theme-context';
import './index.css';
import { KOFI_USERNAME } from './lib/config';
import { initKofiFloatingWidget } from './lib/kofi-widget';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

initKofiFloatingWidget(KOFI_USERNAME);

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
