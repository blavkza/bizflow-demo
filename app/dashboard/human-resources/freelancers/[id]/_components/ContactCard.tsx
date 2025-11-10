"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Mail,
  Phone,
  MapPin,
  Building,
  AlertCircle,
  Pencil,
} from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "axios";

const contactInfoSchema = z.object({
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  emergencyRelation: z.string().optional(),
  emergencyAddress: z.string().optional(),
});

type ContactInfoSchemaType = z.infer<typeof contactInfoSchema>;

interface FreelancerWithDetails {
  id: string;
  email?: string;
  phone: string;
  address: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  emergencyAddress?: string;
  department?: {
    name: string;
  } | null;
}

interface ContactCardProps {
  freelancer: FreelancerWithDetails;
  hasFullAccess: boolean;
  canEditFreelancers: boolean;
  fetchFreelancer: () => void;
}

export function ContactCard({
  freelancer,
  hasFullAccess,
  canEditFreelancers,
  fetchFreelancer,
}: ContactCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ContactInfoSchemaType>({
    resolver: zodResolver(contactInfoSchema),
    defaultValues: {
      email: freelancer.email || "",
      phone: freelancer.phone || "",
      address: freelancer.address || "",
      city: freelancer.city || "",
      province: freelancer.province || "",
      postalCode: freelancer.postalCode || "",
      country: freelancer.country || "",
      emergencyName: freelancer.emergencyName || "",
      emergencyPhone: freelancer.emergencyPhone || "",
      emergencyRelation: freelancer.emergencyRelation || "",
      emergencyAddress: freelancer.emergencyAddress || "",
    },
  });

  const onSubmit = async (values: ContactInfoSchemaType) => {
    setIsLoading(true);
    try {
      await axios.put(`/api/freelancers/${freelancer.id}/contact-info`, values);
      toast.success("Contact information updated successfully");
      fetchFreelancer();
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update contact information");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Contact Information</CardTitle>
        {(hasFullAccess || canEditFreelancers) && (
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
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="h-4 w-4" /> Email
                        </FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-4 w-4" /> Phone
                        </FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium flex items-center gap-2 mb-4">
                    <MapPin className="h-4 w-4" /> Address Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="province"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Province/State</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium flex items-center gap-2 mb-4">
                    <AlertCircle className="h-4 w-4" /> Emergency Contact
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="emergencyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emergencyPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emergencyRelation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Relationship</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isLoading}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select relationship" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="SPOUSE">Spouse</SelectItem>
                              <SelectItem value="PARENT">Parent</SelectItem>
                              <SelectItem value="CHILD">Child</SelectItem>
                              <SelectItem value="SIBLING">Sibling</SelectItem>
                              <SelectItem value="FRIEND">Friend</SelectItem>
                              <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emergencyAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">
                      {freelancer.email || "Not specified"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">
                      {freelancer.phone || "Not specified"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Department</p>
                    <p className="text-sm text-muted-foreground">
                      {freelancer.department?.name || "Not specified"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Country</p>
                    <p className="text-sm text-muted-foreground">
                      {freelancer.country || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium flex items-center gap-2 mb-4">
                  <MapPin className="h-4 w-4" /> Address
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">Street Address</p>
                    <p className="text-sm text-muted-foreground">
                      {freelancer.address || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">City</p>
                    <p className="text-sm text-muted-foreground">
                      {freelancer.city || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Province/State</p>
                    <p className="text-sm text-muted-foreground">
                      {freelancer.province || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Postal Code</p>
                    <p className="text-sm text-muted-foreground">
                      {freelancer.postalCode || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium flex items-center gap-2 mb-4">
                  <AlertCircle className="h-4 w-4" /> Emergency Contact
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">Name</p>
                    <p className="text-sm text-muted-foreground">
                      {freelancer.emergencyName || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">
                      {freelancer.emergencyPhone || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Relationship</p>
                    <p className="text-sm text-muted-foreground">
                      {freelancer.emergencyRelation || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-sm text-muted-foreground">
                      {freelancer.emergencyAddress || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </form>
      </Form>
    </Card>
  );
}
