import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import AuroraFX from './components/AuroraFX';

// Landing & Auth
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import EmergencyAccessPage from './pages/EmergencyAccessPage';
import { supabaseConfigured } from './lib/supabase';

// Patient pages
import PatientDashboard from './pages/patient/PatientDashboard';
import HealthRecords from './pages/patient/HealthRecords';
import AIAssistant from './pages/patient/AIAssistant';
import WellnessTracker from './pages/patient/WellnessTracker';
import HealthTrends from './pages/patient/HealthTrends';
import EmergencyProfile from './pages/patient/EmergencyProfile';
import DoctorSharing from './pages/patient/DoctorSharing';
import Settings from './pages/patient/Settings';

// Doctor pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorPatients from './pages/doctor/DoctorPatients';
import DoctorReports from './pages/doctor/DoctorReports';
import DoctorHistory from './pages/doctor/DoctorHistory';
import DoctorTrends from './pages/doctor/DoctorTrends';
import DoctorConsent from './pages/doctor/DoctorConsent';

function ProtectedLayout({ requiredRole }: { requiredRole: 'patient' | 'doctor' }) {
  const { currentUser, ready, error, clearError, sessionExpired } = useApp();
  if (!ready) return <div className="empty-state" role="status" style={{ minHeight: '100vh' }}><p>Loading…</p></div>;
  if (!currentUser) return <Navigate to={`/login/${requiredRole}${sessionExpired ? '?reason=expired' : ''}`} replace />;
  if (currentUser.role !== requiredRole) {
    return <Navigate to={currentUser.role === 'patient' ? '/patient/dashboard' : '/doctor/dashboard'} replace />;
  }
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {error && (
          <div role="alert" className="alert-banner">
            <span>{error}</span>
            <button className="btn btn-outline btn-sm" onClick={clearError} aria-label="Dismiss error">Dismiss</button>
          </div>
        )}
        {requiredRole === 'doctor' && !currentUser.doctorVerified && (
          <div role="status" className="alert-banner alert-info">
            Your doctor account is awaiting verification. You will not see any patient data until an administrator verifies your registration.
          </div>
        )}
        <Routes>
          {requiredRole === 'patient' ? (
            <>
              <Route path="dashboard" element={<PatientDashboard />} />
              <Route path="records" element={<HealthRecords />} />
              <Route path="ai-assistant" element={<AIAssistant />} />
              <Route path="wellness" element={<WellnessTracker />} />
              <Route path="trends" element={<HealthTrends />} />
              <Route path="emergency" element={<EmergencyProfile />} />
              <Route path="sharing" element={<DoctorSharing />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </>
          ) : (
            <>
              <Route path="dashboard" element={<DoctorDashboard />} />
              <Route path="patients" element={<DoctorPatients />} />
              <Route path="reports" element={<DoctorReports />} />
              <Route path="history" element={<DoctorHistory />} />
              <Route path="trends" element={<DoctorTrends />} />
              <Route path="consent" element={<DoctorConsent />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </>
          )}
        </Routes>
      </main>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login/:role" element={<LoginPage />} />
      <Route path="/register/:role" element={<RegisterPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/emergency/:token" element={<EmergencyAccessPage />} />
      <Route path="/patient/*" element={<ProtectedLayout requiredRole="patient" />} />
      <Route path="/doctor/*" element={<ProtectedLayout requiredRole="doctor" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AuroraFX />
        {!supabaseConfigured && (
          <div role="alert" className="alert-banner" style={{ margin: 0, borderRadius: 0 }}>
            Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see README) — sign-in and data are unavailable.
          </div>
        )}
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
