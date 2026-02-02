"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import {
  Building2,
  Users,
  Mail,
  Phone,
  Globe,
  MapPin,
  Pencil,
  Trash,
  ChevronLeft,
  Briefcase,
  Wallet,
  Landmark,
  CreditCard,
  Plus,
  Paperclip,
  FileText,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import { DocumentUpload } from "../../../_components/document-upload";

const lenderFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  interestRate: z.coerce.number().min(0).optional(),
  termMonths: z.coerce.number().int().min(1).optional(),
});

type LenderFormValues = z.infer<typeof lenderFormSchema>;

export const LenderDetailClient = ({ lenderId }: { lenderId: string }) => {
  const router = useRouter();
  const [openEdit, setOpenEdit] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    data: lender,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["lender", lenderId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/lenders/${lenderId}`);
      return data;
    },
  });

  const form = useForm<LenderFormValues>({
    resolver: zodResolver(lenderFormSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      website: "",
      address: "",
      description: "",
      interestRate: 0,
      termMonths: 12,
    },
  });

  useEffect(() => {
    if (lender) {
      form.reset({
        name: lender.name,
        contactPerson: lender.contactPerson || "",
        email: lender.email || "",
        phone: lender.phone || "",
        website: lender.website || "",
        address: lender.address || "",
        description: lender.description || "",
        interestRate: lender.interestRate || 0,
        termMonths: lender.termMonths || 12,
      });
    }
  }, [lender, form]);

  const onEditSubmit = async (data: LenderFormValues) => {
    try {
      setLoading(true);
      await axios.patch(`/api/lenders/${lenderId}`, data);
      toast.success("Lender updated successfully");
      refetch();
      setOpenEdit(false);
    } catch (error) {
      toast.error("Failed to update lender");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this lender? This cannot be undone.",
      )
    )
      return;
    try {
      await axios.delete(`/api/lenders/${lenderId}`);
      toast.success("Lender deleted");
      router.push("/dashboard/loans/lenders");
    } catch (error: any) {
      toast.error(error.response?.data || "Failed to delete lender");
    }
  };

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!lender)
    return <div className="p-8 text-red-500 font-bold">Lender not found</div>;

  const loans = lender.loans || [];
  const totalBorrowed = loans.reduce(
    (acc: number, loan: any) => acc + (loan.amount || 0),
    0,
  );

  let totalPayable = 0;
  let totalPaid = 0;

  loans.forEach((loan: any) => {
    totalPayable += loan.totalPayable || loan.amount || 0;
    totalPaid += (loan.payments || []).reduce(
      (acc: number, p: any) => acc + (p.amount || 0),
      0,
    );
  });

  const outstanding = Math.max(0, totalPayable - totalPaid);

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/dashboard/loans/lenders")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Heading
            title={lender.name}
            description={`Financial partner since ${format(new Date(lender.createdAt), "MMMM yyyy")}`}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setOpenEdit(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
          <Button variant="destructive" size="icon" onClick={onDelete}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator className="my-6" />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Portfolio Size
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loans.length} Loans</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total active & completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Total Borrowed
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalBorrowed)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Principal amount only
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Outstanding Balance
            </CardTitle>
            <CreditCard className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(outstanding)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Incl. projected interest
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Capital Repaid
            </CardTitle>
            <Landmark className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total payments made
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Contact Details */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Users className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium">Contact Person</p>
                <p className="text-sm text-slate-600">
                  {lender.contactPerson || "Not specified"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium">Email Address</p>
                <p className="text-sm text-slate-600">
                  {lender.email || "No email provided"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium">Phone Number</p>
                <p className="text-sm text-slate-600">
                  {lender.phone || "No phone number"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Globe className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium">Website</p>
                {lender.website ? (
                  <a
                    href={lender.website}
                    target="_blank"
                    rel="noopener"
                    className="text-sm text-blue-600 underline"
                  >
                    {lender.website.replace(/(^\w+:|^)\/\//, "")}
                  </a>
                ) : (
                  <p className="text-sm text-slate-600">None</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium">Address</p>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                  {lender.address || "No address on file"}
                </p>
              </div>
            </div>

            <Separator className="my-2" />

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">Default Term</span>
                <Badge variant="outline">{lender.termMonths || 0} Months</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Default Rate</span>
                <Badge variant="secondary">
                  {lender.interestRate || 0}% p.a
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loans Table */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Loans from this Lender</CardTitle>
              <CardDescription>
                Track every business loan active with {lender.name}
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => router.push("/dashboard/loans")}>
              <Plus className="h-4 w-4 mr-2" /> New Loan
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan: any) => (
                  <TableRow key={loan.id}>
                    <TableCell className="font-medium">
                      {loan.loanType || "Business Loan"}
                    </TableCell>
                    <TableCell>
                      {format(new Date(loan.startDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{formatCurrency(loan.amount)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          loan.status === "ACTIVE" ? "default" : "secondary"
                        }
                      >
                        {loan.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(`/dashboard/loans/${loan.id}`)
                        }
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {loans.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center h-24 text-muted-foreground"
                    >
                      No loans recorded for this lender.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Documents Card */}
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Documents</CardTitle>
              <CardDescription>KYC, contracts & agreements</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <DocumentUpload
              entityId={lenderId}
              entityType="lender"
              onSuccess={refetch}
              label="Upload Document"
              showList={false}
            />
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {lender.documents?.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center p-2 border rounded hover:bg-slate-50 transition-colors gap-2"
                >
                  <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                  <span
                    className="text-xs font-medium truncate flex-1"
                    title={doc.name}
                  >
                    {doc.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    asChild
                  >
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              ))}
              {(!lender.documents || lender.documents.length === 0) && (
                <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded italic text-xs">
                  No documents uploaded.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="sm:max-w-[550px] lg:min-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lender Profile</DialogTitle>
            <DialogDescription>
              Update corporate and contact information.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onEditSubmit)}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground border-b pb-1">
                    Company Details
                  </h4>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Bank Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person</FormLabel>
                        <FormControl>
                          <Input placeholder="Full Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="email@lender.com" {...field} />
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
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+27..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground border-b pb-1">
                    Offering & Notes
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="interestRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Rate (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="termMonths"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Term (Mo)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Physical Address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Strategic Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Specific terms, account manager details..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button disabled={loading} type="submit" className="w-full">
                  {loading ? "Saving Changes..." : "Save Profile"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};
