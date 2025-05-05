import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function useDownload() {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const downloadFile = async (url: string, filename?: string) => {
    setIsDownloading(true);

    try {
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create an object URL for the blob
      const objectUrl = URL.createObjectURL(blob);

      // Create a temporary link element
      const link = document.createElement("a");
      link.href = objectUrl;

      // Get filename from Content-Disposition or use provided filename
      const contentDisposition = response.headers.get("Content-Disposition");
      const extractedFilename = contentDisposition
        ? contentDisposition.match(/filename="(.+?)"/)
        : null;
      
      link.download = filename || extractedFilename?.[1] || "download";

      // Append the link to the document
      document.body.appendChild(link);

      // Trigger the download
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);

      toast({
        title: "Success",
        description: "File downloaded successfully",
      });

      return true;
    } catch (error) {
      console.error("Download error:", error);
      
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: error.message || "An error occurred during download",
      });
      
      return false;
    } finally {
      setIsDownloading(false);
    }
  };

  return {
    downloadFile,
    isDownloading,
  };
}
