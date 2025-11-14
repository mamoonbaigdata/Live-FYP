import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ReferenceArea } from "recharts";

const chartConfig = {
  chlorine: { label: "Chlorine (ppm)", color: "hsl(210 90% 50%)" },
};

// Months with values kept within the 1.5–2.0 ppm standard range
const data = [
  { month: "Jan", chlorine: 1.7 },
  { month: "Feb", chlorine: 1.6 },
  { month: "Mar", chlorine: 1.55 },
  { month: "Apr", chlorine: 1.8 },
  { month: "May", chlorine: 1.75 },
  { month: "Jun", chlorine: 1.65 },
  { month: "Jul", chlorine: 1.9 },
  { month: "Aug", chlorine: 1.7 },
  { month: "Sep", chlorine: 1.85 },
];

export default function ChlorineStandardChart() {
  return (
    <div className="w-full rounded-lg border border-border/40 bg-transparent">
      <div className="px-4 pt-4">
        <h3 className="text-sm font-semibold text-foreground/90">Standard Value — Chlorine</h3>
        <p className="text-xs text-muted-foreground">Acceptable range 1.5–2.0 ppm (Jan–Sep)</p>
      </div>
      <div className="p-2" style={{ height: 260 }}>
        <ChartContainer config={chartConfig} className="bg-transparent">
          <AreaChart data={data} margin={{ top: 10, right: 24, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="chlorineFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chlorine)" stopOpacity={0.55} />
                <stop offset="100%" stopColor="var(--color-chlorine)" stopOpacity={0.12} />
              </linearGradient>
            </defs>

            {/* Faint vertical grid lines */}
            <CartesianGrid strokeOpacity={0.12} vertical={true} horizontal={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} />
            <YAxis domain={[1.0, 2.5]} axisLine={false} tickLine={false} />

            {/* Hover cursor with translucent vertical highlight */}
            <ChartTooltip cursor={{ fill: "hsla(210,85%,55%,0.10)" }} />

            {/* Acceptable band 1.5–2.0 ppm */}
            <ReferenceArea y1={1.5} y2={2.0} fill="hsla(210, 85%, 55%, 0.10)" strokeOpacity={0} />

            {/* Single smooth area line */}
            <Area
              type="monotone"
              dataKey="chlorine"
              stroke="var(--color-chlorine)"
              strokeWidth={3}
              fill="url(#chlorineFill)"
              dot={false}
              activeDot={{ r: 6, stroke: "var(--color-chlorine)", strokeWidth: 2, fill: "#fff" }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  );
}