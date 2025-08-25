// components/EmailPhoneEdit.tsx
"use client";

import { useState } from "react";
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

// Validation schema for email and phone
const emailPhoneSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
});

type EmailPhoneFormData = z.infer<typeof emailPhoneSchema>;

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

type EmailPhoneEditProps = {
  user: User;
};

export function EmailPhoneEdit({ user }: EmailPhoneEditProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailPhoneFormData>({
    resolver: zodResolver(emailPhoneSchema),
    defaultValues: {
      email: user.email,
      phone: user.phone || "",
    },
  });

  const onSubmit = async (data: EmailPhoneFormData) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          phone: data.phone,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const updatedUser = await response.json();

      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to update profile. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {message && (
        <div
          className={`mb-4 p-3 rounded-md ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" type="tel" {...register("phone")} />
          {errors.phone && (
            <p className="text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Updating..." : "Update Profile"}
        </Button>
      </form>
    </>
  );
}
