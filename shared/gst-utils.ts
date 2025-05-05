/**
 * Utility functions for GST calculations
 * All monetary values are in Indian Rupees (INR)
 */

// GST rates in India
export enum GSTRates {
  ZERO = 0,
  FIVE = 5,
  TWELVE = 12,
  EIGHTEEN = 18,
  TWENTYEIGHT = 28
}

// HSN code categories with standard GST rates
export interface HSNCode {
  code: string;
  description: string;
  defaultRate: GSTRates;
}

// Common HSN codes and their default GST rates
export const commonHSNCodes: HSNCode[] = [
  { code: '1001', description: 'Agricultural Products', defaultRate: GSTRates.ZERO },
  { code: '2201', description: 'Water', defaultRate: GSTRates.FIVE },
  { code: '3004', description: 'Medicaments', defaultRate: GSTRates.TWELVE },
  { code: '4901', description: 'Books, Printed Material', defaultRate: GSTRates.ZERO },
  { code: '5208', description: 'Cotton Fabrics', defaultRate: GSTRates.FIVE },
  { code: '6101', description: 'Apparel and Clothing', defaultRate: GSTRates.FIVE },
  { code: '7108', description: 'Gold, Precious Metals', defaultRate: GSTRates.FIVE },
  { code: '8415', description: 'Air Conditioners', defaultRate: GSTRates.TWENTYEIGHT },
  { code: '8471', description: 'Computers', defaultRate: GSTRates.EIGHTEEN },
  { code: '8517', description: 'Mobile Phones', defaultRate: GSTRates.EIGHTEEN },
  { code: '9401', description: 'Furniture', defaultRate: GSTRates.EIGHTEEN },
  { code: '9503', description: 'Toys', defaultRate: GSTRates.TWELVE },
];

// Common expense categories with default GST rates
export interface ExpenseCategory {
  name: string;
  defaultRate: GSTRates;
  defaultHSN?: string;
}

export const expenseCategories: ExpenseCategory[] = [
  // Stitching unit specific materials
  { name: 'Fabric', defaultRate: GSTRates.FIVE, defaultHSN: '5208' },
  { name: 'Thread', defaultRate: GSTRates.FIVE, defaultHSN: '5401' },
  { name: 'Buttons', defaultRate: GSTRates.TWELVE, defaultHSN: '9606' },
  { name: 'Zippers', defaultRate: GSTRates.TWELVE, defaultHSN: '9607' },
  { name: 'Elastic', defaultRate: GSTRates.FIVE, defaultHSN: '5604' },
  { name: 'Lace', defaultRate: GSTRates.FIVE, defaultHSN: '5804' },
  { name: 'Labels', defaultRate: GSTRates.TWELVE, defaultHSN: '5807' },
  { name: 'Packaging', defaultRate: GSTRates.EIGHTEEN, defaultHSN: '4819' },
  
  // Equipment and operations
  { name: 'Sewing Machines', defaultRate: GSTRates.EIGHTEEN, defaultHSN: '8452' },
  { name: 'Cutting Tools', defaultRate: GSTRates.EIGHTEEN, defaultHSN: '8208' },
  { name: 'Pressing Equipment', defaultRate: GSTRates.EIGHTEEN, defaultHSN: '8451' },
  { name: 'Machine Parts', defaultRate: GSTRates.EIGHTEEN, defaultHSN: '8452' },
  { name: 'Machine Maintenance', defaultRate: GSTRates.EIGHTEEN, defaultHSN: '8452' },
  
  // Standard business expenses
  { name: 'Salaries', defaultRate: GSTRates.ZERO }, // Salaries are not subject to GST
  { name: 'Contractor Payments', defaultRate: GSTRates.EIGHTEEN },
  { name: 'Rent', defaultRate: GSTRates.EIGHTEEN },
  { name: 'Electricity', defaultRate: GSTRates.EIGHTEEN },
  { name: 'Water', defaultRate: GSTRates.FIVE },
  { name: 'Transportation', defaultRate: GSTRates.FIVE },
  { name: 'Office Supplies', defaultRate: GSTRates.TWELVE },
  { name: 'Insurance', defaultRate: GSTRates.EIGHTEEN },
  { name: 'Professional Services', defaultRate: GSTRates.EIGHTEEN },
  { name: 'Marketing', defaultRate: GSTRates.EIGHTEEN },
  { name: 'Miscellaneous', defaultRate: GSTRates.EIGHTEEN },
];

// Stitching unit revenue categories with default GST rates
export const revenueCategories: ExpenseCategory[] = [
  // Garment/product categories
  { name: 'Ready-made Garments', defaultRate: GSTRates.FIVE, defaultHSN: '6101' },
  { name: 'Custom Tailoring', defaultRate: GSTRates.FIVE, defaultHSN: '6101' },
  { name: 'Embroidery Services', defaultRate: GSTRates.FIVE, defaultHSN: '5810' },
  { name: 'Alteration Services', defaultRate: GSTRates.FIVE, defaultHSN: '9988' },
  { name: 'Industrial Stitching', defaultRate: GSTRates.FIVE, defaultHSN: '6307' },
  { name: 'Fabric Printing', defaultRate: GSTRates.TWELVE, defaultHSN: '5801' },
  { name: 'Pattern Making', defaultRate: GSTRates.EIGHTEEN },
  { name: 'Uniform Orders', defaultRate: GSTRates.FIVE, defaultHSN: '6103' },
  { name: 'Bulk Orders', defaultRate: GSTRates.FIVE, defaultHSN: '6101' },
  
  // Other income streams
  { name: 'Design Services', defaultRate: GSTRates.EIGHTEEN },
  { name: 'Machine Rental', defaultRate: GSTRates.EIGHTEEN },
  { name: 'Material Resale', defaultRate: GSTRates.FIVE, defaultHSN: '5208' },
  { name: 'Consultation Fees', defaultRate: GSTRates.EIGHTEEN },
  { name: 'Training Fees', defaultRate: GSTRates.EIGHTEEN },
  { name: 'Export Sales', defaultRate: GSTRates.ZERO, defaultHSN: '6101' }, // Exports are typically zero-rated
];

/**
 * Calculate GST amount from total amount (inclusive of GST)
 * @param totalAmount - The total amount including GST
 * @param gstRate - The GST rate as a percentage (e.g., 18 for 18%)
 * @returns The GST amount
 */
export function calculateGSTFromTotal(totalAmount: number, gstRate: number): number {
  const divisor = 100 + gstRate;
  const gstAmount = (totalAmount * gstRate) / divisor;
  return Number(gstAmount.toFixed(2));
}

/**
 * Calculate base amount (excluding GST) from total amount
 * @param totalAmount - The total amount including GST
 * @param gstRate - The GST rate as a percentage
 * @returns The base amount (excluding GST)
 */
export function calculateBaseFromTotal(totalAmount: number, gstRate: number): number {
  const divisor = 100 + gstRate;
  const baseAmount = (totalAmount * 100) / divisor;
  return Number(baseAmount.toFixed(2));
}

/**
 * Calculate GST amount from base amount (excluding GST)
 * @param baseAmount - The base amount excluding GST
 * @param gstRate - The GST rate as a percentage
 * @returns The GST amount
 */
export function calculateGSTFromBase(baseAmount: number, gstRate: number): number {
  const gstAmount = (baseAmount * gstRate) / 100;
  return Number(gstAmount.toFixed(2));
}

/**
 * Calculate total amount (including GST) from base amount
 * @param baseAmount - The base amount excluding GST
 * @param gstRate - The GST rate as a percentage
 * @returns The total amount including GST
 */
export function calculateTotalFromBase(baseAmount: number, gstRate: number): number {
  const gstAmount = calculateGSTFromBase(baseAmount, gstRate);
  return Number((baseAmount + gstAmount).toFixed(2));
}

/**
 * Find GST rate for a given expense category
 * @param category - The expense category
 * @returns The default GST rate for the category
 */
export function getGSTRateForExpenseCategory(category: string): number {
  const foundCategory = expenseCategories.find(c => c.name === category);
  return foundCategory ? foundCategory.defaultRate : GSTRates.EIGHTEEN;
}

/**
 * Find GST rate for a given revenue category
 * @param category - The revenue category
 * @returns The default GST rate for the category
 */
export function getGSTRateForRevenueCategory(category: string): number {
  const foundCategory = revenueCategories.find(c => c.name === category);
  return foundCategory ? foundCategory.defaultRate : GSTRates.EIGHTEEN;
}

/**
 * Find default HSN code for a given expense category
 * @param category - The expense category
 * @returns The default HSN code for the category or undefined
 */
export function getHSNForCategory(category: string): string | undefined {
  const foundExpenseCategory = expenseCategories.find(c => c.name === category);
  if (foundExpenseCategory?.defaultHSN) {
    return foundExpenseCategory.defaultHSN;
  }
  
  const foundRevenueCategory = revenueCategories.find(c => c.name === category);
  return foundRevenueCategory?.defaultHSN;
}

/**
 * Format amount in Indian currency format (₹)
 * @param amount - The amount to format
 * @returns The formatted amount string
 */
export function formatIndianCurrency(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Format with Indian locale and currency
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(numAmount);
}

/**
 * Get sample data for expenses with Indian GST
 * @returns Array of sample expenses with GST information
 */
export function getSampleExpensesWithGST() {
  return [
    {
      description: "Cotton Fabric Purchase",
      amount: "21000",
      baseAmount: "20000",
      gstRate: "5",
      gstAmount: "1000",
      date: new Date(),
      category: "Fabric",
      productionUnitId: 1,
      hsn: "5208",
      invoiceNumber: "INV-001",
      currency: "INR"
    },
    {
      description: "Thread and Buttons",
      amount: "5600",
      baseAmount: "5000",
      gstRate: "12",
      gstAmount: "600",
      date: new Date(),
      category: "Buttons",
      productionUnitId: 1,
      hsn: "9606",
      invoiceNumber: "INV-002",
      currency: "INR"
    },
    {
      description: "Sewing Machine Repair",
      amount: "3540",
      baseAmount: "3000",
      gstRate: "18",
      gstAmount: "540",
      date: new Date(),
      category: "Machine Maintenance",
      productionUnitId: 1,
      hsn: "8452",
      invoiceNumber: "INV-003",
      currency: "INR"
    },
    {
      description: "Monthly Salary - Tailors",
      amount: "25000",
      baseAmount: "25000",
      gstRate: "0",
      gstAmount: "0",
      date: new Date(),
      category: "Salaries",
      productionUnitId: 1,
      hsn: "",
      invoiceNumber: "SAL-001",
      currency: "INR"
    },
    {
      description: "Electricity Bill",
      amount: "8260",
      baseAmount: "7000",
      gstRate: "18",
      gstAmount: "1260",
      date: new Date(),
      category: "Electricity",
      productionUnitId: 1,
      hsn: "",
      invoiceNumber: "UTIL-001",
      currency: "INR"
    },
    {
      description: "Packaging Materials",
      amount: "5900",
      baseAmount: "5000",
      gstRate: "18",
      gstAmount: "900",
      date: new Date(),
      category: "Packaging",
      productionUnitId: 1,
      hsn: "4819",
      invoiceNumber: "INV-004",
      currency: "INR"
    }
  ];
}

/**
 * Get sample data for revenues with Indian GST
 * @returns Array of sample revenues with GST information
 */
export function getSampleRevenuesWithGST() {
  return [
    {
      description: "Uniform Order - Corporate",
      amount: "105000",
      baseAmount: "100000",
      gstRate: "5",
      gstAmount: "5000",
      date: new Date(),
      category: "Uniform Orders",
      productionUnitId: 1,
      hsn: "6103",
      invoiceNumber: "SINV-001",
      currency: "INR"
    },
    {
      description: "Wedding Dress Alterations",
      amount: "15750",
      baseAmount: "15000",
      gstRate: "5",
      gstAmount: "750",
      date: new Date(),
      category: "Alteration Services",
      productionUnitId: 1,
      hsn: "9988",
      invoiceNumber: "SINV-002",
      currency: "INR"
    },
    {
      description: "Custom Embroidery Work",
      amount: "26250",
      baseAmount: "25000",
      gstRate: "5",
      gstAmount: "1250",
      date: new Date(),
      category: "Embroidery Services",
      productionUnitId: 1,
      hsn: "5810",
      invoiceNumber: "SINV-003",
      currency: "INR"
    },
    {
      description: "Bulk Order - T-shirts",
      amount: "52500",
      baseAmount: "50000",
      gstRate: "5",
      gstAmount: "2500",
      date: new Date(),
      category: "Bulk Orders",
      productionUnitId: 1,
      hsn: "6101",
      invoiceNumber: "SINV-004",
      currency: "INR"
    },
    {
      description: "Pattern Making Services",
      amount: "23600",
      baseAmount: "20000",
      gstRate: "18",
      gstAmount: "3600",
      date: new Date(),
      category: "Pattern Making",
      productionUnitId: 1,
      hsn: "",
      invoiceNumber: "SINV-005",
      currency: "INR"
    },
    {
      description: "Export Order - Garments",
      amount: "200000",
      baseAmount: "200000",
      gstRate: "0",
      gstAmount: "0",
      date: new Date(),
      category: "Export Sales",
      productionUnitId: 1,
      hsn: "6101",
      invoiceNumber: "SINV-006",
      currency: "INR"
    }
  ];
}