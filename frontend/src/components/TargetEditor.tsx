import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Settings, Save } from 'lucide-react'
import { apiFetch } from '../api/client'

interface DietaryTargets {
  id?: number
  patient_id: number
  clinician_id: number
  sodium_mg: number
  carbs_g: number
  calories_kcal: number
  potassium_mg: number
}

interface TargetEditorProps {
  patientId: number
  initialTargets: DietaryTargets | null
  onNotify: (type: 'success' | 'error', message: string) => void
}

const TargetEditor = ({ patientId, initialTargets, onNotify }: TargetEditorProps) => {
  const [targetSodium, setTargetSodium] = useState('2000')
  const [targetCarbs, setTargetCarbs] = useState('250')
  const [targetCalories, setTargetCalories] = useState('2000')
  const [targetPotassium, setTargetPotassium] = useState('0')
  const [isSavingTargets, setIsSavingTargets] = useState(false)

  useEffect(() => {
    if (initialTargets) {
      setTargetSodium(initialTargets.sodium_mg?.toString() || '2000')
      setTargetCarbs(initialTargets.carbs_g?.toString() || '250')
      setTargetCalories(initialTargets.calories_kcal?.toString() || '2000')
      setTargetPotassium(initialTargets.potassium_mg?.toString() || '0')
    }
  }, [initialTargets])

  const handleSaveTargets = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingTargets(true)
    try {
      const updatedTargets = await apiFetch(`/api/clinicians/patients/${patientId}/targets`, {
        method: 'PUT',
        json: {
          sodium_mg: parseFloat(targetSodium) || 2000,
          carbs_g: parseFloat(targetCarbs) || 250,
          calories_kcal: parseFloat(targetCalories) || 2000,
          potassium_mg: parseFloat(targetPotassium) || 0
        }
      })
      if (updatedTargets) {
        onNotify('success', 'Dietary targets updated successfully!')
      }
    } catch (err) {
      console.error("Error updating targets", err)
      onNotify('error', 'Failed to update targets. Please try again.')
    } finally {
      setIsSavingTargets(false)
    }
  }

  return (
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
  )
}

export default TargetEditor
