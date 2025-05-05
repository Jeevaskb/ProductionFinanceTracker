import { ProductionUnit } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ProductionUnitCardProps = {
  unit: ProductionUnit;
};

export function ProductionUnitCard({ unit }: ProductionUnitCardProps) {
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

  // Format cost to display as currency
  const formattedCost = parseFloat(unit.costToDate.toString()).toLocaleString(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );

  return (
    <div className="p-3 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-medium text-secondary-900">{unit.name}</p>
          <p className="text-sm text-secondary-500">{unit.location}</p>
        </div>
        <div className="text-right">
          <p className="font-mono font-medium text-secondary-900">
            {formattedCost}
          </p>
          <div className="flex items-center justify-end mt-1">
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                getStatusColor(unit.status)
              )}
            >
              {unit.status}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
