import React from "react";
import { PaymentDetail } from "../types";

interface EmployeeDetailsProps {
  worker: PaymentDetail["worker"];
  payment: PaymentDetail;
}

const EmployeeDetails: React.FC<EmployeeDetailsProps> = ({
  worker,
  payment,
}) => {
  const isFreelancer = worker?.isFreelancer || false;
  const workerNumber = isFreelancer
    ? worker?.freeLancerNumber
    : worker?.employeeNumber;

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-1">Employee Code:</h3>
        <p className="text-lg">{workerNumber || "NECS 003"}</p>
      </div>

      <div>
        <h3 className="font-semibold mb-1">Name of Employee:</h3>
        <p className="text-lg">
          {worker?.firstName} {worker?.lastName}
        </p>
      </div>

      <div>
        <h3 className="font-semibold mb-1">Employee Address:</h3>
        <p className="text-muted-foreground">
          {worker?.address || "House No 702"}
        </p>
        <p className="text-muted-foreground">Tshisaulu, Siawoadza</p>
      </div>

      <div>
        <h3 className="font-semibold mb-1">Date of Employment:</h3>
        <p className="text-muted-foreground">
          {formatDate(worker?.hireDate || "")}
        </p>
      </div>
    </div>
  );
};

export default EmployeeDetails;
