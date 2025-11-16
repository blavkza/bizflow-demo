"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  CalendarIcon,
  Loader2,
  Plus,
  Trash2,
  List,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Priority, TaskStatus } from "@prisma/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Schemas
export const subtaskSchema = z.object({
  title: z.string().min(1, "Subtask title is required"),
  description: z.string().optional(),
  estimatedHours: z.number().optional(),
  status: z.nativeEnum(TaskStatus).optional().default(TaskStatus.TODO),
});

export const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  projectId: z.string().min(1, "Project is required").optional(),
  status: z.nativeEnum(TaskStatus),
  priority: z.nativeEnum(Priority),
  dueDate: z
    .union([z.date(), z.string().transform((str) => new Date(str))])
    .optional()
    .nullable()
    .transform((val) => (val instanceof Date ? val : null)),
  estimatedHours: z.number().optional(),
  assigneeIds: z.array(z.string()).optional(),
  freelancerIds: z.array(z.string()).optional(),
  isAIGenerated: z.boolean().optional().default(false),
  subtasks: z.array(subtaskSchema).optional().default([]),
});

export const multiTaskSchema = z.object({
  tasks: z.array(taskSchema).min(1, "At least one task is required"),
});

export type TaskSchemaType = z.infer<typeof taskSchema>;
export type SubtaskSchemaType = z.infer<typeof subtaskSchema>;
export type MultiTaskSchemaType = z.infer<typeof multiTaskSchema>;

type Employee = {
  id: string;
  employeeId: string;
  name: string;
  email: string;
};

type Freelancer = {
  id: string;
  freelancerId: string;
  firstName: string;
  lastName: string;
  email: string;
};

interface TaskFormProps {
  type: "create" | "update";
  data?: {
    id?: string;
    title?: string;
    description?: string;
    projectId?: string;
    status?: TaskStatus;
    priority?: Priority;
    dueDate?: Date;
    estimatedHours?: number;
    assignees?: { id: string }[];
    freeLancerAssignees?: { id: string }[];
    isAIGenerated?: boolean;
    subtasks?: any[];
  };
  projectId: string;
  onCancel?: () => void;
  onSubmitSuccess?: () => void;
}

export default function TaskForm({
  type,
  data,
  projectId,
  onCancel,
  onSubmitSuccess,
}: TaskFormProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isMultiTaskMode, setIsMultiTaskMode] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<number[]>([]);
  const router = useRouter();

  // For single task mode
  const singleTaskForm = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: data?.title || "",
      description: data?.description || "",
      projectId: projectId,
      status: data?.status || TaskStatus.TODO,
      priority: data?.priority || Priority.MEDIUM,
      dueDate: data?.dueDate || null,
      estimatedHours: data?.estimatedHours,
      assigneeIds: data?.assignees?.map((a) => a.id) || [],
      freelancerIds: data?.freeLancerAssignees?.map((f) => f.id) || [],
      isAIGenerated: data?.isAIGenerated || false,
      subtasks: data?.subtasks || [],
    },
  });

  // For multi task mode
  const multiTaskForm = useForm<z.infer<typeof multiTaskSchema>>({
    resolver: zodResolver(multiTaskSchema),
    defaultValues: {
      tasks: [
        {
          title: "",
          description: "",
          projectId: projectId,
          status: TaskStatus.TODO,
          priority: Priority.MEDIUM,
          dueDate: null,
          estimatedHours: undefined,
          assigneeIds: [],
          freelancerIds: [],
          isAIGenerated: false,
          subtasks: [],
        },
      ],
    },
  });

  const {
    fields: taskFields,
    append: appendTask,
    remove: removeTask,
  } = useFieldArray({
    control: multiTaskForm.control,
    name: "tasks",
  });

  const {
    fields: subtaskFields,
    append: appendSubtask,
    remove: removeSubtask,
  } = useFieldArray({
    control: singleTaskForm.control,
    name: "subtasks",
  });

  const toggleTaskExpansion = (index: number) => {
    setExpandedTasks((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // Function to separate selected IDs into employees and freelancers
  const separateAssignees = (selectedIds: string[]) => {
    const employeeIds: string[] = [];
    const freelancerIds: string[] = [];

    selectedIds.forEach((id) => {
      if (employees.some((emp) => emp.id === id)) {
        employeeIds.push(id);
      } else if (freelancers.some((freelancer) => freelancer.id === id)) {
        freelancerIds.push(id);
      }
    });

    return { employeeIds, freelancerIds };
  };

  const onSubmitSingle = async (values: z.infer<typeof taskSchema>) => {
    try {
      setIsLoading(true);

      // For single task mode, we already have separate fields
      const submitData = {
        ...values,
        projectId: projectId, // Ensure projectId is set
      };

      console.log("Submitting single task:", submitData);

      if (type === "create") {
        await axios.post("/api/tasks", submitData);
        toast.success("Task created successfully");
      } else if (type === "update" && data?.id) {
        await axios.put(`/api/tasks/${data.id}`, submitData);
        toast.success("Task updated successfully");
      }

      onSubmitSuccess?.();
      router.refresh();
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(error.response?.data?.error || "Something went wrong!");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitMulti = async (values: z.infer<typeof multiTaskSchema>) => {
    try {
      setIsLoading(true);

      // Process each task to ensure proper data structure
      const processedTasks = values.tasks.map((task) => ({
        ...task,
        projectId: projectId,
        // For multi-task mode, we need to separate the assignees
        ...separateAssignees(task.assigneeIds || []),
      }));

      // Validate that at least one task has a title
      const validTasks = processedTasks.filter(
        (task) => task.title && task.title.trim() !== ""
      );

      if (validTasks.length === 0) {
        toast.error("At least one task must have a title");
        return;
      }

      console.log("Submitting multiple tasks:", validTasks);

      if (type === "create") {
        await axios.post("/api/tasks", { tasks: validTasks });
        toast.success(`${validTasks.length} tasks created successfully`);
      } else {
        toast.error("Bulk update is not supported");
        return;
      }

      onSubmitSuccess?.();
      router.refresh();
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(error.response?.data?.error || "Something went wrong!");
    } finally {
      setIsLoading(false);
    }
  };

  // Custom handler for multi-select changes in multi-task mode
  const handleMultiSelectChange = (index: number, selectedIds: string[]) => {
    const { employeeIds, freelancerIds } = separateAssignees(selectedIds);

    // Update both fields in the form
    multiTaskForm.setValue(`tasks.${index}.assigneeIds`, employeeIds);
    multiTaskForm.setValue(`tasks.${index}.freelancerIds`, freelancerIds);
  };

  // Custom handler for multi-select changes in single task mode
  const handleSingleMultiSelectChange = (selectedIds: string[]) => {
    const { employeeIds, freelancerIds } = separateAssignees(selectedIds);

    // Update both fields in the form
    singleTaskForm.setValue("assigneeIds", employeeIds);
    singleTaskForm.setValue("freelancerIds", freelancerIds);
  };

  const generateAITasks = async () => {
    try {
      setIsGeneratingAI(true);
      const prompt =
        singleTaskForm.getValues("title") || "General project tasks";

      const response = await axios.post("/api/ai/tasks", {
        prompt,
        projectId,
      });

      const { tasks } = response.data;

      if (isMultiTaskMode) {
        // Set multiple AI-generated tasks with projectId
        const tasksWithProjectId = tasks.map((task: any) => ({
          ...task,
          projectId: projectId,
        }));
        multiTaskForm.setValue("tasks", tasksWithProjectId);
        toast.success(`Generated ${tasks.length} tasks with AI`);
      } else {
        // Set single AI-generated task with subtasks
        const aiTask = tasks[0];
        singleTaskForm.setValue("title", aiTask.title);
        singleTaskForm.setValue("description", aiTask.description);
        singleTaskForm.setValue("status", aiTask.status);
        singleTaskForm.setValue("priority", aiTask.priority);
        singleTaskForm.setValue("estimatedHours", aiTask.estimatedHours);
        singleTaskForm.setValue("subtasks", aiTask.subtasks || []);
        singleTaskForm.setValue("isAIGenerated", true);
        toast.success("Task generated with AI including subtasks");
      }
    } catch (error) {
      console.error("AI generation error:", error);
      toast.error("Failed to generate tasks with AI");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const fetchAssignees = async () => {
    try {
      setIsLoading(true);
      const [employeesResponse, freelancersResponse] = await Promise.all([
        axios.get("/api/employees"),
        axios.get("/api/freelancers"),
      ]);

      setEmployees(employeesResponse.data.employees || []);
      setFreelancers(freelancersResponse.data.freelancers || []);
    } catch (err) {
      console.error("Error fetching assignees:", err);
      toast.error("Failed to load assignees");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignees();
  }, []);

  // Don't allow multi-task mode for updates
  useEffect(() => {
    if (type === "update" && isMultiTaskMode) {
      setIsMultiTaskMode(false);
    }
  }, [type, isMultiTaskMode]);

  // Update projectId when projectId prop changes
  useEffect(() => {
    if (isMultiTaskMode) {
      const currentTasks = multiTaskForm.getValues("tasks") || [];
      const updatedTasks = currentTasks.map((task) => ({
        ...task,
        projectId: projectId,
      }));
      multiTaskForm.setValue("tasks", updatedTasks);
    }
  }, [projectId, isMultiTaskMode, multiTaskForm]);

  // Combine employees and freelancers for the assignee options
  const employeeOptions = employees.map((employee) => ({
    label: `${employee.name} (Employee)`,
    value: employee.id,
  }));

  const freelancerOptions = freelancers.map((freelancer) => ({
    label: `${freelancer.firstName} ${freelancer.lastName} (Freelancer)`,
    value: freelancer.id,
  }));

  const allAssigneeOptions = [...employeeOptions, ...freelancerOptions];

  // Get combined selected IDs for display in multi-select
  const getCombinedSelectedIds = (
    assigneeIds: string[] = [],
    freelancerIds: string[] = []
  ) => {
    return [...assigneeIds, ...freelancerIds];
  };

  return (
    <div className="space-y-4">
      {type === "create" && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              id="multi-task-mode"
              checked={isMultiTaskMode}
              onCheckedChange={setIsMultiTaskMode}
            />
            <Label htmlFor="multi-task-mode" className="flex items-center">
              <List className="mr-2 h-4 w-4" />
              Create Multiple Tasks
            </Label>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={generateAITasks}
            disabled={isGeneratingAI}
            className="flex items-center text-blue-600 hover:text-blue-600"
          >
            {isGeneratingAI ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            AI Generate
          </Button>
        </div>
      )}

      {!isMultiTaskMode ? (
        <Form {...singleTaskForm}>
          <form
            onSubmit={singleTaskForm.handleSubmit(onSubmitSingle)}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={singleTaskForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Task Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Task Title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={singleTaskForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter Description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={singleTaskForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(TaskStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={singleTaskForm.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(Priority).map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {priority}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={singleTaskForm.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={singleTaskForm.control}
                name="estimatedHours"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Estimated Hours (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter estimated hours"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value)
                          )
                        }
                        value={field.value || ""}
                        min="0"
                        step="0.5"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem className="md:col-span-2">
                <FormLabel>Assignees (Employees & Freelancers)</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={allAssigneeOptions}
                    selected={getCombinedSelectedIds(
                      singleTaskForm.watch("assigneeIds"),
                      singleTaskForm.watch("freelancerIds")
                    )}
                    onChange={handleSingleMultiSelectChange}
                    placeholder="Select assignees..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              {/* Subtasks Section */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel>Subtasks</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      appendSubtask({
                        title: "",
                        description: "",
                        estimatedHours: undefined,
                        status: TaskStatus.TODO,
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subtask
                  </Button>
                </div>

                {subtaskFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-start gap-2 p-3 border rounded-md"
                  >
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                      <FormField
                        control={singleTaskForm.control}
                        name={`subtasks.${index}.title`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Subtask title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={singleTaskForm.control}
                        name={`subtasks.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              Description
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Description" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={singleTaskForm.control}
                        name={`subtasks.${index}.estimatedHours`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Hours</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Hours"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ""
                                      ? undefined
                                      : Number(e.target.value)
                                  )
                                }
                                value={field.value || ""}
                                min="0"
                                step="0.5"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={singleTaskForm.control}
                        name={`subtasks.${index}.status`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Status</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.values(TaskStatus).map((status) => (
                                  <SelectItem key={status} value={status}>
                                    {status}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSubtask(index)}
                      className="mt-6"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="min-w-24"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="min-w-24">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : type === "create" ? (
                  "Create Task"
                ) : (
                  "Update Task"
                )}
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        <Form {...multiTaskForm}>
          <form
            onSubmit={multiTaskForm.handleSubmit(onSubmitMulti)}
            className="space-y-6"
          >
            <div className="space-y-4">
              {taskFields.map((field, index) => (
                <div key={field.id} className="rounded-lg border p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">Task #{index + 1}</h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTaskExpansion(index)}
                      >
                        {expandedTasks.includes(index) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {taskFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTask(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={multiTaskForm.control}
                      name={`tasks.${index}.title`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Task Title *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter Task Title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={multiTaskForm.control}
                      name={`tasks.${index}.description`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter Description"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={multiTaskForm.control}
                      name={`tasks.${index}.status`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.values(TaskStatus).map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={multiTaskForm.control}
                      name={`tasks.${index}.priority`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.values(Priority).map((priority) => (
                                <SelectItem key={priority} value={priority}>
                                  {priority}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={multiTaskForm.control}
                      name={`tasks.${index}.dueDate`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Due Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date <
                                  new Date(new Date().setHours(0, 0, 0, 0))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={multiTaskForm.control}
                      name={`tasks.${index}.estimatedHours`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Estimated Hours (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter estimated hours"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === ""
                                    ? undefined
                                    : Number(e.target.value)
                                )
                              }
                              value={field.value || ""}
                              min="0"
                              step="0.5"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormItem className="md:col-span-2">
                      <FormLabel>Assignees (Employees & Freelancers)</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={allAssigneeOptions}
                          selected={getCombinedSelectedIds(
                            multiTaskForm.watch(`tasks.${index}.assigneeIds`),
                            multiTaskForm.watch(`tasks.${index}.freelancerIds`)
                          )}
                          onChange={(selectedIds) =>
                            handleMultiSelectChange(index, selectedIds)
                          }
                          placeholder="Select assignees..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </div>

                  {/* Subtasks Section for Multi-Task Mode */}
                  <Collapsible open={expandedTasks.includes(index)}>
                    <CollapsibleContent>
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between mb-4">
                          <FormLabel>Subtasks</FormLabel>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const currentSubtasks =
                                multiTaskForm.getValues(
                                  `tasks.${index}.subtasks`
                                ) || [];
                              multiTaskForm.setValue(
                                `tasks.${index}.subtasks`,
                                [
                                  ...currentSubtasks,
                                  {
                                    title: "",
                                    description: "",
                                    estimatedHours: undefined,
                                    status: TaskStatus.TODO,
                                  },
                                ]
                              );
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Subtask
                          </Button>
                        </div>

                        {(
                          multiTaskForm.getValues(`tasks.${index}.subtasks`) ||
                          []
                        ).map((_, subtaskIndex) => (
                          <div
                            key={subtaskIndex}
                            className="flex items-start gap-2 p-3 border rounded-md mb-2"
                          >
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                              <FormField
                                control={multiTaskForm.control}
                                name={`tasks.${index}.subtasks.${subtaskIndex}.title`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">
                                      Title
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Subtask title"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={multiTaskForm.control}
                                name={`tasks.${index}.subtasks.${subtaskIndex}.description`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">
                                      Description
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Description"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={multiTaskForm.control}
                                name={`tasks.${index}.subtasks.${subtaskIndex}.estimatedHours`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">
                                      Hours
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        placeholder="Hours"
                                        {...field}
                                        onChange={(e) =>
                                          field.onChange(
                                            e.target.value === ""
                                              ? undefined
                                              : Number(e.target.value)
                                          )
                                        }
                                        value={field.value || ""}
                                        min="0"
                                        step="0.5"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={multiTaskForm.control}
                                name={`tasks.${index}.subtasks.${subtaskIndex}.status`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">
                                      Status
                                    </FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      value={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {Object.values(TaskStatus).map(
                                          (status) => (
                                            <SelectItem
                                              key={status}
                                              value={status}
                                            >
                                              {status}
                                            </SelectItem>
                                          )
                                        )}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const currentSubtasks =
                                  multiTaskForm.getValues(
                                    `tasks.${index}.subtasks`
                                  ) || [];
                                multiTaskForm.setValue(
                                  `tasks.${index}.subtasks`,
                                  currentSubtasks.filter(
                                    (_, i) => i !== subtaskIndex
                                  )
                                );
                              }}
                              className="mt-6"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  appendTask({
                    title: "",
                    description: "",
                    projectId: projectId,
                    status: TaskStatus.TODO,
                    priority: Priority.MEDIUM,
                    dueDate: null,
                    estimatedHours: undefined,
                    assigneeIds: [],
                    freelancerIds: [],
                    isAIGenerated: false,
                    subtasks: [],
                  })
                }
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Task
              </Button>
            </div>

            <div className="flex justify-end gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="min-w-24"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="min-w-24">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  `Create ${taskFields.length} Tasks`
                )}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
