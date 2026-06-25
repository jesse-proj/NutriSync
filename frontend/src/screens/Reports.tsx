import { useState, useEffect } from 'react'
import {
  Download,
  TrendingDown,
  CheckCircle
} from 'lucide-react'
import { ScrollArea, ScrollBar } from '../components/ui/scroll-area'
import Footer from '../components/Footer'
import PatientNavbar from '../components/PatientNavbar'
import { Button } from '@/components/ui/button'
import { apiFetch } from '../api/client'
import { useAuth } from '../context/AuthContext'

// ponytail: Reports.tsx uses simple native SVG and Tailwind divs for charts to keep it minimal and dependency-free

interface FoodLog {
  id: number;
  name: string;
  description: string;
  sodium_mg: number;
  carbs_g: number;
  calories_kcal: number;
  potassium_mg: number;
  protein_g: number;
  fat_g: number;
  logged_at: string;
}

const Reports = () => {
  const { user } = useAuth()
  const [logs, setLogs] = useState<FoodLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await apiFetch('/api/patients/logs?limit=30')
        if (data) setLogs(data)
      } catch (e) {
        console.error("Error fetching logs:", e)
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [])

  // Calculate weekly data from logs (last 7 days)
  const getWeeklyData = () => {
    const weeklyData = []
    const today = new Date()
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const dailyStats: { [key: string]: { calories: number; sodium: number } } = {}

    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dayKey = date.toISOString().split('T')[0]
      dailyStats[dayKey] = { calories: 0, sodium: 0 }
    }

    // Aggregate log data by day
    logs.forEach(log => {
      const logDate = new Date(log.logged_at)
      const dayKey = logDate.toISOString().split('T')[0]
      if (dailyStats[dayKey]) {
        dailyStats[dayKey].calories += log.calories_kcal
        dailyStats[dayKey].sodium += log.sodium_mg
      }
    })

    // Convert to percentage (0-100 scale)
    const maxCalories = Math.max(2500, ...Object.values(dailyStats).map(s => s.calories))
    const maxSodium = Math.max(2300, ...Object.values(dailyStats).map(s => s.sodium))

    let dayIndex = 0
    for (const dayKey in dailyStats) {
      const stats = dailyStats[dayKey]
      weeklyData.push({
        day: days[(new Date(dayKey).getDay())],
        calories: Math.round((stats.calories / maxCalories) * 100),
        sodium: Math.round((stats.sodium / maxSodium) * 100),
      })
      dayIndex++
    }

    return weeklyData
  }

  const weeklyData = getWeeklyData()

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans">
        <PatientNavbar activePage="reports" />
        <div className="flex-grow flex items-center justify-center">
          <p className="text-on-surface-variant">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans relative">
      <PatientNavbar activePage="reports" />

      {/* Main Content */}
      <ScrollArea className="flex-grow w-full">
        <main className="max-w-7xl mx-auto w-full px-6 py-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-on-surface tracking-tight">Nutritional Analysis</h1>
              <p className="text-sm text-on-surface-variant mt-1.5">Reviewing your health trends for the past week</p>
            </div>
            <Button className="bg-primary text-on-primary px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg hover:bg-primary-container transition-all">
              <Download className="h-4 w-4" />
              Export Full Report
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-12 flex flex-col gap-8">
              {/* Weekly Summary & Chart */}
              <section className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-on-surface">Weekly Summary</h3>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-primary"></span>
                      <span className="text-xs font-semibold text-on-surface-variant">Calories</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-secondary"></span>
                      <span className="text-xs font-semibold text-on-surface-variant">Sodium</span>
                    </div>
                  </div>
                </div>

                {/* Bar Chart */}
                <div className="h-64 flex items-end justify-between gap-4 mt-8 px-4 border-b border-outline-variant/50 pb-4">
                  {weeklyData.map((data, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <div className="w-full flex justify-center items-end gap-1 h-[80%]">
                        <div
                          className="w-4 rounded-t-sm transition-all duration-500 bg-primary"
                          style={{ height: `${data.calories}%` }}
                          title={`Calories: ${data.calories}%`}
                        ></div>
                        <div
                          className="w-4 rounded-t-sm transition-all duration-500 bg-secondary"
                          style={{ height: `${data.sodium}%` }}
                          title={`Sodium: ${data.sodium}%`}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-on-surface-variant">{data.day}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Nutritional Insights */}
              <section className="flex flex-col gap-4">
                <h3 className="text-lg font-bold text-on-surface">Nutritional Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Sodium Card */}
                  <div className="bg-surface-container-low p-6 rounded-2xl border border-secondary-container flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center text-secondary">
                        <TrendingDown className="h-6 w-6" />
                      </div>
                      <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold">
                        {logs.length > 0 ? 'Tracking' : 'Start Logging'}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-secondary">Sodium Management</h4>
                      <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                        {logs.length > 0 
                          ? `You've logged ${logs.length} meals. ${logs.some(l => l.sodium_mg > 400) ? 'Try to reduce high-sodium meals.' : 'Great job keeping sodium low!'}` 
                          : 'Start logging meals to track your sodium intake.'}
                      </p>
                    </div>
                  </div>

                  {/* Potassium Card */}
                  <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 flex flex-col gap-4 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <CheckCircle className="h-6 w-6" />
                      </div>
                      <span className="bg-surface-variant text-on-surface-variant px-3 py-1 rounded-full text-xs font-bold">
                        {logs.length > 0 ? 'Monitoring' : 'No Data'}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-on-surface">Potassium Intake</h4>
                      <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                        {logs.length > 0 
                          ? `Average: ${Math.round(logs.reduce((sum, log) => sum + (log.potassium_mg || 0), 0) / logs.length)}mg per meal.` 
                          : 'Log meals to track potassium intake.'}
                      </p>
                    </div>
                  </div>
                </div>
              </section>


            </div>
          </div>
        </main>

        <Footer />
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  )
}

export default Reports
