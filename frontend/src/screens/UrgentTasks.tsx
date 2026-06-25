import React, { useEffect, useState } from 'react'
import { apiFetch } from '../api/client'
import { Button } from '../components/ui/button'
import { ScrollArea } from '../components/ui/scroll-area'
import {
  TriangleAlert,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  Check,
  ExternalLink,
  ShieldAlert,
  Flame,
  Utensils,
  Clock
} from 'lucide-react'

interface Alert {
  id: number
  patient_id: number
  patient_name: string
  alert_type: string
  message: string
  is_resolved: boolean
  created_at: string
}

interface Patient {
  id: number
  email: string
  full_name: string
  role: string
  consent_given: boolean
}

interface UrgentTasksProps {
  onSelectPatient: (patient: Patient) => void
  patients: Patient[]
  onAlertResolved?: () => void
}

export function UrgentTasks({ onSelectPatient, patients, onAlertResolved }: UrgentTasksProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning'>('all')
  const [resolvingId, setResolvingId] = useState<number | null>(null)
  const [notify, setNotify] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Fetch alerts
  const fetchAlerts = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true)
    else setLoading(true)
    
    try {
      const data = await apiFetch<Alert[]>('/api/clinicians/alerts')
      if (data) {
        setAlerts(data)
      }
    } catch (err) {
      console.error('Failed to fetch clinical alerts:', err)
      setNotify({ type: 'error', message: 'Failed to sync alerts from the clinical database.' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
    const interval = setInterval(() => fetchAlerts(), 15000)
    return () => clearInterval(interval)
  }, [])

  // Resolve alert
  const handleResolveAlert = async (id: number) => {
    setResolvingId(id)
    try {
      const response = await apiFetch<{ ok: boolean }>(`/api/clinicians/alerts/${id}/resolve`, {
        method: 'PATCH'
      })
      if (response && response.ok) {
        setNotify({ type: 'success', message: 'Alert successfully resolved and archived.' })
        // Fade out local state
        setAlerts(prev => prev.filter(alert => alert.id !== id))
        if (onAlertResolved) {
          onAlertResolved()
        }
      }
    } catch (err) {
      console.error('Failed to resolve alert:', err)
      setNotify({ type: 'error', message: 'Failed to resolve alert. Please try again.' })
    } finally {
      setResolvingId(null)
    }
  }

  // Clear notification after 3 seconds
  useEffect(() => {
    if (notify) {
      const timer = setTimeout(() => setNotify(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notify])

  // Helpers for classifications
  const isCritical = (alertType: string) => {
    return alertType.startsWith('CRITICAL') || alertType.includes('CRITICAL')
  }

  const getAlertStyle = (alertType: string) => {
    if (isCritical(alertType)) {
      return {
        badgeBg: 'bg-red-50 text-red-700 border-red-200/60',
        icon: ShieldAlert,
        iconClass: 'text-red-600',
        rowBorder: 'border-l-4 border-l-red-600',
        label: 'Critical'
      }
    }
    return {
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200/60',
      icon: TriangleAlert,
      iconClass: 'text-amber-600',
      rowBorder: 'border-l-4 border-l-amber-500',
      label: 'Warning'
    }
  }

  const getTypeStyle = (alertType: string) => {
    if (alertType.includes('SODIUM')) {
      return {
        label: 'Sodium Limit',
        bg: 'bg-blue-50 text-blue-700 border-blue-100',
        icon: Utensils
      }
    }
    if (alertType.includes('CALORIES')) {
      return {
        label: 'Calorie Limit',
        bg: 'bg-orange-50 text-orange-700 border-orange-100',
        icon: Flame
      }
    }
    if (alertType.includes('CARBS')) {
      return {
        label: 'Carbs Limit',
        bg: 'bg-yellow-50 text-yellow-800 border-yellow-100',
        icon: Utensils
      }
    }
    return {
      label: 'Dietary Alert',
      bg: 'bg-slate-50 text-slate-700 border-slate-100',
      icon: AlertCircle
    }
  }

  // Filtering & Searching
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          alert.message.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (!matchesSearch) return false
    
    if (filter === 'critical') return isCritical(alert.alert_type)
    if (filter === 'warning') return !isCritical(alert.alert_type)
    return true
  })

  // Counts
  const totalCount = alerts.length
  const criticalCount = alerts.filter(a => isCritical(a.alert_type)).length
  const warningCount = totalCount - criticalCount

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-on-surface flex items-center gap-2">
            <AlertCircle className="h-7 w-7 text-error shrink-0" />
            Urgent Clinical Tasks
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Real-time patient triage. Review nutritional violations and sign off on completed actions.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="relative max-w-xs w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by patient..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-outline-variant text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <Button
            variant="outline"
            size="default"
            onClick={() => fetchAlerts(true)}
            disabled={refreshing || loading}
            className="rounded-xl flex items-center gap-1.5 h-10 border-outline-variant bg-white"
          >
            <RefreshCw className={`h-4 w-4 text-on-surface-variant ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </Button>
        </div>
      </div>

      {/* Summary Statistics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Urgent */}
        <div className="bg-white border border-outline-variant rounded-2xl p-5 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-slate-100 rounded-xl text-slate-700 shrink-0">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-on-surface-variant">Active Alerts</p>
            <p className="text-3xl font-black text-on-surface leading-none mt-1">{totalCount}</p>
          </div>
        </div>

        {/* Critical Count */}
        <div className="bg-white border border-outline-variant rounded-2xl p-5 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-red-50 rounded-xl text-red-600 shrink-0">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-red-700">Critical Priority</p>
            <p className="text-3xl font-black text-red-600 leading-none mt-1">{criticalCount}</p>
          </div>
        </div>

        {/* Warning Count */}
        <div className="bg-white border border-outline-variant rounded-2xl p-5 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600 shrink-0">
            <TriangleAlert className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-amber-700">Moderate Warning</p>
            <p className="text-3xl font-black text-amber-600 leading-none mt-1">{warningCount}</p>
          </div>
        </div>
      </div>

      {/* Main Card/Table Container */}
      <div className="bg-white border border-outline-variant rounded-2xl shadow-sm flex flex-col overflow-hidden">
        {/* Filter Bar */}
        <div className="px-6 py-4 border-b border-outline-variant flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-surface-bright/50">
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                filter === 'all'
                  ? 'bg-white text-on-surface shadow-xs'
                  : 'bg-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              All Alerts ({totalCount})
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                filter === 'critical'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-transparent text-red-700 hover:bg-red-50'
              }`}
            >
              Critical ({criticalCount})
            </button>
            <button
              onClick={() => setFilter('warning')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                filter === 'warning'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-transparent text-amber-700 hover:bg-amber-50'
              }`}
            >
              Warnings ({warningCount})
            </button>
          </div>
          <div className="text-xs font-medium text-on-surface-variant">
            Showing {filteredAlerts.length} of {alerts.length} unresolved incidents
          </div>
        </div>

        {/* Alerts list or table */}
        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center text-on-surface-variant text-sm flex flex-col items-center justify-center gap-3">
              <RefreshCw className="h-8 w-8 text-outline animate-spin" />
              <span className="font-semibold">Loading clinical event log...</span>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="py-24 text-center text-on-surface-variant text-sm border-none rounded-xl flex flex-col items-center justify-center gap-4 px-6">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 border border-green-200">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-bold text-base text-on-surface">Clinical Dashboard Stable</h3>
                <p className="text-xs text-on-surface-variant mt-1 max-w-sm mx-auto">
                  {alerts.length > 0 
                    ? "No alerts match the selected filters. Change filters or search terms."
                    : "Excellent. All remote patients are currently meeting nutrition goals and staying within safe thresholds."
                  }
                </p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low text-on-surface-variant text-[11px] uppercase tracking-wider font-bold border-b border-outline-variant">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Patient</th>
                  <th className="px-6 py-3.5 font-bold">Severity</th>
                  <th className="px-6 py-3.5 font-bold">Metric Alert</th>
                  <th className="px-6 py-3.5 font-bold">Clinical Detail</th>
                  <th className="px-6 py-3.5 font-bold">Time Occurred</th>
                  <th className="px-6 py-3.5 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filteredAlerts.map(alert => {
                  const style = getAlertStyle(alert.alert_type)
                  const typeStyle = getTypeStyle(alert.alert_type)
                  const TypeIcon = typeStyle.icon
                  const SeverityIcon = style.icon
                  
                  // Initials for patient avatar
                  const initials = alert.patient_name
                    ? alert.patient_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                    : 'P'

                  return (
                    <tr
                      key={alert.id}
                      className={`hover:bg-slate-50/50 transition-colors ${style.rowBorder} ${
                        resolvingId === alert.id ? 'opacity-40 pointer-events-none transition-opacity duration-300' : ''
                      }`}
                    >
                      {/* Patient column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center text-xs font-bold text-primary shrink-0 border border-primary/10">
                            {initials}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-on-surface leading-snug">{alert.patient_name}</p>
                            <p className="text-[10px] text-outline">Patient ID: #{alert.patient_id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Severity column */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.badgeBg}`}>
                          <SeverityIcon className="h-3 w-3 shrink-0" />
                          {style.label}
                        </span>
                      </td>

                      {/* Metric Alert column */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${typeStyle.bg}`}>
                          <TypeIcon className="h-3 w-3 shrink-0" />
                          {typeStyle.label}
                        </span>
                      </td>

                      {/* Clinical Detail message */}
                      <td className="px-6 py-4 max-w-xs md:max-w-md">
                        <p className="text-xs text-on-surface-variant font-medium leading-relaxed">{alert.message}</p>
                      </td>

                      {/* Time Occurred */}
                      <td className="px-6 py-4 text-xs text-on-surface-variant whitespace-nowrap">
                        <div className="flex items-center gap-1 text-outline">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          <span>{new Date(alert.created_at).toLocaleString()}</span>
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => {
                              const foundPat = patients.find(p => p.id === alert.patient_id)
                              if (foundPat) {
                                onSelectPatient(foundPat)
                              } else {
                                // Fallback patient object
                                onSelectPatient({
                                  id: alert.patient_id,
                                  full_name: alert.patient_name,
                                  email: '',
                                  role: 'patient',
                                  consent_given: true
                                })
                              }
                            }}
                            size="sm"
                            variant="ghost"
                            className="text-black hover:bg-secondary/10 font-bold rounded-lg text-xs hover:text-primary"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Review Logs
                          </Button>
                          <Button
                            onClick={() => handleResolveAlert(alert.id)}
                            disabled={resolvingId !== null}
                            size="sm"
                            className="bg-green-600 text-white hover:bg-green-700 font-bold rounded-lg text-xs flex items-center gap-1 border-none cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" />
                            {resolvingId === alert.id ? 'Resolving...' : 'Resolve'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Floating Notifications toast */}
      {notify && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className={`flex items-start gap-3 px-5 py-4 rounded-2xl shadow-2xl border max-w-sm w-full ${
            notify.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {notify.type === 'success'
              ? <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              : <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            }
            <p className="text-sm font-medium flex-1 leading-snug">{notify.message}</p>
          </div>
        </div>
      )}
    </div>
  )
}
