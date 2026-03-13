import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Briefcase,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Moon,
  PanelLeft,
  Settings,
  Shield,
  Sun,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

// ─── Language Context ──────────────────────────────────────────────────────────
export const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    overview: "Overview",
    predictions: "Risk Predictions",
    forecasts: "Forecasts",
    portfolio: "Portfolio",
    optimize: "Optimization",
    settings: "Settings",
    admin: "Admin Panel",
    pricing: "Upgrade Plan",
    signIn: "Sign in to continue",
    signInDesc: "Access Rypaq — Kenya's premier private equity analytics platform.",
    signInBtn: "Sign In",
    tagline: "Strategy on Demand",
  },
  sw: {
    overview: "Muhtasari",
    predictions: "Utabiri wa Hatari",
    forecasts: "Utabiri",
    portfolio: "Mkoba",
    optimize: "Uboreshaji",
    settings: "Mipangilio",
    admin: "Paneli ya Msimamizi",
    pricing: "Panda Mpango",
    signIn: "Ingia kuendelea",
    signInDesc: "Fikia Rypaq — jukwaa kuu la uchambuzi wa hisa za Kenya.",
    signInBtn: "Ingia",
    tagline: "Akili ya Hisa za Kenya",
  },
};

const menuItems = [
  { icon: LayoutDashboard, labelKey: "overview", path: "/" },
  { icon: BarChart3, labelKey: "predictions", path: "/predictions" },
  { icon: TrendingUp, labelKey: "forecasts", path: "/forecasts" },
  { icon: Briefcase, labelKey: "portfolio", path: "/portfolio" },
  { icon: Zap, labelKey: "optimize", path: "/portfolio/optimize" },
  { icon: CreditCard, labelKey: "pricing", path: "/pricing" },
  { icon: Settings, labelKey: "settings", path: "/settings" },
];

const adminItems = [
  { icon: Users, labelKey: "admin", path: "/admin" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 360;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          {/* Logo */}
          <div className="flex flex-col items-center gap-4">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663419303496/PRiofWWmniPQCffiAVkwXN/rypaq-logo_184be8be.jpeg"
              alt="Rypaq"
              className="h-24 w-auto object-contain rounded-xl"
            />
            <div className="text-center">
              <p className="text-sm text-muted-foreground mt-1">Strategy on Demand</p>
            </div>
          </div>
          <div className="w-full bg-card border border-border rounded-2xl p-8 shadow-sm text-center space-y-4">
            <h2 className="text-xl font-semibold">Sign in to continue</h2>
            <p className="text-sm text-muted-foreground">
              Access Rypaq — Kenya's premier private equity analytics platform powered by PesaRisk Net.
            </p>
            <Button
              onClick={() => { window.location.href = getLoginUrl(); }}
              size="lg"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              Sign In to Rypaq
            </Button>
            <p className="text-xs text-muted-foreground">
              Protected by Kenya DPA-compliant authentication
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (w: number) => void;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { theme, toggleTheme } = useTheme();
  const [lang, setLang] = useState<"en" | "sw">(() => (localStorage.getItem("rypaq-lang") as "en" | "sw") || "en");

  const t = (key: string) => TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key;

  const toggleLang = () => {
    const next = lang === "en" ? "sw" : "en";
    setLang(next);
    localStorage.setItem("rypaq-lang", next);
  };

  const { data: alertCount } = trpc.alerts.getUnreadCount.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const left = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const w = e.clientX - left;
      if (w >= MIN_WIDTH && w <= MAX_WIDTH) setSidebarWidth(w);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const tierColors: Record<string, string> = {
    free: "bg-muted text-muted-foreground",
    pro: "bg-primary/10 text-primary",
    enterprise: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  };

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar" disableTransition={isResizing}>
          {/* Header */}
          <SidebarHeader className="h-16 justify-center border-b border-sidebar-border">
            <div className="flex items-center gap-3 px-2">
              <button
                onClick={toggleSidebar}
                className="h-9 w-9 flex items-center justify-center hover:bg-sidebar-accent rounded-lg transition-colors shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-sidebar-foreground/60" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src="https://d2xsxph8kpxj0f.cloudfront.net/310519663419303496/PRiofWWmniPQCffiAVkwXN/rypaq-logo_184be8be.jpeg"
                    alt="Rypaq"
                    className="h-8 w-auto object-contain rounded shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] text-sidebar-foreground/50 truncate">{t("tagline")}</p>
                  </div>
                </div>
              )}
            </div>
          </SidebarHeader>

          {/* Navigation */}
          <SidebarContent className="gap-0 py-2">
            <SidebarMenu className="px-2 space-y-0.5">
              {menuItems.map((item) => {
                const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={t(item.labelKey)}
                      className={`h-10 transition-all font-medium text-sm ${isActive ? "bg-primary/15 text-primary" : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"}`}
                    >
                      <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                      <span>{t(item.labelKey)}</span>
                      {isActive && !isCollapsed && <ChevronRight className="ml-auto h-3 w-3 opacity-60" />}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              {isAdmin && (
                <>
                  {!isCollapsed && (
                    <div className="px-3 pt-3 pb-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">Admin</p>
                    </div>
                  )}
                  {adminItems.map((item) => {
                    const isActive = location === item.path;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setLocation(item.path)}
                          tooltip={t(item.labelKey)}
                          className={`h-10 transition-all font-medium text-sm ${isActive ? "bg-primary/15 text-primary" : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"}`}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{t(item.labelKey)}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </>
              )}
            </SidebarMenu>
          </SidebarContent>

          {/* Footer */}
          <SidebarFooter className="border-t border-sidebar-border p-3 space-y-2">
            {/* Tier badge */}
            {!isCollapsed && (
              <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-center ${tierColors[user?.tier ?? "free"]}`}>
                {(user?.tier ?? "free").toUpperCase()} PLAN
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-sidebar-accent transition-colors w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
                  <Avatar className="h-8 w-8 border border-sidebar-border shrink-0">
                    <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                      {user?.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-sidebar-foreground truncate">{user?.name || "User"}</p>
                      <p className="text-[10px] text-sidebar-foreground/50 truncate capitalize">{user?.role ?? "analyst"}</p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    <Badge variant="outline" className="w-fit text-[10px] capitalize">{user?.role}</Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleTheme}>
                  {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleLang}>
                  <span className="mr-2 text-sm">🌍</span>
                  {lang === "en" ? "Kiswahili" : "English"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Resize handle */}
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/30 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/95 backdrop-blur px-4 gap-4">
          <div className="flex items-center gap-3">
            {isMobile && <SidebarTrigger className="h-9 w-9 rounded-lg" />}
            {!isMobile && isCollapsed && (
              <div className="flex items-center gap-2">
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663419303496/PRiofWWmniPQCffiAVkwXN/rypaq-logo_184be8be.jpeg"
                  alt="Rypaq"
                  className="h-7 w-auto object-contain rounded"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <Button variant="ghost" size="sm" onClick={toggleLang} className="text-xs font-medium px-2 h-8">
              🌍 {lang === "en" ? "SW" : "EN"}
            </Button>

            {/* Theme toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Alerts bell */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 relative"
              onClick={() => setLocation("/settings")}
            >
              <Bell className="h-4 w-4" />
              {alertCount && alertCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">
                  {alertCount > 9 ? "9+" : alertCount}
                </span>
              ) : null}
            </Button>

            {/* Upgrade CTA for free users */}
            {user?.tier === "free" && (
              <Button
                size="sm"
                className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white font-semibold hidden sm:flex"
                onClick={() => setLocation("/pricing")}
              >
                <Zap className="h-3 w-3 mr-1" />
                Upgrade
              </Button>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}
