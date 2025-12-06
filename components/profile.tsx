import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useState } from "react";
import { User, Loader2 } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getInitials } from "@/lib/formatters";

async function fetchUserData(userId: string) {
  const response = await fetch(`/api/users/userId/${userId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }
  return response.json();
}

export default function Profile() {
  const { signOut } = useClerk();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { userId } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUserData(userId!),
    enabled: !!userId,
    refetchInterval: 30000,
  });

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      console.log("Successfully logged out");
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="w-full">
      <div className="py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer bg-sky-400/50 dark:bg-blue-700/50 p-2 rounded-xl hover:opacity-80">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={data?.avatar || "/placeholder-user.jpg"}
                  alt={data?.name || "User"}
                />
                <AvatarFallback>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    getInitials(data?.name || "User")
                  )}
                </AvatarFallback>
              </Avatar>

              {/* TEXT CONTAINER WITH PROPER TRUNCATION */}
              <div className="flex flex-col items-start text-black dark:text-white max-w-[140px] overflow-hidden">
                <div className="text-sm whitespace-nowrap overflow-hidden text-ellipsis w-full">
                  {isLoading ? "Loading..." : data?.name || "User"}
                </div>

                <div className="text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis w-full">
                  {isLoading ? "Loading..." : data?.email || ""}
                </div>
              </div>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile" className="w-full">
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setIsDialogOpen(true)}
              className="cursor-pointer"
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center mb-4">Logout</DialogTitle>
          </DialogHeader>
          <p className="text-center mb-4">Are you sure you want to log out?</p>
          <DialogFooter className="flex justify-center gap-2">
            <Button
              onClick={() => setIsDialogOpen(false)}
              variant="outline"
              disabled={isLoggingOut}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging out...
                </>
              ) : (
                "Logout"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
