import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { validateImageMagicBytes, isValidUploadFolder, sanitizeFileExtension, ALLOWED_UPLOAD_FOLDERS } from "@/lib/file-validation";

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (!file.type.startsWith("image/") || !(await validateImageMagicBytes(file))) {
            return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
        }

        if (file.size > MAX_SIZE_BYTES) {
            return NextResponse.json(
                { error: "File too large. Maximum size is 2 MB." },
                { status: 400 },
            );
        }

        const rawFolder = formData.get("folder");
        if (rawFolder !== null && rawFolder !== undefined && rawFolder !== "") {
            if (!isValidUploadFolder(rawFolder)) {
                return NextResponse.json(
                    { error: `Pasta de upload inválida. Pastas permitidas: ${ALLOWED_UPLOAD_FOLDERS.join(", ")}.` },
                    { status: 400 },
                );
            }
        }

        const folder = (rawFolder as string) || "avatars";
        const extension = sanitizeFileExtension(file.name);
        const filename = `${folder}/${session.user.id}-${Date.now()}.${extension}`;

        const blob = await put(filename, file, {
            access: "public",
            addRandomSuffix: true,
        });

        console.log("[/api/upload] Success, blob URL:", blob.url);
        return NextResponse.json({ url: blob.url });
    } catch (error) {
        console.error("[/api/upload] Error:", error);
        const message = error instanceof Error ? error.message : "Upload failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
