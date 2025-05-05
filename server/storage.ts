import { 
  ProductionUnit, InsertProductionUnit, 
  Expense, InsertExpense,
  Revenue, InsertRevenue,
  InventoryItem, InsertInventoryItem,
  Customer, InsertCustomer,
  Order, InsertOrder,
  SalaryPayment, InsertSalaryPayment,
  MaintenanceRecord, InsertMaintenanceRecord,
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
  
  // Customer operations
  getAllCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, updates: Partial<Customer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;
  
  // Order operations
  getAllOrders(): Promise<Order[]>;
  getOrdersByCustomer(customerId: number): Promise<Order[]>;
  getOrdersByProductionUnit(productionUnitId: number): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, updates: Partial<Order>): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;
  
  // Salary Payment operations
  getAllSalaryPayments(): Promise<SalaryPayment[]>;
  getSalaryPaymentsByProductionUnit(productionUnitId: number): Promise<SalaryPayment[]>;
  getSalaryPaymentsByMonth(month: string, year: string): Promise<SalaryPayment[]>;
  createSalaryPayment(payment: InsertSalaryPayment): Promise<SalaryPayment>;
  updateSalaryPayment(id: number, updates: Partial<SalaryPayment>): Promise<SalaryPayment | undefined>;
  deleteSalaryPayment(id: number): Promise<boolean>;
  
  // Maintenance Record operations
  getAllMaintenanceRecords(): Promise<MaintenanceRecord[]>;
  getMaintenanceRecordsByProductionUnit(productionUnitId: number): Promise<MaintenanceRecord[]>;
  createMaintenanceRecord(record: InsertMaintenanceRecord): Promise<MaintenanceRecord>;
  updateMaintenanceRecord(id: number, updates: Partial<MaintenanceRecord>): Promise<MaintenanceRecord | undefined>;
  deleteMaintenanceRecord(id: number): Promise<boolean>;

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
  private customerNextId: number;
  private orderNextId: number;
  private salaryPaymentNextId: number;
  private maintenanceRecordNextId: number;

  constructor() {
    this.dataDirectory = path.resolve(process.cwd(), "data");
    this.users = new Map();
    this.unitNextId = 1;
    this.expenseNextId = 1;
    this.revenueNextId = 1;
    this.inventoryNextId = 1;
    this.reportNextId = 1;
    this.userNextId = 1;
    this.customerNextId = 1;
    this.orderNextId = 1;
    this.salaryPaymentNextId = 1;
    this.maintenanceRecordNextId = 1;
    
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
      await this.initializeExcelFile("expenses.xlsx", ["id", "productionUnitId", "description", "amount", "date", "category", "baseAmount", "gstRate", "gstAmount", "hsn", "invoiceNumber", "currency"]);
      await this.initializeExcelFile("revenues.xlsx", ["id", "productionUnitId", "description", "amount", "date", "category", "baseAmount", "gstRate", "gstAmount", "hsn", "invoiceNumber", "currency", "orderId"]);
      await this.initializeExcelFile("inventory.xlsx", ["id", "name", "description", "quantity", "unitCost", "productionUnitId", "createdAt"]);
      await this.initializeExcelFile("reports.xlsx", ["id", "name", "type", "generatedAt", "filePath"]);
      await this.initializeExcelFile("users.xlsx", ["id", "username", "password", "name", "role"]);
      
      // Initialize new Excel files for stitching unit
      await this.initializeExcelFile("customers.xlsx", ["id", "name", "phone", "email", "address", "gstin", "createdAt", "notes"]);
      await this.initializeExcelFile("orders.xlsx", ["id", "orderNumber", "customerId", "productionUnitId", "orderDate", "deliveryDate", "status", "totalAmount", "paidAmount", "baseAmount", "gstRate", "gstAmount", "hsn", "invoiceNumber", "description", "currency", "category", "measurements", "fabricDetails", "specialInstructions"]);
      await this.initializeExcelFile("salary_payments.xlsx", ["id", "employeeName", "employeeId", "productionUnitId", "amount", "paymentDate", "paymentMethod", "notes", "month", "year"]);
      await this.initializeExcelFile("maintenance_records.xlsx", ["id", "productionUnitId", "machineId", "machineName", "maintenanceType", "description", "cost", "date", "nextMaintenanceDate", "performedBy", "notes"]);
    } catch (error) {
      console.error("Error initializing storage:", error);
    }
  }

  private async initializeExcelFile(filename: string, headers: string[]) {
    const filePath = path.join(this.dataDirectory, filename);
    try {
      await fs.access(filePath);
      
      // Try to read the file to check if it's valid
      try {
        await readExcelFile(filePath);
      } catch (readError) {
        // If reading fails, the file might be corrupted, recreate it
        console.log(`Recreating possibly corrupted file: ${filename}`);
        await writeExcelFile(filePath, [headers], "Sheet1");
      }
    } catch (error) {
      // File doesn't exist, create it with headers
      console.log(`Creating new Excel file: ${filename}`);
      await writeExcelFile(filePath, [headers], "Sheet1");
      
      // Verify the file was created properly
      try {
        await readExcelFile(filePath);
      } catch (verifyError) {
        console.error(`Failed to verify Excel file after creation: ${filename}`, verifyError);
        // Try one more time with explicit directory creation
        await ensureDirectoryExists(path.dirname(filePath));
        await writeExcelFile(filePath, [headers], "Sheet1");
      }
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
      status: unit.status || "active", // Ensure status is not undefined
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
      date: expense.date || new Date(), // Ensure date is not undefined
      baseAmount: expense.baseAmount || null,
      gstRate: expense.gstRate || null,
      gstAmount: expense.gstAmount || null,
      hsn: expense.hsn || null,
      invoiceNumber: expense.invoiceNumber || null,
      currency: expense.currency || "INR"
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
      date: revenue.date || new Date(), // Ensure date is not undefined
      baseAmount: revenue.baseAmount || null,
      gstRate: revenue.gstRate || null,
      gstAmount: revenue.gstAmount || null,
      hsn: revenue.hsn || null,
      invoiceNumber: revenue.invoiceNumber || null,
      currency: revenue.currency || "INR"
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
      quantity: item.quantity || "0",
      productionUnitId: item.productionUnitId || null,
      description: item.description || null,
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
  
  // Customer operations
  async getAllCustomers(): Promise<Customer[]> {
    return this.readCustomersFromExcel();
  }
  
  async getCustomer(id: number): Promise<Customer | undefined> {
    const customers = await this.readCustomersFromExcel();
    return customers.find(customer => customer.id === id);
  }
  
  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const customers = await this.readCustomersFromExcel();
    const newCustomer: Customer = {
      ...customer,
      id: this.customerNextId++,
      createdAt: new Date()
    };
    
    customers.push(newCustomer);
    await this.writeCustomersToExcel(customers);
    return newCustomer;
  }
  
  async updateCustomer(id: number, updates: Partial<Customer>): Promise<Customer | undefined> {
    const customers = await this.readCustomersFromExcel();
    const customerIndex = customers.findIndex(customer => customer.id === id);
    
    if (customerIndex === -1) {
      return undefined;
    }
    
    const updatedCustomer = { ...customers[customerIndex], ...updates };
    customers[customerIndex] = updatedCustomer;
    await this.writeCustomersToExcel(customers);
    return updatedCustomer;
  }
  
  async deleteCustomer(id: number): Promise<boolean> {
    // First check if there are any orders for this customer
    const orders = await this.readOrdersFromExcel();
    const hasOrders = orders.some(order => order.customerId === id);
    
    if (hasOrders) {
      // Cannot delete customer with existing orders
      return false;
    }
    
    const customers = await this.readCustomersFromExcel();
    const filteredCustomers = customers.filter(customer => customer.id !== id);
    
    if (filteredCustomers.length === customers.length) {
      return false;
    }
    
    await this.writeCustomersToExcel(filteredCustomers);
    return true;
  }
  
  // Order operations
  async getAllOrders(): Promise<Order[]> {
    return this.readOrdersFromExcel();
  }
  
  async getOrdersByCustomer(customerId: number): Promise<Order[]> {
    const orders = await this.readOrdersFromExcel();
    return orders.filter(order => order.customerId === customerId);
  }
  
  async getOrdersByProductionUnit(productionUnitId: number): Promise<Order[]> {
    const orders = await this.readOrdersFromExcel();
    return orders.filter(order => order.productionUnitId === productionUnitId);
  }
  
  async getOrder(id: number): Promise<Order | undefined> {
    const orders = await this.readOrdersFromExcel();
    return orders.find(order => order.id === id);
  }
  
  async createOrder(order: InsertOrder): Promise<Order> {
    const orders = await this.readOrdersFromExcel();
    
    // Generate an order number if not provided
    const orderNumber = order.orderNumber || `ORD-${new Date().getFullYear()}-${this.orderNextId.toString().padStart(4, '0')}`;
    
    const newOrder: Order = {
      ...order,
      id: this.orderNextId++,
      orderNumber,
      orderDate: order.orderDate || new Date(),
      status: order.status || "pending",
      totalAmount: order.totalAmount || "0",
      paidAmount: order.paidAmount || "0",
      baseAmount: order.baseAmount || null,
      gstRate: order.gstRate || null,
      gstAmount: order.gstAmount || null,
      hsn: order.hsn || null,
      invoiceNumber: order.invoiceNumber || null,
      currency: order.currency || "INR",
      measurements: order.measurements || null,
      fabricDetails: order.fabricDetails || null,
      specialInstructions: order.specialInstructions || null
    };
    
    orders.push(newOrder);
    await this.writeOrdersToExcel(orders);
    
    // If this order has an amount and is not a draft, create a corresponding revenue entry
    if (parseFloat(newOrder.totalAmount) > 0 && newOrder.status !== "draft") {
      await this.createRevenue({
        productionUnitId: newOrder.productionUnitId,
        description: `Order ${newOrder.orderNumber}: ${newOrder.description || 'Stitching services'}`,
        amount: newOrder.totalAmount,
        date: newOrder.orderDate,
        category: "Stitching",
        baseAmount: newOrder.baseAmount,
        gstRate: newOrder.gstRate,
        gstAmount: newOrder.gstAmount,
        hsn: newOrder.hsn,
        invoiceNumber: newOrder.invoiceNumber,
        currency: newOrder.currency,
        orderId: newOrder.id
      });
    }
    
    return newOrder;
  }
  
  async updateOrder(id: number, updates: Partial<Order>): Promise<Order | undefined> {
    const orders = await this.readOrdersFromExcel();
    const orderIndex = orders.findIndex(order => order.id === id);
    
    if (orderIndex === -1) {
      return undefined;
    }
    
    const oldOrder = orders[orderIndex];
    const updatedOrder = { ...oldOrder, ...updates };
    orders[orderIndex] = updatedOrder;
    await this.writeOrdersToExcel(orders);
    
    // If the amount or status changed, update the corresponding revenue entry
    if ((updates.totalAmount && updates.totalAmount !== oldOrder.totalAmount) || 
        (updates.status && updates.status !== oldOrder.status)) {
      
      // Find the associated revenue entry
      const revenues = await this.readRevenuesFromExcel();
      const revenueIndex = revenues.findIndex(revenue => revenue.orderId === id);
      
      if (revenueIndex !== -1) {
        // Update the existing revenue entry
        const revenue = revenues[revenueIndex];
        await this.updateRevenue(revenue.id, {
          description: `Order ${updatedOrder.orderNumber}: ${updatedOrder.description || 'Stitching services'}`,
          amount: updatedOrder.totalAmount,
          baseAmount: updatedOrder.baseAmount,
          gstRate: updatedOrder.gstRate,
          gstAmount: updatedOrder.gstAmount,
          hsn: updatedOrder.hsn,
          invoiceNumber: updatedOrder.invoiceNumber,
          currency: updatedOrder.currency
        });
      } else if (parseFloat(updatedOrder.totalAmount) > 0 && updatedOrder.status !== "draft") {
        // Create a new revenue entry if none exists and order is not a draft
        await this.createRevenue({
          productionUnitId: updatedOrder.productionUnitId,
          description: `Order ${updatedOrder.orderNumber}: ${updatedOrder.description || 'Stitching services'}`,
          amount: updatedOrder.totalAmount,
          date: updatedOrder.orderDate,
          category: "Stitching",
          baseAmount: updatedOrder.baseAmount,
          gstRate: updatedOrder.gstRate,
          gstAmount: updatedOrder.gstAmount,
          hsn: updatedOrder.hsn,
          invoiceNumber: updatedOrder.invoiceNumber,
          currency: updatedOrder.currency,
          orderId: updatedOrder.id
        });
      }
    }
    
    return updatedOrder;
  }
  
  async deleteOrder(id: number): Promise<boolean> {
    const orders = await this.readOrdersFromExcel();
    const orderToDelete = orders.find(order => order.id === id);
    
    if (!orderToDelete) {
      return false;
    }
    
    // Remove the associated revenue entry if exists
    const revenues = await this.readRevenuesFromExcel();
    const revenueToDelete = revenues.find(revenue => revenue.orderId === id);
    if (revenueToDelete) {
      await this.deleteRevenue(revenueToDelete.id);
    }
    
    const filteredOrders = orders.filter(order => order.id !== id);
    await this.writeOrdersToExcel(filteredOrders);
    return true;
  }
  
  // Salary Payment operations
  async getAllSalaryPayments(): Promise<SalaryPayment[]> {
    return this.readSalaryPaymentsFromExcel();
  }
  
  async getSalaryPaymentsByProductionUnit(productionUnitId: number): Promise<SalaryPayment[]> {
    const payments = await this.readSalaryPaymentsFromExcel();
    return payments.filter(payment => payment.productionUnitId === productionUnitId);
  }
  
  async getSalaryPaymentsByMonth(month: string, year: string): Promise<SalaryPayment[]> {
    const payments = await this.readSalaryPaymentsFromExcel();
    return payments.filter(payment => payment.month === month && payment.year === year);
  }
  
  async createSalaryPayment(payment: InsertSalaryPayment): Promise<SalaryPayment> {
    const payments = await this.readSalaryPaymentsFromExcel();
    const newPayment: SalaryPayment = {
      ...payment,
      id: this.salaryPaymentNextId++,
      paymentDate: payment.paymentDate || new Date(),
      notes: payment.notes || null
    };
    
    payments.push(newPayment);
    await this.writeSalaryPaymentsToExcel(payments);
    
    // Create a corresponding expense entry
    if (parseFloat(newPayment.amount) > 0) {
      const date = new Date(newPayment.paymentDate);
      await this.createExpense({
        productionUnitId: newPayment.productionUnitId,
        description: `Salary: ${newPayment.employeeName} - ${newPayment.month}/${newPayment.year}`,
        amount: newPayment.amount,
        date: date,
        category: "Salary",
        currency: "INR"
      });
    }
    
    return newPayment;
  }
  
  async updateSalaryPayment(id: number, updates: Partial<SalaryPayment>): Promise<SalaryPayment | undefined> {
    const payments = await this.readSalaryPaymentsFromExcel();
    const paymentIndex = payments.findIndex(payment => payment.id === id);
    
    if (paymentIndex === -1) {
      return undefined;
    }
    
    const updatedPayment = { ...payments[paymentIndex], ...updates };
    payments[paymentIndex] = updatedPayment;
    await this.writeSalaryPaymentsToExcel(payments);
    
    // Note: We don't update corresponding expense entries here for simplicity
    // In a real app, you would need to find and update the associated expense
    
    return updatedPayment;
  }
  
  async deleteSalaryPayment(id: number): Promise<boolean> {
    const payments = await this.readSalaryPaymentsFromExcel();
    const filteredPayments = payments.filter(payment => payment.id !== id);
    
    if (filteredPayments.length === payments.length) {
      return false;
    }
    
    // Note: We don't delete corresponding expense entries here for simplicity
    // In a real app, you would need to find and delete the associated expense
    
    await this.writeSalaryPaymentsToExcel(filteredPayments);
    return true;
  }
  
  // Maintenance Record operations
  async getAllMaintenanceRecords(): Promise<MaintenanceRecord[]> {
    return this.readMaintenanceRecordsFromExcel();
  }
  
  async getMaintenanceRecordsByProductionUnit(productionUnitId: number): Promise<MaintenanceRecord[]> {
    const records = await this.readMaintenanceRecordsFromExcel();
    return records.filter(record => record.productionUnitId === productionUnitId);
  }
  
  async createMaintenanceRecord(record: InsertMaintenanceRecord): Promise<MaintenanceRecord> {
    const records = await this.readMaintenanceRecordsFromExcel();
    const newRecord: MaintenanceRecord = {
      ...record,
      id: this.maintenanceRecordNextId++,
      date: record.date || new Date(),
      nextMaintenanceDate: record.nextMaintenanceDate || null,
      notes: record.notes || null
    };
    
    records.push(newRecord);
    await this.writeMaintenanceRecordsToExcel(records);
    
    // Create a corresponding expense entry
    if (parseFloat(newRecord.cost) > 0) {
      await this.createExpense({
        productionUnitId: newRecord.productionUnitId,
        description: `Maintenance: ${newRecord.machineName} - ${newRecord.maintenanceType}`,
        amount: newRecord.cost,
        date: new Date(newRecord.date),
        category: "Maintenance",
        currency: "INR"
      });
    }
    
    return newRecord;
  }
  
  async updateMaintenanceRecord(id: number, updates: Partial<MaintenanceRecord>): Promise<MaintenanceRecord | undefined> {
    const records = await this.readMaintenanceRecordsFromExcel();
    const recordIndex = records.findIndex(record => record.id === id);
    
    if (recordIndex === -1) {
      return undefined;
    }
    
    const updatedRecord = { ...records[recordIndex], ...updates };
    records[recordIndex] = updatedRecord;
    await this.writeMaintenanceRecordsToExcel(records);
    
    // Note: We don't update corresponding expense entries here for simplicity
    // In a real app, you would need to find and update the associated expense
    
    return updatedRecord;
  }
  
  async deleteMaintenanceRecord(id: number): Promise<boolean> {
    const records = await this.readMaintenanceRecordsFromExcel();
    const filteredRecords = records.filter(record => record.id !== id);
    
    if (filteredRecords.length === records.length) {
      return false;
    }
    
    // Note: We don't delete corresponding expense entries here for simplicity
    // In a real app, you would need to find and delete the associated expense
    
    await this.writeMaintenanceRecordsToExcel(filteredRecords);
    return true;
  }
  
  // Private methods for reading/writing SalaryPayments from/to Excel
  private async readSalaryPaymentsFromExcel(): Promise<SalaryPayment[]> {
    try {
      const filePath = path.join(this.dataDirectory, "salary_payments.xlsx");
      const data = await readExcelFile(filePath);
      
      if (!data || data.length <= 1) {
        return [];
      }
      
      const headers = data[0];
      const payments: SalaryPayment[] = [];
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const payment: any = {};
        
        for (let j = 0; j < headers.length; j++) {
          const header = headers[j];
          let value = row[j];
          
          if (header === "id" || header === "productionUnitId" || header === "employeeId") {
            // If id is higher than current nextId, update nextId
            const id = parseInt(value);
            if (header === "id" && id >= this.salaryPaymentNextId) {
              this.salaryPaymentNextId = id + 1;
            }
            payment[header] = id;
          } else if (header === "paymentDate") {
            payment[header] = new Date(value);
          } else {
            payment[header] = value;
          }
        }
        
        payments.push(payment);
      }
      
      return payments;
    } catch (error) {
      console.error("Error reading salary payments from Excel:", error);
      return [];
    }
  }

  private async writeSalaryPaymentsToExcel(payments: SalaryPayment[]): Promise<void> {
    try {
      const filePath = path.join(this.dataDirectory, "salary_payments.xlsx");
      const headers = ["id", "employeeName", "employeeId", "productionUnitId", "amount", "paymentDate", "paymentMethod", "notes", "month", "year"];
      
      const data = [headers];
      
      for (const payment of payments) {
        const row = [
          payment.id,
          payment.employeeName,
          payment.employeeId,
          payment.productionUnitId,
          payment.amount,
          payment.paymentDate instanceof Date 
            ? payment.paymentDate.toISOString() 
            : new Date(payment.paymentDate).toISOString(),
          payment.paymentMethod,
          payment.notes,
          payment.month,
          payment.year
        ];
        data.push(row);
      }
      
      await writeExcelFile(filePath, data, "Sheet1");
    } catch (error) {
      console.error("Error writing salary payments to Excel:", error);
      throw error;
    }
  }
  
  // Private methods for reading/writing MaintenanceRecords from/to Excel
  private async readMaintenanceRecordsFromExcel(): Promise<MaintenanceRecord[]> {
    try {
      const filePath = path.join(this.dataDirectory, "maintenance_records.xlsx");
      const data = await readExcelFile(filePath);
      
      if (!data || data.length <= 1) {
        return [];
      }
      
      const headers = data[0];
      const records: MaintenanceRecord[] = [];
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const record: any = {};
        
        for (let j = 0; j < headers.length; j++) {
          const header = headers[j];
          let value = row[j];
          
          if (header === "id" || header === "productionUnitId" || header === "machineId") {
            // If id is higher than current nextId, update nextId
            const id = parseInt(value);
            if (header === "id" && id >= this.maintenanceRecordNextId) {
              this.maintenanceRecordNextId = id + 1;
            }
            record[header] = id;
          } else if (header === "date" || header === "nextMaintenanceDate") {
            record[header] = value ? new Date(value) : null;
          } else {
            record[header] = value;
          }
        }
        
        records.push(record);
      }
      
      return records;
    } catch (error) {
      console.error("Error reading maintenance records from Excel:", error);
      return [];
    }
  }

  private async writeMaintenanceRecordsToExcel(records: MaintenanceRecord[]): Promise<void> {
    try {
      const filePath = path.join(this.dataDirectory, "maintenance_records.xlsx");
      const headers = ["id", "productionUnitId", "machineId", "machineName", "maintenanceType", "description", "cost", "date", "nextMaintenanceDate", "performedBy", "notes"];
      
      const data = [headers];
      
      for (const record of records) {
        const row = [
          record.id,
          record.productionUnitId,
          record.machineId,
          record.machineName,
          record.maintenanceType,
          record.description,
          record.cost,
          record.date instanceof Date 
            ? record.date.toISOString() 
            : new Date(record.date).toISOString(),
          record.nextMaintenanceDate instanceof Date 
            ? record.nextMaintenanceDate.toISOString() 
            : record.nextMaintenanceDate ? new Date(record.nextMaintenanceDate).toISOString() : null,
          record.performedBy,
          record.notes
        ];
        data.push(row);
      }
      
      await writeExcelFile(filePath, data, "Sheet1");
    } catch (error) {
      console.error("Error writing maintenance records to Excel:", error);
      throw error;
    }
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
    const baseAmountIndex = headers.indexOf("baseAmount");
    const gstRateIndex = headers.indexOf("gstRate");
    const gstAmountIndex = headers.indexOf("gstAmount");
    const hsnIndex = headers.indexOf("hsn");
    const invoiceNumberIndex = headers.indexOf("invoiceNumber");
    const currencyIndex = headers.indexOf("currency");
    
    for (const row of rows) {
      const expense: InsertExpense = {
        productionUnitId: parseInt(row[productionUnitIdIndex]),
        description: row[descriptionIndex],
        amount: row[amountIndex].toString(),
        date: dateIndex >= 0 && row[dateIndex] ? new Date(row[dateIndex]) : new Date(),
        category: row[categoryIndex],
        baseAmount: baseAmountIndex >= 0 && row[baseAmountIndex] ? row[baseAmountIndex].toString() : null,
        gstRate: gstRateIndex >= 0 && row[gstRateIndex] ? row[gstRateIndex].toString() : null,
        gstAmount: gstAmountIndex >= 0 && row[gstAmountIndex] ? row[gstAmountIndex].toString() : null,
        hsn: hsnIndex >= 0 && row[hsnIndex] ? row[hsnIndex] : null,
        invoiceNumber: invoiceNumberIndex >= 0 && row[invoiceNumberIndex] ? row[invoiceNumberIndex] : null,
        currency: currencyIndex >= 0 && row[currencyIndex] ? row[currencyIndex] : "INR"
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
    const baseAmountIndex = headers.indexOf("baseAmount");
    const gstRateIndex = headers.indexOf("gstRate");
    const gstAmountIndex = headers.indexOf("gstAmount");
    const hsnIndex = headers.indexOf("hsn");
    const invoiceNumberIndex = headers.indexOf("invoiceNumber");
    const currencyIndex = headers.indexOf("currency");
    
    for (const row of rows) {
      const revenue: InsertRevenue = {
        productionUnitId: parseInt(row[productionUnitIdIndex]),
        description: row[descriptionIndex],
        amount: row[amountIndex].toString(),
        date: dateIndex >= 0 && row[dateIndex] ? new Date(row[dateIndex]) : new Date(),
        category: row[categoryIndex],
        baseAmount: baseAmountIndex >= 0 && row[baseAmountIndex] ? row[baseAmountIndex].toString() : null,
        gstRate: gstRateIndex >= 0 && row[gstRateIndex] ? row[gstRateIndex].toString() : null,
        gstAmount: gstAmountIndex >= 0 && row[gstAmountIndex] ? row[gstAmountIndex].toString() : null,
        hsn: hsnIndex >= 0 && row[hsnIndex] ? row[hsnIndex] : null,
        invoiceNumber: invoiceNumberIndex >= 0 && row[invoiceNumberIndex] ? row[invoiceNumberIndex] : null,
        currency: currencyIndex >= 0 && row[currencyIndex] ? row[currencyIndex] : "INR"
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
    
    const headers = ["ID", "Date", "Description", "Production Unit", "Amount", "Category", 
                    "Base Amount", "GST Rate", "GST Amount", "HSN Code", "Invoice Number", "Currency"];
    
    const rows = expenses.map(expense => [
      expense.id,
      new Date(expense.date).toLocaleDateString(),
      expense.description,
      unitMap.get(expense.productionUnitId) || "Unknown",
      expense.amount,
      expense.category,
      expense.baseAmount || "",
      expense.gstRate || "",
      expense.gstAmount || "",
      expense.hsn || "",
      expense.invoiceNumber || "",
      expense.currency || "INR",
    ]);
    
    return [headers, ...rows];
  }

  private async prepareRevenuesForExport(): Promise<any[]> {
    const revenues = await this.readRevenuesFromExcel();
    const units = await this.readProductionUnitsFromExcel();
    const unitMap = new Map(units.map(unit => [unit.id, unit.name]));
    
    const headers = ["ID", "Date", "Description", "Production Unit", "Amount", "Category",
                    "Base Amount", "GST Rate", "GST Amount", "HSN Code", "Invoice Number", "Currency"];
    
    const rows = revenues.map(revenue => [
      revenue.id,
      new Date(revenue.date).toLocaleDateString(),
      revenue.description,
      unitMap.get(revenue.productionUnitId) || "Unknown",
      revenue.amount,
      revenue.category,
      revenue.baseAmount || "",
      revenue.gstRate || "",
      revenue.gstAmount || "",
      revenue.hsn || "",
      revenue.invoiceNumber || "",
      revenue.currency || "INR",
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
        await this.initializeExcelFile("expenses.xlsx", ["id", "productionUnitId", "description", "amount", "date", "category", "baseAmount", "gstRate", "gstAmount", "hsn", "invoiceNumber", "currency"]);
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
      const baseAmountIndex = headers.indexOf("baseAmount");
      const gstRateIndex = headers.indexOf("gstRate");
      const gstAmountIndex = headers.indexOf("gstAmount");
      const hsnIndex = headers.indexOf("hsn");
      const invoiceNumberIndex = headers.indexOf("invoiceNumber");
      const currencyIndex = headers.indexOf("currency");
      
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
          baseAmount: baseAmountIndex >= 0 ? row[baseAmountIndex] : null,
          gstRate: gstRateIndex >= 0 ? row[gstRateIndex] : null,
          gstAmount: gstAmountIndex >= 0 ? row[gstAmountIndex] : null,
          hsn: hsnIndex >= 0 ? row[hsnIndex] : null,
          invoiceNumber: invoiceNumberIndex >= 0 ? row[invoiceNumberIndex] : null,
          currency: currencyIndex >= 0 ? row[currencyIndex] : "INR"
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
    const headers = ["id", "productionUnitId", "description", "amount", "date", "category", 
                    "baseAmount", "gstRate", "gstAmount", "hsn", "invoiceNumber", "currency"];
    
    const rows = expenses.map(expense => [
      expense.id,
      expense.productionUnitId,
      expense.description,
      expense.amount,
      expense.date instanceof Date ? expense.date.toISOString() : expense.date,
      expense.category,
      expense.baseAmount || "",
      expense.gstRate || "",
      expense.gstAmount || "",
      expense.hsn || "",
      expense.invoiceNumber || "",
      expense.currency || "INR",
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
        await this.initializeExcelFile("revenues.xlsx", ["id", "productionUnitId", "description", "amount", "date", "category", "baseAmount", "gstRate", "gstAmount", "hsn", "invoiceNumber", "currency"]);
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
      const baseAmountIndex = headers.indexOf("baseAmount");
      const gstRateIndex = headers.indexOf("gstRate");
      const gstAmountIndex = headers.indexOf("gstAmount");
      const hsnIndex = headers.indexOf("hsn");
      const invoiceNumberIndex = headers.indexOf("invoiceNumber");
      const currencyIndex = headers.indexOf("currency");
      
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
          baseAmount: baseAmountIndex >= 0 ? row[baseAmountIndex] : null,
          gstRate: gstRateIndex >= 0 ? row[gstRateIndex] : null,
          gstAmount: gstAmountIndex >= 0 ? row[gstAmountIndex] : null,
          hsn: hsnIndex >= 0 ? row[hsnIndex] : null,
          invoiceNumber: invoiceNumberIndex >= 0 ? row[invoiceNumberIndex] : null,
          currency: currencyIndex >= 0 ? row[currencyIndex] : "INR"
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
    const headers = ["id", "productionUnitId", "description", "amount", "date", "category",
                    "baseAmount", "gstRate", "gstAmount", "hsn", "invoiceNumber", "currency"];
    
    const rows = revenues.map(revenue => [
      revenue.id,
      revenue.productionUnitId,
      revenue.description,
      revenue.amount,
      revenue.date instanceof Date ? revenue.date.toISOString() : revenue.date,
      revenue.category,
      revenue.baseAmount || "",
      revenue.gstRate || "",
      revenue.gstAmount || "",
      revenue.hsn || "",
      revenue.invoiceNumber || "",
      revenue.currency || "INR",
    ]);
    
    await writeExcelFile(filePath, [headers, ...rows], "Revenues");
  }

  private async readInventoryFromExcel(): Promise<InventoryItem[]> {
    const filePath = path.join(this.dataDirectory, "inventory.xlsx");
    
    try {
      // Make sure directory exists
      await ensureDirectoryExists(this.dataDirectory);
      
      // Check if file exists, create it if not
      try {
        await fs.access(filePath);
      } catch (error) {
        console.log("Creating inventory.xlsx file...");
        await this.initializeExcelFile("inventory.xlsx", ["id", "name", "description", "quantity", "unitCost", "productionUnitId", "createdAt"]);
        return []; // Return empty array since file was just created
      }
      
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
          quantity: row[quantityIndex] || "0",
          unitCost: row[unitCostIndex] || "0",
          productionUnitId: productionUnitIdIndex >= 0 && row[productionUnitIdIndex] ? parseInt(row[productionUnitIdIndex]) : null,
          createdAt: createdAtIndex >= 0 && row[createdAtIndex] ? new Date(row[createdAtIndex]) : new Date(),
        });
        
        // Update the next ID counter
        if (id >= this.inventoryNextId) {
          this.inventoryNextId = id + 1;
        }
      }
      
      return inventory;
    } catch (error) {
      console.error("Error reading inventory from Excel:", error);
      return [];
    }
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
    
    try {
      // Make sure directory exists
      await ensureDirectoryExists(this.dataDirectory);
      
      // Check if file exists, create it if not
      try {
        await fs.access(filePath);
      } catch (error) {
        console.log("Creating reports.xlsx file...");
        await this.initializeExcelFile("reports.xlsx", ["id", "name", "type", "generatedAt", "filePath"]);
        return []; // Return empty array since file was just created
      }
      
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
    } catch (error) {
      console.error("Error reading reports from Excel:", error);
      return [];
    }
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
    
    try {
      // Make sure directory exists
      await ensureDirectoryExists(this.dataDirectory);
      
      // Check if file exists, create it if not
      try {
        await fs.access(filePath);
      } catch (error) {
        console.log("Creating users.xlsx file...");
        await this.initializeExcelFile("users.xlsx", ["id", "username", "password", "name", "role"]);
        
        // Create a default admin user
        const defaultUser: User = {
          id: 1,
          username: "admin",
          password: "admin", // In a real app, this would be hashed
          name: "Administrator",
          role: "admin"
        };
        
        await this.writeUsersToExcel([defaultUser]);
        return [defaultUser]; // Return the default user
      }
      
      const data = await readExcelFile(filePath);
      
      if (!data || data.length <= 1) {
        // Create a default admin user if the file is empty
        const defaultUser: User = {
          id: 1,
          username: "admin",
          password: "admin", // In a real app, this would be hashed
          name: "Administrator",
          role: "admin"
        };
        
        await this.writeUsersToExcel([defaultUser]);
        return [defaultUser];
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
    } catch (error) {
      console.error("Error reading users from Excel:", error);
      // Return a default admin user as fallback
      return [{
        id: 1,
        username: "admin",
        password: "admin",
        name: "Administrator",
        role: "admin"
      }];
    }
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
  
  // Private methods for reading/writing Customers from/to Excel
  private async readCustomersFromExcel(): Promise<Customer[]> {
    try {
      const filePath = path.join(this.dataDirectory, "customers.xlsx");
      
      // Make sure directory exists
      await ensureDirectoryExists(this.dataDirectory);
      
      // Check if file exists, create it if not
      try {
        await fs.access(filePath);
      } catch (error) {
        console.log("Creating customers.xlsx file...");
        await this.initializeExcelFile("customers.xlsx", ["id", "name", "phone", "email", "address", "gstin", "notes", "createdAt"]);
        return []; // Return empty array since file was just created
      }
      
      const data = await readExcelFile(filePath);
      
      if (!data || data.length <= 1) {
        return [];
      }
      
      const headers = data[0];
      const idIndex = headers.indexOf("id");
      const nameIndex = headers.indexOf("name");
      const phoneIndex = headers.indexOf("phone");
      const emailIndex = headers.indexOf("email");
      const addressIndex = headers.indexOf("address");
      const gstinIndex = headers.indexOf("gstin");
      const notesIndex = headers.indexOf("notes");
      const createdAtIndex = headers.indexOf("createdAt");
      
      const customers: Customer[] = [];
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const id = parseInt(row[idIndex]);
        
        customers.push({
          id: id,
          name: row[nameIndex],
          phone: row[phoneIndex] || null,
          email: row[emailIndex] || null,
          address: row[addressIndex] || null,
          gstin: row[gstinIndex] || null,
          notes: row[notesIndex] || null,
          createdAt: row[createdAtIndex] ? new Date(row[createdAtIndex]) : new Date(),
        });
        
        // Update the next ID counter
        if (id >= this.customerNextId) {
          this.customerNextId = id + 1;
        }
      }
      
      return customers;
    } catch (error) {
      console.error("Error reading customers from Excel:", error);
      return [];
    }
  }

  private async writeCustomersToExcel(customers: Customer[]): Promise<void> {
    const filePath = path.join(this.dataDirectory, "customers.xlsx");
    const headers = ["id", "name", "phone", "email", "address", "gstin", "notes", "createdAt"];
    
    const rows = customers.map(customer => [
      customer.id,
      customer.name,
      customer.phone,
      customer.email,
      customer.address,
      customer.gstin,
      customer.notes,
      customer.createdAt instanceof Date ? customer.createdAt.toISOString() : customer.createdAt,
    ]);
    
    await writeExcelFile(filePath, [headers, ...rows], "Customers");
  }
  
  // Private methods for reading/writing Orders from/to Excel
  private async readOrdersFromExcel(): Promise<Order[]> {
    try {
      const filePath = path.join(this.dataDirectory, "orders.xlsx");
      
      // Make sure directory exists
      await ensureDirectoryExists(this.dataDirectory);
      
      // Check if file exists, create it if not
      try {
        await fs.access(filePath);
      } catch (error) {
        console.log("Creating orders.xlsx file...");
        await this.initializeExcelFile("orders.xlsx", [
          "id", "orderNumber", "customerId", "productionUnitId", 
          "description", "orderDate", "deliveryDate", "status", 
          "totalAmount", "paidAmount", "baseAmount", "gstRate", 
          "gstAmount", "hsn", "invoiceNumber", "currency", 
          "measurements", "fabricDetails", "specialInstructions"
        ]);
        return []; // Return empty array since file was just created
      }
      
      const data = await readExcelFile(filePath);
      
      if (!data || data.length <= 1) {
        return [];
      }
      
      const headers = data[0];
      const idIndex = headers.indexOf("id");
      const orderNumberIndex = headers.indexOf("orderNumber");
      const customerIdIndex = headers.indexOf("customerId");
      const productionUnitIdIndex = headers.indexOf("productionUnitId");
      const descriptionIndex = headers.indexOf("description");
      const orderDateIndex = headers.indexOf("orderDate");
      const deliveryDateIndex = headers.indexOf("deliveryDate");
      const statusIndex = headers.indexOf("status");
      const totalAmountIndex = headers.indexOf("totalAmount");
      const paidAmountIndex = headers.indexOf("paidAmount");
      const baseAmountIndex = headers.indexOf("baseAmount");
      const gstRateIndex = headers.indexOf("gstRate");
      const gstAmountIndex = headers.indexOf("gstAmount");
      const hsnIndex = headers.indexOf("hsn");
      const invoiceNumberIndex = headers.indexOf("invoiceNumber");
      const currencyIndex = headers.indexOf("currency");
      const measurementsIndex = headers.indexOf("measurements");
      const fabricDetailsIndex = headers.indexOf("fabricDetails");
      const specialInstructionsIndex = headers.indexOf("specialInstructions");
      
      const orders: Order[] = [];
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const id = parseInt(row[idIndex]);
        
        orders.push({
          id: id,
          orderNumber: row[orderNumberIndex],
          customerId: parseInt(row[customerIdIndex]),
          productionUnitId: parseInt(row[productionUnitIdIndex]),
          description: row[descriptionIndex] || null,
          orderDate: row[orderDateIndex] ? new Date(row[orderDateIndex]) : new Date(),
          deliveryDate: row[deliveryDateIndex] ? new Date(row[deliveryDateIndex]) : null,
          status: row[statusIndex],
          totalAmount: row[totalAmountIndex] || "0",
          paidAmount: row[paidAmountIndex] || "0",
          baseAmount: row[baseAmountIndex] || null,
          gstRate: row[gstRateIndex] || null,
          gstAmount: row[gstAmountIndex] || null,
          hsn: row[hsnIndex] || null,
          invoiceNumber: row[invoiceNumberIndex] || null,
          currency: row[currencyIndex] || "INR",
          measurements: row[measurementsIndex] || null,
          fabricDetails: row[fabricDetailsIndex] || null,
          specialInstructions: row[specialInstructionsIndex] || null,
        });
        
        // Update the next ID counter
        if (id >= this.orderNextId) {
          this.orderNextId = id + 1;
        }
      }
      
      return orders;
    } catch (error) {
      console.error("Error reading orders from Excel:", error);
      return [];
    }
  }

  private async writeOrdersToExcel(orders: Order[]): Promise<void> {
    const filePath = path.join(this.dataDirectory, "orders.xlsx");
    const headers = [
      "id", "orderNumber", "customerId", "productionUnitId", 
      "description", "orderDate", "deliveryDate", "status", 
      "totalAmount", "paidAmount", "baseAmount", "gstRate", 
      "gstAmount", "hsn", "invoiceNumber", "currency", 
      "measurements", "fabricDetails", "specialInstructions"
    ];
    
    const rows = orders.map(order => [
      order.id,
      order.orderNumber,
      order.customerId,
      order.productionUnitId,
      order.description,
      order.orderDate instanceof Date ? order.orderDate.toISOString() : order.orderDate,
      order.deliveryDate instanceof Date ? order.deliveryDate.toISOString() : order.deliveryDate,
      order.status,
      order.totalAmount,
      order.paidAmount,
      order.baseAmount,
      order.gstRate,
      order.gstAmount,
      order.hsn,
      order.invoiceNumber,
      order.currency,
      order.measurements,
      order.fabricDetails,
      order.specialInstructions,
    ]);
    
    await writeExcelFile(filePath, [headers, ...rows], "Orders");
  }
}

export const storage = new ExcelStorage();
