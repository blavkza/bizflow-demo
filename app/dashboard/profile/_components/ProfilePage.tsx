"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { motion } from "framer-motion";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ProfileCard } from "./ProfileCard";
import { InfoField } from "./InfoField";
import { AvatarUploadDialog } from "@/components/AvatarUploadDialog";

type User = {
  id: string;
  userName: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: Date;
  role: string;
  status: string;
  avatar: string | null;
};

type ProfilePageProps = {
  user: User;
};

// Random circle background data
const circles = [
  { width: 200, height: 200, top: 20, left: 10 },
  { width: 300, height: 300, top: 50, left: 35 },
  { width: 250, height: 250, top: 50, left: 65 },
  { width: 150, height: 150, top: 80, left: 90 },
];

export function ProfilePage({ user }: ProfilePageProps) {
  const [mounted, setMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatar);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "administrator":
        return "bg-blue-500";
      case "teacher":
        return "bg-green-500";
      case "student":
        return "bg-amber-500";
      default:
        return "bg-gray-500";
    }
  };

  if (!mounted) return null;

  return (
    <div className="container mx-auto px-6 py-4">
      <header className="flex mb-4 h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight">User Profile</h1>
            <p className="text-muted-foreground">
              View your account information
            </p>
          </div>
        </div>
      </header>

      <div className="rounded-xl bg-card overflow-hidden shadow-sm bg-zinc-100 dark:bg-zinc-900">
        <div className="relative">
          <div className="absolute inset-0 bg-zinc-300 dark:bg-[#111] rounded-t-xl overflow-hidden">
            <div className="absolute inset-0 opacity-[0.06]">
              {circles.map((circle, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-black dark:bg-white"
                  style={{
                    width: `${circle.width}px`,
                    height: `${circle.height}px`,
                    top: `${circle.top}%`,
                    left: `${circle.left}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="relative z-10 p-8 md:p-12">
            <div className="flex flex-col md:flex-row md:items-center gap-8">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative group"
              >
                <Avatar className="h-28 w-28 border-4 border-background shadow-xl">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} />
                  ) : (
                    <AvatarFallback className="text-2xl">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  )}
                </Avatar>

                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md opacity-90 hover:opacity-100"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <Camera className="h-4 w-4" />
                  <span className="sr-only">Change profile picture</span>
                </Button>
              </motion.div>

              <div className="space-y-2">
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-3xl font-bold"
                >
                  {user.name}
                </motion.h2>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex items-center gap-2"
                >
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${getRoleColor(
                      user.role
                    )}`}
                  />
                  <span className="text-sm font-medium">{user.role}</span>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 md:p-12 pt-0">
          <Separator className="my-8" />
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <ProfileCard
              title="Username"
              value={`@${user.userName}`}
              delay={0.3}
            />
            <ProfileCard title="Full Name" value={user.name} delay={0.4} />
            <ProfileCard title="Email" value={user.email} delay={0.5} />
          </div>

          <div className="mt-12">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Account Information</h3>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm">Active</span>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="grid gap-4 md:grid-cols-4">
              <InfoField
                label="Account Created"
                value={user.createdAt.toLocaleDateString()}
              />
              <InfoField label="Role" value={user.role} />
              <InfoField label="Status" value={user.status} />
              <InfoField label="Phone" value={user.phone || "Not provided"} />
            </div>
          </div>
        </div>
      </div>

      <AvatarUploadDialog
        type="user"
        user={user}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onAvatarUpdate={setAvatarUrl}
      />
    </div>
  );
}
