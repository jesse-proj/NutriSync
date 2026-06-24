import React from 'react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { ScrollArea } from '../components/ui/scroll-area'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarSeparator,
} from '../components/ui/sidebar'
import logoBrand from '../assets/nutrisync.png'
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

const navItems = [
  { icon: LayoutDashboard, label: 'Home', active: true },
  { icon: TriangleAlert, label: 'Urgent Tasks' },
  { icon: Users, label: 'Patients' },
  { icon: TrendingUp, label: 'Health Trends' },
  { icon: Archive, label: 'Archived' },
]

const urgentAlerts: { id: string; initials: string; name: string; risk: 'critical' | 'warning'; metric: string; detail: string }[] = []

const recentActivity: { icon: React.ElementType; colorClass: string; patient: string; action: string; note: string; time: string }[] = []

// ─── Metric Card ─────────────────────────────────────────────────────────────

function MetricCard({
  icon: Icon, iconClass, label, value, badge, badgeClass,
  cardClass = 'bg-white border-outline-variant',
  labelClass = 'text-on-surface-variant',
  valueClass = 'text-on-surface',
  watermark,
}: {
  icon: React.ElementType; iconClass: string; label: string; value: string
  badge: string; badgeClass: string; cardClass?: string; labelClass?: string
  valueClass?: string; watermark?: React.ReactNode
}) {
  return (
    <div className={`relative overflow-hidden border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow ${cardClass}`}>
      {watermark && <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none">{watermark}</div>}
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
  const initials = (user?.full_name ?? 'MS').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="clinician-theme">
      <SidebarProvider defaultOpen={true}>
        <Sidebar collapsible="icon" variant="sidebar">

          {/* Brand header */}
          <SidebarHeader className="py-4 px-3">
            <div className="flex items-center gap-2 overflow-hidden">
              <img src={logoBrand} alt="NutriSync Logo" className="w-14 h-12 object-contain flex-shrink-0" />
              <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
                <span className="text-base font-extrabold text-sidebar-primary">NutriSync</span>
                <span className="text-[11px] opacity-60">Clinical Portal</span>
              </div>
            </div>
          </SidebarHeader>

          {/* Navigation */}
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map(({ icon: Icon, label, active }) => (
                    <SidebarMenuItem key={label}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={label}
                      >
                        <a href="#">
                          <Icon />
                          <span>{label}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          {/* Footer */}
          <SidebarFooter className="pb-4">
            <SidebarSeparator className="mx-0 mb-2" />
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="New Patient" className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground font-bold">
                  <UserPlus />
                  <span>New Patient</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Help Center">
                  <a href="#"><HelpCircle /><span>Help Center</span></a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={logout} tooltip="Logout" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <LogOut />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        {/* ── Main content (inset) ──────────────────────────────────────── */}
        <SidebarInset className="flex flex-col min-h-screen overflow-y-auto bg-background">

          {/* Top Bar */}
          <header className="sticky top-0 z-40 bg-white border-b border-outline-variant flex items-center justify-between px-6 h-16 flex-shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-on-surface-variant" />
              {/* Search */}
              <div className="relative max-w-md w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search patients, metrics..."
                  className="pl-10 rounded-full bg-surface-container-low border-outline-variant focus:border-primary text-sm"
                />
              </div>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
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
                <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center text-xs font-bold text-on-surface border-2 border-primary/30 flex-shrink-0">
                  {initials}
                </div>
              </div>
            </div>
          </header>

          {/* Canvas */}
          <div className="p-8 flex flex-col gap-8 flex-1">

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <MetricCard icon={Users} iconClass="text-secondary" label="Total Patients" value="0" badge="--" badgeClass="text-on-surface-variant" />
              <MetricCard
                icon={AlertCircle} iconClass="text-error" label="High Risk Alerts" value="0"
                badge="--" badgeClass="text-on-surface-variant"
              />
              <MetricCard icon={Utensils} iconClass="text-primary" label="Pending Meal Reviews" value="0" badge="--" badgeClass="text-on-surface-variant" />
              <MetricCard icon={BadgeCheck} iconClass="text-primary" label="Weekly Compliance" value="--" badge="--" badgeClass="text-on-surface-variant" />
            </div>

            {/* Dashboard Grid */}
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
                        <tr key={alert.id} className={`hover:bg-surface-container-lowest transition-colors border-l-4 ${alert.risk === 'critical' ? 'border-error' : 'border-tertiary-container'}`}>
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
                            {alert.risk === 'critical'
                              ? <span className="bg-error-container text-error text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Critical</span>
                              : <span className="bg-tertiary-container text-on-tertiary-container text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Warning</span>}
                          </td>
                          <td className="px-4 py-4">
                            <p className={`text-sm font-bold font-mono ${alert.risk === 'critical' ? 'text-error' : 'text-tertiary'}`}>{alert.metric}</p>
                            <p className="text-[11px] text-on-surface-variant">{alert.detail}</p>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <Button variant="ghost" size="icon" className="text-secondary hover:bg-secondary/10 rounded-lg" title="Call Patient">
                                <Phone className="h-4 w-4" />
                              </Button>
                              <Button size="sm" className="bg-secondary-container text-on-surface hover:bg-secondary-container/80 text-xs font-bold px-3">
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
                      return (
                        <li key={i} className="flex gap-3 relative">
                          {i < recentActivity.length - 1 && (
                            <div className="absolute left-[13px] top-8 bottom-[-24px] w-[2px] bg-outline-variant/30" />
                          )}
                          <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center relative z-10 ${item.colorClass}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-on-surface"><span className="font-bold">{item.patient}</span>{item.action}</p>
                            <p className="text-xs bg-surface-container px-2 py-1 rounded-md mt-1 text-on-surface-variant italic">{item.note}</p>
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
        </SidebarInset>

        {/* FAB */}
        <button
          className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-90 transition-all z-50 group"
          title="New Clinical Note"
        >
          <Plus className="h-7 w-7 group-hover:rotate-90 transition-transform" />
          <div className="absolute right-16 bg-on-surface text-surface-container-lowest text-xs font-bold py-2 px-4 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            New Clinical Note
          </div>
        </button>
      </SidebarProvider>
    </div>
  )
}

export default ClinicianDashboard
