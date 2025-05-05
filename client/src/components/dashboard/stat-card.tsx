import { Card, CardContent } from "@/components/ui/card";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  percentChange: number;
  percentChangeText?: string;
  iconBgColor?: string;
  iconTextColor?: string;
};

export function StatCard({
  title,
  value,
  icon,
  percentChange,
  percentChangeText = "vs last month",
  iconBgColor = "bg-primary-50",
  iconTextColor = "text-primary-600",
}: StatCardProps) {
  const isPositive = percentChange >= 0;
  const changeTextColor = isPositive ? "text-green-600" : "text-red-500";

  // Format the value if it's a number
  const formattedValue =
    typeof value === "number"
      ? value
          .toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
          .replace("$", "$")
      : value;

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-secondary-500">{title}</p>
            <p className="text-2xl mt-1 font-semibold number-font text-secondary-900">
              {formattedValue}
            </p>
            <div className="mt-1 flex items-center">
              <span
                className={cn(
                  "text-sm font-medium flex items-center",
                  changeTextColor
                )}
              >
                {isPositive ? (
                  <ArrowUp className="h-4 w-4 mr-0.5" />
                ) : (
                  <ArrowDown className="h-4 w-4 mr-0.5" />
                )}
                {Math.abs(percentChange).toFixed(1)}%
              </span>
              <span className="text-xs text-secondary-500 ml-1">
                {percentChangeText}
              </span>
            </div>
          </div>
          <div className={cn("p-2 rounded-lg", iconBgColor)}>
            <div className={cn("text-2xl", iconTextColor)}>{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
