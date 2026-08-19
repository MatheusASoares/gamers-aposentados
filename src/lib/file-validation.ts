/**
 * Valida se os bytes iniciais de um arquivo correspondem a assinaturas conhecidas de imagens seguras.
 * Suporta: PNG, JPEG/JPG, GIF e WEBP. Não permite SVG por razões de segurança.
 */
export async function validateImageMagicBytes(file: File): Promise<boolean> {
    try {
        const buffer = await file.arrayBuffer();
        const uint8 = new Uint8Array(buffer);

        if (uint8.length < 12) {
            return false;
        }

        // 1. PNG: 89 50 4E 47 0D 0A 1A 0A
        if (
            uint8[0] === 0x89 &&
            uint8[1] === 0x50 &&
            uint8[2] === 0x4E &&
            uint8[3] === 0x47 &&
            uint8[4] === 0x0D &&
            uint8[5] === 0x0A &&
            uint8[6] === 0x1A &&
            uint8[7] === 0x0A
        ) {
            return true;
        }

        // 2. JPEG: FF D8 FF
        if (
            uint8[0] === 0xff &&
            uint8[1] === 0xd8 &&
            uint8[2] === 0xff
        ) {
            return true;
        }

        // 3. GIF: 47 49 46 38 [37 ou 39] 61 ("GIF87a" ou "GIF89a")
        if (
            uint8[0] === 0x47 && // G
            uint8[1] === 0x49 && // I
            uint8[2] === 0x46 && // F
            uint8[3] === 0x38 && // 8
            (uint8[4] === 0x37 || uint8[4] === 0x39) && // 7 ou 9
            uint8[5] === 0x61    // a
        ) {
            return true;
        }

        // 4. WEBP: RIFF (bytes 0-3) e WEBP (bytes 8-11)
        // RIFF: 52 49 46 46
        // WEBP: 57 45 42 50
        if (
            uint8[0] === 0x52 &&
            uint8[1] === 0x49 &&
            uint8[2] === 0x46 &&
            uint8[3] === 0x46 &&
            uint8[8] === 0x57 &&
            uint8[9] === 0x45 &&
            uint8[10] === 0x42 &&
            uint8[11] === 0x50
        ) {
            return true;
        }

        return false;
    } catch {
        return false;
    }
}

/**
 * Pastas permitidas para armazenamento de uploads (Allowlist de segurança)
 */
export const ALLOWED_UPLOAD_FOLDERS = ["avatars", "screenshots", "covers"] as const;
export type AllowedUploadFolder = (typeof ALLOWED_UPLOAD_FOLDERS)[number];

/**
 * Valida se a pasta informada pertence à allowlist de pastas permitidas.
 */
export function isValidUploadFolder(folder: unknown): folder is AllowedUploadFolder {
    return typeof folder === "string" && (ALLOWED_UPLOAD_FOLDERS as readonly string[]).includes(folder);
}

/**
 * Extensões de imagem permitidas no upload.
 */
export const ALLOWED_IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp"] as const;
export type AllowedImageExtension = (typeof ALLOWED_IMAGE_EXTENSIONS)[number];

/**
 * Extrai e sanitiza a extensão do arquivo garantindo apenas extensões válidas e seguras.
 */
export function sanitizeFileExtension(filename: string): string {
    const rawExtension = filename.split(".").pop()?.toLowerCase() || "";
    const cleanExtension = rawExtension.replace(/[^a-z0-9]/g, "");
    if ((ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(cleanExtension)) {
        return cleanExtension;
    }
    return "webp";
}

