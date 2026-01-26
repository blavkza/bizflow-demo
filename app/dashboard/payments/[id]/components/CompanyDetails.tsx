import React from "react";
import { PaymentDetail } from "../types";

interface CompanyDetailsProps {
  company: PaymentDetail["company"];
}

const CompanyDetails: React.FC<CompanyDetailsProps> = ({ company }) => {
  return (
    <div className="mb-8">
      <h3 className="font-semibold mb-2">Name of Employer:</h3>
      <p className="text-lg font-bold mb-1">
        {company?.companyName ||
          "Ndou Electrical Construction And Supply Engineers"}
      </p>
      <p className="text-muted-foreground">
        {company?.address || "Shayandima 88 Khwevha Street"}
      </p>
      <p className="text-muted-foreground">
        {company?.address2 ||
          "After Shoprite, after township next to Gwamasenga Dry Clean"}
      </p>
      {company?.registrationNumber && (
        <p className="text-sm text-muted-foreground">
          Reg: {company.registrationNumber}
        </p>
      )}
    </div>
  );
};

export default CompanyDetails;
