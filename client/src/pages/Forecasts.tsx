import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, BarChart3, Info } from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function Forecasts() {
  const [baseIrr, setBaseIrr] = useState(18.4);
  const [gdpAssumption, setGdpAssumption] = useState(4.7);
  const [inflationAssumption, setInflationAssumption] = useState(4.5);
  const [horizon, setHorizon] = useState(5);

  const { data: forecast, isLoading } = trpc.forecasts.generate.useQuery(
    { baseIrr, gdpAssumption, inflationAssumption, horizon },
    { keepPreviousData: true } as any
  );

  const chartData = forecast
    ? forecast.years.map((y, i) => ({
        year: `Year ${y}`,
        base: forecast.base[i],
        bear: forecast.bear[i],
        bull: forecast.bull[i],
        lowerCI: forecast.lowerCI[i],
        upperCI: forecast.upperCI[i],
      }))
    : [];

  const scenarioData = forecast
    ? [
        { scenario: "Bear", irr: forecast.bear[forecast.years.length - 1], color: "#dc2626" },
        { scenario: "Base", irr: forecast.base[forecast.years.length - 1], color: "#16a34a" },
        { scenario: "Bull", irr: forecast.bull[forecast.years.length - 1], color: "#2563eb" },
      ]
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">IRR Forecasts</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          5-year IRR projections with confidence intervals and scenario analysis
        </p>
      </div>

      {/* Assumptions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Forecast Assumptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <div className="flex justify-between mb-1.5">
                <Label className="text-xs font-medium">Base IRR</Label>
                <span className="text-xs font-bold text-emerald-600">{baseIrr.toFixed(1)}%</span>
              </div>
              <Slider min={5} max={35} step={0.5} value={[baseIrr]} onValueChange={([v]) => setBaseIrr(v)} />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>5%</span><span>35%</span></div>
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <Label className="text-xs font-medium">GDP Assumption</Label>
                <span className="text-xs font-bold text-primary">{gdpAssumption.toFixed(1)}%</span>
              </div>
              <Slider min={0} max={10} step={0.1} value={[gdpAssumption]} onValueChange={([v]) => setGdpAssumption(v)} />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>0%</span><span>10%</span></div>
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <Label className="text-xs font-medium">Inflation Assumption</Label>
                <span className="text-xs font-bold text-amber-600">{inflationAssumption.toFixed(1)}%</span>
              </div>
              <Slider min={0} max={15} step={0.1} value={[inflationAssumption]} onValueChange={([v]) => setInflationAssumption(v)} />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>0%</span><span>15%</span></div>
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <Label className="text-xs font-medium">Horizon</Label>
                <span className="text-xs font-bold text-foreground">{horizon} years</span>
              </div>
              <Slider min={3} max={10} step={1} value={[horizon]} onValueChange={([v]) => setHorizon(v)} />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>3yr</span><span>10yr</span></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="projection">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="projection">Projection</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="sensitivity">Sensitivity</TabsTrigger>
        </TabsList>

        {/* ── IRR Projection ── */}
        <TabsContent value="projection" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  {horizon}-Year IRR Projection with 95% Confidence Interval
                </CardTitle>
                <div className="flex gap-3 text-xs">
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-primary inline-block" />Base</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500 inline-block" />Bear</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 inline-block" />Bull</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} domain={["auto", "auto"]} />
                  <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, ""]} />
                  <Area type="monotone" dataKey="upperCI" stroke="transparent" fill="url(#ciGrad)" />
                  <Area type="monotone" dataKey="lowerCI" stroke="transparent" fill="white" fillOpacity={1} />
                  <Line type="monotone" dataKey="bear" stroke="#dc2626" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                  <Line type="monotone" dataKey="bull" stroke="#2563eb" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                  <Line type="monotone" dataKey="base" stroke="#16a34a" strokeWidth={2.5} dot={{ fill: "#16a34a", r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>

              {/* Summary Table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Year</th>
                      <th className="text-right py-2 px-3 font-semibold text-red-600">Bear</th>
                      <th className="text-right py-2 px-3 font-semibold text-emerald-600">Base</th>
                      <th className="text-right py-2 px-3 font-semibold text-blue-600">Bull</th>
                      <th className="text-right py-2 px-3 font-semibold text-muted-foreground">95% CI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((row, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 px-3 font-medium">{row.year}</td>
                        <td className="py-2 px-3 text-right text-red-600 font-semibold">{row.bear.toFixed(1)}%</td>
                        <td className="py-2 px-3 text-right text-emerald-600 font-bold">{row.base.toFixed(1)}%</td>
                        <td className="py-2 px-3 text-right text-blue-600 font-semibold">{row.bull.toFixed(1)}%</td>
                        <td className="py-2 px-3 text-right text-muted-foreground">{row.lowerCI.toFixed(1)}–{row.upperCI.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Scenario Comparison ── */}
        <TabsContent value="scenarios" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Bear / Base / Bull Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={scenarioData} margin={{ top: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                    <XAxis dataKey="scenario" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, "Terminal IRR"]} />
                    <Bar dataKey="irr" radius={[6, 6, 0, 0]}>
                      {scenarioData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Scenario Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: "Bear Case", color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800", irr: forecast?.bear[forecast.years.length - 1], desc: "Elevated inflation, slower GDP growth, high volatility. Assumes macro headwinds persist." },
                  { name: "Base Case", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800", irr: forecast?.base[forecast.years.length - 1], desc: "Current Kenya macro trajectory maintained. Moderate growth with stable inflation." },
                  { name: "Bull Case", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800", irr: forecast?.bull[forecast.years.length - 1], desc: "Strong GDP growth, controlled inflation, favorable policy environment. Upside scenario." },
                ].map((s) => (
                  <div key={s.name} className={`p-4 rounded-xl border ${s.bg}`}>
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-sm font-bold ${s.color}`}>{s.name}</p>
                      <p className={`text-xl font-bold ${s.color}`}>{s.irr?.toFixed(1)}% IRR</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Sensitivity Analysis ── */}
        <TabsContent value="sensitivity" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">GDP Growth Sensitivity</CardTitle>
                <p className="text-xs text-muted-foreground">How GDP growth affects projected IRR</p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 font-semibold text-muted-foreground">GDP Growth</th>
                        <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Year 3 IRR</th>
                        <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Year 5 IRR</th>
                        <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Δ vs Base</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecast?.gdpSensitivity.map((row) => (
                        <tr key={row.gdp} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-2 px-3 font-medium">{row.gdp.toFixed(1)}%</td>
                          <td className="py-2 px-3 text-right text-emerald-600 font-semibold">{row.year3Irr.toFixed(1)}%</td>
                          <td className="py-2 px-3 text-right text-emerald-600 font-bold">{row.year5Irr.toFixed(1)}%</td>
                          <td className="py-2 px-3 text-right">
                            <span className={row.year5Irr > baseIrr ? "text-emerald-600" : "text-red-600"}>
                              {row.year5Irr > baseIrr ? "+" : ""}{(row.year5Irr - baseIrr).toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Inflation Sensitivity</CardTitle>
                <p className="text-xs text-muted-foreground">How inflation affects projected IRR</p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Inflation</th>
                        <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Year 3 IRR</th>
                        <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Year 5 IRR</th>
                        <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Δ vs Base</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecast?.inflationSensitivity.map((row) => (
                        <tr key={row.inflation} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-2 px-3 font-medium">{row.inflation.toFixed(1)}%</td>
                          <td className="py-2 px-3 text-right text-emerald-600 font-semibold">{row.year3Irr.toFixed(1)}%</td>
                          <td className="py-2 px-3 text-right text-emerald-600 font-bold">{row.year5Irr.toFixed(1)}%</td>
                          <td className="py-2 px-3 text-right">
                            <span className={row.year5Irr > baseIrr ? "text-emerald-600" : "text-red-600"}>
                              {row.year5Irr > baseIrr ? "+" : ""}{(row.year5Irr - baseIrr).toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
