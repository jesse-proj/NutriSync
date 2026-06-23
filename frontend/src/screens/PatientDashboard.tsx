
import { useAuth } from '../context/AuthContext'
import logoBrand from '../assets/logo_brand.png'
import { Activity, User as UserIcon, LogOut, Heart, Calendar, Plus, Bot } from 'lucide-react'

const PatientDashboard = () => {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-outline-variant px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logoBrand} alt="NutriSync Logo" className="h-10 w-auto" />
          <div className="h-6 w-px bg-outline-variant hidden sm:block"></div>
          <span className="font-headline-sm text-headline-sm text-primary hidden sm:inline-block">Patient Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container rounded-lg">
            <UserIcon className="h-4 w-4 text-primary" />
            <span className="font-label-md text-label-md text-on-surface font-semibold">{user?.full_name}</span>
          </div>
          <button 
            onClick={logout} 
            className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title="Log Out"
          >
            <LogOut className="h-4 w-4" />
            <span className="font-label-sm text-label-sm hidden sm:inline">Log out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Welcome & Overview Column */}
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-r from-primary to-primary-container text-white p-8 rounded-2xl shadow-sm space-y-4">
            <h1 className="font-headline-md text-headline-md">Kumusta, {user?.full_name}!</h1>
            <p className="font-body-md text-white/90">
              Welcome back to your NutriSync health dashboard. Here is your nutritional summary for today. Let's keep working towards your recovery!
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold">
                <Heart className="h-3.5 w-3.5" /> Stage II Hypertension
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold">
                <Calendar className="h-3.5 w-3.5" /> Day 12 Post-Discharge
              </span>
            </div>
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
                <span className="font-headline-md text-headline-md text-orange-950 font-bold">1,250 / 2,000 mg</span>
                <div className="w-full bg-orange-200/50 rounded-full h-2">
                  <div className="bg-orange-600 h-2 rounded-full" style={{ width: '62.5%' }}></div>
                </div>
                <span className="font-label-sm text-label-sm text-orange-700 block">750 mg remaining today</span>
              </div>

              {/* Carbohydrates Card */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                <span className="font-label-sm text-label-sm text-blue-800 font-bold block">CARBOHYDRATES</span>
                <span className="font-headline-md text-headline-md text-blue-950 font-bold">110 / 180 g</span>
                <div className="w-full bg-blue-200/50 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '61.1%' }}></div>
                </div>
                <span className="font-label-sm text-label-sm text-primary block">70 g remaining today</span>
              </div>

              {/* Calories Card */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl space-y-2">
                <span className="font-label-sm text-label-sm text-green-800 font-bold block">CALORIE CEILING</span>
                <span className="font-headline-md text-headline-md text-green-950 font-bold">1,420 / 2,200 kcal</span>
                <div className="w-full bg-green-200/50 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '64.5%' }}></div>
                </div>
                <span className="font-label-sm text-label-sm text-green-700 block">780 kcal remaining today</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 p-6 bg-white border border-outline-variant hover:border-primary rounded-xl shadow-sm text-primary font-bold text-center cursor-pointer transition-colors group">
              <Plus className="h-5 w-5 group-hover:scale-110 transition-transform" /> Log a Meal Photo
            </button>
            <button className="flex items-center justify-center gap-2 p-6 bg-white border border-outline-variant hover:border-primary rounded-xl shadow-sm text-primary font-bold text-center cursor-pointer transition-colors group">
              <Calendar className="h-5 w-5 group-hover:scale-110 transition-transform" /> View Meal History
            </button>
          </div>
        </section>

        {/* Sidebar / Chatbot Column */}
        <section className="space-y-6">
          <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm h-full flex flex-col min-h-[450px]">
            <h3 className="font-headline-sm text-headline-sm mb-4 flex items-center gap-2 text-primary">
              <Bot className="h-5 w-5 text-primary" /> NutriGabay AI
            </h3>
            
            {/* Conversation messages */}
            <div className="flex-grow space-y-4 overflow-y-auto mb-4 max-h-[300px] text-sm">
              <div className="bg-surface-container p-3 rounded-lg text-on-surface-variant max-w-[85%]">
                Magandang araw, Mang {user?.full_name?.split(' ')[0]}! Ako si NutriGabay. Pwede mo akong tanungin tungkol sa iyong nutrisyon o pagkaing Pinoy. Ano ang makakatulong sa iyo ngayon?
              </div>
              <div className="bg-primary/10 p-3 rounded-lg text-on-surface max-w-[85%] self-end ml-auto">
                Pwede ba ako kumain ng tuyo ngayon?
              </div>
              <div className="bg-surface-container p-3 rounded-lg text-on-surface-variant max-w-[85%]">
                Mang {user?.full_name?.split(' ')[0]}, mas mabuting iwasan muna ang tuyo. Ito ay may mataas na sodium (~1,500mg bawat piraso). Naka-1,250mg na kayo ng sodium ngayon. Kung kakain kayo, lalagpas kayo sa inyong 2,000mg daily limit.
              </div>
            </div>

            {/* Input field */}
            <div className="mt-auto pt-4 border-t border-outline-variant flex gap-2">
              <input 
                type="text" 
                placeholder="Magtanong kay NutriGabay..." 
                className="flex-grow px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
              <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer">Tampok</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default PatientDashboard
