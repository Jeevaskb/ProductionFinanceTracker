import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InventoryItem, ProductionUnit } from "@shared/schema";

// Extend the schema for validation
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  quantity: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Quantity must be a non-negative number",
  }),
  unitCost: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Unit cost must be a positive number",
  }),
  productionUnitId: z.string().optional(),
});

type InventoryFormProps = {
  onSubmit: (data: Omit<InventoryItem, "id" | "createdAt">) => void;
  item?: InventoryItem | null;
  productionUnits: ProductionUnit[];
  isLoading?: boolean;
  onCancel: () => void;
};

export function InventoryForm({
  onSubmit,
  item,
  productionUnits,
  isLoading = false,
  onCancel,
}: InventoryFormProps) {
  // Initialize form with default values or editing values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: item?.name || "",
      description: item?.description || "",
      quantity: item?.quantity.toString() || "0",
      unitCost: item?.unitCost.toString() || "",
      productionUnitId: item?.productionUnitId?.toString() || "",
    },
  });

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    onSubmit({
      name: data.name,
      description: data.description || null,
      quantity: parseFloat(data.quantity),
      unitCost: parseFloat(data.unitCost),
      productionUnitId: data.productionUnitId ? parseInt(data.productionUnitId) : null,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item Name</FormLabel>
              <FormControl>
                <Input placeholder="Raw Material A" {...field} />
              </FormControl>
              <FormDescription>
                Enter the name of the inventory item.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Additional details about the item"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Provide additional details about the inventory item.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="100"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Current quantity available in stock.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="unitCost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unit Cost ($)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="10.00"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Cost per unit in dollars.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="productionUnitId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Production Unit (Optional)</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select production unit" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">None (Unassigned)</SelectItem>
                  {productionUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id.toString()}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Assign to a production unit if this item is specific to one.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? "Saving..."
              : item
              ? "Update Item"
              : "Add Item"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
