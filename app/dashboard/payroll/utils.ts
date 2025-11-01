export function generateMonthOptions() {
  const months = [];
  const today = new Date();

  for (let i = 0; i < 12; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    months.push({
      value: `${year}-${month}`,
      label: date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      }),
    });
  }

  return months;
}

export const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return "R0.00";
  }
  return `R${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatNumber = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return "0";
  }
  return value.toString();
};

export const formatHours = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return "0h";
  }
  return `${value.toFixed(1)}h`;
};
