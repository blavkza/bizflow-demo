export interface Tool {
  id: string;
  name: string;
  serialNumber: string;
  category: string;
  status: string;
  condition: string;
  quantity: number;
  images: string[];
  allocatedDate: string;
  damageCost: number;
  damageDescription: string | null;
  workerName: string;
  workerNumber: string;
  employeeId: string | null;
  freelancerId: string | null;
  traineeId: string | null;
  lastCheckDate: string | null;
  daysSinceCheck: number | null;
  needsCheck: boolean;
  lastCheckCondition: string | null;
  lastCheckNotes: string | null;
  purchasePrice: number;
}

export interface WorkerGroup {
  workerName: string;
  workerNumber: string;
  workerId: string;
  workerType: "employee" | "freelancer" | "trainee";
  tools: Tool[];
  totalTools: number;
  toolsNeedingCheck: number;
}

export interface ToolCheck {
  id: string;
  toolId: string;
  toolName: string;
  toolSerialNumber: string;
  toolCategory: string;
  toolImage: string | null;
  toolPurchasePrice: number;
  workerName: string;
  workerNumber: string;
  checkDate: string;
  condition: string;
  isPresent: boolean;
  isLost: boolean;
  damageCost: number;
  damageDescription: string | null;
  notes: string | null;
  checkedBy: string;
  createdAt: string;
  deductFromWorker: boolean;
}
