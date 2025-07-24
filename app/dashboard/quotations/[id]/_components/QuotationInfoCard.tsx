"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { QuotationWithRelations } from "@/types/quotation";
import { StatusBadge } from "./StatusBadge";

export const QuotationInfoCard = ({
  quotation,
}: {
  quotation: QuotationWithRelations;
}) => {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Quotation Information</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <span className="text-muted-foreground">Title:</span>
          <p className="text-sm">{quotation.title || "No title provided"}</p>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Quotation Number:</span>
          <span className="font-medium">{quotation.quotationNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Issue Date:</span>
          <span>{format(new Date(quotation.issueDate), "MMM dd, yyyy")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Valid Until:</span>
          <span>{format(new Date(quotation.validUntil), "MMM dd, yyyy")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status:</span>
          <StatusBadge status={quotation.status} />
        </div>
        <div className="space-y-2">
          <span className="text-muted-foreground">Description:</span>
          <p className="text-sm">
            {quotation.description || "No description provided"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
