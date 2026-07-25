"use client";

import { useRef, useState, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";
import { updateProfileImage } from "@/app/lib/user-actions";
import { useSession } from "next-auth/react";

import { UserAvatar } from "@/components/ui/user-avatar";

interface AvatarUploadProps {
    currentImage: string | null;
    name: string | null;
    isOwner: boolean;
    frameUrl?: string | null;
    className?: string;
}

export function AvatarUpload({ currentImage, name, isOwner, frameUrl, className }: AvatarUploadProps) {
    const { update } = useSession();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

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
        setPreview(URL.createObjectURL(file));

        startTransition(async () => {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/upload", { method: "POST", body: formData });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Falha no upload.");
                setPreview(null);
                return;
            }

            const result = await updateProfileImage(data.url);
            if (!result.success) {
                setError(result.error || "Falha ao salvar.");
                setPreview(null);
                return;
            }

            await update({ image: data.url });
        });
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={handleClick}
                disabled={!isOwner || isPending}
                className={`group relative ${isOwner ? "cursor-pointer" : "cursor-default"}`}
                aria-label={isOwner ? "Alterar foto de perfil" : undefined}
            >
                <div className={`transition-opacity ${isPending ? "opacity-50" : isOwner ? "group-hover:opacity-70" : ""}`}>
                    <UserAvatar
                        src={src}
                        name={name}
                        frameUrl={frameUrl}
                        size="xl"
                        className={className}
                    />
                </div>

                {isOwner && !isPending && (
                    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="rounded-full bg-black/60 p-3">
                            <Camera className="h-6 w-6 text-white" />
                        </div>
                    </div>
                )}
            </button>

            <input
                ref={fileInputRef}
                type="file"
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
