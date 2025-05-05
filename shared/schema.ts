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
  baseAmount: numeric("base_amount"),
  gstRate: numeric("gst_rate"),
  gstAmount: numeric("gst_amount"),
  hsn: text("hsn"),
  invoiceNumber: text("invoice_number"),
  date: timestamp("date").defaultNow().notNull(),
  category: text("category").notNull(),
  currency: text("currency").default("INR"),
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
  baseAmount: numeric("base_amount"),
  gstRate: numeric("gst_rate"),
  gstAmount: numeric("gst_amount"),
  hsn: text("hsn"),
  invoiceNumber: text("invoice_number"),
  date: timestamp("date").defaultNow().notNull(),
  category: text("category").notNull(),
  currency: text("currency").default("INR"),
  orderId: integer("order_id"), // Reference to an order if applicable
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

// New Customers table
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  gstin: text("gstin"), // For B2B customers with GST registration
  createdAt: timestamp("created_at").defaultNow().notNull(),
  notes: text("notes"),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

// New Orders table for stitching orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerId: integer("customer_id").notNull(),
  productionUnitId: integer("production_unit_id").notNull(),
  orderDate: timestamp("order_date").defaultNow().notNull(),
  deliveryDate: timestamp("delivery_date"),
  status: text("status").notNull().default("pending"), // pending, in-progress, ready, delivered, cancelled
  totalAmount: numeric("total_amount").notNull(),
  paidAmount: numeric("paid_amount").default("0"),
  baseAmount: numeric("base_amount"),
  gstRate: numeric("gst_rate"),
  gstAmount: numeric("gst_amount"),
  hsn: text("hsn"),
  invoiceNumber: text("invoice_number"),
  description: text("description").notNull(),
  currency: text("currency").default("INR"),
  category: text("category").notNull(),
  measurements: text("measurements"), // JSON string with measurements
  fabricDetails: text("fabric_details"),
  specialInstructions: text("special_instructions"),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
});

// New Salary Payments table
export const salaryPayments = pgTable("salary_payments", {
  id: serial("id").primaryKey(),
  employeeName: text("employee_name").notNull(),
  employeeId: text("employee_id"),
  productionUnitId: integer("production_unit_id").notNull(),
  amount: numeric("amount").notNull(),
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  paymentMethod: text("payment_method").default("cash"),
  notes: text("notes"),
  month: text("month").notNull(), // The month this salary is for
  year: text("year").notNull(), // The year this salary is for
});

export const insertSalaryPaymentSchema = createInsertSchema(salaryPayments).omit({
  id: true,
});

// New Maintenance Records table
export const maintenanceRecords = pgTable("maintenance_records", {
  id: serial("id").primaryKey(),
  productionUnitId: integer("production_unit_id").notNull(),
  machineId: text("machine_id"),
  machineName: text("machine_name").notNull(),
  maintenanceType: text("maintenance_type").notNull(), // repair, service, etc.
  description: text("description").notNull(),
  cost: numeric("cost").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  nextMaintenanceDate: timestamp("next_maintenance_date"),
  performedBy: text("performed_by"),
  notes: text("notes"),
});

export const insertMaintenanceRecordSchema = createInsertSchema(maintenanceRecords).omit({
  id: true,
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

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type SalaryPayment = typeof salaryPayments.$inferSelect;
export type InsertSalaryPayment = z.infer<typeof insertSalaryPaymentSchema>;

export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect;
export type InsertMaintenanceRecord = z.infer<typeof insertMaintenanceRecordSchema>;

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
