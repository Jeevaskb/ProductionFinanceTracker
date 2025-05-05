import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProfitLossPeriod, CostTrend } from "@shared/schema";

type ChartContainerProps = {
  title: string;
  children: React.ReactNode;
  filters: string[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
};

export function ChartContainer({
  title,
  children,
  filters,
  activeFilter,
  onFilterChange,
}: ChartContainerProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-secondary-900">{title}</h3>
          <div className="flex space-x-2">
            {filters.map((filter) => (
              <Button
                key={filter}
                variant="ghost"
                size="sm"
                className={
                  activeFilter === filter
                    ? "bg-primary-50 text-primary-700 hover:bg-primary-100 hover:text-primary-800"
                    : "text-secondary-500 hover:bg-secondary-50"
                }
                onClick={() => onFilterChange(filter)}
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>
        <div className="h-64 w-full">{children}</div>
      </CardContent>
    </Card>
  );
}

type CostTrendChartProps = {
  data: CostTrend[];
};

export function CostTrendChart({ data }: CostTrendChartProps) {
  const [activeFilter, setActiveFilter] = useState("Monthly");
  const filters = ["Monthly", "Quarterly", "Yearly"];

  // In a real app, you would filter the data based on the activeFilter
  const filteredData = data;

  // Format numbers to be more readable in the tooltip
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <ChartContainer
      title="Production Cost Trends"
      filters={filters}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={filteredData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="hsl(var(--chart-1))"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="hsl(var(--chart-1))"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={formatCurrency}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), "Cost"]}
            labelFormatter={(label) => `Period: ${label}`}
          />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="hsl(var(--chart-1))"
            fillOpacity={1}
            fill="url(#colorCost)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

type RevenueExpenseChartProps = {
  data: ProfitLossPeriod[];
};

export function RevenueExpenseChart({ data }: RevenueExpenseChartProps) {
  const [activeFilter, setActiveFilter] = useState("6 Months");
  const filters = ["6 Months", "YTD", "12 Months"];

  // In a real app, you would filter the data based on the activeFilter
  const filteredData = data;

  // Format numbers to be more readable in the tooltip
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <ChartContainer
      title="Revenue vs. Expenses"
      filters={filters}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={filteredData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={formatCurrency}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              formatCurrency(value),
              name.charAt(0).toUpperCase() + name.slice(1),
            ]}
            labelFormatter={(label) => `Period: ${label}`}
          />
          <Legend />
          <Bar
            dataKey="revenue"
            fill="hsl(var(--chart-2))"
            name="Revenue"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="expenses"
            fill="hsl(var(--chart-3))"
            name="Expenses"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
