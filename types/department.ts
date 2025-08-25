// components/department/types.ts
export interface BudgetItem {
  id: string;
  name: string;
  allocated: number;
  spent: number;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  floor: string | null;
  building: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  manager: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  employees: {
    id: string;
    avatar: string | null;
    firstName: string;
    lastName: string;
    salary: number;
    email: string;
    position: string;
  }[];
}
