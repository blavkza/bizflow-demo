export function safeNumber(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined) return defaultValue;

  // Handle string numbers
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  // Handle numbers
  if (typeof value === "number") {
    return isNaN(value) ? defaultValue : value;
  }

  // For other types, try to convert
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

export function formatCurrency(
  value: any,
  defaultValue: string = "0.00"
): string {
  const num = safeNumber(value);
  return `R${num.toFixed(2)}`;
}

export function formatCount(value: any, defaultValue: number = 0): string {
  const num = safeNumber(value);
  return num.toString();
}

export function isNumber(value: any): value is number {
  return typeof value === "number" && !isNaN(value);
}

export function isStringNumber(value: any): value is string {
  return typeof value === "string" && !isNaN(parseFloat(value));
}

export function ensureNumber(value: any): number {
  return safeNumber(value);
}

export const categories = [
  "All Categories",
  "Power Tools",
  "Hand Tools",
  "Electrical",
  "Plumbing",
  "Garden & Outdoor",
  "Safety Equipment",
  "Measuring Tools",
  "Cutting Tools",
  "Fastening Tools",
  "Woodworking Tools",
  "Metalworking Tools",
  "Concrete & Masonry",
  "Automotive Tools",
  "HVAC Tools",
  "Painting Tools",
  "Cleaning Equipment",
  "Lifting Equipment",
  "Welding Equipment",
  "Compressors & Pneumatics",
  "Generators & Power",
  "Test & Measurement",
  "Tool Storage",
  "Accessories",
  "Other",
];

export function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "available":
      return "bg-green-100 text-green-800";
    case "rented":
      return "bg-blue-100 text-blue-800";
    case "maintenance":
      return "bg-yellow-100 text-yellow-800";
    case "retired":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getConditionColor(condition: string) {
  switch (condition.toLowerCase()) {
    case "excellent":
      return "bg-green-50 text-green-700 border-green-200";
    case "good":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "fair":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "poor":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

export function getInterUseStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "active":
      return "bg-blue-100 text-blue-800";
    case "completed":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getRentalAvailabilityColor(canBeRented: boolean) {
  return canBeRented
    ? "bg-green-100 text-green-800"
    : "bg-gray-100 text-gray-800";
}

const categoryColors: { [key: string]: { color: string; bgColor: string } } = {
  "Power Tools": { color: "text-blue-600", bgColor: "bg-blue-50" },
  "Hand Tools": { color: "text-green-600", bgColor: "bg-green-50" },
  Electrical: { color: "text-purple-600", bgColor: "bg-purple-50" },
  Plumbing: { color: "text-orange-600", bgColor: "bg-orange-50" },
  "Garden & Outdoor": { color: "text-cyan-600", bgColor: "bg-cyan-50" },
  "Safety Equipment": { color: "text-red-600", bgColor: "bg-red-50" },
  "Measuring Tools": { color: "text-blue-600", bgColor: "bg-blue-50" },
  "Cutting Tools": { color: "text-green-600", bgColor: "bg-green-50" },
  "Fastening Tools": { color: "text-purple-600", bgColor: "bg-purple-50" },
  "Woodworking Tools": { color: "text-orange-600", bgColor: "bg-orange-50" },
  "Metalworking Tools": { color: "text-cyan-600", bgColor: "bg-cyan-50" },
  "Concrete & Masonry": { color: "text-red-600", bgColor: "bg-red-50" },
  "Automotive Tools": { color: "text-blue-600", bgColor: "bg-blue-50" },
  "HVAC Tools": { color: "text-green-600", bgColor: "bg-green-50" },
  "Painting Tools": { color: "text-purple-600", bgColor: "bg-purple-50" },
  "Cleaning Equipment": { color: "text-orange-600", bgColor: "bg-orange-50" },
  "Lifting Equipment": { color: "text-cyan-600", bgColor: "bg-cyan-50" },
  "Welding Equipment": { color: "text-red-600", bgColor: "bg-red-50" },
  "Compressors & Pneumatics": { color: "text-blue-600", bgColor: "bg-blue-50" },
  "Generators & Power": { color: "text-green-600", bgColor: "bg-green-50" },
  "Test & Measurement": { color: "text-purple-600", bgColor: "bg-purple-50" },
  "Tool Storage": { color: "text-orange-600", bgColor: "bg-orange-50" },
  Accessories: { color: "text-cyan-600", bgColor: "bg-cyan-50" },
  Other: { color: "text-gray-600", bgColor: "bg-gray-50" },
};

// Default fallback colors
const defaultColors = { color: "text-gray-600", bgColor: "bg-gray-50" };

export function getCategoryColors(category?: string | null) {
  if (!category) return defaultColors;
  return categoryColors[category] || defaultColors;
}

export const statusOptions = [
  "All Status",
  "Available",
  "Rented",
  "Maintenance",
  "Retired",
];
