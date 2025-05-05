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
import { RevenueForm } from "@/components/forms/revenue-form";
import { RevenuesTable } from "@/components/tables/revenues-table";
import { Revenue, ProductionUnit } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function RevenueTracker() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editRevenue, setEditRevenue] = useState<Revenue | null>(null);
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const { toast } = useToast();

  // Fetch revenues
  const { data: revenues, isLoading: revenuesLoading } = useQuery<Revenue[]>({
    queryKey: ["/api/revenues"],
  });

  // Fetch production units for the form
  const { data: productionUnits, isLoading: unitsLoading } = useQuery<ProductionUnit[]>({
    queryKey: ["/api/production-units"],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Omit<Revenue, "id">) => {
      const response = await apiRequest("POST", "/api/revenues", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Revenue recorded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/revenues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/profit-loss"] });
      setOpenDialog(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to record revenue: ${error.message}`,
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
      data: Partial<Revenue>;
    }) => {
      const response = await apiRequest("PUT", `/api/revenues/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Revenue updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/revenues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/profit-loss"] });
      setOpenDialog(false);
      setEditRevenue(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update revenue: ${error.message}`,
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/revenues/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Revenue deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/revenues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/profit-loss"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete revenue: ${error.message}`,
      });
    },
  });

  const handleEdit = (revenue: Revenue) => {
    setEditRevenue(revenue);
    setOpenDialog(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this revenue entry?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (data: Omit<Revenue, "id">) => {
    if (editRevenue) {
      updateMutation.mutate({ id: editRevenue.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setEditRevenue(null);
  };

  // Filter revenues based on selected production unit
  const filteredRevenues = revenues?.filter((revenue) => {
    if (unitFilter === "all") return true;
    return revenue.productionUnitId.toString() === unitFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-secondary-900">Revenue</h1>
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
                Record Revenue
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editRevenue ? "Edit Revenue" : "Record Revenue"}
                </DialogTitle>
                <DialogDescription>
                  {editRevenue
                    ? "Update the revenue details below."
                    : "Enter the details for the new revenue."}
                </DialogDescription>
              </DialogHeader>
              <RevenueForm
                onSubmit={handleSubmit}
                revenue={editRevenue}
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
          {revenuesLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <RevenuesTable
              revenues={filteredRevenues || []}
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
