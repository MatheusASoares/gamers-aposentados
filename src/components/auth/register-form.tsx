'use client';

import { useActionState } from 'react';
import { register } from '@/app/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';

export default function RegisterForm() {
    const [errorMessage, formAction, isPending] = useActionState(
        register,
        undefined,
    );

    return (
        <form action={formAction} className="space-y-3">
            <Card className="w-full max-w-sm mx-auto">
                <CardHeader>
                    <CardTitle className="text-2xl">Register</CardTitle>
                    <CardDescription>
                        Create an account to get started.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            type="text"
                            name="username"
                            placeholder="CoolGamer123"
                            required
                            minLength={3}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            placeholder="m@example.com"
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" name="password" required minLength={6} />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button className="w-full" disabled={isPending}>
                        Register
                    </Button>
                    <div className="text-center text-sm">
                        Already have an account?{" "}
                        <a href="/login" className="underline underline-offset-4 hover:text-primary">
                            Log in
                        </a>
                    </div>
                    <div
                        className="flex h-8 items-end space-x-1"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {errorMessage && (
                            <p className="text-sm text-red-500">{errorMessage}</p>
                        )}
                    </div>
                </CardFooter>
            </Card>
        </form>
    );
}
