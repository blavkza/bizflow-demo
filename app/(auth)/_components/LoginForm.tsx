import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Building2, ArrowRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);
  return (
    <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-md space-y-8">
        {/* Mobile logo */}
        <div className="lg:hidden flex flex-col items-center text-center mb-8">
          <div className="flex items-center gap-2 text-primary mb-2">
            <div className="p-2 bg-primary rounded-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold">BizFlow</h1>
          </div>
          <p className="text-sm text-muted-foreground dark:text-zinc-400">
            Modern Business management system
          </p>
        </div>

        {isSignedIn ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <div className="relative">
              <div className="h-12 w-12 rounded-full bg-primary/20 animate-ping absolute inset-0"></div>
              <div className="h-12 w-12 rounded-full bg-primary/10 absolute inset-0"></div>
              <Loader2 className="h-12 w-12 animate-spin text-primary relative z-10" />
            </div>
            <p className="text-muted-foreground dark:text-zinc-400">
              Redirecting to dashboard...
            </p>
          </div>
        ) : (
          <Card className="border-none shadow-xl dark:bg-zinc-900/80 backdrop-blur-sm dark:border-zinc-700/50 rounded-2xl">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl text-center dark:text-white">
                Welcome back
              </CardTitle>
              <CardDescription className="text-center dark:text-zinc-400">
                Sign in to continue to your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <SignIn.Root>
                <SignIn.Step name="start" className="space-y-5">
                  <Clerk.GlobalError className="block text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20" />

                  <div className="space-y-2.5">
                    <Clerk.Field name="identifier" className="space-y-2">
                      <Label className="dark:text-zinc-300 text-sm font-medium">
                        Username
                      </Label>
                      <Clerk.Input
                        type="text"
                        required
                        className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800/30"
                        placeholder="Enter your username"
                      />
                      <Clerk.FieldError className="text-xs text-destructive" />
                    </Clerk.Field>
                  </div>

                  <div className="space-y-2.5">
                    <Clerk.Field name="password" className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="dark:text-zinc-300 text-sm font-medium">
                          Password
                        </Label>
                      </div>
                      <div className="relative">
                        <Clerk.Input asChild>
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800/30"
                            placeholder="Enter your password"
                          />
                        </Clerk.Input>
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <Clerk.FieldError className="text-xs text-destructive" />
                    </Clerk.Field>
                  </div>

                  <SignIn.Action submit className="w-full">
                    <Button className="w-full h-11 rounded-lg bg-primary hover:bg-primary/90  font-medium transition-all duration-200">
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </SignIn.Action>

                  <div className="pt-4 text-center text-sm text-muted-foreground dark:text-zinc-400 border-t border-border dark:border-zinc-700/50">
                    <p>Contact your administrator for account assistance</p>
                  </div>
                </SignIn.Step>
              </SignIn.Root>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground dark:text-zinc-400 mt-6">
          <div className="flex items-center gap-2 text-xs">
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
          <div className="text-xs">
            <span>Manage Your Business Finances</span>
          </div>
        </div>
      </div>
    </div>
  );
}
