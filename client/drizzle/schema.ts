import {
  boolean,
  decimal,
  float,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["analyst", "investor", "admin"]).default("analyst").notNull(),
  firm: varchar("firm", { length: 255 }),
  language: mysqlEnum("language", ["en", "sw"]).default("en").notNull(),
  darkMode: boolean("darkMode").default(false).notNull(),
  tier: mysqlEnum("tier", ["free", "pro", "enterprise"]).default("free").notNull(),
  predictionsUsed: int("predictionsUsed").default(0).notNull(),
  predictionsResetAt: timestamp("predictionsResetAt").defaultNow().notNull(),
  notifyEmail: boolean("notifyEmail").default(true).notNull(),
  notifySms: boolean("notifySms").default(false).notNull(),
  // DPA: consent recorded at signup
  dpaConsent: boolean("dpaConsent").default(false).notNull(),
  dpaConsentAt: timestamp("dpaConsentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

// ─── Predictions ─────────────────────────────────────────────────────────────
// DPA: No PII stored — only anonymized financial metrics
export const predictions = mysqlTable("predictions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // Inputs
  gdpGrowth: float("gdpGrowth").notNull(),
  inflation: float("inflation").notNull(),
  revenueGrowth: float("revenueGrowth").notNull(),
  debtRatio: float("debtRatio").notNull(),
  volatility: float("volatility").notNull(),
  sector: varchar("sector", { length: 64 }),
  dealName: varchar("dealName", { length: 255 }), // anonymized hash in production
  // Outputs
  riskScore: float("riskScore").notNull(),
  predictedIrr: float("predictedIrr").notNull(),
  confidence: float("confidence").default(0.85),
  riskLabel: varchar("riskLabel", { length: 32 }),
  riskAdjustedReturn: float("riskAdjustedReturn"),
  sharpeProxy: float("sharpeProxy"),
  shapValues: json("shapValues"),
  modelVersion: varchar("modelVersion", { length: 32 }).default("1.0.0"),
  isBatch: boolean("isBatch").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Saved Deals ──────────────────────────────────────────────────────────────
export const deals = mysqlTable("deals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  sector: varchar("sector", { length: 64 }),
  status: mysqlEnum("status", ["active", "monitoring", "exited", "watchlist"]).default("active").notNull(),
  predictionId: int("predictionId"),
  notes: text("notes"),
  investmentAmount: decimal("investmentAmount", { precision: 18, scale: 2 }),
  currency: varchar("currency", { length: 8 }).default("KES"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Portfolios ───────────────────────────────────────────────────────────────
export const portfolios = mysqlTable("portfolios", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  totalCompanies: int("totalCompanies").default(0).notNull(),
  avgRisk: float("avgRisk"),
  portfolioIrr: float("portfolioIrr"),
  totalAum: decimal("totalAum", { precision: 18, scale: 2 }),
  currency: varchar("currency", { length: 8 }).default("KES"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Alerts ───────────────────────────────────────────────────────────────────
export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["high_risk", "opportunity", "macro_change", "model_drift", "system"]).notNull(),
  severity: mysqlEnum("severity", ["info", "warning", "critical"]).default("info").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Subscriptions ────────────────────────────────────────────────────────────
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  tier: mysqlEnum("tier", ["free", "pro", "enterprise"]).default("free").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  status: mysqlEnum("status", ["active", "cancelled", "past_due", "trialing"]).default("active").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Macro Cache ──────────────────────────────────────────────────────────────
export const macroCache = mysqlTable("macroCache", {
  id: int("id").autoincrement().primaryKey(),
  indicator: varchar("indicator", { length: 64 }).notNull().unique(),
  value: float("value").notNull(),
  source: varchar("source", { length: 64 }),
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
});

// ─── Types ────────────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Prediction = typeof predictions.$inferSelect;
export type Deal = typeof deals.$inferSelect;
export type Portfolio = typeof portfolios.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type MacroCache = typeof macroCache.$inferSelect;
