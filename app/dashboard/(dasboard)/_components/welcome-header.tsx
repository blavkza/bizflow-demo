import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  FolderKanban,
  CheckSquare,
  CheckCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { getInitials } from "../../../../lib/formatters";

interface WelcomeHeaderProps {
  isLoading: boolean;
  data: any;
}

export default function WelcomeHeader({ isLoading, data }: WelcomeHeaderProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className="md:col-span-4">
        {data?.currentUser && (
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={data.currentUser?.avatar || "/placeholder-user.jpg"}
                  alt={data.currentUser?.name || "User"}
                />
                <AvatarFallback>
                  {getInitials(data.currentUser?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <h2 className="text-xl font-bold">
                  Welcome, {data.currentUser?.name || "User"} 👋
                </h2>
                <p className="text-muted-foreground text-sm">
                  {data.currentUser?.createdAt
                    ? `Member since ${new Date(data.currentUser.createdAt).toLocaleDateString()}`
                    : "Loading..."}
                </p>
              </div>
            </div>
          </CardHeader>
        )}

        <CardContent>
          <div className="grid gap-4 md:grid-cols-4 pt-5">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center rounded-lg">
                <FolderKanban className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Active Projects</p>
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin mt-1" />
                ) : (
                  <p className="text-2xl font-bold">
                    {data?.projectMetrics?.activeProjects || 0}
                  </p>
                )}
              </div>
            </div>

            {/* Repeat for other metrics */}
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center rounded-lg">
                <CheckSquare className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Completed Projects</p>
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin mt-1" />
                ) : (
                  <p className="text-2xl font-bold">
                    {data?.projectMetrics?.completedProjects || 0}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Completed Tasks</p>
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin mt-1" />
                ) : (
                  <p className="text-2xl font-bold">
                    {data?.taskMetrics?.completedTasks || 0}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center rounded-lg">
                <Clock className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Overdue Tasks</p>
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin mt-1" />
                ) : (
                  <p className="text-2xl font-bold">
                    {data?.taskMetrics?.overdueTasks || 0}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
