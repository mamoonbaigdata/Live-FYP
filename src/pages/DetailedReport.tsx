import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Item = {
  _id?: string;
  timestamp: number;
  date: string;
  pH?: number;
  chlorine?: number;
  waterTemperature?: number;
  waterLevel?: number;
};

export default function DetailedReport() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/kpi?limit=2000');
        const json = await res.json();
        const arr: Item[] = Array.isArray(json?.items) ? json.items : [];
        setItems(arr);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const last30 = useMemo(() => {
    const now = Date.now();
    const start = now - 30 * 24 * 60 * 60 * 1000;
    return items
      .filter(it => typeof it?.timestamp === 'number' && it.timestamp >= start)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [items]);

  return (
    <div className="p-6">
      <Card className="border-border/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-foreground">30-Day Detailed Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">Shows chlorine, pH, temperature, and water level with date and time</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="text-left font-medium px-3 py-2">Date</th>
                  <th className="text-left font-medium px-3 py-2">Time</th>
                  <th className="text-left font-medium px-3 py-2">pH</th>
                  <th className="text-left font-medium px-3 py-2">Chlorine (mg/L)</th>
                  <th className="text-left font-medium px-3 py-2">Temperature (°C)</th>
                  <th className="text-left font-medium px-3 py-2">Water Level (%)</th>
                </tr>
              </thead>
              <tbody>
                {last30.map((it) => {
                  const d = new Date(it.timestamp);
                  const dateStr = `${String(d.getFullYear())}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                  const timeStr = d.toLocaleTimeString();
                  const fmt = (n: unknown) => typeof n === 'number' && Number.isFinite(n) ? Number(n).toFixed(2) : '—';
                  return (
                    <tr key={(it._id as string) ?? `${it.timestamp}-${dateStr}-${timeStr}`} className="border-t border-border/40">
                      <td className="px-3 py-2 text-foreground">{dateStr}</td>
                      <td className="px-3 py-2 text-foreground">{timeStr}</td>
                      <td className="px-3 py-2 text-foreground">{fmt(it.pH)}</td>
                      <td className="px-3 py-2 text-foreground">{fmt(it.chlorine)}</td>
                      <td className="px-3 py-2 text-foreground">{fmt(it.waterTemperature)}</td>
                      <td className="px-3 py-2 text-foreground">{fmt(it.waterLevel)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {loading && <div className="mt-3 text-sm text-muted-foreground">Loading…</div>}
          {!loading && last30.length === 0 && (
            <div className="mt-3 text-sm text-muted-foreground">No readings found for the last 30 days.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}