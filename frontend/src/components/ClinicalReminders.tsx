import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Plus, Edit2, Trash2, Clock } from "lucide-react";
import { apiFetch } from "../api/client";

interface ClinicalReminder {
  id: number;
  patient_id: number;
  clinician_id: number;
  reminder_type: "medication" | "hydration" | "meal" | "activity" | "custom";
  title: string;
  description: string;
  schedule: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ClinicalRemindersProps {
  patientId: number;
  onNotify: (type: "success" | "error", message: string) => void;
}

const REMINDER_TYPES = [
  { value: "medication", label: "Medication" },
  { value: "hydration", label: "Hydration" },
  { value: "meal", label: "Meal" },
  { value: "activity", label: "Activity" },
  { value: "custom", label: "Custom" },
] as const;

const REMINDER_ICONS: Record<string, string> = {
  medication: "💊",
  hydration: "💧",
  meal: "🍽",
  activity: "🏃",
  custom: "📋",
};

const ClinicalReminders = ({ patientId, onNotify }: ClinicalRemindersProps) => {
  const [reminders, setReminders] = useState<ClinicalReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    reminder_type: "custom" as string,
    title: "",
    description: "",
    schedule: "",
  });

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<ClinicalReminder[]>(
        `/api/clinicians/patients/${patientId}/reminders`,
      );
      if (data) setReminders(data);
    } catch (err) {
      console.error("Error fetching reminders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [patientId]);

  const resetForm = () => {
    setFormData({
      reminder_type: "custom",
      title: "",
      description: "",
      schedule: "",
    });
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      onNotify("error", "Title is required");
      return;
    }
    try {
      if (editingId) {
        await apiFetch(
          `/api/clinicians/patients/${patientId}/reminders/${editingId}`,
          {
            method: "PUT",
            json: formData,
          },
        );
        onNotify("success", "Reminder updated");
      } else {
        await apiFetch(`/api/clinicians/patients/${patientId}/reminders`, {
          method: "POST",
          json: formData,
        });
        onNotify("success", "Reminder created");
      }
      resetForm();
      fetchReminders();
    } catch (err: any) {
      onNotify("error", err.message || "Failed to save reminder");
    }
  };

  const handleEdit = (reminder: ClinicalReminder) => {
    setEditingId(reminder.id);
    setFormData({
      reminder_type: reminder.reminder_type,
      title: reminder.title,
      description: reminder.description,
      schedule: reminder.schedule,
    });
    setShowAddForm(true);
  };

  const handleDeactivate = async (id: number) => {
    try {
      await apiFetch(`/api/clinicians/patients/${patientId}/reminders/${id}`, {
        method: "DELETE",
      });
      onNotify("success", "Reminder deactivated");
      fetchReminders();
    } catch (err: any) {
      onNotify("error", err.message || "Failed to deactivate");
    }
  };

  return (
    <div className="bg-white border border-outline-variant p-6 rounded-2xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
          <Clock className="h-5 w-5 text-secondary" />
          Clinical Reminders
        </h3>
        {!showAddForm && (
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingId(null);
              setFormData({
                reminder_type: "custom",
                title: "",
                description: "",
                schedule: "",
              });
            }}
            className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer bg-transparent border-none px-2 py-1"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="mb-4 p-4 bg-surface-container rounded-xl border border-outline-variant/30 space-y-3">
          <div className="flex gap-2">
            <select
              value={formData.reminder_type}
              onChange={(e) =>
                setFormData((f) => ({ ...f, reminder_type: e.target.value }))
              }
              className="flex-1 h-8 px-2 rounded border border-outline-variant bg-white text-sm"
            >
              {REMINDER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <Input
              placeholder="Title"
              value={formData.title}
              onChange={(e) =>
                setFormData((f) => ({ ...f, title: e.target.value }))
              }
              className="flex-1 h-8 text-sm"
            />
          </div>
          <Input
            placeholder="Description (optional)"
            value={formData.description}
            onChange={(e) =>
              setFormData((f) => ({ ...f, description: e.target.value }))
            }
            className="h-8 text-sm"
          />
          <Input
            placeholder="Schedule (e.g., '8:00 PM daily')"
            value={formData.schedule}
            onChange={(e) =>
              setFormData((f) => ({ ...f, schedule: e.target.value }))
            }
            className="h-8 text-sm"
          />
          <div className="flex gap-2">
            <Button onClick={handleSave} className="h-8 text-xs px-4">
              {editingId ? "Update" : "Create"}
            </Button>
            <Button
              onClick={resetForm}
              variant="ghost"
              className="h-8 text-xs px-4"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Reminders List */}
      {loading ? (
        <p className="text-xs text-on-surface-variant">Loading...</p>
      ) : reminders.length === 0 ? (
        <p className="text-xs text-on-surface-variant">No reminders yet.</p>
      ) : (
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className={`p-3 rounded-xl border ${reminder.is_active ? "bg-surface-container-low" : "bg-surface-container-low/50 opacity-60"} border-outline-variant/20`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-grow min-w-0">
                  <span className="text-sm shrink-0">
                    {REMINDER_ICONS[reminder.reminder_type] || "📋"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">
                      {reminder.title}
                    </p>
                    {reminder.description && (
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {reminder.description}
                      </p>
                    )}
                    {reminder.schedule && (
                      <p className="text-[10px] text-outline mt-1">
                        ⏰ {reminder.schedule}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleEdit(reminder)}
                    className="p-1 text-on-surface-variant hover:text-primary cursor-pointer bg-transparent border-none"
                    title="Edit"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeactivate(reminder.id)}
                    className="p-1 text-on-surface-variant hover:text-error cursor-pointer bg-transparent border-none"
                    title="Deactivate"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClinicalReminders;
