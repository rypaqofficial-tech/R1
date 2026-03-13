import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Briefcase, Plus, Trash2, Edit2, TrendingUp, BarChart3, Filter } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  monitoring: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  exited: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  watchlist: "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
};

const SECTOR_COLORS = ["#16a34a", "#ca8a04", "#2563eb", "#9333ea", "#ea580c", "#64748b", "#0891b2", "#d97706"];

export default function PortfolioManagement() {
  const [newDeal, setNewDeal] = useState({ name: "", sector: "Fintech", notes: "", investmentAmount: "" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: deals, refetch } = trpc.portfolio.getDeals.useQuery();

  const saveDeal = trpc.portfolio.saveDeal.useMutation({
    onSuccess: () => {
      refetch();
      setDialogOpen(false);
      setNewDeal({ name: "", sector: "Fintech", notes: "", investmentAmount: "" });
      toast.success("Deal saved to portfolio!");
    },
    onError: (err) => toast.error("Failed to save deal", { description: err.message }),
  });

  const updateDeal = trpc.portfolio.updateDeal.useMutation({
    onSuccess: () => { refetch(); toast.success("Deal updated"); },
  });

  const deleteDeal = trpc.portfolio.deleteDeal.useMutation({
    onSuccess: () => { refetch(); toast.success("Deal removed"); },
  });

  const filteredDeals = deals?.filter((d) => statusFilter === "all" || d.status === statusFilter) ?? [];

  // Sector distribution
  const sectorData = deals
    ? Object.entries(
        deals.reduce((acc, d) => {
          const s = d.sector ?? "Unknown";
          acc[s] = (acc[s] ?? 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([name, value], i) => ({ name, value, color: SECTOR_COLORS[i % SECTOR_COLORS.length] }))
    : [];

  const statusCounts = deals
    ? deals.reduce((acc, d) => { acc[d.status] = (acc[d.status] ?? 0) + 1; return acc; }, {} as Record<string, number>)
    : {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Portfolio Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track, manage, and analyze your private equity deals
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary text-primary-foreground">
              <Plus className="h-4 w-4" />
              Add Deal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Deal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label className="text-xs font-medium">Deal Name *</Label>
                <Input className="mt-1 h-9 text-sm" placeholder="e.g. Nairobi Fintech Series A"
                  value={newDeal.name} onChange={(e) => setNewDeal({ ...newDeal, name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs font-medium">Sector</Label>
                <select className="mt-1 w-full h-9 text-sm rounded-md border border-input bg-background px-3 focus:outline-none focus:ring-2 focus:ring-ring"
                  value={newDeal.sector} onChange={(e) => setNewDeal({ ...newDeal, sector: e.target.value })}>
                  {["Fintech", "Agribusiness", "Healthcare", "Energy", "Real Estate", "Logistics", "Manufacturing", "Telecom"].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs font-medium">Investment Amount (KES)</Label>
                <Input className="mt-1 h-9 text-sm" placeholder="e.g. 50,000,000"
                  value={newDeal.investmentAmount} onChange={(e) => setNewDeal({ ...newDeal, investmentAmount: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs font-medium">Notes</Label>
                <textarea className="mt-1 w-full text-sm rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  rows={3} placeholder="Deal notes, thesis, key risks..."
                  value={newDeal.notes} onChange={(e) => setNewDeal({ ...newDeal, notes: e.target.value })} />
              </div>
              <Button className="w-full" onClick={() => saveDeal.mutate(newDeal)} disabled={!newDeal.name || saveDeal.isPending}>
                {saveDeal.isPending ? "Saving..." : "Save Deal"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Deals", value: deals?.length ?? 0, color: "text-foreground" },
          { label: "Active", value: statusCounts.active ?? 0, color: "text-emerald-600" },
          { label: "Monitoring", value: statusCounts.monitoring ?? 0, color: "text-amber-600" },
          { label: "Exited", value: statusCounts.exited ?? 0, color: "text-blue-600" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sector Distribution */}
        {sectorData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Sector Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={sectorData} cx="50%" cy="50%" outerRadius={65} paddingAngle={2} dataKey="value">
                    {sectorData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [v, "Deals"]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {sectorData.map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                      <span className="text-muted-foreground">{s.name}</span>
                    </div>
                    <span className="font-semibold">{s.value} deal{s.value !== 1 ? "s" : ""}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Deals Table */}
        <Card className={sectorData.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Deals ({filteredDeals.length})
              </CardTitle>
              <div className="flex gap-1">
                {["all", "active", "monitoring", "exited", "watchlist"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredDeals.length > 0 ? (
              <div className="space-y-2">
                {filteredDeals.map((deal) => (
                  <div key={deal.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-all">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Briefcase className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">{deal.name}</p>
                        <Badge className={`text-[10px] shrink-0 ${STATUS_COLORS[deal.status]}`} variant="outline">
                          {deal.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {deal.sector && <span className="text-xs text-muted-foreground">{deal.sector}</span>}
                        {deal.investmentAmount && (
                          <span className="text-xs text-muted-foreground">
                            KES {Number(deal.investmentAmount).toLocaleString()}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(deal.createdAt).toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                      {deal.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{deal.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <select
                        className="h-7 text-[10px] rounded border border-input bg-background px-1.5 focus:outline-none"
                        value={deal.status}
                        onChange={(e) => updateDeal.mutate({ dealId: deal.id, data: { status: e.target.value as any } })}
                      >
                        {["active", "monitoring", "exited", "watchlist"].map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteDeal.mutate({ dealId: deal.id })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No deals yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add your first deal to start tracking your portfolio.
                </p>
                <Button size="sm" className="mt-4" onClick={() => setDialogOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add First Deal
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
