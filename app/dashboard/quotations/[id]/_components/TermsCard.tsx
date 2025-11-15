"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { QuotationWithRelations } from "@/types/quotation";

export const TermsCard = ({
  quotation,
}: {
  quotation: QuotationWithRelations;
}) => {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Terms & Conditions</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 pt-2 border-t">
          <span className="text-muted-foreground">Description:</span>
          <p className="text-sm">
            {quotation.description || "No description provided"}
          </p>
        </div>
        <div className="space-y-2">
          <span className="text-muted-foreground">Payment Terms:</span>
          <p className="text-sm">
            {quotation.paymentTerms || "No payment terms specified"}
          </p>
        </div>
        {/*   <div className="space-y-2">
          <span className="text-muted-foreground">Delivery Terms:</span>
          <p className="text-sm">
            {quotation.deliveryTerms || "No delivery terms specified"}
          </p>
        </div> */}
        <div className="space-y-2">
          <span className="text-muted-foreground">Notes:</span>
          <p className="text-sm">{quotation.notes || "No notes provided"}</p>
        </div>
      </CardContent>
    </Card>
  );
};
