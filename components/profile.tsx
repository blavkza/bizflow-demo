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

import { useClerk } from "@clerk/nextjs";
import { useState } from "react";
import { User } from "lucide-react";
import Link from "next/link";

export default function Profile() {
  const { signOut } = useClerk();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      console.log("Successfully logged out");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className=" w-full ">
      <div className="">
        <DropdownMenu>
          {" "}
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 ml-0.5 w-full hover:bg-zinc-100 p-1.5 rounded-sm cursor-pointer ">
              <User className="h-4 w-4 text-muted-foreground mr-1.5" />
              <span className="text-sm">Account</span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href="/dashboard/profile">Profile</Link>
            </DropdownMenuItem>
            {/*<DropdownMenuItem>Settings</DropdownMenuItem>*/}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <div onClick={() => setIsDialogOpen(true)}>Logout</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>{" "}
      <div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-center mb-4">Logout</DialogTitle>
            </DialogHeader>
            <p className="text-center mb-4">
              Are you sure you want to log out?
            </p>
            <DialogFooter>
              <Button onClick={() => setIsDialogOpen(false)} variant="outline">
                Cancel
              </Button>
              <Button className="bg-red-500" onClick={handleLogout}>
                Logout
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
