"use client";

import imageCompression from "browser-image-compression";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 2,
  maxWidthOrHeight: 800,
  useWebWorker: true,
  fileType: "image/webp" as const,
};

/**
 * Compresses and resizes an image file on the client before uploading.
 * Outputs WebP at ≤800px and ≤2MB.
 */
export async function compressImage(file: File): Promise<File> {
  return imageCompression(file, COMPRESSION_OPTIONS);
}
