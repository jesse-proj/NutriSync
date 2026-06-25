import { useState, useEffect } from "react";
import { Download, TrendingDown, CheckCircle, Sparkles, MessageSquare, Loader2, Send, X } from "lucide-react";
import { ScrollArea, ScrollBar } from "../components/ui/scroll-area";
import { Input } from "../components/ui/input";
import Footer from "../components/Footer";
import PatientNavbar from "../components/PatientNavbar";
import { Button } from "../components/ui/button";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useDoctorChat } from "../hooks/useDoctorChat";

// ponytail: Reports.tsx uses simple native SVG and Tailwind divs for charts to keep it minimal and dependency-free

interface FoodLog {
  id: number;
  name: string;
  description: string;
  sodium_mg: number;
  carbs_g: number;
  calories_kcal: number;
  potassium_mg: number;
  protein_g: number;
  fat_g: number;
  logged_at: string;
}

const Reports = () => {
  useEffect(() => {
    document.title = "Reports | NutriSync";
  }, []);

  const { user } = useAuth();
  const doctorChat = useDoctorChat(user?.id);
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    { text: string; isUser: boolean }[]
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

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

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await apiFetch("/api/patients/logs?limit=30");
        if (data) setLogs(data);
      } catch (e) {
        console.error("Error fetching logs:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Calculate weekly data from logs (last 7 days)
  const getWeeklyData = () => {
    const weeklyData = [];
    const today = new Date();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dailyStats: { [key: string]: { calories: number; sodium: number } } =
      {};

    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayKey = date.toISOString().split("T")[0];
      dailyStats[dayKey] = { calories: 0, sodium: 0 };
    }

    // Aggregate log data by day
    logs.forEach((log) => {
      const logDate = new Date(log.logged_at);
      const dayKey = logDate.toISOString().split("T")[0];
      if (dailyStats[dayKey]) {
        dailyStats[dayKey].calories += log.calories_kcal;
        dailyStats[dayKey].sodium += log.sodium_mg;
      }
    });

    // Convert to percentage (0-100 scale)
    const maxCalories = Math.max(
      2500,
      ...Object.values(dailyStats).map((s) => s.calories),
    );
    const maxSodium = Math.max(
      2300,
      ...Object.values(dailyStats).map((s) => s.sodium),
    );

    let dayIndex = 0;
    for (const dayKey in dailyStats) {
      const stats = dailyStats[dayKey];
      weeklyData.push({
        day: days[new Date(dayKey).getDay()],
        calories: Math.round((stats.calories / maxCalories) * 100),
        sodium: Math.round((stats.sodium / maxSodium) * 100),
      });
      dayIndex++;
    }

    return weeklyData;
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      // Lazy-load heavy PDF deps
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      // 1. Fetch AI Summary
      let aiSummary = "No summary available.";
      try {
        const summaryRes = await apiFetch(
          "/api/patients/reports/summary?limit=30",
        );
        if (summaryRes?.summary) {
          aiSummary = summaryRes.summary;
        }
      } catch (err) {
        console.warn("Could not fetch AI summary, continuing without it.", err);
      }

      // 2. Initialize PDF
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.text("Nutritional Report", 14, 22);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

      // AI Summary
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("AI Nutritional Summary", 14, 40);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const splitSummary = doc.splitTextToSize(aiSummary, 180);
      doc.text(splitSummary, 14, 46);

      // Stats
      const totalCalories = logs.reduce(
        (sum, log) => sum + (log.calories_kcal || 0),
        0,
      );
      const totalSodium = logs.reduce(
        (sum, log) => sum + (log.sodium_mg || 0),
        0,
      );

      let nextY = 46 + splitSummary.length * 5 + 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Total Stats (Last 30 Logs)", 14, nextY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Calories: ${totalCalories.toFixed(2)} kcal`, 14, nextY + 6);
      doc.text(`Sodium: ${totalSodium.toFixed(2)} mg`, 14, nextY + 12);

      // Table of Logs
      nextY += 20;
      const tableData = logs.map((log) => {
        const dStr = log.logged_at.endsWith("Z")
          ? log.logged_at
          : log.logged_at + "Z";
        return [
          new Date(dStr).toLocaleString(),
          log.name,
          `${Number(log.calories_kcal || 0).toFixed(2)} kcal`,
          `${Number(log.sodium_mg || 0).toFixed(2)} mg`,
          `${Number(log.potassium_mg || 0).toFixed(2)} mg`,
        ];
      });

      autoTable(doc, {
        startY: nextY,
        head: [["Date/Time", "Meal", "Calories", "Sodium", "Potassium"]],
        body: tableData,
      });

      doc.save("Nutritional_Report.pdf");
    } catch (e) {
      console.error("Export failed:", e);
    } finally {
      setIsExporting(false);
    }
  };

  const weeklyData = getWeeklyData();

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans">
        <PatientNavbar activePage="reports" />
        <div className="grow flex items-center justify-center">
          <p className="text-on-surface-variant">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans relative">
      <PatientNavbar activePage="reports" />

      {/* Main Content */}
      <ScrollArea className="grow w-full">
        <main className="max-w-7xl mx-auto w-full px-6 py-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-on-surface tracking-tight">
                Nutritional Analysis
              </h1>
              <p className="text-sm text-on-surface-variant mt-1.5">
                Reviewing your health trends for the past week
              </p>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <Button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="bg-primary text-on-primary px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg hover:bg-primary-container transition-all"
              >
                <Download className="h-4 w-4" />
                {isExporting ? "Generating..." : "Export Full Report"}
              </Button>
            </div>
          </div>

          <section className="space-y-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-on-surface">Weekly Summary</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-primary"></span>
                  <span className="text-xs font-semibold text-on-surface-variant">
                    Calories
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-secondary"></span>
                  <span className="text-xs font-semibold text-on-surface-variant">
                    Sodium
                  </span>
                </div>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="h-64 flex items-end justify-between gap-4 mt-8 px-4 border-b border-outline-variant/50 pb-4">
              {weeklyData.map((data, index) => (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                >
                  <div className="w-full flex justify-center items-end gap-1 h-[80%]">
                    <div
                      className="w-4 rounded-t-sm transition-all duration-500 bg-primary"
                      style={{ height: `${data.calories}%` }}
                      title={`Calories: ${data.calories}%`}
                    />
                    <div
                      className="w-4 rounded-t-sm transition-all duration-500 bg-secondary"
                      style={{ height: `${data.sodium}%` }}
                      title={`Sodium: ${data.sodium}%`}
                    />
                  </div>
                  <span className="text-xs font-medium text-on-surface-variant">
                    {data.day}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface-container-low p-6 rounded-2xl border border-secondary-container flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center text-secondary">
                    <TrendingDown className="h-6 w-6 text-primary" />
                  </div>
                  <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold">
                    {logs.length > 0 ? "Tracking" : "Start Logging"}
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-primary">Sodium Management</h4>
                  <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                    {logs.length > 0
                      ? `You've logged ${logs.length} meals. ${logs.some((l) => l.sodium_mg > 400) ? "Try to reduce high-sodium meals." : "Great job keeping sodium low!"}`
                      : "Start logging meals to track your sodium intake."}
                  </p>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 flex flex-col gap-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <span className="bg-surface-variant text-on-surface-variant px-3 py-1 rounded-full text-xs font-bold">
                    {logs.length > 0 ? "Monitoring" : "No Data"}
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-on-surface">Potassium Intake</h4>
                  <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                    {logs.length > 0
                      ? `Average: ${Math.round(
                          logs.reduce(
                            (sum, log) => sum + (log.potassium_mg || 0),
                            0,
                          ) / logs.length,
                        )}mg per meal.`
                      : "Log meals to track potassium intake."}
                  </p>
                </div>
              </div>
            </div>
          </section>
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
            <ScrollArea className="grow bg-background w-full overflow-hidden">
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
                className="grow bg-background border-outline-variant"
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
            <ScrollArea className="grow bg-background w-full overflow-hidden">
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
                className="grow bg-background border-outline-variant"
                value={doctorChat.doctorChatInput}
                onChange={(e) => doctorChat.setDoctorChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendDoctorMessage()}
                disabled={doctorChat.isLoading}
              />
              <Button
                onClick={handleSendDoctorMessage}
                disabled={doctorChat.isLoading || !doctorChat.doctorChatInput.trim()}
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

export default Reports;
