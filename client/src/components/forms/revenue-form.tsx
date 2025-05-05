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
import { Revenue, ProductionUnit } from "@shared/schema";
import { format } from "date-fns";

// Revenue categories
const REVENUE_CATEGORIES = [
  "product_sales",
  "service_fee",
  "maintenance_contract",
  "consulting",
  "rental_income",
  "other",
];

// Extend the schema for validation
const formSchema = z.object({
  productionUnitId: z.string().min(1, "Production unit is required"),
  description: z.string().min(2, "Description must be at least 2 characters"),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Amount must be a positive number",
  }),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Please enter a valid date",
  }),
  category: z.string().min(1, "Category is required"),
});

type RevenueFormProps = {
  onSubmit: (data: Omit<Revenue, "id">) => void;
  revenue?: Revenue | null;
  productionUnits: ProductionUnit[];
  isLoading?: boolean;
  onCancel: () => void;
};

export function RevenueForm({
  onSubmit,
  revenue,
  productionUnits,
  isLoading = false,
  onCancel,
}: RevenueFormProps) {
  // Format the date to YYYY-MM-DD for the date input
  const formatDateForInput = (dateString: string | Date | undefined) => {
    if (!dateString) return format(new Date(), "yyyy-MM-dd");
    const date = new Date(dateString);
    return format(date, "yyyy-MM-dd");
  };

  // Initialize form with default values or editing values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productionUnitId: revenue?.productionUnitId.toString() || "",
      description: revenue?.description || "",
      amount: revenue?.amount.toString() || "",
      date: formatDateForInput(revenue?.date),
      category: revenue?.category || "",
    },
  });

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    onSubmit({
      productionUnitId: parseInt(data.productionUnitId),
      description: data.description,
      amount: parseFloat(data.amount),
      date: new Date(data.date),
      category: data.category,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="productionUnitId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Production Unit</FormLabel>
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
                  {productionUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id.toString()}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Select the production unit this revenue is associated with.
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Product Sales - Retail" {...field} />
              </FormControl>
              <FormDescription>
                Enter a brief description of the revenue.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount ($)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="1000.00"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Enter the revenue amount in dollars.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormDescription>
                Date when the revenue was received.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select revenue category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {REVENUE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Select the category that best describes this revenue.
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
              : revenue
              ? "Update Revenue"
              : "Record Revenue"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
