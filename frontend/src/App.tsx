import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import AppLayout from './components/Layout/AppLayout';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import TeachersPage from './pages/Teachers';
import ClassesPage from './pages/Classes';
import RoomsPage from './pages/Rooms';
import CoursesPage from './pages/Courses';
import CoursePlansPage from './pages/CoursePlans';
import SchedulesPage from './pages/Schedules';
import ScheduleChangesPage from './pages/ScheduleChanges';
import NotificationsPage from './pages/Notifications';
import AuditLogsPage from './pages/AuditLogs';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="teachers" element={<TeachersPage />} />
        <Route path="classes" element={<ClassesPage />} />
        <Route path="rooms" element={<RoomsPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="course-plans" element={<CoursePlansPage />} />
        <Route path="schedules" element={<SchedulesPage />} />
        <Route path="schedule-changes" element={<ScheduleChangesPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
      </Route>
    </Routes>
  );
}
