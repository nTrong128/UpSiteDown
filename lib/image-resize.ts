/**
 * Maximum file size in bytes (10MB) used as default threshold for resizing.
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Resizes an image to be under the max file size
 * @param file - The original file
 * @param maxSize - Maximum size in bytes (default 4MB)
 * @returns Promise with the resized file or original if already small enough
 */
export async function resizeImageIfNeeded(
  file: File,
  maxSize: number = MAX_FILE_SIZE
): Promise<{ file: File; wasResized: boolean }> {
  // If file is already small enough, return it unchanged
  if (file.size <= maxSize) {
    return { file, wasResized: false };
  }

  // Only process images
  if (!file.type.startsWith('image/')) {
    return { file, wasResized: false };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    // Create object URL for the image
    const objectUrl = URL.createObjectURL(file);

    img.onload = async () => {
      // Clean up object URL
      URL.revokeObjectURL(objectUrl);

      const { width, height } = img;

      // Estimate compression ratio needed
      // Start with a scale factor based on file size ratio
      const targetRatio = Math.sqrt(maxSize / file.size);
      let quality = 0.9;
      let scale = Math.min(1, targetRatio * 1.2); // Start with estimated scale

      // Iteratively reduce quality/size until under maxSize
      let attempt = 0;
      const maxAttempts = 10;
      let resultBlob: Blob | null = null;

      while (attempt < maxAttempts) {
        // Apply scaling
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);

        // Draw the image
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convert to blob with current quality
        resultBlob = await new Promise<Blob | null>((res) => {
          canvas.toBlob(
            (blob) => res(blob),
            'image/jpeg',
            quality
          );
        });

        if (resultBlob && resultBlob.size <= maxSize) {
          break;
        }

        // Reduce quality first, then scale if needed
        if (quality > 0.5) {
          quality -= 0.1;
        } else {
          scale *= 0.8;
          quality = 0.8; // Reset quality when scaling down
        }

        attempt++;
      }

      if (!resultBlob || resultBlob.size > maxSize) {
        // Last resort: aggressive compression
        canvas.width = Math.round(width * 0.5);
        canvas.height = Math.round(height * 0.5);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resultBlob = await new Promise<Blob | null>((res) => {
          canvas.toBlob((blob) => res(blob), 'image/jpeg', 0.5);
        });
      }

      if (!resultBlob) {
        reject(new Error('Failed to resize image'));
        return;
      }

      // Create new file with original name but .jpg extension
      const originalName = file.name;
      const newName = originalName.replace(/\.[^/.]+$/, '.jpg');
      const resizedFile = new File([resultBlob], newName, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      resolve({ file: resizedFile, wasResized: true });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}
