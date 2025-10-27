"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
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
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Users,
  Clock,
  DollarSign,
  Star,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  FileText,
  Send,
  GraduationCap,
  Calendar,
  Briefcase,
  Award,
  User,
  CreditCard,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

// Mock freelancer data with education and personal information
const freelancers = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah@freelancer.com",
    phone: "+27 82 123 4567",
    location: "Cape Town, South Africa",
    avatar: "/placeholder.svg?height=40&width=40",
    skills: ["React", "Node.js", "TypeScript", "UI/UX Design"],
    hourlyRate: 850,
    rating: 4.8,
    reviewCount: 24,
    totalEarnings: 125000,
    hoursWorked: 147,
    projectsCompleted: 8,
    availability: "Available",
    joinDate: "2023-03-15",
    bio: "Full-stack developer with 5+ years experience in modern web technologies. Specialized in React and Node.js applications.",

    // Personal Information
    dateOfBirth: "1990-05-15",
    nationality: "South African",
    idNumber: "9005155555088",
    gender: "Female",
    address: "123 Ocean View Drive",
    city: "Cape Town",
    postalCode: "8001",
    emergencyContact: "John Johnson",
    emergencyPhone: "+27 82 987 6543",

    // Education
    education: [
      {
        degree: "Bachelor of Science in Computer Science",
        institution: "University of Cape Town",
        year: "2012",
        grade: "Cum Laude",
      },
      {
        degree: "Full Stack Web Development Bootcamp",
        institution: "CodeSpace Academy",
        year: "2015",
        grade: "Distinction",
      },
    ],

    // Professional Certifications
    certifications: [
      {
        name: "AWS Certified Developer",
        issuer: "Amazon Web Services",
        year: "2022",
      },
      {
        name: "React Professional Certification",
        issuer: "Meta",
        year: "2021",
      },
      {
        name: "Node.js Application Developer",
        issuer: "OpenJS Foundation",
        year: "2020",
      },
    ],

    // Work Experience
    experience: [
      {
        title: "Senior Full Stack Developer",
        company: "Tech Solutions Inc.",
        duration: "2018 - 2023",
        description:
          "Led development of enterprise web applications using React and Node.js",
      },
      {
        title: "Frontend Developer",
        company: "Digital Creatives",
        duration: "2015 - 2018",
        description:
          "Developed responsive web interfaces for various client projects",
      },
    ],

    // Banking Details
    bankName: "First National Bank",
    accountNumber: "62********89",
    branchCode: "250655",
    accountType: "Current Account",

    currentProjects: [
      {
        id: "1",
        name: "E-commerce Platform",
        progress: 75,
        dueDate: "2024-02-15",
      },
      {
        id: "2",
        name: "Mobile App Backend",
        progress: 45,
        dueDate: "2024-02-28",
      },
    ],
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "michael@designer.com",
    phone: "+27 83 987 6543",
    location: "Johannesburg, South Africa",
    avatar: "/placeholder.svg?height=40&width=40",
    skills: ["Graphic Design", "Branding", "Adobe Creative Suite", "Figma"],
    hourlyRate: 650,
    rating: 4.9,
    reviewCount: 31,
    totalEarnings: 89000,
    hoursWorked: 137,
    projectsCompleted: 12,
    availability: "Busy",
    joinDate: "2023-01-20",
    bio: "Creative designer with expertise in brand identity and digital design. Passionate about creating memorable visual experiences.",

    dateOfBirth: "1988-08-22",
    nationality: "South African",
    idNumber: "8808225555089",
    gender: "Male",
    address: "456 Sandton Drive",
    city: "Johannesburg",
    postalCode: "2196",
    emergencyContact: "Lisa Chen",
    emergencyPhone: "+27 83 111 2222",

    education: [
      {
        degree: "Bachelor of Fine Arts in Graphic Design",
        institution: "University of Johannesburg",
        year: "2010",
        grade: "First Class",
      },
    ],

    certifications: [
      { name: "Adobe Certified Expert", issuer: "Adobe", year: "2021" },
      {
        name: "UX Design Professional",
        issuer: "Nielsen Norman Group",
        year: "2020",
      },
    ],

    experience: [
      {
        title: "Lead Designer",
        company: "Creative Agency",
        duration: "2015 - 2023",
        description:
          "Managed design team and created brand identities for major clients",
      },
    ],

    bankName: "Standard Bank",
    accountNumber: "41********23",
    branchCode: "051001",
    accountType: "Current Account",

    currentProjects: [
      { id: "3", name: "Brand Redesign", progress: 90, dueDate: "2024-02-10" },
    ],
  },
  {
    id: "3",
    name: "Lisa Rodriguez",
    email: "lisa@writer.com",
    phone: "+27 84 555 7890",
    location: "Durban, South Africa",
    avatar: "/placeholder.svg?height=40&width=40",
    skills: ["Content Writing", "SEO", "Marketing", "Social Media"],
    hourlyRate: 450,
    rating: 4.7,
    reviewCount: 18,
    totalEarnings: 67000,
    hoursWorked: 149,
    projectsCompleted: 15,
    availability: "Available",
    joinDate: "2023-05-10",
    bio: "Content strategist and writer with expertise in SEO and digital marketing. Helping businesses tell their stories effectively.",

    dateOfBirth: "1992-03-10",
    nationality: "South African",
    idNumber: "9203105555087",
    gender: "Female",
    address: "789 Marine Parade",
    city: "Durban",
    postalCode: "4001",
    emergencyContact: "Carlos Rodriguez",
    emergencyPhone: "+27 84 333 4444",

    education: [
      {
        degree: "Bachelor of Arts in Journalism",
        institution: "University of KwaZulu-Natal",
        year: "2014",
        grade: "Upper Second Class",
      },
      {
        degree: "Digital Marketing Certificate",
        institution: "Red & Yellow Creative School",
        year: "2016",
        grade: "Distinction",
      },
    ],

    certifications: [
      { name: "Google Analytics Certified", issuer: "Google", year: "2022" },
      { name: "Content Marketing Specialist", issuer: "HubSpot", year: "2021" },
    ],

    experience: [
      {
        title: "Senior Content Strategist",
        company: "Marketing Pro",
        duration: "2018 - 2023",
        description: "Developed content strategies for B2B and B2C clients",
      },
    ],

    bankName: "Nedbank",
    accountNumber: "12********45",
    branchCode: "198765",
    accountType: "Savings Account",

    currentProjects: [
      {
        id: "4",
        name: "Content Strategy",
        progress: 60,
        dueDate: "2024-02-20",
      },
      { id: "5", name: "Blog Series", progress: 30, dueDate: "2024-03-05" },
    ],
  },
];

// Mock project data for assignment
const availableProjects = [
  { id: "1", name: "E-commerce Platform", type: "Development", budget: 50000 },
  { id: "2", name: "Mobile App Backend", type: "Development", budget: 35000 },
  { id: "3", name: "Brand Redesign", type: "Design", budget: 25000 },
  { id: "4", name: "Content Strategy", type: "Marketing", budget: 15000 },
  { id: "5", name: "Blog Series", type: "Writing", budget: 12000 },
];

export default function FreelancersPage() {
  const [isAddFreelancerOpen, setIsAddFreelancerOpen] = useState(false);
  const [isAssignProjectOpen, setIsAssignProjectOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedFreelancer, setSelectedFreelancer] = useState<
    (typeof freelancers)[0] | null
  >(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSkill, setFilterSkill] = useState("all");
  const [filterAvailability, setFilterAvailability] = useState("all");
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDescription, setPaymentDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const { toast } = useToast();

  const allSkills = Array.from(new Set(freelancers.flatMap((f) => f.skills)));

  const filteredFreelancers = freelancers.filter((freelancer) => {
    const matchesSearch =
      freelancer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      freelancer.skills.some((skill) =>
        skill.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesSkill =
      filterSkill === "all" || freelancer.skills.includes(filterSkill);
    const matchesAvailability =
      filterAvailability === "all" ||
      freelancer.availability === filterAvailability;

    return matchesSearch && matchesSkill && matchesAvailability;
  });

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case "Available":
        return "bg-green-100 text-green-800";
      case "Busy":
        return "bg-yellow-100 text-yellow-800";
      case "Unavailable":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ));
  };

  const handleViewProfile = (freelancer: (typeof freelancers)[0]) => {
    setSelectedFreelancer(freelancer);
    setIsProfileOpen(true);
  };

  const handleSendMessage = (freelancer: (typeof freelancers)[0]) => {
    setSelectedFreelancer(freelancer);
    setIsMessageOpen(true);
  };

  const handleProcessPayment = (freelancer: (typeof freelancers)[0]) => {
    setSelectedFreelancer(freelancer);
    setIsPaymentOpen(true);
  };

  const handleSendMessageSubmit = () => {
    if (!messageSubject || !messageBody) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Message Sent",
      description: `Your message has been sent to ${selectedFreelancer?.name}`,
    });

    setMessageSubject("");
    setMessageBody("");
    setIsMessageOpen(false);
  };

  const handlePaymentSubmit = () => {
    if (!paymentAmount || !paymentDescription || !paymentMethod) {
      toast({
        title: "Error",
        description: "Please fill in all payment fields",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Payment Processed",
      description: `Payment of R${paymentAmount} has been processed for ${selectedFreelancer?.name}`,
    });

    setPaymentAmount("");
    setPaymentDescription("");
    setPaymentMethod("");
    setIsPaymentOpen(false);
  };

  const totalFreelancers = freelancers.length;
  const availableFreelancers = freelancers.filter(
    (f) => f.availability === "Available"
  ).length;
  const totalEarnings = freelancers.reduce(
    (sum, f) => sum + f.totalEarnings,
    0
  );
  const totalHours = freelancers.reduce((sum, f) => sum + f.hoursWorked, 0);

  return (
    <div className="flex-1 space-y-6 p-4 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Freelancer Management
          </h2>
          <p className="text-muted-foreground">
            Manage freelancers, track projects, and handle payments
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/human-resources/freelancers/attendance">
              <Clock className="mr-2 h-4 w-4" />
              Attendance
            </Link>
          </Button>
          <Dialog
            open={isAssignProjectOpen}
            onOpenChange={setIsAssignProjectOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Assign Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Project to Freelancer</DialogTitle>
                <DialogDescription>
                  Select a freelancer and project to create a new assignment.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="freelancer">Freelancer</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select freelancer" />
                    </SelectTrigger>
                    <SelectContent>
                      {freelancers.map((freelancer) => (
                        <SelectItem key={freelancer.id} value={freelancer.id}>
                          {freelancer.name} - R{freelancer.hourlyRate}/hr
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project">Project</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name} - R{project.budget.toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input id="deadline" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Project Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the project requirements..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAssignProjectOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={() => setIsAssignProjectOpen(false)}>
                  Assign Project
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog
            open={isAddFreelancerOpen}
            onOpenChange={setIsAddFreelancerOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Freelancer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Freelancer</DialogTitle>
                <DialogDescription>
                  Register a new freelancer in the system.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" placeholder="+27 82 123 4567" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="Cape Town, South Africa"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate">Hourly Rate (ZAR)</Label>
                    <Input id="hourlyRate" type="number" placeholder="500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="availability">Availability</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select availability" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Available">Available</SelectItem>
                        <SelectItem value="Busy">Busy</SelectItem>
                        <SelectItem value="Unavailable">Unavailable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skills">Skills (comma-separated)</Label>
                  <Input id="skills" placeholder="React, Node.js, TypeScript" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Brief description of experience and expertise..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddFreelancerOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={() => setIsAddFreelancerOpen(false)}>
                  Add Freelancer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Profile Dialog */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={selectedFreelancer?.avatar || "/placeholder.svg"}
                />
                <AvatarFallback>
                  {selectedFreelancer?.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-xl font-bold">
                  {selectedFreelancer?.name}'s Profile
                </div>
                <p className="text-sm text-muted-foreground font-normal">
                  {selectedFreelancer?.bio}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="education">Education</TabsTrigger>
              <TabsTrigger value="experience">Experience</TabsTrigger>
              <TabsTrigger value="banking">Banking</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-semibold">{selectedFreelancer?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Date of Birth
                    </p>
                    <p className="font-semibold">
                      {selectedFreelancer?.dateOfBirth &&
                        new Date(
                          selectedFreelancer.dateOfBirth
                        ).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ID Number</p>
                    <p className="font-semibold">
                      {selectedFreelancer?.idNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-semibold">
                      {selectedFreelancer?.gender}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nationality</p>
                    <p className="font-semibold">
                      {selectedFreelancer?.nationality}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-semibold">{selectedFreelancer?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-semibold">{selectedFreelancer?.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-semibold">
                      {selectedFreelancer?.location}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-semibold">
                      {selectedFreelancer?.address}, {selectedFreelancer?.city},{" "}
                      {selectedFreelancer?.postalCode}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Emergency Contact</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Contact Name
                    </p>
                    <p className="font-semibold">
                      {selectedFreelancer?.emergencyContact}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Contact Phone
                    </p>
                    <p className="font-semibold">
                      {selectedFreelancer?.emergencyPhone}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Skills & Expertise</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {selectedFreelancer?.skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="text-base py-1 px-3"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="education" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <GraduationCap className="mr-2 h-5 w-5" />
                    Academic Qualifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedFreelancer?.education?.map((edu, index) => (
                    <div
                      key={index}
                      className="border-l-2 border-primary pl-4 pb-4"
                    >
                      <h4 className="font-semibold text-lg">{edu.degree}</h4>
                      <p className="text-muted-foreground">{edu.institution}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {edu.year}
                        </span>
                        <Badge variant="secondary">{edu.grade}</Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="mr-2 h-5 w-5" />
                    Professional Certifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedFreelancer?.certifications?.map((cert, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 p-3 bg-muted rounded-lg"
                    >
                      <Award className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold">{cert.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {cert.issuer}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Issued: {cert.year}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="experience" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Briefcase className="mr-2 h-5 w-5" />
                    Work Experience
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedFreelancer?.experience?.map((exp, index) => (
                    <div
                      key={index}
                      className="border-l-2 border-primary pl-4 pb-4"
                    >
                      <h4 className="font-semibold text-lg">{exp.title}</h4>
                      <p className="text-muted-foreground font-medium">
                        {exp.company}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {exp.duration}
                      </p>
                      <p className="mt-2">{exp.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Statistics</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Projects Completed
                    </p>
                    <p className="text-2xl font-bold">
                      {selectedFreelancer?.projectsCompleted}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Hours</p>
                    <p className="text-2xl font-bold">
                      {selectedFreelancer?.hoursWorked}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Hourly Rate</p>
                    <p className="text-2xl font-bold">
                      R{selectedFreelancer?.hourlyRate}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Earnings
                    </p>
                    <p className="text-2xl font-bold">
                      R{selectedFreelancer?.totalEarnings.toLocaleString()}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground mb-2">Rating</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex">
                        {selectedFreelancer &&
                          renderStars(selectedFreelancer.rating)}
                      </div>
                      <span className="font-semibold">
                        {selectedFreelancer?.rating}
                      </span>
                      <span className="text-muted-foreground">
                        ({selectedFreelancer?.reviewCount} reviews)
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="banking" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="mr-2 h-5 w-5" />
                    Banking Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Bank Name</p>
                    <p className="font-semibold">
                      {selectedFreelancer?.bankName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Account Type
                    </p>
                    <p className="font-semibold">
                      {selectedFreelancer?.accountType}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Account Number
                    </p>
                    <p className="font-semibold font-mono">
                      {selectedFreelancer?.accountNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Branch Code</p>
                    <p className="font-semibold font-mono">
                      {selectedFreelancer?.branchCode}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-green-900 font-medium">
                      Total Earnings
                    </span>
                    <span className="text-2xl font-bold text-green-900">
                      R{selectedFreelancer?.totalEarnings.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-blue-900 font-medium">
                      Hourly Rate
                    </span>
                    <span className="text-xl font-bold text-blue-900">
                      R{selectedFreelancer?.hourlyRate}/hr
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="text-purple-900 font-medium">
                      Hours Worked
                    </span>
                    <span className="text-xl font-bold text-purple-900">
                      {selectedFreelancer?.hoursWorked} hrs
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex space-x-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    setIsProfileOpen(false);
                    handleProcessPayment(selectedFreelancer!);
                  }}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Process Payment
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProfileOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setIsProfileOpen(false);
                handleSendMessage(selectedFreelancer!);
              }}
            >
              <Mail className="mr-2 h-4 w-4" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={isMessageOpen} onOpenChange={setIsMessageOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Send Message to {selectedFreelancer?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Send a direct message to the freelancer. They will receive it via
              email and in their dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
              <Avatar>
                <AvatarImage
                  src={selectedFreelancer?.avatar || "/placeholder.svg"}
                />
                <AvatarFallback>
                  {selectedFreelancer?.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">{selectedFreelancer?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedFreelancer?.email}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Enter message subject"
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Type your message here..."
                rows={8}
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Be clear and professional in your communication.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                <strong>Quick Tips:</strong> Include project details, deadlines,
                and any specific requirements in your message.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMessageOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendMessageSubmit}>
              <Send className="mr-2 h-4 w-4" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Process Payment for {selectedFreelancer?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Enter payment details to process payment to the freelancer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={selectedFreelancer?.avatar || "/placeholder.svg"}
                />
                <AvatarFallback>
                  {selectedFreelancer?.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-lg">
                  {selectedFreelancer?.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedFreelancer?.bankName} -{" "}
                  {selectedFreelancer?.accountNumber}
                </p>
              </div>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Hourly Rate</p>
                    <p className="font-semibold text-lg">
                      R{selectedFreelancer?.hourlyRate}/hr
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Earnings</p>
                    <p className="font-semibold text-lg">
                      R{selectedFreelancer?.totalEarnings.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount (ZAR)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="eft">EFT</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentDescription">Description</Label>
              <Textarea
                id="paymentDescription"
                placeholder="Payment for project work, hours worked, etc..."
                rows={3}
                value={paymentDescription}
                onChange={(e) => setPaymentDescription(e.target.value)}
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-900">
                <strong>Note:</strong> Please ensure all payment details are
                correct before processing. This action cannot be undone.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePaymentSubmit}>
              <CreditCard className="mr-2 h-4 w-4" />
              Process Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Freelancers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFreelancers}</div>
            <p className="text-xs text-muted-foreground">
              {availableFreelancers} available
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Earnings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R{(totalEarnings / 1000).toFixed(0)}k
            </div>
            <p className="text-xs text-muted-foreground">Paid to freelancers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Worked</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours}</div>
            <p className="text-xs text-muted-foreground">Total hours logged</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(
                freelancers.reduce((sum, f) => sum + f.rating, 0) /
                freelancers.length
              ).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average freelancer rating
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search freelancers by name or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterSkill} onValueChange={setFilterSkill}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by skill" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Skills</SelectItem>
                {allSkills.map((skill) => (
                  <SelectItem key={skill} value={skill}>
                    {skill}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filterAvailability}
              onValueChange={setFilterAvailability}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Busy">Busy</SelectItem>
                <SelectItem value="Unavailable">Unavailable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Freelancers List */}
      <div className="space-y-4">
        {filteredFreelancers.map((freelancer) => (
          <Card
            key={freelancer.id}
            className="hover:shadow-md transition-shadow"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
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
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-xl font-semibold">
                        {freelancer.name}
                      </h3>
                      <Badge
                        className={getAvailabilityColor(
                          freelancer.availability
                        )}
                      >
                        {freelancer.availability}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-3">
                      {freelancer.bio}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {freelancer.location}
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        {freelancer.email}
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        {freelancer.phone}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {freelancer.skills.map((skill) => (
                        <Badge key={skill} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 mb-2">
                    {renderStars(freelancer.rating)}
                    <span className="text-sm text-muted-foreground">
                      ({freelancer.reviewCount})
                    </span>
                  </div>
                  <p className="text-2xl font-bold">
                    R{freelancer.hourlyRate}/hr
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedFreelancer(freelancer);
                          setIsAssignProjectOpen(true);
                        }}
                      >
                        Assign Project
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleViewProfile(freelancer)}
                      >
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleSendMessage(freelancer)}
                      >
                        Send Message
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleProcessPayment(freelancer)}
                      >
                        Process Payment
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t">
                <div>
                  <h4 className="font-medium mb-2">Performance Stats</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Projects Completed:</span>
                      <span className="font-semibold">
                        {freelancer.projectsCompleted}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hours Worked:</span>
                      <span className="font-semibold">
                        {freelancer.hoursWorked}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Earnings:</span>
                      <span className="font-semibold">
                        R{freelancer.totalEarnings.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Current Projects</h4>
                  <div className="space-y-2">
                    {freelancer.currentProjects.map((project) => (
                      <div key={project.id} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{project.name}</span>
                          <span>{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          Due: {new Date(project.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                    {freelancer.currentProjects.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No active projects
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Quick Actions</h4>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent"
                      onClick={() => handleViewProfile(freelancer)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      View Profile
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent"
                      onClick={() => handleProcessPayment(freelancer)}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Process Payment
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent"
                      onClick={() => handleSendMessage(freelancer)}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFreelancers.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No freelancers found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or add a new freelancer.
            </p>
            <Button onClick={() => setIsAddFreelancerOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Freelancer
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
