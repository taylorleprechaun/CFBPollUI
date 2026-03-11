import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import { RequireAuth, RequireGuest, RequirePageEnabled } from './components/auth';
import { Layout } from './components/layout/layout';
import { usePageVisibility } from './hooks/use-page-visibility';

const AllTimePage = lazy(() => import('./pages/all-time-page'));
const HomePage = lazy(() => import('./pages/home-page'));
const LoginPage = lazy(() => import('./pages/login-page'));
const PollLeadersPage = lazy(() => import('./pages/poll-leaders-page'));
const PredictionsPage = lazy(() => import('./pages/predictions-page'));
const RankingsPage = lazy(() => import('./pages/rankings-page'));
const SeasonTrendsPage = lazy(() => import('./pages/season-trends-page'));
const SettingsPage = lazy(() => import('./pages/settings-page'));
const SnapshotsPage = lazy(() => import('./pages/snapshots-page'));
const TeamDetailsPage = lazy(() => import('./pages/team-details-page'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-64">
      <div className="text-text-muted">Loading...</div>
    </div>
  );
}

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

function App() {
  const { allTimeEnabled, pollLeadersEnabled, seasonTrendsEnabled } = usePageVisibility();

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={
          <LazyPage><HomePage /></LazyPage>
        } />
        <Route path="rankings" element={
          <LazyPage><RankingsPage /></LazyPage>
        } />
        <Route path="team-details" element={
          <LazyPage><TeamDetailsPage /></LazyPage>
        } />
        <Route path="season-trends" element={
          <RequirePageEnabled enabled={seasonTrendsEnabled}>
            <LazyPage><SeasonTrendsPage /></LazyPage>
          </RequirePageEnabled>
        } />
        <Route path="all-time" element={
          <RequirePageEnabled enabled={allTimeEnabled}>
            <LazyPage><AllTimePage /></LazyPage>
          </RequirePageEnabled>
        } />
        <Route path="poll-leaders" element={
          <RequirePageEnabled enabled={pollLeadersEnabled}>
            <LazyPage><PollLeadersPage /></LazyPage>
          </RequirePageEnabled>
        } />
        <Route element={<RequireGuest />}>
          <Route path="login" element={
            <LazyPage><LoginPage /></LazyPage>
          } />
        </Route>
        <Route element={<RequireAuth />}>
          <Route path="admin" element={<Navigate to="/admin/snapshots" replace />} />
          <Route path="admin/snapshots" element={
            <LazyPage><SnapshotsPage /></LazyPage>
          } />
          <Route path="admin/predictions" element={
            <LazyPage><PredictionsPage /></LazyPage>
          } />
          <Route path="admin/settings" element={
            <LazyPage><SettingsPage /></LazyPage>
          } />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
