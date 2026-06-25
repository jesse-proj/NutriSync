import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch, API_URL } from "../api/client";
import {
  Calendar,
  Camera,
  Loader2,
  Sparkles,
  MessageSquare,
  X,
  Send,
  CheckCircle,
  ArrowRight,
  AlertTriangle,
  Utensils,
  Info,
  Check,
  Pill,
  Droplet,
  Activity,
  ClipboardList,
  Clock,
} from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ScrollArea, ScrollBar } from "../components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import PatientNavbar from "../components/PatientNavbar";
import Footer from "@/components/Footer";
import MealCard from "../components/MealCard";
import { useDoctorChat } from "../hooks/useDoctorChat";

interface ClinicalReminder {
  id: number;
  reminder_type: string;
  title: string;
  description: string;
  schedule: string;
  is_active: boolean;
}

const REMINDER_CONFIG: Record<
  string,
  { icon: React.ComponentType<any>; bgClass: string; iconClass: string }
> = {
  medication: {
    icon: Pill,
    bgClass:
      "bg-rose-50 dark:bg-rose-950/30 border-rose-200/50 dark:border-rose-900/30",
    iconClass: "text-rose-600 dark:text-rose-400",
  },
  hydration: {
    icon: Droplet,
    bgClass:
      "bg-blue-50 dark:bg-blue-950/30 border-blue-200/50 dark:border-blue-900/30",
    iconClass: "text-blue-600 dark:text-blue-400",
  },
  meal: {
    icon: Utensils,
    bgClass:
      "bg-amber-50 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-900/30",
    iconClass: "text-amber-600 dark:text-amber-400",
  },
  activity: {
    icon: Activity,
    bgClass:
      "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-900/30",
    iconClass: "text-emerald-600 dark:text-emerald-400",
  },
  custom: {
    icon: ClipboardList,
    bgClass:
      "bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200/50 dark:border-zinc-800/30",
    iconClass: "text-zinc-600 dark:text-zinc-400",
  },
};

interface Targets {
  sodium_mg: number;
  carbs_g: number;
  calories_kcal: number;
  potassium_mg: number;
  protein_g?: number;
  fat_g?: number;
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

const PatientDashboard = () => {
  const { user } = useAuth();

  // State for dashboard metrics
  const [targets, setTargets] = useState<Targets>({
    sodium_mg: 2000,
    carbs_g: 250,
    calories_kcal: 2000,
    potassium_mg: 0,
    protein_g: 120,
    fat_g: 70,
  });
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const mealsPerPage = 4;

  // Chatbot state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Doctor chat hook
  const doctorChat = useDoctorChat(user?.id);

  // File upload state
  const [isUploading, setIsUploading] = useState(false);
  const [scannedFoodData, setScannedFoodData] = useState<any>(null);
  const [showFoodConfirmation, setShowFoodConfirmation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showScanWarningModal, setShowScanWarningModal] = useState(false);
  const [isScanWarningChecked, setIsScanWarningChecked] = useState(false);

  // Clinical reminders (from API)
  const [reminders, setReminders] = useState<ClinicalReminder[]>([]);
  useEffect(() => {
    const fetchReminders = async () => {
      try {
        const data = await apiFetch<ClinicalReminder[]>(
          "/api/patients/reminders",
        );
        if (data) setReminders(data.filter((r) => r.is_active));
      } catch (err) {
        console.error("Error fetching reminders:", err);
      }
    };
    fetchReminders();
  }, []);

  // Filter logs to only today's local-date entries (ponytail: local midnight boundary)
  const localMidnight = new Date();
  localMidnight.setHours(0, 0, 0, 0);
  const todayLogs = logs.filter(
    (log) => new Date(log.logged_at) >= localMidnight,
  );

  // Friendly date label e.g. "Today, Jun 25"
  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: undefined,
    month: "short",
    day: "numeric",
  });

  // Day-end summary: show after 23:00 local time
  const nowHour = new Date().getHours();
  const showDayEndSummary = nowHour >= 23;

  const consumedCalories = todayLogs.reduce(
    (sum, log) => sum + log.calories_kcal,
    0,
  );
  const consumedSodium = todayLogs.reduce((sum, log) => sum + log.sodium_mg, 0);
  const consumedCarbs = todayLogs.reduce((sum, log) => sum + log.carbs_g, 0);
  const consumedProtein = todayLogs.reduce(
    (sum, log) => sum + (log.protein_g || 0),
    0,
  );
  const consumedFat = todayLogs.reduce((sum, log) => sum + (log.fat_g || 0), 0);

  const targetProtein =
    targets.protein_g || Math.round((targets.calories_kcal * 0.2) / 4) || 120;
  const targetFat =
    targets.fat_g || Math.round((targets.calories_kcal * 0.3) / 9) || 70;

  const carbsPct = Math.min(
    100,
    (consumedCarbs / (targets.carbs_g || 1)) * 100,
  );
  const proteinPct = Math.min(
    100,
    (consumedProtein / (targetProtein || 1)) * 100,
  );
  const fatPct = Math.min(100, (consumedFat / (targetFat || 1)) * 100);

  const caloriesLeft = Math.max(0, targets.calories_kcal - consumedCalories);
  const isCalorieSurpassed = consumedCalories > targets.calories_kcal;

  const calorieProgressRatio = Math.min(
    1,
    consumedCalories / (targets.calories_kcal || 1),
  );
  const strokeDashoffset = 264 - 264 * calorieProgressRatio;

  const isSodiumWarning = consumedSodium > targets.sodium_mg * 0.6;
  const highSodiumMeal = todayLogs.find((log) => log.sodium_mg > 400);
  const sodiumAlertMessage = highSodiumMeal
    ? `Your recent meal (${highSodiumMeal.description}) was high in sodium. Try drinking extra water this afternoon.`
    : "Your meals logged today are within healthy sodium thresholds. Excellent choice!";

  // Fetch metrics and logs
  const fetchDashboardData = async () => {
    try {
      const [fetchedTargets, fetchedLogs] = await Promise.all([
        apiFetch("/api/patients/targets"),
        apiFetch("/api/patients/logs?limit=50"),
      ]);
      if (fetchedTargets) {
        // ponytail: never let null targets wipe out the UI defaults
        const d = {
          sodium_mg: 2000,
          carbs_g: 250,
          calories_kcal: 2000,
          potassium_mg: 3500,
          protein_g: 120,
          fat_g: 70,
        };
        const merged = { ...d };
        for (const key of Object.keys(d) as (keyof typeof d)[]) {
          const v = fetchedTargets[key];
          if (v != null) merged[key] = v;
        }
        setTargets(merged);
      }
      if (fetchedLogs) setLogs(fetchedLogs);
    } catch (e) {
      console.error("Error fetching dashboard data:", e);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Initialize chatbot welcome message
  useEffect(() => {
    if (user) {
      setChatMessages([
        {
          text: `Magandang araw, Mang ${user.full_name?.split(" ")[0] || ""}! Ako si NutriGabay. Pwede mo akong tanungin tungkol sa iyong nutrisyon o pagkaing Pinoy.`,
          isUser: false,
        },
      ]);
    }
  }, [user]);

  // Prevent scrolling when chat is open
  useEffect(() => {
    if (isChatOpen || doctorChat.isChatOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isChatOpen, doctorChat.isChatOpen]);

  // Handlers
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const newMsg = chatInput.trim();
    setChatMessages((prev) => [...prev, { text: newMsg, isUser: true }]);
    setChatInput("");
    setIsChatLoading(true);
    try {
      const response = await apiFetch("/api/chat/", {
        json: { message: newMsg },
      });
      setChatMessages((prev) => [
        ...prev,
        { text: response.reply, isUser: false },
      ]);
    } catch (e) {
      setChatMessages((prev) => [
        ...prev,
        { text: "Pasensya na, may error sa connection.", isUser: false },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      try {
        const analysisData = await apiFetch("/api/food/analyze-photo", {
          body: formData,
        });
        setScannedFoodData(analysisData);
        setShowFoodConfirmation(true);
      } catch (e: any) {
        console.error("Failed to analyze food photo", e);
        alert(e.message || "Failed to analyze food photo");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  };

  const handleConfirmFoodLog = async () => {
    if (!scannedFoodData) return;
    try {
      await apiFetch("/api/food/log", { json: scannedFoodData });
      setShowFoodConfirmation(false);
      setScannedFoodData(null);
      await fetchDashboardData();
    } catch (e: any) {
      console.error("Error logging food:", e);
      alert(e.message || "Error saving food log");
    }
  };

  const handleRejectFoodLog = () => {
    setShowFoodConfirmation(false);
    setScannedFoodData(null);
  };

  const handleOpenScanDialog = () => {
    setIsScanWarningChecked(false);
    setShowScanWarningModal(true);
  };

  const handleProceedToScan = () => {
    setShowScanWarningModal(false);
    fileInputRef.current?.click();
  };

  const handleOpenDoctorChat = () => {
    if (!doctorChat.doctorProfile) {
      alert("No clinician is currently assigned to monitor your profile.");
      return;
    }
    doctorChat.setIsChatOpen(true);
    doctorChat.fetchChatHistory(doctorChat.doctorProfile.id);
  };

  const handleSendDoctorMessage = () => {
    if (!doctorChat.doctorChatInput.trim() || !doctorChat.doctorProfile) return;
    const sent = doctorChat.sendMessage(doctorChat.doctorChatInput);
    if (sent) {
      // Message will arrive via WebSocket
    } else {
      alert(
        "Chat connection is currently reconnecting. Please try sending again in a moment.",
      );
    }
  };

  return (
    <div
      className={`min-h-screen bg-background text-on-surface flex flex-col font-sans relative ${isChatOpen ? "overflow-hidden" : ""}`}
    >
      {/* Hidden input for meal photo logging */}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {/* Warning Popup Modal */}
      {showScanWarningModal && (
        <div className="fixed inset-0 bg-black/50 z-[130] flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface-container-lowest text-on-surface rounded-3xl shadow-xl max-w-sm w-full p-6 border border-outline-variant/30 flex flex-col gap-5 relative">
            <button
              onClick={() => setShowScanWarningModal(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1.5 rounded-full hover:bg-outline-variant/30 transition-all cursor-pointer border-none bg-transparent"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex flex-col gap-2 pr-8 pt-2">
              <h2 className="text-xl font-bold tracking-tight leading-tight text-on-surface">
                Ang NutriSync ay isang gabay, hindi doktor
              </h2>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Ang mga nakatalang nutrisyon dito ay{" "}
                <span className="font-bold text-on-surface">
                  mga pagtatantya lamang
                </span>{" "}
                — hindi ito eksakto. Palaging sundin ang payo ng iyong doktor o
                dietitian.
              </p>
            </div>
            <div className="bg-surface-container rounded-2xl p-4 flex flex-col gap-3.5 border border-outline-variant/10">
              <div className="flex gap-3 items-center text-xs">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span className="text-on-surface-variant">
                  Epektibo para sa pag-track ng iyong pagkain
                </span>
              </div>
              <div className="flex gap-3 items-center text-xs">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span className="text-on-surface-variant">
                  Tumutulong na sundin ang limitasyon na ibinigay ng doktor
                </span>
              </div>
              <div className="flex gap-3 items-center text-xs">
                <X className="h-4 w-4 text-error shrink-0" />
                <span className="text-on-surface-variant">
                  Hindi pamalit sa medikal na konsultasyon
                </span>
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer select-none py-1">
              <input
                type="checkbox"
                checked={isScanWarningChecked}
                onChange={(e) => setIsScanWarningChecked(e.target.checked)}
                className="w-4 h-4 rounded border-outline-variant bg-surface-container text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-xs text-on-surface font-medium">
                Naiintindihan ko ito
              </span>
            </label>
            <Button
              onClick={handleProceedToScan}
              disabled={!isScanWarningChecked}
              className="w-full bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed h-12 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all border-none cursor-pointer"
            >
              <span>Sige, magsimula na</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Uploading overlay */}
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
            <h2 className="text-lg font-bold text-on-surface mb-4">
              Confirm Food Log
            </h2>
            <div className="space-y-3 mb-6">
              <div className="p-4 bg-surface-container rounded-lg">
                <p className="text-lg font-bold text-on-surface">
                  {scannedFoodData.name}
                </p>
                <p className="text-sm text-on-surface-variant">
                  {scannedFoodData.description}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-surface-container rounded-lg">
                  <p className="text-xs text-on-surface-variant">Calories</p>
                  <p className="text-lg font-bold text-primary">
                    {Math.round(scannedFoodData.calories_kcal)} kcal
                  </p>
                </div>
                <div className="p-3 bg-surface-container rounded-lg">
                  <p className="text-xs text-on-surface-variant">Sodium</p>
                  <p className="text-lg font-bold text-primary">
                    {Math.round(scannedFoodData.sodium_mg)} mg
                  </p>
                </div>
                <div className="p-3 bg-surface-container rounded-lg">
                  <p className="text-xs text-on-surface-variant">Protein</p>
                  <p className="text-lg font-bold text-primary">
                    {Math.round(scannedFoodData.protein_g)}g
                  </p>
                </div>
                <div className="p-3 bg-surface-container rounded-lg">
                  <p className="text-xs text-on-surface-variant">Carbs</p>
                  <p className="text-lg font-bold text-primary">
                    {Math.round(scannedFoodData.carbs_g)}g
                  </p>
                </div>
                <div className="p-3 bg-surface-container rounded-lg">
                  <p className="text-xs text-on-surface-variant">Fat</p>
                  <p className="text-lg font-bold text-primary">
                    {Math.round(scannedFoodData.fat_g)}g
                  </p>
                </div>
                <div className="p-3 bg-surface-container rounded-lg">
                  <p className="text-xs text-on-surface-variant">Potassium</p>
                  <p className="text-lg font-bold text-primary">
                    {Math.round(scannedFoodData.potassium_mg)}mg
                  </p>
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
              Good morning, {user?.full_name?.split(" ")[0] || "Juan"}!
            </h1>
            <p className="text-lg text-on-surface-variant mt-1.5">
              {todayLogs.length === 0
                ? "You haven't logged any meals today. Let's start healthy by logging your first meal!"
                : `You've logged ${todayLogs.length} meal${todayLogs.length > 1 ? "s" : ""} today.`}
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
                  Ang iyong nakonsumong sodium ngayong araw ay umabot na sa{" "}
                  <span className="font-bold">
                    {Math.round(consumedSodium)} mg
                  </span>
                  , na nasa{" "}
                  <span className="font-bold">
                    {Math.round((consumedSodium / targets.sodium_mg) * 100)}%
                  </span>{" "}
                  ng iyong daily target limit (
                  <span className="font-bold">{targets.sodium_mg} mg</span>).
                </p>
                <div className="mt-3 p-3 bg-white/70 border border-red-200/40 rounded-xl text-xs font-bold text-red-950">
                  Paalala mula sa iyong Doctor: Mangyaring iwasan muna ang
                  pagkain ng maaalat (tulad ng toyo, patis, bagoong, de-lata, at
                  instant noodles) sa natitirang bahagi ng araw na ito!
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Day-end summary banner — shown only after 11pm local time */}
          {showDayEndSummary && todayLogs.length > 0 && (
            <div className="mb-8 flex items-start gap-3 p-4 rounded-2xl border border-outline-variant/30 bg-surface-container shadow-sm">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-sm font-bold text-on-surface">
                  Day Summary — {todayLabel}
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                  You finished the day at{" "}
                  <span className="font-semibold text-on-surface">
                    {Math.round(consumedCalories).toLocaleString()} kcal
                  </span>
                  {isCalorieSurpassed ? (
                    <span className="text-error font-semibold">
                      {" "}
                      —{" "}
                      {Math.round(
                        consumedCalories - targets.calories_kcal,
                      ).toLocaleString()}{" "}
                      kcal over goal.
                    </span>
                  ) : (
                    <span className="text-secondary font-semibold">
                      {" "}
                      — {Math.round(caloriesLeft).toLocaleString()} kcal under
                      goal. Great job!
                    </span>
                  )}
                </p>
              </div>
            </div>
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
                        className={`${isCalorieSurpassed ? "text-error" : "text-primary"} stroke-current`}
                        cx="50"
                        cy="50"
                        fill="transparent"
                        r="42"
                        strokeLinecap="round"
                        strokeWidth="8"
                        style={{
                          strokeDasharray: 264,
                          strokeDashoffset: strokeDashoffset,
                          transition: "stroke-dashoffset 0.35s",
                          transform: "rotate(-90deg)",
                          transformOrigin: "50% 50%",
                        }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-extrabold text-on-surface tracking-tight">
                        {Math.round(caloriesLeft).toLocaleString()}
                      </span>
                      <span className="text-xs text-outline font-medium">
                        kcal left
                      </span>
                    </div>
                  </div>

                  <p className="mt-6 text-sm text-on-surface-variant font-medium">
                    Goal: {targets.calories_kcal?.toLocaleString()} kcal |
                    Consumed: {Math.round(consumedCalories).toLocaleString()}{" "}
                    kcal
                  </p>
                </div>

                {/* Sodium Intake Summary */}
                <div className="lg:col-span-2 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col justify-between h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                        Sodium Intake
                      </h3>
                      <p
                        className={`text-2xl font-bold mt-1 ${isSodiumWarning ? "text-error" : "text-primary"}`}
                      >
                        {(consumedSodium / 1000).toFixed(2)}g{" "}
                        <span className="text-sm font-normal text-on-surface-variant">
                          / {(targets.sodium_mg / 1000).toFixed(1)}g
                        </span>
                      </p>
                    </div>
                    <span
                      className={`p-2 rounded-xl flex items-center justify-center ${isSodiumWarning ? "bg-error-container text-error" : "bg-surface-container text-primary"}`}
                    >
                      {isSodiumWarning ? (
                        <AlertTriangle className="h-5 w-5 animate-pulse" />
                      ) : (
                        <CheckCircle className="h-5 w-5" />
                      )}
                    </span>
                  </div>

                  {/* Warning Alert Box */}
                  <div
                    className={`p-7 rounded-xl flex gap-3 items-start border mb-7 ${
                      isSodiumWarning
                        ? "bg-error-container text-on-error-container border-error/10"
                        : "bg-surface-container text-on-surface border-outline-variant/20"
                    }`}
                  >
                    <Info className="h-5 w-5 shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <p className="text-xs font-semibold">
                        {isSodiumWarning
                          ? "Sodium Intake Alert"
                          : "Sodium Compliance"}
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
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-on-surface">
                        Macronutrient Progress
                      </h3>
                      <span className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-full border border-outline-variant/20">
                        <Calendar className="h-3.5 w-3.5" />
                        Today, {todayLabel}
                      </span>
                    </div>
                    <div className="space-y-5">
                      {/* Protein progress */}
                      <div>
                        <div className="flex justify-between mb-1.5 text-sm">
                          <span className="font-semibold text-on-surface">
                            Protein
                          </span>
                          <span className="text-on-surface-variant">
                            {Math.round(consumedProtein)}g / {targetProtein}g
                          </span>
                        </div>
                        <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${proteinPct}%`,
                              backgroundColor: "#00B4AD",
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Carbohydrates progress */}
                      <div>
                        <div className="flex justify-between mb-1.5 text-sm">
                          <span className="font-semibold text-on-surface">
                            Carbohydrates
                          </span>
                          <span className="text-on-surface-variant">
                            {Math.round(consumedCarbs)}g / {targets.carbs_g}g
                          </span>
                        </div>
                        <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full transition-all duration-500"
                            style={{ width: `${carbsPct}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Fats progress */}
                      <div>
                        <div className="flex justify-between mb-1.5 text-sm">
                          <span className="font-semibold text-on-surface">
                            Fats
                          </span>
                          <span className="text-on-surface-variant">
                            {Math.round(consumedFat)}g / {targetFat}g
                          </span>
                        </div>
                        <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${fatPct}%`,
                              backgroundColor: "#ED8659",
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Meals */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-on-surface">
                        Recent Meals
                      </h3>
                      <span className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-full border border-outline-variant/20">
                        <Clock className="h-3.5 w-3.5" />
                        {todayLabel}
                      </span>
                    </div>
                    {todayLogs.length === 0 ? (
                      <div className="p-8 bg-surface-container-low border border-dashed border-outline-variant rounded-2xl text-center text-on-surface-variant text-sm flex flex-col items-center justify-center gap-3">
                        <Utensils className="h-8 w-8 text-outline" />
                        <div>
                          <p className="font-semibold">No meals logged today</p>
                          <p className="text-xs mt-0.5">
                            Log your meals by uploading a photo or talking to
                            NutriGabay AI.
                          </p>
                        </div>
                        <Button
                          onClick={handleOpenScanDialog}
                          className="mt-2 rounded-full flex gap-2"
                        >
                          <Camera className="h-4 w-4" />
                          Log First Meal
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                          {todayLogs
                            .slice(
                              (currentPage - 1) * mealsPerPage,
                              currentPage * mealsPerPage,
                            )
                            .map((log) => (
                              <MealCard
                                key={log.id}
                                log={log}
                                isExpanded={expandedLogId === log.id}
                                onToggle={() =>
                                  setExpandedLogId(
                                    expandedLogId === log.id ? null : log.id,
                                  )
                                }
                                apiUrl={API_URL}
                              />
                            ))}
                        </div>
                        {todayLogs.length > mealsPerPage && (
                          <div className="flex items-center justify-between mt-4 border-t border-outline-variant/30 pt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setCurrentPage((prev) => Math.max(prev - 1, 1))
                              }
                              disabled={currentPage === 1}
                            >
                              Previous
                            </Button>
                            <span className="text-xs text-on-surface-variant">
                              Page {currentPage} of{" "}
                              {Math.ceil(todayLogs.length / mealsPerPage)}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setCurrentPage((prev) =>
                                  Math.min(
                                    prev + 1,
                                    Math.ceil(todayLogs.length / mealsPerPage),
                                  ),
                                )
                              }
                              disabled={
                                currentPage ===
                                Math.ceil(todayLogs.length / mealsPerPage)
                              }
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
                  {/* Clinical Reminders (dynamic from API) */}
                  <Card className="border border-outline-variant/30 h-full">
                    <CardHeader className="flex flex-row items-center gap-2 pb-4">
                      <Calendar className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg font-bold text-on-surface">
                        Clinical Reminders
                      </CardTitle>
                    </CardHeader>

                    <CardContent>
                      {reminders.length === 0 ? (
                        <p className="text-xs text-on-surface-variant">
                          No reminders set by your clinician.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {reminders.map((reminder) => {
                            const config =
                              REMINDER_CONFIG[reminder.reminder_type] ||
                              REMINDER_CONFIG.custom;
                            const Icon = config.icon;
                            return (
                              <div
                                key={reminder.id}
                                className="flex gap-3 items-start p-3 rounded-xl border border-outline-variant/10 bg-surface-container-low"
                              >
                                <div
                                  className={`p-2 rounded-lg border ${config.bgClass} flex items-center justify-center shrink-0`}
                                >
                                  <Icon
                                    className={`h-4 w-4 ${config.iconClass}`}
                                  />
                                </div>
                                <div className="flex-grow min-w-0">
                                  <p className="text-sm font-semibold text-on-surface truncate">
                                    {reminder.title}
                                  </p>
                                  {reminder.description && (
                                    <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                                      {reminder.description}
                                    </p>
                                  )}
                                  {reminder.schedule && (
                                    <p className="text-[10px] text-outline mt-1.5 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />{" "}
                                      {reminder.schedule}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
        <ScrollBar orientation="vertical" />
      </ScrollArea>

      {/* FABs */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        {doctorChat.doctorProfile && (
          <button
            onClick={handleOpenDoctorChat}
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all cursor-pointer border-none bg-primary text-on-primary relative"
            title="Chat with your Doctor"
          >
            <MessageSquare className="h-5 w-5" />
            {doctorChat.unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-error text-white text-[10px] font-bold h-5 min-w-5 px-1 rounded-full flex items-center justify-center animate-pulse">
                {doctorChat.unreadCount}
              </span>
            )}
          </button>
        )}
        <button
          onClick={() => setIsChatOpen(true)}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all cursor-pointer border-none bg-primary text-on-primary"
          title="Chat with NutriGabay AI"
        >
          <Sparkles className="h-5 w-5" />
        </button>
        <button
          onClick={handleOpenScanDialog}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all cursor-pointer border-none bg-primary text-on-primary"
          title="Log a Meal with AI"
        >
          <Camera className="h-5 w-5" />
        </button>
      </div>

      {/* NutriGabay Chat Drawer */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div
            onClick={() => setIsChatOpen(false)}
            className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity duration-300"
          />
          <div className="relative w-full max-w-md bg-surface h-full shadow-2xl flex flex-col z-10 transition-transform duration-300 animate-slide-in-right">
            <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-on-surface">
                    NutriGabay AI
                  </h3>
                  <p className="text-[10px] text-on-surface-variant font-medium">
                    Your Pinoy Health Companion
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 rounded-full hover:bg-outline-variant/30 transition-all text-on-surface-variant border-none cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ScrollArea className="flex-grow bg-background w-full overflow-hidden">
              <div className="p-5 space-y-4 flex flex-col-reverse">
                <div className="flex flex-col gap-4">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-xs ${msg.isUser ? "bg-primary text-on-primary self-end rounded-tr-none" : "bg-surface-container-lowest text-on-surface self-start rounded-tl-none border border-outline-variant/15"}`}
                    >
                      {msg.text}
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="bg-surface-container-lowest p-3 rounded-2xl rounded-tl-none border border-outline-variant/15 text-on-surface-variant self-start flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-xs font-medium">
                        Nag-iisip si NutriGabay...
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>
            <div className="px-5 py-3 border-t border-outline-variant/30 flex gap-3 items-center bg-surface-container text-[11px] text-on-surface-variant">
              <span className="h-4.5 w-4.5 shrink-0">ℹ</span>
              <p className="leading-normal">
                Ang NutriGabay ay gabay lamang. Para sa medikal na desisyon,
                kumunsulta sa inyong doktor.
              </p>
            </div>
            <div className="p-4 border-t border-outline-variant bg-surface-container-lowest flex gap-2">
              <Input
                type="text"
                placeholder="Magtanong kay NutriGabay..."
                className="flex-grow bg-background border-outline-variant"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                disabled={isChatLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isChatLoading || !chatInput.trim()}
                className="rounded-xl px-4 h-auto bg-primary hover:bg-primary/90 text-on-primary border-none cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Chat Drawer */}
      {doctorChat.isChatOpen && doctorChat.doctorProfile && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div
            onClick={() => doctorChat.setIsChatOpen(false)}
            className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity duration-300"
          />
          <div className="relative w-full max-w-md bg-surface h-full shadow-2xl flex flex-col z-10 transition-transform duration-300 animate-slide-in-right">
            <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <MessageSquare className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-on-surface">
                    {doctorChat.doctorProfile.full_name}
                  </h3>
                  <p className="text-[10px] text-on-surface-variant font-medium">
                    Your Direct Medical Monitoring Link
                  </p>
                </div>
              </div>
              <button
                onClick={() => doctorChat.setIsChatOpen(false)}
                className="p-1.5 rounded-full hover:bg-outline-variant/30 transition-all text-on-surface-variant border-none cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ScrollArea className="flex-grow bg-background w-full overflow-hidden">
              <div className="p-5 space-y-4 flex flex-col">
                {doctorChat.isLoading ? (
                  <div className="py-20 text-center text-on-surface-variant text-sm flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-secondary" />
                    <span>Loading conversation history...</span>
                  </div>
                ) : doctorChat.messages.length === 0 ? (
                  <div className="py-20 text-center text-on-surface-variant text-xs flex flex-col items-center justify-center gap-3 px-6">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-on-surface">
                        Direct Line Active
                      </p>
                      <p className="mt-1 leading-relaxed">
                        No messages yet. Send a message to start a secure direct
                        chat with your supervising clinician.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {doctorChat.messages.map((msg, idx) => {
                      const isCurrentUser = msg.sender_id === user?.id;
                      return (
                        <div
                          key={msg.id || idx}
                          className={`p-3.5 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-xs ${isCurrentUser ? "bg-primary text-on-primary self-end rounded-tr-none" : "bg-surface-container-lowest text-on-surface self-start rounded-tl-none border border-outline-variant/15"}`}
                        >
                          <p>{msg.message}</p>
                          <span
                            className={`text-[9px] mt-1 block text-right font-medium opacity-60`}
                          >
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      );
                    })}
                    <div ref={doctorChat.messagesEndRef} />
                  </div>
                )}
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>
            <div className="px-5 py-3 border-t border-outline-variant/30 flex gap-3 items-center bg-surface-container text-[10px] text-on-surface-variant">
              <span className="h-4.5 w-4.5 shrink-0 text-secondary">ℹ</span>
              <p className="leading-normal font-medium">
                HIPAA & DPA 2012 Encrypted. This direct communication line is
                secure and monitored for clinical safety compliance.
              </p>
            </div>
            <div className="p-4 border-t border-outline-variant bg-surface-container-lowest flex gap-2">
              <Input
                type="text"
                placeholder="Type a secure message to your doctor..."
                className="flex-grow bg-background border-outline-variant"
                value={doctorChat.doctorChatInput}
                onChange={(e) => doctorChat.setDoctorChatInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleSendDoctorMessage()
                }
                disabled={doctorChat.isLoading}
              />
              <Button
                onClick={handleSendDoctorMessage}
                disabled={
                  doctorChat.isLoading || !doctorChat.doctorChatInput.trim()
                }
                className="rounded-xl px-4 h-auto bg-primary hover:bg-primary/90 text-on-primary border-none cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
