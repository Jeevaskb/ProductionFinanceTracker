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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductionUnit } from "@shared/schema";

// Extend the schema for validation
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  location: z.string().min(2, "Location must be at least 2 characters"),
  status: z.enum(["active", "maintenance", "inactive"]),
});

type ProductionUnitFormProps = {
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  unit?: ProductionUnit | null;
  isLoading?: boolean;
  onCancel: () => void;
};

export function ProductionUnitForm({
  onSubmit,
  unit,
  isLoading = false,
  onCancel,
}: ProductionUnitFormProps) {
  // Initialize form with default values or editing values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: unit?.name || "",
      location: unit?.location || "",
      status: (unit?.status as "active" | "maintenance" | "inactive") || "active",
    },
  });

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Manufacturing Unit A" {...field} />
              </FormControl>
              <FormDescription>
                Enter a descriptive name for the production unit.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="Building 3, Floor 2" {...field} />
              </FormControl>
              <FormDescription>
                Enter the physical location of the production unit.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Current operational status of the production unit.
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
              : unit
              ? "Update Unit"
              : "Create Unit"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
