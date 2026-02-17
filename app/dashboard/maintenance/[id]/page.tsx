import { getMaintenanceById } from "../actions";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  BadgeCheck,
  Calendar,
  MapPin,
  User,
  FileText,
  ClipboardList,
  ArrowLeft,
  Clock,
  History,
  Briefcase,
  Receipt,
  Download,
  XCircle,
  AlertCircle,
  Mail,
  Phone,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MaintenanceStatusControls } from "../_components/maintenance-status-controls";
import { VisitStatusControls } from "../_components/visit-status-controls";
import { MaintenanceTaskEditor } from "../_components/maintenance-task-editor";
import { MaintenanceDetailsEditor } from "../_components/maintenance-details-editor";
import { MaintenancePDFButton } from "../_components/maintenance-pdf-button";

export default async function MaintenanceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const result = await getMaintenanceById(params.id);

  if (!result.success || !result.data) {
    notFound();
  }

  const m = result.data;

  const calculateRecurringTotal = (items: any) => {
    if (!Array.isArray(items)) return 0;
    return items.reduce((sum, item) => {
      const q = Number(item.quantity) || 0;
      const p = Number(item.unitPrice) || 0;
      return sum + q * p;
    }, 0);
  };

  const recurringAmount = m.recurringInvoice
    ? calculateRecurringTotal(m.recurringInvoice.items)
    : 0;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            asChild
          >
            <Link href="/dashboard/maintenance">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-0.5">
              <Link
                href="/dashboard/maintenance"
                className="hover:text-primary transition-colors hover:underline underline-offset-4"
              >
                Maintenance
              </Link>
              <span>/</span>
              <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded border leading-none">
                {m.id.slice(-8).toUpperCase()}
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Maintenance Task
            </h1>
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              Started on {format(new Date(m.date), "PPP")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <MaintenanceStatusControls id={m.id} currentStatus={m.status} />
          <MaintenancePDFButton maintenance={m} />
        </div>
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Metric Cards Row (Optional but useful for detail pages) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Type</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{m.type}</div>
            <p className="text-xs text-muted-foreground">
              {m.type === "ROUTINE"
                ? `Frequency: ${m.frequency}`
                : "One-off task"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Billing Arrangement
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {m.invoice
                ? "Individual"
                : m.recurringInvoice
                  ? "Recurring"
                  : "None"}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground">
                {m.invoice
                  ? `${m.invoice.currency} ${Number(m.invoice.totalAmount).toLocaleString()}`
                  : m.recurringInvoice
                    ? `${m.recurringInvoice.currency} ${Number(recurringAmount).toLocaleString()} / period`
                    : "No charges"}
              </p>
              {m.recurringInvoice && (
                <Badge
                  variant="outline"
                  className="text-[9px] h-4 py-0 font-bold uppercase border-purple-200 text-purple-700 bg-purple-50"
                >
                  Base Amount
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Location</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{m.location}</div>
            <p className="text-xs text-muted-foreground">Operational site</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Details & Events */}
        <div className="lg:col-span-8 space-y-6">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="history">
                Activity History ({m.visits.length})
              </TabsTrigger>
              <TabsTrigger value="finance">Related Invoices</TabsTrigger>
              {m.project && (
                <TabsTrigger value="project">Project Details</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="overview">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          Maintenance Summary
                        </CardTitle>
                        <CardDescription>
                          Core metrics and task scope for this record.
                        </CardDescription>
                      </div>
                      <MaintenanceDetailsEditor maintenance={m} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-muted/30 p-3 rounded-lg border shadow-sm">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                          Type
                        </p>
                        <p className="text-sm font-semibold flex items-center gap-2 mt-1 uppercase">
                          {m.type === "ROUTINE" ? (
                            <History className="h-3 w-3 text-purple-500" />
                          ) : (
                            <BadgeCheck className="h-3 w-3 text-emerald-500" />
                          )}
                          {m.type}
                        </p>
                      </div>
                      <div className="bg-muted/30 p-3 rounded-lg border shadow-sm">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                          Status
                        </p>
                        <div className="mt-1">
                          <Badge
                            variant="outline"
                            className="h-5 text-[10px] font-bold"
                          >
                            {m.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="bg-muted/30 p-3 rounded-lg border shadow-sm">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                          Total Visits
                        </p>
                        <p className="text-sm font-semibold flex items-center gap-2 mt-1">
                          <MapPin className="h-3 w-3 text-blue-500" />
                          {m.visits.length} Scheduled
                        </p>
                      </div>
                      <div className="bg-muted/30 p-3 rounded-lg border shadow-sm">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                          Record Updated
                        </p>
                        <p className="text-sm font-semibold flex items-center gap-2 mt-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(m.updatedAt), "dd MMM yyyy")}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <Label className="text-xs uppercase font-bold text-muted-foreground tracking-widest">
                        Task Scope
                      </Label>
                      <MaintenanceTaskEditor id={m.id} initialTask={m.task} />
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-bold uppercase tracking-wider">
                        Planning & Schedule
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">
                          Original Start Date:
                        </span>
                        <span className="font-medium">
                          {format(new Date(m.date), "PPP")}
                        </span>
                      </div>
                      {m.type === "ROUTINE" && (
                        <>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">
                              Frequency:
                            </span>
                            <span className="font-bold text-primary">
                              Every {m.frequency}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">
                              Total Generated Visits:
                            </span>
                            <span className="font-medium">
                              {m.visits.length}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">
                              Completed Visits:
                            </span>
                            <span className="font-medium text-emerald-600">
                              {
                                m.visits.filter(
                                  (v: any) => v.status === "COMPLETED",
                                ).length
                              }
                            </span>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-bold uppercase tracking-wider">
                        Financial Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">
                          Billing Arrangement:
                        </span>
                        <span className="font-medium">
                          {m.invoice
                            ? "Single Invoice"
                            : m.recurringInvoice
                              ? "Recurring Schedule"
                              : "None"}
                        </span>
                      </div>
                      {(m.invoice || m.recurringInvoice) && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">
                            Base Amount:
                          </span>
                          <span className="font-bold">
                            {m.invoice?.currency ||
                              m.recurringInvoice?.currency}{" "}
                            {m.invoice
                              ? Number(m.invoice.totalAmount).toLocaleString()
                              : recurringAmount.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {m.recurringInvoice && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">
                            Next Scheduled Invoice:
                          </span>
                          <span className="font-medium">
                            {format(
                              new Date(m.recurringInvoice.nextDate),
                              "dd MMM yyyy",
                            )}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Visit Log</CardTitle>
                  <CardDescription>
                    History of physical site visits conducted.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {m.visits.map((visit: any) => (
                      <div
                        key={visit.id}
                        className="flex gap-4 items-start border-l-2 border-muted pl-4 relative py-2"
                      >
                        <div className="absolute left-[-5px] top-4 h-2 w-2 rounded-full bg-primary" />
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-center">
                            <p className="font-semibold">
                              {format(new Date(visit.date), "PPP")}
                            </p>
                            <VisitStatusControls
                              visit={visit}
                              maintenanceId={m.id}
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {visit.location}
                          </p>
                          <p className="text-sm italic opacity-80">
                            "{visit.task || "Regular check-up"}"
                          </p>
                        </div>
                      </div>
                    ))}
                    {m.visits.length === 0 && (
                      <div className="text-center py-6 text-muted-foreground italic">
                        No visit history found.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="finance">
              <div className="space-y-6">
                {/* Parent Recurring Schedule Section */}
                {m.recurringInvoice && (
                  <Card className="bg-muted/10 border-dashed transition-all hover:bg-muted/20">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <CardTitle className="text-base flex items-center gap-2">
                            <History className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            Parent Recurring Schedule
                          </CardTitle>
                          <CardDescription className="text-xs">
                            Master template reference:{" "}
                            <span className="font-mono text-foreground font-bold text-[10px] uppercase">
                              {m.recurringInvoice.id.slice(0, 8)}
                            </span>
                          </CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs font-bold"
                          asChild
                        >
                          <Link
                            href={`/dashboard/invoices/recurring/${m.recurringInvoiceId}`}
                          >
                            View Full Schedule
                          </Link>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-2">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                            Base Amount
                          </p>
                          <p className="font-bold text-sm">
                            {m.recurringInvoice.currency}{" "}
                            {Number(recurringAmount).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                            Frequency
                          </p>
                          <p className="font-bold text-sm">
                            {m.recurringInvoice.frequency}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                            Current Status
                          </p>
                          <Badge
                            variant="outline"
                            className="h-5 text-[10px] font-black border-purple-200 text-purple-700 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400"
                          >
                            {m.recurringInvoice.status}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                            Next Invoice Date
                          </p>
                          <p className="font-bold text-sm text-blue-600 dark:text-blue-400">
                            {format(
                              new Date(m.recurringInvoice.nextDate),
                              "dd MMM yyyy",
                            )}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base">
                      Generated Ledger Items
                    </CardTitle>
                    <CardDescription className="text-xs">
                      All specific invoices linked to this maintenance record.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="pl-6 h-10 text-[10px] uppercase font-bold tracking-wider">
                            Invoice #
                          </TableHead>
                          <TableHead className="h-10 text-[10px] uppercase font-bold tracking-wider">
                            Issue Date
                          </TableHead>
                          <TableHead className="h-10 text-[10px] uppercase font-bold tracking-wider">
                            Amount
                          </TableHead>
                          <TableHead className="h-10 text-[10px] uppercase font-bold tracking-wider">
                            Status
                          </TableHead>
                          <TableHead className="text-right pr-6 h-10 text-[10px] uppercase font-bold tracking-wider">
                            Action
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Regular single invoice */}
                        {m.invoice && (
                          <TableRow className="hover:bg-muted/20">
                            <TableCell className="pl-6 font-bold text-sm">
                              {m.invoice.invoiceNumber}
                            </TableCell>
                            <TableCell className="text-sm">
                              {format(
                                new Date(m.invoice.issueDate),
                                "dd MMM yyyy",
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {m.invoice.currency}{" "}
                              {Number(m.invoice.totalAmount).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="text-[10px] font-bold uppercase"
                              >
                                {m.invoice.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 font-bold text-xs"
                                asChild
                              >
                                <Link
                                  href={`/dashboard/invoices/${m.invoice.id}`}
                                >
                                  View Details
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        )}

                        {/* List of child invoices from schedule */}
                        {m.recurringInvoice?.invoices?.map((inv: any) => (
                          <TableRow key={inv.id} className="hover:bg-muted/20">
                            <TableCell className="pl-6 font-bold text-sm">
                              <div className="flex items-center gap-2">
                                <Receipt className="h-3 w-3 text-muted-foreground" />
                                {inv.invoiceNumber}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {format(new Date(inv.issueDate), "dd MMM yyyy")}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {inv.currency}{" "}
                              {Number(inv.totalAmount).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="text-[10px] font-bold uppercase border-blue-100 text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400"
                              >
                                {inv.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 font-bold text-xs"
                                asChild
                              >
                                <Link href={`/dashboard/invoices/${inv.id}`}>
                                  Explore
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}

                        {!m.invoice &&
                          (!m.recurringInvoice?.invoices ||
                            m.recurringInvoice.invoices.length === 0) && (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center py-10 text-muted-foreground text-sm italic"
                              >
                                No billing activity or invoices detected for
                                this record.
                              </TableCell>
                            </TableRow>
                          )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {m.project && (
              <TabsContent value="project">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Briefcase className="h-6 w-6 text-primary" />
                      Project Detail: {m.project.title}
                    </CardTitle>
                    <CardDescription>
                      Full project context and financial performance overview.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-xs uppercase font-bold text-muted-foreground tracking-widest">
                            Description
                          </Label>
                          <p className="text-sm text-foreground leading-relaxed bg-muted/20 p-4 rounded-md italic border-l-4 border-primary">
                            {m.project.description ||
                              "No project description available in the system record."}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <Label className="text-xs uppercase font-bold text-muted-foreground tracking-widest">
                              Start Date
                            </Label>
                            <p className="text-sm font-bold flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-primary" />
                              {m.project.startDate
                                ? format(new Date(m.project.startDate), "PPP")
                                : "TBD"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs uppercase font-bold text-muted-foreground tracking-widest">
                              Target Deadline
                            </Label>
                            <p className="text-sm font-bold flex items-center gap-2 text-red-600 dark:text-red-400">
                              <AlertCircle className="h-4 w-4" />
                              {m.project.deadline
                                ? format(new Date(m.project.deadline), "PPP")
                                : "No deadline"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-primary/5 p-6 rounded-xl border-2 border-primary/10 space-y-4">
                          <Label className="text-xs uppercase font-bold text-primary tracking-widest">
                            Live Performance
                          </Label>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-xs font-bold">
                                <span>COMPLETION PROGRESS</span>
                                <span>{m.project.progress || 0}%</span>
                              </div>
                              <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary transition-all duration-1000"
                                  style={{
                                    width: `${m.project.progress || 0}%`,
                                  }}
                                />
                              </div>
                            </div>

                            <Separator className="bg-primary/10" />

                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                  Authorized Budget:
                                </span>
                                <span className="font-bold">
                                  {m.project.currency}{" "}
                                  {Number(
                                    m.project.budget || 0,
                                  ).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                  Actual Spent:
                                </span>
                                <span className="font-bold text-red-600">
                                  -{m.project.currency}{" "}
                                  {Number(
                                    m.project.budgetSpent || 0,
                                  ).toLocaleString()}
                                </span>
                              </div>
                              <div className="pt-2 flex justify-between items-center border-t border-primary/10">
                                <span className="text-sm font-bold capitalize">
                                  Remaining Funds:
                                </span>
                                <span className="text-lg font-black text-emerald-600">
                                  {m.project.currency}{" "}
                                  {(
                                    Number(m.project.budget || 0) -
                                    Number(m.project.budgetSpent || 0)
                                  ).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button className="w-full" asChild>
                          <Link href={`/dashboard/projects/${m.projectId}`}>
                            Access Complete Project Dashboard
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Right Column: Context Information */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                  {m.client.name?.charAt(0)}
                </div>
                <div>
                  <p className="font-bold">{m.client.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.client.company || "Individual Client"}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="space-y-3 py-1">
                {m.client.email && (
                  <div className="flex items-center gap-3 text-sm group cursor-pointer">
                    <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Email
                      </span>
                      <span className="font-medium truncate max-w-[200px]">
                        {m.client.email}
                      </span>
                    </div>
                  </div>
                )}
                {m.client.phone && (
                  <div className="flex items-center gap-3 text-sm group cursor-pointer">
                    <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Phone
                      </span>
                      <span className="font-medium">{m.client.phone}</span>
                    </div>
                  </div>
                )}
                {m.location && (
                  <div className="flex items-center gap-3 text-sm group cursor-pointer">
                    <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Site Address
                      </span>
                      <span className="font-medium truncate max-w-[200px]">
                        {m.location}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <Separator />
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/dashboard/human-resources/clients/${m.clientId}`}>
                  View Client Profile
                </Link>
              </Button>
            </CardContent>
          </Card>

          {m.project && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-bold">{m.project.title}</p>
                    <p className="text-[10px] font-mono text-muted-foreground mt-1 uppercase">
                      ID: {m.project.projectNumber || m.project.id.slice(0, 8)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-dashed">
                    <div className="space-y-1">
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">
                        Status
                      </p>
                      <Badge
                        variant="outline"
                        className="h-5 text-[9px] font-black bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400"
                      >
                        {m.project.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">
                        Priority
                      </p>
                      <Badge
                        variant="outline"
                        className={cn(
                          "h-5 text-[9px] font-black",
                          m.project.priority === "URGENT" ||
                            m.project.priority === "HIGH"
                            ? "bg-red-50 text-red-700 border-red-100"
                            : "bg-gray-50 text-gray-700 border-gray-100",
                        )}
                      >
                        {m.project.priority}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">
                        Deadline
                      </p>
                      <p className="text-xs font-black">
                        {m.project.deadline
                          ? format(new Date(m.project.deadline), "dd MMM yy")
                          : "N/A"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">
                        Progress
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 transition-all"
                            style={{ width: `${m.project.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-black">
                          {m.project.progress || 0}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />
                  <Button
                    variant="outline"
                    className="w-full h-9 font-bold text-xs"
                    asChild
                  >
                    <Link href={`/dashboard/projects/${m.projectId}`}>
                      View Complete Lifecycle
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {m.type === "ROUTINE" && m.schedule && (
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Schedule Interval
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-lg font-bold">Every {m.frequency}</span>
                </div>
                {m.recurringInvoice && (
                  <p className="text-xs text-muted-foreground border-t pt-2 mt-2">
                    Next generation:{" "}
                    <strong>
                      {format(
                        new Date(m.recurringInvoice.nextDate),
                        "dd MMM yyyy",
                      )}
                    </strong>
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
