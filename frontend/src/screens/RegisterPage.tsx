import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, ShieldCheck, ArrowRight, Shield, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import logoBrand from '../assets/nutrisync.png'

const RegisterPage: React.FC = () => {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [role, setRole] = useState<'patient' | 'clinician'>('patient')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (role === 'patient' && !consent) {
      setError('Explicit consent to process health information is required for patients under the Philippine Data Privacy Act of 2012.')
      return
    }

    setLoading(true)
    try {
      await register({
        email,
        full_name: fullName,
        role,
        consent_given: role === 'patient' ? consent : false,
        password
      })
      // Redirect to login with success message
      navigate('/login', {
        state: { success: 'Account created successfully! Please log in.' }
      })
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-radial from-[#e8eeff] to-[#f9f9ff]">
      <div className="w-full max-w-[500px] flex flex-col items-center">
        {/* Logo Section */}
        <img alt="NutriSync Logo" className="h-32 w-32 object-contain" draggable="false" src={logoBrand} />

        {/* Registration Card */}
        <section className="bg-white/90 backdrop-blur-md border border-white/50 shadow-lg w-full rounded-xl p-8 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          {/* Header Text */}
          <div className="text-center space-y-2">
            <h1 className="text-headline-md font-headline-md text-on-surface">Create your Account</h1>
            <p className="text-body-md font-body-md text-on-surface-variant">Start your journey toward better nutritional recovery</p>
          </div>

          {/* Role Selection Segmented Control */}
          <div className="bg-surface-container p-1 rounded-lg flex relative" id="role-selector">
            <button
              className={`flex-1 py-2 text-label-md font-label-md rounded-md z-10 transition-all cursor-pointer ${role === 'patient'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
                }`}
              onClick={() => {
                setRole('patient')
                setError(null)
              }}
              type="button"
            >
              Patient
            </button>
            <button
              className={`flex-1 py-2 text-label-md font-label-md rounded-md z-10 transition-all cursor-pointer ${role === 'clinician'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
                }`}
              onClick={() => {
                setRole('clinician')
                setError(null)
              }}
              type="button"
            >
              Clinician
            </button>
          </div>

          {error && (
            <div className="w-full p-4 text-sm text-red-800 bg-red-50 rounded-lg border border-red-200" role="alert">
              {error}
            </div>
          )}

          {/* Registration Form */}
          <form className="flex flex-col gap-4" onSubmit={handleRegister}>
            {/* Full Name */}
            <div className="flex flex-col gap-1">
              <label className="text-label-sm font-label-sm text-on-surface-variant ml-1" htmlFor="fullName">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                  <User className="h-5 w-5" />
                </span>
                <input
                  className="w-full pl-10 pr-4 py-3 bg-surface-bright border border-outline-variant rounded-lg text-body-md font-body-md text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-outline/50"
                  id="fullName"
                  placeholder="Juan dela Cruz"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="flex flex-col gap-1">
              <label className="text-label-sm font-label-sm text-on-surface-variant ml-1" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  className="w-full pl-10 pr-4 py-3 bg-surface-bright border border-outline-variant rounded-lg text-body-md font-body-md text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-outline/50"
                  id="email"
                  placeholder="name@company.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-label-sm font-label-sm text-on-surface-variant ml-1" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                    <Lock className="h-5 w-5" />
                  </span>
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-surface-bright border border-outline-variant rounded-lg text-body-md font-body-md text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-outline/50"
                    id="password"
                    placeholder="••••••••"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-label-sm font-label-sm text-on-surface-variant ml-1" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-surface-bright border border-outline-variant rounded-lg text-body-md font-body-md text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-outline/50"
                    id="confirmPassword"
                    placeholder="••••••••"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Privacy Compliance (Only visible for Patient role) */}
            {role === 'patient' && (
              <div className="flex items-start gap-3 mt-1">
                <div className="flex items-center h-5">
                  <input
                    className="w-5 h-5 text-primary border-outline-variant rounded focus:ring-primary-container cursor-pointer transition-colors"
                    id="privacy"
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                </div>
                <label className="text-label-sm font-label-sm text-on-surface-variant leading-tight cursor-pointer select-none" htmlFor="privacy">
                  I agree to the Data Privacy Terms and understand that my information is handled in compliance with DPA 2012 guidelines
                </label>
              </div>
            )}

            {/* Submit Action */}
            <button
              className="w-full mt-4 bg-primary hover:bg-primary-container text-white font-bold py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              <span className="text-label-md font-label-md">
                {loading ? 'Registering...' : 'Register'}
              </span>
              {!loading && <ArrowRight className="h-[18px] w-[18px] group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          {/* Footer Login Link */}
          <div className="text-center pt-2">
            <p className="text-label-md font-label-md text-on-surface-variant">
              Already have an account?
              <Link className="text-primary font-bold hover:underline ml-1" to="/login">
                Log in
              </Link>
            </p>
          </div>
        </section>

        {/* Compliance Badges */}
        <footer className="mt-8 flex items-center justify-center gap-4 text-outline opacity-80 animate-in fade-in duration-1000 delay-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-primary" />
            <span className="text-label-sm font-label-sm">HIPAA Compliant</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-outline-variant"></div>
          <div className="flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-label-sm font-label-sm">SSL Encrypted</span>
          </div>
        </footer>
      </div>
    </main>
  )
}

export default RegisterPage
