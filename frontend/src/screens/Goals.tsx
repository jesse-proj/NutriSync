import { useState, useEffect } from "react";
import { CheckCircle, Sparkles, TrendingDown, HeartPulse, MessageSquare, Loader2, Send, X } from "lucide-react";
import { ScrollArea, ScrollBar } from "../components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import Footer from "../components/Footer";
import PatientNavbar from "../components/PatientNavbar";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useDoctorChat } from "../hooks/useDoctorChat";

// ponytail: Goals.tsx uses simple React state and inline Tailwind styles for custom progress/charts

const Goals = () => {
  const { user } = useAuth();
  const doctorChat = useDoctorChat(user?.id);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    { text: string; isUser: boolean }[]
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    document.title = "Goals | NutriSync";
  }, []);

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
    if (!sent) {
      alert(
        "Chat connection is currently reconnecting. Please try sending again in a moment.",
      );
    }
  };

  const [weight, setWeight] = useState<number | null>(null);
  const [weightHistory, setWeightHistory] = useState<
    { weight_kg: number; logged_at: string }[]
  >([]);
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [sodiumConsumed, setSodiumConsumed] = useState(0);
  const [sodiumTarget, setSodiumTarget] = useState<number | null>(null);
  const [walkingTarget] = useState(5.0);
  const [walkingCompleted, setWalkingCompleted] = useState(0);
  const [loading, setLoading] = useState(true);

  // Checklist state
  const [bpChecked, setBpChecked] = useState(true);
  const [fiberChecked, setFiberChecked] = useState(false);
  const [fluidChecked, setFluidChecked] = useState(true);

  // ponytail: refetch when PatientDashboard logs a meal via localStorage event
  const fetchData = async () => {
    try {
      const [targetsData, logs, weightData] = await Promise.all([
        apiFetch<{ sodium_mg: number }>("/api/patients/targets"),
        apiFetch<
          { calories_kcal: number; sodium_mg: number; logged_at: string }[]
        >("/api/patients/logs?today=true"),
        apiFetch<{ weight_kg: number; logged_at: string }[]>(
          "/api/patients/weight?days=30",
        ),
      ]);
      if (weightData && weightData.length > 0) {
        const latest = weightData[weightData.length - 1];
        setWeight(latest.weight_kg);
        setWeightHistory(weightData);
      }
      if (targetsData?.sodium_mg != null) {
        setSodiumTarget(targetsData.sodium_mg);
      }
      if (logs && logs.length > 0) {
        // ponytail: backend already filters to today only via ?today=true
        const todaySodium = logs.reduce(
          (sum, log) => sum + (log.sodium_mg || 0),
          0,
        );
        setSodiumConsumed(Math.round(todaySodium));
        const totalCalories = logs.reduce(
          (sum, log) => sum + (log.calories_kcal || 0),
          0,
        );
        setWalkingCompleted(Math.round((totalCalories / 50) * 10) / 10);
      }
    } catch (e) {
      console.error("Error fetching goals data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const onMealLogged = () => fetchData();
    window.addEventListener("nutrisync:meal-logged", onMealLogged);
    return () =>
      window.removeEventListener("nutrisync:meal-logged", onMealLogged);
  }, [fetchData]);

  const sodiumPct = sodiumTarget
    ? Math.min(150, Math.round((sodiumConsumed / sodiumTarget) * 100))
    : 0;
  // ponytail: interpolate from teal (#00B4AD) at 0% → amber (#F59E0B) at 60% → red (#EF4444) at 100%
  const sodiumColor =
    sodiumPct <= 60 ? "#00B4AD" : sodiumPct <= 80 ? "#F59E0B" : "#EF4444";
  const sodiumGlow =
    sodiumPct > 60
      ? `0 0 ${Math.min(sodiumPct / 2, 20)}px ${sodiumColor}66`
      : "none";
  const walkingPct = Math.min(
    100,
    Math.round((walkingCompleted / walkingTarget) * 100),
  );

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans relative">
      <PatientNavbar activePage="goals" />

      {/* Main Content */}
      <ScrollArea className="grow w-full">
        <main className="max-w-7xl mx-auto w-full px-6 py-8">
          {/* Header Section */}
          <div className="flex justify-between items-end mb-8">
            <div className="text-left">
              <h1 className="text-3xl font-bold text-on-surface tracking-tight">
                Health Goals
              </h1>
              <p className="text-sm text-on-surface-variant mt-1.5">
                Track and adjust your clinical objectives
              </p>
            </div>
          </div>

          {/* Three Column Dashboard Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Weight Trends */}
            <div className="lg:col-span-4 flex flex-col">
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30 flex flex-col h-full text-left">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-on-surface">
                    Current Weight
                  </h3>
                  <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold">
                    {weight !== null ? `${weight} kg` : "No data"}
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-extrabold text-primary tracking-tight">
                    {loading ? "—" : weight !== null ? weight : "—"}
                  </span>
                  <span className="text-sm text-on-surface-variant font-medium">
                    kg
                  </span>
                </div>

                {/* Real weight chart from history */}
                {weightHistory.length > 1 ? (
                  <>
                    <div className="grow min-h-40 relative flex items-end justify-between gap-1 px-1 pt-4">
                      <div className="w-full absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                        <div className="border-t border-outline"></div>
                        <div className="border-t border-outline"></div>
                        <div className="border-t border-outline"></div>
                        <div className="border-t border-outline"></div>
                      </div>
                      {(() => {
                        const wts = weightHistory.map((w) => w.weight_kg);
                        const min = Math.min(...wts);
                        const max = Math.max(...wts);
                        const range = max - min || 1;
                        return weightHistory.map((w, i) => {
                          const pct = ((w.weight_kg - min) / range) * 100;
                          return (
                            <div
                              key={i}
                              className="w-full bg-primary/70 rounded-t-lg transition-all hover:bg-primary"
                              style={{ height: `${Math.max(pct, 10)}%` }}
                              title={`${w.weight_kg}kg — ${new Date(w.logged_at).toLocaleDateString()}`}
                            />
                          );
                        });
                      })()}
                    </div>
                    <div className="flex justify-between mt-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                      <span>
                        {weightHistory.length > 7
                          ? `${weightHistory.length}d ago`
                          : "Start"}
                      </span>
                      <span>Now</span>
                    </div>
                  </>
                ) : (
                  <div className="grow min-h-30 flex items-center justify-center text-sm text-on-surface-variant">
                    {weightHistory.length === 1
                      ? "Log another weight to see trends"
                      : "No weight data yet"}
                  </div>
                )}

                {/* Weight input */}
                {showWeightInput ? (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const val = parseFloat(weightInput);
                      if (isNaN(val) || val <= 0) return;
                      try {
                        await apiFetch("/api/patients/weight", {
                          json: { weight_kg: val },
                          method: "POST",
                        });
                        setWeight(val);
                        setShowWeightInput(false);
                        setWeightInput("");
                        fetchData();
                        window.dispatchEvent(
                          new CustomEvent("nutrisync:meal-logged"),
                        );
                      } catch {
                        alert("Failed to log weight");
                      }
                    }}
                    className="mt-4 flex gap-2"
                  >
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="500"
                      placeholder="Weight (kg)"
                      value={weightInput}
                      onChange={(e) => setWeightInput(e.target.value)}
                      autoFocus
                      className="flex-1 px-3 py-2 bg-surface-bright border border-outline-variant rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowWeightInput(false)}
                      className="px-3 py-2 border border-outline-variant rounded-lg text-sm hover:bg-surface-container"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => {
                      setWeightInput(weight !== null ? String(weight) : "");
                      setShowWeightInput(true);
                    }}
                    className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
                  >
                    <TrendingDown className="h-4 w-4" />
                    {weight !== null ? "Update Weight" : "Log Weight"}
                  </button>
                )}
              </div>
            </div>

            {/* Middle Column: Progress Cards */}
            <div className="lg:col-span-4 flex flex-col gap-6 text-left">
              {/* Sodium Progress */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30 relative overflow-hidden group">
                <div className="flex justify-between items-center mb-6">
                  <div className="p-3 bg-surface-container-highest rounded-xl text-primary font-bold text-xs uppercase">
                    Sodium
                  </div>
                  <span
                    className="font-semibold text-sm flex items-center gap-1"
                    style={{ color: sodiumColor }}
                  >
                    <CheckCircle className="h-4 w-4" />
                    {sodiumPct <= 60
                      ? "On Track"
                      : sodiumPct <= 80
                        ? "Caution"
                        : sodiumPct <= 100
                          ? "Warning"
                          : "Exceeded"}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-on-surface">
                  Daily Sodium
                </h3>
                <p className="text-sm text-on-surface-variant mt-1 mb-8">
                  Goal: &lt; {sodiumTarget !== null ? `${sodiumTarget}mg` : "—"}
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-on-surface">
                      {sodiumConsumed}mg consumed
                    </span>
                    <span className="text-on-surface-variant">
                      {sodiumPct}%
                    </span>
                  </div>
                  <div className="w-full h-4 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${Math.min(sodiumPct, 100)}%`,
                        backgroundColor: sodiumColor,
                        boxShadow: sodiumGlow,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Walking Progress */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30 relative overflow-hidden group">
                <div className="flex justify-between items-center mb-6">
                  <div className="p-3 bg-surface-container-highest rounded-xl text-primary font-bold text-xs uppercase">
                    Activity
                  </div>
                  <span className="text-primary font-semibold text-sm">
                    {walkingPct}% Achieved
                  </span>
                </div>
                <h3 className="text-xl font-bold text-on-surface">
                  Walking Distance
                </h3>
                <p className="text-sm text-on-surface-variant mt-1 mb-8">
                  Goal: {walkingTarget} km
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-on-surface">
                      {walkingCompleted} km completed
                    </span>
                    <span className="text-on-surface-variant">
                      {walkingPct}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${walkingPct}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: NutriGabay & Checklist */}
            <div className="lg:col-span-4 flex flex-col gap-6 text-left">
              {/* NutriGabay Card */}
              <Card className="bg-primary text-on-primary overflow-hidden relative">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full border-2 border-white/20 bg-white flex items-center justify-center text-primary font-bold text-lg">
                      <HeartPulse className="w-7 h-7" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-on-primary">NutriGabay</CardTitle>
                      <CardDescription className="text-xs text-white opacity-90 leading-relaxed">
                        {sodiumTarget === null
                          ? "Loading your sodium target..."
                          : sodiumPct <= 100
                            ? "You're doing great! Your sodium intake is within range. Keep up the fiber goals to maintain heart health."
                            : "Your sodium is above target. Consider reducing high-sodium meals and drink more water."}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative pt-0">
                  <div className="absolute -right-4 -bottom-4 opacity-10">
                    <Sparkles className="w-28 h-28 rotate-12" />
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Checklist */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Weekly Checklist</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div
                    onClick={() => setBpChecked(!bpChecked)}
                    className="group flex items-center gap-4 rounded-xl border border-outline-variant/70 bg-background p-4 transition-all hover:bg-surface-container-low cursor-pointer"
                  >
                    <Checkbox
                      checked={bpChecked}
                      onCheckedChange={(checked) => setBpChecked(checked === true)}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-on-surface">
                        Log your meal today
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        Add a food entry to keep sodium in check
                      </p>
                    </div>
                    <span className={`text-xs font-semibold ${bpChecked ? "text-primary" : "text-on-surface-variant"}`}>
                      {bpChecked ? "Done" : "Pending"}
                    </span>
                  </div>

                  <div
                    onClick={() => setFiberChecked(!fiberChecked)}
                    className="group flex items-center gap-4 rounded-xl border border-outline-variant/70 bg-background p-4 transition-all hover:bg-surface-container-low cursor-pointer"
                  >
                    <Checkbox
                      checked={fiberChecked}
                      onCheckedChange={(checked) => setFiberChecked(checked === true)}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-on-surface">
                        Review your nutrition summary
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        Check dietary insights and sodium trends
                      </p>
                    </div>
                    <span className={`text-xs font-semibold ${fiberChecked ? "text-primary" : "text-on-surface-variant"}`}>
                      {fiberChecked ? "Done" : "4/7 days"}
                    </span>
                  </div>

                  <div
                    onClick={() => setFluidChecked(!fluidChecked)}
                    className="group flex items-center gap-4 rounded-xl border border-outline-variant/70 bg-background p-4 transition-all hover:bg-surface-container-low cursor-pointer"
                  >
                    <Checkbox
                      checked={fluidChecked}
                      onCheckedChange={(checked) => setFluidChecked(checked === true)}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-on-surface">
                        Check your target settings
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        Confirm sodium and calorie goals for the week
                      </p>
                    </div>
                    <span className={`text-xs font-semibold ${fluidChecked ? "text-primary" : "text-on-surface-variant"}`}>
                      {fluidChecked ? "Done" : "Pending"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        <Footer />
        <ScrollBar orientation="vertical" />
      </ScrollArea>

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
      </div>

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
                  <h3 className="font-bold text-sm text-on-surface">NutriGabay AI</h3>
                  <p className="text-[10px] text-on-surface-variant font-medium">
                    Your Pinoy health companion
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
                      <p className="font-bold text-on-surface">Direct Line Active</p>
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
                          <span className="text-[9px] mt-1 block text-right font-medium opacity-60">
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
                onKeyDown={(e) => e.key === "Enter" && handleSendDoctorMessage()}
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

export default Goals;
