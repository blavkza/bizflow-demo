// hooks/usePermissions.ts
import { useSession } from "next-auth/react";

type ResourceType = "file" | "folder" | "note";
type Action =
  | "view"
  | "upload"
  | "download"
  | "delete"
  | "rename"
  | "share"
  | "star";

interface PermissionContext {
  id?: string;
  ownerId?: string;
  shared?: boolean;
}

export function usePermissions() {
  const { data: session } = useSession();

  const can = (
    action: Action,
    resourceType: ResourceType,
    context?: PermissionContext
  ): boolean => {
    if (!session) return false;

    const userId = session.user.id;
    const userRole = session.user.role;

    // Admin can do everything
    if (userRole === "admin") return true;

    switch (resourceType) {
      case "file":
        return canFileAction(action, context, userId);
      case "folder":
        return canFolderAction(action, context, userId);
      case "note":
        return canNoteAction(action, context, userId);
      default:
        return false;
    }
  };

  const canFileAction = (
    action: Action,
    context?: PermissionContext,
    userId?: string
  ): boolean => {
    if (!context) return false;

    // File owner can do everything
    if (context.ownerId === userId) return true;

    switch (action) {
      case "view":
      case "download":
        // Can view/download if file is shared or user has access
        return context.shared === true;
      case "share":
      case "rename":
      case "delete":
        // Only owner can modify file
        return false;
      case "star":
        // Anyone with view access can star
        return context.shared === true;
      default:
        return false;
    }
  };

  const canFolderAction = (
    action: Action,
    context?: PermissionContext,
    userId?: string
  ): boolean => {
    if (!context) return false;

    // Folder owner can do everything
    if (context.ownerId === userId) return true;

    switch (action) {
      case "view":
        return true; // Assuming folder list is visible
      case "upload":
      case "download":
        // Can upload/download if user has write access
        return context.shared === true;
      case "delete":
      case "rename":
        // Only owner can modify folder
        return false;
      default:
        return false;
    }
  };

  const canNoteAction = (
    action: Action,
    context?: PermissionContext,
    userId?: string
  ): boolean => {
    // Similar logic for notes
    if (!context) return false;
    return context.ownerId === userId;
  };

  return { can };
}
