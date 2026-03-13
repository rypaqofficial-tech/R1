import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, Shield, BarChart3, AlertTriangle, Search, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function AdminPanel() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");

  const { data: users, refetch } = trpc.admin.getUsers.useQuery();
  const { data: systemStats } = trpc.admin.getSystemStats.useQuery();

  const updateRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => { refetch(); toast.success("User role updated"); },
    onError: (err) => toast.error("Failed to update role", { description: err.message }),
  });

  const updateTier = trpc.admin.updateUserTier.useMutation({
    onSuccess: () => { refetch(); toast.success("User tier updated"); },
    onError: (err) => toast.error("Failed to update tier", { description: err.message }),
  });

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertTriangle className="h-16 w-16 text-destructive/40 mb-4" />
        <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
        <p className="text-sm text-muted-foreground mt-2">You need admin privileges to access this panel.</p>
        <Button className="mt-4" onClick={() => setLocation("/")}>Back to Dashboard</Button>
      </div>
    );
  }

  const filteredUsers = users?.filter((u) =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage users, monitor system health, and view analytics</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: systemStats?.totalUsers ?? 0, icon: Users, color: "text-primary" },
          { label: "Total Predictions", value: systemStats?.totalPredictions ?? 0, icon: BarChart3, color: "text-emerald-600" },
          { label: "Active Today", value: systemStats?.activeToday ?? 0, icon: Shield, color: "text-blue-600" },
          { label: "Unread Alerts", value: systemStats?.unreadAlerts ?? 0, icon: AlertTriangle, color: "text-amber-600" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 opacity-20 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User Management */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              User Management ({filteredUsers.length})
            </CardTitle>
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                className="pl-8 h-8 text-xs"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  {["User", "Email", "Role", "Tier", "Joined", "Actions"].map((h) => (
                    <th key={h} className="text-left py-2 px-3 font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {u.name?.charAt(0).toUpperCase() ?? "U"}
                        </div>
                        <span className="font-medium">{u.name ?? "Unknown"}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">{u.email ?? "—"}</td>
                    <td className="py-2.5 px-3">
                      <select
                        className="h-6 text-[10px] rounded border border-input bg-background px-1.5 focus:outline-none"
                        value={u.role}
                        onChange={(e) => updateRole.mutate({ userId: u.id, role: e.target.value as "admin" | "analyst" | "investor" })}
                        disabled={u.id === user?.id}
                      >
                        <option value="analyst">analyst</option>
                        <option value="investor">investor</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        className="h-6 text-[10px] rounded border border-input bg-background px-1.5 focus:outline-none"
                        value={(u as any).tier ?? "free"}
                        onChange={(e) => updateTier.mutate({ userId: u.id, tier: e.target.value as any })}
                      >
                        <option value="free">free</option>
                        <option value="pro">pro</option>
                        <option value="enterprise">enterprise</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="py-2.5 px-3">
                      {u.id === user?.id ? (
                        <Badge variant="outline" className="text-[10px]">You</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">Active</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No users found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
