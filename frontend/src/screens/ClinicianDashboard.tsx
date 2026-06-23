
import { useAuth } from '../context/AuthContext'
import logoBrand from '../assets/logo_brand.png'
import { Users, LogOut, ShieldAlert } from 'lucide-react'
import { Button } from '../components/ui/button'

const ClinicianDashboard = () => {
  const { user, logout } = useAuth()

  // Mock patient data for clinic roster
  const patients = [
    { name: 'Juan dela Cruz', id: '1', age: 58, diagnosis: 'Hypertension', compliance: 'Normal (85%)', lastLogged: '2 hours ago', risk: 'low' },
    { name: 'Maria Salome', id: '2', age: 62, diagnosis: 'Stage III CKD', compliance: 'Alert (Exceeded Sodium Cap)', lastLogged: '4 hours ago', risk: 'high' },
    { name: 'Emilio Aguinaldo', id: '3', age: 70, diagnosis: 'Type 2 Diabetes', compliance: 'No logs for 48 hours', lastLogged: '2 days ago', risk: 'medium' },
  ]

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-outline-variant px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logoBrand} alt="NutriSync Logo" className="h-10 w-auto" />
          <div className="h-6 w-px bg-outline-variant hidden sm:block"></div>
          <span className="font-headline-sm text-headline-sm text-primary hidden sm:inline-block">Clinician Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container rounded-lg">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-label-md text-label-md text-on-surface font-semibold">Dr. {user?.full_name}</span>
          </div>
          <Button 
            onClick={logout} 
            variant="ghost"
            className="flex items-center gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
            title="Log Out"
          >
            <LogOut className="h-4 w-4" />
            <span className="font-label-sm text-label-sm hidden sm:inline">Log out</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clinician Overview Panel */}
        <section className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="font-headline-md text-headline-md text-on-surface">Remote Patient Roster</h1>
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
              3 Patients Registered
            </span>
          </div>

          {/* Roster list */}
          <div className="space-y-4">
            {patients.map(p => (
              <div key={p.id} className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm hover:border-primary/50 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">{p.name}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    {p.age} years old • <span className="font-semibold text-primary">{p.diagnosis}</span>
                  </p>
                  <p className="text-xs text-outline">Last log activity: {p.lastLogged}</p>
                </div>
                <div className="flex flex-col md:items-end gap-2 w-full md:w-auto">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold w-fit ${
                    p.risk === 'high' 
                      ? 'bg-red-100 text-red-800' 
                      : p.risk === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                  }`}>
                    {p.compliance}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm">
                      View Logs
                    </Button>
                    <Button size="sm">
                      Edit Thresholds
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Clinician Sidebar Info */}
        <section className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-headline-sm text-headline-sm flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600" /> Exceptions Alert
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              The following alerts require clinical follow-up:
            </p>
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
              <span className="font-label-sm text-label-sm text-red-800 font-bold block">MEMBER EXCEPTION</span>
              <span className="font-body-md text-body-md text-red-950 font-bold block">Maria Salome exceeded Daily Sodium Target 3 times this week.</span>
              <span className="text-xs text-red-700 block">Recommended Action: Call to adjust dietary compliance.</span>
            </div>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl space-y-2">
              <span className="font-label-sm text-label-sm text-yellow-800 font-bold block">SILENCE ALERT</span>
              <span className="font-body-md text-body-md text-yellow-950 font-bold block">Emilio Aguinaldo has not logged any meal for 48 hours.</span>
              <span className="text-xs text-yellow-700 block">Recommended Action: Send an SMS nudge.</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default ClinicianDashboard
