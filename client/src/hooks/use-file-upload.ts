import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type FileUploadOptions = {
  url: string;
  fileFieldName?: string;
  additionalData?: Record<string, string>;
  onSuccess?: (response: any) => void;
  onError?: (error: Error) => void;
};

export function useFileUpload({
  url,
  fileFieldName = "file",
  additionalData = {},
  onSuccess,
  onError,
}: FileUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const uploadFile = async (file: File) => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No file selected.",
      });
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append(fileFieldName, file);

      // Add any additional data to the form
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });

      // Simulate progress since fetch doesn't support progress events natively
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(url, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }

      setProgress(100);
      const data = await response.json();

      if (onSuccess) {
        onSuccess(data);
      }

      toast({
        title: "Success",
        description: `File uploaded successfully. ${data.message || ""}`,
      });

      return data;
    } catch (error) {
      setProgress(0);
      
      if (onError) {
        onError(error);
      }

      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || "An error occurred during upload.",
      });

      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadFile,
    isUploading,
    progress,
  };
}
