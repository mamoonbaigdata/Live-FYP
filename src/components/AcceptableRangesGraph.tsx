import {
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Bar,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";

const RANGES = {
  ph: { min: 7.4, max: 7.6, color: "#3b82f6" }, // blue
  chlorine: { min: 1.5, max: 2.0, color: "#06b6d4" }, // teal/cyan
  temperature: { min: 26, max: 28, color: "#f59e0b" }, // amber
};

// Simplified, rounded axis domains and ticks (0, mid, max)
const AXES = {
  ph: [0, 10] as [number, number],
  chlorine: [0, 5] as [number, number],
  temperature: [0, 40] as [number, number],
};
const ticks = (domain: [number, number]) => [domain[0], Math.round((domain[0] + domain[1]) / 2), domain[1]];

function RangeRow(min: number, max: number, label: string) {
  return [{ label, offset: min, span: max - min }];
}

export default function AcceptableRangesGraph() {
  const phData = RangeRow(RANGES.ph.min, RANGES.ph.max, "pH");
  const chlorineData = RangeRow(RANGES.chlorine.min, RANGES.chlorine.max, "Chlorine (ppm)");
  const temperatureData = RangeRow(RANGES.temperature.min, RANGES.temperature.max, "Temperature (°C)");

  return (
    <div className="w-full rounded-lg border border-border/40 bg-transparent">
      <div className="px-4 pt-4">
        <h3 className="text-base font-semibold text-foreground">Standard Values for KPI's</h3>
        <p className="text-xs text-muted-foreground">Visualizing target ranges for pH, Chlorine, and Temperature</p>
      </div>

      <div className="p-3 space-y-8">
        {/* pH Range */}
        <div className="h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={phData} layout="vertical" margin={{ top: 10, right: 24, bottom: 0, left: 10 }}>
              <defs>
                <linearGradient id="grad-ph" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={RANGES.ph.color} stopOpacity={0.85} />
                  <stop offset="100%" stopColor={RANGES.ph.color} stopOpacity={0.55} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#6b7280" strokeOpacity={0.12} horizontal={true} vertical={false} />
              <XAxis type="number" domain={AXES.ph} ticks={ticks(AXES.ph)} tick={{ fill: "currentColor", fontSize: 11 }} stroke="currentColor" />
              <YAxis type="category" dataKey="label" tick={{ fill: "currentColor", fontSize: 14, fontWeight: 600 }} stroke="currentColor" width={120} tickLine={false} axisLine={false} />
              {/* Reference translucent green band over target range */}
              <ReferenceArea x1={RANGES.ph.min} x2={RANGES.ph.max} fill="rgba(34,197,94,0.12)" stroke="rgba(34,197,94,0.3)" strokeOpacity={0.3} />
              {/* Range band with gradient fill and border outline */}
              <Bar dataKey="offset" stackId="ph" fill="transparent" isAnimationActive={false} />
              <Bar dataKey="span" stackId="ph" fill="url(#grad-ph)" stroke={RANGES.ph.color} strokeWidth={1.5} radius={[6, 6, 6, 6]} isAnimationActive animationDuration={700} animationBegin={100} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-1 text-xs text-muted-foreground">Target: {RANGES.ph.min}–{RANGES.ph.max}</div>
        </div>

        {/* Chlorine Range */}
        <div className="h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chlorineData} layout="vertical" margin={{ top: 10, right: 24, bottom: 0, left: 10 }}>
              <defs>
                <linearGradient id="grad-chlorine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={RANGES.chlorine.color} stopOpacity={0.85} />
                  <stop offset="100%" stopColor={RANGES.chlorine.color} stopOpacity={0.55} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#6b7280" strokeOpacity={0.12} horizontal={true} vertical={false} />
              <XAxis type="number" domain={AXES.chlorine} ticks={ticks(AXES.chlorine)} tick={{ fill: "currentColor", fontSize: 11 }} stroke="currentColor" />
              <YAxis type="category" dataKey="label" tick={{ fill: "currentColor", fontSize: 14, fontWeight: 600 }} stroke="currentColor" width={120} tickLine={false} axisLine={false} />
              <ReferenceArea x1={RANGES.chlorine.min} x2={RANGES.chlorine.max} fill="rgba(34,197,94,0.12)" stroke="rgba(34,197,94,0.3)" strokeOpacity={0.3} />
              <Bar dataKey="offset" stackId="chlorine" fill="transparent" isAnimationActive={false} />
              <Bar dataKey="span" stackId="chlorine" fill="url(#grad-chlorine)" stroke={RANGES.chlorine.color} strokeWidth={1.5} radius={[6, 6, 6, 6]} isAnimationActive animationDuration={700} animationBegin={150} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-1 text-xs text-muted-foreground">Target: {RANGES.chlorine.min}–{RANGES.chlorine.max} ppm</div>
        </div>

        {/* Temperature Range */}
        <div className="h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={temperatureData} layout="vertical" margin={{ top: 10, right: 24, bottom: 0, left: 10 }}>
              <defs>
                <linearGradient id="grad-temperature" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={RANGES.temperature.color} stopOpacity={0.85} />
                  <stop offset="100%" stopColor={RANGES.temperature.color} stopOpacity={0.55} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#6b7280" strokeOpacity={0.12} horizontal={true} vertical={false} />
              <XAxis type="number" domain={AXES.temperature} ticks={ticks(AXES.temperature)} tick={{ fill: "currentColor", fontSize: 11 }} stroke="currentColor" />
              <YAxis type="category" dataKey="label" tick={{ fill: "currentColor", fontSize: 14, fontWeight: 600 }} stroke="currentColor" width={120} tickLine={false} axisLine={false} />
              <ReferenceArea x1={RANGES.temperature.min} x2={RANGES.temperature.max} fill="rgba(34,197,94,0.12)" stroke="rgba(34,197,94,0.3)" strokeOpacity={0.3} />
              <Bar dataKey="offset" stackId="temperature" fill="transparent" isAnimationActive={false} />
              <Bar dataKey="span" stackId="temperature" fill="url(#grad-temperature)" stroke={RANGES.temperature.color} strokeWidth={1.5} radius={[6, 6, 6, 6]} isAnimationActive animationDuration={700} animationBegin={200} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-1 text-xs text-muted-foreground">Target: {RANGES.temperature.min}–{RANGES.temperature.max} °C</div>
        </div>
      </div>
    </div>
  );
}

