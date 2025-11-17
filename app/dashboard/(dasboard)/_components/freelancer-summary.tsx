import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "./stat-card";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface FreelancerSummaryProps {
  isLoading: boolean;
  data: any;
}

export default function FreelancerSummary({
  isLoading,
  data,
}: FreelancerSummaryProps) {
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  const freelancerData = data?.freelancerSummary || {};
  const freelancers = data?.freelancers || [];

  // Calculate on/off duty based on status and time entries
  const activeFreelancers = freelancers.filter(
    (fl: any) => fl.status === "ACTIVE"
  );
  const freelancersOnDuty = activeFreelancers.filter(
    (fl: any) => fl.timeEntries && fl.timeEntries.length > 0
  );
  const freelancersOffDuty = activeFreelancers.filter(
    (fl: any) => !fl.timeEntries || fl.timeEntries.length === 0
  );

  const handleCardClick = (type: string) => {
    setOpenDialog(type);
  };

  const renderFreelancerDialogContent = (
    type: string | null,
    data: any,
    onDuty: any[],
    offDuty: any[]
  ) => {
    switch (type) {
      case "workforce":
        return (
          <FreelancerWorkforceDetails
            data={data}
            freelancers={activeFreelancers}
          />
        );
      case "on-duty":
        return <OnDutyFreelancersDetails freelancers={onDuty} />;
      case "off-duty":
        return <OffDutyFreelancersDetails freelancers={offDuty} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Freelancer Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              isLoading={isLoading}
              title="Active Freelancers"
              value={freelancerData.totalFreelancers}
              icon="users"
              description={`${freelancerData.reliableFreelancers || 0} reliable`}
              onClick={() => handleCardClick("workforce")}
            />
            <StatCard
              isLoading={isLoading}
              title="On Duty Today"
              value={freelancersOnDuty.length}
              icon="user-check"
              description="Currently working"
              onClick={() => handleCardClick("on-duty")}
            />
            <StatCard
              isLoading={isLoading}
              title="Off Duty Today"
              value={freelancersOffDuty.length}
              icon="user-x"
              description="Not currently working"
              onClick={() => handleCardClick("off-duty")}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!openDialog} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {openDialog === "workforce" && "Freelancer Workforce"}
              {openDialog === "on-duty" && "Freelancers On Duty"}
              {openDialog === "off-duty" && "Freelancers Off Duty"}
            </DialogTitle>
          </DialogHeader>
          {renderFreelancerDialogContent(
            openDialog,
            data,
            freelancersOnDuty,
            freelancersOffDuty
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Freelancer Detail Components
const FreelancerWorkforceDetails = ({
  data,
  freelancers,
}: {
  data: any;
  freelancers: any[];
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-3 gap-4 text-sm">
      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <div className="text-2xl font-bold text-blue-600">
          {freelancers.length}
        </div>
        <div className="text-blue-800">Active Freelancers</div>
      </div>
      <div className="text-center p-4 bg-green-50 rounded-lg">
        <div className="text-2xl font-bold text-green-600">
          {
            freelancers.filter(
              (fl: any) => fl.timeEntries && fl.timeEntries.length > 0
            ).length
          }
        </div>
        <div className="text-green-800">On Duty</div>
      </div>
      <div className="text-center p-4 bg-orange-50 rounded-lg">
        <div className="text-2xl font-bold text-orange-600">
          {
            freelancers.filter(
              (fl: any) => !fl.timeEntries || fl.timeEntries.length === 0
            ).length
          }
        </div>
        <div className="text-orange-800">Off Duty</div>
      </div>
    </div>

    <div className="border rounded-lg">
      <div className="p-4 font-semibold border-b">All Active Freelancers</div>
      <div className="max-h-96 overflow-y-auto">
        {freelancers.length > 0 ? (
          freelancers.map((freelancer: any) => (
            <div
              key={freelancer.id}
              className="p-4 border-b last:border-b-0 hover:bg-gray-50"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      freelancer.timeEntries &&
                      freelancer.timeEntries.length > 0
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  />
                  <div>
                    <div className="font-medium">
                      {freelancer.firstName} {freelancer.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {freelancer.position}
                    </div>
                    {freelancer.reliable && (
                      <Badge variant="default" className="mt-1 text-xs">
                        Reliable
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant={
                      freelancer.timeEntries &&
                      freelancer.timeEntries.length > 0
                        ? "default"
                        : "secondary"
                    }
                  >
                    {freelancer.timeEntries && freelancer.timeEntries.length > 0
                      ? "On Duty"
                      : "Off Duty"}
                  </Badge>
                  <div className="text-sm text-gray-500 mt-1">
                    {freelancer.department?.name || "No Department"}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            No freelancers data available
          </div>
        )}
      </div>
    </div>
  </div>
);

const OnDutyFreelancersDetails = ({ freelancers }: { freelancers: any[] }) => (
  <div className="space-y-4">
    <div className="text-center p-6 bg-green-50 rounded-lg">
      <div className="text-3xl font-bold text-green-600">
        {freelancers.length}
      </div>
      <div className="text-green-800 font-medium">Freelancers On Duty</div>
      <div className="text-sm text-green-600 mt-2">
        Currently working and clocked in
      </div>
    </div>

    <div className="border rounded-lg">
      <div className="p-4 font-semibold border-b">On Duty Freelancers</div>
      <div className="max-h-96 overflow-y-auto">
        {freelancers.length > 0 ? (
          freelancers.map((freelancer: any) => (
            <div
              key={freelancer.id}
              className="p-4 border-b last:border-b-0 hover:bg-gray-50"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">
                    {freelancer.firstName} {freelancer.lastName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {freelancer.position}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Time entries today: {freelancer.timeEntries?.length || 0}
                    {freelancer.reliable && (
                      <span className="ml-2 text-green-600">• Reliable</span>
                    )}
                  </div>
                </div>
                <Badge variant="default">On Duty</Badge>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            No freelancers on duty
          </div>
        )}
      </div>
    </div>
  </div>
);

const OffDutyFreelancersDetails = ({ freelancers }: { freelancers: any[] }) => (
  <div className="space-y-4">
    <div className="text-center p-6 bg-orange-50 rounded-lg">
      <div className="text-3xl font-bold text-orange-600">
        {freelancers.length}
      </div>
      <div className="text-orange-800 font-medium">Freelancers Off Duty</div>
      <div className="text-sm text-orange-600 mt-2">
        Not currently clocked in
      </div>
    </div>

    <div className="border rounded-lg">
      <div className="p-4 font-semibold border-b">Off Duty Freelancers</div>
      <div className="max-h-96 overflow-y-auto">
        {freelancers.length > 0 ? (
          freelancers.map((freelancer: any) => (
            <div
              key={freelancer.id}
              className="p-4 border-b last:border-b-0 hover:bg-gray-50"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">
                    {freelancer.firstName} {freelancer.lastName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {freelancer.position}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Status: {freelancer.status}
                    {freelancer.reliable && (
                      <span className="ml-2 text-green-600">• Reliable</span>
                    )}
                  </div>
                </div>
                <Badge variant="secondary">Off Duty</Badge>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            No freelancers off duty
          </div>
        )}
      </div>
    </div>
  </div>
);
