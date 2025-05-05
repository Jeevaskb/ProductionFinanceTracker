import { 
  ProductionUnit, InsertProductionUnit, 
  Expense, InsertExpense,
  Revenue, InsertRevenue,
  InventoryItem, InsertInventoryItem,
  Report, InsertReport,
  User, InsertUser,
  StatSummary, Transaction, ProfitLossPeriod, CostTrend
} from "@shared/schema";
import path from "path";
import { promises as fs } from "fs";
import { readExcelFile, writeExcelFile, ensureDirectoryExists } from "./excel-handler";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Production Unit operations
  getAllProductionUnits(): Promise<ProductionUnit[]>;
  getProductionUnit(id: number): Promise<ProductionUnit | undefined>;
  createProductionUnit(unit: InsertProductionUnit): Promise<ProductionUnit>;
  updateProductionUnit(id: number, updates: Partial<ProductionUnit>): Promise<ProductionUnit | undefined>;
  deleteProductionUnit(id: number): Promise<boolean>;

  // Expense operations
  getAllExpenses(): Promise<Expense[]>;
  getExpensesByProductionUnit(productionUnitId: number): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, updates: Partial<Expense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;

  // Revenue operations
  getAllRevenues(): Promise<Revenue[]>;
  getRevenuesByProductionUnit(productionUnitId: number): Promise<Revenue[]>;
  createRevenue(revenue: InsertRevenue): Promise<Revenue>;
  updateRevenue(id: number, updates: Partial<Revenue>): Promise<Revenue | undefined>;
  deleteRevenue(id: number): Promise<boolean>;

  // Inventory operations
  getAllInventoryItems(): Promise<InventoryItem[]>;
  getInventoryItemsByProductionUnit(productionUnitId: number): Promise<InventoryItem[]>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: number, updates: Partial<InventoryItem>): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: number): Promise<boolean>;

  // Report operations
  getAllReports(): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  deleteReport(id: number): Promise<boolean>;

  // Dashboard data operations
  getStatSummary(): Promise<StatSummary>;
  getRecentTransactions(limit: number): Promise<Transaction[]>;
  getCostTrends(months: number): Promise<CostTrend[]>;
  getProfitLossData(months: number): Promise<ProfitLossPeriod[]>;

  // Excel file operations
  importFromExcel(fileBuffer: Buffer, type: string): Promise<number>;
  exportToExcel(type: string): Promise<string>;
}

export class ExcelStorage implements IStorage {
  private dataDirectory: string;
  private users: Map<number, User>;
  private unitNextId: number;
  private expenseNextId: number;
  private revenueNextId: number;
  private inventoryNextId: number;
  private reportNextId: number;
  private userNextId: number;

  constructor() {
    this.dataDirectory = path.resolve(process.cwd(), "data");
    this.users = new Map();
    this.unitNextId = 1;
    this.expenseNextId = 1;
    this.revenueNextId = 1;
    this.inventoryNextId = 1;
    this.reportNextId = 1;
    this.userNextId = 1;
    
    // Start initialization in the background
    this.initializeStorage().catch(err => {
      console.error("Failed to initialize storage:", err);
    });
  }

  private async initializeStorage() {
    try {
      await ensureDirectoryExists(this.dataDirectory);
      
      // Initialize with default admin user if no users exist
      const defaultUser: InsertUser = {
        username: "admin",
        password: "admin", // In a real app, this would be hashed
        name: "John Doe",
        role: "Financial Manager"
      };
      await this.createUser(defaultUser);
      
      // Initialize all required Excel files if they don't exist
      await this.initializeExcelFile("production_units.xlsx", ["id", "name", "location", "status", "costToDate", "createdAt"]);
      await this.initializeExcelFile("expenses.xlsx", ["id", "productionUnitId", "description", "amount", "date", "category"]);
      await this.initializeExcelFile("revenues.xlsx", ["id", "productionUnitId", "description", "amount", "date", "category"]);
      await this.initializeExcelFile("inventory.xlsx", ["id", "name", "description", "quantity", "unitCost", "productionUnitId", "createdAt"]);
      await this.initializeExcelFile("reports.xlsx", ["id", "name", "type", "generatedAt", "filePath"]);
      await this.initializeExcelFile("users.xlsx", ["id", "username", "password", "name", "role"]);
    } catch (error) {
      console.error("Error initializing storage:", error);
    }
  }

  private async initializeExcelFile(filename: string, headers: string[]) {
    const filePath = path.join(this.dataDirectory, filename);
    try {
      await fs.access(filePath);
    } catch (error) {
      // File doesn't exist, create it with headers
      await writeExcelFile(filePath, [headers], "Sheet1");
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const users = await this.readUsersFromExcel();
    return users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await this.readUsersFromExcel();
    return users.find(user => user.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const users = await this.readUsersFromExcel();
    const existingUser = users.find(u => u.username === user.username);
    
    if (existingUser) {
      return existingUser;
    }
    
    const newUser: User = {
      ...user,
      id: this.userNextId++
    };
    
    users.push(newUser);
    await this.writeUsersToExcel(users);
    return newUser;
  }

  // Production Unit operations
  async getAllProductionUnits(): Promise<ProductionUnit[]> {
    return this.readProductionUnitsFromExcel();
  }

  async getProductionUnit(id: number): Promise<ProductionUnit | undefined> {
    const units = await this.readProductionUnitsFromExcel();
    return units.find(unit => unit.id === id);
  }

  async createProductionUnit(unit: InsertProductionUnit): Promise<ProductionUnit> {
    const units = await this.readProductionUnitsFromExcel();
    const newUnit: ProductionUnit = {
      ...unit,
      id: this.unitNextId++,
      costToDate: "0",
      createdAt: new Date()
    };
    
    units.push(newUnit);
    await this.writeProductionUnitsToExcel(units);
    return newUnit;
  }

  async updateProductionUnit(id: number, updates: Partial<ProductionUnit>): Promise<ProductionUnit | undefined> {
    const units = await this.readProductionUnitsFromExcel();
    const unitIndex = units.findIndex(unit => unit.id === id);
    
    if (unitIndex === -1) {
      return undefined;
    }
    
    const updatedUnit = { ...units[unitIndex], ...updates };
    units[unitIndex] = updatedUnit;
    await this.writeProductionUnitsToExcel(units);
    return updatedUnit;
  }

  async deleteProductionUnit(id: number): Promise<boolean> {
    const units = await this.readProductionUnitsFromExcel();
    const filteredUnits = units.filter(unit => unit.id !== id);
    
    if (filteredUnits.length === units.length) {
      return false;
    }
    
    await this.writeProductionUnitsToExcel(filteredUnits);
    return true;
  }

  // Expense operations
  async getAllExpenses(): Promise<Expense[]> {
    return this.readExpensesFromExcel();
  }

  async getExpensesByProductionUnit(productionUnitId: number): Promise<Expense[]> {
    const expenses = await this.readExpensesFromExcel();
    return expenses.filter(expense => expense.productionUnitId === productionUnitId);
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const expenses = await this.readExpensesFromExcel();
    const newExpense: Expense = {
      ...expense,
      id: this.expenseNextId++,
    };
    
    expenses.push(newExpense);
    await this.writeExpensesToExcel(expenses);
    
    // Update production unit cost
    const unit = await this.getProductionUnit(expense.productionUnitId);
    if (unit) {
      const currentCost = parseFloat(unit.costToDate.toString());
      const newCost = currentCost + parseFloat(expense.amount.toString());
      await this.updateProductionUnit(unit.id, { costToDate: newCost.toString() });
    }
    
    return newExpense;
  }

  async updateExpense(id: number, updates: Partial<Expense>): Promise<Expense | undefined> {
    const expenses = await this.readExpensesFromExcel();
    const expenseIndex = expenses.findIndex(expense => expense.id === id);
    
    if (expenseIndex === -1) {
      return undefined;
    }
    
    const oldExpense = expenses[expenseIndex];
    const updatedExpense = { ...oldExpense, ...updates };
    expenses[expenseIndex] = updatedExpense;
    await this.writeExpensesToExcel(expenses);
    
    // Update production unit cost if amount changed
    if (updates.amount && oldExpense.amount !== updates.amount) {
      const unit = await this.getProductionUnit(oldExpense.productionUnitId);
      if (unit) {
        const oldAmount = parseFloat(oldExpense.amount.toString());
        const newAmount = parseFloat(updates.amount.toString());
        const difference = newAmount - oldAmount;
        const currentCost = parseFloat(unit.costToDate.toString());
        const newCost = currentCost + difference;
        await this.updateProductionUnit(unit.id, { costToDate: newCost.toString() });
      }
    }
    
    return updatedExpense;
  }

  async deleteExpense(id: number): Promise<boolean> {
    const expenses = await this.readExpensesFromExcel();
    const expenseToDelete = expenses.find(expense => expense.id === id);
    
    if (!expenseToDelete) {
      return false;
    }
    
    const filteredExpenses = expenses.filter(expense => expense.id !== id);
    await this.writeExpensesToExcel(filteredExpenses);
    
    // Update production unit cost
    const unit = await this.getProductionUnit(expenseToDelete.productionUnitId);
    if (unit) {
      const currentCost = parseFloat(unit.costToDate.toString());
      const expenseAmount = parseFloat(expenseToDelete.amount.toString());
      const newCost = currentCost - expenseAmount;
      await this.updateProductionUnit(unit.id, { costToDate: newCost.toString() });
    }
    
    return true;
  }

  // Revenue operations
  async getAllRevenues(): Promise<Revenue[]> {
    return this.readRevenuesFromExcel();
  }

  async getRevenuesByProductionUnit(productionUnitId: number): Promise<Revenue[]> {
    const revenues = await this.readRevenuesFromExcel();
    return revenues.filter(revenue => revenue.productionUnitId === productionUnitId);
  }

  async createRevenue(revenue: InsertRevenue): Promise<Revenue> {
    const revenues = await this.readRevenuesFromExcel();
    const newRevenue: Revenue = {
      ...revenue,
      id: this.revenueNextId++,
    };
    
    revenues.push(newRevenue);
    await this.writeRevenuesToExcel(revenues);
    return newRevenue;
  }

  async updateRevenue(id: number, updates: Partial<Revenue>): Promise<Revenue | undefined> {
    const revenues = await this.readRevenuesFromExcel();
    const revenueIndex = revenues.findIndex(revenue => revenue.id === id);
    
    if (revenueIndex === -1) {
      return undefined;
    }
    
    const updatedRevenue = { ...revenues[revenueIndex], ...updates };
    revenues[revenueIndex] = updatedRevenue;
    await this.writeRevenuesToExcel(revenues);
    return updatedRevenue;
  }

  async deleteRevenue(id: number): Promise<boolean> {
    const revenues = await this.readRevenuesFromExcel();
    const filteredRevenues = revenues.filter(revenue => revenue.id !== id);
    
    if (filteredRevenues.length === revenues.length) {
      return false;
    }
    
    await this.writeRevenuesToExcel(filteredRevenues);
    return true;
  }

  // Inventory operations
  async getAllInventoryItems(): Promise<InventoryItem[]> {
    return this.readInventoryFromExcel();
  }

  async getInventoryItemsByProductionUnit(productionUnitId: number): Promise<InventoryItem[]> {
    const items = await this.readInventoryFromExcel();
    return items.filter(item => item.productionUnitId === productionUnitId);
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const items = await this.readInventoryFromExcel();
    const newItem: InventoryItem = {
      ...item,
      id: this.inventoryNextId++,
      createdAt: new Date(),
    };
    
    items.push(newItem);
    await this.writeInventoryToExcel(items);
    return newItem;
  }

  async updateInventoryItem(id: number, updates: Partial<InventoryItem>): Promise<InventoryItem | undefined> {
    const items = await this.readInventoryFromExcel();
    const itemIndex = items.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
      return undefined;
    }
    
    const updatedItem = { ...items[itemIndex], ...updates };
    items[itemIndex] = updatedItem;
    await this.writeInventoryToExcel(items);
    return updatedItem;
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    const items = await this.readInventoryFromExcel();
    const filteredItems = items.filter(item => item.id !== id);
    
    if (filteredItems.length === items.length) {
      return false;
    }
    
    await this.writeInventoryToExcel(filteredItems);
    return true;
  }

  // Report operations
  async getAllReports(): Promise<Report[]> {
    return this.readReportsFromExcel();
  }

  async createReport(report: InsertReport): Promise<Report> {
    const reports = await this.readReportsFromExcel();
    const newReport: Report = {
      ...report,
      id: this.reportNextId++,
      generatedAt: new Date(),
    };
    
    reports.push(newReport);
    await this.writeReportsToExcel(reports);
    return newReport;
  }

  async deleteReport(id: number): Promise<boolean> {
    const reports = await this.readReportsFromExcel();
    const reportToDelete = reports.find(report => report.id === id);
    
    if (!reportToDelete) {
      return false;
    }
    
    // Delete the report file
    try {
      await fs.unlink(reportToDelete.filePath);
    } catch (error) {
      console.error("Error deleting report file:", error);
    }
    
    const filteredReports = reports.filter(report => report.id !== id);
    await this.writeReportsToExcel(filteredReports);
    return true;
  }

  // Dashboard data operations
  async getStatSummary(): Promise<StatSummary> {
    const expenses = await this.readExpensesFromExcel();
    const revenues = await this.readRevenuesFromExcel();
    const units = await this.readProductionUnitsFromExcel();
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const previousMonth = (currentMonth - 1 + 12) % 12;
    const currentYear = now.getFullYear();
    const previousYear = previousMonth > currentMonth ? currentYear - 1 : currentYear;
    
    // Current month data
    const currentMonthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });
    
    const currentMonthRevenues = revenues.filter(revenue => {
      const revenueDate = new Date(revenue.date);
      return revenueDate.getMonth() === currentMonth && revenueDate.getFullYear() === currentYear;
    });
    
    // Previous month data
    const previousMonthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === previousMonth && expenseDate.getFullYear() === previousYear;
    });
    
    const previousMonthRevenues = revenues.filter(revenue => {
      const revenueDate = new Date(revenue.date);
      return revenueDate.getMonth() === previousMonth && revenueDate.getFullYear() === previousYear;
    });
    
    // Calculate totals
    const currentMonthCost = currentMonthExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount.toString()), 0);
    const previousMonthCost = previousMonthExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount.toString()), 0);
    
    const currentMonthRevenue = currentMonthRevenues.reduce((sum, revenue) => sum + parseFloat(revenue.amount.toString()), 0);
    const previousMonthRevenue = previousMonthRevenues.reduce((sum, revenue) => sum + parseFloat(revenue.amount.toString()), 0);
    
    const totalRevenue = revenues.reduce((sum, revenue) => sum + parseFloat(revenue.amount.toString()), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount.toString()), 0);
    
    // Calculate percent changes
    const costPercentChange = previousMonthCost === 0 ? 0 : ((currentMonthCost - previousMonthCost) / previousMonthCost) * 100;
    const revenuePercentChange = previousMonthRevenue === 0 ? 0 : ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;
    
    // Count active units from current and previous month
    const activeUnits = units.filter(unit => unit.status === 'active').length;
    const unitCountChange = 0; // In a real app, this would be calculated from historical data
    
    // Calculate profit margin
    const profitMargin = totalExpenses === 0 ? 0 : ((totalRevenue - totalExpenses) / totalRevenue) * 100;
    const profitMarginChange = -1.2; // Placeholder, in a real app would be calculated from historical data
    
    return {
      monthlyCost: currentMonthCost,
      totalRevenue: totalRevenue,
      productionUnitCount: activeUnits,
      profitMargin: profitMargin,
      costPercentChange: costPercentChange,
      revenuePercentChange: revenuePercentChange,
      productionUnitChange: unitCountChange,
      profitMarginChange: profitMarginChange,
    };
  }

  async getRecentTransactions(limit: number): Promise<Transaction[]> {
    const expenses = await this.readExpensesFromExcel();
    const revenues = await this.readRevenuesFromExcel();
    const units = await this.readProductionUnitsFromExcel();
    
    // Create a map of production unit ids to names for quick lookup
    const unitNameMap = new Map<number, string>();
    units.forEach(unit => {
      unitNameMap.set(unit.id, unit.name);
    });
    
    // Convert expenses to transactions
    const expenseTransactions: Transaction[] = expenses.map(expense => ({
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      date: expense.date,
      productionUnitId: expense.productionUnitId,
      productionUnitName: unitNameMap.get(expense.productionUnitId) || 'Unknown',
      type: 'expense',
      category: expense.category,
    }));
    
    // Convert revenues to transactions
    const revenueTransactions: Transaction[] = revenues.map(revenue => ({
      id: revenue.id,
      description: revenue.description,
      amount: revenue.amount,
      date: revenue.date,
      productionUnitId: revenue.productionUnitId,
      productionUnitName: unitNameMap.get(revenue.productionUnitId) || 'Unknown',
      type: 'revenue',
      category: revenue.category,
    }));
    
    // Combine transactions and sort by date (most recent first)
    const allTransactions = [...expenseTransactions, ...revenueTransactions].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
    
    // Return the specified number of transactions
    return allTransactions.slice(0, limit);
  }

  async getCostTrends(months: number): Promise<CostTrend[]> {
    const expenses = await this.readExpensesFromExcel();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Initialize the trends array with zeros for the past 'months'
    const trends: CostTrend[] = [];
    for (let i = 0; i < months; i++) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const year = currentYear - Math.floor((i - currentMonth) / 12);
      const monthName = new Date(year, monthIndex, 1).toLocaleString('default', { month: 'short' });
      trends.unshift({
        period: `${monthName} ${year}`,
        amount: 0,
      });
    }
    
    // Populate the trends with actual expense data
    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      const expenseMonth = expenseDate.getMonth();
      const expenseYear = expenseDate.getFullYear();
      
      // Find the corresponding trend entry for this expense
      const trendIndex = trends.findIndex(trend => {
        const [month, year] = trend.period.split(' ');
        const monthIndex = new Date(`${month} 1, 2000`).getMonth();
        return monthIndex === expenseMonth && parseInt(year) === expenseYear;
      });
      
      if (trendIndex !== -1) {
        trends[trendIndex].amount += parseFloat(expense.amount.toString());
      }
    });
    
    return trends;
  }

  async getProfitLossData(months: number): Promise<ProfitLossPeriod[]> {
    const expenses = await this.readExpensesFromExcel();
    const revenues = await this.readRevenuesFromExcel();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Initialize the data array with zeros for the past 'months'
    const data: ProfitLossPeriod[] = [];
    for (let i = 0; i < months; i++) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const year = currentYear - Math.floor((i - currentMonth) / 12);
      const monthName = new Date(year, monthIndex, 1).toLocaleString('default', { month: 'short' });
      data.unshift({
        period: `${monthName} ${year}`,
        revenue: 0,
        expenses: 0,
        profit: 0,
      });
    }
    
    // Populate with expense data
    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      const expenseMonth = expenseDate.getMonth();
      const expenseYear = expenseDate.getFullYear();
      
      const periodIndex = data.findIndex(period => {
        const [month, year] = period.period.split(' ');
        const monthIndex = new Date(`${month} 1, 2000`).getMonth();
        return monthIndex === expenseMonth && parseInt(year) === expenseYear;
      });
      
      if (periodIndex !== -1) {
        data[periodIndex].expenses += parseFloat(expense.amount.toString());
        data[periodIndex].profit -= parseFloat(expense.amount.toString());
      }
    });
    
    // Populate with revenue data
    revenues.forEach(revenue => {
      const revenueDate = new Date(revenue.date);
      const revenueMonth = revenueDate.getMonth();
      const revenueYear = revenueDate.getFullYear();
      
      const periodIndex = data.findIndex(period => {
        const [month, year] = period.period.split(' ');
        const monthIndex = new Date(`${month} 1, 2000`).getMonth();
        return monthIndex === revenueMonth && parseInt(year) === revenueYear;
      });
      
      if (periodIndex !== -1) {
        data[periodIndex].revenue += parseFloat(revenue.amount.toString());
        data[periodIndex].profit += parseFloat(revenue.amount.toString());
      }
    });
    
    return data;
  }

  // Excel file operations
  async importFromExcel(fileBuffer: Buffer, type: string): Promise<number> {
    let importedCount = 0;
    
    try {
      const data = await readExcelFile(fileBuffer);
      
      if (!data || data.length <= 1) {
        throw new Error("Invalid Excel file format or empty file");
      }
      
      // First row should be headers
      const headers = data[0];
      const rows = data.slice(1);
      
      switch (type) {
        case "production_units":
          importedCount = await this.importProductionUnits(headers, rows);
          break;
        case "expenses":
          importedCount = await this.importExpenses(headers, rows);
          break;
        case "revenues":
          importedCount = await this.importRevenues(headers, rows);
          break;
        case "inventory":
          importedCount = await this.importInventory(headers, rows);
          break;
        default:
          throw new Error(`Unsupported import type: ${type}`);
      }
      
      return importedCount;
    } catch (error) {
      console.error(`Error importing from Excel (${type}):`, error);
      throw error;
    }
  }

  private async importProductionUnits(headers: string[], rows: any[]): Promise<number> {
    const requiredFields = ["name", "location", "status"];
    this.validateHeaders(headers, requiredFields);
    
    let importedCount = 0;
    const nameIndex = headers.indexOf("name");
    const locationIndex = headers.indexOf("location");
    const statusIndex = headers.indexOf("status");
    
    for (const row of rows) {
      const unit: InsertProductionUnit = {
        name: row[nameIndex],
        location: row[locationIndex],
        status: row[statusIndex] || "active",
      };
      
      await this.createProductionUnit(unit);
      importedCount++;
    }
    
    return importedCount;
  }

  private async importExpenses(headers: string[], rows: any[]): Promise<number> {
    const requiredFields = ["productionUnitId", "description", "amount", "category"];
    this.validateHeaders(headers, requiredFields);
    
    let importedCount = 0;
    const productionUnitIdIndex = headers.indexOf("productionUnitId");
    const descriptionIndex = headers.indexOf("description");
    const amountIndex = headers.indexOf("amount");
    const dateIndex = headers.indexOf("date");
    const categoryIndex = headers.indexOf("category");
    
    for (const row of rows) {
      const expense: InsertExpense = {
        productionUnitId: parseInt(row[productionUnitIdIndex]),
        description: row[descriptionIndex],
        amount: row[amountIndex].toString(),
        date: dateIndex >= 0 && row[dateIndex] ? new Date(row[dateIndex]) : new Date(),
        category: row[categoryIndex],
      };
      
      await this.createExpense(expense);
      importedCount++;
    }
    
    return importedCount;
  }

  private async importRevenues(headers: string[], rows: any[]): Promise<number> {
    const requiredFields = ["productionUnitId", "description", "amount", "category"];
    this.validateHeaders(headers, requiredFields);
    
    let importedCount = 0;
    const productionUnitIdIndex = headers.indexOf("productionUnitId");
    const descriptionIndex = headers.indexOf("description");
    const amountIndex = headers.indexOf("amount");
    const dateIndex = headers.indexOf("date");
    const categoryIndex = headers.indexOf("category");
    
    for (const row of rows) {
      const revenue: InsertRevenue = {
        productionUnitId: parseInt(row[productionUnitIdIndex]),
        description: row[descriptionIndex],
        amount: row[amountIndex].toString(),
        date: dateIndex >= 0 && row[dateIndex] ? new Date(row[dateIndex]) : new Date(),
        category: row[categoryIndex],
      };
      
      await this.createRevenue(revenue);
      importedCount++;
    }
    
    return importedCount;
  }

  private async importInventory(headers: string[], rows: any[]): Promise<number> {
    const requiredFields = ["name", "quantity", "unitCost"];
    this.validateHeaders(headers, requiredFields);
    
    let importedCount = 0;
    const nameIndex = headers.indexOf("name");
    const descriptionIndex = headers.indexOf("description");
    const quantityIndex = headers.indexOf("quantity");
    const unitCostIndex = headers.indexOf("unitCost");
    const productionUnitIdIndex = headers.indexOf("productionUnitId");
    
    for (const row of rows) {
      const inventory: InsertInventoryItem = {
        name: row[nameIndex],
        description: descriptionIndex >= 0 ? row[descriptionIndex] : null,
        quantity: row[quantityIndex].toString(),
        unitCost: row[unitCostIndex].toString(),
        productionUnitId: productionUnitIdIndex >= 0 ? parseInt(row[productionUnitIdIndex]) : null,
      };
      
      await this.createInventoryItem(inventory);
      importedCount++;
    }
    
    return importedCount;
  }

  private validateHeaders(headers: string[], requiredFields: string[]) {
    for (const field of requiredFields) {
      if (!headers.includes(field)) {
        throw new Error(`Required field missing in Excel file: ${field}`);
      }
    }
  }

  async exportToExcel(type: string): Promise<string> {
    const reportsDir = path.join(this.dataDirectory, "reports");
    await ensureDirectoryExists(reportsDir);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `${type}_${timestamp}.xlsx`;
    const filePath = path.join(reportsDir, fileName);
    
    let data: any[] = [];
    
    switch (type) {
      case "production_units":
        data = await this.prepareProductionUnitsForExport();
        break;
      case "expenses":
        data = await this.prepareExpensesForExport();
        break;
      case "revenues":
        data = await this.prepareRevenuesForExport();
        break;
      case "inventory":
        data = await this.prepareInventoryForExport();
        break;
      case "financial_summary":
        data = await this.prepareFinancialSummaryForExport();
        break;
      default:
        throw new Error(`Unsupported export type: ${type}`);
    }
    
    await writeExcelFile(filePath, data, `${type.charAt(0).toUpperCase() + type.slice(1)}`);
    
    // Create a report record
    await this.createReport({
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Report - ${timestamp}`,
      type: type,
      filePath: filePath,
    });
    
    return filePath;
  }

  private async prepareProductionUnitsForExport(): Promise<any[]> {
    const units = await this.readProductionUnitsFromExcel();
    const headers = ["ID", "Name", "Location", "Status", "Cost To Date", "Created At"];
    
    const rows = units.map(unit => [
      unit.id,
      unit.name,
      unit.location,
      unit.status,
      unit.costToDate,
      new Date(unit.createdAt).toLocaleDateString(),
    ]);
    
    return [headers, ...rows];
  }

  private async prepareExpensesForExport(): Promise<any[]> {
    const expenses = await this.readExpensesFromExcel();
    const units = await this.readProductionUnitsFromExcel();
    const unitMap = new Map(units.map(unit => [unit.id, unit.name]));
    
    const headers = ["ID", "Date", "Description", "Production Unit", "Amount", "Category"];
    
    const rows = expenses.map(expense => [
      expense.id,
      new Date(expense.date).toLocaleDateString(),
      expense.description,
      unitMap.get(expense.productionUnitId) || "Unknown",
      expense.amount,
      expense.category,
    ]);
    
    return [headers, ...rows];
  }

  private async prepareRevenuesForExport(): Promise<any[]> {
    const revenues = await this.readRevenuesFromExcel();
    const units = await this.readProductionUnitsFromExcel();
    const unitMap = new Map(units.map(unit => [unit.id, unit.name]));
    
    const headers = ["ID", "Date", "Description", "Production Unit", "Amount", "Category"];
    
    const rows = revenues.map(revenue => [
      revenue.id,
      new Date(revenue.date).toLocaleDateString(),
      revenue.description,
      unitMap.get(revenue.productionUnitId) || "Unknown",
      revenue.amount,
      revenue.category,
    ]);
    
    return [headers, ...rows];
  }

  private async prepareInventoryForExport(): Promise<any[]> {
    const inventory = await this.readInventoryFromExcel();
    const units = await this.readProductionUnitsFromExcel();
    const unitMap = new Map(units.map(unit => [unit.id, unit.name]));
    
    const headers = ["ID", "Name", "Description", "Quantity", "Unit Cost", "Production Unit", "Created At"];
    
    const rows = inventory.map(item => [
      item.id,
      item.name,
      item.description || "",
      item.quantity,
      item.unitCost,
      item.productionUnitId ? unitMap.get(item.productionUnitId) || "Unknown" : "N/A",
      new Date(item.createdAt).toLocaleDateString(),
    ]);
    
    return [headers, ...rows];
  }

  private async prepareFinancialSummaryForExport(): Promise<any[]> {
    const expenses = await this.readExpensesFromExcel();
    const revenues = await this.readRevenuesFromExcel();
    const units = await this.readProductionUnitsFromExcel();
    
    // Summary sheet
    const totalExpense = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount.toString()), 0);
    const totalRevenue = revenues.reduce((sum, revenue) => sum + parseFloat(revenue.amount.toString()), 0);
    const profit = totalRevenue - totalExpense;
    const profitMargin = totalRevenue === 0 ? 0 : (profit / totalRevenue) * 100;
    
    const summaryHeaders = ["Metric", "Value"];
    const summaryRows = [
      ["Total Revenue", totalRevenue.toFixed(2)],
      ["Total Expenses", totalExpense.toFixed(2)],
      ["Profit", profit.toFixed(2)],
      ["Profit Margin", `${profitMargin.toFixed(2)}%`],
      ["Production Units", units.length],
      ["Active Units", units.filter(u => u.status === "active").length],
    ];
    
    return [summaryHeaders, ...summaryRows];
  }

  // Helper methods for reading/writing Excel files
  private async readProductionUnitsFromExcel(): Promise<ProductionUnit[]> {
    const filePath = path.join(this.dataDirectory, "production_units.xlsx");
    
    try {
      // Make sure directory exists
      await ensureDirectoryExists(this.dataDirectory);
      
      // Check if file exists, create it if not
      try {
        await fs.access(filePath);
      } catch (error) {
        console.log("Creating production_units.xlsx file...");
        await this.initializeExcelFile("production_units.xlsx", ["id", "name", "location", "status", "costToDate", "createdAt"]);
        return []; // Return empty array since file was just created
      }
      
      const data = await readExcelFile(filePath);
      
      if (!data || data.length <= 1) {
        return [];
      }
      
      const headers = data[0];
      const idIndex = headers.indexOf("id");
      const nameIndex = headers.indexOf("name");
      const locationIndex = headers.indexOf("location");
      const statusIndex = headers.indexOf("status");
      const costToDateIndex = headers.indexOf("costToDate");
      const createdAtIndex = headers.indexOf("createdAt");
      
      const units: ProductionUnit[] = [];
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const id = parseInt(row[idIndex]);
        
        units.push({
          id: id,
          name: row[nameIndex],
          location: row[locationIndex],
          status: row[statusIndex] || "active",
          costToDate: row[costToDateIndex] || "0",
          createdAt: row[createdAtIndex] ? new Date(row[createdAtIndex]) : new Date(),
        });
      
        // Update the next ID counter
        if (id >= this.unitNextId) {
          this.unitNextId = id + 1;
        }
      }
      
      return units;
    } catch (error) {
      console.error("Error reading production units from Excel:", error);
      return [];
    }
  }

  private async writeProductionUnitsToExcel(units: ProductionUnit[]): Promise<void> {
    const filePath = path.join(this.dataDirectory, "production_units.xlsx");
    const headers = ["id", "name", "location", "status", "costToDate", "createdAt"];
    
    const rows = units.map(unit => [
      unit.id,
      unit.name,
      unit.location,
      unit.status,
      unit.costToDate,
      unit.createdAt instanceof Date ? unit.createdAt.toISOString() : unit.createdAt,
    ]);
    
    await writeExcelFile(filePath, [headers, ...rows], "Production Units");
  }

  private async readExpensesFromExcel(): Promise<Expense[]> {
    const filePath = path.join(this.dataDirectory, "expenses.xlsx");
    
    try {
      // Make sure directory exists
      await ensureDirectoryExists(this.dataDirectory);
      
      // Check if file exists, create it if not
      try {
        await fs.access(filePath);
      } catch (error) {
        console.log("Creating expenses.xlsx file...");
        await this.initializeExcelFile("expenses.xlsx", ["id", "productionUnitId", "description", "amount", "date", "category"]);
        return []; // Return empty array since file was just created
      }
      
      const data = await readExcelFile(filePath);
      
      if (!data || data.length <= 1) {
        return [];
      }
      
      const headers = data[0];
      const idIndex = headers.indexOf("id");
      const productionUnitIdIndex = headers.indexOf("productionUnitId");
      const descriptionIndex = headers.indexOf("description");
      const amountIndex = headers.indexOf("amount");
      const dateIndex = headers.indexOf("date");
      const categoryIndex = headers.indexOf("category");
      
      const expenses: Expense[] = [];
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const id = parseInt(row[idIndex]);
        
        expenses.push({
          id: id,
          productionUnitId: parseInt(row[productionUnitIdIndex]),
          description: row[descriptionIndex],
          amount: row[amountIndex],
          date: row[dateIndex] ? new Date(row[dateIndex]) : new Date(),
          category: row[categoryIndex],
        });
        
        // Update the next ID counter
        if (id >= this.expenseNextId) {
          this.expenseNextId = id + 1;
        }
      }
      
      return expenses;
    } catch (error) {
      console.error("Error reading expenses from Excel:", error);
      return [];
    }
  }

  private async writeExpensesToExcel(expenses: Expense[]): Promise<void> {
    const filePath = path.join(this.dataDirectory, "expenses.xlsx");
    const headers = ["id", "productionUnitId", "description", "amount", "date", "category"];
    
    const rows = expenses.map(expense => [
      expense.id,
      expense.productionUnitId,
      expense.description,
      expense.amount,
      expense.date instanceof Date ? expense.date.toISOString() : expense.date,
      expense.category,
    ]);
    
    await writeExcelFile(filePath, [headers, ...rows], "Expenses");
  }

  private async readRevenuesFromExcel(): Promise<Revenue[]> {
    const filePath = path.join(this.dataDirectory, "revenues.xlsx");
    
    try {
      // Make sure directory exists
      await ensureDirectoryExists(this.dataDirectory);
      
      // Check if file exists, create it if not
      try {
        await fs.access(filePath);
      } catch (error) {
        console.log("Creating revenues.xlsx file...");
        await this.initializeExcelFile("revenues.xlsx", ["id", "productionUnitId", "description", "amount", "date", "category"]);
        return []; // Return empty array since file was just created
      }
      
      const data = await readExcelFile(filePath);
      
      if (!data || data.length <= 1) {
        return [];
      }
      
      const headers = data[0];
      const idIndex = headers.indexOf("id");
      const productionUnitIdIndex = headers.indexOf("productionUnitId");
      const descriptionIndex = headers.indexOf("description");
      const amountIndex = headers.indexOf("amount");
      const dateIndex = headers.indexOf("date");
      const categoryIndex = headers.indexOf("category");
      
      const revenues: Revenue[] = [];
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const id = parseInt(row[idIndex]);
        
        revenues.push({
          id: id,
          productionUnitId: parseInt(row[productionUnitIdIndex]),
          description: row[descriptionIndex],
          amount: row[amountIndex],
          date: row[dateIndex] ? new Date(row[dateIndex]) : new Date(),
          category: row[categoryIndex],
        });
        
        // Update the next ID counter
        if (id >= this.revenueNextId) {
          this.revenueNextId = id + 1;
        }
      }
      
      return revenues;
    } catch (error) {
      console.error("Error reading revenues from Excel:", error);
      return [];
    }
  }

  private async writeRevenuesToExcel(revenues: Revenue[]): Promise<void> {
    const filePath = path.join(this.dataDirectory, "revenues.xlsx");
    const headers = ["id", "productionUnitId", "description", "amount", "date", "category"];
    
    const rows = revenues.map(revenue => [
      revenue.id,
      revenue.productionUnitId,
      revenue.description,
      revenue.amount,
      revenue.date instanceof Date ? revenue.date.toISOString() : revenue.date,
      revenue.category,
    ]);
    
    await writeExcelFile(filePath, [headers, ...rows], "Revenues");
  }

  private async readInventoryFromExcel(): Promise<InventoryItem[]> {
    const filePath = path.join(this.dataDirectory, "inventory.xlsx");
    const data = await readExcelFile(filePath);
    
    if (!data || data.length <= 1) {
      return [];
    }
    
    const headers = data[0];
    const idIndex = headers.indexOf("id");
    const nameIndex = headers.indexOf("name");
    const descriptionIndex = headers.indexOf("description");
    const quantityIndex = headers.indexOf("quantity");
    const unitCostIndex = headers.indexOf("unitCost");
    const productionUnitIdIndex = headers.indexOf("productionUnitId");
    const createdAtIndex = headers.indexOf("createdAt");
    
    const inventory: InventoryItem[] = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const id = parseInt(row[idIndex]);
      
      inventory.push({
        id: id,
        name: row[nameIndex],
        description: descriptionIndex >= 0 ? row[descriptionIndex] : null,
        quantity: row[quantityIndex],
        unitCost: row[unitCostIndex],
        productionUnitId: productionUnitIdIndex >= 0 && row[productionUnitIdIndex] ? parseInt(row[productionUnitIdIndex]) : null,
        createdAt: createdAtIndex >= 0 && row[createdAtIndex] ? new Date(row[createdAtIndex]) : new Date(),
      });
      
      // Update the next ID counter
      if (id >= this.inventoryNextId) {
        this.inventoryNextId = id + 1;
      }
    }
    
    return inventory;
  }

  private async writeInventoryToExcel(inventory: InventoryItem[]): Promise<void> {
    const filePath = path.join(this.dataDirectory, "inventory.xlsx");
    const headers = ["id", "name", "description", "quantity", "unitCost", "productionUnitId", "createdAt"];
    
    const rows = inventory.map(item => [
      item.id,
      item.name,
      item.description || "",
      item.quantity,
      item.unitCost,
      item.productionUnitId || "",
      item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
    ]);
    
    await writeExcelFile(filePath, [headers, ...rows], "Inventory");
  }

  private async readReportsFromExcel(): Promise<Report[]> {
    const filePath = path.join(this.dataDirectory, "reports.xlsx");
    const data = await readExcelFile(filePath);
    
    if (!data || data.length <= 1) {
      return [];
    }
    
    const headers = data[0];
    const idIndex = headers.indexOf("id");
    const nameIndex = headers.indexOf("name");
    const typeIndex = headers.indexOf("type");
    const generatedAtIndex = headers.indexOf("generatedAt");
    const filePathIndex = headers.indexOf("filePath");
    
    const reports: Report[] = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const id = parseInt(row[idIndex]);
      
      reports.push({
        id: id,
        name: row[nameIndex],
        type: row[typeIndex],
        generatedAt: row[generatedAtIndex] ? new Date(row[generatedAtIndex]) : new Date(),
        filePath: row[filePathIndex],
      });
      
      // Update the next ID counter
      if (id >= this.reportNextId) {
        this.reportNextId = id + 1;
      }
    }
    
    return reports;
  }

  private async writeReportsToExcel(reports: Report[]): Promise<void> {
    const filePath = path.join(this.dataDirectory, "reports.xlsx");
    const headers = ["id", "name", "type", "generatedAt", "filePath"];
    
    const rows = reports.map(report => [
      report.id,
      report.name,
      report.type,
      report.generatedAt instanceof Date ? report.generatedAt.toISOString() : report.generatedAt,
      report.filePath,
    ]);
    
    await writeExcelFile(filePath, [headers, ...rows], "Reports");
  }

  private async readUsersFromExcel(): Promise<User[]> {
    const filePath = path.join(this.dataDirectory, "users.xlsx");
    const data = await readExcelFile(filePath);
    
    if (!data || data.length <= 1) {
      return [];
    }
    
    const headers = data[0];
    const idIndex = headers.indexOf("id");
    const usernameIndex = headers.indexOf("username");
    const passwordIndex = headers.indexOf("password");
    const nameIndex = headers.indexOf("name");
    const roleIndex = headers.indexOf("role");
    
    const users: User[] = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const id = parseInt(row[idIndex]);
      
      users.push({
        id: id,
        username: row[usernameIndex],
        password: row[passwordIndex],
        name: row[nameIndex],
        role: row[roleIndex],
      });
      
      // Update the next ID counter
      if (id >= this.userNextId) {
        this.userNextId = id + 1;
      }
    }
    
    return users;
  }

  private async writeUsersToExcel(users: User[]): Promise<void> {
    const filePath = path.join(this.dataDirectory, "users.xlsx");
    const headers = ["id", "username", "password", "name", "role"];
    
    const rows = users.map(user => [
      user.id,
      user.username,
      user.password,
      user.name,
      user.role,
    ]);
    
    await writeExcelFile(filePath, [headers, ...rows], "Users");
  }
}

export const storage = new ExcelStorage();
