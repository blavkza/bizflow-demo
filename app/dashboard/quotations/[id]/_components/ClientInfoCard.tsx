"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Building, Dock, Mail, Phone } from "lucide-react";
import { QuotationWithRelations } from "@/types/quotation";

export const ClientInfoCard = ({
  quotation,
}: {
  quotation: QuotationWithRelations;
}) => {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Client Information</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Building className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{quotation.client.name}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span>{quotation.client.email || "No email provided"}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span>{quotation.client.phone || "No phone provided"}</span>
        </div>
        <div className="flex items-center space-x-2">
          VAT Number :{" "}
          <span>
            {" " + quotation.client.taxNumber || "No Tax Number provided"}
          </span>
        </div>
        <div className="space-y-1">
          <span className="text-muted-foreground text-sm">Address:</span>
          <p className="text-sm">
            {quotation.client.address || "No address provided"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
