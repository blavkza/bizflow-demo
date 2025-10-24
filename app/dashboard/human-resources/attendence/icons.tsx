"use client";

import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  QrCode,
} from "lucide-react";
import { CheckInMethod, AttendanceStatus } from "@prisma/client";

interface StatusIconProps {
  status: AttendanceStatus;
  className?: string;
}

export function StatusIcon({ status, className = "h-4 w-4" }: StatusIconProps) {
  switch (status) {
    case AttendanceStatus.PRESENT:
      return <CheckCircle className={className} />;
    case AttendanceStatus.LATE:
      return <Clock className={className} />;
    case AttendanceStatus.ABSENT:
      return <AlertTriangle className={className} />;
    case AttendanceStatus.ANNUAL_LEAVE:
    case AttendanceStatus.SICK_LEAVE:
    case AttendanceStatus.UNPAID_LEAVE:
      return <Calendar className={className} />;
    case AttendanceStatus.HALF_DAY:
      return <Clock className={className} />;
    default:
      return <Clock className={className} />;
  }
}

interface CheckInMethodIconProps {
  method: CheckInMethod;
  className?: string;
}

export function CheckInMethodIcon({
  method,
  className = "h-3 w-3",
}: CheckInMethodIconProps) {
  switch (method) {
    case CheckInMethod.GPS:
      return <MapPin className={className} />;
    case CheckInMethod.MANUAL:
      return <UserCheck className={className} />;
    case CheckInMethod.BARCODE:
      return <QrCode className={className} />;
    default:
      return <Clock className={className} />;
  }
}
