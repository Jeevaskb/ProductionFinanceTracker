import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download, FileSpreadsheet } from "lucide-react";

type FileDownloadProps = {
  onDownload: () => Promise<void>;
  isDownloading: boolean;
  exportType: string;
  setExportType: (type: string) => void;
};

export function FileDownload({
  onDownload,
  isDownloading,
  exportType,
  setExportType,
}: FileDownloadProps) {
  const handleExportTypeChange = (value: string) => {
    setExportType(value);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="export-type">Data Type</Label>
        <Select value={exportType} onValueChange={handleExportTypeChange}>
          <SelectTrigger id="export-type">
            <SelectValue placeholder="Select data type" />
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

      <div className="grid gap-2">
        <p className="text-sm text-secondary-500">
          Export {exportType.split("_").join(" ")} data to an Excel file for backup or external analysis.
        </p>
      </div>

      <div className="grid gap-2">
        <Button
          onClick={onDownload}
          disabled={isDownloading}
          className="w-full"
        >
          {isDownloading ? (
            "Downloading..."
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export to Excel
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
