import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Filter } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ExpenseForm } from "@/components/forms/expense-form";
import { ExpensesTable } from "@/components/tables/expenses-table";
import { Expense, ProductionUnit } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Expenses() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const { toast } = useToast();

  // Fetch expenses
  const { data: expenses, isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  // Fetch production units for the form
  const { data: productionUnits, isLoading: unitsLoading } = useQuery<ProductionUnit[]>({
    queryKey: ["/api/production-units"],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Omit<Expense, "id">) => {
      const response = await apiRequest("POST", "/api/expenses", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expense recorded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/cost-trends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/profit-loss"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production-units"] });
      setOpenDialog(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to record expense: ${error.message}`,
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<Expense>;
    }) => {
      const response = await apiRequest("PUT", `/api/expenses/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expense updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/cost-trends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/profit-loss"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production-units"] });
      setOpenDialog(false);
      setEditExpense(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update expense: ${error.message}`,
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/cost-trends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/profit-loss"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production-units"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete expense: ${error.message}`,
      });
    },
  });

  const handleEdit = (expense: Expense) => {
    setEditExpense(expense);
    setOpenDialog(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (data: Omit<Expense, "id">) => {
    if (editExpense) {
      updateMutation.mutate({ id: editExpense.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setEditExpense(null);
  };

  // Filter expenses based on selected production unit
  const filteredExpenses = expenses?.filter((expense) => {
    if (unitFilter === "all") return true;
    return expense.productionUnitId.toString() === unitFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-secondary-900">Expenses</h1>
        <div className="flex space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Filter by Production Unit</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={unitFilter}
                onValueChange={setUnitFilter}
              >
                <DropdownMenuRadioItem value="all">
                  All Units
                </DropdownMenuRadioItem>
                {productionUnits?.map((unit) => (
                  <DropdownMenuRadioItem key={unit.id} value={unit.id.toString()}>
                    {unit.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Record Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editExpense ? "Edit Expense" : "Record Expense"}
                </DialogTitle>
                <DialogDescription>
                  {editExpense
                    ? "Update the expense details below."
                    : "Enter the details for the new expense."}
                </DialogDescription>
              </DialogHeader>
              <ExpenseForm
                onSubmit={handleSubmit}
                expense={editExpense}
                productionUnits={productionUnits || []}
                isLoading={
                  createMutation.isPending ||
                  updateMutation.isPending ||
                  unitsLoading
                }
                onCancel={handleDialogClose}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {expensesLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ExpensesTable
              expenses={filteredExpenses || []}
              productionUnits={productionUnits || []}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
