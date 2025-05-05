import { Transaction } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TransactionTableProps = {
  transactions: Transaction[];
};

export function TransactionTable({ transactions }: TransactionTableProps) {
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatAmount = (amount: string | number, type: string) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    const prefix = type === "expense" ? "-" : "+";
    const className = type === "expense" ? "text-red-600" : "text-green-600";

    return (
      <span className={cn("font-mono font-medium", className)}>
        {prefix}
        {numAmount.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </span>
    );
  };

  const getTypeBadgeColor = (type: string) => {
    return type === "expense"
      ? "bg-red-100 text-red-800"
      : "bg-green-100 text-green-800";
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={`${tx.type}-${tx.id}`} className="hover:bg-secondary-50">
              <TableCell className="whitespace-nowrap text-sm">
                {formatDate(tx.date)}
              </TableCell>
              <TableCell className="text-sm">
                {tx.description}
              </TableCell>
              <TableCell className="text-sm">
                {tx.productionUnitName}
              </TableCell>
              <TableCell className="text-right">
                {formatAmount(tx.amount, tx.type)}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    getTypeBadgeColor(tx.type)
                  )}
                >
                  {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
