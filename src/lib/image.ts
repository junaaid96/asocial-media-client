import { api } from "./api";

const MAX_BYTES = 4 * 1024 * 1024;

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Resize and re-encode an image in the browser before uploading. This keeps
 * uploads fast on slow connections and strips EXIF metadata such as location.
 */
export async function compressImage(file: File, options: { maxSize: number; square?: boolean }): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file");
  // Keep GIFs as-is so animations survive.
  if (file.type === "image/gif") {
    if (file.size > MAX_BYTES) throw new Error("GIFs must be smaller than 4 MB");
    return file;
  }
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => {
    throw new Error("That image couldn't be read");
  });
  let sx = 0;
  let sy = 0;
  let sw = bitmap.width;
  let sh = bitmap.height;
  if (options.square) {
    const side = Math.min(sw, sh);
    sx = (sw - side) / 2;
    sy = (sh - side) / 2;
    sw = sh = side;
  }
  const scale = Math.min(1, options.maxSize / Math.max(sw, sh));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sw * scale);
  canvas.height = Math.round(sh * scale);
  canvas.getContext("2d")!.drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  let blob = await canvasToBlob(canvas, "image/webp", 0.85);
  // Some browsers can't encode WebP and silently return PNG; prefer JPEG then.
  if (!blob || blob.type !== "image/webp") blob = await canvasToBlob(canvas, "image/jpeg", 0.86);
  if (!blob) throw new Error("That image couldn't be processed");
  if (blob.size > MAX_BYTES) throw new Error("That image is too large even after compressing");
  return blob;
}

export async function uploadImage(file: File, kind: "avatar" | "post") {
  const blob = await compressImage(file, kind === "avatar" ? { maxSize: 512, square: true } : { maxSize: 1800 });
  return api<{ key: string; url: string }>("/uploads", { method: "POST", raw: blob, query: { kind } });
}
