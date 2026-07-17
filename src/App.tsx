import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { TenantProvider } from './context/TenantContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import { DashboardLayout } from './layouts/DashboardLayout';
import { PublicLayout } from './layouts/PublicLayout';

// Pages
import { PublicWebsite } from './pages/PublicWebsite';
import { Dashboard } from './pages/Dashboard';
import { MemberDirectory } from './pages/MemberDirectory';
import { BusinessFeed } from './pages/BusinessFeed';
import { Announcements } from './pages/Announcements';
import { Campaigns } from './pages/Campaigns';
import { Complaints } from './pages/Complaints';
import { Meetings } from './pages/Meetings';
import { Events } from './pages/Events';
import { Polls } from './pages/Polls';
import { Expenses } from './pages/Expenses';
import { MediaGallery } from './pages/MediaGallery';
import { DocumentLibrary } from './pages/DocumentLibrary';
import { AdminPanel } from './pages/AdminPanel';
import { Auth } from './pages/Auth';

// Protected Route Guard Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin text-2xl">🔄</div>
      </div>
    );
  }

  // Redirect to login if session is empty
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Force password change overlay if flag is set
  if (user.needsPasswordChange) {
    return <Navigate to="/login" state={{ forcePasswordChange: true }} replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <TenantProvider>
          <AuthProvider>
            <Routes>
              {/* Authentication Node */}
              <Route path="login" element={<Auth />} />

              {/* Public visitor site node */}
              <Route 
                path="" 
                element={
                  <PublicLayout>
                    <PublicWebsite />
                  </PublicLayout>
                } 
              />

              {/* Authenticated member dashboard nodes */}
              <Route 
                path="dashboard" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Dashboard />
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="directory" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <MemberDirectory />
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="business" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <BusinessFeed />
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="announcements" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Announcements />
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="campaigns" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Campaigns />
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="complaints" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Complaints />
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="meetings" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Meetings />
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="events" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Events />
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="polls" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Polls />
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="expenses" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Expenses />
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="gallery" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <MediaGallery />
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="documents" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <DocumentLibrary />
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="admin" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <AdminPanel />
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />

              {/* Catch all redirecting back to public landing */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </TenantProvider>
      </BrowserRouter>
    </LanguageProvider>
  );
};
export default App;
