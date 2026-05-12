import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  type UploadTask,
} from "firebase/storage";
import { storage } from "./config";

export type UploadProgressCallback = (progress: number) => void;

export async function uploadFile(
  path: string,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<string> {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const uploadTask: UploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(Math.round(progress));
      },
      (error) => {
        const message = getStorageErrorMessage(error.code);
        reject(new Error(message));
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
}

export async function deleteFile(path: string): Promise<void> {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}

export async function getFileUrl(path: string): Promise<string> {
  const storageRef = ref(storage, path);
  return getDownloadURL(storageRef);
}

function getStorageErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    "storage/unauthorized": "You don't have permission to upload this file.",
    "storage/canceled": "Upload was cancelled.",
    "storage/unknown": "An error occurred during upload.",
    "storage/quota-exceeded": "Storage quota exceeded. Contact your administrator.",
    "storage/invalid-format": "Invalid file format.",
    "storage/object-not-found": "File not found.",
  };
  return messages[code] ?? "Upload failed. Please try again.";
}

export function getStoragePath(type: "faculty" | "department" | "report", id: string, fileName: string): string {
  return `${type}/${id}/${Date.now()}_${fileName}`;
}

export const MAX_FILE_SIZES = {
  image: 5 * 1024 * 1024,   // 5MB
  document: 10 * 1024 * 1024, // 10MB
};

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function validateFile(
  file: File,
  type: "image" | "document"
): { valid: boolean; error?: string } {
  const allowedTypes = type === "image" ? ALLOWED_IMAGE_TYPES : ALLOWED_DOCUMENT_TYPES;
  const maxSize = MAX_FILE_SIZES[type];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Accepted: ${type === "image" ? "JPG, PNG, WebP" : "PDF, DOC, DOCX"}`,
    };
  }
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${type === "image" ? "5MB" : "10MB"} limit.`,
    };
  }
  return { valid: true };
}
