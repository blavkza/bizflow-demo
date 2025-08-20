"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Project, ROLE_OPTIONS } from "../type";

const memberSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  members: z
    .array(
      z.object({
        userId: z.string().min(1, "User is required"),
        role: z.string().min(1, "Role is required"),
        canCreateTask: z.boolean().default(false),
        canEditTask: z.boolean().default(false),
        canDeleteTask: z.boolean().default(false),
        canUploadFiles: z.boolean().default(false),
        canDeleteFiles: z.boolean().default(false),
        canViewFinancial: z.boolean().default(false),
      })
    )
    .min(1, "At least one member is required"),
});

type MemberSchemaType = z.infer<typeof memberSchema>;
type MemberField = MemberSchemaType["members"][number];

interface User {
  id: string;
  name: string;
  email: string;
}

interface MemberFormProps {
  onSubmitSuccess?: () => void;
  project: Project;
}

const PERMISSION_FIELDS: {
  name: keyof MemberField;
  label: string;
}[] = [
  { name: "canCreateTask", label: "Can Create Tasks" },
  { name: "canEditTask", label: "Can Edit Tasks" },
  { name: "canDeleteTask", label: "Can Delete Tasks" },
  { name: "canUploadFiles", label: "Can Upload Files" },
  { name: "canDeleteFiles", label: "Can Delete Files" },
  { name: "canViewFinancial", label: "Can View Financial" },
];

export default function MemberForm({
  onSubmitSuccess,
  project,
}: MemberFormProps) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<MemberSchemaType>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      projectId: project.id,
      members: [],
    },
  });

  const { isSubmitting } = form.formState;
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "members",
  });

  // Define existingMembers properly
  const existingMembers =
    project.teamMembers?.map((member) => member.userId) || [];

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await axios.get("/api/users");
      const users: User[] = response?.data || [];

      setUsers(
        users.filter(
          (user) =>
            !existingMembers.includes(user.id) && user.id !== project.managerId
        )
      );
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error("Failed to load users");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddMember = () => {
    if (selectedUserIds.length === 0) return;

    selectedUserIds.forEach((userId) => {
      const user = users.find((u) => u.id === userId);
      if (user && !form.getValues("members").some((m) => m.userId === userId)) {
        append({
          userId,
          role: "MEMBER",
          canCreateTask: false,
          canEditTask: false,
          canDeleteTask: false,
          canUploadFiles: false,
          canDeleteFiles: false,
          canViewFinancial: false,
        });
      }
    });
    setSelectedUserIds([]);
  };

  const onSubmit = async (values: MemberSchemaType) => {
    try {
      await axios.post(`/api/projects/${project.id}/members`, values);
      toast.success("Members added successfully");
      form.reset();
      onSubmitSuccess?.();
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong!");
      console.error(error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[600px] max-h-[700px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Project Member</DialogTitle>
        </DialogHeader>

        {/* Show project manager information */}
        <div className="mb-4 p-3 rounded-lg">
          <h4 className="font-medium mb-2">Project Manager</h4>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-purple-100 text-purple-800">
              Manager
            </Badge>
            <span>{project.manager.name}</span>
          </div>
        </div>

        {/* Show existing members if any */}
        {project.teamMembers && project.teamMembers.length > 0 && (
          <div className="mb-4 p-3 rounded-lg">
            <h4 className="font-medium mb-2">Existing Members</h4>
            <div className="space-y-2">
              {project.teamMembers.map((member) => (
                <div key={member.userId} className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-blue-100 text-blue-800"
                  >
                    {member.role}
                  </Badge>
                  <span>{member.user?.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="flex gap-2">
                <MultiSelect
                  options={users.map((user) => ({
                    value: user.id,
                    label: user.name,
                  }))}
                  selected={selectedUserIds}
                  onChange={setSelectedUserIds}
                  placeholder="Select users to add..."
                  disabled={isLoadingUsers}
                  loading={isLoadingUsers}
                />
                <Button
                  type="button"
                  onClick={handleAddMember}
                  disabled={selectedUserIds.length === 0 || isLoadingUsers}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>

              {fields.map((field, index) => {
                const user = users.find((u) => u.id === field.userId);
                return (
                  <div
                    key={field.id}
                    className="border p-4 rounded-lg space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">
                        {user?.name || "Unknown User"} ({user?.email})
                      </h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <FormField
                      control={form.control}
                      name={`members.${index}.role`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ROLE_OPTIONS.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      {PERMISSION_FIELDS.map((permission) => (
                        <FormField
                          key={permission.name}
                          control={form.control}
                          name={`members.${index}.${permission.name}`}
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value as boolean}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel>{permission.label}</FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || fields.length === 0}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Add Members"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
