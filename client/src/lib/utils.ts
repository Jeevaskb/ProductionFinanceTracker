import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// GST related utility functions

/**
 * Maps expense categories to their default GST rates
 */
export const expenseCategoryToGSTRate: Record<string, number> = {
  "Raw Materials": 5,
  "Equipment": 18,
  "Office Supplies": 12,
  "Utilities": 18,
  "Rent": 18,
  "Marketing": 18,
  "Transportation": 5,
  "Salaries": 0, // Salaries are not subject to GST
  "Insurance": 18,
  "Professional Services": 18,
  "Maintenance": 18,
  "Miscellaneous": 18,
  // Maps snake_case to title case for our form usage
  "raw_materials": 5,
  "equipment": 18,
  "office_supplies": 12,
  "utilities": 18,
  "rent": 18,
  "marketing": 18,
  "transportation": 5,
  "salaries": 0,
  "insurance": 18,
  "professional_services": 18,
  "maintenance": 18,
  "miscellaneous": 18,
};

/**
 * Maps revenue categories to their default GST rates
 */
export const revenueCategoryToGSTRate: Record<string, number> = {
  "Product Sales": 18,
  "Service Fees": 18,
  "Consulting": 18,
  "Licensing": 18,
  "Royalties": 18,
  "Commission": 18,
  "Interest": 0, // Interest income often exempt from GST
  "Export Sales": 0, // Exports are typically zero-rated
};

/**
 * Maps common expense categories to their default HSN codes
 */
export const categoryToHSNCode: Record<string, string> = {
  // Title case format
  "Raw Materials": "1001",
  "Equipment": "8471",
  "Office Supplies": "4820",
  "Utilities": "9987",
  "Rent": "9972",
  "Marketing": "9983",
  "Transportation": "9965",
  "Professional Services": "9983",
  "Maintenance": "9987",
  
  // Snake case format for our form
  "raw_materials": "1001",
  "equipment": "8471",
  "office_supplies": "4820",
  "utilities": "9987",
  "rent": "9972",
  "marketing": "9983",
  "transportation": "9965",
  "professional_services": "9983",
  "maintenance": "9987",
  
  // For revenue categories
  "Product Sales": "8471",
  "Export Sales": "8471",
  "Consulting": "9983",
};

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
 * Format amount in Indian currency format (₹)
 * @param amount - The amount to format
 * @returns The formatted amount string
 */
export function formatIndianCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '₹0.00';
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Format with Indian locale and currency
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(numAmount);
}
