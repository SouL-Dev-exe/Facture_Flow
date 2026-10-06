/**
 * FactureFlow Client-Side WebP Image Compressor
 * Uses HTML5 <canvas> to scale and compress images to WebP under the 200KB target ceiling.
 */

export interface CompressionOptions {
  maxSizeKB?: number; // default 200 KB
  maxWidth?: number; // default 1200 px
  maxHeight?: number; // default 1200 px
  initialQuality?: number; // default 0.85
}

export interface CompressedImageResult {
  dataUrl: string;
  blob: Blob;
  sizeKB: number;
  width: number;
  height: number;
  originalSizeKB: number;
}

export async function compressImageToWebP(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressedImageResult> {
  const {
    maxSizeKB = 200,
    maxWidth = 1000,
    maxHeight = 1000,
    initialQuality = 0.85,
  } = options;

  const originalSizeKB = file.size / 1024;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio constraint
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to create canvas 2D rendering context'));
          return;
        }

        // Apply smooth rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        let quality = initialQuality;
        let dataUrl = canvas.toDataURL('image/webp', quality);

        // Binary search or iterative compression to keep under maxSizeKB
        let iterations = 0;
        while (dataUrl.length * 0.75 / 1024 > maxSizeKB && quality > 0.3 && iterations < 6) {
          quality -= 0.12;
          dataUrl = canvas.toDataURL('image/webp', quality);
          iterations++;
        }

        // Convert dataUrl to Blob
        const byteString = atob(dataUrl.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: 'image/webp' });
        const sizeKB = blob.size / 1024;

        resolve({
          dataUrl,
          blob,
          sizeKB: Math.round(sizeKB * 10) / 10,
          width,
          height,
          originalSizeKB: Math.round(originalSizeKB * 10) / 10,
        });
      };

      img.onerror = (err) => {
        reject(new Error('Failed to load image file into Image object'));
      };
    };

    reader.onerror = (err) => {
      reject(new Error('Failed to read file with FileReader'));
    };
  });
}
