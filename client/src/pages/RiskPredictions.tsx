import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Bell,
  CheckCircle,
  Globe,
  RefreshCw,
  Shield,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { api } from "@/lib/api";

const SECTORS = [
  { name: "Fintech", value: 28, color: "#16a34a" },
  { name: "Agribusiness", value: 22, color: "#ca8a04" },
  { name: "Healthcare", value: 18, color: "#2563eb" },
  { name: "Energy", value: 15, color: "#9333ea" },
  { name: "Real Estate", value: 12, color: "#ea580c" },
  { name: "Logistics", value: 5, color: "#64748b" },
];

function RiskGauge({ score = 0.42 }: { score?: number }) {
  const pct = Math.round(score * 100);
  const color = score < 0.3 ? "#16a34a" : score < 0.55 ? "#ca8a04" : score < 0.75 ? "#ea580c" : "#dc2626";
  const label = score < 0.3 ? "Low Risk" : score < 0.55 ? "Moderate" : score < 0.75 ? "High Risk" : "Critical";

  const R = 70;
  const cx = 100;
  const cy = 90;
  const strokeWidth = 14;
  const circumference = Math.PI * R;
  const filled = (pct / 100) * circumference;
  const trackPath = `M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 200, height: 120 }}>
        <svg width={200} height={120} viewBox="0 0 200 120">
          <path d={trackPath} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} strokeLinecap="round" className="dark:stroke-zinc-700" />
          <path d={trackPath} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={`${filled} ${circumference}`} style={{ transition: "stroke-dasharray 0.6s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold leading-none" style={{ color }}>{pct}</span>
          <span className="text-xs font-semibold mt-1" style={{ color }}>{label}</span>
        </div>
      </div>
      <div className="flex gap-1 mt-1">
        {["Low", "Moderate", "High", "Critical"].map((l, i) => (
          <span key={l} className="text-[10px] text-muted-foreground">{l}{i < 3 ? " ·" : ""}</span>
        ))}
      </div>
    </div>
  );
}

function MacroCard({ label, value, unit, trend, source }: { label: string; value: number; unit: string; trend?: "up" | "down" | "neutral"; source?: string }) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : ArrowUpRight;
  const trendColor = trend === "up" ? "text-emerald-500" : trend === "down" ? "text-red-500" : "text-muted-foreground";
  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value.toFixed(1)}<span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span></p>
          {source && <p className="text-[10px] text-muted-foreground mt-1">{source}</p>}
        </div>
        <div className={`p-2 rounded-lg bg-muted ${trendColor}`}>
          <TrendIcon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function AlertItem({ alert, onMarkRead }: { alert: any; onMarkRead: () => void }) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${!alert.isRead ? "border-primary/20 bg-primary/5" : "border-border"}`}>
      <div className={`p-1.5 rounded-lg shrink-0 ${alert.severity === "critical" ? "text-red-500" : "text-amber-500"}`}>
        <AlertTriangle className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{alert.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{alert.message}</p>
        <p className="text-[10px] text-muted-foreground mt-1">
          {new Date(alert.createdAt).toLocaleDateString("en-KE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
      {!alert.isRead && <Button variant="ghost" size="sm" onClick={onMarkRead}>Mark read</Button>}
    </div>
  );
}

export default function Overview() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const [macro, setMacro] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [quota, setQuota] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, a, s, q] = await Promise.all([
        api.get("/macro/live"),
        api.get("/alerts"),
        api.get("/predictions/stats"),
        api.get("/predictions/quota"),
      ]);
      setMacro(m);
      setAlerts(a);
      setStats(s);
      setQuota(q);
    } catch (err) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await api.post("/alerts/mark-all-read", {});
      loadData();
      toast.success("All alerts marked as read");
    } catch (err) {
      toast.error("Failed to mark alerts");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const unreadAlerts = alerts.filter((a) => !a.isRead);
  const portfolioRisk = 0.42;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back, {user?.name?.split(" ")[0] ?? "Analyst"} 👋</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Kenya Private Equity Dashboard · {new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setLocation("/predictions")} className="gap-2 bg-primary text-primary-foreground">
            <BarChart3 className="h-3.5 w-3.5" /> New Prediction
          </Button>
        </div>
      </div>

      {/* Live Macro KPIs */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Kenya Macro Indicators</h2>
          <Badge variant="outline" className="text-[10px]">Live · World Bank</Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MacroCard label="GDP Growth" value={macro?.gdpGrowth ?? 4.72} unit="%" trend="up" source="World Bank" />
          <MacroCard label="Inflation" value={macro?.inflation ?? 4.49} unit="%" trend="down" source="World Bank" />
          <MacroCard label="CBK Rate" value={macro?.cbrRate ?? 13.0} unit="%" trend="neutral" source="CBK" />
          <MacroCard label="Lending Rate" value={macro?.lendingRate ?? 13.0} unit="%" trend="neutral" source="World Bank" />
          <MacroCard label="KES/USD" value={macro?.exchangeRate ?? 129.5} unit="" trend="down" source="CBK" />
          <MacroCard label="NSE 20 Index" value={macro?.nseIndex ?? 1842.3} unit="pts" trend="up" source="NSE" />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Risk Gauge */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Portfolio Risk Score
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-2">
            <RiskGauge score={portfolioRisk} />
            <div className="w-full mt-4 space-y-2">
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Predicted IRR</span><span className="font-semibold text-emerald-600">18.4%</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Risk-Adj. Return</span><span className="font-semibold text-foreground">10.7%</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Active Deals</span><span className="font-semibold text-foreground">7</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Model Confidence</span><span className="font-semibold text-foreground">87%</span></div>
            </div>
          </CardContent>
        </Card>

        {/* Sector Allocation */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Sector Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={SECTORS} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                  {SECTORS.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`, "Allocation"]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1 mt-2">
              {SECTORS.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="text-xs text-muted-foreground">{s.name}</span>
                  <span className="text-xs font-medium ml-auto">{s.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Usage & Quota */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Usage This Month
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Predictions Used</span>
                <span className="font-semibold">{quota?.used ?? 0} / {quota?.limit ?? 5}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, ((quota?.used ?? 0) / (quota?.limit ?? 5)) * 100)}%`, background: (quota?.used ?? 0) >= (quota?.limit ?? 5) ? "#dc2626" : "#16a34a" }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Opportunity Alerts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4" /> Opportunity Alerts
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={markAllRead}>Mark all read</Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {unreadAlerts.length > 0 ? unreadAlerts.map((alert, i) => <AlertItem key={i} alert={alert} onMarkRead={markAllRead} />) : <p className="text-muted-foreground text-center py-6">No new alerts 🎉</p>}
        </CardContent>
      </Card>
    </div>
  );
}