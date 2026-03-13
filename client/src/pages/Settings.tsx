import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Bell,
  Globe,
  Lock,
  Moon,
  Shield,
  Sun,
  User,
  CheckCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [lang, setLang] = useState<"en" | "sw">(() => (localStorage.getItem("rypaq-lang") as "en" | "sw") || "en");
  const [notifPrefs, setNotifPrefs] = useState({
    highRiskAlerts: true,
    opportunityAlerts: true,
    macroChanges: false,
    weeklyDigest: true,
    emailNotifications: true,
  });

  const { data: alerts } = trpc.alerts.getAll.useQuery();
  const markAllRead = trpc.alerts.markAllRead.useMutation({
    onSuccess: () => toast.success("All alerts marked as read"),
  });

  const handleLangChange = (newLang: "en" | "sw") => {
    setLang(newLang);
    localStorage.setItem("rypaq-lang", newLang);
    toast.success(`Language changed to ${newLang === "en" ? "English" : "Kiswahili"}`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account, preferences, and notifications</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="notifications">Alerts</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                  {user?.name?.charAt(0).toUpperCase() ?? "U"}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px] capitalize">{user?.role ?? "analyst"}</Badge>
                    <Badge variant="outline" className="text-[10px] capitalize bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400">
                      {(user as any)?.tier ?? "free"} plan
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <Label className="text-xs font-medium">Full Name</Label>
                  <Input className="mt-1 h-9 text-sm" defaultValue={user?.name ?? ""} disabled />
                </div>
                <div>
                  <Label className="text-xs font-medium">Email Address</Label>
                  <Input className="mt-1 h-9 text-sm" defaultValue={user?.email ?? ""} disabled />
                </div>
                <div>
                  <Label className="text-xs font-medium">Role</Label>
                  <Input className="mt-1 h-9 text-sm" defaultValue={user?.role ?? "analyst"} disabled />
                </div>
                <div>
                  <Label className="text-xs font-medium">Member Since</Label>
                  <Input className="mt-1 h-9 text-sm" defaultValue={user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-KE") : "—"} disabled />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Profile information is managed through your OAuth provider. Contact support to update your details.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sun className="h-4 w-4 text-primary" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Dark Mode</p>
                  <p className="text-xs text-muted-foreground">Switch between light and dark themes</p>
                </div>
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-muted-foreground" />
                  <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
                  <Moon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                Language
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { code: "en", label: "English", flag: "🇬🇧", desc: "Default language" },
                  { code: "sw", label: "Kiswahili", flag: "🇰🇪", desc: "Lugha ya Kenya" },
                ].map((l) => (
                  <button
                    key={l.code}
                    onClick={() => handleLangChange(l.code as "en" | "sw")}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${lang === l.code ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{l.flag}</span>
                      <span className="font-semibold text-sm">{l.label}</span>
                      {lang === l.code && <CheckCircle className="h-4 w-4 text-primary ml-auto" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{l.desc}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "highRiskAlerts", label: "High Risk Alerts", desc: "Notify when risk score exceeds 70%" },
                { key: "opportunityAlerts", label: "Opportunity Alerts", desc: "Notify when IRR exceeds 25%" },
                { key: "macroChanges", label: "Macro Changes", desc: "Notify on significant Kenya macro shifts" },
                { key: "weeklyDigest", label: "Weekly Digest", desc: "Weekly portfolio performance summary" },
                { key: "emailNotifications", label: "Email Notifications", desc: "Receive alerts via email" },
              ].map((pref) => (
                <div key={pref.key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{pref.label}</p>
                    <p className="text-xs text-muted-foreground">{pref.desc}</p>
                  </div>
                  <Switch
                    checked={notifPrefs[pref.key as keyof typeof notifPrefs]}
                    onCheckedChange={(v) => {
                      setNotifPrefs({ ...notifPrefs, [pref.key]: v });
                      toast.success(`${pref.label} ${v ? "enabled" : "disabled"}`);
                    }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Alerts */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Recent Alerts</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => markAllRead.mutate()}>
                  Mark all read
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {alerts && alerts.length > 0 ? (
                <div className="space-y-2">
                  {alerts.slice(0, 10).map((alert) => (
                    <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg border ${!alert.isRead ? "border-primary/20 bg-primary/5" : "border-border"}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold">{alert.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{alert.message}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-[10px]">{alert.severity}</Badge>
                        {!alert.isRead && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No alerts yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy / DPA */}
        <TabsContent value="privacy" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Kenya Data Protection Act Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">DPA Compliant</p>
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-500">
                  Rypaq is fully compliant with the Kenya Data Protection Act (2019). All data is processed and stored in accordance with Kenyan law.
                </p>
              </div>

              {[
                { title: "Data Anonymization", desc: "All prediction inputs are anonymized before processing. No personally identifiable information (PII) is stored in the model inference pipeline." },
                { title: "Data Minimization", desc: "We only collect data strictly necessary for providing the service. Financial metrics are processed in aggregate form." },
                { title: "Right to Erasure", desc: "You can request deletion of all your data at any time. Contact support@rypaq.com to exercise this right." },
                { title: "Data Residency", desc: "All data is stored within Kenya or East Africa region servers, complying with local data sovereignty requirements." },
                { title: "Encryption", desc: "All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Prediction results are stored with access controls." },
              ].map((item) => (
                <div key={item.title} className="border-b border-border pb-3 last:border-0">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" size="sm" className="text-xs">
                  <Lock className="h-3.5 w-3.5 mr-1.5" />
                  Download My Data
                </Button>
                <Button variant="outline" size="sm" className="text-xs text-destructive hover:text-destructive">
                  Request Data Deletion
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
