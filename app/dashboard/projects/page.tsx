"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProjectCard } from "./_components/ProjectCard";
import { ProjectCalendarView } from "./_components/ProjectCalendarView";
import { ProjectListView } from "./_components/ProjectListView";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  CheckCircle,
  Clock,
  Pause,
  List,
  Calendar,
  Grid3X3,
  FolderKanban,
  Star,
  Archive,
} from "lucide-react";

import { Projects } from "@/types/project";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ProjectsSkeleton } from "./_components/ProjectsSkeleton";
import { useAuth } from "@clerk/nextjs";
import UserHeader from "./_components/UserHeader";
import { UserPermission, UserRole } from "@prisma/client";

async function fetchProjectData() {
  const response = await fetch("/api/projects");
  if (!response.ok) throw new Error("Failed to fetch Projects data");
  return response.json();
}

async function fetchUserData(userId: string) {
  const response = await fetch(`/api/users/userId/${userId}`);
  if (!response.ok) throw new Error("Failed to fetch user data");
  return response.json();
}

const hasRole = (role: string, requiredRoles: UserRole[]): boolean => {
  return requiredRoles.includes(role as UserRole);
};

function ProjectsContent() {
  const { userId } = useAuth();
  const searchParams = useSearchParams();

  const router = useRouter();

  const starredParam = searchParams.get("starred") === "true";
  const archivedParam = searchParams.get("archived") === "true";

  const {
    data: user,
    isLoading: loadingUser,
    error: userError,
  } = useQuery({
    queryKey: ["User", userId],
    queryFn: () => fetchUserData(userId!),
    enabled: !!userId,
  });

  const {
    data,
    isLoading: loadingProjects,
    error: projectError,
    refetch,
  } = useQuery<Projects[]>({
    queryKey: ["Projects"],
    queryFn: fetchProjectData,
    refetchInterval: 10000,
  });

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [projects, setProjects] = useState<Projects[]>([]);

  const fullAccessRoles = [UserRole.CHIEF_EXECUTIVE_OFFICER];

  const hasFullAccess = user?.role
    ? hasRole(user?.role, fullAccessRoles)
    : false;

  const canViewProjects = user?.permissions?.includes(
    UserPermission.PROJECTS_VIEW
  );

  const canCreateProjects = user?.permissions?.includes(
    UserPermission.PROJECTS_CREATE
  );

  useEffect(() => {
    if (!loadingUser && canViewProjects === false && hasFullAccess === false) {
      router.push("/dashboard");
    }
  }, [loadingUser, canViewProjects, hasFullAccess]);

  useEffect(() => {
    if (data) setProjects(data);
    if (projectError) toast.error("Failed to fetch Projects data");
    if (userError) toast.error("Failed to fetch User data");
  }, [data, projectError, userError]);

  const [projectViewMode, setProjectViewMode] = useState<
    "list" | "grid" | "calendar"
  >("grid");

  const urlFilteredProjects = projects.filter((project) => {
    if (starredParam) return !project.archived && project.starred === true;
    if (archivedParam) return project.archived === true;

    return !project.archived;
  });

  const filteredProjects = urlFilteredProjects.filter((project) =>
    statusFilter === "ALL" ? true : project.status === statusFilter
  );

  const stats = {
    total: urlFilteredProjects.length,
    active: urlFilteredProjects.filter((p) => p.status === "ACTIVE").length,
    completed: urlFilteredProjects.filter((p) => p.status === "COMPLETED")
      .length,
    onHold: urlFilteredProjects.filter((p) => p.status === "ON_HOLD").length,
    planning: urlFilteredProjects.filter((p) => p.status === "PLANNING").length,
    cancelled: urlFilteredProjects.filter((p) => p.status === "CANCELLED")
      .length,
  };

  if (loadingProjects || loadingUser) return <ProjectsSkeleton />;

  return (
    <div className="p-6">
      <UserHeader
        fetchProjects={refetch}
        user={user}
        canCreateProjects={canCreateProjects}
        hasFullAccess={hasFullAccess}
      />

      <div className="space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6 text-center">
              {starredParam ? (
                <>
                  {" "}
                  <div className="flex items-center justify-center mb-2">
                    <Star className="text-yellow-500" size={24} />
                  </div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">
                    Favourite Projects
                  </div>
                </>
              ) : archivedParam ? (
                <>
                  {" "}
                  <div className="flex items-center justify-center mb-2">
                    <Archive className="text-yellow-500" size={24} />
                  </div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">
                    Archive Projects
                  </div>
                </>
              ) : (
                <>
                  {" "}
                  <div className="flex items-center justify-center mb-2">
                    <FolderKanban className="text-yellow-500" size={24} />{" "}
                  </div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">
                    Total Projects
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="text-blue-500" size={24} />
              </div>
              <div className="text-2xl font-bold">{stats.active}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="text-green-500" size={24} />
              </div>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Pause className="text-orange-600" size={24} />
              </div>
              <div className="text-2xl font-bold">{stats.onHold}</div>
              <div className="text-sm text-muted-foreground">On Hold</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                Projects
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-muted/20 rounded-md p-1">
                  <Button
                    variant={projectViewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setProjectViewMode("list")}
                    className="h-8 px-3"
                  >
                    <List size={16} />
                  </Button>
                  <Button
                    variant={projectViewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setProjectViewMode("grid")}
                    className="h-8 px-3"
                  >
                    <Grid3X3 size={16} />
                  </Button>
                  <Button
                    variant={
                      projectViewMode === "calendar" ? "default" : "ghost"
                    }
                    size="sm"
                    onClick={() => setProjectViewMode("calendar")}
                    className="h-8 px-3"
                  >
                    <Calendar size={16} />
                  </Button>
                </div>
              </div>
            </div>

            {projectViewMode !== "calendar" && (
              <div className="flex gap-2 flex-wrap mt-2">
                {[
                  { key: "ALL", label: "All Projects", count: stats.total },
                  { key: "ACTIVE", label: "Active", count: stats.active },
                  {
                    key: "COMPLETED",
                    label: "Completed",
                    count: stats.completed,
                  },
                  { key: "ON_HOLD", label: "On Hold", count: stats.onHold },
                  { key: "PLANNING", label: "Planning", count: stats.planning },
                  {
                    key: "CANCELLED",
                    label: "Cancelled",
                    count: stats.cancelled,
                  },
                ].map((filter) => (
                  <Button
                    key={filter.key}
                    variant={
                      statusFilter === filter.key ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setStatusFilter(filter.key)}
                    className="gap-2"
                  >
                    {filter.label}
                    <Badge variant="secondary" className="ml-1">
                      {filter.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            )}
          </CardHeader>

          <CardContent>
            {projectViewMode === "calendar" ? (
              <ProjectCalendarView projects={filteredProjects} />
            ) : projectViewMode === "list" ? (
              <ProjectListView projects={filteredProjects} />
            ) : (
              <>
                {filteredProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase
                      size={48}
                      className="mx-auto text-muted-foreground mb-4"
                    />
                    <h3 className="text-lg font-semibold mb-2">
                      No projects found
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {statusFilter === "ALL"
                        ? "Get started by creating your first project."
                        : `No ${statusFilter.toLowerCase().replace("_", " ")} projects found.`}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const Page = () => {
  return (
    <Suspense fallback={<ProjectsSkeleton />}>
      <ProjectsContent />
    </Suspense>
  );
};

export default Page;
