/**
 * Lightweight client-side image compression utility using HTML Canvas.
 * Reduces 5MB-15MB smartphone photos to ~200KB-600KB progressive JPEGs
 * before uploading to Supabase Storage, dramatically speeding up submission
 * on mobile connections while preserving crisp visual evidence.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  maxSizeMB?: number;
}

export async function compressImage(
  input: File | Blob | string,
  fileName: string = `photo-${Date.now()}.jpg`,
  options: CompressionOptions = {}
): Promise<File> {
  const { maxWidth = 1600, maxHeight = 1600, quality = 0.78 } = options;

  // If input is File and already smaller than 250KB, skip heavy compression
  if (input instanceof File && input.size < 250 * 1024 && input.type === "image/jpeg") {
    return input;
  }

  return new Promise((resolve) => {
    const img = new Image();
    let objectUrl: string | null = null;

    const cleanup = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };

    img.onload = () => {
      try {
        let { width, height } = img;

        // Maintain aspect ratio while bounding within maxWidth/maxHeight
        if (width > maxWidth || height > maxHeight) {
          if (width / maxWidth > height / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          cleanup();
          resolve(input instanceof File ? input : new File([input], fileName, { type: "image/jpeg" }));
          return;
        }

        // Draw image onto canvas
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            cleanup();
            if (blob) {
              const compressedFile = new File([blob], fileName.replace(/\.[^/.]+$/, ".jpg"), {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(input instanceof File ? input : new File([input], fileName, { type: "image/jpeg" }));
            }
          },
          "image/jpeg",
          quality
        );
      } catch (err) {
        cleanup();
        console.warn("Image compression warning, using original:", err);
        resolve(input instanceof File ? input : new File([input], fileName, { type: "image/jpeg" }));
      }
    };

    img.onerror = () => {
      cleanup();
      resolve(input instanceof File ? input : new File([input], fileName, { type: "image/jpeg" }));
    };

    if (typeof input === "string") {
      img.src = input;
    } else {
      objectUrl = URL.createObjectURL(input);
      img.src = objectUrl;
    }
  });
}
