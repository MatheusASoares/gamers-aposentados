"use client";

import { useState, useTransition } from "react";
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
import { updateProfile, changePassword } from "@/app/lib/user-actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Save, Lock } from "lucide-react";
import { useSession } from "next-auth/react";

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

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProfileMessage(null);
        startTransition(async () => {
            const result = await updateProfile({ name, username });
            if (result.success) {
                await update({ name, username });
                setProfileMessage(
                    "Profile updated successfully! Allow a moment for changes to reflect.",
                );
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
