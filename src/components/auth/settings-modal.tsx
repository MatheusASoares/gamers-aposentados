"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile, changePassword, updateProfileImage } from "@/app/lib/user-actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Save, Lock, Camera } from "lucide-react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SettingsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: any;
}

export function SettingsModal({ open, onOpenChange, user }: SettingsModalProps) {
    const { update } = useSession();
    const [isPending, startTransition] = useTransition();
    const [profileMessage, setProfileMessage] = useState<string | null>(null);
    const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

    // Form Controls
    const [name, setName] = useState(user?.name || "");
    const [username, setUsername] = useState(user?.username || "");
    const [newPassword, setNewPassword] = useState("");

    // Avatar upload
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);

    const handleAvatarClick = () => fileInputRef.current?.click();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setProfileMessage("Only image files are allowed.");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setProfileMessage("File too large. Maximum size is 2 MB.");
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
            // 1. Upload image if one was selected
            if (pendingFile) {
                const formData = new FormData();
                formData.append("file", pendingFile);

                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });
                const data = await res.json();

                if (!res.ok) {
                    setProfileMessage(data.error || "Failed to upload image.");
                    return;
                }

                const imageResult = await updateProfileImage(data.url);
                if (!imageResult.success) {
                    setProfileMessage(imageResult.error || "Failed to save image.");
                    return;
                }

                await update({ image: data.url });
                setPendingFile(null);
            }

            // 2. Save name + username
            const result = await updateProfile({ name, username });
            if (result.success) {
                await update({ name, username });
                setProfileMessage("Profile updated successfully!");
            } else {
                setProfileMessage(result.error || "An error occurred.");
            }
        });
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage(null);
        startTransition(async () => {
            const result = await changePassword({ newPassword });
            if (result.success) {
                setPasswordMessage("Password changed successfully!");
                setNewPassword("");
            } else {
                setPasswordMessage(result.error || "An error occurred.");
            }
        });
    };

    const currentAvatar = previewUrl || user?.image || "";
    const initials = user?.name?.charAt(0) || "G";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="text-primary h-5 w-5" />
                        Account Settings
                    </DialogTitle>
                    <DialogDescription>
                        Manage your profile details and security preferences.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="profile" className="mt-4">
                    <TabsList className="mb-4 grid w-full grid-cols-2">
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                        <TabsTrigger value="security">Security</TabsTrigger>
                    </TabsList>

                    {/* Profile Tab */}
                    <TabsContent value="profile" className="space-y-4">
                        <form onSubmit={handleProfileSubmit} className="space-y-4">
                            {/* Avatar Upload */}
                            <div className="flex justify-center">
                                <button
                                    type="button"
                                    onClick={handleAvatarClick}
                                    className="group relative cursor-pointer"
                                    aria-label="Change profile picture"
                                >
                                    <Avatar className="h-20 w-20 border-2 border-zinc-700 transition-opacity group-hover:opacity-70">
                                        <AvatarImage
                                            src={currentAvatar}
                                            alt={user?.name || "User"}
                                            className="object-cover"
                                        />
                                        <AvatarFallback className="bg-zinc-800 text-2xl text-zinc-400">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                                        <div className="flex flex-col items-center gap-1 rounded-full bg-black/60 p-3">
                                            <Camera className="h-5 w-5 text-white" />
                                        </div>
                                    </div>
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>
                            {previewUrl && (
                                <p className="text-center text-xs text-zinc-400">
                                    New photo selected — click Save to apply.
                                </p>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="name">Display Name</Label>
                                <Input
                                    id="name"
                                    placeholder="Your real name or alias"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    placeholder="Unique username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                                <p className="text-muted-foreground text-xs">
                                    This is used for logins and your public url.
                                </p>
                            </div>

                            {profileMessage && (
                                <p
                                    className={`text-sm ${profileMessage.includes("success") ? "text-green-500" : "text-red-500"}`}
                                >
                                    {profileMessage}
                                </p>
                            )}

                            <Button type="submit" disabled={isPending} className="w-full">
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </Button>
                        </form>
                    </TabsContent>

                    {/* Security Tab */}
                    <TabsContent value="security" className="space-y-4">
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    placeholder="Enter at least 6 characters"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                            </div>

                            {passwordMessage && (
                                <p
                                    className={`text-sm ${passwordMessage.includes("success") ? "text-green-500" : "text-red-500"}`}
                                >
                                    {passwordMessage}
                                </p>
                            )}

                            <Button
                                type="submit"
                                disabled={isPending}
                                className="w-full border-none bg-red-600 text-white hover:bg-red-700"
                            >
                                <Lock className="mr-2 h-4 w-4" />
                                Update Password
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
