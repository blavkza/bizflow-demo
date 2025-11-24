// types/department.ts
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
    dailySalary: number;
    monthlySalary: number;
    salaryType: string;
    email: string;
    position: string;
    hireDate: Date;
  }[];
  freelancers: {
    id: string;
    avatar: string | null;
    firstName: string;
    lastName: string;
    salary: number;
    email: string;
    position: string;
    status: string;
    hireDate: Date;
  }[];
}
