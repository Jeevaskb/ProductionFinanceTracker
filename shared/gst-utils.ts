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
  { name: 'Raw Materials', defaultRate: GSTRates.FIVE, defaultHSN: '1001' },
  { name: 'Equipment', defaultRate: GSTRates.EIGHTEEN, defaultHSN: '8471' },
  { name: 'Office Supplies', defaultRate: GSTRates.TWELVE },
  { name: 'Utilities', defaultRate: GSTRates.EIGHTEEN },
  { name: 'Rent', defaultRate: GSTRates.EIGHTEEN },
  { name: 'Marketing', defaultRate: GSTRates.EIGHTEEN },
  { name: 'Transportation', defaultRate: GSTRates.FIVE },
  { name: 'Salaries', defaultRate: GSTRates.ZERO }, // Salaries are not subject to GST
  { name: 'Insurance', defaultRate: GSTRates.EIGHTEEN },
  { name: 'Professional Services', defaultRate: GSTRates.EIGHTEEN },
  { name: 'Maintenance', defaultRate: GSTRates.EIGHTEEN },
  { name: 'Miscellaneous', defaultRate: GSTRates.EIGHTEEN },
];

// Common revenue categories with default GST rates
export const revenueCategories: ExpenseCategory[] = [
  { name: 'Product Sales', defaultRate: GSTRates.EIGHTEEN, defaultHSN: '8471' },
  { name: 'Service Fees', defaultRate: GSTRates.EIGHTEEN },
  { name: 'Consulting', defaultRate: GSTRates.EIGHTEEN },
  { name: 'Licensing', defaultRate: GSTRates.EIGHTEEN },
  { name: 'Royalties', defaultRate: GSTRates.EIGHTEEN },
  { name: 'Commission', defaultRate: GSTRates.EIGHTEEN },
  { name: 'Interest', defaultRate: GSTRates.ZERO }, // Interest income often exempt from GST
  { name: 'Export Sales', defaultRate: GSTRates.ZERO }, // Exports are typically zero-rated
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
      description: "Office Supplies Purchase",
      amount: "5900",
      baseAmount: "5000",
      gstRate: "18",
      gstAmount: "900",
      date: new Date(),
      category: "Office Supplies",
      productionUnitId: 1,
      hsn: "4901",
      invoiceNumber: "INV-001",
      currency: "INR"
    },
    {
      description: "Raw Material Purchase",
      amount: "10500",
      baseAmount: "10000",
      gstRate: "5",
      gstAmount: "500",
      date: new Date(),
      category: "Raw Materials",
      productionUnitId: 1,
      hsn: "1001",
      invoiceNumber: "INV-002",
      currency: "INR"
    },
    {
      description: "Equipment Maintenance",
      amount: "11800",
      baseAmount: "10000",
      gstRate: "18",
      gstAmount: "1800",
      date: new Date(),
      category: "Maintenance",
      productionUnitId: 1,
      hsn: "8471",
      invoiceNumber: "INV-003",
      currency: "INR"
    },
    {
      description: "Transportation Services",
      amount: "5250",
      baseAmount: "5000",
      gstRate: "5",
      gstAmount: "250",
      date: new Date(),
      category: "Transportation",
      productionUnitId: 1,
      hsn: "9965",
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
      description: "Product Sales",
      amount: "118000",
      baseAmount: "100000",
      gstRate: "18",
      gstAmount: "18000",
      date: new Date(),
      category: "Product Sales",
      productionUnitId: 1,
      hsn: "8471",
      invoiceNumber: "SINV-001",
      currency: "INR"
    },
    {
      description: "Consulting Services",
      amount: "59000",
      baseAmount: "50000",
      gstRate: "18",
      gstAmount: "9000",
      date: new Date(),
      category: "Consulting",
      productionUnitId: 1,
      hsn: "9983",
      invoiceNumber: "SINV-002",
      currency: "INR"
    },
    {
      description: "Export Sales",
      amount: "200000",
      baseAmount: "200000",
      gstRate: "0",
      gstAmount: "0",
      date: new Date(),
      category: "Export Sales",
      productionUnitId: 1,
      hsn: "8471",
      invoiceNumber: "SINV-003",
      currency: "INR"
    }
  ];
}