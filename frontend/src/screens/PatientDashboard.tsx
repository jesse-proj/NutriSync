import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../api/client'
import logoBrand from '../assets/logo_brand.png'
import { Activity, User as UserIcon, LogOut, Heart, Calendar, Plus, Bot, Send, Camera, Loader2 } from 'lucide-react'
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
  logged_at: string;
}

interface Message {
  text: string;
  isUser: boolean;
}

const PatientDashboard = () => {
  const { user, logout } = useAuth()
  
  const [targets, setTargets] = useState<Targets>({ sodium_mg: 2000, carbs_g: 250, calories_kcal: 2000, potassium_mg: 0 })
  const [logs, setLogs] = useState<FoodLog[]>([])
  
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { text: `Magandang araw, Mang ${user?.full_name?.split(' ')[0] || ''}! Ako si NutriGabay. Pwede mo akong tanungin tungkol sa iyong nutrisyon o pagkaing Pinoy.`, isUser: false }
  ])
  const [chatInput, setChatInput] = useState("")
  const [isChatLoading, setIsChatLoading] = useState(false)
  
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchDashboardData = async () => {
    try {
      const [fetchedTargets, fetchedLogs] = await Promise.all([
        apiFetch('/api/patients/targets'),
        apiFetch('/api/patients/logs?limit=10')
      ])
      if(fetchedTargets) setTargets(fetchedTargets)
      if(fetchedLogs) setLogs(fetchedLogs)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Calculate consumed
  const consumedSodium = logs.reduce((sum, log) => sum + log.sodium_mg, 0)
  const consumedCarbs = logs.reduce((sum, log) => sum + log.carbs_g, 0)
  const consumedCalories = logs.reduce((sum, log) => sum + log.calories_kcal, 0)

  const handleSendMessage = async () => {
    if(!chatInput.trim()) return
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
        if(response.ok) {
           await fetchDashboardData()
        } else {
           alert("Failed to analyze image.")
        }
      } catch (e) {
        console.error(e)
        alert("Error uploading image")
      } finally {
        setIsUploading(false)
        if(fileInputRef.current) fileInputRef.current.value = ''
      }
    }
  }

  // Calculate percentages
  const sodiumPct = Math.min(100, (consumedSodium / (targets.sodium_mg || 1)) * 100)
  const carbsPct = Math.min(100, (consumedCarbs / (targets.carbs_g || 1)) * 100)
  const calPct = Math.min(100, (consumedCalories / (targets.calories_kcal || 1)) * 100)

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-outline-variant px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center font-bold text-primary text-xl">
             <Heart className="h-6 w-6 mr-2" /> NutriSync
          </div>
          <div className="h-6 w-px bg-outline-variant hidden sm:block"></div>
          <span className="font-headline-sm text-headline-sm text-primary hidden sm:inline-block">Patient Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container rounded-lg">
            <UserIcon className="h-4 w-4 text-primary" />
            <span className="font-label-md text-label-md text-on-surface font-semibold">{user?.full_name}</span>
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
        {/* Welcome & Overview Column */}
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-r from-primary to-primary-container text-white p-8 rounded-2xl shadow-sm space-y-4">
            <h1 className="font-headline-md text-headline-md">Kumusta, {user?.full_name?.split(' ')[0]}!</h1>
            <p className="font-body-md text-white/90">
              Welcome back to your NutriSync health dashboard. Here is your nutritional summary for today. Let's keep working towards your recovery!
            </p>
          </div>

          {/* Vitals Summary Card */}
          <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm">
            <h3 className="font-headline-sm text-headline-sm mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" /> Daily Nutritional Allowance
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Sodium Card */}
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-2">
                <span className="font-label-sm text-label-sm text-orange-800 font-bold block">SODIUM LIMIT</span>
                <span className="font-headline-md text-headline-md text-orange-950 font-bold">{Math.round(consumedSodium)} / {targets.sodium_mg} mg</span>
                <div className="w-full bg-orange-200/50 rounded-full h-2">
                  <div className={`h-2 rounded-full ${sodiumPct > 90 ? 'bg-red-600' : 'bg-orange-600'}`} style={{ width: `${sodiumPct}%` }}></div>
                </div>
                <span className="font-label-sm text-label-sm text-orange-700 block">{Math.max(0, targets.sodium_mg - consumedSodium)} mg remaining today</span>
              </div>

              {/* Carbohydrates Card */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                <span className="font-label-sm text-label-sm text-blue-800 font-bold block">CARBOHYDRATES</span>
                <span className="font-headline-md text-headline-md text-blue-950 font-bold">{Math.round(consumedCarbs)} / {targets.carbs_g} g</span>
                <div className="w-full bg-blue-200/50 rounded-full h-2">
                  <div className={`h-2 rounded-full ${carbsPct > 90 ? 'bg-red-600' : 'bg-primary'}`} style={{ width: `${carbsPct}%` }}></div>
                </div>
                <span className="font-label-sm text-label-sm text-primary block">{Math.max(0, targets.carbs_g - consumedCarbs)} g remaining today</span>
              </div>

              {/* Calories Card */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl space-y-2">
                <span className="font-label-sm text-label-sm text-green-800 font-bold block">CALORIE CEILING</span>
                <span className="font-headline-md text-headline-md text-green-950 font-bold">{Math.round(consumedCalories)} / {targets.calories_kcal} kcal</span>
                <div className="w-full bg-green-200/50 rounded-full h-2">
                  <div className={`h-2 rounded-full ${calPct > 90 ? 'bg-red-600' : 'bg-green-600'}`} style={{ width: `${calPct}%` }}></div>
                </div>
                <span className="font-label-sm text-label-sm text-green-700 block">{Math.max(0, targets.calories_kcal - consumedCalories)} kcal remaining today</span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Recent Logs */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="font-headline-sm text-headline-sm flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" /> Recent Meals
                </h3>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="flex items-center gap-2 rounded-full">
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  Log Photo
                </Button>
             </div>
             
             {logs.length === 0 ? (
                <div className="p-6 bg-surface-container rounded-xl text-center text-on-surface-variant text-sm">
                   No meals logged yet. Click "Log Photo" to analyze your food.
                </div>
             ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {logs.map(log => (
                    <div key={log.id} className="p-4 bg-white border border-outline-variant rounded-xl shadow-sm flex items-start gap-4">
                       <div className="flex-1">
                         <h4 className="font-semibold text-on-surface">{log.description}</h4>
                         <p className="text-xs text-on-surface-variant mt-1">Sodium: {log.sodium_mg}mg | Carbs: {log.carbs_g}g</p>
                         <p className="text-xs text-on-surface-variant">{log.calories_kcal} kcal</p>
                       </div>
                    </div>
                  ))}
                </div>
             )}
          </div>
        </section>

        {/* Sidebar / Chatbot Column */}
        <section className="space-y-6">
          <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm h-full flex flex-col min-h-[500px]">
            <h3 className="font-headline-sm text-headline-sm mb-4 flex items-center gap-2 text-primary">
              <Bot className="h-5 w-5 text-primary" /> NutriGabay AI
            </h3>
            
            {/* Conversation messages */}
            <div className="flex-grow space-y-4 overflow-y-auto mb-4 max-h-[400px] text-sm pr-2">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`p-3 rounded-lg max-w-[85%] ${msg.isUser ? 'bg-primary/10 text-on-surface self-end ml-auto' : 'bg-surface-container text-on-surface-variant'}`}>
                  {msg.text}
                </div>
              ))}
              {isChatLoading && (
                <div className="bg-surface-container p-3 rounded-lg text-on-surface-variant max-w-[85%]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
            </div>

            {/* Input field */}
            <div className="mt-auto pt-4 border-t border-outline-variant flex gap-2">
              <Input 
                type="text" 
                placeholder="Magtanong kay NutriGabay..." 
                className="flex-grow"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                disabled={isChatLoading}
              />
              <Button onClick={handleSendMessage} disabled={isChatLoading || !chatInput.trim()}>
                 <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default PatientDashboard
