/**
 * Utilitário para redimensionar e converter imagens para WebP no navegador.
 * Isso reduz significativamente o tamanho de screenshots 4K/FullHD (PNGs de 5MB-10MB caem para ~150KB-250KB),
 * economizando espaço no armazenamento em nuvem (Vercel Blob).
 */
export async function compressImage(
    file: File,
    maxDimension = 1920,
    quality = 0.8
): Promise<File> {
    // Se não for uma imagem suportada, retorna o arquivo original
    if (!file.type.startsWith("image/")) {
        return file;
    }

    return new Promise((resolve) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            if (!e.target?.result) {
                return resolve(file);
            }
            img.src = e.target.result as string;
        };

        reader.onerror = () => resolve(file);

        img.onload = () => {
            try {
                let width = img.width;
                let height = img.height;

                // Redimensionar proporcionalmente se exceder a dimensão máxima
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
                    return resolve(file);
                }

                // Desenhar na resolução otimizada com interpolação de alta qualidade
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            return resolve(file);
                        }

                        // Substituir extensão do arquivo original por .webp
                        const originalName = file.name.replace(/\.[^/.]+$/, "");
                        const newFileName = `${originalName}.webp`;

                        const compressedFile = new File([blob], newFileName, {
                            type: "image/webp",
                            lastModified: Date.now(),
                        });

                        console.log(
                            `[ImageCompressor] ${file.name} (${(file.size / 1024).toFixed(1)}KB) -> ${newFileName} (${(compressedFile.size / 1024).toFixed(1)}KB)`
                        );

                        resolve(compressedFile);
                    },
                    "image/webp",
                    quality
                );
            } catch (err) {
                console.error("[ImageCompressor] Erro ao comprimir imagem:", err);
                resolve(file);
            }
        };

        img.onerror = () => resolve(file);
        reader.readAsDataURL(file);
    });
}
