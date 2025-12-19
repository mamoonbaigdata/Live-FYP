import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { ReactNode, useEffect, useState } from "react";

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  icon: ReactNode;
  min: number;
  max: number;
  colors: string[];
  targetMin?: number;
  targetMax?: number;
  borderDelta?: number; // tolerance outside target range considered borderline
  iconAnimationClass?: string; // subtle animation class for icon microinteraction
}

const MetricCard = ({ title, value, unit, icon, min, max, colors, targetMin, targetMax, borderDelta = 0, iconAnimationClass }: MetricCardProps) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (displayValue !== value) {
      setIsUpdating(true);
      const duration = 800;
      const steps = 60;
      const stepValue = (value - displayValue) / steps;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        setDisplayValue(prev => {
          const newValue = prev + stepValue;
          if (currentStep >= steps) {
            clearInterval(interval);
            setIsUpdating(false);
            return value;
          }
          return newValue;
        });
      }, duration / steps);

      return () => clearInterval(interval);
    }
  }, [value, displayValue]);

  const percentageRaw = ((displayValue - min) / (max - min)) * 100;
  const percentage = Math.max(0, Math.min(100, percentageRaw));

  const data = [
    { name: 'Value', value: percentage },
    { name: 'Remaining', value: 100 - percentage }
  ];
  const gradId = `grad-${title.replace(/\s+/g, '-')}`;

  // Status color coding: green (normal), yellow (borderline), red (critical)
  type Status = 'normal' | 'borderline' | 'critical';
  const computeStatus = (): Status => {
    if (displayValue < min || displayValue > max) return 'critical';
    if (targetMin !== undefined && targetMax !== undefined) {
      if (displayValue >= targetMin && displayValue <= targetMax) return 'normal';
      const lowerBorder = targetMin - borderDelta;
      const upperBorder = targetMax + borderDelta;
      if (displayValue >= lowerBorder && displayValue <= upperBorder) return 'borderline';
      return 'critical';
    }
    // Fallback: treat mid-range as normal
    const mid = (min + max) / 2;
    const spread = (max - min) / 6;
    if (Math.abs(displayValue - mid) <= spread) return 'normal';
    if (Math.abs(displayValue - mid) <= spread * 2) return 'borderline';
    return 'critical';
  };
  const status = computeStatus();
  const statusColor = status === 'normal' ? '#22c55e' : status === 'borderline' ? '#f59e0b' : '#ef4444';

  return (
    <Card className={`overflow-hidden border border-border/30 bg-gradient-to-br from-background/80 to-muted/40 backdrop-blur-md transition-all duration-300 shadow-md hover:shadow-2xl hover:border-border/50 transform-gpu hover:-translate-y-1 hover:scale-[1.01] ${isUpdating ? 'ring-2 ring-primary/40' : ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg text-foreground">
          <span className={`inline-flex items-center justify-center size-12 rounded-full bg-gradient-to-br from-muted/40 to-muted/20 border border-border/40 text-foreground/80 [&>svg]:size-7 ${iconAnimationClass ?? ''}`}>
            {icon}
          </span>
          <span className="font-semibold tracking-tight text-xl">{title}</span>
          <span className="ml-auto inline-flex items-center gap-2 text-xs">
            <span className={`w-3 h-3 rounded-full`} style={{ backgroundColor: statusColor }} />
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center relative">
          <div className="absolute inset-0 pointer-events-none z-20">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 relative size-[106px]">
              <div
                className="absolute inset-0 rounded-full transition-all duration-800 z-0"
                style={{
                  background: `radial-gradient(circle, ${statusColor}40 0%, ${statusColor}20 50%, transparent 70%)`,
                  boxShadow: `0 0 40px ${statusColor}60, inset 0 0 20px ${statusColor}30`
                }}
              />
              <div className="absolute inset-0 rounded-full border border-border/40 bg-background/40 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_8px_24px_rgba(0,0,0,.06)] flex items-center justify-center z-10">
                <div className={`size-16 rounded-full bg-gradient-to-br from-muted/40 to-muted/20 border border-border/40 flex items-center justify-center text-foreground/80 z-20 ${iconAnimationClass ?? ''}`}>
                  <span className="[&>svg]:size-9">{icon}</span>
                </div>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={statusColor} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={statusColor} stopOpacity={0.65} />
                </linearGradient>
              </defs>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={80}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                animationDuration={700}
                animationBegin={0}
                cornerRadius={14}
                paddingAngle={2}
              >
                <Cell
                  fill={`url(#${gradId})`}
                  style={{
                    filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.15))',
                    opacity: 0.98
                  }}
                />
                <Cell fill={colors[1]} opacity={0.12} />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="text-center mt-2">
          <div className="text-3xl font-semibold text-foreground tracking-tight">
            {value.toFixed(1)}
          </div>
          <div className="text-xs text-muted-foreground">{unit}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Range: {min} - {max}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;
