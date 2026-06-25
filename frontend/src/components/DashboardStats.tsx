import { AlertTriangle, CheckCircle, Utensils, Info } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from './ui/alert'

interface FoodLog {
  id: number
  name: string
  description: string
  sodium_mg: number
  carbs_g: number
  calories_kcal: number
  potassium_mg?: number
  protein_g?: number
  fat_g?: number
  image_url?: string
  logged_at: string
}

interface Targets {
  sodium_mg: number
  carbs_g: number
  calories_kcal: number
  potassium_mg: number
}

interface DashboardStatsProps {
  logs: FoodLog[]
  targets: Targets
}

const DashboardStats = ({ logs, targets }: DashboardStatsProps) => {
  const consumedCalories = logs.reduce((sum, log) => sum + log.calories_kcal, 0)
  const consumedSodium = logs.reduce((sum, log) => sum + log.sodium_mg, 0)
  const consumedCarbs = logs.reduce((sum, log) => sum + log.carbs_g, 0)
  const consumedProtein = logs.reduce((sum, log) => sum + (log.protein_g || 0), 0)
  const consumedFat = logs.reduce((sum, log) => sum + (log.fat_g || 0), 0)

  const targetProtein = Math.round((targets.calories_kcal * 0.20) / 4) || 120
  const targetFat = Math.round((targets.calories_kcal * 0.30) / 9) || 70

  const carbsPct = Math.min(100, (consumedCarbs / (targets.carbs_g || 1)) * 100)
  const proteinPct = Math.min(100, (consumedProtein / (targetProtein || 1)) * 100)
  const fatPct = Math.min(100, (consumedFat / (targetFat || 1)) * 100)

  const caloriesLeft = Math.max(0, targets.calories_kcal - consumedCalories)
  const isCalorieSurpassed = consumedCalories > targets.calories_kcal

  const calorieProgressRatio = Math.min(1, consumedCalories / (targets.calories_kcal || 1))
  const strokeDashoffset = 264 - (264 * calorieProgressRatio)

  const isSodiumWarning = consumedSodium > targets.sodium_mg * 0.6
  const highSodiumMeal = logs.find(log => log.sodium_mg > 400)
  const sodiumAlertMessage = highSodiumMeal
    ? `Your recent meal (${highSodiumMeal.description}) was high in sodium. Try drinking extra water this afternoon.`
    : "Your meals logged today are within healthy sodium thresholds. Excellent choice!";

  return (
    <>
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
      <div className="grid grid-cols-12 gap-6">
        {/* Main Content Area */}
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
                  <circle
                    className="text-surface-container stroke-current"
                    cx="50" cy="50" fill="transparent" r="42" strokeWidth="8"
                  />
                  <circle
                    className={`${isCalorieSurpassed ? 'text-error' : 'text-primary'} stroke-current`}
                    cx="50" cy="50" fill="transparent" r="42" strokeLinecap="round" strokeWidth="8"
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
                  <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Sodium Intake</h3>
                  <p className={`text-2xl font-bold mt-1 ${isSodiumWarning ? 'text-error' : 'text-primary'}`}>
                    {(consumedSodium / 1000).toFixed(2)}g{' '}
                    <span className="text-sm font-normal text-on-surface-variant">/ {(targets.sodium_mg / 1000).toFixed(1)}g</span>
                  </p>
                </div>
                <span className={`p-2 rounded-xl flex items-center justify-center ${isSodiumWarning ? 'bg-error-container text-error' : 'bg-surface-container text-primary'}`}>
                  {isSodiumWarning ? <AlertTriangle className="h-5 w-5 animate-pulse" /> : <CheckCircle className="h-5 w-5" />}
                </span>
              </div>
              <div className={`p-7 rounded-xl flex gap-3 items-start border mb-7 ${isSodiumWarning
                ? 'bg-error-container text-on-error-container border-error/10'
                : 'bg-surface-container text-on-surface border-outline-variant/20'
                }`}>
                <Info className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <p className="text-xs font-semibold">{isSodiumWarning ? 'Sodium Intake Alert' : 'Sodium Compliance'}</p>
                  <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{sodiumAlertMessage}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Macronutrient Progress */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30">
            <h3 className="text-lg font-bold text-on-surface mb-6">Macronutrient Progress</h3>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between mb-1.5 text-sm">
                  <span className="font-semibold text-on-surface">Protein</span>
                  <span className="text-on-surface-variant">{Math.round(consumedProtein)}g / {targetProtein}g</span>
                </div>
                <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${proteinPct}%`, backgroundColor: '#00B4AD' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1.5 text-sm">
                  <span className="font-semibold text-on-surface">Carbohydrates</span>
                  <span className="text-on-surface-variant">{Math.round(consumedCarbs)}g / {targets.carbs_g}g</span>
                </div>
                <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${carbsPct}%` }}></div>
                </div>
              </div>
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
        </div>
      </div>
    </>
  )
}

export default DashboardStats
