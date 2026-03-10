import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { RequireAuth, RequireGuest, RequirePageEnabled } from './components/auth';
import { Layout } from './components/layout/layout';
import { usePageVisibility } from './hooks/use-page-visibility';

const AdminPage = lazy(() => import('./pages/admin-page').then(m => ({ default: m.AdminPage })));
const AllTimePage = lazy(() => import('./pages/all-time-page').then(m => ({ default: m.AllTimePage })));
const HomePage = lazy(() => import('./pages/home-page').then(m => ({ default: m.HomePage })));
const LoginPage = lazy(() => import('./pages/login-page').then(m => ({ default: m.LoginPage })));
const PollLeadersPage = lazy(() => import('./pages/poll-leaders-page').then(m => ({ default: m.PollLeadersPage })));
const RankingsPage = lazy(() => import('./pages/rankings-page').then(m => ({ default: m.RankingsPage })));
const SeasonTrendsPage = lazy(() => import('./pages/season-trends-page').then(m => ({ default: m.SeasonTrendsPage })));
const TeamDetailsPage = lazy(() => import('./pages/team-details-page').then(m => ({ default: m.TeamDetailsPage })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-64">
      <div className="text-text-muted">Loading...</div>
    </div>
  );
}

function App() {
  const { allTimeEnabled, pollLeadersEnabled, seasonTrendsEnabled } = usePageVisibility();

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={
          <Suspense fallback={<PageLoader />}>
            <HomePage />
          </Suspense>
        } />
        <Route path="rankings" element={
          <Suspense fallback={<PageLoader />}>
            <RankingsPage />
          </Suspense>
        } />
        <Route path="team-details" element={
          <Suspense fallback={<PageLoader />}>
            <TeamDetailsPage />
          </Suspense>
        } />
        <Route path="season-trends" element={
          <RequirePageEnabled enabled={seasonTrendsEnabled}>
            <Suspense fallback={<PageLoader />}>
              <SeasonTrendsPage />
            </Suspense>
          </RequirePageEnabled>
        } />
        <Route path="all-time" element={
          <RequirePageEnabled enabled={allTimeEnabled}>
            <Suspense fallback={<PageLoader />}>
              <AllTimePage />
            </Suspense>
          </RequirePageEnabled>
        } />
        <Route path="poll-leaders" element={
          <RequirePageEnabled enabled={pollLeadersEnabled}>
            <Suspense fallback={<PageLoader />}>
              <PollLeadersPage />
            </Suspense>
          </RequirePageEnabled>
        } />
        <Route element={<RequireGuest />}>
          <Route path="login" element={
            <Suspense fallback={<PageLoader />}>
              <LoginPage />
            </Suspense>
          } />
        </Route>
        <Route element={<RequireAuth />}>
          <Route path="admin" element={
            <Suspense fallback={<PageLoader />}>
              <AdminPage />
            </Suspense>
          } />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
