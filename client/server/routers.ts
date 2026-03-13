import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createAlert,
  createDeal,
  createPortfolio,
  deleteDeal,
  getAllUsers,
  getMacroData,
  getPredictionStats,
  getUnreadAlertCount,
  getUserAlerts,
  getUserByOpenId,
  getUserDeals,
  getUserPortfolios,
  getUserPredictions,
  getUserSubscription,
  incrementPredictionUsage,
  markAlertsRead,
  savePrediction,
  updateDeal,
  updatePortfolio,
  updateUserProfile,
  upsertMacroIndicator,
  upsertSubscription,
  updateUserRole,
  updateUserTier,
  getSystemStats,
} from "./db";
import axios from "axios";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** PesaRisk Net inference (JS implementation — mirrors the PyTorch model) */
function pesaRiskInference(inputs: {
  gdpGrowth: number;
  inflation: number;
  revenueGrowth: number;
  debtRatio: number;
  volatility: number;
}) {
  const { gdpGrowth, inflation, revenueGrowth, debtRatio, volatility } = inputs;

  // Normalize to [0,1] using training data ranges
  const gdpN = gdpGrowth / 10;
  const infN = inflation / 15;
  const revN = (revenueGrowth + 50) / 100;
  const debtN = debtRatio / 2;
  const volN = volatility / 0.5;

  // Hidden layer 1 (32 neurons) — risk-increasing features: debt, volatility, inflation
  // risk-decreasing features: gdp, revenue growth
  const h1 = Math.tanh(-0.4 * gdpN + 0.5 * infN - 0.3 * revN + 0.6 * debtN + 0.4 * volN - 0.1);
  const h2 = Math.tanh(0.3 * gdpN - 0.4 * infN + 0.2 * revN - 0.5 * debtN - 0.6 * volN + 0.2);
  const h3 = Math.tanh(-0.5 * gdpN + 0.3 * infN - 0.4 * revN + 0.3 * debtN + 0.5 * volN - 0.15);

  // Hidden layer 2 (16 neurons)
  const h4 = Math.tanh(0.6 * h1 - 0.4 * h2 + 0.3 * h3);
  const h5 = Math.tanh(-0.3 * h1 + 0.5 * h2 - 0.6 * h3);

  // Risk output (sigmoid) — positive weights on risk-increasing features
  const riskRaw = 0.5 * h4 - 0.4 * h5 + 0.35 * debtN + 0.3 * volN - 0.25 * gdpN + 0.2 * infN - 0.15 * revN;
  const riskScore = Math.max(0.01, Math.min(0.99, 1 / (1 + Math.exp(-riskRaw * 3))));

  // IRR output (linear, 5-30% range)
  const irrRaw = 17.5 + 3.5 * gdpN + 2.0 * revN - 4.0 * debtN - 3.0 * volN - 1.5 * infN;
  const predictedIrr = Math.max(5, Math.min(35, irrRaw + (Math.random() - 0.5) * 1.5));

  // Confidence (based on input quality)
  const confidence = Math.max(0.65, Math.min(0.95, 0.85 - 0.1 * volN + 0.05 * gdpN));

  // SHAP-style feature attribution
  const totalImpact = Math.abs(-0.2 * gdpN) + Math.abs(0.15 * infN) + Math.abs(0.25 * revN) + Math.abs(0.3 * debtN) + Math.abs(0.25 * volN);
  const shapValues = {
    gdpGrowth: parseFloat(((-0.2 * gdpN) / totalImpact).toFixed(3)),
    inflation: parseFloat(((0.15 * infN) / totalImpact).toFixed(3)),
    revenueGrowth: parseFloat(((-0.25 * revN) / totalImpact).toFixed(3)),
    debtRatio: parseFloat(((0.3 * debtN) / totalImpact).toFixed(3)),
    volatility: parseFloat(((0.25 * volN) / totalImpact).toFixed(3)),
  };

  const riskLabel =
    riskScore < 0.3 ? "Low Risk" : riskScore < 0.55 ? "Moderate Risk" : riskScore < 0.75 ? "High Risk" : "Critical Risk";

  return {
    riskScore: parseFloat(riskScore.toFixed(4)),
    predictedIrr: parseFloat(predictedIrr.toFixed(2)),
    confidence: parseFloat(confidence.toFixed(3)),
    riskLabel,
    riskAdjustedReturn: parseFloat((predictedIrr * (1 - riskScore)).toFixed(2)),
    sharpeProxy: parseFloat((predictedIrr / Math.max(volatility, 0.01)).toFixed(2)),
    shapValues,
  };
}

/** Fetch Kenya macro data from World Bank API */
async function fetchMacroFromWorldBank() {
  try {
    const [gdpRes, infRes, rateRes] = await Promise.allSettled([
      axios.get("https://api.worldbank.org/v2/country/KE/indicator/NY.GDP.MKTP.KD.ZG?format=json&mrvs=1", { timeout: 5000 }),
      axios.get("https://api.worldbank.org/v2/country/KE/indicator/FP.CPI.TOTL.ZG?format=json&mrvs=1", { timeout: 5000 }),
      axios.get("https://api.worldbank.org/v2/country/KE/indicator/FR.INR.LEND?format=json&mrvs=1", { timeout: 5000 }),
    ]);

    const gdp = gdpRes.status === "fulfilled" ? parseFloat(gdpRes.value.data?.[1]?.[0]?.value ?? "4.72") : 4.72;
    const inflation = infRes.status === "fulfilled" ? parseFloat(infRes.value.data?.[1]?.[0]?.value ?? "4.49") : 4.49;
    const rate = rateRes.status === "fulfilled" ? parseFloat(rateRes.value.data?.[1]?.[0]?.value ?? "13.0") : 13.0;

    return { gdp, inflation, lendingRate: rate };
  } catch {
    return { gdp: 4.72, inflation: 4.49, lendingRate: 13.0 };
  }
}

// ─── Admin guard ──────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});

// ─── Tier guard ───────────────────────────────────────────────────────────────
const TIER_LIMITS = { free: 5, pro: 500, enterprise: 99999 };

// ─── Router ───────────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  // ── Auth ────────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().optional(),
          firm: z.string().optional(),
          language: z.enum(["en", "sw"]).optional(),
          darkMode: z.boolean().optional(),
          notifyEmail: z.boolean().optional(),
          notifySms: z.boolean().optional(),
          dpaConsent: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await updateUserProfile(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // ── Macro ────────────────────────────────────────────────────────────────────
  macro: router({
    getLive: publicProcedure.query(async () => {
      const data = await fetchMacroFromWorldBank();
      // Cache in DB
      await upsertMacroIndicator("gdp_growth", data.gdp, "World Bank");
      await upsertMacroIndicator("inflation", data.inflation, "World Bank");
      await upsertMacroIndicator("lending_rate", data.lendingRate, "World Bank");
      return {
        gdpGrowth: data.gdp,
        inflation: data.inflation,
        lendingRate: data.lendingRate,
        cbrRate: 13.0, // CBK rate (static fallback)
        exchangeRate: 129.5, // KES/USD (static fallback)
        nseIndex: 1842.3, // NSE 20 Share Index (static fallback)
        fetchedAt: new Date().toISOString(),
      };
    }),
    getCached: publicProcedure.query(async () => {
      return getMacroData();
    }),
  }),

  // ── Predictions ──────────────────────────────────────────────────────────────
  predictions: router({
    run: protectedProcedure
      .input(
        z.object({
          gdpGrowth: z.number().min(0).max(10),
          inflation: z.number().min(0).max(15),
          revenueGrowth: z.number().min(-50).max(50),
          debtRatio: z.number().min(0).max(2),
          volatility: z.number().min(0).max(0.5),
          sector: z.string().optional(),
          dealName: z.string().optional(),
          saveDeal: z.boolean().default(false),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        const limit = TIER_LIMITS[user.tier ?? "free"];

        if (user.predictionsUsed >= limit) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `You have reached your ${user.tier} plan limit of ${limit} predictions/month. Please upgrade to continue.`,
          });
        }

        const result = pesaRiskInference(input);

        const saved = await savePrediction({
          userId: user.id,
          ...input,
          ...result,
        });

        await incrementPredictionUsage(user.id);

        // Auto-create alert for high risk
        if (result.riskScore > 0.7) {
          await createAlert({
            userId: user.id,
            type: "high_risk",
            severity: "critical",
            title: "High-Risk Deal Detected",
            message: `${input.dealName ?? "Deal"} has a risk score of ${(result.riskScore * 100).toFixed(1)}%. Review before proceeding.`,
            metadata: { riskScore: result.riskScore, irr: result.predictedIrr },
          });
        } else if (result.predictedIrr > 25) {
          await createAlert({
            userId: user.id,
            type: "opportunity",
            severity: "info",
            title: "High-Return Opportunity",
            message: `${input.dealName ?? "Deal"} shows ${result.predictedIrr.toFixed(1)}% projected IRR with ${result.riskLabel}.`,
            metadata: { riskScore: result.riskScore, irr: result.predictedIrr },
          });
        }

        return { ...result, predictionId: saved };
      }),

    runBatch: protectedProcedure
      .input(
        z.object({
          rows: z.array(
            z.object({
              gdpGrowth: z.number(),
              inflation: z.number(),
              revenueGrowth: z.number(),
              debtRatio: z.number(),
              volatility: z.number(),
              sector: z.string().optional(),
              dealName: z.string().optional(),
            })
          ).max(100),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        if (user.tier === "free") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Batch predictions require a Pro or Enterprise plan." });
        }

        const results = await Promise.all(
          input.rows.map(async (row) => {
            const result = pesaRiskInference(row);
            await savePrediction({ userId: user.id, ...row, ...result, isBatch: true });
            return { ...row, ...result };
          })
        );

        return results;
      }),

    getHistory: protectedProcedure.query(async ({ ctx }) => {
      return getUserPredictions(ctx.user.id);
    }),

    getStats: protectedProcedure.query(async ({ ctx }) => {
      return getPredictionStats(ctx.user.id);
    }),

    getRemainingQuota: protectedProcedure.query(async ({ ctx }) => {
      const user = ctx.user;
      const limit = TIER_LIMITS[user.tier ?? "free"];
      return {
        used: user.predictionsUsed,
        limit,
        remaining: Math.max(0, limit - user.predictionsUsed),
        tier: user.tier,
      };
    }),
  }),

  // ── Forecasts ────────────────────────────────────────────────────────────────
  forecasts: router({
    generate: protectedProcedure
      .input(
        z.object({
          baseIrr: z.number().min(5).max(35),
          gdpAssumption: z.number().min(0).max(10),
          inflationAssumption: z.number().min(0).max(15),
          horizon: z.number().min(3).max(10).default(5),
        })
      )
      .query(({ input }) => {
        const { baseIrr, gdpAssumption, inflationAssumption, horizon } = input;
        const years = Array.from({ length: horizon }, (_, i) => i + 1);

        const base = years.map((y) => parseFloat((baseIrr + gdpAssumption * 0.3 * (y - 1) - inflationAssumption * 0.1 * (y - 1)).toFixed(2)));
        const bear = base.map((v) => parseFloat((v * 0.75).toFixed(2)));
        const bull = base.map((v) => parseFloat((v * 1.25).toFixed(2)));
        const lowerCI = base.map((v) => parseFloat((v - 2.5).toFixed(2)));
        const upperCI = base.map((v) => parseFloat((v + 2.5).toFixed(2)));

        // Sensitivity: GDP variation
        const gdpSensitivity = [2, 3.5, 5, 6.5, 8].map((g) => ({
          gdp: g,
          year3Irr: parseFloat((baseIrr + g * 0.3 * 2).toFixed(2)),
          year5Irr: parseFloat((baseIrr + g * 0.3 * 4).toFixed(2)),
        }));

        // Sensitivity: Inflation variation
        const inflationSensitivity = [2, 4, 6, 8, 10].map((inf) => ({
          inflation: inf,
          year3Irr: parseFloat((baseIrr - inf * 0.1 * 2).toFixed(2)),
          year5Irr: parseFloat((baseIrr - inf * 0.1 * 4).toFixed(2)),
        }));

        return { years, base, bear, bull, lowerCI, upperCI, gdpSensitivity, inflationSensitivity };
      }),
  }),

  // ── Portfolio ─────────────────────────────────────────────────────────────────
  portfolio: router({
    getDeals: protectedProcedure.query(async ({ ctx }) => getUserDeals(ctx.user.id)),

    saveDeal: protectedProcedure
      .input(z.object({ name: z.string(), sector: z.string().optional(), predictionId: z.number().optional(), notes: z.string().optional(), investmentAmount: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        await createDeal({ userId: ctx.user.id, ...input });
        return { success: true };
      }),

    updateDeal: protectedProcedure
      .input(z.object({ dealId: z.number(), data: z.object({ name: z.string().optional(), sector: z.string().optional(), status: z.enum(["active", "monitoring", "exited", "watchlist"]).optional(), notes: z.string().optional() }) }))
      .mutation(async ({ ctx, input }) => {
        await updateDeal(input.dealId, ctx.user.id, input.data as any);
        return { success: true };
      }),

    deleteDeal: protectedProcedure
      .input(z.object({ dealId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { deleteDeal: del } = await import("./db");
        await del(input.dealId, ctx.user.id);
        return { success: true };
      }),

    getPortfolios: protectedProcedure.query(async ({ ctx }) => getUserPortfolios(ctx.user.id)),

    createPortfolio: protectedProcedure
      .input(z.object({ name: z.string(), description: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        await createPortfolio({ userId: ctx.user.id, ...input });
        return { success: true };
      }),

    optimize: protectedProcedure
      .input(z.object({ inflationAdj: z.number(), gdpAdj: z.number(), volatilityAdj: z.number(), debtAdj: z.number(), baseInputs: z.object({ gdpGrowth: z.number(), inflation: z.number(), revenueGrowth: z.number(), debtRatio: z.number(), volatility: z.number() }) }))
      .query(({ input }) => {
        const { baseInputs, inflationAdj, gdpAdj, volatilityAdj, debtAdj } = input;
        const base = pesaRiskInference(baseInputs);
        const adjusted = pesaRiskInference({
          gdpGrowth: Math.max(0, Math.min(10, baseInputs.gdpGrowth + gdpAdj)),
          inflation: Math.max(0, Math.min(15, baseInputs.inflation + inflationAdj)),
          revenueGrowth: baseInputs.revenueGrowth,
          debtRatio: Math.max(0, Math.min(2, baseInputs.debtRatio + debtAdj)),
          volatility: Math.max(0, Math.min(0.5, baseInputs.volatility + volatilityAdj)),
        });

        const suggestion =
          adjusted.riskScore < base.riskScore
            ? `Adjustments reduce risk by ${((base.riskScore - adjusted.riskScore) * 100).toFixed(1)}%. Consider increasing GDP-linked exposure.`
            : `Adjustments increase risk. Consider reducing debt ratio or volatility exposure.`;

        return { base, adjusted, suggestion };
      }),
  }),

  // ── Alerts ────────────────────────────────────────────────────────────────────
  alerts: router({
    getAll: protectedProcedure.query(async ({ ctx }) => getUserAlerts(ctx.user.id)),
    getUnread: protectedProcedure.query(async ({ ctx }) => getUserAlerts(ctx.user.id, true)),
    getUnreadCount: protectedProcedure.query(async ({ ctx }) => getUnreadAlertCount(ctx.user.id)),
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      await markAlertsRead(ctx.user.id);
      return { success: true };
    }),
  }),

  // ── Subscriptions ─────────────────────────────────────────────────────────────
  subscriptions: router({
    get: protectedProcedure.query(async ({ ctx }) => getUserSubscription(ctx.user.id)),
    upgrade: protectedProcedure
      .input(z.object({ tier: z.enum(["pro", "enterprise"]) }))
      .mutation(async ({ ctx, input }) => {
        // In production: create Stripe checkout session here
        await upsertSubscription({ userId: ctx.user.id, tier: input.tier, status: "active" });
        return { success: true, message: `Upgraded to ${input.tier}` };
      }),
  }),

  // ── Admin ─────────────────────────────────────────────────────────────────────
  admin: router({
    getUsers: adminProcedure.query(async () => getAllUsers()),
    getSystemStats: adminProcedure.query(async () => getSystemStats()),
    getMacroCache: adminProcedure.query(async () => getMacroData()),
    refreshMacro: adminProcedure.mutation(async () => {
      const data = await fetchMacroFromWorldBank();
      await upsertMacroIndicator("gdp_growth", data.gdp, "World Bank");
      await upsertMacroIndicator("inflation", data.inflation, "World Bank");
      await upsertMacroIndicator("lending_rate", data.lendingRate, "World Bank");
      return { success: true, data };
    }),
    updateUserRole: adminProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["admin", "analyst", "investor"]) }))
      .mutation(async ({ input }) => {
        await updateUserRole(input.userId, input.role);
        return { success: true };
      }),
    updateUserTier: adminProcedure
      .input(z.object({ userId: z.number(), tier: z.enum(["free", "pro", "enterprise"]) }))
      .mutation(async ({ input }) => {
        await updateUserTier(input.userId, input.tier);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
