import { useState, useEffect } from "react";
import { CheckCircle, HeartPulse, Sparkles } from "lucide-react";
import { ScrollArea, ScrollBar } from "../components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import Footer from "../components/Footer";
import PatientNavbar from "../components/PatientNavbar";

import { apiFetch } from "../api/client";

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

  // ponytail: refetch when PatientDashboard logs a meal via localStorage event
  const fetchData = async () => {
    try {
      const [targetsData, logs] = await Promise.all([
        apiFetch<{ sodium_mg: number }>("/api/patients/targets"),
        apiFetch<
          { calories_kcal: number; sodium_mg: number; logged_at: string }[]
        >("/api/patients/logs?today=true"),
      ]);
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
                <div className="grow min-h-50 relative flex items-end justify-between gap-2 px-1 pt-6">
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
    </div>
  );
};

export default Goals;
