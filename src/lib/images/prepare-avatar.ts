export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const MAX_DIMENSION = 512;

async function canvasToJpeg(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });
}

export async function prepareAvatarForUpload(file: File): Promise<File> {
  let bitmap: ImageBitmap;

  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(
      "Could not read that image. Try JPG or PNG from your camera roll.",
    );
  }

  const longestEdge = Math.max(bitmap.width, bitmap.height);
  const scale = longestEdge > MAX_DIMENSION ? MAX_DIMENSION / longestEdge : 1;
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Could not process that image in your browser.");
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = 0.88;
  let blob: Blob | null = null;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    blob = await canvasToJpeg(canvas, quality);
    if (blob && blob.size <= MAX_AVATAR_BYTES) {
      break;
    }
    quality -= 0.1;
  }

  if (!blob) {
    throw new Error("Could not prepare that photo. Try a different image.");
  }

  if (blob.size > MAX_AVATAR_BYTES) {
    throw new Error(
      "That photo is still too large after resizing. Try a different image.",
    );
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "avatar";
  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}
