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
      <CardContent className="space-y-6">
        {/* Description Section */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-muted-foreground">
            Description:
          </span>
          {quotation.description ? (
            <div
              className="text-sm [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4"
              dangerouslySetInnerHTML={{ __html: quotation.description }}
            />
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No description provided
            </p>
          )}
        </div>

        {/* Payment Terms Section */}
        <div className="space-y-2 pt-4 border-t">
          <span className="text-sm font-medium text-muted-foreground">
            Payment Terms:
          </span>
          {quotation.paymentTerms ? (
            <div
              className="text-sm [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4"
              dangerouslySetInnerHTML={{ __html: quotation.paymentTerms }}
            />
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No payment terms specified
            </p>
          )}
        </div>

        {/* Notes Section */}
        <div className="space-y-2 pt-4 border-t">
          <span className="text-sm font-medium text-muted-foreground">
            Notes:
          </span>
          {quotation.notes ? (
            <div
              className="text-sm [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4"
              dangerouslySetInnerHTML={{ __html: quotation.notes }}
            />
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No notes provided
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
