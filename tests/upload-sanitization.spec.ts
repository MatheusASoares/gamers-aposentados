import { test, expect } from "@playwright/test";
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import {
    ALLOWED_UPLOAD_FOLDERS,
    isValidUploadFolder,
    ALLOWED_IMAGE_EXTENSIONS,
    sanitizeFileExtension,
    validateImageMagicBytes,
} from "../src/lib/file-validation";

test.describe("Security: Upload Folder Sanitization & Validation (Audit 2.4 / CWE-22)", () => {
    test("isValidUploadFolder only permits explicitly allowed folders", () => {
        // Allowed folders
        expect(ALLOWED_UPLOAD_FOLDERS).toContain("avatars");
        expect(ALLOWED_UPLOAD_FOLDERS).toContain("screenshots");
        expect(ALLOWED_UPLOAD_FOLDERS).toContain("covers");

        expect(isValidUploadFolder("avatars")).toBe(true);
        expect(isValidUploadFolder("screenshots")).toBe(true);
        expect(isValidUploadFolder("covers")).toBe(true);

        // Path traversal attempts
        expect(isValidUploadFolder("../malicious")).toBe(false);
        expect(isValidUploadFolder("../../etc")).toBe(false);
        expect(isValidUploadFolder("..%2F..%2Fetc")).toBe(false);
        expect(isValidUploadFolder("/avatars")).toBe(false);

        // Unauthorized / Arbitrary folders
        expect(isValidUploadFolder("admin")).toBe(false);
        expect(isValidUploadFolder("backups")).toBe(false);
        expect(isValidUploadFolder("temp")).toBe(false);
        expect(isValidUploadFolder("system")).toBe(false);

        // Edge cases
        expect(isValidUploadFolder("")).toBe(false);
        expect(isValidUploadFolder("   ")).toBe(false);
        expect(isValidUploadFolder(null)).toBe(false);
        expect(isValidUploadFolder(undefined)).toBe(false);
        expect(isValidUploadFolder(12345)).toBe(false);
        expect(isValidUploadFolder({})).toBe(false);
    });

    test("sanitizeFileExtension strips dangerous extensions and normalizes safe formats", () => {
        // Whitelisted formats
        expect(ALLOWED_IMAGE_EXTENSIONS).toContain("png");
        expect(ALLOWED_IMAGE_EXTENSIONS).toContain("jpg");
        expect(ALLOWED_IMAGE_EXTENSIONS).toContain("jpeg");
        expect(ALLOWED_IMAGE_EXTENSIONS).toContain("gif");
        expect(ALLOWED_IMAGE_EXTENSIONS).toContain("webp");

        expect(sanitizeFileExtension("avatar.png")).toBe("png");
        expect(sanitizeFileExtension("screenshot.jpg")).toBe("jpg");
        expect(sanitizeFileExtension("cover.jpeg")).toBe("jpeg");
        expect(sanitizeFileExtension("animated.gif")).toBe("gif");
        expect(sanitizeFileExtension("image.webp")).toBe("webp");

        // Case insensitivity
        expect(sanitizeFileExtension("PHOTO.PNG")).toBe("png");
        expect(sanitizeFileExtension("IMAGE.WEBP")).toBe("webp");

        // Dangerous / Executable extensions fallback to webp
        expect(sanitizeFileExtension("payload.exe")).toBe("webp");
        expect(sanitizeFileExtension("script.php")).toBe("webp");
        expect(sanitizeFileExtension("shell.sh")).toBe("webp");
        expect(sanitizeFileExtension("exploit.js")).toBe("webp");
        expect(sanitizeFileExtension("archive.tar.gz")).toBe("webp");
        expect(sanitizeFileExtension("no_extension")).toBe("webp");
    });

    test("validateImageMagicBytes verifies legitimate signatures and blocks malicious payloads", async () => {
        // Valid PNG header: 89 50 4E 47 0D 0A 1A 0A
        const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
        const pngFile = new File([pngBytes], "valid.png", { type: "image/png" });
        expect(await validateImageMagicBytes(pngFile)).toBe(true);

        // Valid JPEG header: FF D8 FF
        const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
        const jpegFile = new File([jpegBytes], "valid.jpg", { type: "image/jpeg" });
        expect(await validateImageMagicBytes(jpegFile)).toBe(true);

        // Valid GIF89a header: 47 49 46 38 39 61
        const gifBytes = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00]);
        const gifFile = new File([gifBytes], "valid.gif", { type: "image/gif" });
        expect(await validateImageMagicBytes(gifFile)).toBe(true);

        // Valid WEBP header: RIFF (bytes 0-3) + WEBP (bytes 8-11)
        const webpBytes = new Uint8Array([
            0x52, 0x49, 0x46, 0x46, // RIFF
            0x00, 0x00, 0x00, 0x00, // Size
            0x57, 0x45, 0x42, 0x50, // WEBP
        ]);
        const webpFile = new File([webpBytes], "valid.webp", { type: "image/webp" });
        expect(await validateImageMagicBytes(webpFile)).toBe(true);

        // Fake image / Malicious text script disguised as image
        const fakeBytes = new TextEncoder().encode("<?php phpinfo(); ?> <script>alert(1)</script>");
        const fakeFile = new File([fakeBytes], "fake.png", { type: "image/png" });
        expect(await validateImageMagicBytes(fakeFile)).toBe(false);
    });

    test("unauthenticated upload request to /api/upload returns 401 Unauthorized", async ({ request }) => {
        const response = await request.post("/api/upload", {
            data: {},
        });
        expect(response.status()).toBe(401);
        const data = await response.json();
        expect(data.error).toBe("Unauthorized");
    });

    test("authenticated session rejects invalid upload folders with 400 Bad Request", async ({ page }) => {
        const timestamp = Date.now();
        const testEmail = `upload_test_${timestamp}@test.com`;
        const testPassword = "testPassword123";

        // Create test user in DB
        const hashedPassword = await bcrypt.hash(testPassword, 10);
        const user = await prisma.user.create({
            data: {
                username: `upload_usr_${timestamp}`,
                email: testEmail,
                password: hashedPassword,
            },
        });

        try {
            // Log in
            await page.goto("/login", { waitUntil: "load" });
            await page.getByLabel("Email").fill(testEmail);
            await page.getByLabel("Password").fill(testPassword);
            await page.getByRole("button", { name: "Log in" }).click();
            await expect(page.locator("body")).toContainText("Quest", { timeout: 15000 });

            // Execute upload API calls within authenticated browser session context
            const resultInvalidFolder = await page.evaluate(async () => {
                const formData = new FormData();
                // 12 bytes valid PNG
                const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
                const blob = new Blob([pngBytes], { type: "image/png" });
                formData.append("file", blob, "test.png");
                formData.append("folder", "../../../malicious_dir");

                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });
                const body = await res.json();
                return { status: res.status, body };
            });

            expect(resultInvalidFolder.status).toBe(400);
            expect(resultInvalidFolder.body.error).toContain("Pasta de upload inválida");

            // Test another unauthorized folder name
            const resultUnauthorizedFolder = await page.evaluate(async () => {
                const formData = new FormData();
                const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
                const blob = new Blob([pngBytes], { type: "image/png" });
                formData.append("file", blob, "test.png");
                formData.append("folder", "secrets");

                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });
                const body = await res.json();
                return { status: res.status, body };
            });

            expect(resultUnauthorizedFolder.status).toBe(400);
            expect(resultUnauthorizedFolder.body.error).toContain("Pasta de upload inválida");
        } finally {
            await prisma.user.delete({ where: { id: user.id } });
        }
    });
});
