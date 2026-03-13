import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { AlertTriangle, CheckCircle, Lightbulb, TrendingUp, Zap } from "lucide-react";
import { useState } from "react";
import {
  CartesianGrid,
  Cell,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from "recharts";

const SECTORS = ["Fintech", "Agribusiness", "Healthcare", "Energy", "Real Estate", "Logistics"];
const COMPANIES = ["A", "B", "C", "D"];

function MiniGauge({ score, size = 80 }: { score: number; size?: number }) {
  const pct = Math.round(score * 100);
  const color = score < 0.3 ? "#16a34a" : score < 0.55 ? "#ca8a04" : score < 0.75 ? "#ea580c" : "#dc2626";
  const data = [{ name: "Risk", value: pct, fill: color }];
  return (
    <div className="relative" style={{ width: size, height: size / 2 + 10 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart cx="50%" cy="90%" innerRadius="70%" outerRadius="100%" startAngle={180} endAngle={0} data={data}>
          <RadialBar dataKey="value" cornerRadius={3} background={{ fill: "#e5e7eb" }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-0">
        <span className="text-sm font-bold" style={{ color }}>{pct}</span>
      </div>
    </div>
  );
}

export default function PortfolioOptimization() {
  const [baseInputs] = useState({ gdpGrowth: 4.7, inflation: 4.5, revenueGrowth: 15.0, debtRatio: 0.8, volatility: 0.2 });
  const [inflationAdj, setInflationAdj] = useState(0);
  const [gdpAdj, setGdpAdj] = useState(0);
  const [volatilityAdj, setVolatilityAdj] = useState(0);
  const [debtAdj, setDebtAdj] = useState(0);

  const { data: optimization } = trpc.portfolio.optimize.useQuery(
    { baseInputs, inflationAdj, gdpAdj, volatilityAdj, debtAdj },
    { keepPreviousData: true } as any
  );

  // Generate heatmap data
  type HeatmapRow = { sector: string; [key: string]: string | number };
  const heatmapData: HeatmapRow[] = SECTORS.map((sector) => ({
    sector,
    ...Object.fromEntries(
      COMPANIES.map((c) => [
        `company${c}`,
        parseFloat((Math.random() * 0.7 + 0.1).toFixed(2)),
      ])
    ),
  }));

  const riskColor = (v: number) =>
    v < 0.3 ? "#16a34a" : v < 0.55 ? "#ca8a04" : v < 0.75 ? "#ea580c" : "#dc2626";

  const base = optimization?.base;
  const adjusted = optimization?.adjusted;

  const comparisonData = base && adjusted
    ? [
        { metric: "Risk Score", base: parseFloat((base.riskScore * 100).toFixed(1)), adjusted: parseFloat((adjusted.riskScore * 100).toFixed(1)) },
        { metric: "Predicted IRR", base: parseFloat(base.predictedIrr.toFixed(1)), adjusted: parseFloat(adjusted.predictedIrr.toFixed(1)) },
        { metric: "Risk-Adj. Return", base: parseFloat(base.riskAdjustedReturn.toFixed(1)), adjusted: parseFloat(adjusted.riskAdjustedReturn.toFixed(1)) },
        { metric: "Sharpe Proxy", base: parseFloat(base.sharpeProxy.toFixed(2)), adjusted: parseFloat(adjusted.sharpeProxy.toFixed(2)) },
      ]
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Portfolio Optimization</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          What-if scenario analysis with real-time PesaRisk Net re-inference
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* What-If Sliders */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              What-If Adjustments
            </CardTitle>
            <p className="text-xs text-muted-foreground">Adjust macro inputs to see real-time impact</p>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Inflation Adj */}
            <div>
              <div className="flex justify-between mb-1.5">
                <Label className="text-xs font-medium">Inflation Adjustment</Label>
                <span className={`text-xs font-bold ${inflationAdj > 0 ? "text-red-600" : inflationAdj < 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
                  {inflationAdj > 0 ? "+" : ""}{inflationAdj.toFixed(1)}%
                </span>
              </div>
              <Slider min={-5} max={5} step={0.1} value={[inflationAdj]} onValueChange={([v]) => setInflationAdj(v)} />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>-5%</span><span>+5%</span></div>
            </div>

            {/* GDP Adj */}
            <div>
              <div className="flex justify-between mb-1.5">
                <Label className="text-xs font-medium">GDP Adjustment</Label>
                <span className={`text-xs font-bold ${gdpAdj > 0 ? "text-emerald-600" : gdpAdj < 0 ? "text-red-600" : "text-muted-foreground"}`}>
                  {gdpAdj > 0 ? "+" : ""}{gdpAdj.toFixed(1)}%
                </span>
              </div>
              <Slider min={-3} max={3} step={0.1} value={[gdpAdj]} onValueChange={([v]) => setGdpAdj(v)} />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>-3%</span><span>+3%</span></div>
            </div>

            {/* Volatility Adj */}
            <div>
              <div className="flex justify-between mb-1.5">
                <Label className="text-xs font-medium">Volatility Adjustment</Label>
                <span className={`text-xs font-bold ${volatilityAdj > 0 ? "text-red-600" : volatilityAdj < 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
                  {volatilityAdj > 0 ? "+" : ""}{(volatilityAdj * 100).toFixed(0)}%
                </span>
              </div>
              <Slider min={-0.2} max={0.2} step={0.01} value={[volatilityAdj]} onValueChange={([v]) => setVolatilityAdj(v)} />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>-20%</span><span>+20%</span></div>
            </div>

            {/* Debt Adj */}
            <div>
              <div className="flex justify-between mb-1.5">
                <Label className="text-xs font-medium">Debt Ratio Adjustment</Label>
                <span className={`text-xs font-bold ${debtAdj > 0 ? "text-red-600" : debtAdj < 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
                  {debtAdj > 0 ? "+" : ""}{debtAdj.toFixed(2)}x
                </span>
              </div>
              <Slider min={-0.5} max={0.5} step={0.01} value={[debtAdj]} onValueChange={([v]) => setDebtAdj(v)} />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>-0.5x</span><span>+0.5x</span></div>
            </div>

            {/* Current adjusted inputs */}
            <div className="bg-muted rounded-lg p-3 space-y-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Adjusted Inputs</p>
              {[
                { label: "GDP Growth", val: `${(baseInputs.gdpGrowth + gdpAdj).toFixed(1)}%` },
                { label: "Inflation", val: `${(baseInputs.inflation + inflationAdj).toFixed(1)}%` },
                { label: "Volatility", val: `${((baseInputs.volatility + volatilityAdj) * 100).toFixed(0)}%` },
                { label: "Debt Ratio", val: `${(baseInputs.debtRatio + debtAdj).toFixed(2)}x` },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold">{item.val}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Comparison */}
        <div className="lg:col-span-2 space-y-4">
          {/* Side-by-side cards */}
          {base && adjusted && (
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Base Scenario", data: base, color: "border-border" },
                { label: "Adjusted Scenario", data: adjusted, color: "border-primary/30 bg-primary/5" },
              ].map(({ label, data, color }) => (
                <Card key={label} className={`border-2 ${color}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold text-muted-foreground">{label}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-center">
                      <MiniGauge score={data.riskScore} size={100} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Risk Score</span>
                        <span className={`font-bold ${data.riskScore < 0.3 ? "text-emerald-600" : data.riskScore < 0.55 ? "text-amber-600" : "text-red-600"}`}>
                          {(data.riskScore * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Predicted IRR</span>
                        <span className="font-bold text-emerald-600">{data.predictedIrr.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Risk-Adj. Return</span>
                        <span className="font-bold">{data.riskAdjustedReturn.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Sharpe Proxy</span>
                        <span className="font-bold">{data.sharpeProxy.toFixed(2)}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] w-full justify-center">{data.riskLabel}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Bar comparison chart */}
          {comparisonData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Base vs. Adjusted Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={comparisonData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                    <XAxis dataKey="metric" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="base" name="Base" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="adjusted" name="Adjusted" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* AI Suggestion */}
          {optimization?.suggestion && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                    <Lightbulb className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">AI Optimization Suggestion</p>
                    <p className="text-xs text-muted-foreground mt-1">{optimization.suggestion}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Portfolio Risk Heatmap */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Portfolio Risk Heatmap
          </CardTitle>
          <p className="text-xs text-muted-foreground">Risk scores by sector and company (simulated portfolio)</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Sector</th>
                  {COMPANIES.map((c) => (
                    <th key={c} className="text-center py-2 px-3 font-semibold text-muted-foreground">Company {c}</th>
                  ))}
                  <th className="text-center py-2 px-3 font-semibold text-muted-foreground">Avg Risk</th>
                </tr>
              </thead>
              <tbody>
                {heatmapData.map((row) => {
                  const vals = COMPANIES.map((c) => row[`company${c}`] as number);
                  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
                  return (
                    <tr key={row.sector} className="border-b border-border/50">
                      <td className="py-3 px-3 font-medium">{row.sector}</td>
                      {COMPANIES.map((c) => {
                        const v = row[`company${c}`] as number;
                        return (
                          <td key={c} className="py-3 px-3 text-center">
                            <div
                              className="inline-flex items-center justify-center w-14 h-8 rounded-lg text-white text-[10px] font-bold"
                              style={{ backgroundColor: riskColor(v) }}
                            >
                              {(v * 100).toFixed(0)}%
                            </div>
                          </td>
                        );
                      })}
                      <td className="py-3 px-3 text-center">
                        <div
                          className="inline-flex items-center justify-center w-14 h-8 rounded-lg text-white text-[10px] font-bold"
                          style={{ backgroundColor: riskColor(avg) }}
                        >
                          {(avg * 100).toFixed(0)}%
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs">
            <span className="text-muted-foreground">Legend:</span>
            {[
              { label: "Low (<30%)", color: "#16a34a" },
              { label: "Moderate (30-55%)", color: "#ca8a04" },
              { label: "High (55-75%)", color: "#ea580c" },
              { label: "Critical (>75%)", color: "#dc2626" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ background: l.color }} />
                <span className="text-muted-foreground">{l.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
