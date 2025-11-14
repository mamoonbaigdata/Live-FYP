import { useEffect, useState } from "react";
import { ref, onValue, push, set } from "firebase/database";
import { database, firebaseEnabled } from "@/lib/firebase";
import MetricCard from "./MetricCard";
import { Droplets, Thermometer, Beaker, Waves, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AcceptableRangesGraph from "./AcceptableRangesGraph";


interface WaterData {
  pH: number;
  chlorine: number;
  waterTemperature: number;
  waterLevel: number;
}
type HistoryPoint = { time: number; pH: number; chlorine: number; waterTemperature: number; waterLevel: number };

const Dashboard = () => {
  const { toast } = useToast();
  const [data, setData] = useState<WaterData>({
    pH: 7.2,
    chlorine: 1.5,
    waterTemperature: 24.5,
    waterLevel: 75
  });
  // keep latest data accessible from timers without re-subscribing
  const [dataVersion, setDataVersion] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [lastAlertTimes, setLastAlertTimes] = useState<Record<string, number>>({});
  const [usingDemo, setUsingDemo] = useState(true);
  // History no longer used for KPI chart display

  // Immediate alerts with short cooldown per metric
  useEffect(() => {
    const now = Date.now();
    const cooldownMs = 6000; // prevent spam while still alerting quickly

    const shouldAlert = (key: string) => {
      const last = lastAlertTimes[key] || 0;
      return now - last > cooldownMs;
    };

    // Chlorine thresholds
    if (data.chlorine < 1 && shouldAlert('chlorine-low')) {
      setLastAlertTimes((p) => ({ ...p, 'chlorine-low': now }));
      toast({
        title: "⚠️ Low Chlorine Alert",
        description: `Chlorine ${data.chlorine.toFixed(1)} ppm (< 1.0 ppm)`,
        variant: "destructive",
      });
    }
    if (data.chlorine > 3.0 && shouldAlert('chlorine-high')) {
      setLastAlertTimes((p) => ({ ...p, 'chlorine-high': now }));
      toast({
        title: "⚠️ High Chlorine Alert",
        description: `Chlorine ${data.chlorine.toFixed(1)} ppm (> 3.0 ppm)`,
        variant: "destructive",
      });
    }

    // pH range
    if ((data.pH < 7.4 || data.pH > 7.6) && shouldAlert('ph-out')) {
      setLastAlertTimes((p) => ({ ...p, 'ph-out': now }));
      const issue = data.pH < 7.4 ? 'too low' : 'too high';
      toast({
        title: "⚠️ pH Out of Range",
        description: `pH ${data.pH.toFixed(1)} (${issue}) — optimal 7.4–7.6`,
        variant: "destructive",
      });
    }

    // Temperature range
    if ((data.waterTemperature < 22 || data.waterTemperature > 27) && shouldAlert('temp-out')) {
      setLastAlertTimes((p) => ({ ...p, 'temp-out': now }));
      const issue = data.waterTemperature < 22 ? 'too low' : 'too high';
      toast({
        title: "⚠️ Temperature Out of Range",
        description: `Temperature ${data.waterTemperature.toFixed(1)}°C (${issue}) — optimal 22–27°C`,
        variant: "destructive",
      });
    }
  }, [data, lastAlertTimes, toast]);

  // Simulate real-time updates for demo; stops when Firebase provides data
  useEffect(() => {
    if (!usingDemo) return;

    const demoInterval = setInterval(() => {
      setData(prev => {
        const next = {
          pH: Math.max(6, Math.min(8, prev.pH + (Math.random() - 0.5) * 0.3)),
          chlorine: Math.max(0.5, Math.min(3, prev.chlorine + (Math.random() - 0.5) * 0.2)),
          waterTemperature: Math.max(20, Math.min(28, prev.waterTemperature + (Math.random() - 0.5) * 0.5)),
          waterLevel: Math.max(60, Math.min(90, prev.waterLevel + (Math.random() - 0.5) * 2))
        };
        // History tracking removed (chart now shows static acceptable ranges)
        // bump version so timers can reference fresh values
        setDataVersion(v => v + 1);
        return next;
      });
      setLastUpdate(new Date());
      setIsConnected(true);
    }, 1500);

    return () => clearInterval(demoInterval);
  }, [usingDemo]);

  useEffect(() => {
    // Skip Firebase subscription if not configured
    if (!firebaseEnabled || !database) {
      console.warn("Firebase not configured. Running in demo mode.");
      return;
    }

    const dataRef = ref(database, 'waterQuality');
    const unsubscribe = onValue(
      dataRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const newData = snapshot.val();
          setData(newData);
          setDataVersion(v => v + 1);
          setLastUpdate(new Date());
          setIsConnected(true);
          setUsingDemo(false);
          console.log("Data updated:", newData);
          // History tracking removed (chart now shows static acceptable ranges)
        }
      },
      (error) => {
        console.error("Error reading data:", error);
        // Demo mode will continue running
      },
    );

    return () => unsubscribe();
  }, [toast]);

  // Hourly persistence to Firebase with date
  useEffect(() => {
    if (!firebaseEnabled || !database) return;

    const saveReading = () => {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const entry = {
        timestamp: now.getTime(),
        date: dateStr,
        pH: data.pH,
        chlorine: data.chlorine,
        waterTemperature: data.waterTemperature,
        waterLevel: data.waterLevel,
      };

      const historyRef = ref(database, `waterQualityHistory/${dateStr}`);
      const newItemRef = push(historyRef);
      set(newItemRef, entry).catch((err) => {
        console.error('Failed to save hourly reading', err);
      });
    };

    // schedule aligned to the next hour
    const now = new Date();
    const msToNextHour = (
      (60 - now.getMinutes()) * 60 * 1000 -
      now.getSeconds() * 1000 -
      now.getMilliseconds()
    );

    const startTimeout = setTimeout(() => {
      saveReading();
      const hourly = setInterval(saveReading, 60 * 60 * 1000);
      // store interval id on window to allow cleanup inside closure
      (window as any).__hourly_save_id = hourly;
    }, Math.max(0, msToNextHour));

    return () => {
      clearTimeout(startTimeout);
      const hourlyId = (window as any).__hourly_save_id as number | undefined;
      if (hourlyId) clearInterval(hourlyId);
    };
  }, [firebaseEnabled, database, dataVersion]);

  return (
    <div className="min-h-screen bg-[var(--gradient-flow)] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2 flex items-center justify-center gap-3">
            <Waves className="w-10 h-10 text-primary" />
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
            icon={<Droplets className="w-5 h-5 text-water-medium" />}
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
            icon={<Beaker className="w-5 h-5 text-accent" />}
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
            icon={<Thermometer className="w-5 h-5 text-water-bright" />}
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
            unit="%"
            icon={<Waves className="w-5 h-5 text-primary" />}
            min={0}
            max={100}
            colors={["hsl(var(--primary))", "hsl(var(--muted))"]}
            targetMin={60}
            targetMax={90}
            borderDelta={5}
            iconAnimationClass="animate-pulse"
          />
        </div>

        {/* Standard Values for KPI's */}
        <div className="mt-8">
          <AcceptableRangesGraph />
        </div>

        {/* Removed standalone Chlorine standard chart per request */}

        <div className="mt-8 p-4 bg-card/50 backdrop-blur-sm rounded-lg border border-border/50">
          <div className="flex items-start gap-3">
            <Activity className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">Real-time Demo Mode</h2>
              <p className="text-sm text-muted-foreground">
                Currently showing simulated data updating every 3 seconds. Update your Firebase credentials in <code className="bg-muted px-2 py-1 rounded">src/lib/firebase.ts</code> to connect to your actual database.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Expected Firebase data structure: <code className="bg-muted px-2 py-1 rounded">waterQuality/&#123;pH, chlorine, waterTemperature, waterLevel&#125;</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
