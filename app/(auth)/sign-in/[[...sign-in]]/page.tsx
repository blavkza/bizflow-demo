"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { GraduationCap, School, Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 to-white dark:from-zinc-800 dark:to-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-sky-100 to-white dark:from-zinc-800 dark:to-zinc-950 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-primary">
            <h1 className="text-3xl font-bold tracking-tight">FinanceFlow</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Modern Work Place management system
          </p>
        </div>

        {isSignedIn ? (
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card className="border-none shadow-lg dark:bg-zinc-900 dark:border-zinc-800">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl text-center dark:text-white">
                Sign in to your account
              </CardTitle>
              <CardDescription className="text-center dark:text-zinc-400">
                Enter your credentials to access the dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignIn.Root>
                <SignIn.Step name="start" className="space-y-4">
                  <Clerk.GlobalError className="text-sm text-destructive" />

                  <div className="space-y-2">
                    <Clerk.Field name="identifier" className="space-y-1.5">
                      <Label className="dark:text-zinc-300">Username</Label>
                      <Clerk.Input
                        type="text"
                        required
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800/50"
                      />
                      <Clerk.FieldError className="text-xs text-destructive" />
                    </Clerk.Field>
                  </div>

                  <div className="space-y-2">
                    <Clerk.Field name="password" className="space-y-1.5">
                      <Label className="dark:text-zinc-300">Password</Label>
                      <Clerk.Input
                        type="password"
                        required
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800/50"
                      />
                      <Clerk.FieldError className="text-xs text-destructive" />
                    </Clerk.Field>
                  </div>

                  <SignIn.Action submit className="w-full">
                    <Button variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </SignIn.Action>

                  <div className="mt-4 text-center text-sm text-muted-foreground dark:text-zinc-400">
                    <p>
                      Contact your administrator if you need account assistance
                    </p>
                  </div>
                </SignIn.Step>
              </SignIn.Root>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col items-center justify-center gap-1 text-sm text-muted-foreground dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <span>Manage Your Business Finances</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span>Powered by</span>
            <Link
              href="https://rethynk.co.za"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold hover:text-primary transition-colors"
            >
              Rethynk Web Studio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
