import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileSpreadsheet } from "lucide-react";

type FileUploadProps = {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  importType: string;
  setImportType: (type: string) => void;
};

export function FileUpload({
  onUpload,
  isUploading,
  importType,
  setImportType,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleImportTypeChange = (value: string) => {
    setImportType(value);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    await onUpload(selectedFile);
    setSelectedFile(null);
    // Reset file input
    const fileInput = document.getElementById("file-upload") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="import-type">Data Type</Label>
        <Select value={importType} onValueChange={handleImportTypeChange}>
          <SelectTrigger id="import-type">
            <SelectValue placeholder="Select data type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="production_units">Production Units</SelectItem>
            <SelectItem value="expenses">Expenses</SelectItem>
            <SelectItem value="revenues">Revenues</SelectItem>
            <SelectItem value="inventory">Inventory</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="file-upload">Excel File</Label>
        <Input
          id="file-upload"
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <p className="text-sm text-secondary-500">
          Select an Excel file to import {importType.split("_").join(" ")} data.
        </p>
      </div>

      <div className="grid gap-2">
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="w-full"
        >
          {isUploading ? (
            "Uploading..."
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload and Import
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
