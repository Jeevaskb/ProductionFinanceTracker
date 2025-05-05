import { useQuery } from "@tanstack/react-query";
import { DollarSign, Factory, PieChart, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { ProductionUnitCard } from "@/components/dashboard/production-unit-card";
import { TransactionTable } from "@/components/dashboard/transaction-table";
import { CostTrendChart, RevenueExpenseChart } from "@/components/dashboard/charts";
import { Skeleton } from "@/components/ui/skeleton";
import { StatSummary, ProductionUnit, Transaction, CostTrend, ProfitLossPeriod } from "@shared/schema";
import { Link } from "wouter";

export default function Dashboard() {
  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<StatSummary>({
    queryKey: ["/api/dashboard/stats"],
  });

  // Fetch production units
  const { data: productionUnits, isLoading: unitsLoading } = useQuery<ProductionUnit[]>({
    queryKey: ["/api/production-units"],
  });

  // Fetch recent transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/dashboard/transactions"],
  });

  // Fetch cost trends data
  const { data: costTrends, isLoading: trendsLoading } = useQuery<CostTrend[]>({
    queryKey: ["/api/dashboard/cost-trends"],
  });

  // Fetch profit/loss data
  const { data: profitLossData, isLoading: profitLossLoading } = useQuery<ProfitLossPeriod[]>({
    queryKey: ["/api/dashboard/profit-loss"],
  });

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          <>
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <StatCard
              title="Monthly Production Cost"
              value={stats?.monthlyCost || 0}
              icon={<DollarSign />}
              percentChange={stats?.costPercentChange || 0}
              iconBgColor="bg-primary-50"
              iconTextColor="text-primary-600"
            />
            <StatCard
              title="Total Revenue"
              value={stats?.totalRevenue || 0}
              icon={<LineChart />}
              percentChange={stats?.revenuePercentChange || 0}
              iconBgColor="bg-sky-50"
              iconTextColor="text-sky-600"
            />
            <StatCard
              title="Production Units"
              value={stats?.productionUnitCount || 0}
              icon={<Factory />}
              percentChange={stats?.productionUnitChange || 0}
              iconBgColor="bg-indigo-50"
              iconTextColor="text-indigo-600"
            />
            <StatCard
              title="Profit Margin"
              value={`${stats?.profitMargin.toFixed(1) || 0}%`}
              icon={<PieChart />}
              percentChange={stats?.profitMarginChange || 0}
              iconBgColor="bg-amber-50"
              iconTextColor="text-amber-600"
            />
          </>
        )}
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {trendsLoading ? (
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ) : (
          costTrends && <CostTrendChart data={costTrends} />
        )}

        {profitLossLoading ? (
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ) : (
          profitLossData && <RevenueExpenseChart data={profitLossData} />
        )}
      </div>

      {/* Production Units & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production Units */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-lg font-medium">Production Units</CardTitle>
            <Button variant="link" asChild>
              <Link href="/production-units" className="text-primary-700 hover:text-primary-800 text-sm font-medium">
                View All
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-4">
            {unitsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <div className="space-y-3">
                {productionUnits?.slice(0, 4).map((unit) => (
                  <ProductionUnitCard key={unit.id} unit={unit} />
                ))}
                {(!productionUnits || productionUnits.length === 0) && (
                  <div className="p-4 text-center text-secondary-500">
                    No production units found
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-lg font-medium">Recent Transactions</CardTitle>
            <div className="flex space-x-2">
              <Button variant="link" asChild>
                <Link href="/expenses" className="text-primary-700 hover:text-primary-800 text-sm font-medium">
                  View Expenses
                </Link>
              </Button>
              <Button variant="link" asChild>
                <Link href="/revenue" className="text-primary-700 hover:text-primary-800 text-sm font-medium">
                  View Revenue
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <TransactionTable transactions={transactions || []} />
            )}
            {(!transactions || transactions.length === 0) && !transactionsLoading && (
              <div className="py-8 text-center text-secondary-500">
                No transactions found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
