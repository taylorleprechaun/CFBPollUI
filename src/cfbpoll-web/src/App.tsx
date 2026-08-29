import { lazy, type ReactNode, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { RequireAuth, RequireGuest, RequirePageEnabled } from './components/auth';
import { Layout } from './components/layout/layout';
import { usePageVisibility } from './hooks/use-page-visibility';

const AllTimePage = lazy(() => import('./pages/all-time-page'));
const CachePage = lazy(() => import('./pages/cache-page'));
const ExperimentalPage = lazy(() => import('./pages/experimental-page'));
const HomePage = lazy(() => import('./pages/home-page'));
const LoginPage = lazy(() => import('./pages/login-page'));
const PollLeadersPage = lazy(() => import('./pages/poll-leaders-page'));
const PredictionsPage = lazy(() => import('./pages/predictions-page'));
const PublicPredictionsPage = lazy(() => import('./pages/public-predictions-page'));
const RankingsPage = lazy(() => import('./pages/rankings-page'));
const RankingsSnapshotsPage = lazy(() => import('./pages/rankings-snapshots-page'));
const SeasonTrendsPage = lazy(() => import('./pages/season-trends-page'));
const SettingsPage = lazy(() => import('./pages/settings-page'));
const TeamDetailsPage = lazy(() => import('./pages/team-details-page'));
const TeamPredictionRecordsPage = lazy(() => import('./pages/team-prediction-records-page'));
const TrackRecordExplainedPage = lazy(() => import('./pages/track-record-explained-page'));
const TrackRecordPage = lazy(() => import('./pages/track-record-page'));

function App() {
  const { allTimeEnabled, pollLeadersEnabled, predictionsPageEnabled, seasonTrendsEnabled } = usePageVisibility();

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
        <Route path="predictions" element={
          <RequirePageEnabled enabled={predictionsPageEnabled}>
            <LazyPage><PublicPredictionsPage /></LazyPage>
          </RequirePageEnabled>
        } />
        <Route path="track-record" element={
          <RequirePageEnabled enabled={predictionsPageEnabled}>
            <LazyPage><TrackRecordPage /></LazyPage>
          </RequirePageEnabled>
        } />
        <Route path="track-record/explained" element={
          <RequirePageEnabled enabled={predictionsPageEnabled}>
            <LazyPage><TrackRecordExplainedPage /></LazyPage>
          </RequirePageEnabled>
        } />
        <Route path="team-prediction-records" element={
          <RequirePageEnabled enabled={predictionsPageEnabled}>
            <LazyPage><TeamPredictionRecordsPage /></LazyPage>
          </RequirePageEnabled>
        } />
        <Route element={<RequireGuest />}>
          <Route path="login" element={
            <LazyPage><LoginPage /></LazyPage>
          } />
        </Route>
        <Route element={<RequireAuth />}>
          <Route path="admin" element={<Navigate to="/admin/rankings" replace />} />
          <Route path="admin/rankings" element={
            <LazyPage><RankingsSnapshotsPage /></LazyPage>
          } />
          <Route path="admin/predictions" element={
            <LazyPage><PredictionsPage /></LazyPage>
          } />
          <Route path="admin/experimental" element={
            <LazyPage><ExperimentalPage /></LazyPage>
          } />
          <Route path="admin/settings" element={
            <LazyPage><SettingsPage /></LazyPage>
          } />
          <Route path="admin/cache" element={
            <LazyPage><CachePage /></LazyPage>
          } />
        </Route>
      </Route>
    </Routes>
  );
}

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-64">
      <div className="text-text-muted">Loading...</div>
    </div>
  );
}

export default App;
