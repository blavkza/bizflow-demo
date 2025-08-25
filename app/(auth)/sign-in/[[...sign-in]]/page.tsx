"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";
import LeftSideInfor from "../../_components/LeftSideInfor";
import { Loader2 } from "lucide-react";
import LoginForm from "../../_components/LoginForm";

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full bg-primary/20 animate-ping absolute inset-0"></div>
            <div className="h-12 w-12 rounded-full bg-primary/10 absolute inset-0"></div>
            <Image
              src="/logo.png"
              alt="Logo"
              width={80}
              height={80}
              className="object-contain animate-bounce"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900">
      <LeftSideInfor />
      <LoginForm />
    </div>
  );
}
