// types/payroll.ts
import { Decimal } from "@prisma/client/runtime/library";

export type EmployeeWithDetails = {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  position: string;
  salary: Decimal | number;
  status: string;
  hireDate: Date | null;
  probationEnd: Date | null;
  avatar: string | null;
  // ... other employee fields
  department: {
    id: string;
    name: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    description: string | null;
    // ... other department fields
    manager: {
      name: string;
      // ... other manager fields if needed
    } | null;
  } | null;
  payments: {
    amount: Decimal;
    payDate: Date;
  }[];
};
