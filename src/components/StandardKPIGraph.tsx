import { ChartContainer } from "@/components/ui/chart";
import {
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceArea,
  Bar,
} from "recharts";

const STANDARD = {
  ph: { min: 7.4, max: 7.6 },
  chlorine: { min: 1.0, max: 3.0 },
  temperature: { min: 22, max: 27 },
  waterLevel: { min: 70, max: 90 },
};

const chartConfig = {
  ph: { label: "pH", color: "hsl(var(--water-medium))" },
  chlorine: { label: "Chlorine", color: "hsl(var(--accent))" },
  temperature: { label: "Temperature", color: "hsl(var(--water-bright))" },
  waterLevel: { label: "Water Level", color: "hsl(var(--primary))" },
};

type HistoryPoint = { time: number; pH: number; chlorine: number; waterTemperature: number; waterLevel: number };

export default function StandardKPIGraph({ history = [] as HistoryPoint[] }: { history?: HistoryPoint[] }) {
  // We visualize alert conditions (standard ranges) as bar segments, not live lines
  const data = Array.from({ length: 16 }, (_, i) => ({
    x: i,
    ph_low: STANDARD.ph.min,
    ph_ok: STANDARD.ph.max - STANDARD.ph.min,
    chlorine_low: STANDARD.chlorine.min,
    chlorine_ok: STANDARD.chlorine.max - STANDARD.chlorine.min,
    temperature_low: STANDARD.temperature.min,
    temperature_ok: STANDARD.temperature.max - STANDARD.temperature.min,
    waterLevel_low: STANDARD.waterLevel.min,
    waterLevel_ok: STANDARD.waterLevel.max - STANDARD.waterLevel.min,
  }));
  return (
    <div className="w-full rounded-lg border border-border/40 bg-transparent">
      <div className="px-4 pt-4">
        <h3 className="text-sm font-semibold text-foreground/90">Standard KPI Ranges</h3>
        <p className="text-xs text-muted-foreground">Transparent ranges indicate recommended values</p>
      </div>
      <div className="p-2" style={{ height: 260 }}>
        <ChartContainer config={chartConfig} className="bg-transparent">
          <ComposedChart data={data} margin={{ top: 10, right: 24, bottom: 0, left: 0 }}>
            <CartesianGrid strokeOpacity={0.15} vertical={false} />
            <XAxis dataKey="x" tick={false} axisLine={false} />
            {/* Individual axes per metric, hidden but set domains */}
            <YAxis yAxisId="ph" domain={[0, 14]} hide />
            <YAxis yAxisId="chlorine" domain={[0, 5]} hide />
            <YAxis yAxisId="temperature" domain={[0, 40]} hide />
            <YAxis yAxisId="waterLevel" domain={[0, 100]} hide />

            {/* Transparent standard ranges */}
            <ReferenceArea
              x1={0}
              x2={data.length - 1}
              yAxisId="ph"
              y1={STANDARD.ph.min}
              y2={STANDARD.ph.max}
              fill="var(--color-ph)"
              fillOpacity={0.18}
              stroke="var(--color-ph)"
              strokeOpacity={0.35}
            />
            <ReferenceArea
              x1={0}
              x2={data.length - 1}
              yAxisId="chlorine"
              y1={STANDARD.chlorine.min}
              y2={STANDARD.chlorine.max}
              fill="var(--color-chlorine)"
              fillOpacity={0.18}
              stroke="var(--color-chlorine)"
              strokeOpacity={0.35}
            />
            <ReferenceArea
              x1={0}
              x2={data.length - 1}
              yAxisId="temperature"
              y1={STANDARD.temperature.min}
              y2={STANDARD.temperature.max}
              fill="var(--color-temperature)"
              fillOpacity={0.18}
              stroke="var(--color-temperature)"
              strokeOpacity={0.35}
            />
            <ReferenceArea
              x1={0}
              x2={data.length - 1}
              yAxisId="waterLevel"
              y1={STANDARD.waterLevel.min}
              y2={STANDARD.waterLevel.max}
              fill="var(--color-waterLevel)"
              fillOpacity={0.18}
              stroke="var(--color-waterLevel)"
              strokeOpacity={0.35}
            />
            {/* Alert condition bars: show the acceptable range as a highlighted segment */}
            <Bar dataKey="ph_low" yAxisId="ph" stackId="ph" fill="transparent" isAnimationActive={false} />
            <Bar dataKey="ph_ok" yAxisId="ph" stackId="ph" fill="var(--color-ph)" fillOpacity={0.3} isAnimationActive={false} />

            <Bar dataKey="chlorine_low" yAxisId="chlorine" stackId="chlorine" fill="transparent" isAnimationActive={false} />
            <Bar dataKey="chlorine_ok" yAxisId="chlorine" stackId="chlorine" fill="var(--color-chlorine)" fillOpacity={0.3} isAnimationActive={false} />

            <Bar dataKey="temperature_low" yAxisId="temperature" stackId="temperature" fill="transparent" isAnimationActive={false} />
            <Bar dataKey="temperature_ok" yAxisId="temperature" stackId="temperature" fill="var(--color-temperature)" fillOpacity={0.3} isAnimationActive={false} />

            <Bar dataKey="waterLevel_low" yAxisId="waterLevel" stackId="waterLevel" fill="transparent" isAnimationActive={false} />
            <Bar dataKey="waterLevel_ok" yAxisId="waterLevel" stackId="waterLevel" fill="var(--color-waterLevel)" fillOpacity={0.3} isAnimationActive={false} />
          </ComposedChart>
        </ChartContainer>
      </div>
      <div className="px-4 pb-4 flex flex-wrap gap-3 text-xs">
        <LegendItem colorVar="--color-ph" label="pH" range={`${STANDARD.ph.min}–${STANDARD.ph.max}`} />
        <LegendItem colorVar="--color-chlorine" label="Chlorine" range={`${STANDARD.chlorine.min}–${STANDARD.chlorine.max} ppm`} />
        <LegendItem colorVar="--color-temperature" label="Temperature" range={`${STANDARD.temperature.min}–${STANDARD.temperature.max} °C`} />
        <LegendItem colorVar="--color-waterLevel" label="Water Level" range={`${STANDARD.waterLevel.min}–${STANDARD.waterLevel.max}%`} />
      </div>
    </div>
  );
}

function LegendItem({ colorVar, label, range }: { colorVar: string; label: string; range: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block h-2.5 w-2.5 rounded-[3px]"
        style={{ backgroundColor: `var(${colorVar})` }}
      />
      <span className="text-foreground/90 font-medium">{label}:</span>
      <span className="text-muted-foreground">{range}</span>
    </div>
  );
}

