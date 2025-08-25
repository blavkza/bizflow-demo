import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";
import { FaRobot } from "react-icons/fa";

export default function LeftSideInfor() {
  const router = useRouter();

  return (
    <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/15">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Logo"
            width={60}
            height={60}
            className="object-contain"
          />{" "}
          <h1 className="text-2xl font-bold text-primary">BizFlow</h1>
        </div>
        <Button variant={"ghost"} onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-1" /> GO BACK
        </Button>
      </div>

      <div className="space-y-6 max-w-md">
        <div className="flex items-center gap-2 text-sm text-primary font-medium py-1 px-3 bg-primary/10 rounded-full w-fit">
          <FaRobot className="h-4 w-4" />
          <span> Now with AI-powered financial insights</span>
        </div>

        <h2 className="text-4xl font-bold tracking-tight dark:text-white">
          Streamline Your Business Operations
        </h2>

        <p className="text-lg text-muted-foreground dark:text-zinc-300">
          Manage finances, Employees, and Projects Management in one powerful
          platform designed for modern businesses.
        </p>

        <div className="flex flex-wrap gap-4 pt-4">
          {[
            "Financial Reports",
            "Projects Management",
            "Analytics Dashboard",
            "AI-Powered Assistant",
            "Role-Based Access Control (RBAC)",
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              <span className="text-sm text-muted-foreground dark:text-zinc-400">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-sm text-muted-foreground dark:text-zinc-400">
        <p>© {new Date().getFullYear()} BizFlow. All rights reserved.</p>
      </div>
    </div>
  );
}
