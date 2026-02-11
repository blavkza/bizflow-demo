export type FieldType = "string" | "number" | "date" | "boolean";

export interface DataField {
  id: string;
  label: string;
  type: FieldType;
}

export interface Dataset {
  id: string;
  label: string;
  fields: DataField[];
  data: any[];
}

export const datasets: Dataset[] = [
  {
    id: "sales",
    label: "Sales & Revenue",
    fields: [
      { id: "date", label: "Date", type: "date" },
      { id: "product", label: "Product", type: "string" },
      { id: "category", label: "Category", type: "string" },
      { id: "revenue", label: "Revenue", type: "number" },
      { id: "profit", label: "Profit", type: "number" },
      { id: "units", label: "Units Sold", type: "number" },
      { id: "region", label: "Region", type: "string" },
    ],
    data: Array.from({ length: 50 }, (_, i) => ({
      date: new Date(2024, 0, i + 1).toISOString(),
      product: ["Widget A", "Widget B", "Gadget X", "Tool Y"][
        Math.floor(Math.random() * 4)
      ],
      category: ["Electronics", "Hardware", "Office"][
        Math.floor(Math.random() * 3)
      ],
      revenue: Math.floor(Math.random() * 1000) + 100,
      profit: Math.floor(Math.random() * 300) + 20,
      units: Math.floor(Math.random() * 50) + 1,
      region: ["North", "South", "East", "West"][Math.floor(Math.random() * 4)],
    })),
  },
  {
    id: "attendance",
    label: "Attendance",
    fields: [
      { id: "date", label: "Date", type: "date" },
      { id: "employee", label: "Employee", type: "string" },
      { id: "department", label: "Department", type: "string" },
      { id: "status", label: "Status", type: "string" },
      { id: "hours", label: "Hours Worked", type: "number" },
      { id: "overtime", label: "Overtime Hours", type: "number" },
    ],
    data: Array.from({ length: 50 }, (_, i) => ({
      date: new Date(2024, 0, i + 1).toISOString(),
      employee: ["Alice", "Bob", "Charlie", "Diana"][
        Math.floor(Math.random() * 4)
      ],
      department: ["Engineering", "HR", "Sales"][Math.floor(Math.random() * 3)],
      status: ["Present", "Absent", "Late", "Half-day"][
        Math.floor(Math.random() * 4)
      ],
      hours: Math.floor(Math.random() * 8) + 1,
      overtime: Math.random() > 0.8 ? Math.floor(Math.random() * 4) : 0,
    })),
  },
  {
    id: "employees",
    label: "Workforce",
    fields: [
      { id: "name", label: "Name", type: "string" },
      { id: "role", label: "Role", type: "string" },
      { id: "department", label: "Department", type: "string" },
      { id: "salary", label: "Salary", type: "number" },
      { id: "performance", label: "Performance Score", type: "number" },
      { id: "tenure", label: "Tenure (Years)", type: "number" },
    ],
    data: Array.from({ length: 30 }, (_, i) => ({
      name: `Employee ${i + 1}`,
      role: ["Dev", "Manager", "Sales", "Support"][
        Math.floor(Math.random() * 4)
      ],
      department: ["Engineering", "HR", "Sales", "Support"][
        Math.floor(Math.random() * 4)
      ],
      salary: Math.floor(Math.random() * 100000) + 40000,
      performance: Math.floor(Math.random() * 100),
      tenure: Math.floor(Math.random() * 10) + 1,
    })),
  },
  {
    id: "tools",
    label: "Tools & Inventory",
    fields: [
      { id: "tool", label: "Tool Name", type: "string" },
      { id: "category", label: "Category", type: "string" },
      { id: "status", label: "Status", type: "string" },
      { id: "price", label: "Price", type: "number" },
      { id: "stock", label: "Stock Level", type: "number" },
    ],
    data: Array.from({ length: 40 }, (_, i) => ({
      tool: `Tool ${i + 1}`,
      category: ["Power Tools", "Hand Tools", "Safety"][
        Math.floor(Math.random() * 3)
      ],
      status: ["Available", "In Use", "Maintenance", "Lost"][
        Math.floor(Math.random() * 4)
      ],
      price: Math.floor(Math.random() * 500) + 50,
      stock: Math.floor(Math.random() * 20),
    })),
  },
  {
    id: "leaves",
    label: "Leaves",
    fields: [
      { id: "employee", label: "Employee", type: "string" },
      { id: "type", label: "Leave Type", type: "string" },
      { id: "days", label: "Days", type: "number" },
      { id: "status", label: "Status", type: "string" },
    ],
    data: Array.from({ length: 30 }, (_, i) => ({
      employee: `Employee ${Math.floor(Math.random() * 10)}`,
      type: ["Sick", "Annual", "Unpaid", "Maternity"][
        Math.floor(Math.random() * 4)
      ],
      days: Math.floor(Math.random() * 5) + 1,
      status: ["Approved", "Pending", "Rejected"][
        Math.floor(Math.random() * 3)
      ],
    })),
  },
];
