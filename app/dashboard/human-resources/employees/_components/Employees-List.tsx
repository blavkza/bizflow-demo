"use client";

import {
  Plus,
  Search,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Building,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email?: string;
  phone: string;
  position: string;
  department: string;
  status: string;
  workType: string;
  salary: number;
  location: string;
  startDate: string;
  manager: string;
  avatar?: string;
}

interface EmployeesListProps {
  employees: Employee[];
}

export default function EmployeesList({ employees }: EmployeesListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "On Leave":
        return "bg-yellow-100 text-yellow-800";
      case "Inactive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getWorkTypeColor = (workType: string) => {
    switch (workType) {
      case "Full-time":
        return "bg-blue-100 text-blue-800";
      case "Part-time":
        return "bg-purple-100 text-purple-800";
      case "Contract":
        return "bg-orange-100 text-orange-800";
      case "Intern":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {employees.map((employee) => (
        <Card key={employee.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage
                    src={employee.avatar || "/placeholder.svg"}
                    alt={employee.name}
                  />
                  <AvatarFallback>
                    {employee.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-md">{employee.name}</CardTitle>
                  <CardDescription>{employee.position}</CardDescription>
                </div>
              </div>
              <Button size="icon" variant="outline">
                <Link
                  href={`/dashboard/human-resources/employees/${employee.id}`}
                >
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge className={getStatusColor(employee.status)}>
                {employee.status}
              </Badge>
              <Badge
                variant="outline"
                className={getWorkTypeColor(employee.workType)}
              >
                {employee.workType}
              </Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="truncate">{employee.email || ""}</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{employee.phone}</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Building className="h-4 w-4" />
                <span>{employee.department}</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{employee.location}</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>R{employee.salary.toLocaleString()} Per Day</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Started {employee.startDate}</span>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  ID: {employee.employeeId}
                </span>
                <span className="text-muted-foreground">
                  Manager: {employee.manager}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
