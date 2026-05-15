"use client";

import { useRef, useState } from "react";
import { Upload, X, FileText, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { validateFile, uploadFile, getStoragePath, type UploadProgressCallback } from "@/lib/firebase/storage";

interface FileUploadProps {
  accept?: "image" | "document";
  category: "faculty" | "student";
  moduleId: string;
  userId: string;
  onUploadComplete: (url: string, fileName: string) => void;
  onRemove?: () => void;
  existingFileName?: string;
  existingUrl?: string;
  className?: string;
}

export function FileUpload({
  accept = "document",
  category,
  moduleId,
  userId,
  onUploadComplete,
  onRemove,
  existingFileName,
  existingUrl,
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(existingFileName ?? null);
  const [uploaded, setUploaded] = useState(!!existingUrl);

  const handleFile = async (file: File) => {
    setError(null);
    const validation = validateFile(file, accept);
    if (!validation.valid) {
      setError(validation.error!);
      return;
    }

    setUploading(true);
    setFileName(file.name);
    try {
      const path = getStoragePath(category, moduleId, userId, file.name);
      const onProgress: UploadProgressCallback = (p) => setProgress(p);
      const url = await uploadFile(path, file, onProgress);
      onUploadComplete(url, file.name);
      setUploaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setFileName(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setFileName(null);
    setUploaded(false);
    setProgress(0);
    onRemove?.();
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={cn("w-full", className)}>
      {fileName ? (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-gray-50 dark:bg-gray-800">
          {uploaded ? (
            <CheckCircle className="w-5 h-5 text-success shrink-0" />
          ) : (
            <FileText className="w-5 h-5 text-muted shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">{fileName}</p>
            {uploading && (
              <div className="mt-1">
                <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted mt-0.5">{progress}%</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="p-1 rounded text-muted hover:text-error transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="w-8 h-8 text-muted mx-auto mb-2" />
          <p className="text-sm text-[rgb(var(--text-primary))] font-medium">
            Drop file here or <span className="text-primary">browse</span>
          </p>
          <p className="text-xs text-muted mt-1">
            {accept === "image" ? "JPG, PNG, WebP up to 5MB" : "PDF, DOC, DOCX up to 10MB"}
          </p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept === "image" ? "image/*" : ".pdf,.doc,.docx"}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {error && <p className="field-error mt-1.5">{error}</p>}
    </div>
  );
}
