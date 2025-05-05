import { Revenue, ProductionUnit } from "@shared/schema";
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

type RevenuesTableProps = {
  revenues: Revenue[];
  productionUnits: ProductionUnit[];
  onEdit: (revenue: Revenue) => void;
  onDelete: (id: number) => void;
};

export function RevenuesTable({
  revenues,
  productionUnits,
  onEdit,
  onDelete,
}: RevenuesTableProps) {
  // Get production unit name by ID
  const getUnitName = (unitId: number) => {
    const unit = productionUnits.find((u) => u.id === unitId);
    return unit?.name || "Unknown Unit";
  };

  // Format currency for amount
  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
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
          {revenues.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No revenues found
              </TableCell>
            </TableRow>
          ) : (
            revenues.map((revenue) => (
              <TableRow key={revenue.id}>
                <TableCell>
                  {format(new Date(revenue.date), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="font-medium">
                  {revenue.description}
                </TableCell>
                <TableCell>{getUnitName(revenue.productionUnitId)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-secondary-50">
                    {formatCategory(revenue.category)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-green-600">
                  {formatCurrency(revenue.amount)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(revenue)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(revenue.id)}
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
