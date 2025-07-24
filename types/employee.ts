import { Employee, PaymentStatus, PaymentType } from "@prisma/client";

export type EmployeeWithDetails = Employee & {
  payments?: {
    id: string;
    amount: number;
    payDate: Date;
    type: PaymentType;
    status: PaymentStatus;
    description?: string | null;
  }[];
  department?: {
    id: string;
    name: string;
    manager?: {
      name: string;
    } | null;
  } | null;
};

export type StatsCardProps = {
  employee: EmployeeWithDetails;
};

export type TabsSectionProps = {
  employee: EmployeeWithDetails;
};
