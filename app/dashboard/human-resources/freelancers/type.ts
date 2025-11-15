export interface FreelancerWithDetails {
  id: string;
  freelancerNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  position: string;
  department?: {
    id: string;
    name: string;
    manager?: {
      name: string;
    } | null;
  } | null;
  status: string;
  salary: number;
  address: string;
  hireDate: string;
  reliable: boolean;
  avatar?: string;
  scheduledKnockIn?: string;
  scheduledKnockOut?: string;
  workingDays?: string[];
  // Personal info fields
  idNumber?: string;
  taxNumber?: string;
  nationality?: string;
  maritalStatus?: string;
  bankName?: string;
  accountNumber?: string;
  branchCode?: string;
  accountType?: string;
  // Contact info fields
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  emergencyAddress?: string;

  medicalCondition?: string | null;
  allergies?: string | null;
  restrictions?: string | null;
  firstAidNeeds?: string | null;
  riskLevel?: string | null;
  additionalInfo?: string | null;
  emergencyContacts?: any;
  payments?: any[];
}
