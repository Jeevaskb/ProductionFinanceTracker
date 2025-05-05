import { Report } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Trash } from "lucide-react";
import { format } from "date-fns";
import path from "path";

type ReportsTableProps = {
  reports: Report[];
  onDownload: (filename: string) => void;
  onDelete: (id: number) => void;
  isDownloading: boolean;
};

export function ReportsTable({
  reports,
  onDownload,
  onDelete,
  isDownloading,
}: ReportsTableProps) {
  // Format report type for display
  const formatReportType = (type: string) => {
    return type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };
  
  // Get filename from filepath
  const getFilename = (filePath: string) => {
    return filePath.split("/").pop() || filePath;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Generated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No reports found
              </TableCell>
            </TableRow>
          ) : (
            reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell className="font-medium">{report.name}</TableCell>
                <TableCell>{formatReportType(report.type)}</TableCell>
                <TableCell>
                  {format(new Date(report.generatedAt), "MMM d, yyyy h:mm a")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDownload(getFilename(report.filePath))}
                      disabled={isDownloading}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(report.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
