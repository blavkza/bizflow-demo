"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  Plus,
  Download,
  Filter,
  Users,
  DollarSign,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

// Mock freelancer attendance data
const attendanceData = [
  {
    id: "1",
    freelancerId: "1",
    freelancerName: "Sarah Johnson",
    freelancerAvatar: "/placeholder.svg?height=40&width=40",
    date: "2024-01-27",
    checkIn: "09:00 AM",
    checkOut: "05:00 PM",
    hoursWorked: 8,
    rate: 850,
    totalEarned: 6800,
    status: "completed",
    notes: "Work on e-commerce platform",
  },
  {
    id: "2",
    freelancerId: "1",
    freelancerName: "Sarah Johnson",
    freelancerAvatar: "/placeholder.svg?height=40&width=40",
    date: "2024-01-26",
    checkIn: "10:00 AM",
    checkOut: "06:30 PM",
    hoursWorked: 8.5,
    rate: 850,
    totalEarned: 7225,
    status: "completed",
    notes: "Backend development tasks",
  },
  {
    id: "3",
    freelancerId: "2",
    freelancerName: "Michael Chen",
    freelancerAvatar: "/placeholder.svg?height=40&width=40",
    date: "2024-01-27",
    checkIn: "08:30 AM",
    checkOut: "04:00 PM",
    hoursWorked: 7.5,
    rate: 650,
    totalEarned: 4875,
    status: "completed",
    notes: "Brand design mockups",
  },
  {
    id: "4",
    freelancerId: "3",
    freelancerName: "Lisa Rodriguez",
    freelancerAvatar: "/placeholder.svg?height=40&width=40",
    date: "2024-01-27",
    checkIn: "09:30 AM",
    checkOut: "05:30 PM",
    hoursWorked: 8,
    rate: 450,
    totalEarned: 3600,
    status: "completed",
    notes: "Content writing for blog",
  },
  {
    id: "5",
    freelancerId: "1",
    freelancerName: "Sarah Johnson",
    freelancerAvatar: "/placeholder.svg?height=40&width=40",
    date: "2024-01-25",
    checkIn: "09:00 AM",
    checkOut: null,
    hoursWorked: 0,
    rate: 850,
    totalEarned: 0,
    status: "pending",
    notes: "In progress",
  },
];

// Mock freelancer summary
const freelancers = [
  {
    id: "1",
    name: "Sarah Johnson",
    avatar: "/placeholder.svg?height=40&width=40",
    totalDays: 15,
    totalHours: 120,
    totalEarned: 102000,
    rate: 850,
  },
  {
    id: "2",
    name: "Michael Chen",
    avatar: "/placeholder.svg?height=40&width=40",
    totalDays: 12,
    totalHours: 96,
    totalEarned: 62400,
    rate: 650,
  },
  {
    id: "3",
    name: "Lisa Rodriguez",
    avatar: "/placeholder.svg?height=40&width=40",
    totalDays: 18,
    totalHours: 144,
    totalEarned: 64800,
    rate: 450,
  },
];

export default function FreelancerAttendancePage() {
  const [isAddAttendanceOpen, setIsAddAttendanceOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedFreelancer, setSelectedFreelancer] = useState("");
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [notes, setNotes] = useState("");
  const [filterFreelancer, setFilterFreelancer] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const { toast } = useToast();

  const handleAddAttendance = () => {
    if (!selectedDate || !selectedFreelancer || !checkInTime || !checkOutTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Attendance Recorded",
      description: "Freelancer attendance has been successfully recorded",
    });

    setSelectedDate("");
    setSelectedFreelancer("");
    setCheckInTime("");
    setCheckOutTime("");
    setNotes("");
    setIsAddAttendanceOpen(false);
  };

  const filteredAttendance = attendanceData.filter((record) => {
    const matchesFreelancer =
      filterFreelancer === "all" || record.freelancerId === filterFreelancer;
    const matchesStatus =
      filterStatus === "all" || record.status === filterStatus;
    return matchesFreelancer && matchesStatus;
  });

  const totalDaysWorked = attendanceData.filter(
    (r) => r.status === "completed"
  ).length;
  const totalHoursWorked = attendanceData
    .filter((r) => r.status === "completed")
    .reduce((sum, r) => sum + r.hoursWorked, 0);
  const totalAmountEarned = attendanceData
    .filter((r) => r.status === "completed")
    .reduce((sum, r) => sum + r.totalEarned, 0);
  const activeFreelancers = new Set(attendanceData.map((r) => r.freelancerId))
    .size;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "absent":
        return <Badge className="bg-red-100 text-red-800">Absent</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/freelancers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Freelancers
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Freelancer Attendance
            </h2>
            <p className="text-muted-foreground">
              Track freelancer working days and calculate payments
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Dialog
            open={isAddAttendanceOpen}
            onOpenChange={setIsAddAttendanceOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Record Attendance
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Freelancer Attendance</DialogTitle>
                <DialogDescription>
                  Add a new attendance record for a freelancer
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="freelancer">Freelancer</Label>
                  <Select
                    value={selectedFreelancer}
                    onValueChange={setSelectedFreelancer}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select freelancer" />
                    </SelectTrigger>
                    <SelectContent>
                      {freelancers.map((freelancer) => (
                        <SelectItem key={freelancer.id} value={freelancer.id}>
                          {freelancer.name} - R{freelancer.rate}/hr
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="checkIn">Check In Time</Label>
                    <Input
                      id="checkIn"
                      type="time"
                      value={checkInTime}
                      onChange={(e) => setCheckInTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkOut">Check Out Time</Label>
                    <Input
                      id="checkOut"
                      type="time"
                      value={checkOutTime}
                      onChange={(e) => setCheckOutTime(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    placeholder="Work description..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddAttendanceOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddAttendance}>Record Attendance</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Days Worked
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDaysWorked}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalHoursWorked.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all freelancers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R{totalAmountEarned.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Earned this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Freelancers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeFreelancers}</div>
            <p className="text-xs text-muted-foreground">Working this month</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList>
          <TabsTrigger value="daily">Daily Records</TabsTrigger>
          <TabsTrigger value="summary">Freelancer Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>
                <Select
                  value={filterFreelancer}
                  onValueChange={setFilterFreelancer}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Freelancers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Freelancers</SelectItem>
                    {freelancers.map((freelancer) => (
                      <SelectItem key={freelancer.id} value={freelancer.id}>
                        {freelancer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Records */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredAttendance.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={record.freelancerAvatar || "/placeholder.svg"}
                        />
                        <AvatarFallback>
                          {record.freelancerName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{record.freelancerName}</p>
                        <p className="text-sm text-muted-foreground">
                          {record.notes}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Date</p>
                        <p className="font-semibold">
                          {new Date(record.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          Check In
                        </p>
                        <p className="font-semibold">{record.checkIn || "-"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          Check Out
                        </p>
                        <p className="font-semibold">
                          {record.checkOut || "-"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Hours</p>
                        <p className="font-semibold">{record.hoursWorked}h</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Earned</p>
                        <p className="font-semibold text-green-600">
                          R{record.totalEarned.toLocaleString()}
                        </p>
                      </div>
                      <div>{getStatusBadge(record.status)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Freelancer Monthly Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {freelancers.map((freelancer) => (
                  <Card key={freelancer.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage
                              src={freelancer.avatar || "/placeholder.svg"}
                            />
                            <AvatarFallback>
                              {freelancer.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-xl font-semibold">
                              {freelancer.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Hourly Rate: R{freelancer.rate}/hr
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-8 text-center">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Days Worked
                            </p>
                            <p className="text-2xl font-bold">
                              {freelancer.totalDays}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Total Hours
                            </p>
                            <p className="text-2xl font-bold">
                              {freelancer.totalHours}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Total Earned
                            </p>
                            <p className="text-2xl font-bold text-green-600">
                              R{freelancer.totalEarned.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {filteredAttendance.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No attendance records found
            </h3>
            <p className="text-muted-foreground mb-4">
              Start recording freelancer attendance to track their work.
            </p>
            <Button onClick={() => setIsAddAttendanceOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Record Attendance
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
