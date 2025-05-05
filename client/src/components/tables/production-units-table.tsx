import { ProductionUnit } from "@shared/schema";
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
import { cn } from "@/lib/utils";

type ProductionUnitsTableProps = {
  productionUnits: ProductionUnit[];
  onEdit: (unit: ProductionUnit) => void;
  onDelete: (id: number) => void;
};

export function ProductionUnitsTable({
  productionUnits,
  onEdit,
  onDelete,
}: ProductionUnitsTableProps) {
  // Get status color based on status value
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "maintenance":
        return "bg-amber-100 text-amber-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-secondary-100 text-secondary-800";
    }
  };

  // Format currency for cost
  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numValue);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Cost to Date</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {productionUnits.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No production units found
              </TableCell>
            </TableRow>
          ) : (
            productionUnits.map((unit) => (
              <TableRow key={unit.id}>
                <TableCell className="font-medium">{unit.name}</TableCell>
                <TableCell>{unit.location}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      getStatusColor(unit.status)
                    )}
                  >
                    {unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(unit.costToDate)}
                </TableCell>
                <TableCell>
                  {format(new Date(unit.createdAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(unit)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(unit.id)}
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
