import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { apiFetch } from "../api/client";
import { AlertDialog } from "../components/ui/alert-dialog";
import { UrgentTasks } from "./UrgentTasks";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarSeparator,
} from "../components/ui/sidebar";
import logoBrand from "../assets/nutrisync.png";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  HelpCircle,
  LogOut,
  Search,
  Bell,
  Settings,
  BadgeCheck,
  AlertCircle,
  Plus,
  X,
  RefreshCw,
  ChevronLeft,
  Sparkles,
  CheckCircle,
  XCircle,
  Trash2,
  MessageSquare,
  Utensils,
} from "lucide-react";
import { ClinicianChatHub } from "./ClinicianChatHub";
import PatientList from "../components/PatientList";
import MetricCard from "../components/MetricCard";
import TargetEditor from "../components/TargetEditor";
import ClinicalReminders from "../components/ClinicalReminders";

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  consent_given: boolean;
}

interface FoodLog {
  id: number;
  name: string;
  description: string;
  calories_kcal: number;
  sodium_mg: number;
  carbs_g: number;
  protein_g: number;
  fat_g: number;
  potassium_mg: number;
  image_url?: string;
  logged_at: string;
}

interface DietaryTargets {
  id?: number;
  patient_id: number;
  clinician_id: number;
  sodium_mg: number;
  carbs_g: number;
  calories_kcal: number;
  potassium_mg: number;
}

const ClinicianDashboard = () => {
  const { user, logout } = useAuth();
  const initials = (user?.full_name ?? "MS")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Navigation
  const [activeView, setActiveView] = useState<
    "dashboard" | "patients" | "urgent-tasks" | "messages"
  >("dashboard");

  // Data
  const [patients, setPatients] = useState<User[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Chat
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});
  const [activeChatPatientId, setActiveChatPatientId] = useState<number | null>(
    null,
  );
  const clinicianSocketRef = useRef<WebSocket | null>(null);

  // Patient detail
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [patientLogs, setPatientLogs] = useState<FoodLog[]>([]);
  const [patientTargets, setPatientTargets] = useState<DietaryTargets | null>(
    null,
  );
  const [aiSummary, setAiSummary] = useState<string>("");
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Notifications
  const [notify, setNotify] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleNotify = (type: "success" | "error", message: string) => {
    setNotify({ type, message });
  };

  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletePatientId, setDeletePatientId] = useState<number | null>(null);
  const [deletePatientName, setDeletePatientName] = useState("");

  // Refs for WS
  const activeViewRef = useRef(activeView);
  const activeChatPatientIdRef = useRef(activeChatPatientId);
  useEffect(() => {
    activeViewRef.current = activeView;
  }, [activeView]);
  useEffect(() => {
    activeChatPatientIdRef.current = activeChatPatientId;
  }, [activeChatPatientId]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [patientData, alertData] = await Promise.all([
        apiFetch("/api/clinicians/patients"),
        apiFetch("/api/clinicians/alerts"),
      ]);
      if (patientData) setPatients(patientData);
      if (alertData) setAlerts(alertData);
    } catch (err) {
      console.error("Failed to fetch clinician dashboard data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // WebSocket
  const connectWebSocket = useCallback(() => {
    if (clinicianSocketRef.current) clinicianSocketRef.current.close();
    const token = localStorage.getItem("token");
    if (!token) return;

    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(
      `${wsProtocol}//127.0.0.1:8000/api/chat/direct/ws?token=${token}`,
    );

    ws.onopen = () => console.log("Clinician WS connected");
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.sender_id !== user?.id) {
          setUnreadCounts((prev) => {
            const isChatting =
              activeViewRef.current === "messages" &&
              activeChatPatientIdRef.current === msg.sender_id;
            if (isChatting) return prev;
            return { ...prev, [msg.sender_id]: (prev[msg.sender_id] || 0) + 1 };
          });
        }
      } catch (err) {
        console.error("WS error:", err);
      }
    };
    ws.onclose = () => console.log("Clinician WS disconnected");
    clinicianSocketRef.current = ws;
  }, [user?.id]);

  const fetchUnreadCounts = useCallback(async () => {
    try {
      const counts = await apiFetch("/api/chat/direct/unread");
      if (counts) setUnreadCounts(counts);
    } catch (err) {
      console.error("Error loading unread counts:", err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
      fetchUnreadCounts();
      connectWebSocket();
    }
    return () => {
      if (clinicianSocketRef.current) clinicianSocketRef.current.close();
    };
  }, [user, fetchData, fetchUnreadCounts, connectWebSocket]);

  const totalUnreadCount = Object.values(unreadCounts).reduce(
    (sum, count) => sum + count,
    0,
  );

  // Patient actions
  const handleSelectPatient = async (patient: User) => {
    setSelectedPatient(patient);
    setPatientLogs([]);
    setPatientTargets(null);
    setAiSummary("");

    try {
      const targetsData = await apiFetch(
        `/api/clinicians/patients/${patient.id}/targets`,
      );
      if (targetsData) setPatientTargets(targetsData);
    } catch (err) {
      console.error("Error fetching targets", err);
    }

    try {
      const logsData = await apiFetch(
        `/api/clinicians/patients/${patient.id}/logs`,
      );
      if (logsData) setPatientLogs(logsData);
    } catch (err) {
      console.error("Error fetching logs", err);
    }

    handleFetchSummary(patient.id);
  };

  const handleFetchSummary = async (patientId: number) => {
    setLoadingSummary(true);
    setAiSummary("Generating AI nutritional summary...");
    try {
      const summaryData = await apiFetch(
        `/api/clinicians/patients/${patientId}/summary`,
      );
      setAiSummary(summaryData?.summary || "No recent food logs to summarize.");
    } catch (err) {
      console.error("Error fetching summary", err);
      setAiSummary("Failed to generate summary.");
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleDeletePatient = (patientId: number, name: string) => {
    setDeletePatientId(patientId);
    setDeletePatientName(name);
    setDeleteConfirmOpen(true);
  };

  const executeDeletePatient = async () => {
    if (deletePatientId === null) return;
    try {
      const result = await apiFetch(
        `/api/clinicians/patients/${deletePatientId}`,
        { method: "DELETE" },
      );
      if (result?.success) {
        setNotify({
          type: "success",
          message: `Patient "${deletePatientName}" deleted successfully.`,
        });
        setSelectedPatient(null);
        fetchData();
      }
    } catch (err: any) {
      setNotify({
        type: "error",
        message: err.message || "Failed to delete patient",
      });
    } finally {
      setDeleteConfirmOpen(false);
      setDeletePatientId(null);
      setDeletePatientName("");
    }
  };

  const handlePatientCreated = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="clinician-theme">
      <SidebarProvider defaultOpen={true}>
        <Sidebar collapsible="icon" variant="sidebar">
          <SidebarHeader className="py-4 px-3">
            <div className="flex items-center gap-2 overflow-hidden">
              <img
                src={logoBrand}
                alt="NutriSync Logo"
                className="w-14 h-12 object-contain shrink-0"
              />
              <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
                <span className="text-base font-extrabold text-sidebar-primary">
                  NutriSync
                </span>
                <span className="text-[11px] opacity-60">Clinical Portal</span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => {
                        setActiveView("dashboard");
                        setSelectedPatient(null);
                      }}
                      isActive={activeView === "dashboard" && !selectedPatient}
                      tooltip="Dashboard"
                    >
                      <LayoutDashboard />
                      <span>Dashboard</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => {
                        setActiveView("patients");
                        setSelectedPatient(null);
                      }}
                      isActive={activeView === "patients" && !selectedPatient}
                      tooltip="Patient Directory"
                    >
                      <Users />
                      <span>Patient Directory</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => {
                        setActiveView("urgent-tasks");
                        setSelectedPatient(null);
                      }}
                      isActive={
                        activeView === "urgent-tasks" && !selectedPatient
                      }
                      tooltip="Urgent Tasks"
                    >
                      <AlertCircle
                        className={
                          alerts.length > 0 ? "text-error animate-pulse" : ""
                        }
                      />
                      <span>Urgent Tasks</span>
                      {alerts.length > 0 && (
                        <span className="ml-auto bg-error text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full min-w-4.5 text-center">
                          {alerts.length}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => {
                        setActiveView("messages");
                        setSelectedPatient(null);
                      }}
                      isActive={activeView === "messages" && !selectedPatient}
                      tooltip="Messages Hub"
                    >
                      <MessageSquare
                        className={
                          totalUnreadCount > 0
                            ? "text-primary animate-pulse"
                            : ""
                        }
                      />
                      <span>Messages Hub</span>
                      {totalUnreadCount > 0 && (
                        <span className="ml-auto bg-primary text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full min-w-4.5 text-center">
                          {totalUnreadCount}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="pb-4">
            <SidebarSeparator className="mx-0 mb-2" />
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setActiveView("patients")}
                  tooltip="New Patient"
                  className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground font-bold"
                >
                  <UserPlus />
                  <span>New Patient</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Help Center">
                  <a href="#">
                    <HelpCircle />
                    <span>Help Center</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={logout}
                  tooltip="Logout"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col min-h-screen overflow-y-auto bg-background">
          {/* Top Bar */}
          <header className="sticky top-0 z-40 bg-white border-b border-outline-variant flex items-center justify-between px-6 h-16 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-on-surface-variant" />
              <div className="relative max-w-md w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search patients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-full bg-surface-container-low border-outline-variant focus:border-primary text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative rounded-full"
                >
                  <Bell className="h-5 w-5 text-on-surface-variant" />
                  {alerts.length > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-white" />
                  )}
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Settings className="h-5 w-5 text-on-surface-variant" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  title="Logout"
                  className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
              <div className="h-8 w-px bg-outline-variant" />
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-on-surface leading-none">
                    Dr. {user?.full_name ?? "Maria Santos"}
                  </p>
                  <p className="text-[11px] text-on-surface-variant">
                    Cardiology
                  </p>
                </div>
                <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center text-xs font-bold text-on-surface border-2 border-primary/30 shrink-0">
                  {initials}
                </div>
              </div>
            </div>
          </header>

          {/* Canvas */}
          <div className="p-8 flex flex-col gap-8 flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-64 text-on-surface-variant">
                <span>Loading dashboard records...</span>
              </div>
            ) : selectedPatient ? (
              // ── PATIENT DETAIL VIEW ──────────────────────────────────────────
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPatient(null)}
                      className="flex items-center gap-1 rounded-lg"
                    >
                      <ChevronLeft className="h-4 w-4" /> Back
                    </Button>
                    <div className="h-4 w-px bg-outline-variant" />
                    <h1 className="text-2xl font-bold tracking-tight text-on-surface">
                      {selectedPatient.full_name}
                    </h1>
                    <span className="text-xs text-on-surface-variant">
                      ({selectedPatient.email})
                    </span>
                  </div>
                  <Button
                    onClick={() =>
                      handleDeletePatient(
                        selectedPatient.id,
                        selectedPatient.full_name,
                      )
                    }
                    size="sm"
                    className="bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 text-xs font-bold px-3 flex items-center gap-1 border-none cursor-pointer"
                    title="Delete Patient"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete Patient
                  </Button>
                </div>

                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                    <TargetEditor
                      patientId={selectedPatient.id}
                      initialTargets={patientTargets}
                      onNotify={(type, message) => setNotify({ type, message })}
                    />
                    <ClinicalReminders
                      patientId={selectedPatient.id}
                      onNotify={(type, message) => setNotify({ type, message })}
                    />

                    {/* AI Summary */}
                    <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl shadow-sm relative overflow-hidden">
                      <div className="absolute right-4 top-4 text-primary/10">
                        <Sparkles className="w-16 h-16" />
                      </div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-primary flex items-center gap-1.5">
                          <Sparkles className="h-4.5 w-4.5" /> AI Health Summary
                        </h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleFetchSummary(selectedPatient.id)}
                          disabled={loadingSummary}
                          className="h-8 w-8 text-primary rounded-full hover:bg-primary/10"
                        >
                          <RefreshCw
                            className={`h-4 w-4 ${loadingSummary ? "animate-spin" : ""}`}
                          />
                        </Button>
                      </div>
                      <p className="text-xs leading-relaxed text-on-surface-variant whitespace-pre-wrap">
                        {aiSummary}
                      </p>
                    </div>
                  </div>

                  {/* Food Logs */}
                  <div className="col-span-12 lg:col-span-8 bg-white border border-outline-variant p-6 rounded-2xl shadow-sm flex flex-col">
                    <h3 className="text-base font-bold text-on-surface mb-6 flex items-center gap-2">
                      <Utensils className="h-5 w-5 text-secondary" /> Patient
                      Meal Logs
                    </h3>
                    {patientLogs.length === 0 ? (
                      <div className="py-12 text-center text-on-surface-variant text-sm border-2 border-dashed border-outline-variant/50 rounded-xl flex flex-col items-center justify-center gap-2">
                        <Utensils className="h-8 w-8 text-outline" />
                        <p className="font-semibold">
                          No food logs found for this patient.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {patientLogs.map((log) => (
                          <div
                            key={log.id}
                            className="border border-outline-variant/60 rounded-xl p-4 bg-surface-bright/50"
                          >
                            <div className="flex flex-col md:flex-row gap-4">
                              {log.image_url && (
                                <div className="w-full md:w-28 h-28 rounded-lg overflow-hidden shrink-0 border border-outline-variant">
                                  <img
                                    src={`http://127.0.0.1:8000${log.image_url}`}
                                    alt={log.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="grow flex flex-col justify-between">
                                <div>
                                  <h4 className="font-bold text-sm text-on-surface">
                                    {log.name}
                                  </h4>
                                  <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                                    {log.description}
                                  </p>
                                  <p className="text-[10px] text-outline font-medium mt-1">
                                    {new Date(log.logged_at).toLocaleString()}
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 border-t border-outline-variant/40 pt-2 text-[11px] text-on-surface-variant">
                                  <span>
                                    Calories:{" "}
                                    <strong>
                                      {Math.round(log.calories_kcal)} kcal
                                    </strong>
                                  </span>
                                  <span>
                                    Sodium:{" "}
                                    <strong>
                                      {Math.round(log.sodium_mg)} mg
                                    </strong>
                                  </span>
                                  <span>
                                    Carbs:{" "}
                                    <strong>{Math.round(log.carbs_g)} g</strong>
                                  </span>
                                  <span>
                                    Protein:{" "}
                                    <strong>
                                      {Math.round(log.protein_g)} g
                                    </strong>
                                  </span>
                                  <span>
                                    Fat:{" "}
                                    <strong>{Math.round(log.fat_g)} g</strong>
                                  </span>
                                  <span>
                                    Potassium:{" "}
                                    <strong>
                                      {Math.round(log.potassium_mg)} mg
                                    </strong>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : activeView === "patients" ? (
              <PatientList
                patients={patients}
                onSelectPatient={handleSelectPatient}
                onNotify={handleNotify}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            ) : activeView === "urgent-tasks" ? (
              <UrgentTasks
                onSelectPatient={handleSelectPatient}
                patients={patients}
                onAlertResolved={fetchData}
              />
            ) : activeView === "messages" ? (
              <ClinicianChatHub
                patients={patients}
                onSelectPatient={(p) => {
                  setActiveChatPatientId(null);
                  handleSelectPatient(p);
                }}
                unreadCounts={unreadCounts}
                setUnreadCounts={setUnreadCounts}
                socket={clinicianSocketRef.current}
                currentUserId={user?.id || 0}
                onActivePatientChange={setActiveChatPatientId}
              />
            ) : (
              // ── MAIN DASHBOARD VIEW ─────────────────────────────────────────
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <MetricCard
                    icon={Users}
                    iconClass="text-secondary"
                    label="Total Patients"
                    value={patients.length.toString()}
                    badge="Active"
                    badgeClass="text-green-700 bg-green-50 px-2 py-0.5 rounded-full"
                    onClick={() => setActiveView("patients")}
                  />
                  <MetricCard
                    icon={AlertCircle}
                    iconClass="text-error"
                    label="High Risk Alerts"
                    value={alerts.length.toString()}
                    badge="Critical"
                    badgeClass="text-red-700 bg-red-50 px-2 py-0.5 rounded-full"
                    onClick={() => setActiveView("urgent-tasks")}
                  />
                </div>

                <div className="grid grid-cols-12 gap-5">
                  <div className="col-span-12 lg:col-span-8 bg-white border border-outline-variant rounded-xl flex flex-col">
                    <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-bright/50 rounded-t-xl">
                      <div>
                        <h2 className="text-lg font-semibold text-on-surface">
                          Urgent Patient Alerts
                        </h2>
                        <p className="text-sm text-on-surface-variant">
                          Requiring immediate clinical intervention
                        </p>
                      </div>
                      <Button
                        onClick={() => setActiveView("patients")}
                        variant="ghost"
                        className="text-secondary text-xs font-bold hover:underline px-2"
                      >
                        View Patient Directory
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-surface-container-low text-on-surface-variant text-[11px] uppercase tracking-wide">
                          <tr>
                            <th className="px-4 py-3 font-medium">
                              Patient Name
                            </th>
                            <th className="px-4 py-3 font-medium">
                              Alert Type
                            </th>
                            <th className="px-4 py-3 font-medium">Detail</th>
                            <th className="px-4 py-3 text-right font-medium">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant">
                          {alerts.length === 0 ? (
                            <tr>
                              <td
                                colSpan={4}
                                className="px-4 py-8 text-center text-sm text-on-surface-variant"
                              >
                                No unresolved patient alerts.
                              </td>
                            </tr>
                          ) : (
                            alerts.map((alert) => {
                              const pat = patients.find(
                                (p) => p.id === alert.patient_id,
                              );
                              const name = pat
                                ? pat.full_name
                                : `Patient #${alert.patient_id}`;
                              const initialsAlert = name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase();
                              return (
                                <tr
                                  key={alert.id}
                                  className="hover:bg-surface-container-lowest transition-colors border-l-4 border-error"
                                >
                                  <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                        {initialsAlert}
                                      </div>
                                      <div>
                                        <p className="text-sm font-bold text-on-surface">
                                          {name}
                                        </p>
                                        <p className="text-[11px] text-on-surface-variant">
                                          ID: #{alert.patient_id}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4">
                                    <span className="bg-error-container text-error text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                      {alert.alert_type}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4">
                                    <p className="text-xs text-on-surface-variant">
                                      {alert.message}
                                    </p>
                                    <p className="text-[10px] text-outline">
                                      {new Date(
                                        alert.created_at,
                                      ).toLocaleString()}
                                    </p>
                                  </td>
                                  <td className="px-4 py-4 text-right">
                                    <Button
                                      onClick={() => {
                                        const p = patients.find(
                                          (pat) => pat.id === alert.patient_id,
                                        );
                                        if (p) handleSelectPatient(p);
                                      }}
                                      size="sm"
                                      className="bg-secondary-container text-on-surface hover:bg-secondary-container/80 text-xs font-bold px-3"
                                    >
                                      Review Logs
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="col-span-12 lg:col-span-4 bg-white border border-outline-variant rounded-xl flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-outline-variant bg-surface-bright/50">
                      <h2 className="text-lg font-semibold text-on-surface">
                        Recent Activity
                      </h2>
                      <p className="text-sm text-on-surface-variant">
                        General system status
                      </p>
                    </div>
                    <div className="p-6 flex flex-col justify-center items-center gap-4 text-center">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <BadgeCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm">System Healthy</h3>
                        <p className="text-xs text-on-surface-variant mt-1">
                          DPA 2012 Compliance Audits Active.
                          <br />
                          HIPAA encryption active.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </SidebarInset>

        {/* Floating Add Patient Button */}
        <button
          onClick={() => setActiveView("patients")}
          className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-90 transition-all z-50 group border-none cursor-pointer"
          title="New Patient"
        >
          <Plus className="h-7 w-7 group-hover:rotate-90 transition-transform" />
          <div className="absolute right-16 bg-on-surface text-surface-container-lowest text-xs font-bold py-2 px-4 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            New Patient
          </div>
        </button>
      </SidebarProvider>

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Patient Account"
        description={`Are you sure you want to delete patient "${deletePatientName}"? This action cannot be undone and will permanently delete all logs and dietary targets.`}
        actionText="Delete Patient"
        onAction={executeDeletePatient}
      />

      {/* NOTIFICATION POPUP */}
      {notify && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div
            className={`flex items-start gap-3 px-5 py-4 rounded-2xl shadow-2xl border max-w-sm w-full ${
              notify.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {notify.type === "success" ? (
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            )}
            <p className="text-sm font-medium flex-1 leading-snug">
              {notify.message}
            </p>
            <button
              onClick={() => setNotify(null)}
              className="text-current opacity-50 hover:opacity-100 transition-opacity bg-transparent border-none cursor-pointer p-0 ml-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicianDashboard;
