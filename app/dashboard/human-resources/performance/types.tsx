export type Employee = {
  id: string;
  name: string;
  position: string;
  department: string;
  avatar?: string;
  currentPoints: number;
  trend: string;
  status: string;
  metrics: {
    productivity: number;
    quality: number;
    attendance: number;
    teamwork: number;
  };
  goals: {
    title: string;
    progress: number;
    status: string;
  }[];
  warnings: Warning[];
};

export type Department = {
  name: string;
  avgScore: number;
  employees: Employee[];
  color: string;
};

export type PerformanceData = {
  month: string;
  productivity: number;
  quality: number;
  attendance: number;
  teamwork: number;
};

export type WarningFormData = {
  type: string;
  severity: string;
  reason: string;
  actionPlan: string;
  employeeId: string;
};

export type PerformanceOverview = {
  averageScore: number;
  topPerformers: number;
  needsAttention: number;
  activeWarnings: number;
  trend: number;
};

export type WarningStatus =
  | "ACTIVE"
  | "RESOLVED"
  | "ESCALATED"
  | "APPEALED"
  | "REJECTED"
  | "NEXT_STEP"
  | "NEXT_STEP_ACCEPTED";

export interface Warning {
  id: string;
  employeeId: string;
  type: string;
  severity: string;
  reason: string;
  actionPlan?: string;
  date: string;
  status: WarningStatus;
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
  appealReason?: string;
  appealDate?: string;
  adminDecision?: string;
  workerResponse?: string;
  workerResponseDate?: string;
}

export interface UnifiedPerformanceData {
  overview: {
    averageScore: number;
    topPerformers: number;
    needsAttention: number;
    activeWarnings: number;
    trend: number;
    totalEmployees: number;
    departmentStats: Department[];
    calculatedAt: string;
  };
  employees: Employee[];
  departments: Department[];
  warnings: Warning[];
  trends: PerformanceData[];
  distribution: PerformanceDistribution[];
}

export interface PerformanceDistribution {
  name: string;
  value: number;
  fill: string;
}
