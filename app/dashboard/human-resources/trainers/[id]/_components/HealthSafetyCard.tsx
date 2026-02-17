"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Pencil, Shield, AlertTriangle, Heart } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "axios";
import { TrainerWithDetails } from "../../type";

const healthSafetySchema = z.object({
  medicalCondition: z.string().optional().or(z.literal("")),
  allergies: z.string().optional().or(z.literal("")),
  restrictions: z.string().optional().or(z.literal("")),
  firstAidNeeds: z.string().optional().or(z.literal("")),
  riskLevel: z.string().optional().or(z.literal("")),
  additionalInfo: z.string().optional().or(z.literal("")),
  emergencyContacts: z.string().optional().or(z.literal("")),
});

type HealthSafetySchemaType = z.infer<typeof healthSafetySchema>;

interface HealthSafetyCardProps {
  trainer: TrainerWithDetails;
  hasFullAccess: boolean;
  canEditTrainers: boolean;
  fetchTrainer: () => void;
}

export function HealthSafetyCard({
  trainer,
  hasFullAccess,
  canEditTrainers,
  fetchTrainer,
}: HealthSafetyCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Safe parsing function that handles all possible input types
  const parseEmergencyContacts = (contacts: any): string => {
    if (!contacts) return "";

    try {
      if (typeof contacts === "string") {
        // If it's already a string, try to parse it as JSON
        try {
          const parsed = JSON.parse(contacts);
          return Array.isArray(parsed) ? parsed.join(", ") : String(contacts);
        } catch {
          // If parsing fails, return the string as is
          return contacts;
        }
      } else if (Array.isArray(contacts)) {
        // If it's already an array, join it
        return contacts.join(", ");
      } else if (typeof contacts === "object" && contacts !== null) {
        // If it's an object, stringify it
        return JSON.stringify(contacts);
      } else {
        // For any other type, convert to string
        return String(contacts);
      }
    } catch {
      return String(contacts || "");
    }
  };

  // Safe value getter that converts String objects to primitive strings
  const getSafeStringValue = (value: any): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (value instanceof String) return value.toString();
    return String(value);
  };

  const form = useForm<HealthSafetySchemaType>({
    resolver: zodResolver(healthSafetySchema),
    defaultValues: {
      medicalCondition: getSafeStringValue(trainer.medicalCondition),
      allergies: getSafeStringValue(trainer.allergies),
      restrictions: getSafeStringValue(trainer.restrictions),
      firstAidNeeds: getSafeStringValue(trainer.firstAidNeeds),
      riskLevel: getSafeStringValue(trainer.riskLevel),
      additionalInfo: getSafeStringValue(trainer.additionalInfo),
      emergencyContacts: parseEmergencyContacts(trainer.emergencyContacts),
    },
  });

  const onSubmit = async (values: HealthSafetySchemaType) => {
    setIsLoading(true);
    try {
      // Convert emergency contacts to JSON array
      const formattedData = {
        ...values,
        emergencyContacts: values.emergencyContacts?.trim()
          ? JSON.stringify(
              values.emergencyContacts
                .split(",")
                .map((contact) => contact.trim())
                .filter((contact) => contact.length > 0),
            )
          : null,
      };

      await axios.put(
        `/api/trainers/${trainer.id}/health-safety`,
        formattedData,
      );
      toast.success("Health & Safety information updated successfully");
      fetchTrainer();
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update health & safety information");
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskLevelColor = (riskLevel: string | null) => {
    if (!riskLevel) return "bg-gray-100 text-gray-800";

    switch (riskLevel) {
      case "LOW":
        return "bg-green-100 text-green-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "HIGH":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRiskLevelDisplay = (riskLevel: string | null) => {
    if (!riskLevel) return "Not Assessed";

    switch (riskLevel) {
      case "LOW":
        return "Low Risk";
      case "MEDIUM":
        return "Medium Risk";
      case "HIGH":
        return "High Risk";
      default:
        return "Not Assessed";
    }
  };

  // Safe display value function
  const getDisplayValue = (value: any): string => {
    if (!value) return "None specified";
    return getSafeStringValue(value);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle>Health & Safety Information</CardTitle>
        </div>
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
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="medicalCondition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medical Conditions</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any known medical conditions"
                          {...field}
                          disabled={isLoading}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allergies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allergies</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any known allergies"
                          {...field}
                          disabled={isLoading}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="restrictions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Restrictions & Limitations</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Work restrictions or physical limitations"
                          {...field}
                          disabled={isLoading}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="firstAidNeeds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Aid Needs</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Specific first aid requirements"
                          {...field}
                          disabled={isLoading}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="riskLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Risk Level</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select risk level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="LOW">Low Risk</SelectItem>
                          <SelectItem value="MEDIUM">Medium Risk</SelectItem>
                          <SelectItem value="HIGH">High Risk</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergencyContacts"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Emergency Contacts</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter emergency contacts (separate with commas)"
                          {...field}
                          disabled={isLoading}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="additionalInfo"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Additional Information</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional health or safety information"
                          {...field}
                          disabled={isLoading}
                          value={field.value || ""}
                        />
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
          ) : (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium flex items-center gap-2">
                    Medical Conditions
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getDisplayValue(trainer.medicalCondition)}
                  </p>
                </div>

                <div>
                  <p className="font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Allergies
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getDisplayValue(trainer.allergies)}
                  </p>
                </div>

                <div>
                  <p className="font-medium">Restrictions & Limitations</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getDisplayValue(trainer.restrictions)}
                  </p>
                </div>

                <div>
                  <p className="font-medium">First Aid Needs</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getDisplayValue(trainer.firstAidNeeds)}
                  </p>
                </div>

                <div>
                  <p className="font-medium">Risk Level</p>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskLevelColor(trainer.riskLevel!)}`}
                    >
                      {getRiskLevelDisplay(trainer.riskLevel!)}
                    </span>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <p className="font-medium">Emergency Contacts</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {parseEmergencyContacts(trainer.emergencyContacts) ||
                      "No emergency contacts specified"}
                  </p>
                </div>

                {trainer.additionalInfo && (
                  <div className="md:col-span-2">
                    <p className="font-medium">Additional Information</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getDisplayValue(trainer.additionalInfo)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </form>
      </Form>
    </Card>
  );
}
