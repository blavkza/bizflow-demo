import db from "@/lib/db";
import { AttendanceStatus } from "@prisma/client";

export class WarningService {
  static async checkAttendanceWarnings(
    employeeId: string,
    currentTime: Date,
    status: AttendanceStatus
  ) {
    const warnings = [];

    if (status === AttendanceStatus.LATE) {
      const lateWarning = await this.checkLateWarning(employeeId, currentTime);
      if (lateWarning) warnings.push(lateWarning);
    }

    if (status === AttendanceStatus.ABSENT) {
      const absentWarning = await this.checkAbsentWarning(
        employeeId,
        currentTime
      );
      if (absentWarning) warnings.push(absentWarning);
    }

    // Check for pattern-based warnings
    const patternWarning = await this.checkAttendancePatternWarning(
      employeeId,
      currentTime
    );
    if (patternWarning) warnings.push(patternWarning);

    return warnings;
  }

  static async checkLateWarning(employeeId: string, currentTime: Date) {
    const startOfWeek = new Date(currentTime);
    startOfWeek.setDate(currentTime.getDate() - currentTime.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(
      currentTime.getFullYear(),
      currentTime.getMonth(),
      1
    );
    startOfMonth.setHours(0, 0, 0, 0);

    const weeklyLateCount = await db.attendanceRecord.count({
      where: {
        employeeId: employeeId,
        status: AttendanceStatus.LATE,
        date: { gte: startOfWeek, lte: currentTime },
      },
    });

    const monthlyLateCount = await db.attendanceRecord.count({
      where: {
        employeeId: employeeId,
        status: AttendanceStatus.LATE,
        date: { gte: startOfMonth, lte: currentTime },
      },
    });

    if (weeklyLateCount >= 2) {
      return await this.createWarning(
        employeeId,
        "Attendance",
        "MEDIUM",
        `Second late attendance this week (Total: ${weeklyLateCount} this week, ${monthlyLateCount} this month)`,
        "Maintain punctuality. Consistent late arrivals may lead to disciplinary action."
      );
    }

    if (monthlyLateCount >= 3) {
      return await this.createWarning(
        employeeId,
        "Attendance",
        "HIGH",
        `Third late attendance this month (Total: ${monthlyLateCount} late days)`,
        "Formal warning for persistent late attendance. Immediate improvement required."
      );
    }

    return null;
  }

  static async checkAbsentWarning(employeeId: string, currentTime: Date) {
    const startOfMonth = new Date(
      currentTime.getFullYear(),
      currentTime.getMonth(),
      1
    );
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyAbsentCount = await db.attendanceRecord.count({
      where: {
        employeeId: employeeId,
        status: AttendanceStatus.ABSENT,
        date: { gte: startOfMonth, lte: currentTime },
      },
    });

    if (monthlyAbsentCount === 1) {
      return await this.createWarning(
        employeeId,
        "Attendance",
        "LOW",
        "First absent day this month",
        "Please ensure regular attendance. Use leave requests for planned absences."
      );
    }

    if (monthlyAbsentCount === 2) {
      return await this.createWarning(
        employeeId,
        "Attendance",
        "MEDIUM",
        `Second absent day this month`,
        "Concerning attendance pattern. Please discuss with your manager."
      );
    }

    if (monthlyAbsentCount >= 3) {
      return await this.createWarning(
        employeeId,
        "Attendance",
        "HIGH",
        `Multiple absent days this month (Total: ${monthlyAbsentCount})`,
        "Formal warning for persistent absenteeism. May lead to disciplinary action."
      );
    }

    return null;
  }

  static async checkAttendancePatternWarning(
    employeeId: string,
    currentTime: Date
  ) {
    // Check for patterns like frequent Monday/Friday absences
    const last30Days = new Date(currentTime);
    last30Days.setDate(currentTime.getDate() - 30);

    const recentAbsences = await db.attendanceRecord.findMany({
      where: {
        employeeId: employeeId,
        status: AttendanceStatus.ABSENT,
        date: { gte: last30Days, lte: currentTime },
      },
      select: { date: true },
    });

    // Check for pattern (e.g., frequent Monday absences)
    const mondayAbsences = recentAbsences.filter(
      (record) => new Date(record.date).getDay() === 1
    ).length;

    if (mondayAbsences >= 2) {
      return await this.createWarning(
        employeeId,
        "Attendance Pattern",
        "MEDIUM",
        `Frequent Monday absences detected (${mondayAbsences} Mondays in last 30 days)`,
        "Please ensure consistent attendance throughout the week."
      );
    }

    return null;
  }

  private static async createWarning(
    employeeId: string,
    type: string,
    severity: string,
    reason: string,
    actionPlan: string
  ) {
    return await db.warning.create({
      data: {
        employeeId,
        type,
        severity,
        reason,
        actionPlan,
        date: new Date(),
        status: "ACTIVE",
      },
    });
  }
}
