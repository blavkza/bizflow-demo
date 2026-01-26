export interface PaymentDetail {
  id: string;
  employeeId: string | null;
  freeLancerId: string | null;
  amount: number;
  netAmount: number;
  baseAmount: number;
  overtimeAmount: number;
  bonusAmount: number;
  deductionAmount: number;
  payDate: string;
  description: string | null;
  currency: string;
  type: string;
  daysWorked: number;
  overtimeHours: number;
  regularHours: number;
  status: string;

  worker?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber?: string;
    freeLancerNumber?: string;
    position: string;
    email: string;
    phone: string | null;
    address: string | null;
    idNumber: string | null;
    taxNumber: string | null;
    hireDate: string | null;
    ratePerHour: number;
    isFreelancer: boolean;
    department: {
      name: string;
    } | null;
  };

  company?: {
    companyName: string;
    address: string;
    address2: string;
    phone?: string;
    phone2?: string;
    email?: string;
    taxId?: string;
    registrationNumber?: string;
    bankName?: string;
    bankAccount?: string;
    bankName2?: string;
    bankAccount2?: string;
    logo?: string;
  };

  paymentBonuses: Array<{
    id: string;
    bonusType: string;
    amount: number;
    description: string | null;
    isPercentage: boolean;
    percentageRate: number | null;
  }>;

  paymentDeductions: Array<{
    id: string;
    deductionType: string;
    amount: number;
    description: string | null;
    isPercentage: boolean;
    percentageRate: number | null;
  }>;

  Payroll?: {
    month: string;
    description: string;
  };
}
