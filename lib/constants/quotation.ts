export const QUOTATION_STATUS = {
  DRAFT: "Draft",
  SENT: "Sent",
  VIEWED: "Viewed",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
} as const;

export type QuotationStatusType = keyof typeof QUOTATION_STATUS;

export const QUOTATION_STATUS_OPTIONS = Object.values(QUOTATION_STATUS).map(
  (status) => ({
    label: status,
    value: status.toUpperCase(),
  })
);

export const QUOTATION_SORT_OPTIONS = [
  { label: "Newest First", value: "newest" },
  { label: "Oldest First", value: "oldest" },
  { label: "Amount: High to Low", value: "amount-high" },
  { label: "Amount: Low to High", value: "amount-low" },
  { label: "Expiry Date", value: "expiry" },
];
