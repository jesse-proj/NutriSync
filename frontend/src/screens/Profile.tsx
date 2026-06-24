import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import {
  Bell,
  LogOut,
  ChevronRight,
  Heart,
  Smartphone,
  ShieldCheck,
  HelpCircle,
  User,
  Fingerprint,
  Pin,
  MessageSquare,
  FileText
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { ScrollArea, ScrollBar } from '../components/ui/scroll-area'
import logoBrand from '../assets/nutrisync.png'
import Footer from '../components/Footer'

// ponytail: Profile.tsx uses state for setting toggles and hooks directly into the auth context logout

const Profile = () => {
  const { user, logout } = useAuth()

  // Medical Settings Toggles
  const [alertsEnabled, setAlertsEnabled] = useState(true)
  const [remindersEnabled, setRemindersEnabled] = useState(true)
  const [syncEnabled, setSyncEnabled] = useState(false)

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans relative">
      {/* Top Navigation Bar */}
      <header className="w-full top-0 sticky z-40 bg-surface shadow-sm border-b border-outline-variant">
        <nav className="flex justify-between items-center h-16 px-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-8">
            <Link to="/patient/dashboard" className="text-xl font-bold text-primary flex items-center gap-2">
              <img src={logoBrand} className="h-12 w-17" alt="logo" />
            </Link>
            <div className="hidden md:flex gap-6 items-center">
              <Link className="text-on-surface-variant hover:text-primary transition-colors text-sm" to="/patient/dashboard">Home</Link>
              <Link className="text-on-surface-variant hover:text-primary transition-colors text-sm" to="/patient/reports">Reports</Link>
              <Link className="text-on-surface-variant hover:text-primary transition-colors text-sm" to="/patient/goals">Goals</Link>
              <Link className="text-primary font-semibold border-b-2 border-primary pb-1 text-sm transition-all" to="/patient/profile">Profile</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-surface-container transition-all text-primary relative" title="Notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full ring-2 ring-surface"></span>
            </button>

            {/* Logged in User Profile Info */}
            <div className="flex items-center gap-3 pl-2 border-l border-outline-variant">
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-primary shrink-0">
                <img
                  className="w-full h-full object-cover"
                  alt="User avatar"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuChyJbiyPfsDfDICSP9EQpQ8xiACr-qDj8oMdPFQJ66o-FT-lsIsbrc5AB2MiOyGMwdToeG1GWRvfI0fc9QqLg4WayK8_M0W93MWQDK8semZzAhp27x4cqqMnmtt5dEacY4DkPYSjk6qJRa7Sn8VBla5E7RJwTAaMkwcYXejeI7NnndBQnA1qG7YCs8zupCop2nK_V5hFl_6rwNOSV7KDzUdaxMU7ln-CJKgIjNXStTdvy4LpFEj-gxUIIghQIEE6o5Zg5EPKA7sQ"
                />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs text-on-surface font-semibold">{user?.full_name}</p>
                <p className="text-[10px] text-on-surface-variant">Patient</p>
              </div>
              <Button
                onClick={logout}
                variant="ghost"
                className="p-2 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors ml-1"
                title="Log Out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <ScrollArea className="flex-grow w-full">
        <main className="max-w-7xl w-full mx-auto px-6 py-8">
          {/* Profile Header Section */}
          <section className="mb-8 bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30 flex flex-col md:flex-row items-center gap-6">
            <div className="relative shrink-0">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-surface-container shadow-md">
                <img
                  className="w-full h-full object-cover"
                  alt="Juan dela Cruz avatar"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZlpzXE2-0sR3v3bqtr03WZ-BIkMevSHYR_zHAXj-8JF61DbxG81HQDLpK-flf27_-dF-EdK0o6sN9X0sL9zVSDGJtspOgunR1fr02z7TBNRa846t36gnlFMtoxh9Eo8hDEbNOSA-0Ek0326bruJdOLUns5ibfOsb0faM333Mk1UtNmUKlUQLwK8renWNQUDzvwEIjZRlaeHGN_nVSL8MOGy34ElSEhWA1A6Zafeic7zhkm5bxTUPdy1nDS9gSYdrMCIQKKx7lDg"
                />
              </div>
            </div>
            <div className="flex-grow text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-on-surface tracking-tight">{user?.full_name || 'Juan dela Cruz'}</h1>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-semibold text-xs w-fit mx-auto md:mx-0">
                  Post-stroke recovery
                </span>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-on-surface-variant text-sm font-medium">
                <span className="flex items-center gap-1">
                  68 years old
                </span>
                <span className="flex items-center gap-1">
                  Quezon City, Philippines
                </span>
                <span className="flex items-center gap-1">
                  Patient ID: NS-99201
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 min-w-[200px] w-full md:w-auto">
              <Button className="w-full py-6 px-6 bg-primary text-on-primary rounded-xl font-bold text-sm hover:shadow-md transition-shadow flex items-center justify-center gap-2">
                Share Medical Record
              </Button>
            </div>
          </section>

          {/* Settings Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-left">
            {/* Personal Information */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/20 hover:border-primary transition-all">
              <div className="flex items-center gap-2 mb-6 border-b border-outline-variant/30 pb-4">
                <User className="text-primary h-5 w-5" />
                <h2 className="text-lg font-bold text-on-surface">Personal Information</h2>
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-center group cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Account Details</p>
                    <p className="text-sm font-semibold text-on-surface mt-0.5">{user?.email || 'juan.delacruz@health.ph'}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-outline group-hover:text-primary transition-colors" />
                </div>
                <div className="flex justify-between items-center group cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Caregiver Contact</p>
                    <p className="text-sm font-semibold text-on-surface mt-0.5">Maria dela Cruz (Daughter)</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-outline group-hover:text-primary transition-colors" />
                </div>
                <div className="flex justify-between items-center group cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Residential Address</p>
                    <p className="text-sm font-semibold text-on-surface mt-0.5">Brgy. Loyola Heights, Quezon City</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-outline group-hover:text-primary transition-colors" />
                </div>
              </div>
            </div>

            {/* Medical Settings */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/20 hover:border-primary transition-all">
              <div className="flex items-center gap-2 mb-6 border-b border-outline-variant/30 pb-4">
                <Heart className="text-primary h-5 w-5" />
                <h2 className="text-lg font-bold text-on-surface">Medical Settings</h2>
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-on-surface">Clinical Alerts</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">Notify when vitals exceed range</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={alertsEnabled}
                      onChange={e => setAlertsEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-on-surface">Medication Reminders</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">Daily push notifications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={remindersEnabled}
                      onChange={e => setRemindersEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Account Security */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/20 hover:border-primary transition-all">
              <div className="flex items-center gap-2 mb-6 border-b border-outline-variant/30 pb-4">
                <ShieldCheck className="text-primary h-5 w-5" />
                <h2 className="text-lg font-bold text-on-surface">Account Security</h2>
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-center group cursor-pointer">
                  <ShieldCheck className="h-5 w-5 text-secondary" />
                </div>
                <div className="flex justify-between items-center group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Pin className="text-on-surface-variant h-5 w-5" />
                    <div>
                      <p className="text-sm font-bold text-on-surface">Change Login PIN</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">Last changed 3 months ago</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-outline group-hover:text-primary transition-colors" />
                </div>
                <div className="flex justify-between items-center group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Smartphone className="text-on-surface-variant h-5 w-5" />
                    <div>
                      <p className="text-sm font-bold text-on-surface">Authorized Devices</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">2 active sessions</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-outline group-hover:text-primary transition-colors" />
                </div>
              </div>
            </div>

            {/* Support & Help */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/20 hover:border-primary transition-all">
              <div className="flex items-center gap-2 mb-6 border-b border-outline-variant/30 pb-4">
                <HelpCircle className="text-primary h-5 w-5" />
                <h2 className="text-lg font-bold text-on-surface">Support & Help</h2>
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-center group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="text-on-surface-variant h-5 w-5" />
                    <div>
                      <p className="text-sm font-bold text-on-surface">FAQs</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">Common app questions</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-outline group-hover:text-primary transition-colors" />
                </div>
                <div className="flex justify-between items-center group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="text-on-surface-variant h-5 w-5" />
                    <div>
                      <p className="text-sm font-bold text-on-surface">Chat with Care Team</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">Available Mon-Fri, 9AM-5PM</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-outline group-hover:text-primary transition-colors" />
                </div>
                <div className="flex justify-between items-center group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FileText className="text-on-surface-variant h-5 w-5" />
                    <div>
                      <p className="text-sm font-bold text-on-surface">Privacy Policy</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">How we handle your data</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-outline group-hover:text-primary transition-colors" />
                </div>
              </div>
            </div>
          </div>

          {/* Logout Action Area */}
          <div className="flex flex-col items-center gap-2 mt-12">
            <button
              onClick={logout}
              className="flex items-center justify-center gap-2 w-full max-w-xs py-3 border-2 border-error text-error font-bold text-sm rounded-xl hover:bg-error-container/10 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Logout from Device
            </button>
            <p className="text-xs text-on-surface-variant mt-1">App Version: 0.1 (Prototype Build)</p>
          </div>
        </main>

        <Footer />
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  )
}

export default Profile
