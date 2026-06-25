import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, ShieldCheck, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import logoBrand from '../assets/nutrisync.png'

const PATIENT_COLOR = '#0058bc'
const CLINICIAN_COLOR = '#00B4AD'

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

  // ponytail: derive accent from current role; every element reads from this single source
  const accent = role === 'clinician' ? CLINICIAN_COLOR : PATIENT_COLOR

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
      setError(
        'Explicit consent to process health information is required for patients under the Philippine Data Privacy Act of 2012.'
      )
      return
    }

    setLoading(true)
    try {
      await register({
        email,
        full_name: fullName,
        role,
        consent_given: role === 'patient' ? consent : false,
        password,
      })
      navigate('/login', {
        state: { success: 'Account created successfully! Please log in.' },
      })
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Shared input class — focus border handled via inline style so it reacts to accent immediately
  const inputBase =
    'w-full pl-9 pr-4 py-2 bg-surface-bright border border-outline-variant rounded-lg text-sm text-on-surface outline-none placeholder:text-outline/50 transition-colors duration-300'

  const iconStyle: React.CSSProperties = {
    color: accent,
    transition: 'color 0.3s ease',
  }

  const inputStyle: React.CSSProperties = {
    // We handle focus with a global style block injected below
  }

  return (
    <main className="flex h-screen w-full overflow-hidden items-center justify-center bg-radial from-[#e8eeff] to-[#f9f9ff]">
      {/*
       * Inject a scoped <style> that targets focus within this page using the current
       * accent hex. React re-renders this on every role toggle → instant colour swap.
       */}
      <style>{`
        .reg-input:focus {
          outline: none;
          border-color: ${accent};
          box-shadow: 0 0 0 3px ${accent}33;
        }
        .reg-checkbox { accent-color: ${accent}; }
        .reg-submit  { background-color: ${accent}; transition: background-color 0.3s ease, opacity 0.2s; }
        .reg-submit:hover { opacity: 0.88; }
        .reg-tab-active { background-color: ${accent}; color: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.15); transition: background-color 0.3s ease; }
        .reg-tab-idle   { color: #717786; transition: color 0.3s ease; }
        .reg-link       { color: ${accent}; transition: color 0.3s ease; }
        .reg-icon       { color: ${accent}; transition: color 0.3s ease; }
      `}</style>

      <div className="w-full max-w-[480px] flex flex-col items-center px-4">
        {/* Logo */}
        <img
          alt="NutriSync Logo"
          className="h-34 w-34 object-contain mb-2"
          draggable="false"
          src={logoBrand}
        />

        {/* Card */}
        <section className="bg-white/90 backdrop-blur-md border border-white/50 shadow-lg w-full rounded-xl px-6 py-5 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          {/* Header */}
          <div className="text-center space-y-0.5">
            <h1 className="text-headline-sm font-headline-sm text-on-surface">
              Create your Account
            </h1>
            <p className="text-body-sm font-body-sm text-on-surface-variant">
              Start your journey toward better nutritional recovery
            </p>
          </div>

          {/* Role Segmented Control */}
          <div className="bg-surface-container p-1 rounded-lg flex" id="role-selector">
            <button
              className={`flex-1 py-1.5 text-label-sm font-label-sm rounded-md z-10 cursor-pointer ${
                role === 'patient' ? 'reg-tab-active' : 'reg-tab-idle'
              }`}
              onClick={() => { setRole('patient'); setError(null) }}
              type="button"
            >
              Patient
            </button>
            <button
              className={`flex-1 py-1.5 text-label-sm font-label-sm rounded-md z-10 cursor-pointer ${
                role === 'clinician' ? 'reg-tab-active' : 'reg-tab-idle'
              }`}
              onClick={() => { setRole('clinician'); setError(null) }}
              type="button"
            >
              Clinician
            </button>
          </div>

          {/* Error */}
          {error && (
            <div
              className="w-full p-3 text-xs text-red-800 bg-red-50 rounded-lg border border-red-200"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form className="flex flex-col gap-3" onSubmit={handleRegister}>
            {/* Full Name */}
            <div className="flex flex-col gap-0.5">
              <label className="text-label-sm font-label-sm text-on-surface-variant ml-1" htmlFor="fullName">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  <User className="h-4 w-4 reg-icon" style={inputStyle} />
                </span>
                <input
                  className={`${inputBase} reg-input`}
                  id="fullName"
                  placeholder="Juan dela Cruz"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-0.5">
              <label className="text-label-sm font-label-sm text-on-surface-variant ml-1" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Mail className="h-4 w-4 reg-icon" />
                </span>
                <input
                  className={`${inputBase} reg-input`}
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
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Lock className="h-4 w-4 reg-icon" />
                  </span>
                  <input
                    className={`${inputBase} reg-input`}
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
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">
                    <ShieldCheck className="h-4 w-4 reg-icon" />
                  </span>
                  <input
                    className={`${inputBase} reg-input`}
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

            {/* Consent — patient only */}
            {role === 'patient' && (
              <div className="flex items-start gap-2">
                <div className="flex items-center h-5 mt-0.5">
                  <input
                    className="w-4 h-4 border-outline-variant rounded cursor-pointer reg-checkbox"
                    id="privacy"
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                </div>
                <label
                  className="text-xs text-on-surface-variant leading-tight cursor-pointer select-none"
                  htmlFor="privacy"
                >
                  I agree to the Data Privacy Terms and understand that my
                  information is handled in compliance with DPA 2012 guidelines
                </label>
              </div>
            )}

            {/* Submit */}
            <button
              className="reg-submit w-full mt-1 text-white font-bold py-2.5 rounded-xl shadow-md active:scale-[0.98] flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              <span className="text-label-md font-label-md text-sm">
                {loading ? 'Registering...' : 'Register'}
              </span>
              {!loading && (
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-on-surface-variant">
              Already have an account?{' '}
              <Link className="reg-link font-bold hover:underline" to="/login">
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
