import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { ScrollArea } from '../components/ui/scroll-area'
import logoBrand from '../assets/logo_brand.png'
import {
  LayoutDashboard,
  TriangleAlert,
  Users,
  TrendingUp,
  Archive,
  UserPlus,
  HelpCircle,
  LogOut,
  Search,
  Bell,
  Settings,
  Utensils,
  BadgeCheck,
  Phone,
  MessageSquare,
  Camera,
  AlertCircle,
  CheckCheck,
  Plus,
} from 'lucide-react'

// ─── Data ────────────────────────────────────────────────────────────────────

const urgentAlerts = [
  {
    id: 'NSY-9021',
    initials: 'RH',
    name: 'Robert H. Miller',
    risk: 'critical' as const,
    metric: '2.4g Sodium',
    detail: 'High Intake Detected',
  },
  {
    id: 'NSY-7734',
    initials: 'SC',
    name: 'Sarah Chen',
    risk: 'critical' as const,
    metric: 'Missed Medication',
    detail: 'Lisinopril – 24hr Delay',
  },
  {
    id: 'NSY-1245',
    initials: 'DJ',
    name: 'David Jones',
    risk: 'warning' as const,
    metric: '1.8g Sodium',
    detail: 'Gradual Increase Trend',
  },
  {
    id: 'NSY-8821',
    initials: 'AL',
    name: 'Anita Lopez',
    risk: 'warning' as const,
    metric: 'BP Spike',
    detail: '145/95 mmHg',
  },
]

const recentActivity = [
  {
    icon: MessageSquare,
    colorClass: 'text-primary bg-primary/10',
    patient: 'Robert H. Miller',
    action: 'used NutriGabay',
    note: '"Is there a low-sodium substitute for soy sauce in stir-fry?"',
    time: '14 minutes ago',
  },
  {
    icon: Camera,
    colorClass: 'text-secondary bg-secondary/10',
    patient: 'Sarah Chen',
    action: 'uploaded a meal log',
    note: 'AI verified: Grilled Salmon & Steamed Greens',
    time: '1 hour ago',
  },
  {
    icon: AlertCircle,
    colorClass: 'text-error bg-error/10',
    patient: 'System Alert',
    action: ': Delayed Check-in',
    note: 'Anita Lopez missed scheduled morning BP log.',
    time: '3 hours ago',
  },
  {
    icon: CheckCheck,
    colorClass: 'text-primary bg-primary/10',
    patient: 'David Jones',
    action: 'met all daily targets',
    note: '7/7 days sodium compliance reached.',
    time: '5 hours ago',
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavItem({
  icon: Icon,
  label,
  active = false,
}: {
  icon: React.ElementType
  label: string
  active?: boolean
}) {
  return (
    <a
      href="#"
      className={`flex items-center gap-4 px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 ${
        active
          ? 'bg-secondary-container text-on-secondary-container font-bold'
          : 'text-on-surface-variant hover:bg-surface-container-high'
      }`}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <span>{label}</span>
    </a>
  )
}

function MetricCard({
  icon: Icon,
  iconClass,
  label,
  value,
  badge,
  badgeClass,
  cardClass = 'bg-white border-outline-variant',
  labelClass = 'text-on-surface-variant',
  valueClass = 'text-on-surface',
  watermark,
}: {
  icon: React.ElementType
  iconClass: string
  label: string
  value: string
  badge: string
  badgeClass: string
  cardClass?: string
  labelClass?: string
  valueClass?: string
  watermark?: React.ReactNode
}) {
  return (
    <div className={`relative overflow-hidden border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow ${cardClass}`}>
      {watermark && (
        <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none">
          {watermark}
        </div>
      )}
      <div className="flex justify-between items-start mb-2 relative z-10">
        <Icon className={`h-6 w-6 ${iconClass}`} />
        <span className={`text-xs font-bold ${badgeClass}`}>{badge}</span>
      </div>
      <p className={`text-[11px] uppercase tracking-wider font-medium mb-1 relative z-10 ${labelClass}`}>{label}</p>
      <p className={`text-4xl font-extrabold leading-tight relative z-10 ${valueClass}`}>{value}</p>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const ClinicianDashboard = () => {
  const { user, logout } = useAuth()

  return (
    <div className="flex h-screen bg-background text-on-surface font-sans overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-64 flex-shrink-0 h-screen fixed left-0 top-0 bg-surface-container border-r border-outline-variant flex flex-col py-4 px-2 z-50">
        {/* Brand */}
        <div className="px-4 mb-8 flex items-center gap-2">
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden flex-shrink-0">
            <img src={logoBrand} alt="NutriSync Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-primary leading-tight">NutriSync</h1>
            <p className="text-[11px] opacity-70">Clinical Portal</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-grow flex flex-col gap-1">
          <NavItem icon={LayoutDashboard} label="Home" active />
          <NavItem icon={TriangleAlert} label="Urgent Tasks" />
          <NavItem icon={Users} label="Patients" />
          <NavItem icon={TrendingUp} label="Health Trends" />
          <NavItem icon={Archive} label="Archived" />
        </nav>

        {/* Footer */}
        <div className="pt-4 border-t border-outline-variant flex flex-col gap-1">
          <Button className="w-full justify-start gap-3 mb-2 bg-primary text-white hover:bg-primary/90">
            <UserPlus className="h-4 w-4" />
            <span className="text-xs font-bold">New Patient</span>
          </Button>
          <NavItem icon={HelpCircle} label="Help Center" />
          <button
            onClick={logout}
            className="flex items-center gap-4 px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-all w-full text-left"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main className="ml-64 flex-1 flex flex-col min-h-screen overflow-y-auto">

        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-white border-b border-outline-variant flex items-center justify-between px-8 h-16 flex-shrink-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline pointer-events-none" />
            <Input
              type="text"
              placeholder="Search patients, metrics, or alerts..."
              className="pl-10 pr-4 rounded-full bg-surface-container-low border-outline-variant focus:border-primary focus:ring-primary text-sm"
            />
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-6 ml-6">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative rounded-full">
                <Bell className="h-5 w-5 text-on-surface-variant" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-white" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Settings className="h-5 w-5 text-on-surface-variant" />
              </Button>
            </div>
            <div className="h-8 w-px bg-outline-variant" />
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-on-surface leading-none">Dr. {user?.full_name ?? 'Maria Santos'}</p>
                <p className="text-[11px] text-on-surface-variant">Cardiology</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-sm font-bold text-on-secondary-container border-2 border-primary/30 flex-shrink-0">
                {(user?.full_name ?? 'MS').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Canvas */}
        <div className="p-8 flex flex-col gap-8 flex-1">

          {/* ── Key Metrics ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <MetricCard
              icon={Users}
              iconClass="text-secondary"
              label="Total Patients"
              value="128"
              badge="+4% vs last mo"
              badgeClass="text-primary"
            />
            <MetricCard
              icon={AlertCircle}
              iconClass="text-error"
              label="High Risk Alerts"
              value="14"
              badge="Critical Attention"
              badgeClass="text-error"
              cardClass="bg-error-container border-error/20"
              labelClass="text-on-error-container"
              valueClass="text-on-error-container"
              watermark={<TriangleAlert className="h-32 w-32 text-error" />}
            />
            <MetricCard
              icon={Utensils}
              iconClass="text-primary"
              label="Pending Meal Reviews"
              value="42"
              badge="Today"
              badgeClass="text-on-surface-variant"
            />
            <MetricCard
              icon={BadgeCheck}
              iconClass="text-primary-container"
              label="Weekly Compliance"
              value="88%"
              badge="+2.5% improvement"
              badgeClass="text-primary"
            />
          </div>

          {/* ── Dashboard Grid ───────────────────────────────────────────── */}
          <div className="grid grid-cols-12 gap-5">

            {/* Urgent Alerts Table */}
            <div className="col-span-12 lg:col-span-8 bg-white border border-outline-variant rounded-xl flex flex-col">
              <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-bright/50 rounded-t-xl">
                <div>
                  <h2 className="text-lg font-semibold text-on-surface">Urgent Patient Alerts</h2>
                  <p className="text-sm text-on-surface-variant">Requiring immediate clinical intervention</p>
                </div>
                <Button variant="ghost" className="text-secondary text-xs font-bold hover:underline px-2">
                  View All Active Alerts
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-low text-on-surface-variant text-[11px] uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3 font-medium">Patient Name</th>
                      <th className="px-4 py-3 font-medium">Risk Level</th>
                      <th className="px-4 py-3 font-medium">Latest Metric</th>
                      <th className="px-4 py-3 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {urgentAlerts.map((alert) => (
                      <tr
                        key={alert.id}
                        className={`hover:bg-surface-container-lowest transition-colors border-l-4 ${
                          alert.risk === 'critical' ? 'border-error' : 'border-tertiary-container'
                        }`}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                              {alert.initials}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-on-surface">{alert.name}</p>
                              <p className="text-[11px] text-on-surface-variant">ID: #{alert.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {alert.risk === 'critical' ? (
                            <span className="bg-error-container text-error text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Critical</span>
                          ) : (
                            <span className="bg-tertiary-container text-on-tertiary-container text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Warning</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <p className={`text-sm font-bold font-mono ${alert.risk === 'critical' ? 'text-error' : 'text-tertiary'}`}>
                            {alert.metric}
                          </p>
                          <p className="text-[11px] text-on-surface-variant">{alert.detail}</p>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <Button variant="ghost" size="icon" className="text-secondary hover:bg-secondary/10 rounded-lg" title="Call Patient">
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button size="sm" className="bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80 text-xs font-bold px-3">
                              Review Log
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="col-span-12 lg:col-span-4 bg-white border border-outline-variant rounded-xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-outline-variant bg-surface-bright/50">
                <h2 className="text-lg font-semibold text-on-surface">Recent Activity</h2>
                <p className="text-sm text-on-surface-variant">Logs & NutriGabay interactions</p>
              </div>

              <ScrollArea className="flex-1 max-h-[480px]">
                <ul className="p-4 space-y-6">
                  {recentActivity.map((item, i) => {
                    const Icon = item.icon
                    const isLast = i === recentActivity.length - 1
                    return (
                      <li key={i} className="flex gap-3 relative">
                        {!isLast && (
                          <div className="absolute left-[13px] top-8 bottom-[-24px] w-[2px] bg-outline-variant/30" />
                        )}
                        <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center relative z-10 ${item.colorClass}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-on-surface">
                            <span className="font-bold">{item.patient}</span>{item.action}
                          </p>
                          <p className="text-xs bg-surface-container px-2 py-1 rounded-md mt-1 text-on-surface-variant italic">
                            {item.note}
                          </p>
                          <p className="text-[11px] text-on-surface-variant mt-1">{item.time}</p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </ScrollArea>
            </div>

          </div>
        </div>
      </main>

      {/* FAB */}
      <button
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-surface-tint active:scale-90 transition-all z-50 group"
        title="New Clinical Note"
      >
        <Plus className="h-7 w-7 group-hover:rotate-90 transition-transform" />
        <div className="absolute right-16 bg-on-surface text-surface text-xs font-bold py-2 px-4 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          New Clinical Note
        </div>
      </button>
    </div>
  )
}

export default ClinicianDashboard
