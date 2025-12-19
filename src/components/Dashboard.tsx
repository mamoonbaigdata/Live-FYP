import { useRef, useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database, firebaseEnabled } from "@/lib/firebase";
import MetricCard from "./MetricCard";
import { Droplets, Thermometer, Beaker, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useWaterData } from "@/providers/WaterDataProvider";
import NaegleriaRiskCard from "./NaegleriaRiskCard";


interface WaterData {
  pH: number;
  chlorine: number;
  waterTemperature: number;
  waterLevel: number;
}
type HistoryPoint = { time: number; pH: number; chlorine: number; waterTemperature: number; waterLevel: number };

const Dashboard = () => {
  const { data, isConnected, lastUpdate } = useWaterData();

  // Chart data state
  const [dailyAverages, setDailyAverages] = useState<Array<{ date: string; temp: number; ph: number; chlorine: number; level: number }>>([]);
  const [storedSeries, setStoredSeries] = useState<Array<{ time: string; temp?: number; ph?: number; chlorine?: number; level?: number }>>([]);
  const [todayAvgTemp, setTodayAvgTemp] = useState<number | null>(null);

  // Note: Alerts and Data Simulation/Fetching are now handled globally in WaterDataProvider



  // Subscribe to daily history and compute averages
  useEffect(() => {
    if (!firebaseEnabled || !database) return;

    const historyRef = ref(database, 'waterQualityHistory');
    const unsub = onValue(historyRef, (snap) => {
      const val = snap.val();
      if (!val || typeof val !== 'object') {
        setDailyAverages([]);
        setTodayAvgTemp(null);
        return;
      }
      const entries = Object.entries(val) as Array<[string, any]>;
      const dayAverages: Array<{ date: string; temp: number; ph: number; chlorine: number; level: number }> = entries.map(([date, list]) => {
        const arr = Array.isArray(list) ? list : list && typeof list === 'object' ? Object.values(list) : [];
        const temps = arr.map((it: any) => typeof it?.waterTemperature === 'number' ? it.waterTemperature : parseFloat(String(it?.waterTemperature ?? 'NaN'))).filter((n: number) => Number.isFinite(n));
        const phs = arr.map((it: any) => typeof it?.pH === 'number' ? it.pH : parseFloat(String(it?.pH ?? 'NaN'))).filter((n: number) => Number.isFinite(n));
        const chlorines = arr.map((it: any) => typeof it?.chlorine === 'number' ? it.chlorine : parseFloat(String(it?.chlorine ?? 'NaN'))).filter((n: number) => Number.isFinite(n));
        const levels = arr.map((it: any) => typeof it?.waterLevel === 'number' ? it.waterLevel : parseFloat(String(it?.waterLevel ?? 'NaN'))).filter((n: number) => Number.isFinite(n));
        const avgT = temps.length ? temps.reduce((a: number, b: number) => a + b, 0) / temps.length : NaN;
        const avgPH = phs.length ? phs.reduce((a: number, b: number) => a + b, 0) / phs.length : NaN;
        const avgCl = chlorines.length ? chlorines.reduce((a: number, b: number) => a + b, 0) / chlorines.length : NaN;
        const avgLvl = levels.length ? levels.reduce((a: number, b: number) => a + b, 0) / levels.length : NaN;
        return { date, temp: avgT, ph: avgPH, chlorine: avgCl, level: avgLvl };
      }).filter(d => Number.isFinite(d.temp) || Number.isFinite(d.ph) || Number.isFinite(d.chlorine) || Number.isFinite(d.level));
      dayAverages.sort((a, b) => a.date.localeCompare(b.date));

      // limit to recent 7 days for chart
      const recent = dayAverages.slice(-7);
      setDailyAverages(recent);

      // chart data now sourced from Mongo via /api/kpi in another effect

      const todayStr = (() => {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      })();
      const today = dayAverages.find(d => d.date === todayStr);
      setTodayAvgTemp(today && Number.isFinite(today.temp) ? today.temp : null);
    }, (err) => {
      console.error('History read error:', err);
    });

    return () => unsub();
  }, [firebaseEnabled, database]);

  // Subscribe to 10-min stored averages for chart
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/kpi?limit=72');
        const json = await res.json();
        const items: Array<any> = Array.isArray(json?.items) ? json.items : [];
        const cleaned = items
          .filter(it => typeof it?.timestamp === 'number')
          .map(it => ({
            ts: it.timestamp as number,
            temp: typeof it?.waterTemperature === 'number' ? it.waterTemperature : parseFloat(String(it?.waterTemperature ?? 'NaN')),
            ph: typeof it?.pH === 'number' ? it.pH : parseFloat(String(it?.pH ?? 'NaN')),
            chlorine: typeof it?.chlorine === 'number' ? it.chlorine : parseFloat(String(it?.chlorine ?? 'NaN')),
            level: typeof it?.waterLevel === 'number' ? it.waterLevel : parseFloat(String(it?.waterLevel ?? 'NaN')),
            dateStr: typeof it?.date === 'string' ? it.date : undefined,
          }))
          .filter(it => [it.temp, it.ph, it.chlorine, it.level].some(n => Number.isFinite(n as number)));
        cleaned.sort((a, b) => a.ts - b.ts);
        const last72 = cleaned.slice(-72);
        const series = last72.map(e => {
          const d = new Date(e.ts);
          const hh = String(d.getHours()).padStart(2, '0');
          const mm = String(d.getMinutes()).padStart(2, '0');
          return {
            time: `${hh}:${mm}`,
            temp: Number.isFinite(e.temp) ? e.temp : undefined,
            ph: Number.isFinite(e.ph) ? e.ph : undefined,
            chlorine: Number.isFinite(e.chlorine) ? e.chlorine : undefined,
            level: Number.isFinite(e.level) ? e.level : undefined,
          };
        });
        setStoredSeries(series);

        const todayStr = (() => {
          const now = new Date();
          const yyyy = now.getFullYear();
          const mm = String(now.getMonth() + 1).padStart(2, '0');
          const dd = String(now.getDate()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd}`;
        })();
        const todays = items.filter(it => it?.date === todayStr && Number.isFinite(parseFloat(String(it?.waterTemperature ?? 'NaN'))));
        const tvals = todays.map(it => typeof it?.waterTemperature === 'number' ? it.waterTemperature : parseFloat(String(it?.waterTemperature))).filter(n => Number.isFinite(n));
        const avgToday = tvals.length ? tvals.reduce((a, b) => a + b, 0) / tvals.length : NaN;
        setTodayAvgTemp(Number.isFinite(avgToday) ? avgToday : null);
      } catch { }
    };
    load();
    const intId = setInterval(load, 15000);
    return () => clearInterval(intId);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--gradient-flow)] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2 flex items-center justify-center gap-3">
            <img src="/dashboard-logo.png" alt="Smart Pool Logo" className="h-20 w-auto object-contain drop-shadow-sm" />
            Water Quality Monitor
          </h1>
          <div className="flex items-center justify-center gap-4">
            <p className="text-muted-foreground text-lg">Real-time monitoring dashboard</p>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-sm text-muted-foreground">
                {isConnected ? 'Live' : 'Disconnected'}
              </span>
            </div>
          </div>
          {lastUpdate && (
            <p className="text-xs text-muted-foreground mt-2">
              Last update: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>



        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="pH Level"
            value={data.pH}
            unit="pH"
            icon={<Droplets className="w-8 h-8 text-water-medium" />}
            min={0}
            max={14}
            colors={["hsl(var(--water-medium))", "hsl(var(--muted))"]}
            targetMin={7.4}
            targetMax={7.6}
            borderDelta={0.1}
            iconAnimationClass="animate-pulse"
          />

          <MetricCard
            title="Chlorine"
            value={data.chlorine}
            unit="ppm"
            icon={<Beaker className="w-8 h-8 text-accent" />}
            min={0}
            max={5}
            colors={["hsl(var(--accent))", "hsl(var(--muted))"]}
            targetMin={1.5}
            targetMax={2.0}
            borderDelta={0.2}
            iconAnimationClass="animate-pulse"
          />

          <MetricCard
            title="Temperature"
            value={data.waterTemperature}
            unit="°C"
            icon={<Thermometer className="w-8 h-8 text-water-bright" />}
            min={0}
            max={40}
            colors={["hsl(var(--water-bright))", "hsl(var(--muted))"]}
            targetMin={26}
            targetMax={28}
            borderDelta={1}
            iconAnimationClass="animate-pulse"
          />

          <MetricCard
            title="Water Level"
            value={data.waterLevel}
            unit="cm"
            icon={<Activity className="w-8 h-8 text-blue-500" />}
            min={0}
            max={100}
            colors={["#3b82f6", "hsl(var(--muted))"]}
            targetMin={80}
            targetMax={95}
            borderDelta={5}
            iconAnimationClass="animate-pulse"
          />
        </div>



        <div className="mt-8">
          <NaegleriaRiskCard data={data} />
        </div>

        <div className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-foreground">Recent Temperature Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={storedSeries.map(d => ({ time: d.time, value: typeof d.temp === 'number' ? Number(d.temp.toFixed(2)) : undefined }))} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <Tooltip labelFormatter={(label: string) => `Time: ${label}`} />
                      <Line type="monotone" dataKey="value" name="Temperature (°C)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  {todayAvgTemp !== null ? (
                    <span>Today average temperature: <span className="text-foreground font-medium">{todayAvgTemp.toFixed(2)} °C</span></span>
                  ) : (
                    <span>No readings recorded today yet.</span>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-foreground">Recent pH Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={storedSeries.map(d => ({ time: d.time, value: typeof d.ph === 'number' ? Number(d.ph.toFixed(2)) : undefined }))} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <Tooltip labelFormatter={(label: string) => `Time: ${label}`} />
                      <Line type="monotone" dataKey="value" name="pH" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-foreground">Recent Chlorine Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={storedSeries.map(d => ({ time: d.time, value: typeof d.chlorine === 'number' ? Number(d.chlorine.toFixed(2)) : undefined }))} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <Tooltip labelFormatter={(label: string) => `Time: ${label}`} />
                      <Line type="monotone" dataKey="value" name="Chlorine (mg/L)" stroke="#14b8a6" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-foreground">Recent Water Level Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={storedSeries.map(d => ({ time: d.time, value: typeof d.level === 'number' ? Number(d.level.toFixed(2)) : undefined }))} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <Tooltip labelFormatter={(label: string) => `Time: ${label}`} />
                      <Line type="monotone" dataKey="value" name="Water Level (cm)" stroke="#6366f1" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Removed standalone Chlorine standard chart per request */}

        <div className="mt-8 p-4 bg-card/50 backdrop-blur-sm rounded-lg border border-border/50">
          <div className="flex items-start gap-3">
            <Activity className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">Real-time Data</h2>
              <p className="text-sm text-muted-foreground">
                pH, Temperature, and Water Level update from Firebase Realtime Database. Chlorine remains app-managed.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Averaged KPIs are saved every 10 minutes to <code className="bg-muted px-2 py-1 rounded">/storedvalues</code>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
