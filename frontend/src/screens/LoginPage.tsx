import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Fingerprint, Type } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import logoBrand from '../assets/nutrisync.png'
import doctorConsultation from '../assets/doctor_consultation.jpg'
import avatarDoctor from '../assets/avatar_doctor.jpg'
import avatarPatient from '../assets/avatar_patient.jpg'
import avatarNurse from '../assets/avatar_nurse.jpg'

const LoginPage: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [textSize, setTextSize] = useState<'normal' | 'large' | 'xlarge'>('normal')

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)
    try {
      await login(email, password)
      // On success, AuthContext sets the user, and the top-level app router
      // handles redirection, but let's proactively query the role from localStorage
      // or wait a brief moment. Since auth state update is synchronous or useEffect runs,
      // let's read the role from localStorage directly to navigate immediately!
      const role = localStorage.getItem('role')
      if (role === 'patient') {
        navigate('/patient/dashboard')
      } else if (role === 'clinician') {
        navigate('/clinician/dashboard')
      } else {
        navigate('/')
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleAdjustTextSize = () => {
    if (textSize === 'normal') {
      setTextSize('large')
    } else if (textSize === 'large') {
      setTextSize('xlarge')
    } else {
      setTextSize('normal')
    }
  }

  const getTextClass = () => {
    if (textSize === 'large') return 'text-[18px]'
    if (textSize === 'xlarge') return 'text-[20px]'
    return 'text-[16px]'
  }

  return (
    <main className={`flex min-h-screen w-full select-none text-on-surface ${textSize === 'large' ? 'scale-102 transition-transform' : textSize === 'xlarge' ? 'scale-105 transition-transform' : ''
      }`}>
      {/* Left Side: Visual/Contextual Brand Section */}
      <section className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${doctorConsultation})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/80 to-primary/20"></div>
        </div>
        {/* Content on Image */}
        <div className="relative z-10 flex flex-col justify-end p-20 text-white">
          <h1 className="font-headline-xl text-headline-xl mb-4 max-w-lg">
            Caring for your health, wherever you are.
          </h1>
          <p className="font-body-lg text-body-lg text-white/90 max-w-md">
            Join thousands of patients and healthcare providers using NutriSync RPM for precise, intelligent nutritional monitoring.
          </p>
        </div>
      </section>

      {/* Right Side: Login Form Canvas */}
      <section className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 md:p-20 bg-surface">
        <div className="w-full max-w-[440px] flex flex-col items-center min-h-[600px]">
          {/* Brand Anchor: Logo */}
          <img alt="NutriSync RPM Logo" className="h-32 w-32 object-contain" draggable="false" src={logoBrand} />

          {/* Form Header */}
          <div className="text-center mb-8">
            <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Welcome to NutriSync RPM</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Intelligent monitoring for your nutritional health</p>
          </div>

          {error && (
            <div className="w-full p-4 mb-4 text-sm text-red-800 bg-red-50 rounded-lg border border-red-200" role="alert">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form className="w-full space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="space-y-2">
              <label className="font-label-md text-label-md text-on-surface-variant ml-1" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  className={`w-full h-[52px] pl-12 pr-4 rounded-lg border border-outline-variant bg-white text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none placeholder:text-outline/50 ${getTextClass()}`}
                  id="email"
                  name="email"
                  placeholder="name@healthcare.ph"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="password">
                  Password
                </label>
                <a className="font-label-sm text-label-sm text-primary hover:underline transition-all" href="#">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  className={`w-full h-[52px] pl-12 pr-12 rounded-lg border border-outline-variant bg-white text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none placeholder:text-outline/50 ${getTextClass()}`}
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                  type="button"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Action Button */}
            <button
              className="w-full h-[52px] bg-primary text-white font-label-md text-label-md rounded-lg flex items-center justify-center gap-2 shadow-sm hover:bg-primary-container transition-all active:scale-[0.98] duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
              {!loading && <ArrowRight className="h-5 w-5" />}
            </button>

            {/* Divider */}
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-outline-variant"></div>
              <span className="flex-shrink mx-4 text-outline font-label-sm text-label-sm">OR</span>
              <div className="flex-grow border-t border-outline-variant"></div>
            </div>

            {/* Biometric Login Option */}
            <button
              className="w-full h-[52px] border border-outline-variant bg-white text-on-surface font-label-md text-label-md rounded-lg flex items-center justify-center gap-3 hover:bg-surface-container-low transition-colors active:scale-[0.98] cursor-pointer"
              type="button"
              onClick={() => alert('Biometric login is not available on this device.')}
            >
              <Fingerprint className="h-5 w-5 text-primary" />
              Biometric Login
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-8 text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Don't have an account?
              <Link className="text-primary font-label-md hover:underline ml-1" to="/register">
                Sign up
              </Link>
            </p>
          </div>

          {/* Accessibility: Text Size Toggle */}
          <div className="mt-auto pt-10 flex items-center gap-4">
            <button
              className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant flex items-center gap-2 transition-colors cursor-pointer"
              title="Text Accessibility"
              onClick={handleAdjustTextSize}
            >
              <Type className="h-5 w-5" />
              <span className="font-label-sm text-label-sm">
                Text Size: <span className="font-bold uppercase text-primary">{textSize}</span>
              </span>
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}

export default LoginPage
