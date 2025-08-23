export const getFolderColor = (status: string | null) => {
  switch (status) {
    case "ACTIVE":
      return "text-blue-500 ";
    case "COMPLETED":
      return "text-green-500 ";
    case "ON_HOLD":
      return "text-orange-500 ";
    default:
      return "text-zinc-700 dark:text-zinc-200";
  }
};

export const getTaskStatusColor = (status: string | null) => {
  switch (status) {
    case "TODO":
      return "bg-blue-500 text-white";
    case "COMPLETED":
      return "bg-green-500 text-white";
    case "IN_PROGRESS":
      return "bg-orange-500 text-white";
    default:
      return "bg-muted text-white";
  }
};

export const getLastSegment = (url: string) => {
  const parts = url.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
};

export const isActive = (
  pathname: string,
  url?: string,
  alwaysActive = false
) => {
  if (!url) return false;

  const current = getLastSegment(pathname);
  const target = getLastSegment(url);

  if (alwaysActive) return current === target;
  return current === target;
};
