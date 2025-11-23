// components/ProfileEdit.tsx
"use client";

import { useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Key, Shield } from "lucide-react";

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

type ProfileEditProps = {
  user: User;
};

export function ProfileEdit({ user }: ProfileEditProps) {
  const { openUserProfile } = useClerk();

  const handleOpenProfile = () => {
    openUserProfile();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Password</CardTitle>
        <CardDescription>
          Manage your account security settings and password through Clerk's
          secure interface.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="font-medium text-lg">Secure Password Management</h3>
          <p className="text-sm text-muted-foreground">
            For security reasons, password changes are handled through Clerk's
            verified security system. This ensures your account remains
            protected.
          </p>
        </div>

        <Button onClick={handleOpenProfile} className="w-full" size="lg">
          <Key className="h-4 w-4 mr-2" />
          Open Security Settings
        </Button>

        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>• Change your password securely</p>
          <p>• Update two-factor authentication</p>
          <p>• Manage account security preferences</p>
        </div>
      </CardContent>
    </Card>
  );
}
