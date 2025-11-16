import { FileText, ImageIcon, Video, Music, Archive } from "lucide-react";

interface FileIconProps {
  type: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function FileIcon({
  type,
  size = "md",
  className = "",
}: FileIconProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const getFileColor = (): string => {
    if (type.startsWith("image/")) return "text-blue-500";
    if (type.startsWith("video/")) return "text-purple-500";
    if (type.startsWith("audio/")) return "text-green-500";
    if (type.includes("pdf")) return "text-red-500";
    if (type.includes("zip") || type.includes("rar")) return "text-yellow-500";
    return "text-gray-500";
  };

  const baseClassName = `${sizeClasses[size]} ${getFileColor()} ${className}`;

  if (type.startsWith("image/")) return <ImageIcon className={baseClassName} />;
  if (type.startsWith("video/")) return <Video className={baseClassName} />;
  if (type.startsWith("audio/")) return <Music className={baseClassName} />;
  if (type.includes("pdf")) return <FileText className={baseClassName} />;
  if (type.includes("zip") || type.includes("rar"))
    return <Archive className={baseClassName} />;

  return <FileText className={baseClassName} />;
}
