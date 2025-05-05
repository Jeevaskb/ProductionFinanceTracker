import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useDownload } from "@/hooks/use-download";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/import-export/file-upload";
import { FileDownload } from "@/components/import-export/file-download";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSpreadsheet, Upload, Download, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ImportExport() {
  const { toast } = useToast();
  const [importType, setImportType] = useState("production_units");
  const [exportType, setExportType] = useState("production_units");

  // File upload for import
  const { uploadFile, isUploading, progress } = useFileUpload({
    url: "/api/import",
    additionalData: { type: importType },
    onSuccess: (response) => {
      toast({
        title: "Import Successful",
        description: response.message || "Data imported successfully",
      });
    },
  });

  // File download for export
  const { downloadFile, isDownloading } = useDownload();

  const handleExport = async () => {
    try {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: exportType }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const data = await response.json();
      
      if (data.downloadUrl) {
        await downloadFile(data.downloadUrl);
      } else {
        toast({
          title: "Export Successful",
          description: "File is ready for download in Reports section",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: error.message || "An error occurred during export",
      });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-secondary-900">Import/Export</h1>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Important Note</AlertTitle>
        <AlertDescription>
          When importing data, make sure your Excel file has the required columns. Download a template first if you're unsure.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="import" className="space-y-4">
        <TabsList>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Data</CardTitle>
              <CardDescription>
                Import data from Excel files into the system. Select the data type and upload your file.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUpload
                onUpload={uploadFile}
                isUploading={isUploading}
                importType={importType}
                setImportType={setImportType}
              />

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Uploading...</span>
                    <span className="text-sm">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Data</CardTitle>
              <CardDescription>
                Export data from the system into Excel files. Select the data type and download.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileDownload
                onDownload={handleExport}
                isDownloading={isDownloading}
                exportType={exportType}
                setExportType={setExportType}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
