import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { apiFetch } from '../api/client'
import { AlertDialog } from '../components/ui/alert-dialog'
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
  Users,
  UserPlus,
  HelpCircle,
  LogOut,
  Search,
  Bell,
  Settings,
  Utensils,
  BadgeCheck,
  AlertCircle,
  Plus,
  X,
  Save,
  RefreshCw,
  ChevronLeft,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Trash2
} from 'lucide-react'

// ─── Metric Card ─────────────────────────────────────────────────────────────

interface User {
  id: number
  email: string
  full_name: string
  role: string
  consent_given: boolean
}

interface FoodLog {
  id: number
  name: string
  description: string
  calories_kcal: number
  sodium_mg: number
  carbs_g: number
  protein_g: number
  fat_g: number
  potassium_mg: number
  image_url?: string
  logged_at: string
}

interface DietaryTargets {
  id?: number
  patient_id: number
  clinician_id: number
  sodium_mg: number
  carbs_g: number
  calories_kcal: number
  potassium_mg: number
}

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

  // State
  const [activeView, setActiveView] = useState<'dashboard' | 'patients'>('dashboard')
  const [patients, setPatients] = useState<User[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Add Patient Modal State
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false)
  const [addName, setAddName] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [addPassword, setAddPassword] = useState('')
  const [isSubmittingPatient, setIsSubmittingPatient] = useState(false)

  // Patient Detail View State
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null)
  const [patientLogs, setPatientLogs] = useState<FoodLog[]>([])
  const [_patientTargets, setPatientTargets] = useState<DietaryTargets | null>(null)
  const [aiSummary, setAiSummary] = useState<string>('')
  const [loadingSummary, setLoadingSummary] = useState(false)

  // Editable Targets
  const [targetSodium, setTargetSodium] = useState('2000')
  const [targetCarbs, setTargetCarbs] = useState('250')
  const [targetCalories, setTargetCalories] = useState('2000')
  const [targetPotassium, setTargetPotassium] = useState('0')
  const [isSavingTargets, setIsSavingTargets] = useState(false)

  // Notification popup (replaces alert())
  const [notify, setNotify] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Delete Patient Confirmation State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletePatientId, setDeletePatientId] = useState<number | null>(null)
  const [deletePatientName, setDeletePatientName] = useState('')

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true)
    try {
      const patientData = await apiFetch('/api/clinicians/patients')
      if (patientData) setPatients(patientData)

      const alertData = await apiFetch('/api/clinicians/alerts')
      if (alertData) setAlerts(alertData)
    } catch (err) {
      console.error("Failed to fetch clinician dashboard data", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Handle open patient details
  const handleSelectPatient = async (patient: User) => {
    setSelectedPatient(patient)
    setPatientLogs([])
    setPatientTargets(null)
    setAiSummary('')

    // Fetch targets
    try {
      const targetsData = await apiFetch(`/api/clinicians/patients/${patient.id}/targets`)
      if (targetsData) {
        setPatientTargets(targetsData)
        setTargetSodium(targetsData.sodium_mg?.toString() || '2000')
        setTargetCarbs(targetsData.carbs_g?.toString() || '250')
        setTargetCalories(targetsData.calories_kcal?.toString() || '2000')
        setTargetPotassium(targetsData.potassium_mg?.toString() || '0')
      }
    } catch (err) {
      console.error("Error fetching patient targets", err)
    }

    // Fetch food logs
    try {
      const logsData = await apiFetch(`/api/clinicians/patients/${patient.id}/logs`)
      if (logsData) {
        setPatientLogs(logsData)
      }
    } catch (err) {
      console.error("Error fetching patient logs", err)
    }

    // Fetch summary
    handleFetchSummary(patient.id)
  }

  // Fetch AI summary
  const handleFetchSummary = async (patientId: number) => {
    setLoadingSummary(true)
    setAiSummary('Generating AI nutritional summary...')
    try {
      const summaryData = await apiFetch(`/api/clinicians/patients/${patientId}/summary`)
      if (summaryData?.summary) {
        setAiSummary(summaryData.summary)
      } else {
        setAiSummary('No recent food logs to summarize.')
      }
    } catch (err) {
      console.error("Error fetching summary", err)
      setAiSummary('Failed to generate summary. Please check connection.')
    } finally {
      setLoadingSummary(false)
    }
  }

  // Save targets
  const handleSaveTargets = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient) return
    setIsSavingTargets(true)
    try {
      const updatedTargets = await apiFetch(`/api/clinicians/patients/${selectedPatient.id}/targets`, {
        method: 'PUT',
        json: {
          sodium_mg: parseFloat(targetSodium) || 2000,
          carbs_g: parseFloat(targetCarbs) || 250,
          calories_kcal: parseFloat(targetCalories) || 2000,
          potassium_mg: parseFloat(targetPotassium) || 0
        }
      })
      if (updatedTargets) {
        setPatientTargets(updatedTargets)
        setNotify({ type: 'success', message: 'Dietary targets updated successfully!' })
      }
    } catch (err) {
      console.error("Error updating targets", err)
      setNotify({ type: 'error', message: 'Failed to update targets. Please try again.' })
    } finally {
      setIsSavingTargets(false)
    }
  }

  // Add new patient account
  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addName || !addEmail || !addPassword) {
      alert("Please fill out all fields")
      return
    }
    setIsSubmittingPatient(true)
    try {
      const newPatient = await apiFetch('/api/clinicians/patients', {
        method: 'POST',
        json: {
          full_name: addName,
          email: addEmail,
          password: addPassword,
          consent_given: true
        }
      })
      if (newPatient) {
        setIsAddPatientOpen(false)
        setAddName('')
        setAddEmail('')
        setAddPassword('')
        setNotify({ type: 'success', message: `Patient account for ${newPatient.full_name} created successfully!` })
        fetchData()
        setActiveView('patients')
        handleSelectPatient(newPatient)
      }
    } catch (err: any) {
      console.error("Error creating patient account", err)
      setNotify({ type: 'error', message: err.message || 'Failed to create patient account' })
    } finally {
      setIsSubmittingPatient(false)
    }
  }

  const handleDeletePatient = (patientId: number, name: string) => {
    setDeletePatientId(patientId)
    setDeletePatientName(name)
    setDeleteConfirmOpen(true)
  }

  const executeDeletePatient = async () => {
    if (deletePatientId === null) return
    try {
      const result = await apiFetch(`/api/clinicians/patients/${deletePatientId}`, {
        method: 'DELETE'
      })
      if (result?.success) {
        setNotify({ type: 'success', message: `Patient "${deletePatientName}" deleted successfully.` })
        setSelectedPatient(null)
        fetchData()
      }
    } catch (err: any) {
      console.error("Error deleting patient", err)
      setNotify({ type: 'error', message: err.message || 'Failed to delete patient' })
    } finally {
      setDeleteConfirmOpen(false)
      setDeletePatientId(null)
      setDeletePatientName('')
    }
  }

  // Filter patients by search
  const filteredPatients = patients.filter(p =>
    p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => { setActiveView('dashboard'); setSelectedPatient(null); }}
                      isActive={activeView === 'dashboard' && !selectedPatient}
                      tooltip="Dashboard"
                    >
                      <LayoutDashboard />
                      <span>Dashboard</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => { setActiveView('patients'); setSelectedPatient(null); }}
                      isActive={activeView === 'patients' && !selectedPatient}
                      tooltip="Patient Directory"
                    >
                      <Users />
                      <span>Patient Directory</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          {/* Footer */}
          <SidebarFooter className="pb-4">
            <SidebarSeparator className="mx-0 mb-2" />
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setIsAddPatientOpen(true)}
                  tooltip="New Patient"
                  className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground font-bold"
                >
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
                  placeholder="Search patients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-full bg-surface-container-low border-outline-variant focus:border-primary text-sm"
                />
              </div>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="relative rounded-full">
                  <Bell className="h-5 w-5 text-on-surface-variant" />
                  {alerts.length > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-white" />
                  )}
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Settings className="h-5 w-5 text-on-surface-variant" />
                </Button>
                <Button variant="ghost" size="icon" onClick={logout} title="Logout" className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive">
                  <LogOut className="h-5 w-5" />
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
            {loading ? (
              <div className="flex items-center justify-center h-64 text-on-surface-variant">
                <span>Loading dashboard records...</span>
              </div>
            ) : selectedPatient ? (
              // ── PATIENT DETAIL VIEW ──────────────────────────────────────────
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedPatient(null)} className="flex items-center gap-1 rounded-lg">
                      <ChevronLeft className="h-4 w-4" />
                      Back
                    </Button>
                    <div className="h-4 w-px bg-outline-variant" />
                    <h1 className="text-2xl font-bold tracking-tight text-on-surface">{selectedPatient.full_name}</h1>
                    <span className="text-xs text-on-surface-variant">({selectedPatient.email})</span>
                  </div>
                  <Button
                    onClick={() => handleDeletePatient(selectedPatient.id, selectedPatient.full_name)}
                    size="sm"
                    className="bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 text-xs font-bold px-3 flex items-center gap-1 border-none cursor-pointer"
                    title="Delete Patient"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Patient
                  </Button>
                </div>

                <div className="grid grid-cols-12 gap-6">
                  {/* Targets Card & AI summary */}
                  <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                    {/* Targets Form */}
                    <div className="bg-white border border-outline-variant p-6 rounded-2xl shadow-sm">
                      <h3 className="text-base font-bold text-on-surface mb-4 flex items-center gap-2">
                        <Settings className="h-5 w-5 text-primary" />
                        Modify Dietary Targets
                      </h3>
                      <form onSubmit={handleSaveTargets} className="space-y-4">
                        <div>
                          <label className="text-xs font-bold text-on-surface-variant block mb-1">Sodium (mg)</label>
                          <Input type="number" value={targetSodium} onChange={e => setTargetSodium(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-on-surface-variant block mb-1">Carbs (g)</label>
                          <Input type="number" value={targetCarbs} onChange={e => setTargetCarbs(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-on-surface-variant block mb-1">Calories (kcal)</label>
                          <Input type="number" value={targetCalories} onChange={e => setTargetCalories(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-on-surface-variant block mb-1">Potassium (mg)</label>
                          <Input type="number" value={targetPotassium} onChange={e => setTargetPotassium(e.target.value)} />
                        </div>
                        <Button type="submit" disabled={isSavingTargets} className="w-full bg-primary hover:bg-primary/95 text-white flex items-center justify-center gap-2 rounded-xl mt-2">
                          <Save className="h-4 w-4" />
                          {isSavingTargets ? 'Saving...' : 'Save Targets'}
                        </Button>
                      </form>
                    </div>

                    {/* AI nutritional summary */}
                    <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl shadow-sm relative overflow-hidden">
                      <div className="absolute right-4 top-4 text-primary/10">
                        <Sparkles className="w-16 h-16" />
                      </div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-primary flex items-center gap-1.5">
                          <Sparkles className="h-4.5 w-4.5" />
                          AI Health Summary
                        </h3>
                        <Button variant="ghost" size="icon" onClick={() => handleFetchSummary(selectedPatient.id)} disabled={loadingSummary} className="h-8 w-8 text-primary rounded-full hover:bg-primary/10">
                          <RefreshCw className={`h-4 w-4 ${loadingSummary ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>
                      <p className="text-xs leading-relaxed text-on-surface-variant whitespace-pre-wrap">{aiSummary}</p>
                    </div>
                  </div>

                  {/* Food Logs list */}
                  <div className="col-span-12 lg:col-span-8 bg-white border border-outline-variant p-6 rounded-2xl shadow-sm flex flex-col">
                    <h3 className="text-base font-bold text-on-surface mb-6 flex items-center gap-2">
                      <Utensils className="h-5 w-5 text-secondary" />
                      Patient Meal Logs
                    </h3>

                    {patientLogs.length === 0 ? (
                      <div className="py-12 text-center text-on-surface-variant text-sm border-2 border-dashed border-outline-variant/50 rounded-xl flex flex-col items-center justify-center gap-2">
                        <Utensils className="h-8 w-8 text-outline" />
                        <p className="font-semibold">No food logs found for this patient.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {patientLogs.map(log => (
                          <div key={log.id} className="flex flex-col md:flex-row border border-outline-variant/60 rounded-xl p-4 gap-4 bg-surface-bright/50">
                            {log.image_url && (
                              <div className="w-full md:w-28 h-28 rounded-lg overflow-hidden shrink-0 border border-outline-variant">
                                <img src={`http://127.0.0.1:8000${log.image_url}`} alt={log.name} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="flex-grow flex flex-col justify-between">
                              <div>
                                <h4 className="font-bold text-sm text-on-surface">{log.name}</h4>
                                <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{log.description}</p>
                                <p className="text-[10px] text-outline font-medium mt-1">
                                  {new Date(log.logged_at).toLocaleString()}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 border-t border-outline-variant/40 pt-2 text-[11px] text-on-surface-variant">
                                <span>Calories: <strong>{Math.round(log.calories_kcal)} kcal</strong></span>
                                <span>Sodium: <strong>{Math.round(log.sodium_mg)} mg</strong></span>
                                <span>Carbs: <strong>{Math.round(log.carbs_g)} g</strong></span>
                                <span>Protein: <strong>{Math.round(log.protein_g)} g</strong></span>
                                <span>Fat: <strong>{Math.round(log.fat_g)} g</strong></span>
                                <span>Potassium: <strong>{Math.round(log.potassium_mg)} mg</strong></span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : activeView === 'patients' ? (
              // ── PATIENT DIRECTORY VIEW ───────────────────────────────────────
              <div className="bg-white border border-outline-variant rounded-xl flex flex-col">
                <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-bright/50 rounded-t-xl">
                  <div>
                    <h2 className="text-lg font-semibold text-on-surface">Patient Directory</h2>
                    <p className="text-sm text-on-surface-variant">Select a patient below to view their active charts, food logs, and modify their medical profiles.</p>
                  </div>
                  <Button onClick={() => setIsAddPatientOpen(true)} className="bg-primary text-white hover:bg-primary/90 flex gap-2 font-bold px-4 rounded-xl">
                    <UserPlus className="h-4 w-4" />
                    New Patient
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-surface-container-low text-on-surface-variant text-[11px] uppercase tracking-wide">
                      <tr>
                        <th className="px-6 py-3 font-medium">Patient Name</th>
                        <th className="px-6 py-3 font-medium">Email</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 text-right font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {filteredPatients.map((patient) => {
                        const patInitials = patient.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                        return (
                          <tr key={patient.id} className="hover:bg-surface-container-lowest transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                                  {patInitials}
                                </div>
                                <span className="text-sm font-bold text-on-surface">{patient.full_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-on-surface-variant">{patient.email}</td>
                            <td className="px-6 py-4">
                              <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Active</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button onClick={() => handleSelectPatient(patient)} size="sm" className="bg-secondary-container text-on-surface hover:bg-secondary-container/80 text-xs font-bold px-3">
                                  View Profile & Logs
                                </Button>
                                <Button
                                  onClick={() => handleDeletePatient(patient.id, patient.full_name)}
                                  size="sm"
                                  className="bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 text-xs font-bold px-3 flex items-center gap-1 border-none cursor-pointer"
                                  title="Delete Patient"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              // ── MAIN CLINICAL DASHBOARD VIEW ─────────────────────────────────
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  <MetricCard icon={Users} iconClass="text-secondary" label="Total Patients" value={patients.length.toString()} badge="Active" badgeClass="text-green-700 bg-green-50 px-2 py-0.5 rounded-full" />
                  <MetricCard icon={AlertCircle} iconClass="text-error" label="High Risk Alerts" value={alerts.length.toString()} badge="Critical" badgeClass="text-red-700 bg-red-50 px-2 py-0.5 rounded-full" />
                  <MetricCard icon={Utensils} iconClass="text-primary" label="Patient Directory" value={patients.length.toString()} badge="Directory" badgeClass="text-primary bg-primary/5 px-2 py-0.5 rounded-full" />
                  <MetricCard icon={BadgeCheck} iconClass="text-primary" label="Compliance Monitoring" value="100%" badge="Normal" badgeClass="text-green-700 bg-green-50 px-2 py-0.5 rounded-full" />
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
                      <Button onClick={() => setActiveView('patients')} variant="ghost" className="text-secondary text-xs font-bold hover:underline px-2">
                        View Patient Directory
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-surface-container-low text-on-surface-variant text-[11px] uppercase tracking-wide">
                          <tr>
                            <th className="px-4 py-3 font-medium">Patient Name</th>
                            <th className="px-4 py-3 font-medium">Alert Type</th>
                            <th className="px-4 py-3 font-medium">Detail</th>
                            <th className="px-4 py-3 text-right font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant">
                          {alerts.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-sm text-on-surface-variant">
                                No unresolved patient alerts.
                              </td>
                            </tr>
                          ) : (
                            alerts.map((alert) => {
                              const pat = patients.find(p => p.id === alert.patient_id)
                              const name = pat ? pat.full_name : `Patient #${alert.patient_id}`
                              const initialsAlert = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                              return (
                                <tr key={alert.id} className="hover:bg-surface-container-lowest transition-colors border-l-4 border-error">
                                  <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                                        {initialsAlert}
                                      </div>
                                      <div>
                                        <p className="text-sm font-bold text-on-surface">{name}</p>
                                        <p className="text-[11px] text-on-surface-variant">ID: #{alert.patient_id}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4">
                                    <span className="bg-error-container text-error text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{alert.alert_type}</span>
                                  </td>
                                  <td className="px-4 py-4">
                                    <p className="text-xs text-on-surface-variant">{alert.message}</p>
                                    <p className="text-[10px] text-outline">{new Date(alert.created_at).toLocaleString()}</p>
                                  </td>
                                  <td className="px-4 py-4 text-right">
                                    <Button onClick={() => {
                                      const patientObj = patients.find(p => p.id === alert.patient_id)
                                      if (patientObj) handleSelectPatient(patientObj)
                                    }} size="sm" className="bg-secondary-container text-on-surface hover:bg-secondary-container/80 text-xs font-bold px-3">
                                      Review Logs
                                    </Button>
                                  </td>
                                </tr>
                              )
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Clinical Actions Summary */}
                  <div className="col-span-12 lg:col-span-4 bg-white border border-outline-variant rounded-xl flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-outline-variant bg-surface-bright/50">
                      <h2 className="text-lg font-semibold text-on-surface">Recent Activity</h2>
                      <p className="text-sm text-on-surface-variant">General system status</p>
                    </div>
                    <div className="p-6 flex flex-col justify-center items-center gap-4 text-center">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <BadgeCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm">System Healthy</h3>
                        <p className="text-xs text-on-surface-variant mt-1">DPA 2012 Compliance Audits Active.<br />HIPAA encryption active.</p>
                      </div>
                    </div>
                  </div>

                </div>
              </>
            )}
          </div>
        </SidebarInset>

        {/* Floating Add Patient Button */}
        <button
          onClick={() => setIsAddPatientOpen(true)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-90 transition-all z-50 group border-none cursor-pointer"
          title="New Patient"
        >
          <Plus className="h-7 w-7 group-hover:rotate-90 transition-transform" />
          <div className="absolute right-16 bg-on-surface text-surface-container-lowest text-xs font-bold py-2 px-4 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            New Patient
          </div>
        </button>
      </SidebarProvider>

      {/* ADD PATIENT MODAL */}
      {isAddPatientOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-outline-variant max-w-md w-full rounded-2xl shadow-xl p-6 relative">
            <button
              onClick={() => setIsAddPatientOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-outline-variant/20 border-none bg-transparent cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold text-on-surface mb-1 flex items-center gap-2">
              <UserPlus className="h-6 w-6 text-primary" />
              Register New Patient
            </h2>
            <p className="text-xs text-on-surface-variant mb-6">
              Create a monitored account under DPA 2012 compliance. System defaults will set calorie and sodium targets.
            </p>
            <form onSubmit={handleCreatePatient} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-on-surface-variant block mb-1">Full Name</label>
                <Input
                  type="text"
                  placeholder="Juan dela Cruz"
                  value={addName}
                  onChange={e => setAddName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant block mb-1">Email Address</label>
                <Input
                  type="email"
                  placeholder="juan@example.com"
                  value={addEmail}
                  onChange={e => setAddEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant block mb-1">Temporary Password</label>
                <Input
                  type="password"
                  placeholder="At least 8 characters"
                  value={addPassword}
                  onChange={e => setAddPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className="bg-surface-container p-3 rounded-xl border border-outline-variant/20 flex gap-3 text-[10px] text-on-surface-variant mb-4">
                <ShieldCheck className="h-4.5 w-4.5 text-green-700 shrink-0 mt-0.5" />
                <p>
                  DPA compliance consent check: By creating this profile, you confirm the patient has consented to remote diet monitoring and sharing nutritional logs.
                </p>
              </div>
              <Button
                type="submit"
                disabled={isSubmittingPatient}
                className="w-full bg-primary hover:bg-primary/95 text-white h-12 rounded-xl flex items-center justify-center font-bold text-sm cursor-pointer border-none"
              >
                {isSubmittingPatient ? 'Registering...' : 'Register Patient'}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Patient Account"
        description={`Are you sure you want to delete patient "${deletePatientName}"? This action cannot be undone and will permanently delete all logs and dietary targets.`}
        actionText="Delete Patient"
        onAction={executeDeletePatient}
      />

      {/* NOTIFICATION POPUP */}
      {notify && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className={`flex items-start gap-3 px-5 py-4 rounded-2xl shadow-2xl border max-w-sm w-full ${
            notify.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {notify.type === 'success'
              ? <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              : <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            }
            <p className="text-sm font-medium flex-1 leading-snug">{notify.message}</p>
            <button
              onClick={() => setNotify(null)}
              className="text-current opacity-50 hover:opacity-100 transition-opacity bg-transparent border-none cursor-pointer p-0 ml-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClinicianDashboard
