
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Info, ShieldAlert } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface WaterData {
    pH: number;
    chlorine: number;
    waterTemperature: number;
}

const NaegleriaRiskCard = ({ data }: { data: WaterData }) => {
    const { pH, chlorine, waterTemperature } = data;

    // Logic based on provided image
    const isHighChlorineRisk = chlorine < 0.5;
    const isHighTempRisk = waterTemperature >= 30 && waterTemperature <= 45;

    const isMedChlorineRisk = chlorine >= 0.5 && chlorine < 1.0;
    const isMedPhRisk = pH > 8.0;
    const isMedTempRisk = waterTemperature >= 25 && waterTemperature < 30;

    let riskLevel: "LOW" | "MODERATE" | "HIGH" = "LOW";
    let reasons: string[] = [];

    if (isHighChlorineRisk || isHighTempRisk) {
        riskLevel = "HIGH";
        if (isHighChlorineRisk) reasons.push("Chlorine is critically low (< 0.5 ppm), allowing amoeba survival.");
        if (isHighTempRisk) reasons.push("Temperature is in the ideal range (30°C–45°C) for rapid amoeba growth.");
    } else if (isMedChlorineRisk || isMedPhRisk || isMedTempRisk) {
        riskLevel = "MODERATE";
        if (isMedChlorineRisk) reasons.push("Chlorine is suboptimal (0.5–1.0 ppm).");
        if (isMedPhRisk) reasons.push("pH is high (> 8.0), reducing chlorine effectiveness.");
        if (isMedTempRisk) reasons.push("Temperature is warm (25°C–30°C), increasing risk.");
    } else {
        reasons.push("Conditions inhibit Naegleria growth.");
    }

    // Styles
    const riskColor = {
        LOW: "text-green-600 bg-green-100 border-green-200",
        MODERATE: "text-yellow-600 bg-yellow-100 border-yellow-200",
        HIGH: "text-red-600 bg-red-100 border-red-200",
    }[riskLevel];

    const headerColor = {
        LOW: "text-green-700",
        MODERATE: "text-yellow-700",
        HIGH: "text-red-700",
    }[riskLevel];

    const Icon = {
        LOW: CheckCircle,
        MODERATE: AlertTriangle,
        HIGH: ShieldAlert,
    }[riskLevel];

    return (
        <Card className={`border-l-4 ${riskLevel === "HIGH" ? "border-l-red-500" : riskLevel === "MODERATE" ? "border-l-yellow-500" : "border-l-green-500"} shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700`}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <span className={headerColor}>Naegleria Fowleri Risk</span>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                    </CardTitle>
                    <Badge variant="outline" className={`${riskColor} font-bold px-3 py-1 text-sm rounded-full capitalize`}>
                        {riskLevel} RISK
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Risk Analysis Text */}
                <div className={`p-3 rounded-md text-sm font-medium ${riskColor}`}>
                    <div className="flex items-start gap-2">
                        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-bold mb-1">{riskLevel === "LOW" ? "Safe Conditions" : "Risk Detected"}</p>
                            <ul className="list-disc list-inside space-y-1 opacity-90">
                                {reasons.map((r, i) => <li key={i}>{r}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Visual Metric Gauges */}
                <div className="space-y-3 pt-2">

                    {/* Chlorine Gauge */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                            <span className="text-muted-foreground">Chlorine Defense</span>
                            <span className={isHighChlorineRisk ? "text-red-600" : isMedChlorineRisk ? "text-yellow-600" : "text-green-600"}>
                                {chlorine.toFixed(2)} ppm
                            </span>
                        </div>
                        <Progress value={Math.min(100, (chlorine / 3) * 100)} className={`h-2 ${isHighChlorineRisk ? "[&>div]:bg-red-500" : isMedChlorineRisk ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500"}`} />
                        <p className="text-[10px] text-muted-foreground text-right">{chlorine < 0.5 ? "Dangerous (< 0.5)" : "Effective (> 1.0)"}</p>
                    </div>

                    {/* Temp Gauge */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                            <span className="text-muted-foreground">Temperature Safety</span>
                            <span className={isHighTempRisk ? "text-red-600" : isMedTempRisk ? "text-yellow-600" : "text-green-600"}>
                                {waterTemperature.toFixed(1)}°C
                            </span>
                        </div>
                        {/* Inverse progress visualization for Temp: Higher is worse logic (simplified) */}
                        <Progress value={Math.min(100, (waterTemperature / 45) * 100)} className={`h-2 ${isHighTempRisk ? "[&>div]:bg-red-500" : isMedTempRisk ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500"}`} />
                        <p className="text-[10px] text-muted-foreground text-right">{waterTemperature > 30 ? "Critical Range (> 30°C)" : "Inhibitory Range (< 25°C)"}</p>
                    </div>

                    {/* pH Gauge */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                            <span className="text-muted-foreground">pH Stability</span>
                            <span className={isMedPhRisk ? "text-yellow-600" : "text-green-600"}>
                                {pH.toFixed(2)}
                            </span>
                        </div>
                        <Progress value={Math.min(100, (pH / 14) * 100)} className={`h-2 ${isMedPhRisk ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500"}`} />
                        <p className="text-[10px] text-muted-foreground text-right">{pH > 8.0 ? "Reduces Chlorine Efficacy" : "Optimal (7.2-7.8)"}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default NaegleriaRiskCard;
