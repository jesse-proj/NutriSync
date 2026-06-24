import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../api/client'
import {
  LogOut,
  Heart,
  Calendar,
  Camera,
  Loader2,
  Bell,
  Utensils,
  AlertTriangle,
  Info,
  Sparkles,
  MessageSquare,
  Pill,
  Droplet,
  Lightbulb,
  Accessibility,
  X,
  Send,
  CheckCircle
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

interface Targets {
  sodium_mg: number;
  carbs_g: number;
  calories_kcal: number;
  potassium_mg: number;
}

interface FoodLog {
  id: number;
  description: string;
  sodium_mg: number;
  carbs_g: number;
  calories_kcal: number;
  potassium_mg?: number;
  protein_g?: number;
  fat_g?: number;
  logged_at: string;
}

interface Message {
  text: string;
  isUser: boolean;
}

const PatientDashboard = () => {
  const { user, logout } = useAuth()

  // State for dashboard metrics
  const [targets, setTargets] = useState<Targets>({ sodium_mg: 2000, carbs_g: 250, calories_kcal: 2000, potassium_mg: 0 })
  const [logs, setLogs] = useState<FoodLog[]>([])

  // Chat drawer and chatbot state
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<Message[]>([])
  const [chatInput, setChatInput] = useState("")
  const [isChatLoading, setIsChatLoading] = useState(false)

  // File upload state
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Accessibility state
  const [isAccessibleText, setIsAccessibleText] = useState(false)
  const [showCheckIcon, setShowCheckIcon] = useState(false)

  // Interactive Clinical Reminders states
  const [losartanTaken, setLosartanTaken] = useState(() => localStorage.getItem('losartan_taken') === 'true')
  const [glassesHydrated, setGlassesHydrated] = useState(() => Number(localStorage.getItem('glasses_hydrated') || 3))

  // Fetch metrics and logs from backend
  const fetchDashboardData = async () => {
    try {
      const [fetchedTargets, fetchedLogs] = await Promise.all([
        apiFetch('/api/patients/targets'),
        apiFetch('/api/patients/logs?limit=10')
      ])
      if (fetchedTargets) setTargets(fetchedTargets)
      if (fetchedLogs) setLogs(fetchedLogs)
    } catch (e) {
      console.error("Error fetching dashboard data:", e)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Initialize chatbot welcome message when user is loaded
  useEffect(() => {
    if (user) {
      setChatMessages([
        {
          text: `Magandang araw, Mang ${user.full_name?.split(' ')[0] || ''}! Ako si NutriGabay. Pwede mo akong tanungin tungkol sa iyong nutrisyon o pagkaing Pinoy.`,
          isUser: false
        }
      ])
    }
  }, [user])

  // Accessibility side-effect
  useEffect(() => {
    if (isAccessibleText) {
      document.documentElement.classList.add('text-lg')
    } else {
      document.documentElement.classList.remove('text-lg')
    }
    return () => {
      document.documentElement.classList.remove('text-lg')
    }
  }, [isAccessibleText])

  // Consumed calculations
  const consumedCalories = logs.reduce((sum, log) => sum + log.calories_kcal, 0)
  const consumedSodium = logs.reduce((sum, log) => sum + log.sodium_mg, 0)
  const consumedCarbs = logs.reduce((sum, log) => sum + log.carbs_g, 0)
  const consumedProtein = logs.reduce((sum, log) => sum + (log.protein_g || 0), 0)
  const consumedFat = logs.reduce((sum, log) => sum + (log.fat_g || 0), 0)

  // Dynamic targets scaling for protein/fat (20% protein, 30% fat based on total daily calorie target)
  const targetProtein = Math.round((targets.calories_kcal * 0.20) / 4) || 120
  const targetFat = Math.round((targets.calories_kcal * 0.30) / 9) || 70

  // Calculate percentage progress
  const carbsPct = Math.min(100, (consumedCarbs / (targets.carbs_g || 1)) * 100)
  const proteinPct = Math.min(100, (consumedProtein / (targetProtein || 1)) * 100)
  const fatPct = Math.min(100, (consumedFat / (targetFat || 1)) * 100)

  const caloriesLeft = Math.max(0, targets.calories_kcal - consumedCalories)

  // Circular progress ring offset calculation (r=42, circumference=264)
  const strokeDashoffset = 264 - (264 * (consumedCalories / (targets.calories_kcal || 1)))

  // High sodium warnings
  const isSodiumWarning = consumedSodium > targets.sodium_mg * 0.6
  const highSodiumMeal = logs.find(log => log.sodium_mg > 400)
  const sodiumAlertMessage = highSodiumMeal
    ? `Your recent meal (${highSodiumMeal.description}) was high in sodium. Try drinking extra water this afternoon.`
    : "Your meals logged today are within healthy sodium thresholds. Excellent choice!";

  // Handlers
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return
    const newMsg = chatInput.trim()
    setChatMessages(prev => [...prev, { text: newMsg, isUser: true }])
    setChatInput("")
    setIsChatLoading(true)

    try {
      const response = await apiFetch('/api/chat/', {
        json: { message: newMsg }
      })
      setChatMessages(prev => [...prev, { text: response.reply, isUser: false }])
    } catch (e) {
      setChatMessages(prev => [...prev, { text: "Pasensya na, may error sa connection.", isUser: false }])
    } finally {
      setIsChatLoading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setIsUploading(true)

      const formData = new FormData()
      formData.append('file', file)

      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://127.0.0.1:8000/api/food/log-photo', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })
        if (response.ok) {
          await fetchDashboardData()
        } else {
          alert("Failed to analyze image. Please try again.")
        }
      } catch (e) {
        console.error("Image upload error:", e)
        alert("Error uploading image")
      } finally {
        setIsUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
  }

  const toggleLosartan = () => {
    const newState = !losartanTaken
    setLosartanTaken(newState)
    localStorage.setItem('losartan_taken', String(newState))
  }

  const updateWaterCount = (count: number) => {
    setGlassesHydrated(count)
    localStorage.setItem('glasses_hydrated', String(count))
  }

  const toggleAccessibility = () => {
    setIsAccessibleText(prev => !prev)
    setShowCheckIcon(true)
    setTimeout(() => {
      setShowCheckIcon(false)
    }, 1000)
  }

  const getMealImage = (description: string) => {
    const desc = description.toLowerCase();
    if (desc.includes('adobo')) {
      return 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZiy_YXjWwY1yXoZAnRxi8GkhE8eZy04TGIFrJjHyAWI16OeY9wNIUU4URE2Lde6TQ8xk1sPJsbd72_O6nFKAPNIEr2V7yYh_zkDHox2GU3URiR7iG2qrsTEbliQu9B_SItuUDNrL8UtysKyFGXPSF2uqGmZd9JQV6t_7ijn1a7yu-ry0VQmbrILTqMevOhrkohvHgYsQXrgG9Iy1nfTfso6MAnyMRPqtRBH0kgGM9Ee9hQ2CLm4R9AWKaol3_OlrpZUrq1PoY6Q';
    }
    if (desc.includes('mango')) {
      return 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOL4IAh5mximIACIakIgp67812ISDfsJa_sUVP8V0kbyI16RCdSu_mjbxBk1U8_0l58NCp4XWWG2CyY6tyHc8kGWe-XWg1lkvLXqpnvBD2KzD1FkamJAe1ucvzPKblUYFhlLzZuv--TplnI9LmUF_cFoV9T4h33xAq6NagtqWInLlik5BSk0IF0TSR66rFKYl1HOXneK9Sr2xg5KIscMlSgcb9apb0e5wX1u8_EdNoFphk4bqBt6Syt6Y28YO93XTzBFv4qxsYYA';
    }
    // High-quality premium fallback food photo
    return 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=150&h=150&fit=crop';
  }

  const formatLogTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    } catch {
      return 'Just now'
    }
  }

  // Get a readable day division (Breakfast, Lunch, Dinner, Snack)
  const getMealPeriod = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const hours = date.getHours()
      if (hours < 11) return 'Breakfast'
      if (hours < 16) return 'Lunch'
      if (hours < 19) return 'Dinner'
      return 'Snack'
    } catch {
      return 'Meal'
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans relative">
      {/* Hidden input for meal photo logging */}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {/* Uploading loading overlay */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex flex-col items-center justify-center text-white gap-4 backdrop-blur-sm">
          <Loader2 className="h-12 w-12 animate-spin text-primary-fixed" />
          <p className="font-headline-sm">Analyzing meal photo with AI...</p>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="w-full top-0 sticky z-40 bg-surface shadow-sm border-b border-outline-variant">
        <nav className="flex justify-between items-center h-16 px-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-8">
            <span className="text-xl font-bold text-primary flex items-center gap-2">
              <Heart className="h-6 w-6" />
              NutriSync RPM
            </span>
            <div className="hidden md:flex gap-6 items-center">
              <a className="text-primary font-semibold border-b-2 border-primary pb-1 text-sm transition-all" href="#">Home</a>
              <a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">Reports</a>
              <a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">Goals</a>
              <a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">Profile</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-surface-container transition-all text-primary relative" title="Notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full ring-2 ring-surface"></span>
            </button>

            {/* Logged in User Profile Info & Logout */}
            <div className="flex items-center gap-3 pl-2 border-l border-outline-variant">
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-primary shrink-0">
                <img
                  className="w-full h-full object-cover"
                  alt="User avatar"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuChyJbiyPfsDfDICSP9EQpQ8xiACr-qDj8oMdPFQJ66o-FT-lsIsbrc5AB2MiOyGMwdToeG1GWRvfI0fc9QqLg4WayK8_M0W93MWQDK8semZzAhp27x4cqqMnmtt5dEacY4DkPYSjk6qJRa7Sn8VBla5E7RJwTAaMkwcYXejeI7NnndBQnA1qG7YCs8zupCop2nK_V5hFl_6rwNOSV7KDzUdaxMU7ln-CJKgIjNXStTdvy4LpFEj-gxUIIghQIEE6o5Zg5EPKA7sQ"
                />
              </div>
              <div className="hidden sm:block">
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
      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-8">

        {/* Personalized Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-on-surface tracking-tight">
            Good morning, {user?.full_name?.split(' ')[0] || 'Juan'}!
          </h1>
          <p className="text-lg text-on-surface-variant mt-1.5">
            {logs.length === 0
              ? "You haven't logged any meals today. Let's start healthy by logging your first meal!"
              : `You've logged ${logs.length} meal${logs.length > 1 ? 's' : ''} today. ${isSodiumWarning
                ? "Your sodium levels are slightly high—let's balance it out."
                : "Your nutritional indicators are looking good today!"
              }`}
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-12 gap-6">

          {/* Main Content Area (Calorie ring, Sodium alerts, Macronutrients, Recent meals) */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">

            {/* Bento-style Vitals Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Calorie Tracking Ring */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-4 right-4 text-outline">
                  <Utensils className="h-5 w-5" />
                </div>
                <h3 className="text-xs font-semibold text-on-surface-variant mb-6 uppercase tracking-wider">
                  Daily Calorie Budget
                </h3>

                <div className="relative w-44 h-44">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Background Ring */}
                    <circle
                      className="text-surface-container stroke-current"
                      cx="50"
                      cy="50"
                      fill="transparent"
                      r="42"
                      strokeWidth="8"
                    />
                    {/* Active Progress Ring */}
                    <circle
                      className="text-primary stroke-current"
                      cx="50"
                      cy="50"
                      fill="transparent"
                      r="42"
                      strokeLinecap="round"
                      strokeWidth="8"
                      style={{
                        strokeDasharray: 264,
                        strokeDashoffset: strokeDashoffset,
                        transition: 'stroke-dashoffset 0.35s',
                        transform: 'rotate(-90deg)',
                        transformOrigin: '50% 50%',
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-extrabold text-on-surface tracking-tight">
                      {Math.round(caloriesLeft).toLocaleString()}
                    </span>
                    <span className="text-xs text-outline font-medium">kcal left</span>
                  </div>
                </div>

                <p className="mt-6 text-sm text-on-surface-variant font-medium">
                  Goal: {targets.calories_kcal?.toLocaleString()} kcal | Consumed: {Math.round(consumedCalories).toLocaleString()} kcal
                </p>
              </div>

              {/* Sodium Intake Summary */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                      Sodium Intake
                    </h3>
                    <p className={`text-2xl font-bold mt-1 ${isSodiumWarning ? 'text-error' : 'text-primary'}`}>
                      {(consumedSodium / 1000).toFixed(2)}g{' '}
                      <span className="text-sm font-normal text-on-surface-variant">
                        / {(targets.sodium_mg / 1000).toFixed(1)}g
                      </span>
                    </p>
                  </div>
                  <span className={`p-2 rounded-xl flex items-center justify-center ${isSodiumWarning ? 'bg-error-container text-error' : 'bg-surface-container text-primary'}`}>
                    {isSodiumWarning ? <AlertTriangle className="h-5 w-5 animate-pulse" /> : <CheckCircle className="h-5 w-5" />}
                  </span>
                </div>

                {/* Warning Alert Box */}
                <div className={`p-4 rounded-xl flex gap-3 items-start border mt-4 ${isSodiumWarning
                  ? 'bg-error-container text-on-error-container border-error/10'
                  : 'bg-surface-container text-on-surface border-outline-variant/20'
                  }`}>
                  <Info className="h-5 w-5 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <p className="text-xs font-semibold">
                      {isSodiumWarning ? 'Sodium Intake Alert' : 'Sodium Compliance'}
                    </p>
                    <p className="text-xs opacity-90 mt-0.5 leading-relaxed">
                      {sodiumAlertMessage}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Macronutrient Progress */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30">
              <h3 className="text-lg font-bold text-on-surface mb-6">
                Macronutrient Progress
              </h3>
              <div className="space-y-5">

                {/* Protein progress */}
                <div>
                  <div className="flex justify-between mb-1.5 text-sm">
                    <span className="font-semibold text-on-surface">Protein</span>
                    <span className="text-on-surface-variant">{Math.round(consumedProtein)}g / {targetProtein}g</span>
                  </div>
                  <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden">
                    <div className="bg-secondary h-full rounded-full transition-all duration-500" style={{ width: `${proteinPct}%` }}></div>
                  </div>
                </div>

                {/* Carbohydrates progress */}
                <div>
                  <div className="flex justify-between mb-1.5 text-sm">
                    <span className="font-semibold text-on-surface">Carbohydrates</span>
                    <span className="text-on-surface-variant">{Math.round(consumedCarbs)}g / {targets.carbs_g}g</span>
                  </div>
                  <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${carbsPct}%` }}></div>
                  </div>
                </div>

                {/* Fats progress */}
                <div>
                  <div className="flex justify-between mb-1.5 text-sm">
                    <span className="font-semibold text-on-surface">Fats</span>
                    <span className="text-on-surface-variant">{Math.round(consumedFat)}g / {targetFat}g</span>
                  </div>
                  <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden">
                    <div className="bg-tertiary h-full rounded-full transition-all duration-500" style={{ width: `${fatPct}%` }}></div>
                  </div>
                </div>

              </div>
            </div>

            {/* Recent Meals */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-on-surface">Recent Meals</h3>
                <span className="text-xs text-primary font-semibold">Today</span>
              </div>

              {logs.length === 0 ? (
                <div className="p-8 bg-surface-container-low border border-dashed border-outline-variant rounded-2xl text-center text-on-surface-variant text-sm flex flex-col items-center justify-center gap-3">
                  <Utensils className="h-8 w-8 text-outline" />
                  <div>
                    <p className="font-semibold">No meals logged today</p>
                    <p className="text-xs mt-0.5">Log your meals by uploading a photo or talking to NutriGabay AI.</p>
                  </div>
                  <Button onClick={() => fileInputRef.current?.click()} className="mt-2 rounded-full flex gap-2">
                    <Camera className="h-4 w-4" />
                    Log First Meal
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {logs.map(log => (
                    <div key={log.id} className="flex gap-4 bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-outline-variant/30 hover:shadow-md transition-shadow">
                      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-outline-variant/20 bg-surface-container">
                        <img
                          className="w-full h-full object-cover"
                          alt={log.description}
                          src={getMealImage(log.description)}
                        />
                      </div>
                      <div className="flex flex-col justify-between py-1 flex-grow">
                        <div>
                          <p className="text-sm font-bold text-on-surface line-clamp-1">{log.description}</p>
                          <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                            {getMealPeriod(log.logged_at)} • {formatLogTime(log.logged_at)}
                          </p>
                        </div>
                        <div className="flex gap-2 mt-1">
                          <span className="bg-surface-container px-2 py-0.5 rounded text-[10px] font-bold text-on-surface-variant">
                            {Math.round(log.calories_kcal)} kcal
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.sodium_mg > 400
                            ? 'bg-error-container text-on-error-container'
                            : 'bg-secondary-container text-on-secondary-container'
                            }`}>
                            {Math.round(log.sodium_mg)}mg Sodium
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Sidebar Area (Quick Actions, Reminders, Suggestions) */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">

            {/* Quick Actions Card */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-primary text-on-primary h-14 rounded-2xl flex items-center justify-center gap-3 font-semibold text-sm shadow-lg shadow-primary/20 hover:bg-primary-container transition-all border-none cursor-pointer"
              >
                <Sparkles className="h-5 w-5" />
                Log a Meal with AI
              </Button>
              <Button
                onClick={() => setIsChatOpen(true)}
                className="bg-secondary text-on-secondary h-14 rounded-2xl flex items-center justify-center gap-3 font-semibold text-sm shadow-lg shadow-secondary/20 hover:opacity-95 transition-all border-none cursor-pointer"
              >
                <MessageSquare className="h-5 w-5" />
                Ask NutriGabay
              </Button>
            </div>

            {/* Clinical Reminders */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-on-surface">Clinical Reminders</h3>
              </div>

              <div className="space-y-6">

                {/* Losartan Medication Reminder */}
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-primary-container text-on-primary-container rounded-xl flex items-center justify-center shrink-0">
                    <Pill className="h-5 w-5" />
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-bold text-on-surface">Losartan (50mg)</p>
                    <p className="text-xs text-on-surface-variant font-medium mt-0.5">Due: 8:00 PM tonight</p>
                    <button
                      onClick={toggleLosartan}
                      className={`mt-3 text-xs font-semibold px-4 py-1.5 rounded-full border transition-all cursor-pointer ${losartanTaken
                        ? 'bg-green-100 border-green-300 text-green-700 font-bold flex items-center gap-1'
                        : 'bg-transparent border-primary text-primary hover:bg-primary-container'
                        }`}
                    >
                      {losartanTaken ? (
                        <>
                          <CheckCircle className="h-3.5 w-3.5" />
                          Taken
                        </>
                      ) : (
                        'Mark Taken'
                      )}
                    </button>
                  </div>
                </div>

                {/* Hydration Tracker Reminder */}
                <div className="flex gap-4 items-start border-t border-outline-variant/30 pt-5">
                  <div className="w-10 h-10 bg-secondary-container text-on-secondary-container rounded-xl flex items-center justify-center shrink-0">
                    <Droplet className="h-5 w-5" />
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-bold text-on-surface">Hydration Goal</p>
                    <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                      Drink {Math.max(0, 5 - glassesHydrated)} more glasses today
                    </p>

                    {/* Interactive Glass indicators */}
                    <div className="mt-3.5 flex gap-1.5">
                      {[1, 2, 3, 4, 5].map(idx => (
                        <button
                          key={idx}
                          onClick={() => updateWaterCount(idx)}
                          className={`w-7 h-2 rounded-full transition-all cursor-pointer ${idx <= glassesHydrated
                            ? 'bg-secondary'
                            : 'bg-surface-container hover:bg-secondary/40'
                            }`}
                          title={`Log ${idx} glasses`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* NutriGabay Suggestion Card */}
            <div className="relative overflow-hidden bg-primary p-6 rounded-2xl shadow-sm text-on-primary">
              <div className="absolute -right-4 -bottom-4 opacity-15">
                <Lightbulb className="w-28 h-28 transform rotate-12" />
              </div>
              <div className="relative z-10">
                <div className="bg-white/10 w-fit px-3 py-1 rounded-full mb-4 border border-white/10">
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    NutriGabay Suggestion
                  </span>
                </div>
                <p className="text-lg font-bold leading-snug mb-2">
                  Swap Bagoong for Calamansi & Garlic
                </p>
                <p className="text-xs text-on-primary/80 mb-5 leading-relaxed">
                  You can keep the savory flavor of your Pinakbet without the extra sodium spike. Your kidneys will thank you!
                </p>
                <button
                  onClick={() => {
                    setIsChatOpen(true)
                    setChatMessages(prev => [
                      ...prev,
                      { text: "Ano ang magandang recipe para sa Pinakbet na walang bagoong?", isUser: true },
                      { text: "Magandang tanong! Upang mapanatili ang sarap ng Pinakbet nang hindi gumagamit ng maalat na bagoong, maaari mong gamitin ang pinaghalong calamansi, bawang, at kaunting patis na may mababang sodium. Pwede rin nating dagdagan ng gata upang maging malasa ang sabaw. Gusto mo bang bigyan kita ng kumpletong recipe?", isUser: false }
                    ])
                  }}
                  className="bg-on-primary text-primary px-5 py-2 rounded-xl font-semibold text-xs border-none hover:bg-primary-fixed transition-colors cursor-pointer"
                >
                  Explore Recipes
                </button>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="w-full mt-auto bg-surface-container-low border-t border-outline-variant/50">
        <div className="flex flex-col items-center py-8 px-6 w-full max-w-7xl mx-auto text-center gap-4">
          <span className="text-sm font-bold text-primary">NutriSync RPM</span>
          <div className="flex gap-6">
            <a className="text-on-surface-variant hover:text-secondary text-xs transition-all" href="#">Privacy Policy</a>
            <a className="text-on-surface-variant hover:text-secondary text-xs transition-all" href="#">Terms of Service</a>
            <a className="text-on-surface-variant hover:text-secondary text-xs transition-all" href="#">Compliance Documentation</a>
          </div>
          <p className="text-[11px] text-on-surface-variant opacity-85 leading-relaxed">
            © 2026 NutriSync. All rights reserved. HIPAA Compliant | DPA 2012 Certified.
          </p>
        </div>
      </footer>

      {/* Text Size Toggle Utility (Accessibility FAB) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-2">
        <button
          id="accessibilityToggle"
          onClick={toggleAccessibility}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all cursor-pointer border-none ${isAccessibleText
            ? 'bg-primary text-on-primary'
            : 'bg-on-surface text-surface'
            }`}
          title="Toggle Large Text Accessibility"
        >
          {showCheckIcon ? <CheckCircle className="h-5 w-5 animate-ping" /> : <Accessibility className="h-5 w-5" />}
        </button>
      </div>

      {/* Chatbot Side Drawer (NutriGabay AI) */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setIsChatOpen(false)}
            className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-md bg-surface h-full shadow-2xl flex flex-col z-10 transition-transform duration-300 animate-slide-in-right">

            {/* Header */}
            <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-on-surface">NutriGabay AI</h3>
                  <p className="text-[10px] text-on-surface-variant font-medium">Your Pinoy Health Companion</p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 rounded-full hover:bg-outline-variant/30 transition-all text-on-surface-variant border-none cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Conversation Messages Box */}
            <div className="flex-grow p-5 space-y-4 overflow-y-auto bg-background flex flex-col-reverse">
              {/* Flex direction reversed to always keep latest message at the bottom while scrolling */}
              <div className="flex flex-col gap-4">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-xs ${msg.isUser
                      ? 'bg-primary text-on-primary self-end rounded-tr-none'
                      : 'bg-surface-container-lowest text-on-surface self-start rounded-tl-none border border-outline-variant/15'
                      }`}
                  >
                    {msg.text}
                  </div>
                ))}
                {isChatLoading && (
                  <div className="bg-surface-container-lowest p-3 rounded-2xl rounded-tl-none border border-outline-variant/15 text-on-surface-variant self-start flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-xs font-medium">Nag-iisip si NutriGabay...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Input Area */}
            <div className="p-4 border-t border-outline-variant bg-surface-container-lowest flex gap-2">
              <Input
                type="text"
                placeholder="Magtanong kay NutriGabay..."
                className="flex-grow bg-background border-outline-variant"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                disabled={isChatLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isChatLoading || !chatInput.trim()}
                className="rounded-xl px-4"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default PatientDashboard
