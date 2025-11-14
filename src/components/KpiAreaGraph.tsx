import { ChartContainer, ChartTooltip, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import {
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
} from "recharts";

const chartConfig = {
  blue: { label: "pH Trend", color: "hsl(210 90% 50%)" },
  red: { label: "Chlorine Trend", color: "hsl(0 80% 60%)" },
};

const data = [
  { month: "Jan", blue: 105, red: 100 },
  { month: "Feb", blue: 75, red: 40 },
  { month: "Mar", blue: 70, red: 30 },
  { month: "Apr", blue: 95, red: 80 },
  { month: "May", blue: 120, red: 95 },
  { month: "Jun", blue: 125, red: 55 },
  { month: "Jul", blue: 115, red: 85 },
  { month: "Aug", blue: 110, red: 90 },
  { month: "Sep", blue: 160, red: 45 },
];

export default function KpiAreaGraph() {
  return (
    <div className="w-full rounded-lg border border-border/40 bg-transparent">
      <div className="px-4 pt-4">
        <h3 className="text-sm font-semibold text-foreground/90">KPI Trends</h3>
        <p className="text-xs text-muted-foreground">Smooth area lines with hover highlight (months Jan–Sep)</p>
      </div>
      <div className="p-2" style={{ height: 280 }}>
        <ChartContainer config={chartConfig} className="bg-transparent">
          <AreaChart data={data} margin={{ top: 10, right: 24, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="blueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-blue)" stopOpacity={0.6} />
                <stop offset="100%" stopColor="var(--color-blue)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="redFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-red)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="var(--color-red)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeOpacity={0.12} vertical={true} horizontal={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} />
            <YAxis domain={[0, 200]} axisLine={false} tickLine={false} />

            <ChartTooltip cursor={{ fill: "hsla(210, 85%, 55%, 0.10)" }} />

            <Area
              type="monotone"
              dataKey="blue"
              stroke="var(--color-blue)"
              strokeWidth={3}
              fill="url(#blueFill)"
              dot={false}
              activeDot={{ r: 6, stroke: "var(--color-blue)", strokeWidth: 2, fill: "#fff" }}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="red"
              stroke="var(--color-red)"
              strokeWidth={2.5}
              fill="url(#redFill)"
              dot={false}
              isAnimationActive={false}
            />
            <ChartLegend content={<ChartLegendContent />} verticalAlign="top" />
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  );
}

