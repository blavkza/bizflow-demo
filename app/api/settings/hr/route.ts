import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const creater = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!creater) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get HR settings or create default if they don't exist
    let settings = await db.hRSettings.findFirst();

    if (!settings) {
      // Create default settings with all fields
      settings = await db.hRSettings.create({
        data: {
          // All defaults are handled by Prisma schema
          updatedBy: creater.name,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to fetch HR settings:", error);
    return NextResponse.json(
      { message: "Failed to fetch HR settings", error },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const creator = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!creator) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const updates = await request.json();

    // Get current settings
    const currentSettings = await db.hRSettings.findFirst();

    if (!currentSettings) {
      // Create new settings with updates and all default values
      const newSettings = await db.hRSettings.create({
        data: {
          // Existing fields
          workingHoursPerDay: updates.workingHoursPerDay || 8,
          workingHoursWeekend: updates.workingHoursWeekend || 4,
          paymentDay: updates.paymentDay || 25,
          paymentMonth: updates.paymentMonth || "CURRENT",
          overtimeHourRate: updates.overtimeHourRate || 50,
          autoProcessPayroll: updates.autoProcessPayroll || false,
          workingDaysPerMonth: updates.workingDaysPerMonth || 22,
          lateThreshold: updates.lateThreshold || 15,
          halfDayThreshold: updates.halfDayThreshold || 4,
          overtimeThreshold: updates.overtimeThreshold || 8,
          WeekendovertimeThreshold: updates.WeekendovertimeThreshold || 4,
          annualLeaveDays: updates.annualLeaveDays || 21,
          sickLeaveDays: updates.sickLeaveDays || 30,
          studyLeaveDays: updates.studyLeaveDays || 5,
          maternityLeaveDays: updates.maternityLeaveDays || 120,
          paternityLeaveDays: updates.paternityLeaveDays || 10,
          carryOverEnabled: updates.carryOverEnabled ?? true,
          maxCarryOverDays: updates.maxCarryOverDays || 5,

          // Bonus Settings
          annualBonusEnabled: updates.annualBonusEnabled ?? true,
          annualBonusType: updates.annualBonusType || "DECEMBER",
          annualBonusPercentage: updates.annualBonusPercentage ?? 100,
          performanceBonusEnabled: updates.performanceBonusEnabled ?? true,
          performanceBonusType: updates.performanceBonusType || "INDIVIDUAL",
          profitSharingEnabled: updates.profitSharingEnabled ?? false,
          profitSharingPercentage: updates.profitSharingPercentage ?? 10,
          thirteenthChequeEnabled: updates.thirteenthChequeEnabled ?? false,
          spotBonusEnabled: updates.spotBonusEnabled ?? true,
          meritBonusEnabled: updates.meritBonusEnabled ?? true,
          appreciationBonusEnabled: updates.appreciationBonusEnabled ?? true,
          incentivePaymentEnabled: updates.incentivePaymentEnabled ?? true,
          recognitionAwardEnabled: updates.recognitionAwardEnabled ?? true,
          attendanceBonusEnabled: updates.attendanceBonusEnabled ?? true,
          overtimeBonusEnabled: updates.overtimeBonusEnabled ?? true,

          // Deduction Settings
          taxEnabled: updates.taxEnabled ?? true,
          uniformPPEEnabled: updates.uniformPPEEnabled ?? true,
          uniformPPEMaxDeduction: updates.uniformPPEMaxDeduction ?? 500,
          damageLossEnabled: updates.damageLossEnabled ?? true,
          damageLossMaxPercentage: updates.damageLossMaxPercentage ?? 20,
          uifEnabled: updates.uifEnabled ?? true,
          uifPercentage: updates.uifPercentage ?? 1,
          pensionEnabled: updates.pensionEnabled ?? true,
          pensionPercentage: updates.pensionPercentage ?? 7.5,
          medicalAidEnabled: updates.medicalAidEnabled ?? true,
          medicalAidMaxDeduction: updates.medicalAidMaxDeduction ?? 2000,
          overpaymentEnabled: updates.overpaymentEnabled ?? true,
          overpaymentMaxPercentage: updates.overpaymentMaxPercentage ?? 25,
          loanRepaymentEnabled: updates.loanRepaymentEnabled ?? true,
          funeralBenefitEnabled: updates.funeralBenefitEnabled ?? true,
          funeralBenefitAmount: updates.funeralBenefitAmount ?? 100,
          tradeUnionEnabled: updates.tradeUnionEnabled ?? false,
          insuranceEnabled: updates.insuranceEnabled ?? true,
          guaranteeFundEnabled: updates.guaranteeFundEnabled ?? false,
          savingsEnabled: updates.savingsEnabled ?? true,
          savingsMaxPercentage: updates.savingsMaxPercentage ?? 15,
          disciplinaryEnabled: updates.disciplinaryEnabled ?? true,
          disciplinaryMaxPercentage: updates.disciplinaryMaxPercentage ?? 50,
          courtOrderEnabled: updates.courtOrderEnabled ?? true,
          maxBreaksPerDay: updates.maxBreaksPerDay || 2,
          totalBreakDurationMinutes: updates.totalBreakDurationMinutes || 60,
          breakReminderMinutes: updates.breakReminderMinutes || 5,
          teaTimeWindowStart: updates.teaTimeWindowStart || "10:00", // Tea Time
          teaTimeWindowEnd: updates.teaTimeWindowEnd || "11:00",
          lunchTimeWindowStart: updates.lunchTimeWindowStart || "13:00", // Lunch Time
          lunchTimeWindowEnd: updates.lunchTimeWindowEnd || "14:00",

          updatedBy: creator.name,
        },
      });
      return NextResponse.json(newSettings);
    }

    // Update existing settings with all fields
    const updatedSettings = await db.hRSettings.update({
      where: { id: currentSettings.id },
      data: {
        // Existing fields
        workingHoursPerDay:
          updates.workingHoursPerDay ?? currentSettings.workingHoursPerDay,
        workingHoursWeekend:
          updates.workingHoursWeekend ?? currentSettings.workingHoursWeekend,
        paymentDay: updates.paymentDay ?? currentSettings.paymentDay,
        paymentMonth: updates.paymentMonth ?? currentSettings.paymentMonth,
        overtimeHourRate:
          updates.overtimeHourRate ?? currentSettings.overtimeHourRate,
        autoProcessPayroll:
          updates.autoProcessPayroll ?? currentSettings.autoProcessPayroll,
        workingDaysPerMonth:
          updates.workingDaysPerMonth ?? currentSettings.workingDaysPerMonth,
        lateThreshold: updates.lateThreshold ?? currentSettings.lateThreshold,
        halfDayThreshold:
          updates.halfDayThreshold ?? currentSettings.halfDayThreshold,
        overtimeThreshold:
          updates.overtimeThreshold ?? currentSettings.overtimeThreshold,
        WeekendovertimeThreshold:
          updates.WeekendovertimeThreshold ??
          currentSettings.WeekendovertimeThreshold,
        annualLeaveDays:
          updates.annualLeaveDays ?? currentSettings.annualLeaveDays,
        sickLeaveDays: updates.sickLeaveDays ?? currentSettings.sickLeaveDays,
        studyLeaveDays:
          updates.studyLeaveDays ?? currentSettings.studyLeaveDays,
        maternityLeaveDays:
          updates.maternityLeaveDays ?? currentSettings.maternityLeaveDays,
        paternityLeaveDays:
          updates.paternityLeaveDays ?? currentSettings.paternityLeaveDays,
        carryOverEnabled:
          updates.carryOverEnabled ?? currentSettings.carryOverEnabled,
        maxCarryOverDays:
          updates.maxCarryOverDays ?? currentSettings.maxCarryOverDays,

        // Bonus Settings
        annualBonusEnabled:
          updates.annualBonusEnabled ?? currentSettings.annualBonusEnabled,
        annualBonusType:
          updates.annualBonusType ?? currentSettings.annualBonusType,
        annualBonusPercentage:
          updates.annualBonusPercentage ??
          currentSettings.annualBonusPercentage,
        performanceBonusEnabled:
          updates.performanceBonusEnabled ??
          currentSettings.performanceBonusEnabled,
        performanceBonusType:
          updates.performanceBonusType ?? currentSettings.performanceBonusType,
        profitSharingEnabled:
          updates.profitSharingEnabled ?? currentSettings.profitSharingEnabled,
        profitSharingPercentage:
          updates.profitSharingPercentage ??
          currentSettings.profitSharingPercentage,
        thirteenthChequeEnabled:
          updates.thirteenthChequeEnabled ??
          currentSettings.thirteenthChequeEnabled,
        spotBonusEnabled:
          updates.spotBonusEnabled ?? currentSettings.spotBonusEnabled,
        meritBonusEnabled:
          updates.meritBonusEnabled ?? currentSettings.meritBonusEnabled,
        appreciationBonusEnabled:
          updates.appreciationBonusEnabled ??
          currentSettings.appreciationBonusEnabled,
        incentivePaymentEnabled:
          updates.incentivePaymentEnabled ??
          currentSettings.incentivePaymentEnabled,
        recognitionAwardEnabled:
          updates.recognitionAwardEnabled ??
          currentSettings.recognitionAwardEnabled,
        overtimeBonusEnabled:
          updates.overtimeBonusEnabled ?? currentSettings.overtimeBonusEnabled,
        attendanceBonusEnabled:
          updates.attendanceBonusEnabled ??
          currentSettings.attendanceBonusEnabled,

        // Deduction Settings
        taxEnabled: updates.taxEnabled ?? currentSettings.taxEnabled,
        uniformPPEEnabled:
          updates.uniformPPEEnabled ?? currentSettings.uniformPPEEnabled,
        uniformPPEMaxDeduction:
          updates.uniformPPEMaxDeduction ??
          currentSettings.uniformPPEMaxDeduction,
        damageLossEnabled:
          updates.damageLossEnabled ?? currentSettings.damageLossEnabled,
        damageLossMaxPercentage:
          updates.damageLossMaxPercentage ??
          currentSettings.damageLossMaxPercentage,
        uifEnabled: updates.uifEnabled ?? currentSettings.uifEnabled,
        uifPercentage: updates.uifPercentage ?? currentSettings.uifPercentage,
        pensionEnabled:
          updates.pensionEnabled ?? currentSettings.pensionEnabled,
        pensionPercentage:
          updates.pensionPercentage ?? currentSettings.pensionPercentage,
        medicalAidEnabled:
          updates.medicalAidEnabled ?? currentSettings.medicalAidEnabled,
        medicalAidMaxDeduction:
          updates.medicalAidMaxDeduction ??
          currentSettings.medicalAidMaxDeduction,
        overpaymentEnabled:
          updates.overpaymentEnabled ?? currentSettings.overpaymentEnabled,
        overpaymentMaxPercentage:
          updates.overpaymentMaxPercentage ??
          currentSettings.overpaymentMaxPercentage,
        loanRepaymentEnabled:
          updates.loanRepaymentEnabled ?? currentSettings.loanRepaymentEnabled,
        funeralBenefitEnabled:
          updates.funeralBenefitEnabled ??
          currentSettings.funeralBenefitEnabled,
        funeralBenefitAmount:
          updates.funeralBenefitAmount ?? currentSettings.funeralBenefitAmount,
        tradeUnionEnabled:
          updates.tradeUnionEnabled ?? currentSettings.tradeUnionEnabled,
        insuranceEnabled:
          updates.insuranceEnabled ?? currentSettings.insuranceEnabled,
        guaranteeFundEnabled:
          updates.guaranteeFundEnabled ?? currentSettings.guaranteeFundEnabled,
        savingsEnabled:
          updates.savingsEnabled ?? currentSettings.savingsEnabled,
        savingsMaxPercentage:
          updates.savingsMaxPercentage ?? currentSettings.savingsMaxPercentage,
        disciplinaryEnabled:
          updates.disciplinaryEnabled ?? currentSettings.disciplinaryEnabled,
        disciplinaryMaxPercentage:
          updates.disciplinaryMaxPercentage ??
          currentSettings.disciplinaryMaxPercentage,
        courtOrderEnabled:
          updates.courtOrderEnabled ?? currentSettings.courtOrderEnabled,
        maxBreaksPerDay:
          updates.maxBreaksPerDay ?? currentSettings.maxBreaksPerDay,
        totalBreakDurationMinutes:
          updates.totalBreakDurationMinutes ??
          currentSettings.totalBreakDurationMinutes,
        breakReminderMinutes:
          updates.breakReminderMinutes ?? currentSettings.breakReminderMinutes,
        teaTimeWindowStart:
          updates.teaTimeWindowStart ?? currentSettings.teaTimeWindowStart,
        teaTimeWindowEnd:
          updates.teaTimeWindowEnd ?? currentSettings.teaTimeWindowEnd,
        lunchTimeWindowStart:
          updates.lunchTimeWindowStart ?? currentSettings.lunchTimeWindowStart,
        lunchTimeWindowEnd:
          updates.lunchTimeWindowEnd ?? currentSettings.lunchTimeWindowEnd,

        updatedBy: creator.name,
      },
    });

    await db.notification.create({
      data: {
        title: "HR Settings Updated",
        message: `HR settings have been updated by ${creator.name}.`,
        type: "SYSTEM",
        isRead: false,
        actionUrl: `/dashboard/settings`,
        userId: creator.id,
      },
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error("Failed to save HR settings:", error);
    return NextResponse.json(
      { message: "Failed to save HR settings", error },
      { status: 500 },
    );
  }
}
