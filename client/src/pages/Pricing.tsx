import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Shield, Zap, Building2, X } from "lucide-react";
import { toast } from "sonner";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    currency: "KES",
    period: "forever",
    icon: Shield,
    color: "border-border",
    badge: null,
    features: [
      { text: "5 predictions per month", included: true },
      { text: "Overview dashboard", included: true },
      { text: "Basic risk scoring", included: true },
      { text: "Kenya macro indicators", included: true },
      { text: "Batch CSV upload", included: false },
      { text: "SHAP explainability", included: false },
      { text: "5-year forecasts", included: false },
      { text: "Portfolio optimization", included: false },
      { text: "Priority support", included: false },
      { text: "API access", included: false },
    ],
    cta: "Current Plan",
    disabled: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: 4999,
    currency: "KES",
    period: "month",
    icon: Zap,
    color: "border-primary ring-2 ring-primary/20",
    badge: "Most Popular",
    features: [
      { text: "100 predictions per month", included: true },
      { text: "All Free features", included: true },
      { text: "Batch CSV upload (100 rows)", included: true },
      { text: "SHAP explainability charts", included: true },
      { text: "5-year IRR forecasts", included: true },
      { text: "Portfolio optimization", included: true },
      { text: "Scenario analysis (Bear/Base/Bull)", included: true },
      { text: "Email alerts & notifications", included: true },
      { text: "Priority support", included: false },
      { text: "API access", included: false },
    ],
    cta: "Upgrade to Pro",
    disabled: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 24999,
    currency: "KES",
    period: "month",
    icon: Building2,
    color: "border-amber-400/50",
    badge: "Best Value",
    features: [
      { text: "Unlimited predictions", included: true },
      { text: "All Pro features", included: true },
      { text: "Batch CSV upload (unlimited)", included: true },
      { text: "Custom model fine-tuning", included: true },
      { text: "White-label dashboard", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "SLA 99.9% uptime", included: true },
      { text: "Priority support (24/7)", included: true },
      { text: "Full REST API access", included: true },
      { text: "Kenya DPA compliance audit", included: true },
    ],
    cta: "Contact Sales",
    disabled: false,
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const currentTier = (user as any)?.tier ?? "free";

  const handleUpgrade = (planId: string) => {
    if (planId === "enterprise") {
      toast.info("Enterprise sales", { description: "Contact sales@rypaq.com for enterprise pricing and custom setup." });
      return;
    }
    toast.info("Stripe integration coming soon", {
      description: "Payment processing will be enabled shortly. Contact support@rypaq.com to upgrade manually.",
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Choose Your Plan</h1>
        <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
          Unlock the full power of PesaRisk Net for Kenya's private equity market. All plans include Kenya DPA compliance.
        </p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <Badge variant="outline" className="text-xs">
            🇰🇪 Kenya Shilling pricing
          </Badge>
          <Badge variant="outline" className="text-xs">
            DPA Compliant
          </Badge>
        </div>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = currentTier === plan.id;
          return (
            <Card key={plan.id} className={`relative border-2 transition-all ${plan.color} ${isCurrent ? "bg-primary/5" : ""}`}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground text-xs px-3">{plan.badge}</Badge>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-emerald-500 text-white text-xs px-3">Current Plan</Badge>
                </div>
              )}
              <CardHeader className="pb-4 pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2.5 rounded-xl ${plan.id === "free" ? "bg-muted" : plan.id === "pro" ? "bg-primary/10" : "bg-amber-100 dark:bg-amber-950/30"}`}>
                    <Icon className={`h-5 w-5 ${plan.id === "free" ? "text-muted-foreground" : plan.id === "pro" ? "text-primary" : "text-amber-600"}`} />
                  </div>
                  <CardTitle className="text-lg font-bold">{plan.name}</CardTitle>
                </div>
                <div className="flex items-baseline gap-1">
                  {plan.price === 0 ? (
                    <span className="text-3xl font-bold text-foreground">Free</span>
                  ) : (
                    <>
                      <span className="text-sm text-muted-foreground">KES</span>
                      <span className="text-3xl font-bold text-foreground">{plan.price.toLocaleString()}</span>
                      <span className="text-sm text-muted-foreground">/{plan.period}</span>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  className={`w-full font-semibold ${plan.id === "pro" ? "bg-primary text-primary-foreground hover:bg-primary/90" : plan.id === "enterprise" ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}`}
                  variant={plan.id === "free" ? "outline" : "default"}
                  disabled={isCurrent || plan.disabled}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {isCurrent ? "Current Plan" : plan.cta}
                </Button>

                <div className="space-y-2.5">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      {feature.included ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                      )}
                      <span className={`text-xs ${feature.included ? "text-foreground" : "text-muted-foreground/60"}`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { q: "What is a prediction?", a: "A prediction is one run of the PesaRisk Net model with your input parameters, returning a risk score and IRR estimate." },
            { q: "Can I cancel anytime?", a: "Yes, all plans are month-to-month with no lock-in. Cancel anytime from your account settings." },
            { q: "Is my data safe?", a: "Yes. All data is encrypted and processed in compliance with the Kenya Data Protection Act (2019)." },
            { q: "What payment methods are accepted?", a: "M-Pesa, Visa, Mastercard, and bank transfer. All payments processed securely via Stripe." },
          ].map((item) => (
            <div key={item.q} className="space-y-1">
              <p className="text-sm font-semibold text-foreground">{item.q}</p>
              <p className="text-xs text-muted-foreground">{item.a}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
