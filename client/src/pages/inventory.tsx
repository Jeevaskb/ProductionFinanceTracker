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
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Filter } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { InventoryForm } from "@/components/forms/inventory-form";
import { InventoryTable } from "@/components/tables/inventory-table";
import { InventoryItem, ProductionUnit } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Inventory() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const { toast } = useToast();

  // Fetch inventory items
  const { data: inventoryItems, isLoading: inventoryLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  // Fetch production units for the form
  const { data: productionUnits, isLoading: unitsLoading } = useQuery<ProductionUnit[]>({
    queryKey: ["/api/production-units"],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Omit<InventoryItem, "id" | "createdAt">) => {
      const response = await apiRequest("POST", "/api/inventory", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Inventory item added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setOpenDialog(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to add inventory item: ${error.message}`,
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
      data: Partial<InventoryItem>;
    }) => {
      const response = await apiRequest("PUT", `/api/inventory/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Inventory item updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setOpenDialog(false);
      setEditItem(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update inventory item: ${error.message}`,
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/inventory/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Inventory item deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete inventory item: ${error.message}`,
      });
    },
  });

  const handleEdit = (item: InventoryItem) => {
    setEditItem(item);
    setOpenDialog(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this inventory item?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (data: Omit<InventoryItem, "id" | "createdAt">) => {
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setEditItem(null);
  };

  // Filter inventory items based on selected production unit
  const filteredItems = inventoryItems?.filter((item) => {
    if (unitFilter === "all") return true;
    if (unitFilter === "unassigned") return !item.productionUnitId;
    return item.productionUnitId?.toString() === unitFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-secondary-900">Inventory</h1>
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
                  All Items
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="unassigned">
                  Unassigned
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
                Add Inventory Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editItem ? "Edit Inventory Item" : "Add Inventory Item"}
                </DialogTitle>
                <DialogDescription>
                  {editItem
                    ? "Update the inventory item details below."
                    : "Enter the details for the new inventory item."}
                </DialogDescription>
              </DialogHeader>
              <InventoryForm
                onSubmit={handleSubmit}
                item={editItem}
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
          {inventoryLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <InventoryTable
              inventoryItems={filteredItems || []}
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
