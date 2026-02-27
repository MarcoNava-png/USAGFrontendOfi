export const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"] as const;

export const ALLOWED_EXTENSIONS_STRING = ALLOWED_EXTENSIONS.join(",");

export const MAX_FILE_SIZE_MB = 5;

export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function getExtension(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  if (idx === -1) return "";
  return fileName.slice(idx).toLowerCase();
}

function isImageExtension(ext: string): boolean {
  return [".jpg", ".jpeg", ".png"].includes(ext);
}

function compressImage(file: File, maxDimension = 2000, quality = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No se pudo crear el contexto del canvas"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      const ext = getExtension(file.name);
      const mimeType = ext === ".png" ? "image/png" : "image/jpeg";

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Error al comprimir la imagen"));
            return;
          }
          resolve(new File([blob], file.name, { type: mimeType, lastModified: Date.now() }));
        },
        mimeType,
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen"));
    };

    img.src = url;
  });
}

export async function validateAndPrepareFile(
  file: File,
): Promise<{ file: File; error: null } | { file: null; error: string }> {
  const ext = getExtension(file.name);

  if (!ext || !ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])) {
    return {
      file: null,
      error: `Extension no permitida. Solo se permiten: ${ALLOWED_EXTENSIONS.join(", ")}`,
    };
  }

  let processedFile = file;

  if (isImageExtension(ext)) {
    try {
      processedFile = await compressImage(file);
    } catch {
      return { file: null, error: "Error al procesar la imagen" };
    }
  }

  if (processedFile.size > MAX_FILE_SIZE_BYTES) {
    return {
      file: null,
      error: `El archivo excede el tamano maximo de ${MAX_FILE_SIZE_MB} MB${isImageExtension(ext) ? " (incluso despues de comprimir)" : ""}.`,
    };
  }

  return { file: processedFile, error: null };
}
