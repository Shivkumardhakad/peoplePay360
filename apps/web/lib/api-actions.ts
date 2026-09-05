"use server";

import { prisma } from "@peoplepay360/db";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { payrollApiFetch, payrollApiFetchBinary } from "@/lib/payroll-api";

const HR_API_URL = process.env.NEXT_PUBLIC_HR_API_URL ?? "http://localhost:4000/api/hr";

// -------------------------------------------------------------
// EMPLOYEES
// -------------------------------------------------------------

export async function createEmployeeAction(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department: string;
  jobPosition?: string;
  dateOfJoining: string;
  status: "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED";
}) {
  const prismaStatus = data.status === "INACTIVE" ? "TERMINATED" : data.status;

  try {
    const res = await fetch(`${HR_API_URL}/employees`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || null,
        hireDate: new Date(data.dateOfJoining),
        status: prismaStatus,
      }),
      cache: "no-store",
    });

    if (res.ok) {
      const created = await res.json();
      revalidatePath("/employees");
      return { success: true, employee: created };
    }
  } catch {
    // Fallback
  }

  try {
    const fallback = await prisma.employee.create({
      data: {
        employeeNumber: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || null,
        hireDate: new Date(data.dateOfJoining),
        status: prismaStatus,
      },
    });
    revalidatePath("/employees");
    return { success: true, employee: fallback };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create employee";
    return { success: false, error: msg };
  }
}

export async function getEmployeesAction() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        department: true,
        jobPosition: true,
      },
    });
    return employees.map((e) => ({
      id: e.id,
      employeeNumber: e.employeeNumber,
      name: `${e.firstName} ${e.lastName}`,
      department: e.department?.name || "Engineering",
      position: e.jobPosition?.title || "Staff",
      status: e.status,
    }));
  } catch {
    return [];
  }
}

export async function updateEmployeeAction(employeeId: string, data: {
  firstName: string; lastName: string; email: string; phone?: string; department?: string; jobPosition?: string; dateOfJoining?: string; status: "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED";
}) {
  try {
    const employee = await prisma.employee.update({ where: { id: employeeId }, data: { firstName: data.firstName, lastName: data.lastName, email: data.email.trim().toLowerCase(), phone: data.phone || null, ...(data.dateOfJoining ? { hireDate: new Date(data.dateOfJoining) } : {}), status: data.status === "INACTIVE" ? "TERMINATED" : data.status } });
    revalidatePath("/employees");
    revalidatePath(`/employees/${employeeId}`);
    return { success: true, employee };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to update employee" };
  }
}

export async function getEmployeeAction(employeeId: string) {
  const employee = await prisma.employee.findFirst({
    where: { OR: [{ id: employeeId }, { employeeNumber: employeeId }] },
    include: {
      department: true,
      jobPosition: true,
      _count: { select: { contracts: true, attendance: true, timeOffRequests: true, allocations: true } },
    },
  });

  if (!employee) return null;

  return {
    id: employee.id,
    employeeNumber: employee.employeeNumber,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    phone: employee.phone ?? "",
    department: employee.department?.name ?? "Unassigned",
    position: employee.jobPosition?.title ?? "Unassigned",
    status: employee.status,
    dateOfJoining: employee.hireDate.toISOString().slice(0, 10),
    counts: employee._count,
  };
}

export async function getPayrollEligibleEmployeesAction() {
  const employees = await prisma.employee.findMany({ where: { status: "ACTIVE" }, orderBy: { lastName: "asc" }, include: { department: true, contracts: { where: { status: "ACTIVE" }, orderBy: { startDate: "desc" }, take: 1 } } });
  return employees.map((employee) => ({ id: employee.id, employeeNumber: employee.employeeNumber, name: `${employee.firstName} ${employee.lastName}`, department: employee.department?.name ?? "-", wage: Number(employee.contracts[0]?.baseSalary ?? 0) }));
}

// -------------------------------------------------------------
// CONTRACTS
// -------------------------------------------------------------

export async function getContractsAction() {
  try {
    const contracts = await prisma.contract.findMany({
      orderBy: { startDate: "desc" },
      include: {
        employee: true,
        department: true,
        position: true,
      },
    });
    return contracts.map((c) => ({
      id: c.id.length > 8 ? `CON-${c.id.slice(-4).toUpperCase()}` : c.id,
      rawId: c.id,
      employee: c.employee ? `${c.employee.firstName} ${c.employee.lastName}` : "Unknown Employee",
      employeeId: c.employeeId,
      position: c.title || c.position?.title || "Staff",
      department: c.department?.name || "Engineering",
      startDate: c.startDate.toISOString().split("T")[0] || "",
      endDate: c.endDate ? c.endDate.toISOString().split("T")[0] || "-" : "-",
      wage: Number(c.wage ?? c.baseSalary ?? 0),
      status: (c.status === "ACTIVE" ? "Active" : "Ended") as "Active" | "Ended",
    }));
  } catch {
    return [];
  }
}

export async function getWorkingSchedulesAction() {
  const schedules = await prisma.workingSchedule.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" }, include: { scheduleDays: { orderBy: { dayOfWeek: "asc" } }, _count: { select: { contracts: true } } } });
  return schedules.map((schedule) => ({ ...schedule, weeklyHours: Number(schedule.weeklyHours), contractCount: schedule._count.contracts }));
}

type WorkingScheduleDayInput = { dayOfWeek: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN"; startTime?: string | null; endTime?: string | null; breakMinutes?: number; isWorkingDay?: boolean };

function calculateWeeklyHours(days: WorkingScheduleDayInput[]) {
  return days.reduce((total, day) => {
    if (!day.isWorkingDay || !day.startTime || !day.endTime) return total;
    const [startHour = 0, startMinute = 0] = day.startTime.split(":").map(Number);
    const [endHour = 0, endMinute = 0] = day.endTime.split(":").map(Number);
    const minutes = Math.max(0, (endHour * 60 + endMinute) - (startHour * 60 + startMinute) - Number(day.breakMinutes ?? 0));
    return total + minutes / 60;
  }, 0);
}

export async function saveWorkingScheduleAction(data: { id?: string; name: string; code?: string; description?: string; status?: "ACTIVE" | "INACTIVE"; days: WorkingScheduleDayInput[] }) {
  try {
    const days = data.days.map((day) => ({ ...day, breakMinutes: Number(day.breakMinutes ?? 0), isWorkingDay: Boolean(day.isWorkingDay) }));
    const weeklyHours = calculateWeeklyHours(days);
    if (!data.name.trim()) return { success: false, error: "Schedule name is required." };
    if (weeklyHours <= 0) return { success: false, error: "Add at least one working day with valid start and end times." };
    const result = await prisma.$transaction(async (tx) => {
      const schedule = data.id
        ? await tx.workingSchedule.update({ where: { id: data.id }, data: { name: data.name.trim(), code: data.code?.trim() || null, description: data.description?.trim() || null, status: data.status ?? "ACTIVE", weeklyHours, days } })
        : await tx.workingSchedule.create({ data: { name: data.name.trim(), code: data.code?.trim() || null, description: data.description?.trim() || null, status: data.status ?? "ACTIVE", weeklyHours, days } });
      if (data.id) await tx.workingScheduleDay.deleteMany({ where: { workingScheduleId: schedule.id } });
      if (days.length) await tx.workingScheduleDay.createMany({ data: days.map((day) => ({ workingScheduleId: schedule.id, dayOfWeek: day.dayOfWeek, startTime: day.startTime || null, endTime: day.endTime || null, breakMinutes: day.breakMinutes, isWorkingDay: day.isWorkingDay })) });
      return schedule;
    });
    revalidatePath("/working-schedules");
    revalidatePath("/contracts");
    return { success: true, schedule: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to save working schedule." };
  }
}

export async function deactivateWorkingScheduleAction(id: string) {
  try {
    const assigned = await prisma.contract.count({ where: { workingScheduleId: id, status: "ACTIVE" } });
    if (assigned > 0) return { success: false, error: "This schedule is assigned to active contracts and cannot be deactivated." };
    await prisma.workingSchedule.update({ where: { id }, data: { status: "INACTIVE" } });
    revalidatePath("/working-schedules");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to deactivate working schedule." };
  }
}

export async function createContractAction(data: {
  employeeId: string;
  position: string;
  department: string;
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACTOR";
  startDate: string;
  endDate?: string;
  wage: number;
  salaryStructureId?: string;
  workingScheduleId?: string;
}) {
  try {
    // 1. Resolve employee: find by ID or employeeNumber (e.g. "EMP-001" or cuid)
    let employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { id: data.employeeId },
          { employeeNumber: data.employeeId },
        ],
      },
    });

    if (!employee) {
      employee = await prisma.employee.findFirst({ where: { status: "ACTIVE" } });
    }

    if (!employee) {
      return { success: false, error: "No employee found. Please create an employee first." };
    }

    const realEmployeeId = employee.id;
    const contractStartDate = new Date(data.startDate);
    const contractEndDate = data.endDate ? new Date(data.endDate) : null;

    // 2. Handle active contract overlaps per AGENTS.md:
    // If the employee already has an active contract that overlaps, close or expire the old one
    const existingActive = await prisma.contract.findFirst({
      where: {
        employeeId: realEmployeeId,
        status: "ACTIVE",
      },
    });

    if (existingActive) {
      // Set end date of previous contract to the day before the new contract start date
      const previousEnd = new Date(contractStartDate.getTime() - 24 * 60 * 60 * 1000);
      await prisma.contract.update({
        where: { id: existingActive.id },
        data: {
          status: "EXPIRED",
          endDate: previousEnd > existingActive.startDate ? previousEnd : existingActive.startDate,
        },
      });
    }

    // 3. Resolve department and position relations if available
    const dept = await prisma.department.findFirst({
      where: { name: { contains: data.department, mode: "insensitive" } },
    });
    const structure = await prisma.salaryStructure.findFirst();
    const schedule = await prisma.workingSchedule.findFirst();

    // 4. Create the contract in PostgreSQL
    const contract = await prisma.contract.create({
      data: {
        employeeId: realEmployeeId,
        title: data.position,
        baseSalary: data.wage,
        wage: data.wage,
        weeklyHours: 40,
        payrollProfileCode: "STANDARD",
        startDate: contractStartDate,
        endDate: contractEndDate,
        status: "ACTIVE",
        departmentId: dept?.id,
        salaryStructureId: structure?.id,
        workingScheduleId: schedule?.id,
      },
      include: {
        employee: true,
      },
    });

    revalidatePath("/contracts");
    return {
      success: true,
      contract: {
        ...contract,
        employeeName: `${employee.firstName} ${employee.lastName}`,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create contract";
    return { success: false, error: msg };
  }
}

// -------------------------------------------------------------
// -------------------------------------------------------------
// ATTENDANCE
// -------------------------------------------------------------

export async function getAttendanceAction() {
  try {
    const records = await prisma.attendance.findMany({
      orderBy: { date: "desc" },
      take: 100,
      include: {
        employee: true,
      },
    });

    const statusMap: Record<string, "Present" | "Late" | "Absent" | "Half Day"> = {
      PRESENT: "Present",
      LATE: "Late",
      ABSENT: "Absent",
      HALF_DAY: "Half Day",
    };

    return records.map((r) => {
      const checkInStr = r.checkIn
        ? r.checkIn.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
        : "-";
      const checkOutStr = r.checkOut
        ? r.checkOut.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
        : "-";

      const hours = (r.workedMinutes / 60).toFixed(2);

      return {
        id: r.id.length > 8 ? `ATT-${r.id.slice(-4).toUpperCase()}` : r.id,
        rawId: r.id,
        employee: r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : "Staff Member",
        employeeId: r.employeeId,
        date: r.date.toISOString().split("T")[0] || "",
        checkIn: checkInStr,
        checkOut: checkOutStr,
        workedHours: r.workedMinutes > 0 ? hours : (r.checkIn && !r.checkOut ? "In Progress" : "0.00"),
        status: statusMap[r.status] || "Present",
      };
    });
  } catch {
    return [];
  }
}

export async function createAttendanceAction(data: {
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY";
  remarks?: string;
}) {
  try {
    // 1. Resolve real employee ID (support cuid, employeeNumber, or session name)
    const requestedEmployeeId = data.employeeId.trim();
    const linkedUser = await prisma.user.findUnique({ where: { id: requestedEmployeeId }, select: { employeeId: true } });
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { id: requestedEmployeeId },
          { employeeNumber: requestedEmployeeId },
          ...(linkedUser?.employeeId ? [{ id: linkedUser.employeeId }] : []),
        ],
      },
      include: {
        contracts: {
          where: { status: "ACTIVE" },
          take: 1,
        },
      },
    });

    if (!employee) {
      return { success: false, error: `Employee record not found for "${requestedEmployeeId}"` };
    }

    const realEmployeeId = employee.id;
    const workingScheduleId = employee.contracts[0]?.workingScheduleId || null;

    // 2. Format normalized UTC midnight date for unique constraint
    const dateObj = new Date(data.date);
    dateObj.setUTCHours(0, 0, 0, 0);

    const checkInDate = data.checkIn ? new Date(`${data.date}T${data.checkIn}:00`) : undefined;
    const checkOutDate = data.checkOut ? new Date(`${data.date}T${data.checkOut}:00`) : undefined;

    let workedMinutes = 0;
    if (checkInDate && checkOutDate) {
      const diffMs = checkOutDate.getTime() - checkInDate.getTime();
      workedMinutes = Math.max(0, Math.round(diffMs / 60000));
    } else if (data.status === "PRESENT") {
      workedMinutes = 480;
    } else if (data.status === "HALF_DAY") {
      workedMinutes = 240;
    }

    // 3. Upsert into PostgreSQL database
    const employeeExists = await prisma.employee.count({ where: { id: realEmployeeId } });
    if (employeeExists !== 1) {
      return { success: false, error: `Employee relation is missing for "${requestedEmployeeId}". Refresh employees and try again.` };
    }

    const record = await prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId: realEmployeeId,
          date: dateObj,
        },
      },
      update: {
        checkIn: checkInDate,
        checkOut: checkOutDate,
        workedMinutes,
        status: data.status,
        correctionReason: data.remarks || null,
        workingScheduleId,
      },
      create: {
        employeeId: realEmployeeId,
        date: dateObj,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        workedMinutes,
        status: data.status,
        correctionReason: data.remarks || null,
        workingScheduleId,
      },
      include: {
        employee: true,
      },
    });

    revalidatePath("/attendance");
    return {
      success: true,
      attendance: {
        ...record,
        employeeName: `${employee.firstName} ${employee.lastName}`,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to record attendance";
    return { success: false, error: msg };
  }
}

export async function quickCheckInAction(employeeId: string, type: "IN" | "OUT") {
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0] || "2023-10-01";
  const timeStr = (today.toTimeString().split(" ")[0] || "09:00").slice(0, 5);

  return createAttendanceAction({
    employeeId,
    date: dateStr,
    checkIn: type === "IN" ? timeStr : undefined,
    checkOut: type === "OUT" ? timeStr : undefined,
    status: "PRESENT",
    remarks: `Quick employee ${type === "IN" ? "Check-in" : "Check-out"} via ledger`,
  });
}

// -------------------------------------------------------------
// TIME OFF
// -------------------------------------------------------------

export async function createTimeOffRequestAction(data: {
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}) {
  try {
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { id: data.employeeId },
          { employeeNumber: data.employeeId },
        ],
      },
    });

    if (!employee) {
      return { success: false, error: `Employee record not found (${data.employeeId})` };
    }

    const type = await prisma.timeOffType.findFirst({
      where: {
        OR: [
          { id: data.leaveTypeId },
          { code: data.leaveTypeId },
          { name: { contains: data.leaveTypeId, mode: "insensitive" } },
        ],
        status: "ACTIVE",
      },
    });

    if (!type) {
      return { success: false, error: "Selected active time-off type was not found." };
    }

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return { success: false, error: "Time-off end date must be on or after start date." };
    const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const req = await prisma.timeOffRequest.create({
      data: {
        employeeId: employee.id,
        timeOffTypeId: type.id,
        startDate: start,
        endDate: end,
        quantity: diffDays,
        reason: data.reason || null,
        status: "SUBMITTED",
      },
      include: {
        employee: true,
        timeOffType: true,
      },
    });

    revalidatePath("/time-off/requests");
    return { success: true, request: req };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create leave request";
    return { success: false, error: msg };
  }
}

export async function updateLeaveRequestStatusAction(id: string, status: "APPROVED" | "REJECTED", approvedById?: string) {
  try {
    const request = await prisma.$transaction(async (tx) => {
      const existing = await tx.timeOffRequest.findUnique({ where: { id }, include: { timeOffType: true } });
      if (!existing) throw new Error("Leave request not found.");
      if (existing.status === "APPROVED" && status === "APPROVED") return existing;
      if (existing.status !== "SUBMITTED") throw new Error(`Cannot change a ${existing.status.toLowerCase()} request.`);

      let approverId: string | null = null;
      if (status === "APPROVED" && approvedById) {
        approverId = (await tx.user.findUnique({ where: { id: approvedById }, select: { id: true } }))?.id ?? null;
      }

      if (status === "APPROVED" && existing.timeOffType.requiresAllocation) {
        const allocation = await tx.allocation.findFirst({ where: { employeeId: existing.employeeId, timeOffTypeId: existing.timeOffTypeId, periodStart: { lte: existing.startDate }, periodEnd: { gte: existing.endDate }, status: "ACTIVE" } });
        if (!allocation) throw new Error("No valid leave allocation exists for this request.");
        if (Number(allocation.remaining ?? 0) < Number(existing.quantity)) throw new Error("Insufficient leave balance.");
        await tx.allocation.update({ where: { id: allocation.id }, data: { consumed: { increment: existing.quantity }, remaining: { decrement: existing.quantity } } });
      }

      return tx.timeOffRequest.update({ where: { id }, data: { status, approvedById: status === "APPROVED" ? approverId : null, approvedAt: status === "APPROVED" ? new Date() : null } });
    });
    revalidatePath("/time-off/requests");
    revalidatePath("/time-off/allocations");
    return { success: true, request };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update status";
    return { success: false, error: msg };
  }
}

// -------------------------------------------------------------
// PAYROLL BATCH ACTIONS
// -------------------------------------------------------------

export async function computePayrunAction(payrunId: string) {
  const result = await payrollApiFetch(`/api/payroll/payruns/${payrunId}/compute`, { method: "POST" });
  revalidatePath(`/payroll/payruns/${payrunId}`);
  return { success: true, result };
}

export async function getTimeOffTypesAction() {
  return prisma.timeOffType.findMany({ orderBy: { name: "asc" } });
}

export async function createTimeOffTypeAction(data: { name: string; unit: "DAYS" | "HOURS"; requiresApproval: boolean; isPaid: boolean }) {
  try {
    const type = await prisma.timeOffType.create({ data: { name: data.name.trim(), code: data.name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").slice(0, 30), unit: data.unit, requiresAllocation: true, approvalRequired: data.requiresApproval, paid: data.isPaid, payrollBehavior: data.isPaid ? "PAID" : "UNPAID" } });
    revalidatePath("/time-off/types");
    return { success: true, type };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to create time-off type" };
  }
}

export async function deactivateTimeOffTypeAction(id: string) {
  try {
    const type = await prisma.timeOffType.update({ where: { id }, data: { status: "INACTIVE" } });
    revalidatePath("/time-off/types");
    return { success: true, type };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to deactivate time-off type" };
  }
}

export async function getAllocationsAction() {
  const rows = await prisma.allocation.findMany({ orderBy: { periodStart: "desc" }, include: { employee: true, timeOffType: true } });
  return rows.map((row) => ({ id: row.id, employeeId: row.employeeId, employee: `${row.employee.firstName} ${row.employee.lastName}`, type: row.timeOffType.name, allocated: Number(row.allocated), used: Number(row.consumed), remaining: Number(row.remaining ?? Number(row.allocated) - Number(row.consumed)) }));
}

export async function createAllocationAction(data: { employeeId: string; timeOffTypeId: string; allocated: number; periodStart: string; periodEnd: string }) {
  try {
    const employee = await prisma.employee.findFirst({ where: { OR: [{ id: data.employeeId }, { employeeNumber: data.employeeId }] } });
    if (!employee) return { success: false, error: "Selected employee was not found in the database." };
    const type = await prisma.timeOffType.findUnique({ where: { id: data.timeOffTypeId } });
    if (!type) return { success: false, error: "Selected time-off type was not found in the database." };
    const allocation = await prisma.allocation.upsert({
      where: { employeeId_timeOffTypeId_periodStart_periodEnd: { employeeId: employee.id, timeOffTypeId: type.id, periodStart: new Date(data.periodStart), periodEnd: new Date(data.periodEnd) } },
      update: { allocated: data.allocated, remaining: data.allocated },
      create: { employeeId: employee.id, timeOffTypeId: type.id, periodStart: new Date(data.periodStart), periodEnd: new Date(data.periodEnd), allocated: data.allocated, consumed: 0, remaining: data.allocated },
    });
    revalidatePath("/time-off/allocations");
    return { success: true, allocation };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to grant allocation" };
  }
}

export async function getTimeOffRequestsAction() {
  const rows = await prisma.timeOffRequest.findMany({ orderBy: { createdAt: "desc" }, include: { employee: true, timeOffType: true } });
  return rows.map((row) => ({ id: row.id, employeeId: row.employeeId, employee: `${row.employee.firstName} ${row.employee.lastName}`, type: row.timeOffType.name, dates: `${row.startDate.toISOString().slice(0, 10)} to ${row.endDate.toISOString().slice(0, 10)}`, duration: `${Number(row.quantity)} ${row.timeOffType.unit === "DAYS" ? "Days" : "Hours"}`, status: row.status === "APPROVED" ? "Approved" : row.status === "REJECTED" ? "Rejected" : row.status === "CANCELLED" ? "Cancelled" : "Pending" }));
}

export async function getHrDashboardAction() {
  const [employees, attendance, pendingLeave, approvedLeave, departments] = await Promise.all([
    prisma.employee.count({ where: { status: { not: "TERMINATED" } } }),
    prisma.attendance.findMany({ where: { date: { gte: new Date(Date.now() - 30 * 86400000) } }, select: { status: true } }),
    prisma.timeOffRequest.count({ where: { status: "SUBMITTED" } }),
    prisma.timeOffRequest.aggregate({ where: { status: "APPROVED", startDate: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }, _sum: { quantity: true } }),
    prisma.department.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { employees: true } } } }),
  ]);
  const attendanceRate = attendance.length ? Math.round((attendance.filter((item) => ["PRESENT", "REMOTE"].includes(item.status)).length / attendance.length) * 1000) / 10 : 0;
  return { headcount: employees, attendanceRate, pendingLeave, approvedLeave: Number(approvedLeave._sum.quantity ?? 0), departments: departments.map((department) => ({ name: department.name, total: department._count.employees })) };
}

export async function getPayrollDashboardAction(period?: string, departmentId?: string) {
  const selectedPeriod = period && /^\d{4}-\d{2}$/.test(period) ? period : new Date().toISOString().slice(0, 7);
  const periodStart = new Date(`${selectedPeriod}-01T00:00:00.000Z`);
  const periodEnd = new Date(Date.UTC(periodStart.getUTCFullYear(), periodStart.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  const payruns = await payrollApiFetch<any[]>("/api/payroll/payruns");
  const matchingPayruns = payruns.filter((payrun) => {
    const start = new Date(payrun.periodStart);
    const end = new Date(payrun.periodEnd);
    return start <= periodEnd && end >= periodStart;
  });
  const payslips = matchingPayruns.flatMap((payrun) => (payrun.payslips ?? []).map((payslip: any) => ({ ...payslip, payrunStatus: payrun.status, payrunName: payrun.name, period: String(payrun.periodStart).slice(0, 7) })));
  const employeeIds = [...new Set(payslips.map((payslip) => payslip.employeeId).filter(Boolean))];
  const employees = await prisma.employee.findMany({ where: { id: { in: employeeIds } }, select: { id: true, departmentId: true, department: { select: { name: true } }, bankAccountId: true } });
  const employeeMap = new Map(employees.map((employee) => [employee.id, employee]));
  const scopedPayslips = payslips.filter((payslip) => !departmentId || employeeMap.get(payslip.employeeId)?.departmentId === departmentId);
  const totalNetPaid = scopedPayslips.filter((payslip) => payslip.payrunStatus === "PAID").reduce((sum, payslip) => sum + Number(payslip.netAmount ?? 0), 0);
  const totalNet = scopedPayslips.reduce((sum, payslip) => sum + Number(payslip.netAmount ?? 0), 0);
  const salaryByDepartment = Object.values(scopedPayslips.reduce((groups: Record<string, { name: string; total: number }>, payslip) => {
    const name = employeeMap.get(payslip.employeeId)?.department?.name ?? "Unassigned";
    groups[name] ??= { name, total: 0 };
    groups[name].total += Number(payslip.netAmount ?? 0);
    return groups;
  }, {})).map((group) => ({ ...group, total: Math.round(group.total * 100) / 100 }));
  const approvedLeave = await prisma.timeOffRequest.aggregate({ where: { status: "APPROVED", startDate: { lte: periodEnd }, endDate: { gte: periodStart }, ...(departmentId ? { employee: { departmentId } } : {}) }, _sum: { quantity: true } });
  const attendanceExceptions = await prisma.attendance.count({ where: { date: { gte: periodStart, lte: periodEnd }, status: "EXCEPTION", ...(departmentId ? { employee: { departmentId } } : {}) } });
  const pendingApprovals = await prisma.timeOffRequest.count({ where: { status: "SUBMITTED", ...(departmentId ? { employee: { departmentId } } : {}) } });
  const missingBankDetails = [...new Set(scopedPayslips.map((payslip) => payslip.employeeId))].filter((employeeId) => !employeeMap.get(employeeId)?.bankAccountId).length;
  const departments = await prisma.department.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  return { period: selectedPeriod, totalNetPaid, payslipsGenerated: scopedPayslips.length, averageNet: scopedPayslips.length ? totalNet / scopedPayslips.length : 0, approvedLeave: Number(approvedLeave._sum.quantity ?? 0), salaryByDepartment, departments, alerts: { attendanceExceptions, pendingApprovals, missingBankDetails } };
}

export async function validatePayrunAction(payrunId: string) {
  try {
    const payrun = await payrollApiFetch<any>(`/api/payroll/payruns/${payrunId}`);
    const periodStart = new Date(payrun.periodStart);
    const periodEnd = new Date(payrun.periodEnd);
    const warnings: Array<{ code: string; message: string; blocking: boolean; employeeId?: string }> = [];
    const payslips = Array.isArray(payrun.payslips) ? payrun.payslips : [];

    if (!payslips.length) warnings.push({ code: "NO_PAYSLIPS", message: "Compute the payrun before validation.", blocking: true });
    const employeeIds: string[] = payslips.map((payslip: any) => String(payslip.employeeId ?? "")).filter(Boolean);
    const uniqueEmployeeIds = [...new Set(employeeIds)];
    const duplicateEmployeeIds = employeeIds.filter((employeeId: string, index: number) => employeeIds.indexOf(employeeId) !== index);
    [...new Set(duplicateEmployeeIds)].forEach((employeeId) => warnings.push({ code: "DUPLICATE_PAYSLIP", message: `Duplicate payslip detected for employee ${employeeId}.`, blocking: true, employeeId }));

    const structure = await payrollApiFetch<any>(`/api/payroll/salary-structures/${payrun.salaryStructureId}`);
    if (!structure?.rules?.length) warnings.push({ code: "NO_SALARY_RULES", message: "Salary structure has no assigned salary rules.", blocking: true });

    const [employees, contracts] = await Promise.all([
      prisma.employee.findMany({ where: { id: { in: uniqueEmployeeIds } }, select: { id: true, firstName: true, lastName: true, bankAccountId: true } }),
      prisma.contract.findMany({ where: { employeeId: { in: uniqueEmployeeIds } }, select: { employeeId: true, status: true, startDate: true, endDate: true } }),
    ]);
    const employeeMap = new Map(employees.map((employee) => [employee.id, employee]));
    const contractsByEmployee = new Map<string, typeof contracts>();
    contracts.forEach((contract) => contractsByEmployee.set(contract.employeeId, [...(contractsByEmployee.get(contract.employeeId) ?? []), contract]));
    for (const employeeId of uniqueEmployeeIds) {
      const employee = employeeMap.get(employeeId);
      if (!employee) {
        warnings.push({ code: "MISSING_EMPLOYEE", message: `Employee record ${employeeId} no longer exists in HR.`, blocking: true, employeeId });
        continue;
      }
      if (!employee.bankAccountId) warnings.push({ code: "MISSING_BANK_ACCOUNT", message: `${employee.firstName} ${employee.lastName} has no bank account.`, blocking: true, employeeId });
      const applicableContract = (contractsByEmployee.get(employeeId) ?? []).some((contract) => contract.status === "ACTIVE" && contract.startDate <= periodEnd && (!contract.endDate || contract.endDate >= periodStart));
      if (!applicableContract) warnings.push({ code: "INVALID_CONTRACT_PERIOD", message: `${employee.firstName} ${employee.lastName} has no applicable active contract for this period.`, blocking: true, employeeId });
    }

    const attendanceExceptions = await prisma.attendance.count({ where: { employeeId: { in: uniqueEmployeeIds }, date: { gte: periodStart, lte: periodEnd }, status: "EXCEPTION" } });
    if (attendanceExceptions > 0) warnings.push({ code: "ATTENDANCE_EXCEPTIONS", message: `${attendanceExceptions} attendance exceptions need review.`, blocking: false });
    const pendingLeave = await prisma.timeOffRequest.count({ where: { employeeId: { in: uniqueEmployeeIds }, status: "SUBMITTED", startDate: { lte: periodEnd }, endDate: { gte: periodStart } } });
    if (pendingLeave > 0) warnings.push({ code: "PENDING_LEAVE", message: `${pendingLeave} leave requests are still pending in this pay period.`, blocking: false });
    payslips.filter((payslip: any) => Number(payslip.netAmount) < 0).forEach((payslip: any) => warnings.push({ code: "NEGATIVE_NET", message: `Negative net amount for employee ${payslip.employeeId}.`, blocking: true, employeeId: payslip.employeeId }));

    if (warnings.some((warning) => warning.blocking)) return { success: false, warnings, error: "Payroll validation blocked by data warnings." };
    const result = await payrollApiFetch(`/api/payroll/payruns/${payrunId}/validate`, { method: "POST" });
    revalidatePath(`/payroll/payruns/${payrunId}`);
    return { success: true, result, warnings };
  } catch (error) {
    return { success: false, warnings: [], error: error instanceof Error ? error.message : "Payroll validation failed." };
  }
}

export async function markPayrunPaidAction(payrunId: string) {
  const result = await payrollApiFetch(`/api/payroll/payruns/${payrunId}/pay`, { method: "POST" });
  revalidatePath(`/payroll/payruns/${payrunId}`);
  return { success: true, result };
}

export async function sendPayrunPayslipsAction(payrunId: string) {
  try {
    const payrun = await payrollApiFetch<any>(`/api/payroll/payruns/${payrunId}`);
    if (!['VALIDATED', 'PAID'].includes(payrun.status)) return { success: false, message: "Payslips can only be emailed after validation." };
    const summaries = Array.isArray(payrun.payslips) ? payrun.payslips : [];
    if (!summaries.length) return { success: false, message: "Payrun has no payslips to deliver." };
    if (!process.env.SMTP_HOST || !process.env.SMTP_FROM && !process.env.SMTP_USER) return { success: false, message: "Configure SMTP_HOST and SMTP_FROM (or SMTP_USER) before sending payslips." };

    const employeeIds = summaries.map((summary: any) => summary.employeeId).filter(Boolean);
    const employees = await prisma.employee.findMany({ where: { id: { in: employeeIds } }, select: { id: true, firstName: true, email: true } });
    const employeesById = new Map(employees.map((employee) => [employee.id, employee]));
    const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT ?? 587), secure: process.env.SMTP_SECURE === "true", auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined });
    const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
    const results: Array<{ employeeId: string; email: string; status: "sent" }> = [];
    for (const summary of summaries) {
      const employee = employeesById.get(summary.employeeId);
      if (!employee?.email) throw new Error(`Employee email is missing for ${summary.employeeId}.`);
      const payslip = await getPayslipAction(summary.id);
      const lines = (payslip.lines ?? []).map((line: any) => `<tr><td>${escapeEmailHtml(line.rule)}</td><td>${escapeEmailHtml(line.category)}</td><td>${Number(line.amount).toFixed(2)}</td></tr>`).join("");
      const pdfBase64 = await getPayslipPdfAction(summary.id);
      await transporter.sendMail({ from, to: employee.email, subject: `Payslip - ${payrun.name}`, html: `<p>Hello ${escapeEmailHtml(employee.firstName)},</p><p>Your payslip for ${escapeEmailHtml(String(payrun.periodStart).slice(0, 10))} to ${escapeEmailHtml(String(payrun.periodEnd).slice(0, 10))} is ready.</p><table><thead><tr><th>Component</th><th>Category</th><th>Amount</th></tr></thead><tbody>${lines}</tbody></table><p>Gross: ${Number(payslip.gross).toFixed(2)}<br>Deductions: ${Number(payslip.deductions).toFixed(2)}<br><strong>Net: ${Number(payslip.net).toFixed(2)}</strong></p>`, attachments: [{ filename: `Payslip_${summary.id}.pdf`, content: Buffer.from(pdfBase64, "base64"), contentType: "application/pdf" }] });
      results.push({ employeeId: employee.id, email: employee.email, status: "sent" });
    }
    return { success: true, message: `Sent ${results.length} payslip(s).`, sent: results.length, results };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Payslip delivery failed." };
  }
}

function escapeEmailHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character] ?? character));
}

export async function listPayrollRulesAction() {
  return payrollApiFetch<unknown[]>("/api/payroll/salary-rules");
}

export async function listPayrollCategoriesAction() {
  return payrollApiFetch<unknown[]>("/api/payroll/salary-rule-categories");
}

export async function createPayrollRuleAction(body: unknown) {
  try {
    const result = await payrollApiFetch("/api/payroll/salary-rules", { method: "POST", body });
    revalidatePath("/payroll/rules");
    return { success: true, result };
  } catch (error) {
    return { success: false, error: payrollUnavailableMessage(error) };
  }
}

export async function deactivatePayrollRuleAction(id: string) {
  try {
    const result = await payrollApiFetch(`/api/payroll/salary-rules/${id}`, { method: "DELETE" });
    revalidatePath("/payroll/rules");
    return { success: true, result };
  } catch (error) {
    return { success: false, error: payrollUnavailableMessage(error) };
  }
}

export async function listPayrollStructuresAction() {
  return payrollApiFetch<unknown[]>("/api/payroll/salary-structures");
}

export async function createPayrollStructureAction(body: unknown) {
  try {
    const result = await payrollApiFetch("/api/payroll/salary-structures", { method: "POST", body });
    revalidatePath("/payroll/structures");
    return { success: true, result };
  } catch (error) {
    return { success: false, error: payrollUnavailableMessage(error) };
  }
}

function payrollUnavailableMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Payroll API request failed.";
  return message.includes("fetch failed") || message.includes("ECONNREFUSED")
    ? "Payroll API unavailable. Start the Java service with `pnpm dev:payroll` and try again."
    : message;
}

export async function listPayrunsAction() {
  return payrollApiFetch<unknown[]>("/api/payroll/payruns");
}

export async function getPayrunAction(id: string) {
  return payrollApiFetch(`/api/payroll/payruns/${id}`);
}

export async function getPayrollReportAction(from: string, to: string, status?: string) {
  const query = new URLSearchParams({ from: `${from}T00:00:00`, to: `${to}T23:59:59` });
  if (status) query.set("status", status);
  const [summary, report] = await Promise.all([
    payrollApiFetch<any>(`/api/payroll/reports/summary?${query.toString()}`),
    payrollApiFetch<any>(`/api/payroll/reports/payslips?${query.toString()}`),
  ]);
  const employeeIds: string[] = Array.from(new Set<string>((report.payslips ?? []).map((row: any) => String(row.employeeId ?? "")).filter(Boolean)));
  const [employees, departments] = await Promise.all([
    prisma.employee.findMany({ where: { id: { in: employeeIds } }, select: { id: true, firstName: true, lastName: true, departmentId: true } }),
    prisma.department.findMany({ select: { id: true, name: true } }),
  ]);
  const employeeMap = new Map(employees.map((employee) => [employee.id, employee]));
  const departmentMap = new Map(departments.map((department) => [department.id, department.name]));
  return { summary, payslips: (report.payslips ?? []).map((row: any) => ({ ...row, employeeName: employeeMap.get(row.employeeId) ? `${employeeMap.get(row.employeeId)?.firstName} ${employeeMap.get(row.employeeId)?.lastName}` : "Unknown employee", department: departmentMap.get(employeeMap.get(row.employeeId)?.departmentId ?? "") ?? "Unassigned" })) };
}

export async function getPayrollAuditAction(payrunId: string) {
  return payrollApiFetch(`/api/payroll/payruns/${payrunId}/audit`);
}

export async function getPayrollAuditLogAction() {
  const payruns = await payrollApiFetch<any[]>("/api/payroll/payruns");
  const auditedPayruns = payruns.filter((payrun) => payrun.status !== "DRAFT").slice(0, 25);
  const entries = await Promise.all(auditedPayruns.map(async (payrun) => {
    try {
      const audit = await getPayrollAuditAction(payrun.id) as any;
      return { payrunId: payrun.id, payrunName: payrun.name, periodStart: payrun.periodStart, periodEnd: payrun.periodEnd, status: payrun.status, audit };
    } catch {
      return null;
    }
  }));
  return entries.filter(Boolean);
}

export async function getPayrunPaymentStatusAction(payrunId: string) {
  return payrollApiFetch(`/api/payroll/payruns/${payrunId}/payment-status`);
}

export async function getPayslipPaymentStatusAction(payslipId: string) {
  return payrollApiFetch(`/api/payroll/payslips/${payslipId}/payment-status`);
}

export async function createPayrunAction(body: unknown) {
  const result = await payrollApiFetch("/api/payroll/payruns", { method: "POST", body });
  revalidatePath("/payroll/payruns");
  return result;
}

export async function listPayrunPayslipsAction(payrunId: string) {
  const payslips = await payrollApiFetch<any[]>(`/api/payroll/payruns/${payrunId}/payslips`);
  return Promise.all(payslips.map(async (payslip) => {
    const employee = await prisma.employee.findUnique({ where: { id: payslip.employeeId } });
    return { ...payslip, employeeName: employee ? `${employee.firstName} ${employee.lastName}` : payslip.employeeId };
  }));
}

export async function updatePayrollStructureAction(id: string, body: unknown) {
  try {
    const result = await payrollApiFetch(`/api/payroll/salary-structures/${id}`, { method: "PUT", body });
    revalidatePath("/payroll/structures");
    return { success: true, result };
  } catch (error) {
    return { success: false, error: payrollUnavailableMessage(error) };
  }
}

export async function getPayslipAction(id: string) {
  const session = await getServerSession(authOptions);
  const payslip = await payrollApiFetch<any>(`/api/payroll/payslips/${id}`);
  if (session?.user?.role === "EMPLOYEE" && payslip.employeeId !== session.user.employeeId) {
    throw new Error("You are not authorized to view this payslip.");
  }
  const employee = await prisma.employee.findUnique({ where: { id: payslip.employeeId }, include: { department: true, jobPosition: true } });
  const contract = await prisma.contract.findUnique({ where: { id: payslip.contractId } });
  return { ...payslip, employeeName: employee ? `${employee.firstName} ${employee.lastName}` : payslip.employeeId, department: employee?.department?.name ?? "-", position: employee?.jobPosition?.title ?? "-", contractRef: contract?.title ?? payslip.contractId, period: `${String(payslip.periodStart).slice(0, 10)} → ${String(payslip.periodEnd).slice(0, 10)}`, gross: Number(payslip.grossAmount), deductions: Number(payslip.deductionAmount), net: Number(payslip.netAmount), lines: (payslip.lines ?? []).map((line: any) => ({ rule: line.name, category: line.code, amount: Number(line.amount), type: line.amount < 0 ? "DEDUCTION" : "EARNING" })) };
}

export async function getPayslipPdfAction(id: string) {
  const payslip = await getPayslipAction(id);
  if (!["VALIDATED", "PAID"].includes(payslip.status)) throw new Error("Payslip PDF is available only after validation or payment.");
  return payrollApiFetchBinary(`/api/payroll/payslips/${id}/pdf`);
}

export async function listPayrollPayslipsAction() {
  const session = await getServerSession(authOptions);
  const payruns = await payrollApiFetch<any[]>("/api/payroll/payruns");
  const slips = (await Promise.all(payruns.flatMap((payrun) => (payrun.payslips ?? []).filter((summary: any) => session?.user?.role !== "EMPLOYEE" || summary.employeeId === session.user.employeeId).map((summary: any) => getPayslipAction(summary.id).then((payslip) => ({ ...payslip, payrun: payrun.name })))))).flat();
  return slips;
}

// -------------------------------------------------------------
// USERS & ROLES
// -------------------------------------------------------------

export type SystemUserRole = "ADMIN" | "HR_MANAGER" | "PAYROLL_MANAGER" | "HR_PAYROLL_USER" | "EMPLOYEE";

export async function getUsersAction() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        employeeId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, users };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch users";
    return { success: false, error: msg, users: [] };
  }
}

export async function createUserAction(data: {
  name: string;
  email: string;
  role: SystemUserRole;
  password: string;
  employeeId?: string;
}) {
  const normalizedEmail = data.email.toLowerCase().trim();
  const trimmedName = data.name.trim();
  const trimmedPassword = data.password.trim();

  if (!trimmedName) {
    return { success: false, error: "Full Name is required." };
  }
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { success: false, error: "A valid email address is required." };
  }
  if (!trimmedPassword || trimmedPassword.length < 8) {
    return { success: false, error: "Password must be at least 8 characters long." };
  }

  try {
    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return { success: false, error: "A user with this email address already exists." };
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(trimmedPassword, 10);

    let employeeId = data.employeeId;

    // For EMPLOYEE role, link to an employee record so portal features work
    if (data.role === "EMPLOYEE" && !employeeId) {
      const existingEmp = await prisma.employee.findUnique({
        where: { email: normalizedEmail },
      });
      if (existingEmp) {
        employeeId = existingEmp.id;
      } else {
        const [firstName, ...lastNameParts] = trimmedName.split(/\s+/);
        const safeFirstName = firstName || "Employee";
        const safeLastName = lastNameParts.join(" ") || safeFirstName;
        const newEmp = await prisma.employee.create({
          data: {
            employeeNumber: `EMP-${Date.now().toString().slice(-6)}`,
            firstName: safeFirstName,
            lastName: safeLastName,
            email: normalizedEmail,
            hireDate: new Date(),
            status: "ACTIVE",
          },
        });
        employeeId = newEmp.id;
      }
    }

    const created = await prisma.user.create({
      data: {
        name: trimmedName,
        email: normalizedEmail,
        passwordHash,
        role: data.role,
        ...(employeeId ? { employeeId } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        employeeId: true,
        createdAt: true,
      },
    });

    revalidatePath("/users");
    return { success: true, user: created };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create user";
    return { success: false, error: msg };
  }
}

export async function resetUserPasswordAction(userId: string, newPassword?: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, error: "User not found." };
    }

    const pass = newPassword?.trim() || "Password123!";
    if (pass.length < 8) {
      return { success: false, error: "Password must be at least 8 characters." };
    }

    const passwordHash = await bcrypt.hash(pass, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    revalidatePath("/users");
    return { success: true, temporaryPassword: pass };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to reset password";
    return { success: false, error: msg };
  }
}

export async function deleteUserAction(userId: string) {
  try {
    await prisma.user.delete({ where: { id: userId } });
    revalidatePath("/users");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete user";
    return { success: false, error: msg };
  }
}

