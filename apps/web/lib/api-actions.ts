"use server";

import { prisma } from "@peoplepay360/db";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { payrollApiFetch } from "@/lib/payroll-api";

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

    let type = await prisma.timeOffType.findFirst({
      where: {
        OR: [
          { id: data.leaveTypeId },
          { code: data.leaveTypeId },
          { name: { contains: data.leaveTypeId, mode: "insensitive" } },
        ],
      },
    });

    if (!type) {
      type = await prisma.timeOffType.findFirst();
    }

    if (!type) {
      return { success: false, error: "No active time off type found." };
    }

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
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

export async function updateLeaveRequestStatusAction(id: string, status: "APPROVED" | "REJECTED") {
  try {
    const res = await fetch(`${HR_API_URL}/time-off/requests/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
      cache: "no-store",
    });

    if (res.ok) {
      revalidatePath("/time-off/requests");
      return { success: true, request: await res.json() };
    }
  } catch {
    // Fallback
  }

  try {
    const req = await prisma.timeOffRequest.update({
      where: { id },
      data: { status },
    });
    revalidatePath("/time-off/requests");
    return { success: true, request: req };
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

export async function validatePayrunAction(payrunId: string) {
  const result = await payrollApiFetch(`/api/payroll/payruns/${payrunId}/validate`, { method: "POST" });
  revalidatePath(`/payroll/payruns/${payrunId}`);
  return { success: true, result };
}

export async function markPayrunPaidAction(payrunId: string) {
  const result = await payrollApiFetch(`/api/payroll/payruns/${payrunId}/pay`, { method: "POST" });
  revalidatePath(`/payroll/payruns/${payrunId}`);
  return { success: true, result };
}

export async function sendPayrunPayslipsAction(payrunId: string) {
  return { success: false, message: `Payslip email delivery is not available in Java API yet (payrun ${payrunId}).` };
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
  const payslip = await payrollApiFetch<any>(`/api/payroll/payslips/${id}`);
  const employee = await prisma.employee.findUnique({ where: { id: payslip.employeeId }, include: { department: true, jobPosition: true } });
  const contract = await prisma.contract.findUnique({ where: { id: payslip.contractId } });
  return { ...payslip, employeeName: employee ? `${employee.firstName} ${employee.lastName}` : payslip.employeeId, department: employee?.department?.name ?? "-", position: employee?.jobPosition?.title ?? "-", contractRef: contract?.title ?? payslip.contractId, period: `${String(payslip.periodStart).slice(0, 10)} → ${String(payslip.periodEnd).slice(0, 10)}`, gross: Number(payslip.grossAmount), deductions: Number(payslip.deductionAmount), net: Number(payslip.netAmount), lines: (payslip.lines ?? []).map((line: any) => ({ rule: line.name, category: line.code, amount: Number(line.amount), type: line.amount < 0 ? "DEDUCTION" : "EARNING" })) };
}

export async function listPayrollPayslipsAction() {
  const payruns = await payrollApiFetch<any[]>("/api/payroll/payruns");
  const slips = (await Promise.all(payruns.flatMap((payrun) => (payrun.payslips ?? []).map((summary: any) => getPayslipAction(summary.id))))).flat();
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

