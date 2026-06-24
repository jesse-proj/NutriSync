import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { TooltipProvider } from './components/ui/tooltip'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import LoginPage from './screens/LoginPage.tsx'
import RegisterPage from './screens/RegisterPage.tsx'
import PatientDashboard from './screens/PatientDashboard.tsx'
import ClinicianDashboard from './screens/ClinicianDashboard.tsx'
import LandingPage from './screens/LandingPage.tsx'
import Reports from './screens/Reports.tsx'
import Goals from './screens/Goals.tsx'
import Profile from './screens/Profile.tsx'

const App = () => {
  return (
    <TooltipProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Patient Routes */}
            <Route
              path="/patient/dashboard"
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <PatientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/reports"
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/goals"
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <Goals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/profile"
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Protected Clinician Routes */}
            <Route
              path="/clinician/dashboard"
              element={
                <ProtectedRoute allowedRoles={['clinician']}>
                  <ClinicianDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  )
}

export default App
