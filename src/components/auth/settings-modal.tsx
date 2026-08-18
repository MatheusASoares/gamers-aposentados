"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile, changePassword, updateProfileImage } from "@/app/lib/user-actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Settings,
    Save,
    Lock,
    Camera,
    User,
    AtSign,
    Shield,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ShieldCheck,
    Trophy,
    Sparkles,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { UserProfile } from "@/types/api";

interface SettingsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: UserProfile | null | undefined;
}

export function SettingsModal({ open, onOpenChange, user }: SettingsModalProps) {
    const { data: session, update } = useSession();
    const [isPending, startTransition] = useTransition();

    // Feedback Messages
    const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Form Controls
    const [name, setName] = useState(user?.name || "");
    const [username, setUsername] = useState(user?.username || "");
    const [currentPassword, setCurrentPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Avatar upload
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);

    const [prevOpen, setPrevOpen] = useState(open);

    if (open !== prevOpen) {
        setPrevOpen(open);
        if (open) {
            setName(user?.name || "");
            setUsername(user?.username || "");
            setCurrentPassword("");
            setShowCurrentPassword(false);
            setNewPassword("");
            setShowPassword(false);
            setPreviewUrl(null);
            setPendingFile(null);
            setProfileMessage(null);
            setPasswordMessage(null);
        }
    }

    const handleAvatarClick = () => fileInputRef.current?.click();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setProfileMessage({ type: "error", text: "Apenas arquivos de imagem são permitidos." });
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setProfileMessage({ type: "error", text: "Tamanho máximo de imagem é 2 MB." });
            return;
        }

        setProfileMessage(null);
        setPendingFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProfileMessage(null);

        startTransition(async () => {
            let uploadedImageUrl: string | null = null;

            // 1. Upload avatar if selected
            if (pendingFile) {
                const formData = new FormData();
                formData.append("file", pendingFile);

                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });
                const data = await res.json();

                if (!res.ok) {
                    setProfileMessage({ type: "error", text: data.error || "Falha ao enviar imagem." });
                    return;
                }

                const imageResult = await updateProfileImage(data.url);
                if (!imageResult.success) {
                    setProfileMessage({ type: "error", text: imageResult.error || "Falha ao salvar imagem de perfil." });
                    return;
                }

                uploadedImageUrl = data.url;
                await update({ image: data.url });
                setPendingFile(null);
            }

            // 2. Save profile fields
            const result = await updateProfile({ name, username });
            if (result.success) {
                await update({ name, username, ...(uploadedImageUrl ? { image: uploadedImageUrl } : {}) });
                setProfileMessage({ type: "success", text: "Perfil atualizado com sucesso!" });
            } else {
                setProfileMessage({ type: "error", text: result.error || "Erro ao salvar perfil." });
            }
        });
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage(null);

        if (!currentPassword) {
            setPasswordMessage({ type: "error", text: "Informe a sua senha atual." });
            return;
        }

        if (newPassword.length < 6) {
            setPasswordMessage({ type: "error", text: "A nova senha precisa ter no mínimo 6 caracteres." });
            return;
        }

        startTransition(async () => {
            try {
                const result = await changePassword({ currentPassword, newPassword });
                if (result?.success) {
                    setPasswordMessage({ type: "success", text: "Senha alterada com sucesso!" });
                    setCurrentPassword("");
                    setNewPassword("");
                } else {
                    setPasswordMessage({ type: "error", text: result?.error || "Ocorreu um erro ao alterar a senha." });
                }
            } catch (err) {
                console.error("[changePassword] Submission error:", err);
                setPasswordMessage({ type: "error", text: "Falha ao processar solicitação de troca de senha." });
            }
        });
    };

    const currentAvatar = previewUrl || session?.user?.image || user?.image || "";
    const equippedFrame = session?.user?.equipped_frame || user?.equipped_frame || null;
    const userTitle = session?.user?.equipped_title || user?.equipped_title || "Gamer Aposentado";
    const userLevel = session?.user?.level ?? user?.level ?? 1;

    // Password strength logic
    const getPasswordStrength = (pwd: string) => {
        if (!pwd) return { label: "", score: 0, color: "bg-zinc-800", text: "" };
        if (pwd.length < 6) return { label: "Senha Fraca", score: 1, color: "bg-rose-500", text: "text-rose-400" };
        const hasNumbers = /[0-9]/.test(pwd);
        const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
        const hasUpper = /[A-Z]/.test(pwd);

        if (pwd.length >= 8 && (hasNumbers || hasSpecial) && hasUpper) {
            return { label: "Excelente & Segura", score: 3, color: "bg-emerald-500", text: "text-emerald-400" };
        }
        return { label: "Força Média", score: 2, color: "bg-amber-500", text: "text-amber-400" };
    };

    const pStrength = getPasswordStrength(newPassword);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-[500px] overflow-hidden border border-[#bd0df2]/30 bg-zinc-950/95 text-white shadow-[0_0_60px_rgba(189,13,242,0.25)] backdrop-blur-2xl p-0 transition-all duration-300"
            >
                {/* Accessible Title & Description for Radix UI */}
                <DialogTitle className="sr-only">Configurações da Conta</DialogTitle>
                <DialogDescription className="sr-only">Gerencie seu perfil de jogador e segurança de acesso.</DialogDescription>

                {/* Neon Top Accent Line */}
                <div className="h-1.5 w-full bg-gradient-to-r from-[#bd0df2] via-cyan-400 to-[#bd0df2]" />

                <div className="p-6 space-y-6">
                    {/* Header */}
                    <div className="space-y-1 text-left">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#bd0df2]/40 bg-[#bd0df2]/15 text-[#bd0df2] shadow-[0_0_20px_rgba(189,13,242,0.35)]">
                                <Settings className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black tracking-tight text-white uppercase flex items-center gap-2">
                                    Configurações
                                </h2>
                                <p className="text-xs font-medium text-zinc-400">
                                    Gerencie seu perfil de jogador e segurança de acesso.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tabs (Apenas Perfil e Segurança) */}
                    <Tabs defaultValue="profile" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 rounded-xl border border-white/10 bg-zinc-900/80 p-1">
                            <TabsTrigger
                                value="profile"
                                className="flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-400 transition-all data-[state=active]:border data-[state=active]:border-[#bd0df2]/50 data-[state=active]:bg-[#bd0df2]/20 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(189,13,242,0.3)]"
                            >
                                <User className="h-4 w-4 text-[#bd0df2]" />
                                <span>Perfil Gamer</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="security"
                                className="flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-400 transition-all data-[state=active]:border data-[state=active]:border-cyan-500/50 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                            >
                                <Shield className="h-4 w-4 text-cyan-400" />
                                <span>Segurança</span>
                            </TabsTrigger>
                        </TabsList>

                        {/* --- TAB 1: PERFIL --- */}
                        <TabsContent value="profile" className="mt-5 space-y-5 focus-visible:outline-none">
                            <form onSubmit={handleProfileSubmit} className="space-y-5">
                                {/* Avatar Card Hub */}
                                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/90 via-zinc-900/40 to-zinc-950 p-4">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="group relative cursor-pointer shrink-0"
                                            onClick={handleAvatarClick}
                                            role="button"
                                            tabIndex={0}
                                            aria-label="Alterar foto de perfil"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") handleAvatarClick();
                                            }}
                                        >
                                            <div className="relative p-1">
                                                <UserAvatar
                                                    src={currentAvatar}
                                                    name={user?.name || "Gamer"}
                                                    frameUrl={equippedFrame}
                                                    size="lg"
                                                    className="h-16 w-16 transition-transform duration-300 group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 backdrop-blur-xs transition-opacity duration-300 group-hover:opacity-100">
                                                    <Camera className="h-5 w-5 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col justify-center gap-1 overflow-hidden">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-black text-white truncate">
                                                    {name || user?.name || "Gamer"}
                                                </span>
                                                <span className="inline-flex items-center gap-1 rounded-md border border-[#bd0df2]/40 bg-[#bd0df2]/15 px-2 py-0.5 text-[10px] font-bold text-[#bd0df2]">
                                                    Nível {userLevel}
                                                </span>
                                            </div>
                                            <p className="text-xs text-zinc-400 truncate flex items-center gap-1">
                                                <Trophy className="h-3 w-3 text-amber-400 inline shrink-0" />
                                                <span className="text-amber-300 font-semibold">{userTitle}</span>
                                            </p>
                                            <button
                                                type="button"
                                                onClick={handleAvatarClick}
                                                className="w-fit text-[11px] font-bold text-[#bd0df2] hover:text-[#d856ff] transition-colors uppercase tracking-wider mt-1"
                                            >
                                                {previewUrl ? "★ Foto Nova Selecionada" : "Alterar Foto de Perfil"}
                                            </button>
                                        </div>
                                    </div>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </div>

                                {/* Form Fields */}
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                                            Nome de Exibição
                                        </Label>
                                        <div className="relative">
                                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                            <Input
                                                id="name"
                                                placeholder="Seu nome ou alias"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="h-11 pl-10 bg-zinc-900/90 border-white/10 text-white placeholder:text-zinc-600 focus:border-[#bd0df2] focus:ring-1 focus:ring-[#bd0df2] rounded-xl text-sm"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                                            Username (@handle)
                                        </Label>
                                        <div className="relative">
                                            <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                            <Input
                                                id="username"
                                                placeholder="seu_username"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                className="h-11 pl-10 bg-zinc-900/90 border-white/10 text-white placeholder:text-zinc-600 focus:border-[#bd0df2] focus:ring-1 focus:ring-[#bd0df2] rounded-xl text-sm"
                                                required
                                            />
                                        </div>
                                        <p className="text-[11px] text-zinc-500 pl-1">
                                            Utilizado no seu link público de perfil e logins.
                                        </p>
                                    </div>
                                </div>

                                {/* Feedback Message */}
                                {profileMessage && (
                                    <div
                                        className={`flex items-center gap-2.5 rounded-xl border p-3 text-xs font-semibold animate-in fade-in slide-in-from-top-1 ${
                                            profileMessage.type === "success"
                                                ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-400"
                                                : "border-rose-500/30 bg-rose-950/40 text-rose-400"
                                        }`}
                                    >
                                        {profileMessage.type === "success" ? (
                                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                                        ) : (
                                            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                                        )}
                                        <span>{profileMessage.text}</span>
                                    </div>
                                )}

                                {/* Gamification & Effects Test Hub */}
                                <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="h-4 w-4 text-[#bd0df2] animate-pulse" />
                                            <span className="text-xs font-black uppercase tracking-wider text-zinc-300">
                                                Efeitos & Celebrações
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                            Level Up VFX
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-zinc-400">
                                        Experimente a animação épica de Level Up com partículas e efeitos sonoros adaptados ao tema ativo.
                                    </p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            if (typeof window !== "undefined") {
                                                const trigger = (window as unknown as { triggerLevelUpTest?: (level?: number) => void }).triggerLevelUpTest;
                                                if (trigger) {
                                                    trigger(userLevel ? userLevel + 1 : 7);
                                                } else {
                                                    window.dispatchEvent(new CustomEvent("ga:trigger-level-up", { detail: { newLevel: userLevel ? userLevel + 1 : 7 } }));
                                                }
                                            }
                                        }}
                                        className="w-full h-10 border-[#bd0df2]/40 bg-[#bd0df2]/10 hover:bg-[#bd0df2]/20 text-[#bd0df2] hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                                    >
                                        <Sparkles className="h-3.5 w-3.5 mr-2" />
                                        Testar Animação de Level Up
                                    </Button>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isPending}
                                    className="w-full h-11 rounded-xl bg-gradient-to-r from-[#bd0df2] to-purple-600 text-white font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(189,13,242,0.4)] hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Salvando Alterações...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Salvar Perfil
                                        </>
                                    )}
                                </Button>
                            </form>
                        </TabsContent>

                        {/* --- TAB 2: SEGURANÇA --- */}
                        <TabsContent value="security" className="mt-5 space-y-5 focus-visible:outline-none">
                            <form onSubmit={handlePasswordSubmit} className="space-y-5">
                                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/15 p-4 flex items-center gap-3">
                                    <ShieldCheck className="h-6 w-6 text-cyan-400 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Credenciais & Segurança</p>
                                        <p className="text-[11px] text-zinc-400">Altere sua senha de acesso a qualquer momento com segurança.</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="current-password" className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                                        Senha Atual
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                        <Input
                                            id="current-password"
                                            type={showCurrentPassword ? "text" : "password"}
                                            placeholder="Digite sua senha atual"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="h-11 pl-10 pr-10 bg-zinc-900/90 border-white/10 text-white placeholder:text-zinc-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl text-sm"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                                            aria-label={showCurrentPassword ? "Ocultar senha atual" : "Exibir senha atual"}
                                        >
                                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="new-password" className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                                        Nova Senha
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                        <Input
                                            id="new-password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Digite no mínimo 6 caracteres"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="h-11 pl-10 pr-10 bg-zinc-900/90 border-white/10 text-white placeholder:text-zinc-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl text-sm"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                                            aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>

                                    {/* Dynamic Password Strength Indicator */}
                                    {newPassword.length > 0 && (
                                        <div className="space-y-1.5 pt-1">
                                            <div className="flex gap-1.5">
                                                <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${pStrength.score >= 1 ? pStrength.color : "bg-zinc-800"}`} />
                                                <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${pStrength.score >= 2 ? pStrength.color : "bg-zinc-800"}`} />
                                                <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${pStrength.score >= 3 ? pStrength.color : "bg-zinc-800"}`} />
                                            </div>
                                            <p className="text-[11px] font-semibold text-zinc-400 text-right">
                                                Força da Senha: <span className={pStrength.text}>{pStrength.label}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Feedback Message */}
                                {passwordMessage && (
                                    <div
                                        className={`flex items-center gap-2.5 rounded-xl border p-3 text-xs font-semibold animate-in fade-in slide-in-from-top-1 ${
                                            passwordMessage.type === "success"
                                                ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-400"
                                                : "border-rose-500/30 bg-rose-950/40 text-rose-400"
                                        }`}
                                    >
                                        {passwordMessage.type === "success" ? (
                                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                                        ) : (
                                            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                                        )}
                                        <span>{passwordMessage.text}</span>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={isPending}
                                    className="w-full h-11 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Atualizando Senha...
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="mr-2 h-4 w-4" />
                                            Atualizar Senha
                                        </>
                                    )}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}
