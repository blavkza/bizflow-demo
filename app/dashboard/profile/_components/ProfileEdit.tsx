// components/ProfileEdit.tsx
"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertCircle } from "lucide-react";

// Validation schema - only password fields for Clerk
const profileSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ProfileFormData = z.infer<typeof profileSchema>;

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
  const { user: clerkUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [needsReauthentication, setNeedsReauthentication] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPasswordValue = watch("newPassword");

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    setMessage(null);
    setNeedsReauthentication(false);

    try {
      if (clerkUser) {
        await clerkUser.updatePassword({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        });
      }

      reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setMessage({ type: "success", text: "Password updated successfully!" });
    } catch (error: any) {
      console.error("Error updating password:", error);

      if (
        error.errors?.[0]?.code === "reauthentication_required" ||
        error.errors?.[0]?.message?.includes("reverification") ||
        error.errors?.[0]?.message?.includes("reauthentication")
      ) {
        setNeedsReauthentication(true);
        setMessage({
          type: "error",
          text: "Security verification required. Please sign in again to continue.",
        });
      } else {
        setMessage({
          type: "error",
          text:
            error.errors?.[0]?.message ||
            "Failed to update password. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReauthenticate = () => {
    // Redirect to sign-in page for reauthentication
    window.location.href =
      "/sign-in?redirect_url=" + encodeURIComponent(window.location.href);
  };

  return (
    <>
      {" "}
      {message && (
        <Alert
          variant={message.type === "success" ? "default" : "destructive"}
          className="mb-4"
        >
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}
      {needsReauthentication && (
        <Alert variant="destructive" className="mb-4">
          <Shield className="h-4 w-4 mr-2" />
          <AlertDescription>
            <p className="mb-2">
              For security reasons, you need to verify your identity before
              changing your password.
            </p>
            <Button variant="outline" size="sm" onClick={handleReauthenticate}>
              Verify Identity
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              {...register("currentPassword")}
              disabled={needsReauthentication}
            />
            {errors.currentPassword && (
              <p className="text-sm text-red-600">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              {...register("newPassword")}
              disabled={needsReauthentication}
            />
            {errors.newPassword && (
              <p className="text-sm text-red-600">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          {newPasswordValue && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register("confirmPassword")}
                disabled={needsReauthentication}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading || needsReauthentication}
          className="w-full"
        >
          {isLoading ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </>
  );
}
