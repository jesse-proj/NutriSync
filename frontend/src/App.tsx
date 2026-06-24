import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { TooltipProvider } from './components/ui/tooltip'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import LoginPage from './screens/LoginPage'
import RegisterPage from './screens/RegisterPage'
import PatientDashboard from './screens/PatientDashboard'
import ClinicianDashboard from './screens/ClinicianDashboard'
import LandingPage from './screens/LandingPage'

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
