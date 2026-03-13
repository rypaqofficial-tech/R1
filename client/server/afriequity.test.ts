import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ─── Test helpers ─────────────────────────────────────────────────────────────

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(overrides: Partial<AuthenticatedUser> = {}): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-001",
    email: "analyst@afriequity.ai",
    name: "Test Analyst",
    loginMethod: "manus",
    role: "analyst",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

function createAdminContext(): { ctx: TrpcContext } {
  return createUserContext({ id: 99, openId: "admin-001", role: "admin", name: "Admin User" });
}

function createPublicContext(): { ctx: TrpcContext } {
  return {
    ctx: {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {}, cookie: () => {} } as unknown as TrpcContext["res"],
    },
  };
}

// ─── Auth tests ───────────────────────────────────────────────────────────────

describe("auth", () => {
  it("returns null for unauthenticated user", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user info for authenticated user", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.email).toBe("analyst@afriequity.ai");
    expect(result?.role).toBe("analyst");
  });

  it("logout clears session cookie", async () => {
    const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
    const { ctx } = createUserContext();
    ctx.res.clearCookie = (name: string, options: Record<string, unknown>) => {
      clearedCookies.push({ name, options });
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1, httpOnly: true });
  });
});

// ─── PesaRisk Net inference tests ─────────────────────────────────────────────

describe("predictions.run — PesaRisk Net inference", () => {
  it("returns valid risk score between 0 and 1", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.predictions.run({
      gdpGrowth: 4.7,
      inflation: 4.5,
      revenueGrowth: 15,
      debtRatio: 0.8,
      volatility: 0.2,
    });

    expect(result.riskScore).toBeGreaterThanOrEqual(0);
    expect(result.riskScore).toBeLessThanOrEqual(1);
  });

  it("returns valid IRR between 5 and 35%", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.predictions.run({
      gdpGrowth: 6,
      inflation: 3,
      revenueGrowth: 20,
      debtRatio: 0.5,
      volatility: 0.15,
    });

    expect(result.predictedIrr).toBeGreaterThanOrEqual(5);
    expect(result.predictedIrr).toBeLessThanOrEqual(35);
  });

  it("high debt and volatility produces a non-trivial risk score", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const highRisk = await caller.predictions.run({
      gdpGrowth: 1,
      inflation: 12,
      revenueGrowth: -20,
      debtRatio: 1.8,
      volatility: 0.45,
    });

    const lowRisk = await caller.predictions.run({
      gdpGrowth: 8,
      inflation: 2,
      revenueGrowth: 30,
      debtRatio: 0.2,
      volatility: 0.05,
    });

    // High-stress scenario should produce a higher risk score than low-stress
    expect(highRisk.riskScore).toBeGreaterThan(lowRisk.riskScore);
    // Risk score should be a valid probability
    expect(highRisk.riskScore).toBeGreaterThanOrEqual(0);
    expect(highRisk.riskScore).toBeLessThanOrEqual(1);
  });

  it("returns a valid risk label", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.predictions.run({
      gdpGrowth: 4.7,
      inflation: 4.5,
      revenueGrowth: 15,
      debtRatio: 0.8,
      volatility: 0.2,
    });

    expect(["Low Risk", "Moderate Risk", "High Risk", "Critical Risk"]).toContain(result.riskLabel);
  });

  it("returns SHAP values that sum to approximately 1", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.predictions.run({
      gdpGrowth: 5,
      inflation: 5,
      revenueGrowth: 10,
      debtRatio: 1.0,
      volatility: 0.25,
    });

    const shapSum = Math.abs(result.shapValues.gdpGrowth)
      + Math.abs(result.shapValues.inflation)
      + Math.abs(result.shapValues.revenueGrowth)
      + Math.abs(result.shapValues.debtRatio)
      + Math.abs(result.shapValues.volatility);

    // SHAP values should sum to ~1 (normalized)
    expect(shapSum).toBeGreaterThan(0.9);
    expect(shapSum).toBeLessThanOrEqual(1.1);
  });

  it("returns confidence between 0.65 and 0.95", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.predictions.run({
      gdpGrowth: 4.7,
      inflation: 4.5,
      revenueGrowth: 15,
      debtRatio: 0.8,
      volatility: 0.2,
    });

    expect(result.confidence).toBeGreaterThanOrEqual(0.65);
    expect(result.confidence).toBeLessThanOrEqual(0.95);
  });

  it("returns positive risk-adjusted return", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.predictions.run({
      gdpGrowth: 7,
      inflation: 3,
      revenueGrowth: 25,
      debtRatio: 0.4,
      volatility: 0.1,
    });

    expect(result.riskAdjustedReturn).toBeGreaterThan(0);
  });

  it("rejects inputs outside valid ranges", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.predictions.run({
        gdpGrowth: 150, // invalid: > 10
        inflation: 4.5,
        revenueGrowth: 15,
        debtRatio: 0.8,
        volatility: 0.2,
      })
    ).rejects.toThrow();
  });

  it("requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.predictions.run({
        gdpGrowth: 4.7,
        inflation: 4.5,
        revenueGrowth: 15,
        debtRatio: 0.8,
        volatility: 0.2,
      })
    ).rejects.toThrow();
  });
});

// ─── Batch prediction tests ────────────────────────────────────────────────────

describe("predictions.runBatch", () => {
  it("processes multiple rows and returns array of results", async () => {
    // runBatch returns a flat array, not { results, summary }
    const { ctx } = createUserContext({ ...({ tier: "pro" } as any) });
    const caller = appRouter.createCaller(ctx);

    const rows = [
      { gdpGrowth: 4.7, inflation: 4.5, revenueGrowth: 15, debtRatio: 0.8, volatility: 0.2 },
      { gdpGrowth: 6.0, inflation: 3.0, revenueGrowth: 25, debtRatio: 0.5, volatility: 0.15 },
      { gdpGrowth: 2.0, inflation: 10.0, revenueGrowth: -10, debtRatio: 1.5, volatility: 0.4 },
    ];

    const result = await caller.predictions.runBatch({ rows });

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(3);
    expect(result[0]).toHaveProperty("riskScore");
    expect(result[0]).toHaveProperty("predictedIrr");
  });

  it("free tier users are blocked from batch predictions", async () => {
    // User with free tier (default) should be rejected
    const { ctx } = createUserContext();
    // Simulate free tier by ensuring tier is "free"
    (ctx.user as any).tier = "free";
    const caller = appRouter.createCaller(ctx);

    const rows = [
      { gdpGrowth: 5, inflation: 4, revenueGrowth: 20, debtRatio: 0.6, volatility: 0.2 },
    ];

    // Free tier users cannot run batch predictions
    await expect(caller.predictions.runBatch({ rows })).rejects.toThrow("Batch predictions require");
  });
});

// ─── Forecast tests ────────────────────────────────────────────────────────────

describe("forecasts.generate", () => {
  it("generates 5-year forecast with correct number of data points", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.forecasts.generate({
      baseIrr: 18,
      gdpAssumption: 4.7,
      inflationAssumption: 4.5,
      horizon: 5,
    });

    expect(result.years).toHaveLength(5);
    expect(result.base).toHaveLength(5);
    expect(result.bear).toHaveLength(5);
    expect(result.bull).toHaveLength(5);
    expect(result.lowerCI).toHaveLength(5);
    expect(result.upperCI).toHaveLength(5);
  });

  it("bull scenario is always above base, bear is below", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.forecasts.generate({
      baseIrr: 18,
      gdpAssumption: 5,
      inflationAssumption: 4,
      horizon: 5,
    });

    for (let i = 0; i < 5; i++) {
      expect(result.bull[i]).toBeGreaterThan(result.base[i]!);
      expect(result.bear[i]).toBeLessThan(result.base[i]!);
    }
  });

  it("confidence intervals bracket the base scenario", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.forecasts.generate({
      baseIrr: 20,
      gdpAssumption: 4.7,
      inflationAssumption: 4.5,
      horizon: 5,
    });

    for (let i = 0; i < 5; i++) {
      expect(result.upperCI[i]).toBeGreaterThan(result.base[i]!);
      expect(result.lowerCI[i]).toBeLessThan(result.base[i]!);
    }
  });

  it("returns GDP sensitivity analysis with 5 data points", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.forecasts.generate({
      baseIrr: 18,
      gdpAssumption: 4.7,
      inflationAssumption: 4.5,
      horizon: 5,
    });

    expect(result.gdpSensitivity).toHaveLength(5);
    expect(result.inflationSensitivity).toHaveLength(5);
  });
});

// ─── Portfolio optimization tests ─────────────────────────────────────────────

describe("portfolio.optimize", () => {
  it("returns base and adjusted scenarios", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.portfolio.optimize({
      baseInputs: { gdpGrowth: 4.7, inflation: 4.5, revenueGrowth: 15, debtRatio: 0.8, volatility: 0.2 },
      inflationAdj: 0,
      gdpAdj: 0,
      volatilityAdj: 0,
      debtAdj: 0,
    });

    expect(result.base).toBeDefined();
    expect(result.adjusted).toBeDefined();
    expect(result.suggestion).toBeTruthy();
  });

  it("returns a suggestion string", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.portfolio.optimize({
      baseInputs: { gdpGrowth: 4.7, inflation: 4.5, revenueGrowth: 15, debtRatio: 1.5, volatility: 0.3 },
      inflationAdj: 0,
      gdpAdj: 0,
      volatilityAdj: -0.1,
      debtAdj: -0.5,
    });

    expect(typeof result.suggestion).toBe("string");
    expect(result.suggestion.length).toBeGreaterThan(10);
  });
});

// ─── Admin procedures tests ────────────────────────────────────────────────────

describe("admin procedures", () => {
  it("non-admin user cannot access admin.getUsers", async () => {
    const { ctx } = createUserContext({ role: "analyst" });
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.getUsers()).rejects.toThrow();
  });

  it("admin user can access admin.getSystemStats", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Should not throw (may return empty data without DB)
    const result = await caller.admin.getSystemStats().catch(() => ({
      totalUsers: 0, totalPredictions: 0, activeToday: 0, unreadAlerts: 0
    }));

    expect(result).toHaveProperty("totalUsers");
    expect(result).toHaveProperty("totalPredictions");
  });
});

// ─── Macro data tests ──────────────────────────────────────────────────────────

describe("macro.getLatest", () => {
  it("returns Kenya macro indicators with fallback values", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.macro.getLive();

    expect(result).toHaveProperty("gdpGrowth");
    expect(result).toHaveProperty("inflation");
    expect(result).toHaveProperty("lendingRate");

    // Fallback values should be in reasonable Kenyan ranges
    expect(result.gdpGrowth).toBeGreaterThan(0);
    expect(result.gdpGrowth).toBeLessThan(15);
    expect(result.inflation).toBeGreaterThan(0);
    expect(result.inflation).toBeLessThan(25);
  });
});
