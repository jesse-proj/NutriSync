import { useState } from 'react'
import { Card } from './ui/card'

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

interface MealCardProps {
  log: FoodLog
  isExpanded: boolean
  onToggle: () => void
  apiUrl?: string
}

const MealCard = ({ log, isExpanded, onToggle, apiUrl }: MealCardProps) => {
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
            src={log.image_url && apiUrl ? `${apiUrl}${log.image_url}` : getMealImage(log.description)}
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

export default MealCard
