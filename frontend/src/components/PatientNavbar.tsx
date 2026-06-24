// ponytail: Shared patient navbar component — update once, reflects on all patient screens

import { Link } from 'react-router-dom'
import { Bell, LogOut } from 'lucide-react'
import { Button } from './ui/button'
import { useAuth } from '../context/AuthContext'
import logoBrand from '../assets/nutrisync.png'

type ActivePage = 'dashboard' | 'reports' | 'goals' | 'profile'

interface PatientNavbarProps {
  activePage?: ActivePage
}

const navLinks: { label: string; to: string; page: ActivePage }[] = [
  { label: 'Home',    to: '/patient/dashboard', page: 'dashboard' },
  { label: 'Reports', to: '/patient/reports',   page: 'reports'   },
  { label: 'Goals',   to: '/patient/goals',     page: 'goals'     },
  { label: 'Profile', to: '/patient/profile',   page: 'profile'   },
]

const PatientNavbar = ({ activePage }: PatientNavbarProps) => {
  const { user, logout } = useAuth()

  return (
    <header className="w-full top-0 sticky z-40 bg-surface shadow-sm border-b border-outline-variant">
      <nav className="flex justify-between items-center h-16 px-6 max-w-7xl mx-auto">
        {/* Left: Logo + nav links */}
        <div className="flex items-center gap-8">
          <Link to="/patient/dashboard" className="text-xl font-bold text-primary flex items-center gap-2">
            <img src={logoBrand} className="h-12 w-17" alt="NutriSync logo" />
          </Link>

          <div className="hidden md:flex gap-6 items-center">
            {navLinks.map(({ label, to, page }) => (
              <Link
                key={page}
                to={to}
                className={
                  activePage === page
                    ? 'text-primary font-semibold border-b-2 border-primary pb-1 text-sm transition-all'
                    : 'text-on-surface-variant hover:text-primary transition-colors text-sm'
                }
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right: Bell + profile avatar (clickable) + logout */}
        <div className="flex items-center gap-4">
          <button
            className="p-2 rounded-full hover:bg-surface-container transition-all text-primary relative"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full ring-2 ring-surface" />
          </button>

          <div className="flex items-center gap-3 pl-2 border-l border-outline-variant">
            {/* Clickable avatar → Profile page */}
            <Link
              to="/patient/profile"
              className="flex items-center gap-3 rounded-lg p-1 hover:bg-surface-container transition-all"
              title="Go to Profile"
            >
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
            </Link>

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
  )
}

export default PatientNavbar
