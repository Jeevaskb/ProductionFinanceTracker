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
import { Expense, ProductionUnit } from "@shared/schema";
import { format } from "date-fns";
import { useEffect } from "react";
import { calculateBaseFromTotal, calculateGSTFromTotal, expenseCategoryToGSTRate, categoryToHSNCode } from "@/lib/utils";

// Expense categories - updated to match GST categories in utils.ts
const EXPENSE_CATEGORIES = [
  "raw_materials",
  "equipment",
  "office_supplies",
  "utilities",
  "rent",
  "marketing",
  "transportation",
  "salaries",
  "insurance",
  "professional_services",
  "maintenance",
  "miscellaneous",
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
  // GST related fields
  baseAmount: z.string().optional(),
  gstRate: z.string().optional(),
  gstAmount: z.string().optional(),
  hsn: z.string().optional(),
  invoiceNumber: z.string().optional(),
  currency: z.string().optional(),
});

type ExpenseFormProps = {
  onSubmit: (data: Omit<Expense, "id">) => void;
  expense?: Expense | null;
  productionUnits: ProductionUnit[];
  isLoading?: boolean;
  onCancel: () => void;
};

export function ExpenseForm({
  onSubmit,
  expense,
  productionUnits,
  isLoading = false,
  onCancel,
}: ExpenseFormProps) {
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
      productionUnitId: expense?.productionUnitId.toString() || "",
      description: expense?.description || "",
      amount: expense?.amount.toString() || "",
      date: formatDateForInput(expense?.date),
      category: expense?.category || "",
      baseAmount: expense?.baseAmount?.toString() || "",
      gstRate: expense?.gstRate?.toString() || "",
      gstAmount: expense?.gstAmount?.toString() || "",
      hsn: expense?.hsn || "",
      invoiceNumber: expense?.invoiceNumber || "",
      currency: expense?.currency || "INR",
    },
  });
  
  // Auto-calculate GST when amount or category changes
  useEffect(() => {
    const amount = form.watch("amount");
    const category = form.watch("category");
    
    if (amount && category) {
      const totalAmount = parseFloat(amount);
      if (!isNaN(totalAmount) && totalAmount > 0) {
        // Get the appropriate GST rate for this category directly using snake_case
        const gstRate = expenseCategoryToGSTRate[category] || 18; // Default to 18% if not found
        
        // Calculate GST amount and base amount
        const gstAmount = calculateGSTFromTotal(totalAmount, gstRate);
        const baseAmount = calculateBaseFromTotal(totalAmount, gstRate);
        
        // Get the HSN code if available
        const hsn = categoryToHSNCode[category] || "";
        
        // Update form fields
        form.setValue("gstRate", gstRate.toString());
        form.setValue("gstAmount", gstAmount.toString());
        form.setValue("baseAmount", baseAmount.toString());
        form.setValue("hsn", hsn);
      }
    }
  }, [form.watch("amount"), form.watch("category")]);

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    onSubmit({
      productionUnitId: parseInt(data.productionUnitId),
      description: data.description,
      amount: data.amount, // Keep as string to match the schema
      date: new Date(data.date),
      category: data.category,
      baseAmount: data.baseAmount || null,
      gstRate: data.gstRate || null,
      gstAmount: data.gstAmount || null,
      hsn: data.hsn || null,
      invoiceNumber: data.invoiceNumber || null,
      currency: data.currency || "INR",
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
                Select the production unit this expense is associated with.
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
                <Input placeholder="Raw Material Purchase" {...field} />
              </FormControl>
              <FormDescription>
                Enter a brief description of the expense.
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
              <FormLabel>Amount (₹)</FormLabel>
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
                Enter the total expense amount (including GST).
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
                Date when the expense occurred.
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
                    <SelectValue placeholder="Select expense category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Select the category that best describes this expense.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* GST Details Section */}
        <div className="bg-slate-50 p-4 rounded-md border">
          <h3 className="text-lg font-medium mb-3">GST Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="baseAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Amount (Excl. GST)</FormLabel>
                  <FormControl>
                    <Input readOnly {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="gstRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GST Rate (%)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="gstAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GST Amount</FormLabel>
                  <FormControl>
                    <Input readOnly {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="hsn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>HSN Code</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="invoiceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Number</FormLabel>
                  <FormControl>
                    <Input placeholder="INV-001" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            GST amounts are automatically calculated based on the category and total amount.
          </p>
        </div>

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
              : expense
              ? "Update Expense"
              : "Record Expense"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
