import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CalendarDays, FlaskConical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

type HistoryEntry = {
  timestamp: number;
  date: string;
  pH?: number;
  chlorine?: number;
  waterTemperature?: number;
  waterLevel?: number;
};

function avg(nums: number[]): number {
  if (!nums.length) return NaN;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function compliance(nums: number[], min: number, max: number): number {
  if (!nums.length) return 0;
  const ok = nums.filter((n) => n >= min && n <= max).length;
  return Math.round((ok / nums.length) * 100);
}

const Analysis = () => {
  const [history, setHistory] = useState<Record<string, HistoryEntry[]>>({});
  const [openReport, setOpenReport] = useState(false);
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);
  const [preset, setPreset] = useState<"7" | "30" | "60" | "all">("30");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/kpi?limit=10000&excludeGranularity=raw');
        const json = await res.json();
        const items: Array<any> = Array.isArray(json?.items) ? json.items : [];
        const byDate: Record<string, HistoryEntry[]> = {};
        for (const it of items) {
          const ts = typeof it?.timestamp === 'number' ? it.timestamp : Date.now();
          const dstr = typeof it?.date === 'string' ? it.date : new Date(ts).toISOString().slice(0, 10);
          const entry: HistoryEntry = {
            timestamp: ts,
            date: dstr,
            pH: typeof it?.pH === 'number' ? it.pH : undefined,
            chlorine: typeof it?.chlorine === 'number' ? it.chlorine : undefined,
            waterTemperature: typeof it?.waterTemperature === 'number' ? it.waterTemperature : undefined,
            waterLevel: typeof it?.waterLevel === 'number' ? it.waterLevel : undefined,
          };
          if (!byDate[dstr]) byDate[dstr] = [];
          byDate[dstr].push(entry);
        }
        setHistory(byDate);
      } catch { }
    };
    load();
    const intId = setInterval(load, 20000);
    return () => clearInterval(intId);
  }, []);

  const last30 = useMemo(() => {
    const dates = Object.keys(history).sort();
    const take = dates.slice(-30);
    return take.map((d) => {
      const entries = history[d] || [];
      const pH = entries.map((e) => e.pH).filter((n): n is number => typeof n === "number");
      const chlorine = entries.map((e) => e.chlorine).filter((n): n is number => typeof n === "number");
      const temp = entries.map((e) => e.waterTemperature).filter((n): n is number => typeof n === "number");
      const level = entries.map((e) => e.waterLevel).filter((n): n is number => typeof n === "number");
      const times = entries.map((e) => e.timestamp).filter((n): n is number => typeof n === "number").sort((a, b) => a - b);
      const startTs = times[0];
      const endTs = times[times.length - 1];
      const toTime = (ts?: number) => ts ? new Date(ts).toLocaleTimeString() : "—";
      return { date: d, pH, chlorine, temp, level, samples: entries.length, startTime: toTime(startTs), endTime: toTime(endTs) };
    });
  }, [history]);

  const avgPH = useMemo(() => avg(last30.flatMap((d) => d.pH)), [last30]);
  const avgChlorine = useMemo(() => avg(last30.flatMap((d) => d.chlorine)), [last30]);
  const tempCompliance = useMemo(() => compliance(last30.flatMap((d) => d.temp), 26, 30), [last30]);
  const tempConsistency = tempCompliance >= 90 ? "High" : tempCompliance >= 70 ? "Moderate" : "Low";

  const allDaily = useMemo(() => {
    const dates = Object.keys(history).sort();
    return dates.map((d) => {
      const entries = history[d] || [];
      const pH = entries.map((e) => e.pH).filter((n): n is number => typeof n === "number");
      const chlorine = entries.map((e) => e.chlorine).filter((n): n is number => typeof n === "number");
      const temp = entries.map((e) => e.waterTemperature).filter((n): n is number => typeof n === "number");
      const level = entries.map((e) => e.waterLevel).filter((n): n is number => typeof n === "number");
      return { date: d, ph: avg(pH), chlorine: avg(chlorine), temp: avg(temp), level: avg(level) };
    });
  }, [history]);

  const filteredDaily = useMemo(() => {
    let base = allDaily;
    if (preset !== "all" && !fromDate && !toDate) {
      const n = Number(preset);
      base = allDaily.slice(-n);
    }
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    if (from || to) {
      base = base.filter((d) => {
        const dd = new Date(d.date);
        const okFrom = from ? dd >= new Date(from.getFullYear(), from.getMonth(), from.getDate()) : true;
        const okTo = to ? dd <= new Date(to.getFullYear(), to.getMonth(), to.getDate()) : true;
        return okFrom && okTo;
      });
    }
    return base;
  }, [allDaily, fromDate, toDate, preset]);

  const downloadCsv = () => {
    const header = ["Date", "Avg pH", "Avg Chlorine (mg/L)", "Avg Temp (°C)"];
    const rows = last30.map((d) => [
      d.date,
      avg(d.pH).toFixed(2),
      avg(d.chlorine).toFixed(2),
      avg(d.temp).toFixed(2),
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chemical-usage-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };



  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Historical Reports and Analysis</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-blue-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-blue-600" />
              <CardTitle>30-Day Health Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Overall pool quality is summarized across pH, chlorine, and temperature consistency for the last 30 days.
            </p>
            <ul className="text-sm list-disc pl-5 space-y-1">
              <li>Average pH: {Number.isFinite(avgPH) ? avgPH.toFixed(2) : "—"}</li>
              <li>Average Chlorine: {Number.isFinite(avgChlorine) ? avgChlorine.toFixed(2) : "—"} mg/L</li>
              <li>Temperature Consistency: {tempConsistency} ({tempCompliance}% within 26–30°C)</li>
            </ul>
            <button onClick={() => setOpenReport(true)} className="mt-4 inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-white text-sm hover:bg-blue-700">
              View Detailed Report
            </button>
          </CardContent>
        </Card>

        <Card className="border-amber-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-amber-600" />
              <CardTitle>Chemical Usage Log</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Export daily averages to CSV to track consumption and optimize costs.
            </p>
            <ul className="text-sm list-disc pl-5 space-y-1">
              <li>Chlorine average (30d): {Number.isFinite(avgChlorine) ? avgChlorine.toFixed(2) : "—"} mg/L</li>
              <li>pH average (30d): {Number.isFinite(avgPH) ? avgPH.toFixed(2) : "—"}</li>
              <li>Temperature average (30d): {Number.isFinite(avg(last30.flatMap(d => d.temp))) ? avg(last30.flatMap(d => d.temp)).toFixed(2) : "—"} °C</li>
            </ul>
            <button onClick={downloadCsv} className="mt-4 inline-flex items-center rounded-md bg-amber-600 px-3 py-2 text-white text-sm hover:bg-amber-700">
              Download CSV
            </button>
          </CardContent>
        </Card>


      </div>

      <Card className="border-blue-300">
        <CardHeader>
          <CardTitle>Daily KPI Averages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex flex-wrap items-end gap-2">
            <div className="grid gap-1">
              <span className="text-xs text-muted-foreground">From</span>
              <Input type="date" value={fromDate ?? ""} onChange={(e) => setFromDate(e.target.value || null)} className="w-40" />
            </div>
            <div className="grid gap-1">
              <span className="text-xs text-muted-foreground">To</span>
              <Input type="date" value={toDate ?? ""} onChange={(e) => setToDate(e.target.value || null)} className="w-40" />
            </div>
            <div className="grid gap-1">
              <span className="text-xs text-muted-foreground">Preset</span>
              <div className="flex gap-1">
                <Button variant={preset === "7" ? "default" : "outline"} size="sm" onClick={() => { setPreset("7"); setFromDate(null); setToDate(null); }}>Last 7d</Button>
                <Button variant={preset === "30" ? "default" : "outline"} size="sm" onClick={() => { setPreset("30"); setFromDate(null); setToDate(null); }}>Last 30d</Button>
                <Button variant={preset === "60" ? "default" : "outline"} size="sm" onClick={() => { setPreset("60"); setFromDate(null); setToDate(null); }}>Last 60d</Button>
                <Button variant={preset === "all" ? "default" : "outline"} size="sm" onClick={() => { setPreset("all"); setFromDate(null); setToDate(null); }}>All</Button>
              </div>
            </div>
          </div>
          <ChartContainer
            config={{
              ph: { label: "pH", color: "hsl(210 90% 50%)" },
              chlorine: { label: "Chlorine (mg/L)", color: "hsl(0 80% 60%)" },
              temp: { label: "Temperature (°C)", color: "hsl(180 70% 40%)" },
              level: { label: "Level (%)", color: "hsl(270 70% 50%)" },
            }}
          >
            <LineChart data={filteredDaily} margin={{ top: 10, right: 24, bottom: 0, left: 12 }}>
              <CartesianGrid stroke="#6b7280" strokeOpacity={0.12} />
              <XAxis dataKey="date" tick={{ fill: "currentColor", fontSize: 11 }} stroke="currentColor" />
              <YAxis tick={{ fill: "currentColor", fontSize: 11 }} stroke="currentColor" />
              <ChartTooltip />
              <ChartLegend content={<ChartLegendContent />} />
              <Line type="monotone" dataKey="ph" stroke="var(--color-ph)" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="chlorine" stroke="var(--color-chlorine)" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="temp" stroke="var(--color-temp)" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="level" stroke="var(--color-level)" dot={false} strokeWidth={2} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Dialog open={openReport} onOpenChange={setOpenReport}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>30-Day Daily Averages</DialogTitle>
            <DialogDescription>Daily averaged pH, chlorine, temperature, and water level with time range</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 pt-0">
            <div className="border rounded-md">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                  <tr className="text-muted-foreground border-b">
                    <th className="text-left font-medium px-4 py-3 bg-muted/50">Date</th>
                    <th className="text-left font-medium px-4 py-3 bg-muted/50">Start</th>
                    <th className="text-left font-medium px-4 py-3 bg-muted/50">End</th>
                    <th className="text-left font-medium px-4 py-3 bg-muted/50">Avg pH</th>
                    <th className="text-left font-medium px-4 py-3 bg-muted/50">Avg Chlorine</th>
                    <th className="text-left font-medium px-4 py-3 bg-muted/50">Avg Temp</th>
                    <th className="text-left font-medium px-4 py-3 bg-muted/50">Avg Level</th>
                    <th className="text-left font-medium px-4 py-3 bg-muted/50">Samples</th>
                  </tr>
                </thead>
                <tbody>
                  {last30.map((d, i) => (
                    <tr key={d.date} className={`border-b last:border-0 hover:bg-muted/50 transition-colors ${i % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}>
                      <td className="px-4 py-3 text-foreground font-medium">{d.date}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{d.startTime}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{d.endTime}</td>
                      <td className="px-4 py-3 text-foreground">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${avg(d.pH) >= 7.2 && avg(d.pH) <= 7.8 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {Number.isFinite(avg(d.pH)) ? avg(d.pH).toFixed(2) : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground">{Number.isFinite(avg(d.chlorine)) ? avg(d.chlorine).toFixed(2) : "—"} mg/L</td>
                      <td className="px-4 py-3 text-foreground">{Number.isFinite(avg(d.temp)) ? avg(d.temp).toFixed(2) : "—"} °C</td>
                      <td className="px-4 py-3 text-foreground">{Number.isFinite(avg(d.level)) ? avg(d.level).toFixed(2) : "—"} %</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{d.samples}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Analysis;
