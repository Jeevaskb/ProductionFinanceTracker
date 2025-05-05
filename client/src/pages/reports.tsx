import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { FileSpreadsheet, Download, FileText, Trash } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ReportsTable } from "@/components/tables/reports-table";
import { Report } from "@shared/schema";
import { useDownload } from "@/hooks/use-download";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Reports() {
  const [selectedReportType, setSelectedReportType] = useState("production_units");
  const { toast } = useToast();
  const { downloadFile, isDownloading } = useDownload();

  // Fetch reports
  const { data: reports, isLoading: reportsLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
  });

  // Generate report mutation
  const generateMutation = useMutation({
    mutationFn: async (type: string) => {
      const response = await apiRequest("POST", "/api/reports/generate", { type });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Report generated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });

      // Optionally auto-download the generated report
      if (data.downloadUrl) {
        downloadFile(data.downloadUrl);
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to generate report: ${error.message}`,
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/reports/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Report deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete report: ${error.message}`,
      });
    },
  });

  const handleDownload = async (filename: string) => {
    const downloadUrl = `/api/reports/download/${filename}`;
    await downloadFile(downloadUrl);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this report?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleGenerateReport = () => {
    generateMutation.mutate(selectedReportType);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-2xl font-bold text-secondary-900">Reports</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Generate Report</CardTitle>
            <CardDescription>
              Generate financial and operational reports for your production units.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                <label htmlFor="report-type" className="text-sm font-medium text-secondary-700">
                  Report Type
                </label>
                <Select
                  value={selectedReportType}
                  onValueChange={setSelectedReportType}
                >
                  <SelectTrigger id="report-type">
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production_units">Production Units</SelectItem>
                    <SelectItem value="expenses">Expenses</SelectItem>
                    <SelectItem value="revenues">Revenues</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
                    <SelectItem value="financial_summary">Financial Summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerateReport}
                disabled={generateMutation.isPending}
                className="w-full"
              >
                {generateMutation.isPending ? (
                  "Generating..."
                ) : (
                  <>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>
              Download or manage previously generated reports.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reportsLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ReportsTable
                reports={reports || []}
                onDownload={handleDownload}
                onDelete={handleDelete}
                isDownloading={isDownloading}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
