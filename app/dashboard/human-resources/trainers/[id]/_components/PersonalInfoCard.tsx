"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "axios";
import { TrainerWithDetails } from "../type";

const personalInfoSchema = z.object({
  idNumber: z.string().optional(),
  taxNumber: z.string().optional(),
  nationality: z.string().optional(),
  maritalStatus: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  branchCode: z.string().optional(),
  accountType: z.string().optional(),
});

type PersonalInfoSchemaType = z.infer<typeof personalInfoSchema>;

interface PersonalInfoCardProps {
  trainer: TrainerWithDetails;
  hasFullAccess: boolean;
  canEditTrainers: boolean;
  fetchTrainer: () => void;
}

export function PersonalInfoCard({
  trainer,
  hasFullAccess,
  canEditTrainers,
  fetchTrainer,
}: PersonalInfoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PersonalInfoSchemaType>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      idNumber: trainer.idNumber || "",
      taxNumber: trainer.taxNumber || "",
      nationality: trainer.nationality || "",
      maritalStatus: trainer.maritalStatus || "",
      bankName: trainer.bankName || "",
      accountNumber: trainer.accountNumber || "",
      branchCode: trainer.branchCode || "",
      accountType: trainer.accountType || "",
    },
  });

  const onSubmit = async (values: PersonalInfoSchemaType) => {
    setIsLoading(true);
    try {
      await axios.put(`/api/trainers/${trainer.id}/personal-info`, values);
      toast.success("Personal information updated successfully");
      fetchTrainer();
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update personal information");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Personal Information</CardTitle>

        {(hasFullAccess || canEditTrainers) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            type="button"
            disabled={isLoading}
          >
            <Pencil className="mr-2 h-4 w-4" />
            {isEditing ? "Cancel" : "Edit"}
          </Button>
        )}
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {isEditing ? (
            <>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="idNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Number/Passport</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="taxNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Number</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nationality</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maritalStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marital Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SINGLE">Single</SelectItem>
                            <SelectItem value="MARRIED">Married</SelectItem>
                            <SelectItem value="DIVORCED">Divorced</SelectItem>
                            <SelectItem value="WIDOWED">Widowed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>

              <CardHeader>
                <CardTitle>Banking Information</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="branchCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Branch Code</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accountType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Type</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    type="button"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">ID Number/Passport</p>
                    <p className="text-sm text-muted-foreground">
                      {trainer.idNumber || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Tax Number</p>
                    <p className="text-sm text-muted-foreground">
                      {trainer.taxNumber || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Nationality</p>
                    <p className="text-sm text-muted-foreground">
                      {trainer.nationality || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Marital Status</p>
                    <p className="text-sm text-muted-foreground">
                      {trainer.maritalStatus || "Not specified"}
                    </p>
                  </div>
                </div>
              </CardContent>

              <CardHeader>
                <CardTitle>Banking Information</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">Bank Name</p>
                    <p className="text-sm text-muted-foreground">
                      {trainer.bankName || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Account Number</p>
                    <p className="text-sm text-muted-foreground">
                      {trainer.accountNumber || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Branch Code</p>
                    <p className="text-sm text-muted-foreground">
                      {trainer.branchCode || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Account Type</p>
                    <p className="text-sm text-muted-foreground">
                      {trainer.accountType || "Not specified"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </>
          )}
        </form>
      </Form>
    </Card>
  );
}
