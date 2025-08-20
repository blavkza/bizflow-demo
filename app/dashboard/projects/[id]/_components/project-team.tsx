"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  Mail,
  MoreHorizontal,
  Crown,
  Shield,
  User,
  Trash2,
  Key,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { PERMISSIONS, ProjectTeam, ROLE_OPTIONS } from "../type";
import { toast } from "sonner";

interface ProjectTeamProps {
  teamMembers: ProjectTeam[];
  projectId: string;
  onUpdateTeam?: () => void;
  currentUserRole: string | null;
  isManager: boolean;
}

export function ProjectTeams({
  teamMembers,
  projectId,
  onUpdateTeam,
  currentUserRole,
  isManager,
}: ProjectTeamProps) {
  const [selectedMember, setSelectedMember] = useState<ProjectTeam | null>(
    null
  );
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  const showInvoicesButton = currentUserRole === "ADMIN" || isManager;

  const getRoleIcon = (role: string) => {
    switch (role.toUpperCase()) {
      case "PROJECT_MANAGER":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "ADMIN":
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role.toUpperCase()) {
      case "PROJECT_MANAGER":
        return "default";
      case "ADMIN":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const handleRoleChange = async () => {
    if (!selectedMember || !newRole) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/members/${selectedMember.userId}/role`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update role");
      }
      toast.success("Role updated successfully");
      setIsRoleDialogOpen(false);
      onUpdateTeam?.();
    } catch (error) {
      toast.error("Error updating role");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionsUpdate = async () => {
    if (!selectedMember) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/members/${selectedMember.userId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            canCreateTask: permissions.canCreateTask || false,
            canEditTask: permissions.canEditTask || false,
            canDeleteTask: permissions.canDeleteTask || false,
            canUploadFiles: permissions.canUploadFiles || false,
            canDeleteFiles: permissions.canDeleteFiles || false,
            canViewFinancial: permissions.canViewFinancial || false,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update permissions");
      }

      toast.success("Permissions updated successfully");
      setIsPermissionsDialogOpen(false);
      onUpdateTeam?.();
    } catch (error) {
      toast.error("Error updating permissions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/members/${selectedMember.userId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove member");
      }

      toast.success("Member removed successfully");
      setIsRemoveDialogOpen(false);
      onUpdateTeam?.();
    } catch (error) {
      toast.error("Error removing Members");
    } finally {
      setIsLoading(false);
    }
  };

  const openRoleDialog = (member: ProjectTeam) => {
    setSelectedMember(member);
    setNewRole(member.role);
    setIsRoleDialogOpen(true);
  };

  const openPermissionsDialog = (member: ProjectTeam) => {
    setSelectedMember(member);
    setPermissions({
      canCreateTask: member.canCreateTask,
      canEditTask: member.canEditTask,
      canDeleteTask: member.canDeleteTask,
      canUploadFiles: member.canUploadFiles,
      canDeleteFiles: member.canDeleteFiles,
      canViewFinancial: member.canViewFinancial,
    });
    setIsPermissionsDialogOpen(true);
  };

  const openRemoveDialog = (member: ProjectTeam) => {
    setSelectedMember(member);
    setIsRemoveDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Role Change Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Change Role for {selectedMember?.user?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRoleDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleRoleChange} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog
        open={isPermissionsDialogOpen}
        onOpenChange={setIsPermissionsDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Manage Permissions for {selectedMember?.user?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {PERMISSIONS.map((permission) => (
              <div
                key={permission.name}
                className="flex items-center space-x-2"
              >
                <Checkbox
                  id={permission.name}
                  checked={permissions[permission.name] || false}
                  onCheckedChange={(checked) =>
                    setPermissions({
                      ...permissions,
                      [permission.name]: !!checked,
                    })
                  }
                />
                <Label htmlFor={permission.name}>{permission.label}</Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPermissionsDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handlePermissionsUpdate} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Permissions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Dialog */}
      <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to remove {selectedMember?.user?.name} from
              this project?
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRemoveDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveMember}
              disabled={isLoading}
            >
              {isLoading ? "Removing..." : "Remove Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Team Members List */}
      {teamMembers.length === 0 ? (
        <div className="flex items-center justify-center h-[150px] rounded-lg border border-dashed">
          <div className="text-center">
            <h3 className="text-lg font-medium">No team members</h3>
            <p className="text-sm text-muted-foreground">
              Add members to your project to collaborate
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teamMembers.map((member) => (
            <Card key={member.id}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={member.user?.avatar || "/placeholder-user.jpg"}
                      alt={member.user?.name}
                    />
                    <AvatarFallback>
                      {member.user?.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4
                        className="text-sm font-medium truncate"
                        title={member.user?.name}
                      >
                        {member.user?.name}
                      </h4>
                      {showInvoicesButton && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Mail className="mr-2 h-4 w-4" />
                              Send Message
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openRoleDialog(member)}
                            >
                              <User className="mr-2 h-4 w-4" />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openPermissionsDialog(member)}
                            >
                              <Key className="mr-2 h-4 w-4" />
                              Manage Permissions
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => openRemoveDialog(member)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove from Project
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 mt-1">
                      <Badge
                        variant={getRoleBadgeVariant(member.role)}
                        className="text-xs"
                      >
                        <span className="mr-1">{getRoleIcon(member.role)}</span>
                        {ROLE_OPTIONS.find((r) => r.value === member.role)
                          ?.label || member.role}
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate">
                        {member.user?.email}
                      </span>
                    </div>
                    <div className="m-2 text-sm text-muted-foreground">
                      Permission :{" "}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {member.canCreateTask && (
                        <Badge variant="outline" className="text-xs">
                          Create Tasks
                        </Badge>
                      )}
                      {member.canEditTask && (
                        <Badge variant="outline" className="text-xs">
                          Edit Tasks
                        </Badge>
                      )}
                      {member.canDeleteTask && (
                        <Badge variant="outline" className="text-xs">
                          Delete Tasks
                        </Badge>
                      )}
                      {member.canUploadFiles && (
                        <Badge variant="outline" className="text-xs">
                          Upload Files
                        </Badge>
                      )}
                      {member.canDeleteFiles && (
                        <Badge variant="outline" className="text-xs">
                          Delete Files
                        </Badge>
                      )}
                      {member.canViewFinancial && (
                        <Badge variant="outline" className="text-xs">
                          View Financial
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
