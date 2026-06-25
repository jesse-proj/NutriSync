import { useState, useEffect } from "react";
import { CheckCircle, Sparkles } from "lucide-react";
import { ScrollArea, ScrollBar } from "../components/ui/scroll-area";
import Footer from "../components/Footer";
import PatientNavbar from "../components/PatientNavbar";

import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext";

// ponytail: Goals.tsx uses simple React state and inline Tailwind styles for custom progress/charts

const Goals = () => {
  useEffect(() => {
    document.title = "Goals | NutriSync";
  }, []);

  const [weight] = useState<number | null>(null);
  const [sodiumConsumed, setSodiumConsumed] = useState(0);
  const [sodiumTarget, setSodiumTarget] = useState<number | null>(null);
  const [walkingTarget] = useState(5.0);
  const [walkingCompleted, setWalkingCompleted] = useState(0);
  const [loading, setLoading] = useState(true);

  // Checklist state
  const [bpChecked, setBpChecked] = useState(true);
  const [fiberChecked, setFiberChecked] = useState(false);
  const [fluidChecked, setFluidChecked] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [targetsData, logs] = await Promise.all([
          apiFetch<{ sodium_mg: number }>("/api/patients/targets"),
          apiFetch<
            { calories_kcal: number; sodium_mg: number; logged_at: string }[]
          >("/api/patients/logs?limit=30"),
        ]);
        if (targetsData?.sodium_mg != null) {
          setSodiumTarget(targetsData.sodium_mg);
        }
        if (logs && logs.length > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todaySodium = logs
            .filter((l) => new Date(l.logged_at) >= today)
            .reduce((sum, log) => sum + (log.sodium_mg || 0), 0);
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
    fetchData();
  }, []);

  const sodiumPct = Math.min(
    100,
    Math.round((sodiumConsumed / sodiumTarget) * 100),
  );
  const walkingPct = Math.min(
    100,
    Math.round((walkingCompleted / walkingTarget) * 100),
  );

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans relative">
      <PatientNavbar activePage="goals" />

      {/* Main Content */}
      <ScrollArea className="flex-grow w-full">
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
            {/* Left Column: Weight Trends (Bento Style) */}
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
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-extrabold text-primary tracking-tight">
                    {loading ? "—" : weight !== null ? weight : "—"}
                  </span>
                  <span className="text-sm text-on-surface-variant font-medium">
                    kg
                  </span>
                </div>

                {/* Simulated Chart Bars */}
                <div className="flex-grow min-h-[200px] relative flex items-end justify-between gap-2 px-1 pt-6">
                  <div className="w-full absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                    <div className="border-t border-outline"></div>
                    <div className="border-t border-outline"></div>
                    <div className="border-t border-outline"></div>
                    <div className="border-t border-outline"></div>
                  </div>
                  <div className="w-full bg-primary-fixed-dim/40 rounded-t-lg transition-all hover:bg-primary h-[85%]"></div>
                  <div className="w-full bg-primary-fixed-dim/40 rounded-t-lg transition-all hover:bg-primary h-[82%]"></div>
                  <div className="w-full bg-primary-fixed-dim/40 rounded-t-lg transition-all hover:bg-primary h-[78%]"></div>
                  <div className="w-full bg-primary-fixed-dim/40 rounded-t-lg transition-all hover:bg-primary h-[80%]"></div>
                  <div className="w-full bg-primary h-[72%] rounded-t-lg"></div>
                </div>
                <div className="flex justify-between mt-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  <span>Wk 1</span>
                  <span>Wk 2</span>
                  <span>Wk 3</span>
                  <span>Wk 4</span>
                  <span>Now</span>
                </div>
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
                  <span className="text-secondary font-semibold text-sm flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    {sodiumPct <= 100 ? "Under Limit" : "Exceeded"}
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
                  <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded-full transition-all duration-500"
                      style={{ width: `${sodiumPct}%` }}
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
              <div className="bg-primary text-on-primary rounded-2xl p-6 shadow-md relative overflow-hidden">
                <div className="flex gap-4 items-start relative z-10">
                  <div className="shrink-0 w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 bg-white flex items-center justify-center text-primary font-bold text-lg">
                    🤖
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-bold">NutriGabay</h4>
                    <p className="text-xs opacity-90 leading-relaxed">
                      {sodiumTarget === null
                        ? "Loading your sodium target..."
                        : sodiumPct <= 100
                          ? "You're doing great! Your sodium intake is within range. Keep up the fiber goals to maintain heart health."
                          : "Your sodium is above target. Consider reducing high-sodium meals and drink more water."}
                    </p>
                  </div>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-10">
                  <Sparkles className="w-28 h-28 transform rotate-12" />
                </div>
              </div>

              {/* Weekly Checklist */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30">
                <h3 className="text-lg font-bold text-on-surface mb-6">
                  Weekly Checklist
                </h3>
                <div className="flex flex-col gap-4">
                  {/* BP checklist item */}
                  <div
                    onClick={() => setBpChecked(!bpChecked)}
                    className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer"
                  >
                    <div
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${bpChecked ? "bg-primary border-primary text-white" : "border-outline-variant"}`}
                    >
                      {bpChecked && <CheckCircle className="h-4.5 w-4.5" />}
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm font-bold text-on-surface">
                        BP Consistency
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        Measured twice daily
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold ${bpChecked ? "text-secondary" : "text-on-surface-variant"}`}
                    >
                      {bpChecked ? "Done" : "Pending"}
                    </span>
                  </div>

                  {/* Fiber checklist item */}
                  <div
                    onClick={() => setFiberChecked(!fiberChecked)}
                    className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer"
                  >
                    <div
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${fiberChecked ? "bg-primary border-primary text-white" : "border-outline-variant"}`}
                    >
                      {fiberChecked && <CheckCircle className="h-4.5 w-4.5" />}
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm font-bold text-on-surface">
                        Fiber Goals
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        25g daily intake
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold ${fiberChecked ? "text-secondary" : "text-on-surface-variant"}`}
                    >
                      {fiberChecked ? "Done" : "4/7 days"}
                    </span>
                  </div>

                  {/* Fluid checklist item */}
                  <div
                    onClick={() => setFluidChecked(!fluidChecked)}
                    className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer"
                  >
                    <div
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${fluidChecked ? "bg-primary border-primary text-white" : "border-outline-variant"}`}
                    >
                      {fluidChecked && <CheckCircle className="h-4.5 w-4.5" />}
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm font-bold text-on-surface">
                        Fluid Intake
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        2L baseline
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold ${fluidChecked ? "text-secondary" : "text-on-surface-variant"}`}
                    >
                      {fluidChecked ? "Done" : "Pending"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  );
};

export default Goals;
