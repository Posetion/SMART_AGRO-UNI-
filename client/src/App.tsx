import { Navigate, Route, Routes } from 'react-router-dom';
import { SiteShell } from './components/SiteShell';
import { RequireRole } from './components/RequireRole';
import { AdminShell } from './components/admin/AdminShell';
import { LandingPage } from './pages/LandingPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { WeatherPage } from './pages/WeatherPage';
import { KnowledgePage } from './pages/KnowledgePage';
import { HeatmapPage } from './pages/HeatmapPage';
import { DetectPage } from './pages/DetectPage';
import { SocialPage } from './pages/SocialPage';
import { MessagesPage } from './pages/MessagesPage';
import { ChatPage } from './pages/ChatPage';
import { ProfilePage } from './pages/ProfilePage';
import { UserProfilePage } from './pages/UserProfilePage';
import { FaqPage } from './pages/FaqPage';
import { ContactPage } from './pages/ContactPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminKnowledge } from './pages/admin/AdminKnowledge';
import { AdminModeration } from './pages/admin/AdminModeration';
import { AdminDiagnoses } from './pages/admin/AdminDiagnoses';
import { AdminHeatmapStats } from './pages/admin/AdminHeatmapStats';
import { AdminAudit } from './pages/admin/AdminAudit';
import { AdminSettings } from './pages/admin/AdminSettings';

function AdminOnly({ children }: { children: React.ReactNode }) {
  return <RequireRole roles={['admin']}>{children}</RequireRole>;
}

function StaffOnly({ children }: { children: React.ReactNode }) {
  return <RequireRole roles={['admin', 'expert']}>{children}</RequireRole>;
}

export default function App() {
  return (
    <Routes>
      {/* One shared landing navbar for site + app pages */}
      <Route element={<SiteShell />}>
        <Route index element={<LandingPage />} />
        <Route path="home" element={<HomePage />} />
        <Route path="weather" element={<WeatherPage />} />
        <Route path="knowledge" element={<KnowledgePage />} />
        <Route path="heatmap" element={<HeatmapPage />} />
        <Route path="detect" element={<DetectPage />} />
        <Route path="social" element={<SocialPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="messages/join/:code" element={<MessagesPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/:userId" element={<UserProfilePage />} />
        <Route path="faq" element={<FaqPage />} />
        <Route path="contact" element={<ContactPage />} />
      </Route>

      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<LoginPage />} />

      <Route
        path="admin"
        element={
          <StaffOnly>
            <AdminShell />
          </StaffOnly>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route
          path="users"
          element={
            <AdminOnly>
              <AdminUsers />
            </AdminOnly>
          }
        />
        <Route
          path="knowledge"
          element={
            <AdminOnly>
              <AdminKnowledge />
            </AdminOnly>
          }
        />
        <Route
          path="moderation"
          element={
            <AdminOnly>
              <AdminModeration />
            </AdminOnly>
          }
        />
        <Route path="diagnoses" element={<AdminDiagnoses />} />
        <Route path="heatmap" element={<AdminHeatmapStats />} />
        <Route
          path="settings"
          element={
            <AdminOnly>
              <AdminSettings />
            </AdminOnly>
          }
        />
        <Route
          path="audit"
          element={
            <AdminOnly>
              <AdminAudit />
            </AdminOnly>
          }
        />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
