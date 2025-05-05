import { InventoryItem, ProductionUnit } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
import { format } from "date-fns";

type InventoryTableProps = {
  inventoryItems: InventoryItem[];
  productionUnits: ProductionUnit[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: number) => void;
};

export function InventoryTable({
  inventoryItems,
  productionUnits,
  onEdit,
  onDelete,
}: InventoryTableProps) {
  // Get production unit name by ID
  const getUnitName = (unitId: number | null) => {
    if (!unitId) return "Unassigned";
    const unit = productionUnits.find((u) => u.id === unitId);
    return unit?.name || "Unknown Unit";
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

  // Calculate total value (quantity * unitCost)
  const calculateTotalValue = (quantity: string | number, unitCost: string | number) => {
    const quantityNum = typeof quantity === "string" ? parseFloat(quantity) : quantity;
    const costNum = typeof unitCost === "string" ? parseFloat(unitCost) : unitCost;
    return formatCurrency(quantityNum * costNum);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead className="text-right">Unit Cost</TableHead>
            <TableHead className="text-right">Total Value</TableHead>
            <TableHead>Production Unit</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventoryItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No inventory items found
              </TableCell>
            </TableRow>
          ) : (
            inventoryItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  <div>
                    <div>{item.name}</div>
                    {item.description && (
                      <div className="text-xs text-secondary-500 mt-1">
                        {item.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {parseFloat(item.quantity.toString()).toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(item.unitCost)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {calculateTotalValue(item.quantity, item.unitCost)}
                </TableCell>
                <TableCell>
                  {getUnitName(item.productionUnitId)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(item.id)}
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
