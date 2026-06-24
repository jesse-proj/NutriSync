import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import {
  Bell,
  LogOut,
  Edit,
  CheckCircle,
  Sparkles
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { ScrollArea, ScrollBar } from '../components/ui/scroll-area'
import logoBrand from '../assets/nutrisync.png'
import Footer from '../components/Footer'

// ponytail: Goals.tsx uses simple React state and inline Tailwind styles for custom progress/charts

const Goals = () => {
  const { user, logout } = useAuth()

  // Dynamic goals state
  const [weight, setWeight] = useState(74.5)
  const sodiumTarget = 1500
  const sodiumConsumed = 1120
  const walkingTarget = 5.0
  const walkingCompleted = 4.2

  // Checklist state
  const [bpChecked, setBpChecked] = useState(true)
  const [fiberChecked, setFiberChecked] = useState(false)
  const [fluidChecked, setFluidChecked] = useState(true)

  const sodiumPct = Math.min(100, Math.round((sodiumConsumed / sodiumTarget) * 100))
  const walkingPct = Math.min(100, Math.round((walkingCompleted / walkingTarget) * 100))

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
              <Link className="text-primary font-semibold border-b-2 border-primary pb-1 text-sm transition-all" to="/patient/goals">Goals</Link>
              <Link className="text-on-surface-variant hover:text-primary transition-colors text-sm" to="/patient/profile">Profile</Link>
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
        <main className="max-w-7xl mx-auto w-full px-6 py-8">
          {/* Header Section */}
          <div className="flex justify-between items-end mb-8">
            <div className="text-left">
              <h1 className="text-3xl font-bold text-on-surface tracking-tight">Health Goals</h1>
              <p className="text-sm text-on-surface-variant mt-1.5">Track and adjust your clinical objectives</p>
            </div>
            <Button
              onClick={() => {
                const newWeight = prompt("Enter new weight (kg):", String(weight))
                if (newWeight && !isNaN(Number(newWeight))) {
                  setWeight(Number(newWeight))
                }
              }}
              className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <Edit className="h-4 w-4" />
              Update Goal
            </Button>
          </div>

          {/* Three Column Dashboard Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Weight Trends (Bento Style) */}
            <div className="lg:col-span-4 flex flex-col">
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30 flex flex-col h-full text-left">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-on-surface">Current Weight</h3>
                  <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold">
                    -1.2kg this month
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-extrabold text-primary tracking-tight">{weight}</span>
                  <span className="text-sm text-on-surface-variant font-medium">kg</span>
                </div>

                {/* Simulated Chart Bars */}
                <div className="flex-grow min-h-[200px] relative flex items-end justify-between gap-2 px-1 pt-6">
                  <div className="w-full absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                    <div className="border-t border-outline"></div>
                    <div className="border-t border-outline"></div>
                    <div className="border-t border-outline"></div>
                    <div className="border-t border-outline"></div>
                  </div>
                  <div className="w-full bg-primary-fixed-dim/40 rounded-t-lg transition-all hover:bg-primary h-[85%]"></div>
                  <div className="w-full bg-primary-fixed-dim/40 rounded-t-lg transition-all hover:bg-primary h-[82%]"></div>
                  <div className="w-full bg-primary-fixed-dim/40 rounded-t-lg transition-all hover:bg-primary h-[78%]"></div>
                  <div className="w-full bg-primary-fixed-dim/40 rounded-t-lg transition-all hover:bg-primary h-[80%]"></div>
                  <div className="w-full bg-primary h-[72%] rounded-t-lg"></div>
                </div>
                <div className="flex justify-between mt-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  <span>Wk 1</span>
                  <span>Wk 2</span>
                  <span>Wk 3</span>
                  <span>Wk 4</span>
                  <span>Now</span>
                </div>
              </div>
            </div>

            {/* Middle Column: Progress Cards */}
            <div className="lg:col-span-4 flex flex-col gap-6 text-left">
              {/* Sodium Progress */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30 relative overflow-hidden group">
                <div className="flex justify-between items-center mb-6">
                  <div className="p-3 bg-surface-container-highest rounded-xl text-primary font-bold text-xs uppercase">
                    Sodium
                  </div>
                  <span className="text-secondary font-semibold text-sm flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Under Limit
                  </span>
                </div>
                <h3 className="text-xl font-bold text-on-surface">Daily Sodium</h3>
                <p className="text-sm text-on-surface-variant mt-1 mb-8">Goal: &lt; {sodiumTarget}mg</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-on-surface">{sodiumConsumed}mg consumed</span>
                    <span className="text-on-surface-variant">{sodiumPct}%</span>
                  </div>
                  <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-secondary rounded-full transition-all duration-500" style={{ width: `${sodiumPct}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Walking Progress */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30 relative overflow-hidden group">
                <div className="flex justify-between items-center mb-6">
                  <div className="p-3 bg-surface-container-highest rounded-xl text-primary font-bold text-xs uppercase">
                    Activity
                  </div>
                  <span className="text-primary font-semibold text-sm">{walkingPct}% Achieved</span>
                </div>
                <h3 className="text-xl font-bold text-on-surface">Walking Distance</h3>
                <p className="text-sm text-on-surface-variant mt-1 mb-8">Goal: {walkingTarget} km</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-on-surface">{walkingCompleted} km completed</span>
                    <span className="text-on-surface-variant">{walkingPct}%</span>
                  </div>
                  <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${walkingPct}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: NutriGabay & Checklist */}
            <div className="lg:col-span-4 flex flex-col gap-6 text-left">
              {/* NutriGabay Card */}
              <div className="bg-primary text-on-primary rounded-2xl p-6 shadow-md relative overflow-hidden">
                <div className="flex gap-4 items-start relative z-10">
                  <div className="shrink-0 w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 bg-white">
                    <img
                      className="w-full h-full object-cover"
                      alt="NutriGabay avatar"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqIo1UVjrKHPqDcvNGfV3pEkK11F1JOD6UdousFNXdxkBwO1dgu5slqZqYTdXAi8U_kAzMUWVBex9qtFRN76B9qlEk3iGbl3aYy-hNpVTau_nz13c9QGki4hh73yC2cp4KdrsWxOh_9mK0WIR9-xFnEYkEZvXNt6tiB_PBUKT0HTbQxlvEDa0pTtNQuY2M4cUDRd36-TZtRNBrEqzKsVubnvP2NYXipYL-t6BjmvPcliVXsGMEut7q5yERYIVPD7xTXgFBJNpkAQ"
                    />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-bold">NutriGabay</h4>
                    <p className="text-xs opacity-90 leading-relaxed">
                      "You're doing great, Juan! Your sodium intake is consistently within range. Keep up the fiber goals to maintain heart health."
                    </p>
                  </div>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-10">
                  <Sparkles className="w-28 h-28 transform rotate-12" />
                </div>
              </div>

              {/* Weekly Checklist */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30">
                <h3 className="text-lg font-bold text-on-surface mb-6">Weekly Checklist</h3>
                <div className="flex flex-col gap-4">
                  {/* BP checklist item */}
                  <div
                    onClick={() => setBpChecked(!bpChecked)}
                    className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer"
                  >
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${bpChecked ? 'bg-primary border-primary text-white' : 'border-outline-variant'}`}>
                      {bpChecked && <CheckCircle className="h-4.5 w-4.5" />}
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm font-bold text-on-surface">BP Consistency</p>
                      <p className="text-xs text-on-surface-variant">Measured twice daily</p>
                    </div>
                    <span className={`text-xs font-bold ${bpChecked ? 'text-secondary' : 'text-on-surface-variant'}`}>
                      {bpChecked ? 'Done' : 'Pending'}
                    </span>
                  </div>

                  {/* Fiber checklist item */}
                  <div
                    onClick={() => setFiberChecked(!fiberChecked)}
                    className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer"
                  >
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${fiberChecked ? 'bg-primary border-primary text-white' : 'border-outline-variant'}`}>
                      {fiberChecked && <CheckCircle className="h-4.5 w-4.5" />}
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm font-bold text-on-surface">Fiber Goals</p>
                      <p className="text-xs text-on-surface-variant">25g daily intake</p>
                    </div>
                    <span className={`text-xs font-bold ${fiberChecked ? 'text-secondary' : 'text-on-surface-variant'}`}>
                      {fiberChecked ? 'Done' : '4/7 days'}
                    </span>
                  </div>

                  {/* Fluid checklist item */}
                  <div
                    onClick={() => setFluidChecked(!fluidChecked)}
                    className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer"
                  >
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${fluidChecked ? 'bg-primary border-primary text-white' : 'border-outline-variant'}`}>
                      {fluidChecked && <CheckCircle className="h-4.5 w-4.5" />}
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm font-bold text-on-surface">Fluid Intake</p>
                      <p className="text-xs text-on-surface-variant">2L baseline</p>
                    </div>
                    <span className={`text-xs font-bold ${fluidChecked ? 'text-secondary' : 'text-on-surface-variant'}`}>
                      {fluidChecked ? 'Done' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  )
}

export default Goals
