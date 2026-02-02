"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Percent } from "lucide-react";

const financialSettingsSchema = z.object({
  currentPrimeRate: z.coerce.number().min(0).max(100),
});

type FinancialSettingsValues = z.infer<typeof financialSettingsSchema>;

interface FinancialSettingsFormProps {
  canManageSettings: boolean;
  hasFullAccess: boolean;
}

export default function FinancialSettingsForm({
  canManageSettings,
  hasFullAccess,
}: FinancialSettingsFormProps) {
  const queryClient = useQueryClient();
  const canEdit = canManageSettings || hasFullAccess;

  const { data: settings, isLoading } = useQuery({
    queryKey: ["financial-settings"],
    queryFn: async () => {
      const { data } = await axios.get("/api/financial-settings");
      return data;
    },
  });

  const form = useForm<FinancialSettingsValues>({
    resolver: zodResolver(financialSettingsSchema),
    values: {
      currentPrimeRate: settings?.currentPrimeRate || 11.75,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FinancialSettingsValues) => {
      const { data } = await axios.patch("/api/financial-settings", values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-settings"] });
      toast.success("Financial settings updated successfully");
    },
    onError: () => {
      toast.error("Failed to update financial settings");
    },
  });

  const onSubmit = (values: FinancialSettingsValues) => {
    mutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Financial & Loan Settings
        </CardTitle>
        <CardDescription>
          Manage global interest rates and financial parameters for the application.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="currentPrimeRate"
              render={({ field }) => (
                <FormItem className="max-w-md">
                  <FormLabel>Current National Prime Rate (%)</FormLabel>
                   <FormControl>
                    <div className="relative">
                        <Input
                            type="number"
                            step="0.01"
                            disabled={!canEdit || mutation.isPending}
                            placeholder="11.75"
                            {...field}
                            className="pr-12"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                            %
                        </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    This rate is used as the base for all Prime-Linked loans. 
                    Changing this will affect future calculations for existing prime-linked loans.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {canEdit && (
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
