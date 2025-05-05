import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfitLossPeriod, StatSummary } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";
import { Download, TrendingDown, TrendingUp, DollarSign, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProfitLoss() {
  const [periodFilter, setPeriodFilter] = useState("6");
  const { toast } = useToast();
  
  // Fetch profit/loss data
  const { data: profitLossData, isLoading: profitLossLoading } = useQuery<ProfitLossPeriod[]>({
    queryKey: ["/api/dashboard/profit-loss", { months: parseInt(periodFilter) }],
    queryFn: async ({ queryKey }) => {
      const [_, { months }] = queryKey as [string, { months: number }];
      const response = await fetch(`/api/dashboard/profit-loss?months=${months}`);
      if (!response.ok) {
        throw new Error("Failed to fetch profit/loss data");
      }
      return response.json();
    },
  });
  
  // Fetch dashboard stats for summary data
  const { data: statsData, isLoading: statsLoading } = useQuery<StatSummary>({
    queryKey: ["/api/dashboard/stats"],
  });

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Format percentage for display
  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };
  
  // Calculate total profit/loss across all periods
  const calculateTotals = (data: ProfitLossPeriod[] | undefined) => {
    if (!data) return { revenue: 0, expenses: 0, profit: 0 };
    
    return data.reduce((acc, period) => {
      return {
        revenue: acc.revenue + period.revenue,
        expenses: acc.expenses + period.expenses,
        profit: acc.profit + period.profit,
      };
    }, { revenue: 0, expenses: 0, profit: 0 });
  };
  
  // Calculate additional metrics for each period
  const enhancedProfitLossData = profitLossData?.map(period => ({
    ...period,
    profitMargin: period.revenue > 0 ? (period.profit / period.revenue) * 100 : 0,
  }));
  
  const totals = calculateTotals(profitLossData);
  const overallProfitMargin = totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0;
  
  // Handle export to Excel
  const handleExport = async () => {
    try {
      window.location.href = "/api/export/financial_summary";
      toast({
        title: "Export Started",
        description: "Your financial summary export has been initiated.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "There was an error exporting the financial summary.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-2xl font-bold text-secondary-900">Profit & Loss Analysis</h1>
        
        <div className="flex gap-2">
          <Select
            value={periodFilter}
            onValueChange={setPeriodFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Last 3 Months</SelectItem>
              <SelectItem value="6">Last 6 Months</SelectItem>
              <SelectItem value="12">Last 12 Months</SelectItem>
              <SelectItem value="24">Last 24 Months</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            {statsLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="flex flex-col">
                <span className="text-sm text-secondary-500">Total Revenue</span>
                <div className="flex items-center gap-2 mt-1">
                  <DollarSign className="h-5 w-5 text-primary-500" />
                  <span className="text-2xl font-bold">{formatCurrency(statsData?.totalRevenue || 0)}</span>
                </div>
                <span className="text-xs text-secondary-400 flex items-center mt-1">
                  {statsData?.revenuePercentChange && statsData.revenuePercentChange > 0 ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-green-500">{statsData.revenuePercentChange.toFixed(1)}% from last month</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                      <span className="text-red-500">{statsData?.revenuePercentChange?.toFixed(1)}% from last month</span>
                    </>
                  )}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            {statsLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="flex flex-col">
                <span className="text-sm text-secondary-500">Monthly Expenses</span>
                <div className="flex items-center gap-2 mt-1">
                  <DollarSign className="h-5 w-5 text-red-500" />
                  <span className="text-2xl font-bold">{formatCurrency(statsData?.monthlyCost || 0)}</span>
                </div>
                <span className="text-xs text-secondary-400 flex items-center mt-1">
                  {statsData?.costPercentChange && statsData.costPercentChange > 0 ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
                      <span className="text-red-500">{statsData.costPercentChange.toFixed(1)}% from last month</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-green-500">{Math.abs(statsData?.costPercentChange || 0).toFixed(1)}% from last month</span>
                    </>
                  )}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            {statsLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="flex flex-col">
                <span className="text-sm text-secondary-500">Profit Margin</span>
                <div className="flex items-center gap-2 mt-1">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  <span className="text-2xl font-bold">{formatPercentage(statsData?.profitMargin || 0)}</span>
                </div>
                <span className="text-xs text-secondary-400 flex items-center mt-1">
                  {statsData?.profitMarginChange && statsData.profitMarginChange > 0 ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-green-500">{statsData.profitMarginChange.toFixed(1)}% from last month</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                      <span className="text-red-500">{statsData?.profitMarginChange?.toFixed(1)}% from last month</span>
                    </>
                  )}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            {profitLossLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="flex flex-col">
                <span className="text-sm text-secondary-500">Period Profit</span>
                <div className="flex items-center gap-2 mt-1">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold">{formatCurrency(totals.profit)}</span>
                </div>
                <span className="text-xs text-secondary-400 flex items-center mt-1">
                  <span className={overallProfitMargin > 0 ? "text-green-500" : "text-red-500"}>
                    {formatPercentage(overallProfitMargin)} margin over {periodFilter} months
                  </span>
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs. Expenses</CardTitle>
            <CardDescription>Monthly comparison of revenue and expenses</CardDescription>
          </CardHeader>
          <CardContent className="p-0 pb-6">
            {profitLossLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={enhancedProfitLossData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="period" />
                  <YAxis 
                    yAxisId="left"
                    tickFormatter={(value) => `₹${value/1000}K`}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name.charAt(0).toUpperCase() + name.slice(1)
                    ]}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#4C9AFF" />
                  <Bar yAxisId="left" dataKey="expenses" name="Expenses" fill="#FF5630" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Profit & Margin Analysis</CardTitle>
            <CardDescription>Monthly profit and profit margin trends</CardDescription>
          </CardHeader>
          <CardContent className="p-0 pb-6">
            {profitLossLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart
                  data={enhancedProfitLossData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="period" />
                  <YAxis 
                    yAxisId="left"
                    tickFormatter={(value) => `₹${value/1000}K`}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 'dataMax + 10']}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === "Profit") return [formatCurrency(value), name];
                      if (name === "Profit Margin") return [`${value.toFixed(2)}%`, name];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="profit" name="Profit" fill="#36B37E" />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="profitMargin" 
                    name="Profit Margin" 
                    stroke="#6554C0" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Profit & Loss Statement</CardTitle>
          <CardDescription>Monthly breakdown of financial performance</CardDescription>
        </CardHeader>
        <CardContent>
          {profitLossLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Expenses</TableHead>
                  <TableHead className="text-right">Profit/Loss</TableHead>
                  <TableHead className="text-right">Margin %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enhancedProfitLossData?.map((period) => (
                  <TableRow key={period.period}>
                    <TableCell className="font-medium">{period.period}</TableCell>
                    <TableCell className="text-right">{formatCurrency(period.revenue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(period.expenses)}</TableCell>
                    <TableCell className={`text-right font-medium ${period.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(period.profit)}
                    </TableCell>
                    <TableCell className={`text-right ${period.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(period.profitMargin)}
                    </TableCell>
                  </TableRow>
                ))}
                
                {/* Totals row */}
                <TableRow className="font-bold bg-secondary-50">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.revenue)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.expenses)}</TableCell>
                  <TableCell className={`text-right ${totals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(totals.profit)}
                  </TableCell>
                  <TableCell className={`text-right ${overallProfitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(overallProfitMargin)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}