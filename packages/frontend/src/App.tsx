import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/features/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LubricationPage from './pages/LubricationPage';
import ReplacementPage from './pages/ReplacementPage';
import PartsPage from './pages/PartsPage';
import NotificationsPage from './pages/NotificationsPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import TopicsPage from './pages/TopicsPage';
import MaintenanceProceduresPage from './pages/MaintenanceProceduresPage';
import InquiriesPage from './pages/InquiriesPage';
import AlertDetailsPage from './pages/AlertDetailsPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/lubrication" element={<LubricationPage />} />
            <Route path="/replacements" element={<ReplacementPage />} />
            <Route path="/parts" element={<PartsPage />} />
            <Route path="/maintenance-procedures" element={<MaintenanceProceduresPage />} />
            <Route path="/topics" element={<TopicsPage />} />
            <Route path="/inquiries" element={<InquiriesPage />} />
            <Route path="/alerts/:type" element={<AlertDetailsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
