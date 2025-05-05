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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ProductionUnitForm } from "@/components/forms/production-unit-form";
import { ProductionUnitsTable } from "@/components/tables/production-units-table";
import { ProductionUnit } from "@shared/schema";

export default function ProductionUnits() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editUnit, setEditUnit] = useState<ProductionUnit | null>(null);
  const { toast } = useToast();

  // Fetch production units
  const { data: productionUnits, isLoading } = useQuery<ProductionUnit[]>({
    queryKey: ["/api/production-units"],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Omit<ProductionUnit, "id" | "createdAt" | "costToDate">) => {
      const response = await apiRequest("POST", "/api/production-units", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Production unit created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/production-units"] });
      setOpenDialog(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create production unit: ${error.message}`,
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
      data: Partial<ProductionUnit>;
    }) => {
      const response = await apiRequest("PUT", `/api/production-units/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Production unit updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/production-units"] });
      setOpenDialog(false);
      setEditUnit(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update production unit: ${error.message}`,
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/production-units/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Production unit deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/production-units"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete production unit: ${error.message}`,
      });
    },
  });

  const handleEdit = (unit: ProductionUnit) => {
    setEditUnit(unit);
    setOpenDialog(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this production unit?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (data: Omit<ProductionUnit, "id" | "createdAt" | "costToDate">) => {
    if (editUnit) {
      updateMutation.mutate({ id: editUnit.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setEditUnit(null);
  };

  const activeUnits = productionUnits?.filter(
    (unit) => unit.status === "active"
  ) || [];
  const maintenanceUnits = productionUnits?.filter(
    (unit) => unit.status === "maintenance"
  ) || [];
  const inactiveUnits = productionUnits?.filter(
    (unit) => unit.status === "inactive"
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-secondary-900">Production Units</h1>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Production Unit
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editUnit ? "Edit Production Unit" : "Add Production Unit"}
              </DialogTitle>
              <DialogDescription>
                {editUnit
                  ? "Update the production unit details below."
                  : "Enter the details for the new production unit."}
              </DialogDescription>
            </DialogHeader>
            <ProductionUnitForm
              onSubmit={handleSubmit}
              unit={editUnit}
              isLoading={createMutation.isPending || updateMutation.isPending}
              onCancel={handleDialogClose}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Units</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ProductionUnitsTable
                  productionUnits={productionUnits || []}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ProductionUnitsTable
                  productionUnits={activeUnits}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ProductionUnitsTable
                  productionUnits={maintenanceUnits}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ProductionUnitsTable
                  productionUnits={inactiveUnits}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
