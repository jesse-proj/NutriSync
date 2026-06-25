import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Plus,
  Edit2,
  Trash2,
  Clock,
  Pill,
  Droplet,
  Utensils,
  Activity,
  ClipboardList,
} from "lucide-react";
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

const REMINDER_CONFIG: Record<
  string,
  { icon: React.ComponentType<any>; bgClass: string; iconClass: string }
> = {
  medication: {
    icon: Pill,
    bgClass: "bg-rose-50 dark:bg-rose-950/30 border-rose-200/50 dark:border-rose-900/30",
    iconClass: "text-rose-600 dark:text-rose-400",
  },
  hydration: {
    icon: Droplet,
    bgClass: "bg-blue-50 dark:bg-blue-950/30 border-blue-200/50 dark:border-blue-900/30",
    iconClass: "text-blue-600 dark:text-blue-400",
  },
  meal: {
    icon: Utensils,
    bgClass: "bg-amber-50 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-900/30",
    iconClass: "text-amber-600 dark:text-amber-400",
  },
  activity: {
    icon: Activity,
    bgClass: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-900/30",
    iconClass: "text-emerald-600 dark:text-emerald-400",
  },
  custom: {
    icon: ClipboardList,
    bgClass: "bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200/50 dark:border-zinc-800/30",
    iconClass: "text-zinc-600 dark:text-zinc-400",
  },
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
    <Card className="border border-outline-variant/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-bold text-on-surface flex items-center gap-2">
          <Clock className="h-5 w-5 text-secondary" />
          Clinical Reminders
        </CardTitle>
        {!showAddForm && (
          <Button
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
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer bg-transparent border-none px-2 py-1 h-8"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="mb-4 p-4 bg-surface-container rounded-xl border border-outline-variant/30 space-y-3">
            <div className="flex gap-2">
              <select
                value={formData.reminder_type}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, reminder_type: e.target.value }))
                }
                className="flex-1 h-8 px-2 rounded border border-outline-variant bg-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
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
            {reminders.map((reminder) => {
              const config =
                REMINDER_CONFIG[reminder.reminder_type] ||
                REMINDER_CONFIG.custom;
              const Icon = config.icon;
              return (
                <div
                  key={reminder.id}
                  className={`p-3 rounded-xl border ${reminder.is_active ? "bg-surface-container-low" : "bg-surface-container-low/50 opacity-60"} border-outline-variant/20`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-grow min-w-0">
                      <div
                        className={`p-2 rounded-lg border ${config.bgClass} flex items-center justify-center shrink-0`}
                      >
                        <Icon className={`h-4 w-4 ${config.iconClass}`} />
                      </div>
                      <div className="min-w-0 flex-grow">
                        <p className="text-sm font-semibold text-on-surface truncate">
                          {reminder.title}
                        </p>
                        {reminder.description && (
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            {reminder.description}
                          </p>
                        )}
                        {reminder.schedule && (
                          <p className="text-[10px] text-outline mt-1.5 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {reminder.schedule}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        onClick={() => handleEdit(reminder)}
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-on-surface-variant hover:text-primary hover:bg-surface-container-high"
                        title="Edit"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        onClick={() => handleDeactivate(reminder.id)}
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-on-surface-variant hover:text-error hover:bg-surface-container-high"
                        title="Deactivate"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClinicalReminders;
