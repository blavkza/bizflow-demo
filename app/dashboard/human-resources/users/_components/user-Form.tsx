"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  createUserSchema,
  createUserSchemaType,
  updateUserSchema,
} from "@/lib/formValidationSchemas";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { UserRole, UserStatus, UserPermission, UserType } from "@prisma/client";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { PERMISSION_GROUPS } from "@/types/user";
import { EmployeeForUserLinking } from "@/types/employee";
import { FreelancerForUserLinking } from "@/types/freelancer";

interface UserFormProps {
  type: "create" | "update";
  data?: {
    id?: string;
    name?: string;
    email?: string;
    role?: UserRole;
    userName?: string;
    phone?: string | null;
    status: UserStatus;
    userType?: UserType;
    employeeId?: string;
    freelancerId?: string;
    permissions?: UserPermission[];
  };
  onCancel?: () => void;
  onSubmitSuccess?: () => void;
}

const formatPermissionName = (permission: UserPermission) => {
  return permission
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

export default function UserForm({
  type,
  data,
  onCancel,
  onSubmitSuccess,
}: UserFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [availableEmployees, setAvailableEmployees] = useState<
    EmployeeForUserLinking[]
  >([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  const [availableFreelancers, setAvailableFreelancers] = useState<
    FreelancerForUserLinking[]
  >([]);
  const [isLoadingFreelancers, setIsLoadingFreelancers] = useState(false);

  const [hasAutoFilled, setHasAutoFilled] = useState(false);

  const formSchema = type === "update" ? updateUserSchema : createUserSchema;
  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues:
      type === "update"
        ? {
            name: data?.name ?? "",
            phone: data?.phone ?? "",
            email: data?.email ?? "",
            role: data?.role ?? UserRole.VIEWER,
            status: data?.status ?? UserStatus.ACTIVE,
            userType: data?.userType ?? UserType.ADMIN,
            employeeId: data?.employeeId ?? "",
            freelancerId: data?.freelancerId ?? "",
            permissions: data?.permissions ?? [],
          }
        : {
            name: "",
            userName: "",
            phone: "",
            email: "",
            role: UserRole.VIEWER,
            status: UserStatus.ACTIVE,
            userType: UserType.ADMIN,
            employeeId: "",
            freelancerId: "",
            password: "",
            confirmPassword: "",
            permissions: [],
          },
  });

  const { isSubmitting } = form.formState;
  const selectedUserType = form.watch("userType");
  const selectedEmployeeId = form.watch("employeeId");
  const selectedFreelancerId = form.watch("freelancerId");

  const currentName = form.watch("name");
  const currentEmail = form.watch("email");
  const currentPhone = form.watch("phone");
  const currentUserName = form.watch("userName");

  // Fetch available employees
  useEffect(() => {
    const fetchAvailableEmployees = async () => {
      setIsLoadingEmployees(true);
      try {
        const url =
          type === "update" && data?.employeeId
            ? `/api/employees/available?includeCurrent=true&currentEmployeeId=${data.employeeId}`
            : "/api/employees/available";

        const response = await axios.get(url);
        setAvailableEmployees(response.data);
      } catch (error) {
        console.error("Error fetching employees:", error);
        toast.error("Failed to load available employees");
      } finally {
        setIsLoadingEmployees(false);
      }
    };

    fetchAvailableEmployees();
  }, [type, data?.employeeId]);

  // Fetch available freelancers
  useEffect(() => {
    const fetchAvailableFreelancers = async () => {
      setIsLoadingFreelancers(true);
      try {
        const url =
          type === "update" && data?.freelancerId
            ? `/api/freelancers/available?includeCurrent=true&currentFreelancerId=${data.freelancerId}`
            : "/api/freelancers/available";

        const response = await axios.get(url);
        setAvailableFreelancers(response.data);
      } catch (error) {
        console.error("Error fetching freelancers:", error);
        toast.error("Failed to load available freelancers");
      } finally {
        setIsLoadingFreelancers(false);
      }
    };

    fetchAvailableFreelancers();
  }, [type, data?.freelancerId]);

  // Get selected employee details
  const selectedEmployee = availableEmployees.find(
    (emp) => emp.id === selectedEmployeeId,
  );

  // Get selected freelancer details
  const selectedFreelancer = availableFreelancers.find(
    (fl) => fl.id === selectedFreelancerId,
  );

  // Get currently linked employee for update
  const currentLinkedEmployee =
    type === "update" && data?.employeeId
      ? availableEmployees.find((emp) => emp.id === data.employeeId)
      : null;

  // Get currently linked freelancer for update
  const currentLinkedFreelancer =
    type === "update" && data?.freelancerId
      ? availableFreelancers.find((fl) => fl.id === data.freelancerId)
      : null;

  // Auto-fill user details from employee/freelancer
  useEffect(() => {
    const entity = selectedEmployee || selectedFreelancer;
    const entityId = selectedEmployee
      ? selectedEmployeeId
      : selectedFreelancerId;

    if (
      entity &&
      entityId !== "no-employee" &&
      entityId !== "no-freelancer" &&
      !hasAutoFilled
    ) {
      const shouldAutoFill = () => {
        const isNameEmpty = !currentName || currentName.trim() === "";
        const isEmailEmpty = !currentEmail || currentEmail.trim() === "";
        const isPhoneEmpty = !currentPhone || currentPhone.trim() === "";
        const isUserNameEmpty =
          type === "create" &&
          (!currentUserName || currentUserName.trim() === "");

        return (
          isNameEmpty &&
          isEmailEmpty &&
          isPhoneEmpty &&
          (type === "update" || isUserNameEmpty)
        );
      };

      if (shouldAutoFill()) {
        const fullName = `${entity.firstName} ${entity.lastName}`;

        if (!currentName || currentName.trim() === "") {
          form.setValue("name", fullName);
        }

        if (!currentEmail || currentEmail.trim() === "") {
          form.setValue("email", entity.email || "");
        }

        if (!currentPhone || currentPhone.trim() === "") {
          form.setValue("phone", entity.phone || "");
        }

        if (
          type === "create" &&
          (!currentUserName || currentUserName.trim() === "")
        ) {
          const idNum = selectedEmployee
            ? selectedEmployee.employeeNumber
            : (selectedFreelancer as any).freelancerNumber; // Assuming interface match
          form.setValue("userName", idNum);
        }

        setHasAutoFilled(true);
        toast.info("User details auto-filled from selected identity");
      }
    }
  }, [
    selectedEmployee,
    selectedFreelancer,
    selectedEmployeeId,
    selectedFreelancerId,
    currentName,
    currentEmail,
    currentPhone,
    currentUserName,
    type,
    form,
    hasAutoFilled,
  ]);

  // Reset auto-fill flag
  useEffect(() => {
    if (
      (selectedEmployeeId === "no-employee" || !selectedEmployeeId) &&
      (selectedFreelancerId === "no-freelancer" || !selectedFreelancerId)
    ) {
      setHasAutoFilled(false);
    }
  }, [selectedEmployeeId, selectedFreelancerId]);

  const onSubmit = async (values: FormValues) => {
    try {
      console.log("Submitting form data:", values);

      const submitData = {
        ...values,
        employeeId:
          values.employeeId === "no-employee" ? null : values.employeeId,
        freelancerId:
          values.freelancerId === "no-freelancer" ? null : values.freelancerId,
      };

      if (type === "create") {
        await axios.post("/api/users", submitData);
        toast.success("User created successfully");
      } else if (type === "update" && data?.id) {
        await axios.put(`/api/users/${data.id}`, submitData);
        toast.success("User updated successfully");
      }

      form.reset();
      router.refresh();
      onSubmitSuccess?.();
      onCancel?.();
    } catch (error: any) {
      console.error("Form submission error:", error);
      const errorMessage =
        error.response?.data?.error || "Something went wrong!";
      toast.error(errorMessage);
    }
  };

  const toggleAllPermissions = (
    categoryPermissions: UserPermission[],
    value: boolean,
  ) => {
    const currentPermissions = [...form.getValues("permissions")];
    let updatedPermissions: UserPermission[];

    if (value) {
      updatedPermissions = [
        ...new Set([...currentPermissions, ...categoryPermissions]),
      ];
    } else {
      updatedPermissions = currentPermissions.filter(
        (permission) => !categoryPermissions.includes(permission),
      );
    }

    form.setValue("permissions", updatedPermissions);
  };

  const areAllPermissionsEnabled = (categoryPermissions: UserPermission[]) => {
    const currentPermissions = form.watch("permissions");
    return categoryPermissions.every((permission) =>
      currentPermissions.includes(permission),
    );
  };

  const fillFromEntity = () => {
    const entity = selectedEmployee || selectedFreelancer;
    if (entity) {
      const fullName = `${entity.firstName} ${entity.lastName}`;
      form.setValue("name", fullName);

      if (entity.email) {
        form.setValue("email", entity.email);
      }

      if (entity.phone) {
        form.setValue("phone", entity.phone);
      }

      if (type === "create") {
        const idNum = selectedEmployee
          ? selectedEmployee.employeeNumber
          : (selectedFreelancer as any).freelancerNumber;

        const username =
          entity.email?.split("@")[0] ||
          idNum ||
          `${entity.firstName.toLowerCase()}.${entity.lastName.toLowerCase()}`;
        form.setValue("userName", username);
      }

      toast.success("User details filled");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Type Field */}
          <FormField
            control={form.control}
            name="userType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>User Type *</FormLabel>
                <Select
                  onValueChange={(val) => {
                    field.onChange(val);
                    // Reset identity fields on type change
                    if (val === "FREELANCER")
                      form.setValue("employeeId", "no-employee");
                    if (val === "EMPLOYEE")
                      form.setValue("freelancerId", "no-freelancer");
                  }}
                  value={field.value}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                    <SelectItem value="FREELANCER">Freelancer</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Employee Link Field */}
          {(selectedUserType === "EMPLOYEE" ||
            selectedUserType === "ADMIN") && (
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Link to Employee {selectedUserType === "EMPLOYEE" && "*"}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                    disabled={isLoadingEmployees}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isLoadingEmployees
                              ? "Loading employees..."
                              : "Select an employee (optional)"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="no-employee">
                        No employee linked
                      </SelectItem>
                      {availableEmployees.map((employee) => (
                        <SelectItem
                          key={employee.id}
                          value={employee.id}
                          disabled={
                            employee.isLinked &&
                            employee.id !== data?.employeeId
                          }
                        >
                          {employee.firstName} {employee.lastName} (
                          {employee.employeeNumber})
                          {employee.email && ` - ${employee.email}`}
                          {employee.isLinked &&
                            employee.id !== data?.employeeId &&
                            " (Already linked)"}
                        </SelectItem>
                      ))}
                      {availableEmployees.length === 0 &&
                        !isLoadingEmployees && (
                          <SelectItem value="no-available-employees" disabled>
                            No available employees found
                          </SelectItem>
                        )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Freelancer Link Field */}
          {(selectedUserType === "FREELANCER" ||
            selectedUserType === "ADMIN") && (
            <FormField
              control={form.control}
              name="freelancerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Link to Freelancer{" "}
                    {selectedUserType === "FREELANCER" && "*"}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                    disabled={isLoadingFreelancers}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isLoadingFreelancers
                              ? "Loading freelancers..."
                              : "Select a freelancer (optional)"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="no-freelancer">
                        No freelancer linked
                      </SelectItem>
                      {availableFreelancers.map((freelancer) => (
                        <SelectItem
                          key={freelancer.id}
                          value={freelancer.id}
                          disabled={
                            freelancer.isLinked &&
                            freelancer.id !== data?.freelancerId
                          }
                        >
                          {freelancer.firstName} {freelancer.lastName} (
                          {freelancer.freelancerNumber})
                          {freelancer.email && ` - ${freelancer.email}`}
                          {freelancer.isLinked &&
                            freelancer.id !== data?.freelancerId &&
                            " (Already linked)"}
                        </SelectItem>
                      ))}
                      {availableFreelancers.length === 0 &&
                        !isLoadingFreelancers && (
                          <SelectItem value="no-available-freelancers" disabled>
                            No available freelancers found
                          </SelectItem>
                        )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Show currently linked employee/freelancer info for update */}
          {type === "update" && (
            <>
              {currentLinkedEmployee && !selectedEmployeeId && (
                <div className="md:col-span-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="font-medium text-amber-900">
                    Currently Linked Employee:
                  </h4>
                  <p className="text-sm text-amber-800">
                    <strong>Name:</strong> {currentLinkedEmployee.firstName}{" "}
                    {currentLinkedEmployee.lastName}
                    <br />
                    <strong>Employee #:</strong>{" "}
                    {currentLinkedEmployee.employeeNumber}
                    <br />
                  </p>
                </div>
              )}
              {currentLinkedFreelancer && !selectedFreelancerId && (
                <div className="md:col-span-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="font-medium text-amber-900">
                    Currently Linked Freelancer:
                  </h4>
                  <p className="text-sm text-amber-800">
                    <strong>Name:</strong> {currentLinkedFreelancer.firstName}{" "}
                    {currentLinkedFreelancer.lastName}
                    <br />
                    <strong>Freelancer #:</strong>{" "}
                    {currentLinkedFreelancer.freelancerNumber}
                    <br />
                  </p>
                </div>
              )}
            </>
          )}

          {/* Show selected entity info */}
          {(selectedEmployee && selectedEmployeeId !== "no-employee") ||
          (selectedFreelancer && selectedFreelancerId !== "no-freelancer") ? (
            <div className="md:col-span-2 p-3 bg-blue-50 dark:bg-zinc-600 border border-blue-200  rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-zinc-300">
                    Selected {selectedEmployee ? "Employee" : "Freelancer"}:
                  </h4>
                  {selectedEmployee && (
                    <p className="text-sm text-blue-800 dark:text-zinc-300">
                      <strong>Name:</strong> {selectedEmployee.firstName}{" "}
                      {selectedEmployee.lastName}
                      <br />
                      <strong>Employee #:</strong>{" "}
                      {selectedEmployee.employeeNumber}
                      <br />
                      <strong>Position:</strong> {selectedEmployee.position}
                    </p>
                  )}
                  {selectedFreelancer && (
                    <p className="text-sm text-blue-800 dark:text-zinc-300">
                      <strong>Name:</strong> {selectedFreelancer.firstName}{" "}
                      {selectedFreelancer.lastName}
                      <br />
                      <strong>Freelancer #:</strong>{" "}
                      {selectedFreelancer.freelancerNumber}
                      <br />
                      <strong>Position:</strong> {selectedFreelancer.position}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={fillFromEntity}
                  className="bg-white dark:bg-zinc-600  hover:bg-blue-100 dark:hover:bg-zinc-400"
                >
                  Fill User Details
                </Button>
              </div>
            </div>
          ) : null}

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {type === "create" && (
            <FormField
              control={form.control}
              name="userName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter email" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Enter phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {type === "create" && (
            <>
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password *</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter password"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password *</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm password"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(UserStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status
                          .replace(/_/g, " ")
                          .toLowerCase()
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(UserRole).map((role) => (
                      <SelectItem key={role} value={role}>
                        {role
                          .replace(/_/g, " ")
                          .toLowerCase()
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Permissions Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Permissions</h3>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const allPermissions = Object.values(UserPermission);
                  form.setValue("permissions", allPermissions);
                }}
              >
                Enable All
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  form.setValue("permissions", []);
                }}
              >
                Disable All
              </Button>
            </div>
          </div>

          {/* Info messages */}
          {selectedUserType === UserType.EMPLOYEE && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>Employee User:</strong> This user is linked to an
                employee record but can still have system permissions.
              </p>
            </div>
          )}

          {selectedUserType === UserType.FREELANCER && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>Freelancer User:</strong> This user is linked to a
                freelancer record but can still have system permissions.
              </p>
            </div>
          )}

          {selectedUserType === UserType.ADMIN &&
            (selectedEmployee || selectedFreelancer) && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 text-sm">
                  <strong>Admin with Identity Link:</strong> This admin user is
                  also linked to an{" "}
                  {selectedEmployee ? "employee" : "freelancer"} record.
                </p>
              </div>
            )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.name} className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{group.name}</h4>
                  <Switch
                    checked={areAllPermissionsEnabled(group.permissions)}
                    onCheckedChange={(checked) =>
                      toggleAllPermissions(group.permissions, checked)
                    }
                  />
                </div>

                <div className="space-y-3">
                  {group.permissions.map((permission) => (
                    <FormField
                      key={permission}
                      control={form.control}
                      name="permissions"
                      render={({ field }) => {
                        return (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(permission)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([
                                        ...field.value,
                                        permission,
                                      ])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== permission,
                                        ),
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal text-sm cursor-pointer">
                              {formatPermissionName(permission)}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : type === "create" ? (
              "Create User"
            ) : (
              "Update User"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
