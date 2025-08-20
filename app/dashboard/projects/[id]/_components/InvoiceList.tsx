"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { format } from "date-fns";
import { Invoice, Project } from "../type";
import Link from "next/link";

interface InvoiceListProps {
  project: Project;
}

export function InvoiceList({ project }: InvoiceListProps) {
  console.log(project.invoices);

  return (
    <div className="space-y-4">
      {project.invoices.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No invoices found for this project.
        </div>
      ) : (
        project.invoices.map((invoice) => (
          <Card
            key={invoice.id}
            className="bg-gradient-to-br from-card to-card/80 border-border/50"
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{invoice.invoiceNumber}</h4>
                    <Badge
                      className={
                        invoice.status === "PAID"
                          ? "bg-green-500 text-white"
                          : invoice.status === "OVERDUE"
                            ? "bg-destructive text-destructive-foreground"
                            : "bg-warning text-white"
                      }
                    >
                      {invoice.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      Issued:{" "}
                      {invoice.issueDate
                        ? format(new Date(invoice.issueDate), "MMM d, yyyy")
                        : "N/A"}
                    </span>
                    <span>
                      Due:{" "}
                      {invoice.dueDate
                        ? format(new Date(invoice.dueDate), "MMM d, yyyy")
                        : "N/A"}
                    </span>
                  </div>
                </div>

                <div className="text-right space-y-2">
                  <div className="text-2xl font-bold mb-2">
                    R{invoice.totalAmount?.toLocaleString() || "0"}
                  </div>

                  <Link href={`/dashboard/invoices/${invoice.id}`}>
                    {" "}
                    <Button variant="outline" size="sm">
                      <Eye size={14} className="mr-1" />
                      View{" "}
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
