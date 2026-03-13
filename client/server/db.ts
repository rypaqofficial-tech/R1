import { and, desc, eq, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Alert,
  Deal,
  InsertUser,
  Portfolio,
  Prediction,
  alerts,
  deals,
  macroCache,
  portfolios,
  predictions,
  subscriptions,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const fields = ["name", "email", "loginMethod"] as const;
  for (const f of fields) {
    if (user[f] !== undefined) {
      values[f] = user[f] ?? null;
      updateSet[f] = user[f] ?? null;
    }
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }

  const isOwner = user.openId === ENV.ownerOpenId;
  values.role = isOwner ? "admin" : (user.role ?? "analyst");
  updateSet.role = values.role;

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function updateUserProfile(
  userId: number,
  data: Partial<{ name: string; firm: string; language: "en" | "sw"; darkMode: boolean; notifyEmail: boolean; notifySms: boolean; dpaConsent: boolean }>
) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { ...data };
  if (data.dpaConsent) updateData.dpaConsentAt = new Date();
  await db.update(users).set(updateData).where(eq(users.id, userId));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function incrementPredictionUsage(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ predictionsUsed: sql`predictionsUsed + 1` }).where(eq(users.id, userId));
}

export async function resetMonthlyUsage(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ predictionsUsed: 0, predictionsResetAt: new Date() }).where(eq(users.id, userId));
}

// ─── Predictions ─────────────────────────────────────────────────────────────
export async function savePrediction(data: {
  userId: number;
  gdpGrowth: number;
  inflation: number;
  revenueGrowth: number;
  debtRatio: number;
  volatility: number;
  sector?: string;
  dealName?: string;
  riskScore: number;
  predictedIrr: number;
  confidence?: number;
  riskLabel: string;
  riskAdjustedReturn: number;
  sharpeProxy: number;
  shapValues?: Record<string, number>;
  isBatch?: boolean;
}) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(predictions).values({
    ...data,
    shapValues: data.shapValues ?? null,
    isBatch: data.isBatch ?? false,
  });
  return result[0];
}

export async function getUserPredictions(userId: number, limit = 50): Promise<Prediction[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(predictions).where(eq(predictions.userId, userId)).orderBy(desc(predictions.createdAt)).limit(limit);
}

export async function getPredictionStats(userId: number) {
  const db = await getDb();
  if (!db) return { total: 0, avgRisk: 0, avgIrr: 0 };
  const result = await db
    .select({
      total: sql<number>`COUNT(*)`,
      avgRisk: sql<number>`AVG(riskScore)`,
      avgIrr: sql<number>`AVG(predictedIrr)`,
    })
    .from(predictions)
    .where(eq(predictions.userId, userId));
  return result[0] ?? { total: 0, avgRisk: 0, avgIrr: 0 };
}

// ─── Deals ────────────────────────────────────────────────────────────────────
export async function createDeal(data: {
  userId: number;
  name: string;
  sector?: string;
  predictionId?: number;
  notes?: string;
  investmentAmount?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(deals).values(data);
  return result[0];
}

export async function getUserDeals(userId: number): Promise<Deal[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(deals).where(eq(deals.userId, userId)).orderBy(desc(deals.createdAt));
}

export async function updateDeal(dealId: number, userId: number, data: Partial<Deal>) {
  const db = await getDb();
  if (!db) return;
  await db.update(deals).set(data).where(and(eq(deals.id, dealId), eq(deals.userId, userId)));
}

export async function deleteDeal(dealId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(deals).where(and(eq(deals.id, dealId), eq(deals.userId, userId)));
}

// ─── Portfolios ───────────────────────────────────────────────────────────────
export async function createPortfolio(data: { userId: number; name: string; description?: string }) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(portfolios).values(data);
  return result[0];
}

export async function getUserPortfolios(userId: number): Promise<Portfolio[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(portfolios).where(eq(portfolios.userId, userId)).orderBy(desc(portfolios.createdAt));
}

export async function updatePortfolio(portfolioId: number, userId: number, data: Partial<Portfolio>) {
  const db = await getDb();
  if (!db) return;
  await db.update(portfolios).set(data).where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)));
}

// ─── Alerts ───────────────────────────────────────────────────────────────────
export async function createAlert(data: {
  userId: number;
  type: Alert["type"];
  severity: Alert["severity"];
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(alerts).values({ ...data, metadata: data.metadata ?? null });
}

export async function getUserAlerts(userId: number, unreadOnly = false): Promise<Alert[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = unreadOnly
    ? and(eq(alerts.userId, userId), eq(alerts.isRead, false))
    : eq(alerts.userId, userId);
  return db.select().from(alerts).where(conditions).orderBy(desc(alerts.createdAt)).limit(30);
}

export async function markAlertsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(alerts).set({ isRead: true }).where(eq(alerts.userId, userId));
}

export async function getUnreadAlertCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(alerts)
    .where(and(eq(alerts.userId, userId), eq(alerts.isRead, false)));
  return Number(result[0]?.count ?? 0);
}

// ─── Macro Cache ──────────────────────────────────────────────────────────────
export async function getMacroData() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(macroCache);
}

export async function upsertMacroIndicator(indicator: string, value: number, source: string) {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(macroCache)
    .values({ indicator, value, source, fetchedAt: new Date() })
    .onDuplicateKeyUpdate({ set: { value, source, fetchedAt: new Date() } });
}

// ─── Subscriptions ────────────────────────────────────────────────────────────
export async function getUserSubscription(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function upsertSubscription(data: {
  userId: number;
  tier: "free" | "pro" | "enterprise";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status?: "active" | "cancelled" | "past_due" | "trialing";
  currentPeriodEnd?: Date;
}) {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(subscriptions)
    .values({ ...data, status: data.status ?? "active" })
    .onDuplicateKeyUpdate({ set: { ...data } });
  // Sync tier on users table
  await db.update(users).set({ tier: data.tier }).where(eq(users.id, data.userId));
}

// ─── Admin helpers ────────────────────────────────────────────────────────────
export async function updateUserRole(userId: number, role: "admin" | "analyst" | "investor") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function updateUserTier(userId: number, tier: "free" | "pro" | "enterprise") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ tier }).where(eq(users.id, userId));
}

export async function getSystemStats() {
  const db = await getDb();
  if (!db) return { totalUsers: 0, totalPredictions: 0, activeToday: 0, unreadAlerts: 0 };
  const [totalUsersResult, totalPredictionsResult, unreadAlertsResult] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)` }).from(users),
    db.select({ count: sql<number>`COUNT(*)` }).from(predictions),
    db.select({ count: sql<number>`COUNT(*)` }).from(alerts).where(eq(alerts.isRead, false)),
  ]);
  return {
    totalUsers: Number(totalUsersResult[0]?.count ?? 0),
    totalPredictions: Number(totalPredictionsResult[0]?.count ?? 0),
    activeToday: 0,
    unreadAlerts: Number(unreadAlertsResult[0]?.count ?? 0),
  };
}
