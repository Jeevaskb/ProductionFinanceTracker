import { Expense, ProductionUnit } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
import { format } from "date-fns";

type ExpensesTableProps = {
  expenses: Expense[];
  productionUnits: ProductionUnit[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: number) => void;
};

export function ExpensesTable({
  expenses,
  productionUnits,
  onEdit,
  onDelete,
}: ExpensesTableProps) {
  // Get production unit name by ID
  const getUnitName = (unitId: number) => {
    const unit = productionUnits.find((u) => u.id === unitId);
    return unit?.name || "Unknown Unit";
  };

  // Format currency for amount in Indian Rupees
  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numValue);
  };

  // Format category for display
  const formatCategory = (category: string) => {
    return category.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Production Unit</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No expenses found
              </TableCell>
            </TableRow>
          ) : (
            expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>
                  {format(new Date(expense.date), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="font-medium">
                  {expense.description}
                </TableCell>
                <TableCell>{getUnitName(expense.productionUnitId)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-secondary-50">
                    {formatCategory(expense.category)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-red-600">
                  {formatCurrency(expense.amount)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(expense)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(expense.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
