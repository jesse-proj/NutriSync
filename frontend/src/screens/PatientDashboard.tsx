import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiFetch, API_URL } from '../api/client'
import {
  Calendar,
  Camera,
  Loader2,
  Utensils,
  AlertTriangle,
  Info,
  Sparkles,
  MessageSquare,
  Pill,
  Droplet,
  X,
  Send,
  CheckCircle,
  Check,
  ArrowRight
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { ScrollArea, ScrollBar } from '../components/ui/scroll-area'
import { Card } from '../components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert'
import PatientNavbar from '../components/PatientNavbar'
import Footer from '@/components/Footer'

interface Targets {
  sodium_mg: number;
  carbs_g: number;
  calories_kcal: number;
  potassium_mg: number;
}

interface FoodLog {
  id: number;
  name: string;
  description: string;
  sodium_mg: number;
  carbs_g: number;
  calories_kcal: number;
  potassium_mg?: number;
  protein_g?: number;
  fat_g?: number;
  image_url?: string;
  logged_at: string;
}

interface Message {
  text: string;
  isUser: boolean;
}

const getMealImage = (description: string) => {
  const desc = description.toLowerCase();
  if (desc.includes('adobo')) {
    return 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZiy_YXjWwY1yXoZAnRxi8GkhE8eZy04TGIFrJjHyAWI16OeY9wNIUU4URE2Lde6TQ8xk1sPJsbd72_O6nFKAPNIEr2V7yYh_zkDHox2GU3URiR7iG2qrsTEbliQu9B_SItuUDNrL8UtysKyFGXPSF2uqGmZd9JQV6t_7ijn1a7yu-ry0VQmbrILTqMevOhrkohvHgYsQXrgG9Iy1nfTfso6MAnyMRPqtRBH0kgGM9Ee9hQ2CLm4R9AWKaol3_OlrpZUrq1PoY6Q';
  }
  if (desc.includes('mango')) {
    return 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOL4IAh5mximIACIakIgp67812ISDfsJa_sUVP8V0kbyI16RCdSu_mjbxBk1U8_0l58NCp4XWWG2CyY6tyHc8kGWe-XWg1lkvLXqpnvBD2KzD1FkamJAe1ucvzPKblUYFhlLzZuv--TplnI9LmUF_cFoV9T4h33xAq6NagtqWInLlik5BSk0IF0TSR66rFKYl1HOXneK9Sr2xg5KIscMlSgcb9apb0e5wX1u8_EdNoFphk4bqBt6Syt6Y28YO93XTzBFv4qxsYYA';
  }
  return 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=150&h=150&fit=crop';
}

const formatLogTime = (dateString: string) => {
  try {
    const dStr = dateString.endsWith('Z') ? dateString : dateString + 'Z'
    const date = new Date(dStr)
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  } catch {
    return 'Just now'
  }
}

const getMealPeriod = (dateString: string) => {
  try {
    const dStr = dateString.endsWith('Z') ? dateString : dateString + 'Z'
    const date = new Date(dStr)
    const hours = date.getHours()
    if (hours < 11) return 'Breakfast'
    if (hours < 16) return 'Lunch'
    if (hours < 19) return 'Dinner'
    return 'Snack'
  } catch {
    return 'Meal'
  }
}

const MealCard = ({ log, isExpanded, onToggle }: { log: FoodLog; isExpanded: boolean; onToggle: () => void }) => {
  const macros = [
    { label: 'Calories', value: `${Math.round(log.calories_kcal)} kcal`, color: 'bg-[#FF6B6B]' },
    { label: 'Protein', value: `${Math.round(log.protein_g || 0)}g`, color: 'bg-[#4ECDC4]' },
    { label: 'Carbs', value: `${Math.round(log.carbs_g)}g`, color: 'bg-[#95E77E]' },
    { label: 'Fat', value: `${Math.round(log.fat_g || 0)}g`, color: 'bg-[#FFA07A]' },
    { label: 'Sodium', value: `${Math.round(log.sodium_mg)}mg`, color: log.sodium_mg > 400 ? 'bg-[#FF6B6B]' : 'bg-[#95E77E]' },
    { label: 'Potassium', value: `${Math.round(log.potassium_mg || 0)}mg`, color: 'bg-[#4ECDC4]' },
  ]

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 ${isExpanded ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'}`}
      onClick={onToggle}
    >
      <div className="flex gap-4 p-4">
        <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-outline-variant/20 bg-surface-container">
          <img
            className="w-full h-full object-cover"
            alt={log.description}
            src={log.image_url ? `${API_URL}${log.image_url}` : getMealImage(log.description)}
          />
        </div>
        <div className="flex flex-col justify-between py-1 flex-grow min-w-0">
          <div>
            <p className={`text-sm font-bold text-on-surface ${isExpanded ? '' : 'line-clamp-1'}`}>{log.name}</p>
            <p className={`text-xs text-on-surface-variant ${isExpanded ? '' : 'line-clamp-1'}`}>{log.description}</p>
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
              {Math.round(log.sodium_mg)}mg Na
            </span>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-outline-variant/20 px-4 pb-4 pt-4">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Macronutrients</p>
          <div className="grid grid-cols-3 gap-2">
            {macros.map(m => (
              <div key={m.label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-surface-container">
                <div className={`w-2.5 h-2.5 rounded-full ${m.color}`} />
                <span className="text-xs font-bold text-on-surface">{m.value}</span>
                <span className="text-[10px] text-on-surface-variant">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

const PatientDashboard = () => {
  const { user } = useAuth()

  // State for dashboard metrics
  const [targets, setTargets] = useState<Targets>({ sodium_mg: 2000, carbs_g: 250, calories_kcal: 2000, potassium_mg: 0 })
  const [logs, setLogs] = useState<FoodLog[]>([])
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const mealsPerPage = 4

  // Chat drawer and chatbot state
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<Message[]>([])
  const [chatInput, setChatInput] = useState("")
  const [isChatLoading, setIsChatLoading] = useState(false)

  // Direct Doctor Chat state
  const [isDoctorChatOpen, setIsDoctorChatOpen] = useState(false)
  const [doctorMessages, setDoctorMessages] = useState<any[]>([])
  const [doctorChatInput, setDoctorChatInput] = useState("")
  const [isDoctorChatLoading, setIsDoctorChatLoading] = useState(false)
  const [unreadDoctorMessagesCount, setUnreadDoctorMessagesCount] = useState(0)
  const [doctorProfile, setDoctorProfile] = useState<{ id: number; full_name: string; email: string } | null>(null)

  const doctorSocketRef = useRef<WebSocket | null>(null)
  const doctorMessagesEndRef = useRef<HTMLDivElement>(null)

  // Connect to Doctor WebSocket
  const connectDoctorWebSocket = (clinicianId: number) => {
    if (doctorSocketRef.current) {
      doctorSocketRef.current.close()
    }

    const token = localStorage.getItem('token')
    if (!token) return

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${wsProtocol}//127.0.0.1:8000/api/chat/direct/ws?token=${token}`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('Connected to doctor chat WS')
    }

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (
        (msg.sender_id === clinicianId && msg.receiver_id === user?.id) ||
        (msg.sender_id === user?.id && msg.receiver_id === clinicianId)
      ) {
        setDoctorMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })

        if (isDoctorChatOpen) {
          if (msg.sender_id === clinicianId) {
            apiFetch(`/api/chat/direct/read/${clinicianId}`, { method: 'PATCH' })
          }
        } else {
          if (msg.sender_id === clinicianId) {
            setUnreadDoctorMessagesCount(prev => prev + 1)
          }
        }
      }
    }

    ws.onclose = () => {
      console.log('Disconnected from doctor chat WS')
    }

    ws.onerror = (err) => {
      console.error('Doctor chat WS error:', err)
    }

    doctorSocketRef.current = ws
  }

  const fetchDoctorProfileAndHistory = async () => {
    try {
      const doc = await apiFetch('/api/patients/clinician')
      if (doc) {
        setDoctorProfile(doc)
        
        const unreadData = await apiFetch('/api/chat/direct/unread')
        if (unreadData) {
          setUnreadDoctorMessagesCount(unreadData[doc.id] || 0)
        }

        connectDoctorWebSocket(doc.id)
      }
    } catch (err) {
      console.log("No assigned clinician or error loading profile:", err)
    }
  }

  useEffect(() => {
    if (user) {
      fetchDoctorProfileAndHistory()
    }
    return () => {
      if (doctorSocketRef.current) {
        doctorSocketRef.current.close()
      }
    }
  }, [targets.sodium_mg, user])

  const fetchDoctorChatHistory = async (clinicianId: number) => {
    setIsDoctorChatLoading(true)
    try {
      const history = await apiFetch(`/api/chat/direct/history/${clinicianId}`)
      if (history) setDoctorMessages(history)

      await apiFetch(`/api/chat/direct/read/${clinicianId}`, { method: 'PATCH' })
      setUnreadDoctorMessagesCount(0)
    } catch (err) {
      console.error("Error fetching doctor chat history:", err)
    } finally {
      setIsDoctorChatLoading(false)
    }
  }

  const handleOpenDoctorChat = () => {
    if (!doctorProfile) {
      alert("No clinician is currently assigned to monitor your profile.")
      return
    }
    setIsDoctorChatOpen(true)
    fetchDoctorChatHistory(doctorProfile.id)
  }

  const handleSendDoctorMessage = () => {
    if (!doctorChatInput.trim() || !doctorProfile) return

    const payload = {
      receiver_id: doctorProfile.id,
      message: doctorChatInput.trim()
    }

    if (doctorSocketRef.current && doctorSocketRef.current.readyState === WebSocket.OPEN) {
      doctorSocketRef.current.send(JSON.stringify(payload))
      setDoctorChatInput("")
    } else {
      console.warn("WebSocket is not active. Attempting to reconnect...")
      connectDoctorWebSocket(doctorProfile.id)
      alert("Chat connection is currently reconnecting. Please try sending again in a moment.")
    }
  }

  useEffect(() => {
    if (isDoctorChatOpen) {
      doctorMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [doctorMessages, isDoctorChatOpen])

  // File upload state
  const [isUploading, setIsUploading] = useState(false)
  const [scannedFoodData, setScannedFoodData] = useState<any>(null)
  const [showFoodConfirmation, setShowFoodConfirmation] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [showScanWarningModal, setShowScanWarningModal] = useState(false)
  const [isScanWarningChecked, setIsScanWarningChecked] = useState(false)

  const handleOpenScanDialog = () => {
    setIsScanWarningChecked(false)
    setShowScanWarningModal(true)
  }

  const handleProceedToScan = () => {
    setShowScanWarningModal(false)
    fileInputRef.current?.click()
  }



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



  // Prevent page scrolling when chatbot or doctor chat is open
  useEffect(() => {
    if (isChatOpen || isDoctorChatOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isChatOpen, isDoctorChatOpen])

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
  const isCalorieSurpassed = consumedCalories > targets.calories_kcal

  // Circular progress ring offset calculation (r=42, circumference=264)
  // ponytail: clamp progress to 100% and turn red if exceeded
  const calorieProgressRatio = Math.min(1, consumedCalories / (targets.calories_kcal || 1))
  const strokeDashoffset = 264 - (264 * calorieProgressRatio)

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
        const analysisData = await apiFetch('/api/food/analyze-photo', {
          body: formData
        })
        setScannedFoodData(analysisData)
        setShowFoodConfirmation(true)
      } catch (e: any) {
        console.error("Failed to analyze food photo", e)
        alert(e.message || "Failed to analyze food photo")
      } finally {
        setIsUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
  }

  const handleConfirmFoodLog = async () => {
    if (!scannedFoodData) return

    try {
      await apiFetch('/api/food/log', {
        json: scannedFoodData
      })

      setShowFoodConfirmation(false)
      setScannedFoodData(null)
      await fetchDashboardData()
    } catch (e: any) {
      console.error("Error logging food:", e)
      alert(e.message || "Error saving food log")
    }
  }

  const handleRejectFoodLog = () => {
    setShowFoodConfirmation(false)
    setScannedFoodData(null)
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



  return (
    <div className={`min-h-screen bg-background text-on-surface flex flex-col font-sans relative ${isChatOpen ? 'overflow-hidden' : ''}`}>
      {/* Hidden input for meal photo logging */}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {/* Warning Popup Modal for Food Scan */}
      {showScanWarningModal && (
        <div className="fixed inset-0 bg-black/50 z-[130] flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface-container-lowest text-on-surface rounded-3xl shadow-xl max-w-sm w-full p-6 border border-outline-variant/30 flex flex-col gap-5 relative">

            {/* Close button */}
            <button
              onClick={() => setShowScanWarningModal(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1.5 rounded-full hover:bg-outline-variant/30 transition-all cursor-pointer border-none bg-transparent"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Circle Info Icon */}
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Info className="h-6 w-6 stroke-[2.5]" />
            </div>

            {/* Heading */}
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-bold tracking-tight leading-tight text-on-surface">
                Ang NutriSync ay tumutulong, hindi nagdadoctor
              </h2>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Ang mga kalkulasyon ng pagkain dito ay <span className="font-bold text-on-surface">tinatayang halaga lamang</span> — hindi eksaktong sukat. Palaging sundin ang payo ng iyong doktor o dietitian.
              </p>
            </div>

            {/* Key List Points Card */}
            <div className="bg-surface-container rounded-2xl p-4 flex flex-col gap-3.5 border border-outline-variant/10">
              <div className="flex gap-3 items-center text-xs">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span className="text-on-surface-variant">Maganda para sa pag-track ng mga pagkain</span>
              </div>
              <div className="flex gap-3 items-center text-xs">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span className="text-on-surface-variant">Tumutulong na matupad ang limitasyon mula sa doktor</span>
              </div>
              <div className="flex gap-3 items-center text-xs">
                <X className="h-4 w-4 text-error shrink-0" />
                <span className="text-on-surface-variant">Hindi kapalit ng medikal na konsultasyon</span>
              </div>
            </div>

            {/* Checkbox */}
            <label className="flex items-center gap-3 cursor-pointer select-none py-1">
              <input
                type="checkbox"
                checked={isScanWarningChecked}
                onChange={(e) => setIsScanWarningChecked(e.target.checked)}
                className="w-4 h-4 rounded border-outline-variant bg-surface-container text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-xs text-on-surface font-medium">Naiintindihan ko ito</span>
            </label>

            {/* Action button */}
            <Button
              onClick={handleProceedToScan}
              disabled={!isScanWarningChecked}
              className="w-full bg-primary text-on-primary hover:bg-primary-container disabled:opacity-40 disabled:cursor-not-allowed h-12 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all border-none cursor-pointer"
            >
              <span>Sige, magsimula na</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Uploading loading overlay */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex flex-col items-center justify-center text-white gap-4 backdrop-blur-sm">
          <Loader2 className="h-12 w-12 animate-spin text-primary-fixed" />
          <p className="font-headline-sm">Analyzing meal photo with AI...</p>
        </div>
      )}

      {/* Food Confirmation Modal */}
      {showFoodConfirmation && scannedFoodData && (
        <div className="fixed inset-0 bg-black/50 z-[120] flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest rounded-2xl shadow-lg max-w-md w-full border border-outline-variant/30 p-6">
            <h2 className="text-lg font-bold text-on-surface mb-4">Confirm Food Log</h2>
            <div className="space-y-3 mb-6">
              <div className="p-4 bg-surface-container rounded-lg">
                <p className="text-lg font-bold text-on-surface">{scannedFoodData.name}</p>
                <p className="text-sm text-on-surface-variant">{scannedFoodData.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-surface-container rounded-lg">
                  <p className="text-xs text-on-surface-variant">Calories</p>
                  <p className="text-lg font-bold text-primary">{Math.round(scannedFoodData.calories_kcal)} kcal</p>
                </div>
                <div className="p-3 bg-surface-container rounded-lg">
                  <p className="text-xs text-on-surface-variant">Sodium</p>
                  <p className="text-lg font-bold text-primary">{Math.round(scannedFoodData.sodium_mg)} mg</p>
                </div>
                <div className="p-3 bg-surface-container rounded-lg">
                  <p className="text-xs text-on-surface-variant">Protein</p>
                  <p className="text-lg font-bold text-primary">{Math.round(scannedFoodData.protein_g)}g</p>
                </div>
                <div className="p-3 bg-surface-container rounded-lg">
                  <p className="text-xs text-on-surface-variant">Carbs</p>
                  <p className="text-lg font-bold text-primary">{Math.round(scannedFoodData.carbs_g)}g</p>
                </div>
                <div className="p-3 bg-surface-container rounded-lg">
                  <p className="text-xs text-on-surface-variant">Fat</p>
                  <p className="text-lg font-bold text-primary">{Math.round(scannedFoodData.fat_g)}g</p>
                </div>
                <div className="p-3 bg-surface-container rounded-lg">
                  <p className="text-xs text-on-surface-variant">Potassium</p>
                  <p className="text-lg font-bold text-primary">{Math.round(scannedFoodData.potassium_mg)}mg</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleRejectFoodLog}
                className="flex-1 bg-surface-container text-on-surface hover:bg-outline-variant rounded-xl py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmFoodLog}
                className="flex-1 bg-primary text-on-primary hover:bg-primary-container rounded-xl py-2"
              >
                Confirm & Log
              </Button>
            </div>
          </div>
        </div>
      )}

      <PatientNavbar activePage="dashboard" />

      {/* Main Content */}
      <ScrollArea className="flex-grow w-full">
        <main className="max-w-7xl mx-auto w-full px-6 py-8">

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

          {/* Notification Alert Tab */}
          {consumedSodium >= targets.sodium_mg * 0.9 && (
            <Alert variant="destructive" className="mb-8 shadow-sm">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="flex items-center gap-2 text-red-950">
                Pansin: Malapit o Lampas na sa Limitasyon ng Sodium!
              </AlertTitle>
              <AlertDescription className="mt-2 text-red-900 leading-relaxed">
                <p>
                  Ang iyong nakonsumong sodium ngayong araw ay umabot na sa <span className="font-bold">{Math.round(consumedSodium)} mg</span>, na nasa <span className="font-bold">{Math.round((consumedSodium / targets.sodium_mg) * 100)}%</span> ng iyong daily target limit (<span className="font-bold">{targets.sodium_mg} mg</span>).
                </p>
                <div className="mt-3 p-3 bg-white/70 border border-red-200/40 rounded-xl text-xs font-bold text-red-950">
                  Paalala mula sa iyong Doctor: Mangyaring iwasan muna ang pagkain ng maaalat (tulad ng toyo, patis, bagoong, de-lata, at instant noodles) sa natitirang bahagi ng araw na ito!
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Dashboard Grid */}
          <div className="flex flex-col gap-6">

            {/* Main Content Area (Calorie ring, Sodium alerts, Macronutrients, Recent meals) */}
            <div className="flex flex-col gap-6">

              {/* Bento-style Vitals Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Calorie Tracking Ring */}
                <div className="lg:col-span-1 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col items-center justify-center relative overflow-hidden h-full">
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
                        className={`${isCalorieSurpassed ? 'text-error' : 'text-primary'} stroke-current`}
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
                <div className="lg:col-span-2 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col justify-between h-full">
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
                  <div className={`p-7 rounded-xl flex gap-3 items-start border mb-7 ${isSodiumWarning
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

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column (span 2) */}
              <div className="lg:col-span-2 flex flex-col gap-6">

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
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${proteinPct}%`, backgroundColor: '#00B4AD' }}></div>
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
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${fatPct}%`, backgroundColor: '#ED8659' }}></div>
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
                    <Button onClick={handleOpenScanDialog} className="mt-2 rounded-full flex gap-2">
                      <Camera className="h-4 w-4" />
                      Log First Meal
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                      {logs.slice((currentPage - 1) * mealsPerPage, currentPage * mealsPerPage).map(log => (
                        <MealCard
                          key={log.id}
                          log={log}
                          isExpanded={expandedLogId === log.id}
                          onToggle={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                        />
                      ))}
                    </div>
                    {logs.length > mealsPerPage && (
                      <div className="flex items-center justify-between mt-4 border-t border-outline-variant/30 pt-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-on-surface-variant font-medium">
                          Page {currentPage} of {Math.ceil(logs.length / mealsPerPage)}
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(logs.length / mealsPerPage)))}
                          disabled={currentPage === Math.ceil(logs.length / mealsPerPage)}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
              </div>

              {/* Right Column (span 1) */}
              <div className="lg:col-span-1">
                {/* Clinical Reminders */}
                <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30 h-full">
                  <div className="flex items-center gap-2 mb-6">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-bold text-on-surface">Clinical Reminders</h3>
                  </div>

                  <div className="space-y-6">

                    {/* Losartan Medication Reminder */}
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 bg-primary-container text-on-primary-container rounded-xl flex items-center justify-center shrink-0">
                        <Pill className="h-5 w-5 text-white" />
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
                    {/* Blood Pressure Reminder */}
                    <div className="flex gap-4 items-start border-t border-outline-variant/30 pt-5">
                      <div className="w-10 h-10 bg-error-container text-error rounded-xl flex items-center justify-center shrink-0">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm font-bold text-on-surface">Log Blood Pressure</p>
                        <p className="text-xs text-on-surface-variant font-medium mt-0.5">Due: Today before bed</p>
                        <button
                          className="mt-3 text-xs font-semibold px-4 py-1.5 rounded-full border transition-all cursor-pointer bg-transparent border-error text-error hover:bg-error-container"
                        >
                          Log Now
                        </button>
                      </div>
                    </div>

                    {/* Weight Reminder */}
                    <div className="flex gap-4 items-start border-t border-outline-variant/30 pt-5">
                      <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                        <Info className="h-5 w-5" />
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm font-bold text-on-surface">Weekly Weigh-in</p>
                        <p className="text-xs text-on-surface-variant font-medium mt-0.5">Due: Tomorrow morning</p>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

            </div>

            </div>



          </div>

        </main>

        <Footer />
        <ScrollBar orientation="vertical" />
      </ScrollArea>

      {/* Floating Action Buttons (FABs) Stack */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        {/* Chat with Doctor FAB */}
        {doctorProfile && (
          <button
            onClick={handleOpenDoctorChat}
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all cursor-pointer border-none bg-secondary text-white relative"
            title="Chat with your Doctor"
          >
            <MessageSquare className="h-5 w-5" />
            {unreadDoctorMessagesCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-error text-white text-[10px] font-bold h-5 min-w-5 px-1 rounded-full flex items-center justify-center animate-pulse">
                {unreadDoctorMessagesCount}
              </span>
            )}
          </button>
        )}

        {/* AI Chatbot FAB */}
        <button
          onClick={() => setIsChatOpen(true)}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all cursor-pointer border-none bg-primary-container text-white"
          title="Chat with NutriGabay AI"
        >
          <Sparkles className="h-5 w-5" />
        </button>

        {/* Camera Meal Logger FAB */}
        <button
          id="cameraLogFAB"
          onClick={handleOpenScanDialog}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all cursor-pointer border-none bg-primary text-on-primary"
          title="Log a Meal with AI"
        >
          <Camera className="h-5 w-5" />
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
            <ScrollArea className="flex-grow bg-background w-full overflow-hidden">
              <div className="p-5 space-y-4 flex flex-col-reverse">
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
              <ScrollBar orientation="vertical" />
            </ScrollArea>

            {/* Disclaimer Warning */}
            <div className="px-5 py-3 border-t border-outline-variant/30 flex gap-3 items-center bg-surface-container text-[11px] text-on-surface-variant">
              <Info className="h-4.5 w-4.5 shrink-0" />
              <p className="leading-normal">
                Ang NutriGabay ay gabay lamang. Para sa medikal na desisyon, kumunsulta sa inyong doktor.
              </p>
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

      {/* Doctor Chat Side Drawer (Direct Chat) */}
      {isDoctorChatOpen && doctorProfile && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setIsDoctorChatOpen(false)}
            className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-md bg-surface h-full shadow-2xl flex flex-col z-10 transition-transform duration-300 animate-slide-in-right">

            {/* Header */}
            <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                  <MessageSquare className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-on-surface">{doctorProfile.full_name}</h3>
                  <p className="text-[10px] text-on-surface-variant font-medium">Your Direct Medical Monitoring Link</p>
                </div>
              </div>
              <button
                onClick={() => setIsDoctorChatOpen(false)}
                className="p-1.5 rounded-full hover:bg-outline-variant/30 transition-all text-on-surface-variant border-none cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Conversation Messages Box */}
            <ScrollArea className="flex-grow bg-background w-full overflow-hidden">
              <div className="p-5 space-y-4 flex flex-col">
                {isDoctorChatLoading ? (
                  <div className="py-20 text-center text-on-surface-variant text-sm flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-secondary" />
                    <span>Loading conversation history...</span>
                  </div>
                ) : doctorMessages.length === 0 ? (
                  <div className="py-20 text-center text-on-surface-variant text-xs flex flex-col items-center justify-center gap-3 px-6">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-on-surface">Direct Line Active</p>
                      <p className="mt-1 leading-relaxed">No messages yet. Send a message to start a secure direct chat with your supervising clinician.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {doctorMessages.map((msg, idx) => {
                      const isCurrentUser = msg.sender_id === user?.id
                      return (
                        <div
                          key={msg.id || idx}
                          className={`p-3.5 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-xs ${
                            isCurrentUser
                              ? 'bg-secondary text-white self-end rounded-tr-none'
                              : 'bg-surface-container-lowest text-on-surface self-start rounded-tl-none border border-outline-variant/15'
                          }`}
                        >
                          <p>{msg.message}</p>
                          <span className={`text-[9px] mt-1 block text-right font-medium opacity-60`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )
                    })}
                    <div ref={doctorMessagesEndRef} />
                  </div>
                )}
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>

            {/* HIPAA Compliance Disclaimer */}
            <div className="px-5 py-3 border-t border-outline-variant/30 flex gap-3 items-center bg-surface-container text-[10px] text-on-surface-variant">
              <Info className="h-4.5 w-4.5 shrink-0 text-secondary" />
              <p className="leading-normal font-medium">
                HIPAA & DPA 2012 Encrypted. This direct communication line is secure and monitored for clinical safety compliance.
              </p>
            </div>

            {/* Chat Input Area */}
            <div className="p-4 border-t border-outline-variant bg-surface-container-lowest flex gap-2">
              <Input
                type="text"
                placeholder="Type a secure message to your doctor..."
                className="flex-grow bg-background border-outline-variant"
                value={doctorChatInput}
                onChange={e => setDoctorChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendDoctorMessage()}
                disabled={isDoctorChatLoading}
              />
              <Button
                onClick={handleSendDoctorMessage}
                disabled={isDoctorChatLoading || !doctorChatInput.trim()}
                className="rounded-xl px-4 bg-secondary hover:bg-secondary/90 text-white border-none cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

          </div>
        </div>
      )}
      
      {/* Disclaimer Modal */}

    </div>
  )
}

export default PatientDashboard
