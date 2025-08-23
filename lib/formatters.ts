export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const getInitials = (name?: string) => {
  if (!name) return "US";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

export const getStatusColor = (status: string | null) => {
  switch (status) {
    case "ACTIVE":
      return "bg-blue-500 text-white";
    case "COMPLETED":
      return "bg-green-500 text-white";
    case "ON_HOLD":
      return "bg-orange-500 text-white";
    default:
      return "bg-zinc-700 dark:bg-zinc-500 text-white";
  }
};
