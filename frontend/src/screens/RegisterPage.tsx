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
    <main className="flex h-screen w-full overflow-hidden items-center justify-center bg-radial from-[#e8eeff] to-[#f9f9ff]">
      <div className="w-full max-w-[480px] flex flex-col items-center px-4">
        {/* Logo Section */}
        <img alt="NutriSync Logo" className="h-34 w-34 object-contain mb-2" draggable="false" src={logoBrand} />

        {/* Registration Card */}
        <section className="bg-white/90 backdrop-blur-md border border-white/50 shadow-lg w-full rounded-xl px-6 py-5 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          {/* Header Text */}
          <div className="text-center space-y-0.5">
            <h1 className="text-headline-sm font-headline-sm text-on-surface">Create your Account</h1>
            <p className="text-body-sm font-body-sm text-on-surface-variant">Start your journey toward better nutritional recovery</p>
          </div>

          {/* Role Selection Segmented Control */}
          <div className="bg-surface-container p-1 rounded-lg flex relative" id="role-selector">
            <button
              className={`flex-1 py-1.5 text-label-sm font-label-sm rounded-md z-10 transition-all cursor-pointer ${role === 'patient'
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
              className={`flex-1 py-1.5 text-label-sm font-label-sm rounded-md z-10 transition-all cursor-pointer ${role === 'clinician'
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
            <div className="w-full p-3 text-xs text-red-800 bg-red-50 rounded-lg border border-red-200" role="alert">
              {error}
            </div>
          )}

          {/* Registration Form */}
          <form className="flex flex-col gap-3" onSubmit={handleRegister}>
            {/* Full Name */}
            <div className="flex flex-col gap-0.5">
              <label className="text-label-sm font-label-sm text-on-surface-variant ml-1" htmlFor="fullName">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                  <User className="h-4 w-4" />
                </span>
                <input
                  className="w-full pl-9 pr-4 py-2 bg-surface-bright border border-outline-variant rounded-lg text-sm text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-outline/50"
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
            <div className="flex flex-col gap-0.5">
              <label className="text-label-sm font-label-sm text-on-surface-variant ml-1" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  className="w-full pl-9 pr-4 py-2 bg-surface-bright border border-outline-variant rounded-lg text-sm text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-outline/50"
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
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-0.5">
                <label className="text-label-sm font-label-sm text-on-surface-variant ml-1" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    className="w-full pl-9 pr-4 py-2 bg-surface-bright border border-outline-variant rounded-lg text-sm text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-outline/50"
                    id="password"
                    placeholder="••••••••"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-label-sm font-label-sm text-on-surface-variant ml-1" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <input
                    className="w-full pl-9 pr-4 py-2 bg-surface-bright border border-outline-variant rounded-lg text-sm text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-outline/50"
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
              <div className="flex items-start gap-2">
                <div className="flex items-center h-5 mt-0.5">
                  <input
                    className="w-4 h-4 text-primary border-outline-variant rounded focus:ring-primary-container cursor-pointer transition-colors"
                    id="privacy"
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                </div>
                <label className="text-xs text-on-surface-variant leading-tight cursor-pointer select-none" htmlFor="privacy">
                  I agree to the Data Privacy Terms and understand that my information is handled in compliance with DPA 2012 guidelines
                </label>
              </div>
            )}

            {/* Submit Action */}
            <button
              className="w-full mt-1 bg-primary hover:bg-primary-container text-white font-bold py-2.5 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              <span className="text-label-md font-label-md text-sm">
                {loading ? 'Registering...' : 'Register'}
              </span>
              {!loading && <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          {/* Footer Login Link */}
          <div className="text-center">
            <p className="text-xs text-on-surface-variant">
              Already have an account?
              <Link className="text-primary font-bold hover:underline ml-1" to="/login">
                Log in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default RegisterPage

