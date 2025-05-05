import { pgTable, text, serial, integer, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Production Units
export const productionUnits = pgTable("production_units", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  status: text("status").notNull().default("active"),
  costToDate: numeric("cost_to_date").notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProductionUnitSchema = createInsertSchema(productionUnits).omit({
  id: true,
  createdAt: true,
  costToDate: true,
});

// Expenses
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  productionUnitId: integer("production_unit_id").notNull(),
  description: text("description").notNull(),
  amount: numeric("amount").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  category: text("category").notNull(),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
});

// Revenue
export const revenues = pgTable("revenues", {
  id: serial("id").primaryKey(),
  productionUnitId: integer("production_unit_id").notNull(),
  description: text("description").notNull(),
  amount: numeric("amount").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  category: text("category").notNull(),
});

export const insertRevenueSchema = createInsertSchema(revenues).omit({
  id: true,
});

// Inventory Items
export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  quantity: numeric("quantity").notNull().default("0"),
  unitCost: numeric("unit_cost").notNull(),
  productionUnitId: integer("production_unit_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({
  id: true,
  createdAt: true,
});

// Reports
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  filePath: text("file_path").notNull(),
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  generatedAt: true,
});

// Users table (for authentication)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
});

// Export types
export type ProductionUnit = typeof productionUnits.$inferSelect;
export type InsertProductionUnit = z.infer<typeof insertProductionUnitSchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type Revenue = typeof revenues.$inferSelect;
export type InsertRevenue = z.infer<typeof insertRevenueSchema>;

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Common types for frontend and backend
export type Transaction = {
  id: number;
  description: string;
  amount: number | string;
  date: Date | string;
  productionUnitId: number;
  productionUnitName?: string;
  type: "expense" | "revenue";
  category: string;
};

export type StatSummary = {
  monthlyCost: number;
  totalRevenue: number;
  productionUnitCount: number;
  profitMargin: number;
  costPercentChange: number;
  revenuePercentChange: number;
  productionUnitChange: number;
  profitMarginChange: number;
};

export type ProfitLossPeriod = {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
};

export type CostTrend = {
  period: string;
  amount: number;
};
