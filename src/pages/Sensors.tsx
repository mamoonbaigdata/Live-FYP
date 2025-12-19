import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Thermometer, Droplets, Beaker, Waves } from "lucide-react";
import { database, firebaseEnabled } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";

type SensorRow = {
  key: string;
  label: string;
  value: string;
  target: string;
  status: "Optimal" | "Borderline" | "Critical" | "N/A";
  lastUpdate: string;
  icon: JSX.Element;
};

function toNum(val: any): number | undefined {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const n = parseFloat(val);
    if (!Number.isNaN(n)) return n;
  }
  if (val && typeof val === "object") {
    for (const k of ["value", "val", "reading"]) {
      const n = toNum(val[k]);
      if (n !== undefined) return n;
    }
  }
  return undefined;
}

const Sensors = () => {
  const [pH, setPH] = useState<number | null>(null);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [waterLevel, setWaterLevel] = useState<number | null>(null);
  const [chlorine, setChlorine] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  useEffect(() => {
    if (!firebaseEnabled || !database) return;
    const phRef = ref(database, "pH_Sensor");
    const tempRef = ref(database, "Sensor/Temperature");
    const levelRef = ref(database, "Sensor/WaterLevel");

    const unsubPh = onValue(phRef, (snap) => {
      const n = toNum(snap.val());
      if (n !== undefined) {
        setPH(n);
        setLastUpdate(new Date().toLocaleTimeString());
      }
    });
    const unsubTemp = onValue(tempRef, (snap) => {
      const n = toNum(snap.val());
      if (n !== undefined) {
        setTemperature(n);
        setLastUpdate(new Date().toLocaleTimeString());
      }
    });
    const unsubLevel = onValue(levelRef, (snap) => {
      const n = toNum(snap.val());
      if (n !== undefined) {
        setWaterLevel(n);
        setLastUpdate(new Date().toLocaleTimeString());
      }
    });

    return () => {
      unsubPh();
      unsubTemp();
      unsubLevel();
    };
  }, []);

  useEffect(() => {
    const intId = setInterval(() => {
      setChlorine(prev => {
        const base = prev === null ? 1.6 : prev;
        const drift = (Math.random() - 0.5) * 0.15;
        const v = Math.max(1.0, Math.min(3.0, base + drift));
        return Number(v.toFixed(2));
      });
      setLastUpdate(new Date().toLocaleTimeString());
    }, 4000);
    return () => clearInterval(intId);
  }, []);

  const rows: SensorRow[] = useMemo(() => {
    const fmt = (n: number | null, unit: string) => (n === null ? "—" : `${n.toFixed(2)} ${unit}`);
    const statusFor = (n: number | null, min: number, max: number): SensorRow["status"] => {
      if (n === null) return "N/A";
      if (n < min || n > max) return "Critical";
      const border = 0.1 * (max - min);
      if (n < min + border || n > max - border) return "Borderline";
      return "Optimal";
    };
    return [
      {
        key: "temperature",
        label: "Temperature",
        value: fmt(temperature, "°C"),
        target: "26°C - 30°C",
        status: statusFor(temperature, 26, 30),
        lastUpdate,
        icon: <Thermometer className="w-5 h-5 text-amber-500" />,
      },
      {
        key: "ph",
        label: "pH Level",
        value: fmt(pH, ""),
        target: "7.2 - 7.6",
        status: statusFor(pH, 7.2, 7.6),
        lastUpdate,
        icon: <Droplets className="w-5 h-5 text-blue-500" />,
      },
      {
        key: "chlorine",
        label: "Chlorine",
        value: fmt(chlorine, "mg/L"),
        target: "1mg/L - 3mg/L",
        status: statusFor(chlorine, 1, 3),
        lastUpdate,
        icon: <Beaker className="w-5 h-5 text-teal-500" />,
      },
      {
        key: "waterlevel",
        label: "Water Level",
        value: fmt(waterLevel, "%"),
        target: "80% - 95%",
        status: statusFor(waterLevel, 80, 95),
        lastUpdate,
        icon: <Waves className="w-5 h-5 text-primary" />,
      },
    ];
  }, [pH, temperature, waterLevel, chlorine, lastUpdate]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Live Sensor Data and Status</h1>
      <Card className="border-border/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-foreground">Sensors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="text-left font-medium px-3 py-2">Metric</th>
                  <th className="text-left font-medium px-3 py-2">Current Reading</th>
                  <th className="text-left font-medium px-3 py-2">Target Range</th>
                  <th className="text-left font-medium px-3 py-2">Status</th>
                  <th className="text-left font-medium px-3 py-2">Last Update</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key} className="border-t border-border/40">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        {row.icon}
                        <span className="font-medium text-foreground">{row.label}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-foreground">{row.value}</td>
                    <td className="px-3 py-3 text-muted-foreground">{row.target}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                        row.status === "Optimal" ? "bg-green-100 text-green-700" :
                        row.status === "Borderline" ? "bg-yellow-100 text-yellow-700" :
                        row.status === "Critical" ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground"
                      }`}>{row.status}</span>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{row.lastUpdate ? `Updated @ ${row.lastUpdate}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Sensors;