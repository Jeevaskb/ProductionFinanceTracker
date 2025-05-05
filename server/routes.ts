import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { promises as fs } from "fs";
import multer from "multer";
import path from "path";
import { z } from "zod";
import {
  insertProductionUnitSchema,
  insertExpenseSchema,
  insertRevenueSchema,
  insertInventoryItemSchema,
} from "@shared/schema";
import { getSampleExpensesWithGST, getSampleRevenuesWithGST } from "@shared/gst-utils";

// Set up multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Create required directories
  try {
    await fs.mkdir(path.resolve(process.cwd(), "data"), { recursive: true });
    await fs.mkdir(path.resolve(process.cwd(), "data", "reports"), { recursive: true });
  } catch (error) {
    console.error("Error creating directories:", error);
  }

  // API Routes
  
  // Dashboard data
  app.get("/api/dashboard/stats", async (req: Request, res: Response) => {
    try {
      const stats = await storage.getStatSummary();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  app.get("/api/dashboard/transactions", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const transactions = await storage.getRecentTransactions(limit);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching recent transactions:", error);
      res.status(500).json({ message: "Failed to fetch recent transactions" });
    }
  });

  app.get("/api/dashboard/cost-trends", async (req: Request, res: Response) => {
    try {
      const months = parseInt(req.query.months as string) || 12;
      const trends = await storage.getCostTrends(months);
      res.json(trends);
    } catch (error) {
      console.error("Error fetching cost trends:", error);
      res.status(500).json({ message: "Failed to fetch cost trends" });
    }
  });

  app.get("/api/dashboard/profit-loss", async (req: Request, res: Response) => {
    try {
      const months = parseInt(req.query.months as string) || 6;
      const data = await storage.getProfitLossData(months);
      res.json(data);
    } catch (error) {
      console.error("Error fetching profit/loss data:", error);
      res.status(500).json({ message: "Failed to fetch profit/loss data" });
    }
  });

  // Production Units
  app.get("/api/production-units", async (req: Request, res: Response) => {
    try {
      const units = await storage.getAllProductionUnits();
      res.json(units);
    } catch (error) {
      console.error("Error fetching production units:", error);
      res.status(500).json({ message: "Failed to fetch production units" });
    }
  });

  app.get("/api/production-units/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const unit = await storage.getProductionUnit(id);
      
      if (!unit) {
        return res.status(404).json({ message: "Production unit not found" });
      }
      
      res.json(unit);
    } catch (error) {
      console.error("Error fetching production unit:", error);
      res.status(500).json({ message: "Failed to fetch production unit" });
    }
  });

  app.post("/api/production-units", async (req: Request, res: Response) => {
    try {
      const validation = insertProductionUnitSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid production unit data", errors: validation.error.format() });
      }
      
      const newUnit = await storage.createProductionUnit(validation.data);
      res.status(201).json(newUnit);
    } catch (error) {
      console.error("Error creating production unit:", error);
      res.status(500).json({ message: "Failed to create production unit" });
    }
  });

  app.put("/api/production-units/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validation = insertProductionUnitSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid production unit data", errors: validation.error.format() });
      }
      
      const updatedUnit = await storage.updateProductionUnit(id, validation.data);
      
      if (!updatedUnit) {
        return res.status(404).json({ message: "Production unit not found" });
      }
      
      res.json(updatedUnit);
    } catch (error) {
      console.error("Error updating production unit:", error);
      res.status(500).json({ message: "Failed to update production unit" });
    }
  });

  app.delete("/api/production-units/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProductionUnit(id);
      
      if (!success) {
        return res.status(404).json({ message: "Production unit not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting production unit:", error);
      res.status(500).json({ message: "Failed to delete production unit" });
    }
  });

  // Expenses
  app.get("/api/expenses", async (req: Request, res: Response) => {
    try {
      const productionUnitId = req.query.productionUnitId ? parseInt(req.query.productionUnitId as string) : undefined;
      
      let expenses;
      if (productionUnitId) {
        expenses = await storage.getExpensesByProductionUnit(productionUnitId);
      } else {
        expenses = await storage.getAllExpenses();
      }
      
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", async (req: Request, res: Response) => {
    try {
      const validation = insertExpenseSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid expense data", errors: validation.error.format() });
      }
      
      const newExpense = await storage.createExpense(validation.data);
      res.status(201).json(newExpense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  app.put("/api/expenses/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validation = insertExpenseSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid expense data", errors: validation.error.format() });
      }
      
      const updatedExpense = await storage.updateExpense(id, validation.data);
      
      if (!updatedExpense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      res.json(updatedExpense);
    } catch (error) {
      console.error("Error updating expense:", error);
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteExpense(id);
      
      if (!success) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting expense:", error);
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Revenues
  app.get("/api/revenues", async (req: Request, res: Response) => {
    try {
      const productionUnitId = req.query.productionUnitId ? parseInt(req.query.productionUnitId as string) : undefined;
      
      let revenues;
      if (productionUnitId) {
        revenues = await storage.getRevenuesByProductionUnit(productionUnitId);
      } else {
        revenues = await storage.getAllRevenues();
      }
      
      res.json(revenues);
    } catch (error) {
      console.error("Error fetching revenues:", error);
      res.status(500).json({ message: "Failed to fetch revenues" });
    }
  });

  app.post("/api/revenues", async (req: Request, res: Response) => {
    try {
      const validation = insertRevenueSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid revenue data", errors: validation.error.format() });
      }
      
      const newRevenue = await storage.createRevenue(validation.data);
      res.status(201).json(newRevenue);
    } catch (error) {
      console.error("Error creating revenue:", error);
      res.status(500).json({ message: "Failed to create revenue" });
    }
  });

  app.put("/api/revenues/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validation = insertRevenueSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid revenue data", errors: validation.error.format() });
      }
      
      const updatedRevenue = await storage.updateRevenue(id, validation.data);
      
      if (!updatedRevenue) {
        return res.status(404).json({ message: "Revenue not found" });
      }
      
      res.json(updatedRevenue);
    } catch (error) {
      console.error("Error updating revenue:", error);
      res.status(500).json({ message: "Failed to update revenue" });
    }
  });

  app.delete("/api/revenues/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteRevenue(id);
      
      if (!success) {
        return res.status(404).json({ message: "Revenue not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting revenue:", error);
      res.status(500).json({ message: "Failed to delete revenue" });
    }
  });

  // Inventory
  app.get("/api/inventory", async (req: Request, res: Response) => {
    try {
      const productionUnitId = req.query.productionUnitId ? parseInt(req.query.productionUnitId as string) : undefined;
      
      let items;
      if (productionUnitId) {
        items = await storage.getInventoryItemsByProductionUnit(productionUnitId);
      } else {
        items = await storage.getAllInventoryItems();
      }
      
      res.json(items);
    } catch (error) {
      console.error("Error fetching inventory items:", error);
      res.status(500).json({ message: "Failed to fetch inventory items" });
    }
  });

  app.post("/api/inventory", async (req: Request, res: Response) => {
    try {
      const validation = insertInventoryItemSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid inventory item data", errors: validation.error.format() });
      }
      
      const newItem = await storage.createInventoryItem(validation.data);
      res.status(201).json(newItem);
    } catch (error) {
      console.error("Error creating inventory item:", error);
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  });

  app.put("/api/inventory/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validation = insertInventoryItemSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid inventory item data", errors: validation.error.format() });
      }
      
      const updatedItem = await storage.updateInventoryItem(id, validation.data);
      
      if (!updatedItem) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating inventory item:", error);
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });

  app.delete("/api/inventory/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteInventoryItem(id);
      
      if (!success) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      res.status(500).json({ message: "Failed to delete inventory item" });
    }
  });

  // Reports
  app.get("/api/reports", async (req: Request, res: Response) => {
    try {
      const reports = await storage.getAllReports();
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.post("/api/reports/generate", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        type: z.enum(["production_units", "expenses", "revenues", "inventory", "financial_summary"]),
      });
      
      const validation = schema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid report type", errors: validation.error.format() });
      }
      
      const filePath = await storage.exportToExcel(validation.data.type);
      const filename = path.basename(filePath);
      
      res.json({ 
        message: "Report generated successfully", 
        filepath: filePath,
        downloadUrl: `/api/reports/download/${filename}`
      });
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  app.get("/api/reports/download/:filename", async (req: Request, res: Response) => {
    try {
      const filename = req.params.filename;
      const filePath = path.join(process.cwd(), "data", "reports", filename);
      
      // Check if file exists
      try {
        await fs.access(filePath);
      } catch (error) {
        return res.status(404).json({ message: "Report file not found" });
      }
      
      res.download(filePath);
    } catch (error) {
      console.error("Error downloading report:", error);
      res.status(500).json({ message: "Failed to download report" });
    }
  });

  app.delete("/api/reports/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteReport(id);
      
      if (!success) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting report:", error);
      res.status(500).json({ message: "Failed to delete report" });
    }
  });

  // Sample GST Data
  app.post("/api/sample-gst-data", async (req: Request, res: Response) => {
    try {
      // Check if a production unit exists
      const units = await storage.getAllProductionUnits();
      let productionUnitId = 1;
      
      // If no production unit exists, create one
      if (units.length === 0) {
        const newUnit = await storage.createProductionUnit({
          name: "Sample Production Unit",
          location: "Delhi, India",
          status: "active"
        });
        productionUnitId = newUnit.id;
      } else {
        productionUnitId = units[0].id;
      }
      
      // Add sample GST expenses
      const sampleExpenses = getSampleExpensesWithGST();
      let expensesAdded = 0;
      
      for (const expense of sampleExpenses) {
        await storage.createExpense({
          ...expense,
          productionUnitId
        });
        expensesAdded++;
      }
      
      // Add sample GST revenues
      const sampleRevenues = getSampleRevenuesWithGST();
      let revenuesAdded = 0;
      
      for (const revenue of sampleRevenues) {
        await storage.createRevenue({
          ...revenue,
          productionUnitId
        });
        revenuesAdded++;
      }
      
      res.json({
        message: "Sample GST data added successfully",
        expensesAdded,
        revenuesAdded,
        productionUnitId
      });
    } catch (error) {
      console.error("Error adding sample GST data:", error);
      res.status(500).json({ message: "Failed to add sample GST data" });
    }
  });
  
  // Import/Export
  app.post("/api/import", upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const schema = z.object({
        type: z.enum(["production_units", "expenses", "revenues", "inventory"]),
      });
      
      const validation = schema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid import type", errors: validation.error.format() });
      }
      
      const importCount = await storage.importFromExcel(req.file.buffer, validation.data.type);
      res.json({ message: `Successfully imported ${importCount} records` });
    } catch (error) {
      console.error("Error importing data:", error);
      res.status(500).json({ message: `Failed to import data: ${error.message}` });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
