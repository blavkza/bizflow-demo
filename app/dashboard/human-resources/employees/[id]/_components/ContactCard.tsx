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
  User,
  AlertCircle,
  Pencil,
} from "lucide-react";
import { EmployeeWithDetails } from "@/types/employee";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "axios";
import { useRouter } from "next/navigation";

const contactInfoSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
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

export function ContactCard({ employee }: { employee: EmployeeWithDetails }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<ContactInfoSchemaType>({
    resolver: zodResolver(contactInfoSchema),
    defaultValues: {
      email: employee.email || "",
      phone: employee.phone || "",
      address: employee.address || "",
      city: employee.city || "",
      province: employee.province || "",
      postalCode: employee.postalCode || "",
      country: employee.country || "",
      emergencyName: employee.emergencyName || "",
      emergencyPhone: employee.emergencyPhone || "",
      emergencyRelation: employee.emergencyRelation || "",
      emergencyAddress: employee.emergencyAddress || "",
    },
  });

  const onSubmit = async (values: ContactInfoSchemaType) => {
    setIsLoading(true);
    try {
      await axios.put(`/api/employees/${employee.id}/contact-info`, values);
      toast.success("Contact information updated successfully");
      router.refresh();
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update contact information");
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = () => {
    const parts = [
      employee.address,
      employee.city,
      employee.province,
      employee.postalCode,
      employee.country,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Not specified";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Contact Information</CardTitle>
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
                      {employee.email || "Not specified"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">
                      {employee.phone || "Not specified"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Department</p>
                    <p className="text-sm text-muted-foreground">
                      {employee.department?.name || "Not specified"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Country</p>
                    <p className="text-sm text-muted-foreground">
                      {employee.country || "Not specified"}
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
                      {employee.address || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">City</p>
                    <p className="text-sm text-muted-foreground">
                      {employee.city || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Province/State</p>
                    <p className="text-sm text-muted-foreground">
                      {employee.province || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Postal Code</p>
                    <p className="text-sm text-muted-foreground">
                      {employee.postalCode || "Not specified"}
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
                      {employee.emergencyName || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">
                      {employee.emergencyPhone || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Relationship</p>
                    <p className="text-sm text-muted-foreground">
                      {employee.emergencyRelation || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-sm text-muted-foreground">
                      {employee.emergencyAddress || "Not specified"}
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
