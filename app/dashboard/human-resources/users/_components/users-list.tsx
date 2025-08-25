"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MoreHorizontal,
  Shield,
  Mail,
  Phone,
  Calendar,
  Edit,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import UserForm from "./user-Form";
import { UserPermission, UserRole, UserStatus } from "@prisma/client";
import DeleteUserDialog from "./delete-user-dialog";
import { getRoleColor, getStatusColor, User } from "@/types/user";

interface UserslistProps {
  users: User[];
  fetchUsers: () => void;
  canDeleteUsers: boolean;
  canEditUsers: boolean;
  hasFullAccess: boolean;
}

export default function Userslist({
  users,
  fetchUsers,
  canDeleteUsers,
  canEditUsers,
  hasFullAccess,
}: UserslistProps) {
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedTab === "all") return matchesSearch;
    if (selectedTab === "active")
      return matchesSearch && user.status.toLowerCase() === "active";
    if (selectedTab === "inactive")
      return matchesSearch && user.status.toLowerCase() === "inactive";
    if (selectedTab === "suspended")
      return matchesSearch && user.status.toLowerCase() === "suspended";

    return matchesSearch;
  });

  const activeUsers = users.filter(
    (u) => u.status.toLowerCase() === "active"
  ).length;
  const inactiveUsers = users.filter(
    (u) => u.status.toLowerCase() === "inactive"
  ).length;
  const suspendedUsers = users.filter(
    (u) => u.status.toLowerCase() === "suspended"
  ).length;
  const totalUsers = users.length;

  const handleEdit = (user: User) => {
    setCurrentUser(user);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (user: User) => {
    setCurrentUser(user);
    setIsDeleteDialogOpen(true);
  };

  return (
    <>
      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="all">All Users ({totalUsers})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeUsers})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({inactiveUsers})</TabsTrigger>
          <TabsTrigger value="suspended">
            Suspended ({suspendedUsers})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4">
          <div className="grid gap-4">
            {filteredUsers.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between space-x-4">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={user.avatar || "/placeholder.svg"}
                          alt={user.name}
                        />
                        <AvatarFallback>
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-sm font-semibold">{user.name}</h4>
                          <Badge variant={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                          <Badge variant={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span>{user.email}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Phone className="h-3 w-3" />
                            <span>{user.phone}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Joined{" "}
                              {new Date(user.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.lastLogin ? (
                            <>
                              Last login:{" "}
                              {new Date(user.lastLogin).toLocaleDateString()} at{" "}
                              {new Date(user.lastLogin).toLocaleTimeString()}
                            </>
                          ) : (
                            "No recent login"
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {(canEditUsers || hasFullAccess) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <>
                            <DropdownMenuItem asChild>
                              <a href={`mailto:${user.email}`}>
                                <Mail className="h-4 w-4 mr-2" />
                                Send by Mail App
                              </a>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                              <a
                                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${user.email}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Mail className="h-4 w-4 mr-2" />
                                Send by Gmail
                              </a>
                            </DropdownMenuItem>
                          </>

                          {(canDeleteUsers || hasFullAccess) && (
                            <>
                              {" "}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 cursor-pointer"
                                onClick={() => handleDelete(user)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user account information.
            </DialogDescription>
          </DialogHeader>
          {currentUser && (
            <UserForm
              type="update"
              data={{
                ...currentUser,
                phone: currentUser.phone ?? undefined,
                status: currentUser.status as UserStatus,
              }}
              onCancel={() => setIsEditDialogOpen(false)}
              onSubmitSuccess={() => {
                setIsEditDialogOpen(false);
                if (fetchUsers) fetchUsers();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <DeleteUserDialog
        user={currentUser}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onDeleteSuccess={() => {
          setIsDeleteDialogOpen(false);
          if (fetchUsers) fetchUsers();
        }}
      />
    </>
  );
}
