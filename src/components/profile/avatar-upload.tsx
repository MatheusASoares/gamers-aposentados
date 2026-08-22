"use client";

import { useRef, useState, useTransition, useEffect } from "react";

import { Camera } from "lucide-react";
import { updateProfileImage } from "@/app/lib/user-actions";
import { useSession } from "next-auth/react";

import { UserAvatar } from "@/components/ui/user-avatar";

interface AvatarUploadProps {
    currentImage: string | null;
    name: string | null;
    isOwner: boolean;
    frameUrl?: string | null;
    cssFrameClass?: string | null;
    size?: "sm" | "md" | "lg" | "xl" | "2xl";
    className?: string;
}

export function AvatarUpload({
    currentImage,
    name,
    isOwner,
    frameUrl,
    cssFrameClass,
    size = "2xl",
    className
}: AvatarUploadProps) {
    const { update } = useSession();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const previewRef = useRef<string | null>(null);

    useEffect(() => {
        previewRef.current = preview;
    }, [preview]);

    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const revokeBlobUrl = (url: string | null) => {
        if (url?.startsWith("blob:")) {
            URL.revokeObjectURL(url);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            revokeBlobUrl(previewRef.current);
        };
    }, []);

    const src = preview || currentImage || "";

    const handleClick = () => {
        if (isOwner) fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            setError("Apenas imagens são permitidas.");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setError("Tamanho máximo: 2 MB.");
            return;
        }

        setError(null);
        const newPreview = URL.createObjectURL(file);
        setPreview((prev) => {
            revokeBlobUrl(prev);
            return newPreview;
        });

        startTransition(async () => {
            const formData = new FormData();
            formData.append("file", file);

            try {
                const res = await fetch("/api/upload", { method: "POST", body: formData });
                const data = await res.json();

                if (!res.ok) {
                    setError(data.error || "Falha no upload.");
                    setPreview((prev) => {
                        revokeBlobUrl(prev);
                        return null;
                    });
                    return;
                }

                const result = await updateProfileImage(data.url);
                if (!result.success) {
                    setError(result.error || "Falha ao salvar.");
                    setPreview((prev) => {
                        revokeBlobUrl(prev);
                        return null;
                    });
                    return;
                }

                await update({ image: data.url });
                setPreview((prev) => {
                    revokeBlobUrl(prev);
                    return null;
                });
            } catch {
                setError("Erro inesperado no upload.");
                setPreview((prev) => {
                    revokeBlobUrl(prev);
                    return null;
                });
            }
        });
    };

    return (
        <div className="relative inline-flex items-center justify-center">
            <button
                type="button"
                onClick={handleClick}
                disabled={!isOwner || isPending}
                className={`group relative no-theme border-0 bg-transparent p-0 m-0 shadow-none outline-none focus:outline-none overflow-visible rounded-full ${isOwner ? "cursor-pointer" : "cursor-default"}`}
                aria-label={isOwner ? "Alterar foto de perfil" : undefined}
            >
                <div className={`transition-opacity ${isPending ? "opacity-50" : isOwner ? "group-hover:opacity-80" : ""}`}>
                    <UserAvatar
                        src={src}
                        name={name}
                        frameUrl={frameUrl}
                        cssFrameClass={cssFrameClass}
                        size={size}
                        className={className}
                    />
                </div>

                {isOwner && !isPending && (
                    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="rounded-full bg-black/60 p-3 shadow-lg">
                            <Camera className="h-6 w-6 text-white" />
                        </div>
                    </div>
                )}
            </button>

            <input
                ref={fileInputRef}
                type="file"
                aria-label="Upload de foto de perfil"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />

            {error && (
                <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap text-red-400">
                    {error}
                </p>
            )}
        </div>
    );
}
