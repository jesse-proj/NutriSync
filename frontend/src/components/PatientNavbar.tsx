// ponytail: Shared patient navbar component — update once, reflects on all patient screens

import { Link } from "react-router-dom";
import { Bell, LogOut, Check } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "../context/AuthContext";
import logoBrand from "../assets/nutrisync.png";
import { useState, useEffect, useRef } from "react";
import { apiFetch } from "../api/client";

type ActivePage = "dashboard" | "reports" | "goals" | "profile";

interface PatientNavbarProps {
  activePage?: ActivePage;
}

const navLinks: { label: string; to: string; page: ActivePage }[] = [
  { label: "Home", to: "/patient/dashboard", page: "dashboard" },
  { label: "Reports", to: "/patient/reports", page: "reports" },
  { label: "Goals", to: "/patient/goals", page: "goals" },
];

const PatientNavbar = ({ activePage }: PatientNavbarProps) => {
  const { user, logout } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await apiFetch("/api/patients/alerts");
        if (data) setAlerts(data);
      } catch (err) {
        console.error("Failed to fetch alerts", err);
      }
    };
    fetchAlerts();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResolveAlert = async (id: number) => {
    try {
      await apiFetch(`/api/patients/alerts/${id}/resolve`, { method: "PATCH" });
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Failed to resolve alert", err);
    }
  };

  const handleRejectAlert = async (id: number) => {
    try {
      await apiFetch(`/api/patients/alerts/${id}/reject`, { method: "PATCH" });
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Failed to reject alert", err);
    }
  };

  return (
    <header className="w-full top-0 sticky z-40 bg-surface shadow-sm border-b border-outline-variant">
      <nav className="flex justify-between items-center h-16 px-6 max-w-7xl mx-auto">
        {/* Left: Logo + nav links */}
        <div className="flex items-center gap-8">
          <Link
            to="/patient/dashboard"
            className="text-xl font-bold text-primary flex items-center gap-2"
          >
            <img src={logoBrand} className="h-12 w-17" alt="NutriSync logo" />
          </Link>

          <div className="hidden md:flex gap-6 items-center">
            {navLinks.map(({ label, to, page }) => (
              <Link
                key={page}
                to={to}
                className={
                  activePage === page
                    ? "text-primary font-semibold border-b-2 border-primary pb-1 text-sm transition-all"
                    : "text-on-surface-variant hover:text-primary transition-colors text-sm"
                }
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right: Bell + profile avatar (clickable) + logout */}
        <div className="flex items-center gap-4">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-2 rounded-full hover:bg-surface-container transition-all text-primary relative cursor-pointer border-none bg-transparent"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              {alerts.length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full ring-2 ring-surface animate-pulse" />
              )}
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-outline-variant py-2 z-50">
                <div className="px-4 py-2 border-b border-outline-variant">
                  <h3 className="font-bold text-sm text-on-surface">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {alerts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-on-surface-variant">
                      No new notifications.
                    </div>
                  ) : (
                    alerts.map((alert) => (
                      <div key={alert.id} className="p-4 border-b border-outline-variant/50 hover:bg-surface-container-lowest transition-colors flex justify-between items-start gap-3">
                        <div>
                          <p className="text-xs text-on-surface-variant mb-1 font-semibold">{alert.alert_type.replace('_', ' ')}</p>
                          <p className="text-sm text-on-surface">{alert.message}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleResolveAlert(alert.id)}
                            className="p-1.5 rounded-full hover:bg-green-100 text-green-600 transition-colors bg-transparent border-none cursor-pointer"
                            title="Mark as read / Accept"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          {alert.alert_type.startsWith("CLINICIAN_LINK") && (
                            <button
                              onClick={() => handleRejectAlert(alert.id)}
                              className="p-1.5 rounded-full hover:bg-red-100 text-red-600 transition-colors bg-transparent border-none cursor-pointer"
                              title="Reject Link"
                            >
                              <span className="font-bold text-sm leading-none px-1">✕</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pl-2 border-l border-outline-variant">
            {/* Clickable avatar → Profile page */}
            <Link
              to="/patient/profile"
              className="flex items-center gap-3 rounded-lg p-1 hover:bg-surface-container transition-all"
              title="Go to Profile"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-primary shrink-0">
                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {user?.full_name?.charAt(0) || "U"}
                </div>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs text-on-surface font-semibold">
                  {user?.full_name}
                </p>
                <p className="text-[10px] text-on-surface-variant">Patient</p>
              </div>
            </Link>

            <Button
              onClick={logout}
              variant="ghost"
              className="p-2 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors ml-1"
              title="Log Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default PatientNavbar;
