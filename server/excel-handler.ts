import ExcelJS from 'exceljs';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Ensures the directory exists, creates it if it doesn't
 */
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch (error) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Reads data from an Excel file
 * @param filePathOrBuffer - Path to the Excel file or Buffer containing the Excel data
 * @returns Promise<string[][]> - A 2D array of cell values
 */
export async function readExcelFile(filePathOrBuffer: string | Buffer): Promise<string[][]> {
  try {
    const workbook = new ExcelJS.Workbook();
    
    if (typeof filePathOrBuffer === 'string') {
      await workbook.xlsx.readFile(filePathOrBuffer);
    } else {
      await workbook.xlsx.load(filePathOrBuffer);
    }
    
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new Error('No worksheet found in the Excel file');
    }
    
    const data: string[][] = [];
    
    worksheet.eachRow((row, rowNumber) => {
      const rowData: string[] = [];
      row.eachCell((cell, colNumber) => {
        rowData.push(cell.value?.toString() || '');
      });
      data.push(rowData);
    });
    
    return data;
  } catch (error) {
    console.error('Error reading Excel file:', error);
    throw error;
  }
}

/**
 * Writes data to an Excel file
 * @param filePath - Path where the Excel file will be saved
 * @param data - A 2D array of cell values
 * @param sheetName - Name of the worksheet
 * @returns Promise<void>
 */
export async function writeExcelFile(filePath: string, data: (string | number | null | undefined)[][], sheetName: string = 'Sheet1'): Promise<void> {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);
    
    // Add data to the worksheet
    worksheet.addRows(data);
    
    // Apply some basic styling
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' } // light gray background
    };
    
    // Auto-fit columns (approximate)
    data[0].forEach((_, colIndex) => {
      let maxLength = 0;
      
      data.forEach(row => {
        const cellValue = row[colIndex]?.toString() || '';
        maxLength = Math.max(maxLength, cellValue.length);
      });
      
      // Set column width based on content length
      worksheet.getColumn(colIndex + 1).width = Math.min(30, Math.max(10, maxLength + 2));
    });
    
    // Format currency columns
    data[0].forEach((header, colIndex) => {
      if (header.toLowerCase().includes('amount') || 
          header.toLowerCase().includes('cost') || 
          header.toLowerCase().includes('price')) {
        worksheet.getColumn(colIndex + 1).numFmt = '"$"#,##0.00';
      }
    });
    
    // Ensure directory exists
    await ensureDirectoryExists(path.dirname(filePath));
    
    // Save the workbook
    await workbook.xlsx.writeFile(filePath);
  } catch (error) {
    console.error('Error writing Excel file:', error);
    throw error;
  }
}

/**
 * Converts a column letter (A, B, C, ...) to a column number (1, 2, 3, ...)
 * @param column - Column letter(s)
 * @returns Column number
 */
export function columnLetterToNumber(column: string): number {
  let result = 0;
  for (let i = 0; i < column.length; i++) {
    result = result * 26 + column.charCodeAt(i) - 'A'.charCodeAt(0) + 1;
  }
  return result;
}

/**
 * Converts a column number (1, 2, 3, ...) to a column letter (A, B, C, ...)
 * @param columnNumber - Column number
 * @returns Column letter(s)
 */
export function columnNumberToLetter(columnNumber: number): string {
  let dividend = columnNumber;
  let columnName = '';
  let modulo;

  while (dividend > 0) {
    modulo = (dividend - 1) % 26;
    columnName = String.fromCharCode(65 + modulo) + columnName;
    dividend = Math.floor((dividend - modulo) / 26);
  }

  return columnName;
}

/**
 * Gets the cell address from row and column
 * @param row - Row number (1-based)
 * @param column - Column number (1-based)
 * @returns Cell address (e.g. "A1")
 */
export function getCellAddress(row: number, column: number): string {
  return `${columnNumberToLetter(column)}${row}`;
}
