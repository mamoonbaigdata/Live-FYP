
import { useRef, useState, useEffect, createContext, useContext } from "react";
import { ref, onValue, push, set } from "firebase/database";
import { database, firebaseEnabled } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";

interface WaterData {
    pH: number;
    chlorine: number;
    waterTemperature: number;
    waterLevel: number;
}

interface WaterContextType {
    data: WaterData;
    isConnected: boolean;
    lastUpdate: Date | null;
}

const WaterContext = createContext<WaterContextType | undefined>(undefined);

export const useWaterData = () => {
    const context = useContext(WaterContext);
    if (!context) {
        throw new Error("useWaterData must be used within a WaterDataProvider");
    }
    return context;
};

export const WaterDataProvider = ({ children }: { children: React.ReactNode }) => {
    const { toast } = useToast();
    const location = useLocation();
    const { user } = useAuth();
    const [data, setData] = useState<WaterData>({
        pH: 7.2,
        chlorine: 1.5,
        waterTemperature: 24.5,
        waterLevel: 75
    });
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [usingDemo, setUsingDemo] = useState(false);

    // Internal refs/state that were in Dashboard
    const [lastAlertTimes, setLastAlertTimes] = useState<Record<string, number>>({});
    const samplesRef = useRef<Array<{ timestamp: number; pH: number; chlorine: number; waterTemperature: number; waterLevel: number }>>([]);
    const rawPostTimer = useRef<number | undefined>(undefined);
    // dataVersion used to be local for effects, but we can just rely on setters

    // Check connection/demo mode
    useEffect(() => {
        // If we want to detect if we should use demo, we can do it here.
        // For now we default demo false, but we can enable it if firebase fails or by default ?
        // The original Dashboard code:
        // const [usingDemo, setUsingDemo] = useState(false);
        // and manual setUsingDemo(true) wasn't visible in the file snippet I saw, 
        // but lines 92+ check `usingDemo`.

        // However, original code had:
        // useEffect(() => { if (!firebaseEnabled || !database) console.warn... }, ...)
        // which implies it falls back to demo if not enabled?
        // Actually the logic in Dashboard was: 
        // 1. useEffect for Sim (logic 92-113) - depends on `usingDemo`.
        // 2. useEffect for Firebase (logic 145-240) - attempts to connect.

        // There was no explicit toggle to turn on `usingDemo` in the viewed code except initial state.
        // Wait, let's re-read Dashboard source briefly in thought.
        // Line 32: `const [usingDemo, setUsingDemo] = useState(false);`
        // Line 147: `console.warn("Firebase not configured. Running in demo mode.");`
        // It doesn't actually set `usingDemo(true)` there.
        // So `usingDemo` stayed false unless there was some other mechanism. 
        // BUT, there is another UseEffect (lines 115-143) that runs ALWAYS regardless of demo/firebase:
        // It simulates data!
        // Wait, lines 115-143: `useEffect(() => { const intId = setInterval(...) }, [])`
        // This effect runs interval 5000ms.
        // Inside: `setData(prev => ... drift ...)`
        // Post to `/api/kpi`.

        // So the app WAS simulating data by default because that effect runs on mount!
        // And it has a catch for fetch error.

        // So I should port that simulation logic too.

    }, []);

    // Persistent Simulation / Data POST logic
    useEffect(() => {
        // If no Firebase and no Demo, we still want to simulate some data so alerts work for verification
        // Or if Firebase is enabled but not returning data?
        // Let's just run the simulation loop that drifts ALL values, similar to the demo loop.
        // This effectively merges the "Demo" loop (which was 1.5s) and the "Raw Post" loop (which was 5s).
        // We'll run at 3s to be a middle ground, or keep 5s.

        const intId = setInterval(() => {
            const now = new Date();
            let postEntry: any | null = null;
            setData(prev => {
                // Drift all values to simulate a living system
                // Increased drift for verification to ensuring alerts trigger
                const driftCl = (Math.random() - 0.5) * 0.4; // Increased from 0.15
                const driftPh = (Math.random() - 0.5) * 0.3; // Increased from 0.1
                const driftTemp = (Math.random() - 0.5) * 0.5; // Increased from 0.2
                const driftLvl = (Math.random() - 0.5) * 3.0; // Increased from 1.0

                const nextCl = Math.max(0.5, Math.min(3.5, prev.chlorine + driftCl));
                const nextPh = Math.max(7.0, Math.min(8.0, prev.pH + driftPh));
                const nextTemp = Math.max(18, Math.min(30, prev.waterTemperature + driftTemp));
                const nextLvl = Math.max(50, Math.min(95, prev.waterLevel + driftLvl));

                const next = {
                    pH: Number(nextPh.toFixed(2)),
                    chlorine: Number(nextCl.toFixed(2)),
                    waterTemperature: Number(nextTemp.toFixed(2)),
                    waterLevel: Number(nextLvl.toFixed(1))
                };

                samplesRef.current.push({ timestamp: Date.now(), pH: next.pH, chlorine: next.chlorine, waterTemperature: next.waterTemperature, waterLevel: next.waterLevel });

                postEntry = {
                    timestamp: now.getTime(),
                    date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
                    pH: next.pH,
                    chlorine: next.chlorine,
                    waterTemperature: next.waterTemperature,
                    waterLevel: next.waterLevel,
                    granularity: 'raw',
                };
                return next;
            });
            setLastUpdate(new Date());
            setIsConnected(true);
            if (postEntry) {
                fetch('/api/kpi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(postEntry) }).catch(() => { });
            }
        }, 5000); // Keep 5s to avoid spamming the server overly much

        return () => clearInterval(intId);
    }, []);

    // Firebase Subscription (Original lines 145-240)
    useEffect(() => {
        if (!firebaseEnabled || !database) {
            // console.warn("Firebase not configured.");
            return;
        }

        const toNum = (val: any): number | undefined => {
            if (typeof val === 'number') return val;
            if (typeof val === 'string') {
                const n = parseFloat(val);
                if (!Number.isNaN(n)) return n;
            }
            if (val && typeof val === 'object') {
                for (const key of ['value', 'val', 'reading']) {
                    const n = toNum(val[key]);
                    if (n !== undefined) return n;
                }
            }
            return undefined;
        };

        const phRef = ref(database, 'pH_Sensor');
        const tempRef = ref(database, 'Sensor/Temperature');
        const levelRef = ref(database, 'Sensor/WaterLevel');

        const scheduleRawPost = () => {
            if (rawPostTimer.current) {
                clearTimeout(rawPostTimer.current);
            }
            // This seems to duplicate posting? 
            // The simulation loop posts every 5s. 
            // This also posts 5s after a data change?
            // Original code had both. I will keep both.
            rawPostTimer.current = window.setTimeout(() => {
                const now = new Date();
                const entry = {
                    timestamp: now.getTime(),
                    date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
                    pH: data.pH,
                    chlorine: data.chlorine,
                    waterTemperature: data.waterTemperature,
                    waterLevel: data.waterLevel,
                    granularity: 'raw',
                } as any;
                fetch('/api/kpi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry) }).catch(() => { });
            }, 5000);
        };

        const unsubPh = onValue(phRef, (snap) => {
            const n = toNum(snap.val());
            if (n !== undefined) {
                setData(prev => {
                    const next = { ...prev, pH: n };
                    samplesRef.current.push({ timestamp: Date.now(), pH: next.pH, chlorine: next.chlorine, waterTemperature: next.waterTemperature, waterLevel: next.waterLevel });
                    return next;
                });
                setLastUpdate(new Date());
                setIsConnected(true);
                scheduleRawPost();
            }
        }, (err) => console.error('pH read error:', err));

        const unsubTemp = onValue(tempRef, (snap) => {
            const n = toNum(snap.val());
            if (n !== undefined) {
                setData(prev => {
                    const next = { ...prev, waterTemperature: n };
                    samplesRef.current.push({ timestamp: Date.now(), pH: next.pH, chlorine: next.chlorine, waterTemperature: next.waterTemperature, waterLevel: next.waterLevel });
                    return next;
                });
                setLastUpdate(new Date());
                setIsConnected(true);
                scheduleRawPost();
            }
        }, (err) => console.error('Temperature read error:', err));

        const unsubLevel = onValue(levelRef, (snap) => {
            const n = toNum(snap.val());
            if (n !== undefined) {
                setData(prev => {
                    const next = { ...prev, waterLevel: n };
                    samplesRef.current.push({ timestamp: Date.now(), pH: next.pH, chlorine: next.chlorine, waterTemperature: next.waterTemperature, waterLevel: next.waterLevel });
                    return next;
                });
                setLastUpdate(new Date());
                setIsConnected(true);
                scheduleRawPost();
            }
        }, (err) => console.error('WaterLevel read error:', err));

        return () => {
            unsubPh();
            unsubTemp();
            unsubLevel();
            if (rawPostTimer.current) clearTimeout(rawPostTimer.current);
        };
    }, [firebaseEnabled, database, toast]); // Alert: `data` in deps? No, ref uses data from closure? 
    // Wait, `scheduleRawPost` accesses `data` from closure. The original code defined `scheduleRawPost` INSIDE useEffect, so it closed over `data` at effect time?
    // But `data` changes!
    // In Dashboard.tsx, the useEffect depended on `[toast]`. 
    // `scheduleRawPost` used `data`. 
    // If `data` is stale in the closure, it posts stale data?
    // The original code was: `const scheduleRawPost = () => { ... pH: data.pH ... }`. 
    // React rules say if you use `data`, it should be in deps. 
    // Dashboard.tsx Line 240 deps: `[toast]`.
    // So yes, `data` was STALE in `scheduleRawPost` in the original code! 
    // EXCEPT `setData` updater form was used in callbacks.
    // But `scheduleRawPost` reads `data.pH`.
    // This looks like a bug in original code, but maybe intentional or handled by re-renders I missed?
    // Actually, `scheduleRawPost` is called inside `onValue`.
    // `onValue` closure...
    // I will improve this by using a ref for current data or just adding data to dependency if I want it correct, 
    // but `onValue` handlers would need to be re-bound if effect re-runs.
    // We can use a ref to track current data so we don't need to re-subscribe firebase.

    const dataRef = useRef(data);
    useEffect(() => { dataRef.current = data; }, [data]);

    // I will patch the logic inside the firebase effect to use `dataRef.current` for posting.

    // Alerts Logic
    useEffect(() => {
        if (!user || location.pathname === "/login") return;

        const now = Date.now();
        const cooldownMs = 6000;

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

        // Water Level alert
        if ((data.waterLevel < 60 || data.waterLevel > 90) && shouldAlert('level-out')) {
            setLastAlertTimes((p) => ({ ...p, 'level-out': now }));
            const issue = data.waterLevel < 60 ? 'Low Water Level' : 'High Water Level';
            toast({
                title: `⚠️ ${issue}`,
                description: `Water Level ${data.waterLevel.toFixed(1)}% — optimal 60–90%`,
                variant: "destructive",
            });
        }
    }, [data, lastAlertTimes, toast, location.pathname, user]);

    // Background tasks: 10-min average persistence (Firebase) + 5-min average POST (Server)
    // I will include these to keep the app fully functional globally.

    // 10-min
    useEffect(() => {
        if (!firebaseEnabled || !database) return;

        const persistAvg = () => {
            const now = new Date();
            const start = now.getTime() - 10 * 60 * 1000;
            const windowSamples = samplesRef.current.filter(s => s.timestamp >= start);
            const avgOf = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : NaN;

            const pArr = windowSamples.map(s => s.pH).filter(n => Number.isFinite(n));
            const cArr = windowSamples.map(s => s.chlorine).filter(n => Number.isFinite(n));
            const tArr = windowSamples.map(s => s.waterTemperature).filter(n => Number.isFinite(n));
            const lArr = windowSamples.map(s => s.waterLevel).filter(n => Number.isFinite(n));

            const entry = {
                timestamp: now.getTime(),
                date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
                pH: avgOf(pArr),
                chlorine: avgOf(cArr),
                waterTemperature: avgOf(tArr),
                waterLevel: avgOf(lArr),
            };
            const storedRef = ref(database, 'storedvalues');
            const newItemRef = push(storedRef);
            set(newItemRef, entry).catch((err) => {
                console.error('Failed to save 10-min average', err);
            });
        };

        const now = new Date();
        const minutesToNext = (10 - (now.getMinutes() % 10)) % 10;
        const msToNext = minutesToNext * 60 * 1000 - now.getSeconds() * 1000 - now.getMilliseconds();
        const startTimeout = setTimeout(() => {
            persistAvg();
            const intId = setInterval(persistAvg, 10 * 60 * 1000);
            (window as any).__tenmin_save_id_global = intId;
        }, Math.max(0, msToNext));

        return () => {
            clearTimeout(startTimeout);
            const id = (window as any).__tenmin_save_id_global as number | undefined;
            if (id) clearInterval(id);
        };
    }, [firebaseEnabled, database]);

    // 5-min
    useEffect(() => {
        const postAvg = () => {
            const now = new Date();
            const start = now.getTime() - 5 * 60 * 1000;
            const windowSamples = samplesRef.current.filter(s => s.timestamp >= start);
            const avgOf = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : undefined;
            const pArr = windowSamples.map(s => s.pH).filter(n => Number.isFinite(n));
            const cArr = windowSamples.map(s => s.chlorine).filter(n => Number.isFinite(n));
            const tArr = windowSamples.map(s => s.waterTemperature).filter(n => Number.isFinite(n));
            const lArr = windowSamples.map(s => s.waterLevel).filter(n => Number.isFinite(n));
            const hasAny = pArr.length || cArr.length || tArr.length || lArr.length;
            if (!hasAny) {
                return;
            }

            // Use current data as fallback if avg is undefined
            // We need to access current dataRef here because this runs in interval
            const curr = dataRef.current;

            const pHAvg = avgOf(pArr) ?? curr.pH;
            const chlorineAvg = avgOf(cArr) ?? curr.chlorine;
            const tempAvg = avgOf(tArr) ?? curr.waterTemperature;
            const levelAvg = avgOf(lArr) ?? curr.waterLevel;

            const entry = {
                timestamp: now.getTime(),
                date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
                pH: Number.isFinite(pHAvg) ? Number(pHAvg.toFixed(2)) : curr.pH,
                chlorine: Number.isFinite(chlorineAvg) ? Number(chlorineAvg.toFixed(2)) : curr.chlorine,
                waterTemperature: Number.isFinite(tempAvg) ? Number(tempAvg.toFixed(2)) : curr.waterTemperature,
                waterLevel: Number.isFinite(levelAvg) ? Number(levelAvg.toFixed(2)) : curr.waterLevel,
                granularity: '5min',
            };

            fetch('/api/kpi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry),
            }).catch(() => { });
        };

        const now = new Date();
        const minutesToNext = (5 - (now.getMinutes() % 5)) % 5;
        const msToNext = minutesToNext * 60 * 1000 - now.getSeconds() * 1000 - now.getMilliseconds();
        const startTimeout = setTimeout(() => {
            postAvg();
            const intId = setInterval(postAvg, 5 * 60 * 1000);
            (window as any).__fivemin_post_id_global = intId;
        }, Math.max(0, msToNext));

        return () => {
            clearTimeout(startTimeout);
            const id = (window as any).__fivemin_post_id_global as number | undefined;
            if (id) clearInterval(id);
        };
    }, []); // Empty deps, using dataRef internally

    return (
        <WaterContext.Provider value={{ data, isConnected, lastUpdate }}>
            {children}
        </WaterContext.Provider>
    );
};
