import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";

import Overview from "./pages/Overview";
import RiskPredictions from "./pages/RiskPredictions";
import Forecasts from "./pages/Forecasts";
import PortfolioOptimization from "./pages/PortfolioOptimization";
import PortfolioManagement from "./pages/PortfolioManagement";
import Settings from "./pages/Settings";
import AdminPanel from "./pages/AdminPanel";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";

function DashboardRoutes() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Overview} />
        <Route path="/predictions" component={RiskPredictions} />
        <Route path="/forecasts" component={Forecasts} />
        <Route path="/portfolio/optimize" component={PortfolioOptimization} />
        <Route path="/portfolio" component={PortfolioManagement} />
        <Route path="/settings" component={Settings} />
        <Route path="/admin" component={AdminPanel} />
        <Route path="/pricing" component={Pricing} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/pricing" component={Pricing} />
            <DashboardRoutes />
            <Route component={NotFound} />
          </Switch>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;