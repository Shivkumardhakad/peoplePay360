import { BadRequestException, ConflictException, ForbiddenException, Injectable } from "@nestjs/common";
import { AttendanceStatus, ComputationType, ContractStatus, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { PrismaService } from "../../infrastructure/database/prisma.service";

type CreateUserInput = Omit<Prisma.UserUncheckedCreateInput, "passwordHash"> & {
  password?: string;
  temporaryPassword?: string;
  passwordHash?: string;
};

type UpdateUserInput = Prisma.UserUncheckedUpdateInput & {
  password?: string;
  temporaryPassword?: string;
};

type CreateMyAttendanceInput = {
  date: string | Date;
  checkIn?: string | Date | null;
  checkOut?: string | Date | null;
  breakMinutes?: number;
  status?: AttendanceStatus;
};

type CreateMyTimeOffRequestInput = {
  timeOffTypeId: string;
  startDate: string | Date;
  endDate: string | Date;
  quantity: Prisma.Decimal | number | string;
  reason?: string | null;
};

@Injectable()
export class HrService {
  constructor(private readonly prisma: PrismaService) {}

  listEmployees() {
    return this.prisma.client.employee.findMany({
      include: {
        department: true,
        jobPosition: true,
        contracts: {
          orderBy: { startDate: "desc" },
          take: 1
        }
      },
      orderBy: { employeeNumber: "asc" }
    });
  }

  getEmployee(id: string) {
    return this.prisma.client.employee.findUniqueOrThrow({
      where: { id },
      include: {
        department: true,
        jobPosition: true,
        contracts: true,
        attendance: true,
        allocations: { include: { timeOffType: true } },
      },
    });
  }

  async createEmployee(data: Prisma.EmployeeUncheckedCreateInput) {
    if (data.email) {
      const existing = await this.prisma.client.employee.findFirst({
        where: { email: { equals: data.email.trim(), mode: "insensitive" } },
      });
      if (existing) {
        throw new ConflictException(`An employee with email "${data.email}" already exists.`);
      }
    }
    try {
      return await this.prisma.client.employee.create({ data });
    } catch (err: any) {
      if (err?.code === "P2002") {
        throw new ConflictException(`An employee with email "${data.email}" already exists.`);
      }
      throw err;
    }
  }
  async updateEmployee(id: string, data: Prisma.EmployeeUncheckedUpdateInput) {
    if (typeof data.email === "string") {
      const existing = await this.prisma.client.employee.findFirst({
        where: {
          email: { equals: data.email.trim(), mode: "insensitive" },
          NOT: { id },
        },
      });
      if (existing) {
        throw new ConflictException(`An employee with email "${data.email}" already exists.`);
      }
    }
    try {
      return await this.prisma.client.employee.update({ where: { id }, data });
    } catch (err: any) {
      if (err?.code === "P2002") {
        throw new ConflictException(`An employee with email "${data.email}" already exists.`);
      }
      throw err;
    }
  }
  terminateEmployee(id: string) { return this.prisma.client.employee.update({ where: { id }, data: { status: "TERMINATED" } }); }

  requireAuthenticatedEmployeeId(employeeId: string | null | undefined) {
    if (!employeeId) {
      throw new ForbiddenException("Authenticated user is not linked to an employee profile");
    }

    return employeeId;
  }

  getMyProfile(employeeId: string) {
    return this.prisma.client.employee.findUniqueOrThrow({
      where: { id: employeeId },
      include: {
        department: true,
        jobPosition: true,
        contracts: {
          include: {
            department: true,
            position: true,
            workingSchedule: { include: { scheduleDays: true } },
            salaryStructure: true
          },
          orderBy: { startDate: "desc" }
        },
        allocations: { include: { timeOffType: true }, orderBy: { periodStart: "desc" } }
      }
    });
  }

  async getMyDashboard(employeeId: string) {
    const today = new Date();
    const startOfToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const endOfToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1));
    const [allocations, todayAttendance, pendingRequests] = await Promise.all([
      this.listMyAllocations(employeeId),
      this.prisma.client.attendance.findFirst({
        where: { employeeId, date: { gte: startOfToday, lt: endOfToday } },
        orderBy: { date: "desc" }
      }),
      this.prisma.client.timeOffRequest.findMany({
        where: { employeeId, status: "SUBMITTED" },
        include: { timeOffType: true },
        orderBy: { createdAt: "desc" },
        take: 5
      })
    ]);

    return { allocations, todayAttendance, pendingRequests };
  }

  listMyAttendance(employeeId: string) {
    return this.prisma.client.attendance.findMany({
      where: { employeeId },
      include: { workingSchedule: true },
      orderBy: { date: "desc" },
      take: 100
    });
  }

  createMyAttendance(employeeId: string, data: CreateMyAttendanceInput) {
    return this.createAttendance({
      employeeId,
      date: new Date(data.date),
      checkIn: data.checkIn ? new Date(data.checkIn) : undefined,
      checkOut: data.checkOut ? new Date(data.checkOut) : undefined,
      breakMinutes: data.breakMinutes ?? 0,
      status: data.status ?? "PRESENT"
    });
  }

  listMyTimeOffRequests(employeeId: string) {
    return this.prisma.client.timeOffRequest.findMany({
      where: { employeeId },
      include: { timeOffType: true, approvedBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100
    });
  }

  listMyAllocations(employeeId: string) {
    return this.prisma.client.allocation.findMany({
      where: { employeeId },
      include: { timeOffType: true },
      orderBy: { periodStart: "desc" }
    });
  }

  listMyTimeOffTypes() {
    return this.prisma.client.timeOffType.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" }
    });
  }

  createMyTimeOffRequest(employeeId: string, data: CreateMyTimeOffRequestInput) {
    return this.createTimeOffRequest({
      employeeId,
      timeOffTypeId: data.timeOffTypeId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      quantity: data.quantity,
      reason: data.reason ?? undefined,
      status: "SUBMITTED"
    });
  }

  listBankAccounts() { return this.prisma.client.bankAccount.findMany({ include: { employee: true }, orderBy: { accountName: "asc" } }); }
  getBankAccount(id: string) { return this.prisma.client.bankAccount.findUniqueOrThrow({ where: { id }, include: { employee: true } }); }
  createBankAccount(data: Prisma.BankAccountCreateInput) { return this.prisma.client.bankAccount.create({ data }); }
  updateBankAccount(id: string, data: Prisma.BankAccountUpdateInput) { return this.prisma.client.bankAccount.update({ where: { id }, data }); }
  deleteBankAccount(id: string) { return this.prisma.client.bankAccount.delete({ where: { id } }); }

  listDepartments() {
    return this.prisma.client.department.findMany({
      include: {
        positions: true,
        _count: { select: { employees: true } }
      },
      orderBy: { name: "asc" }
    });
  }
  createDepartment(data: Prisma.DepartmentCreateInput) { return this.prisma.client.department.create({ data }); }
  updateDepartment(id: string, data: Prisma.DepartmentUpdateInput) { return this.prisma.client.department.update({ where: { id }, data }); }
  deleteDepartment(id: string) { return this.prisma.client.department.delete({ where: { id } }); }

  listJobPositions() {
    return this.prisma.client.jobPosition.findMany({
      include: { department: true },
      orderBy: { title: "asc" }
    });
  }
  createJobPosition(data: Prisma.JobPositionUncheckedCreateInput) { return this.prisma.client.jobPosition.create({ data }); }
  updateJobPosition(id: string, data: Prisma.JobPositionUncheckedUpdateInput) { return this.prisma.client.jobPosition.update({ where: { id }, data }); }
  deleteJobPosition(id: string) { return this.prisma.client.jobPosition.delete({ where: { id } }); }

  listContracts() {
    return this.prisma.client.contract.findMany({
      include: { employee: true },
      orderBy: [{ employeeId: "asc" }, { startDate: "desc" }]
    });
  }
  getContract(id: string) { return this.prisma.client.contract.findUniqueOrThrow({ where: { id }, include: { employee: true, department: true, position: true, workingSchedule: true, salaryStructure: true } }); }
  async createContract(data: Prisma.ContractUncheckedCreateInput) {
    await this.ensureContractDoesNotOverlap(data.employeeId, new Date(data.startDate), data.endDate ? new Date(data.endDate) : null, data.status as ContractStatus, undefined);
    return this.prisma.client.contract.create({ data });
  }
  async updateContract(id: string, data: Prisma.ContractUncheckedUpdateInput) {
    const current = await this.prisma.client.contract.findUniqueOrThrow({ where: { id } });
    await this.ensureContractDoesNotOverlap(
      (data.employeeId as string | undefined) ?? current.employeeId,
      (data.startDate as Date | undefined) ?? current.startDate,
      data.endDate === undefined ? current.endDate : (data.endDate as Date | null),
      (data.status as ContractStatus | undefined) ?? current.status,
      id
    );
    return this.prisma.client.contract.update({ where: { id }, data });
  }

  listWorkingSchedules() {
    return this.prisma.client.workingSchedule.findMany({
      include: { scheduleDays: true },
      orderBy: { name: "asc" }
    });
  }
  getWorkingSchedule(id: string) { return this.prisma.client.workingSchedule.findUniqueOrThrow({ where: { id }, include: { scheduleDays: true, contracts: true } }); }
  createWorkingSchedule(data: Prisma.WorkingScheduleUncheckedCreateInput) { return this.prisma.client.workingSchedule.create({ data }); }
  async updateWorkingSchedule(id: string, data: Prisma.WorkingScheduleUncheckedUpdateInput) {
    const schedule = await this.prisma.client.workingSchedule.update({ where: { id }, data });
    return this.recalculateScheduleHours(schedule.id);
  }
  deleteWorkingSchedule(id: string) { return this.prisma.client.workingSchedule.delete({ where: { id } }); }
  async createWorkingScheduleDay(data: Prisma.WorkingScheduleDayUncheckedCreateInput) {
    const day = await this.prisma.client.workingScheduleDay.create({ data });
    return this.recalculateScheduleHours(day.workingScheduleId);
  }
  async updateWorkingScheduleDay(id: string, data: Prisma.WorkingScheduleDayUncheckedUpdateInput) {
    const day = await this.prisma.client.workingScheduleDay.update({ where: { id }, data });
    return this.recalculateScheduleHours(day.workingScheduleId);
  }
  async deleteWorkingScheduleDay(id: string) {
    const day = await this.prisma.client.workingScheduleDay.delete({ where: { id } });
    await this.recalculateScheduleHours(day.workingScheduleId);
    return day;
  }

  listAttendance() {
    return this.prisma.client.attendance.findMany({
      include: {
        employee: true,
        workingSchedule: true
      },
      orderBy: { date: "desc" },
      take: 100
    });
  }
  async createAttendance(data: Prisma.AttendanceUncheckedCreateInput) {
    const status = await this.deriveAttendanceStatus(data);
    return this.prisma.client.attendance.create({ data: { ...this.withWorkedMinutes(data), status } });
  }
  async correctAttendance(id: string, data: Prisma.AttendanceUncheckedUpdateInput) {
    const existing = await this.prisma.client.attendance.findUniqueOrThrow({ where: { id } });
    const merged = { ...existing, ...data } as Prisma.AttendanceUncheckedCreateInput;
    const status = await this.deriveAttendanceStatus(merged);
    return this.prisma.client.attendance.update({ where: { id }, data: { ...data, ...this.withWorkedMinutes(data), status, corrected: true } });
  }

  listTimeOffRequests() {
    return this.prisma.client.timeOffRequest.findMany({
      include: {
        employee: true,
        timeOffType: true
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });
  }
  async createTimeOffRequest(data: Prisma.TimeOffRequestUncheckedCreateInput) {
    if (new Date(data.endDate) < new Date(data.startDate)) throw new BadRequestException("Time-off end date must be on or after start date");
    if (Number(data.quantity) <= 0) throw new BadRequestException("Time-off quantity must be greater than zero");
    return this.prisma.client.timeOffRequest.create({ data });
  }
  async decideTimeOff(id: string, status: "APPROVED" | "REJECTED" | "CANCELLED", approvedById?: string) {
    return this.prisma.client.$transaction(async (tx) => {
      const existing = await tx.timeOffRequest.findUniqueOrThrow({ where: { id }, include: { timeOffType: true } });
      if (existing.status === "APPROVED" && status === "APPROVED") return existing;
      if (!["SUBMITTED", "DRAFT"].includes(existing.status) && status !== "CANCELLED") {
        throw new ConflictException(`Cannot change a ${existing.status.toLowerCase()} time-off request`);
      }
      const request = await tx.timeOffRequest.update({ where: { id }, data: { status, approvedById: status === "APPROVED" ? approvedById : undefined, approvedAt: status === "APPROVED" ? new Date() : undefined } });
      if (status === "APPROVED") {
        const allocation = await tx.allocation.findFirst({ where: { employeeId: request.employeeId, timeOffTypeId: request.timeOffTypeId, periodStart: { lte: request.startDate }, periodEnd: { gte: request.endDate } } });
        if (existing.timeOffType.requiresAllocation && !allocation) throw new BadRequestException("No valid leave allocation exists for this request");
        if (allocation && Number(allocation.remaining ?? 0) < Number(request.quantity)) throw new BadRequestException("Insufficient leave balance");
        if (allocation) await tx.allocation.update({ where: { id: allocation.id }, data: { consumed: { increment: request.quantity }, remaining: { decrement: request.quantity } } });
      }
      return request;
    });
  }

  listTimeOffTypes() { return this.prisma.client.timeOffType.findMany({ orderBy: { name: "asc" } }); }
  getTimeOffType(id: string) { return this.prisma.client.timeOffType.findUniqueOrThrow({ where: { id }, include: { allocations: true, requests: true } }); }
  createTimeOffType(data: Prisma.TimeOffTypeCreateInput) { return this.prisma.client.timeOffType.create({ data }); }
  updateTimeOffType(id: string, data: Prisma.TimeOffTypeUpdateInput) { return this.prisma.client.timeOffType.update({ where: { id }, data }); }
  deleteTimeOffType(id: string) { return this.prisma.client.timeOffType.delete({ where: { id } }); }

  listAllocations() { return this.prisma.client.allocation.findMany({ include: { employee: true, timeOffType: true }, orderBy: { periodStart: "desc" } }); }
  getAllocation(id: string) { return this.prisma.client.allocation.findUniqueOrThrow({ where: { id }, include: { employee: true, timeOffType: true } }); }
  createAllocation(data: Prisma.AllocationUncheckedCreateInput) {
    return this.prisma.client.allocation.create({ data: { ...data, remaining: data.remaining ?? data.allocated } });
  }
  updateAllocation(id: string, data: Prisma.AllocationUncheckedUpdateInput) { return this.prisma.client.allocation.update({ where: { id }, data }); }
  deleteAllocation(id: string) { return this.prisma.client.allocation.delete({ where: { id } }); }

  listSalaryRuleCategories() { return this.prisma.client.salaryRuleCategory.findMany({ include: { rules: true }, orderBy: { code: "asc" } }); }
  getSalaryRuleCategory(id: string) { return this.prisma.client.salaryRuleCategory.findUniqueOrThrow({ where: { id }, include: { rules: true } }); }
  createSalaryRuleCategory(data: Prisma.SalaryRuleCategoryCreateInput) { return this.prisma.client.salaryRuleCategory.create({ data }); }
  updateSalaryRuleCategory(id: string, data: Prisma.SalaryRuleCategoryUpdateInput) { return this.prisma.client.salaryRuleCategory.update({ where: { id }, data }); }
  deleteSalaryRuleCategory(id: string) { return this.prisma.client.salaryRuleCategory.delete({ where: { id } }); }

  listSalaryRules() { return this.prisma.client.salaryRule.findMany({ include: { category: true }, orderBy: [{ sequence: "asc" }, { code: "asc" }] }); }
  getSalaryRule(id: string) { return this.prisma.client.salaryRule.findUniqueOrThrow({ where: { id }, include: { category: true, structures: true } }); }
  createSalaryRule(data: Prisma.SalaryRuleUncheckedCreateInput) { return this.prisma.client.salaryRule.create({ data }); }
  updateSalaryRule(id: string, data: Prisma.SalaryRuleUncheckedUpdateInput) { return this.prisma.client.salaryRule.update({ where: { id }, data }); }
  deleteSalaryRule(id: string) { return this.prisma.client.salaryRule.delete({ where: { id } }); }

  listSalaryStructures() {
    return this.prisma.client.salaryStructure.findMany({
      include: { rules: { include: { salaryRule: { include: { category: true } } }, orderBy: { sequence: "asc" } } },
      orderBy: { code: "asc" }
    });
  }
  getSalaryStructure(id: string) {
    return this.prisma.client.salaryStructure.findUniqueOrThrow({
      where: { id },
      include: { contracts: true, payruns: true, rules: { include: { salaryRule: { include: { category: true } } }, orderBy: { sequence: "asc" } } }
    });
  }
  createSalaryStructure(data: Prisma.SalaryStructureCreateInput) { return this.prisma.client.salaryStructure.create({ data }); }
  updateSalaryStructure(id: string, data: Prisma.SalaryStructureUpdateInput) { return this.prisma.client.salaryStructure.update({ where: { id }, data }); }
  deleteSalaryStructure(id: string) { return this.prisma.client.salaryStructure.delete({ where: { id } }); }
  addSalaryStructureRule(data: Prisma.SalaryStructureRuleUncheckedCreateInput) { return this.prisma.client.salaryStructureRule.create({ data }); }
  updateSalaryStructureRule(id: string, data: Prisma.SalaryStructureRuleUncheckedUpdateInput) { return this.prisma.client.salaryStructureRule.update({ where: { id }, data }); }
  removeSalaryStructureRule(id: string) { return this.prisma.client.salaryStructureRule.delete({ where: { id } }); }

  listPayruns() {
    return this.prisma.client.payrun.findMany({
      include: { salaryStructure: true, _count: { select: { payslips: true } } },
      orderBy: { periodStart: "desc" }
    });
  }
  getPayrun(id: string) {
    return this.prisma.client.payrun.findUniqueOrThrow({
      where: { id },
      include: { salaryStructure: true, createdBy: true, selectedEmployees: { include: { employee: true } }, payslips: { include: { employee: true, lines: true } } }
    });
  }
  async createPayrun(data: Prisma.PayrunUncheckedCreateInput & { employeeIds?: string[] }) {
    const { employeeIds, ...payrunData } = data;
    if (!employeeIds?.length) throw new BadRequestException("Select at least one employee for the payrun");
    const employees = await this.prisma.client.employee.count({ where: { id: { in: employeeIds }, status: "ACTIVE" } });
    if (employees !== new Set(employeeIds).size) throw new BadRequestException("One or more selected employees are not active or do not exist");
    return this.prisma.client.payrun.create({ data: { ...payrunData, selectedEmployees: { create: [...new Set(employeeIds)].map((employeeId) => ({ employeeId })) } } });
  }
  updatePayrun(id: string, data: Prisma.PayrunUncheckedUpdateInput) { return this.prisma.client.payrun.update({ where: { id }, data }); }
  async validatePayrun(id: string) {
    const warnings = await this.getPayrunWarnings(id);
    if (warnings.some((warning) => warning.blocking)) throw new BadRequestException({ message: "Payrun has blocking validation errors", warnings });
    return this.prisma.client.payrun.update({ where: { id }, data: { status: "VALIDATED", validatedAt: new Date() } });
  }
  async markPayrunPaid(id: string) {
    return this.prisma.client.$transaction(async (tx) => {
      const current = await tx.payrun.findUniqueOrThrow({ where: { id }, include: { payslips: true } });
      if (current.status !== "VALIDATED") throw new ConflictException("Only a validated payrun can be marked paid");
      if (current.payslips.length === 0) throw new BadRequestException("Cannot pay a payrun without payslips");
      const payrun = await tx.payrun.update({ where: { id }, data: { status: "PAID", paidAt: new Date() } });
      await tx.payslip.updateMany({ where: { payrunId: id }, data: { status: "PAID" } });
      return payrun;
    });
  }
  async cancelPayrun(id: string) {
    const current = await this.prisma.client.payrun.findUniqueOrThrow({ where: { id } });
    if (["PAID", "CANCELLED"].includes(current.status)) throw new ConflictException(`Cannot cancel a ${current.status.toLowerCase()} payrun`);
    return this.prisma.client.payrun.update({ where: { id }, data: { status: "CANCELLED" } });
  }
  async sendPayrunPayslips(id: string) {
    const payrun = await this.prisma.client.payrun.findUniqueOrThrow({
      where: { id },
      include: { payslips: { include: { employee: true, lines: { include: { category: true }, orderBy: { sequence: "asc" } } } } }
    });
    if (!["VALIDATED", "PAID"].includes(payrun.status)) throw new ConflictException("Payslips can only be emailed after validation");
    if (payrun.payslips.length === 0) throw new BadRequestException("Payrun has no payslips");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined
    });
    const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
    if (!from) throw new BadRequestException("SMTP_FROM or SMTP_USER must be configured");
    const results: Array<{ employeeId: string; email: string; status: "sent" }> = [];
    for (const payslip of payrun.payslips) {
      const lines = payslip.lines.map((line) => `<tr><td>${this.escapeHtml(line.name)}</td><td>${this.escapeHtml(line.category.name)}</td><td>${Number(line.amount).toFixed(2)}</td></tr>`).join("");
      await transporter.sendMail({
        from,
        to: payslip.employee.email,
        subject: `Payslip - ${payrun.name}`,
        html: `<p>Hello ${this.escapeHtml(payslip.employee.firstName)},</p><p>Your payslip for ${payrun.periodStart.toISOString().slice(0, 10)} to ${payrun.periodEnd.toISOString().slice(0, 10)} is ready.</p><table><thead><tr><th>Component</th><th>Category</th><th>Amount</th></tr></thead><tbody>${lines}</tbody></table><p>Gross: ${Number(payslip.grossAmount).toFixed(2)}<br> Deductions: ${Number(payslip.deductionAmount).toFixed(2)}<br>Net: ${Number(payslip.netAmount).toFixed(2)}</p>`
      });
      results.push({ employeeId: payslip.employeeId, email: payslip.employee.email, status: "sent" });
    }
    return { payrunId: id, sent: results.length, results };
  }

  async computePayrun(id: string) {
    return this.prisma.client.$transaction(async (tx) => {
      const payrun = await tx.payrun.findUniqueOrThrow({
        where: { id },
        include: {
          salaryStructure: {
            include: {
              rules: {
                include: { salaryRule: { include: { category: true } } },
                orderBy: { sequence: "asc" }
              }
            }
          }
        }
      });

      const selected = await tx.payrunEmployee.findMany({ where: { payrunId: id }, select: { employeeId: true } });
      if (selected.length === 0) throw new BadRequestException("Payrun has no selected employees");
      const contracts = await tx.contract.findMany({
        where: {
          employeeId: { in: selected.map(({ employeeId }) => employeeId) },
          salaryStructureId: payrun.salaryStructureId,
          status: "ACTIVE",
          startDate: { lte: payrun.periodEnd },
          OR: [{ endDate: null }, { endDate: { gte: payrun.periodStart } }]
        },
        include: { employee: true },
        orderBy: [{ employeeId: "asc" }, { startDate: "desc" }]
      });

      const latestContracts = new Map<string, (typeof contracts)[number]>();
      for (const contract of contracts) {
        if (!latestContracts.has(contract.employeeId)) latestContracts.set(contract.employeeId, contract);
      }

      let generatedPayslips = 0;
      for (const contract of latestContracts.values()) {
        const lines = payrun.salaryStructure.rules.map((link) => {
          const rule = link.salaryRule;
          const amount = this.calculateRuleAmount(rule.calculationType, rule.value, contract.baseSalary);
          return {
            salaryRuleId: rule.id,
            code: rule.code,
            name: rule.name,
            categoryId: rule.categoryId,
            sequence: link.sequence,
            amount
          };
        });

        const grossAmount = lines
          .filter((line) => payrun.salaryStructure.rules.find((link) => link.salaryRuleId === line.salaryRuleId)?.salaryRule.category.type !== "DEDUCTION")
          .reduce((total, line) => total + line.amount, 0);
        const deductionAmount = lines
          .filter((line) => payrun.salaryStructure.rules.find((link) => link.salaryRuleId === line.salaryRuleId)?.salaryRule.category.type === "DEDUCTION")
          .reduce((total, line) => total + line.amount, 0);
        const netAmount = grossAmount - deductionAmount;

        const payslip = await tx.payslip.upsert({
          where: { payrunId_employeeId: { payrunId: payrun.id, employeeId: contract.employeeId } },
          create: {
            payrunId: payrun.id,
            employeeId: contract.employeeId,
            contractId: contract.id,
            periodStart: payrun.periodStart,
            periodEnd: payrun.periodEnd,
            grossAmount,
            deductionAmount,
            netAmount,
            status: "COMPUTED"
          },
          update: {
            contractId: contract.id,
            grossAmount,
            deductionAmount,
            netAmount,
            status: "COMPUTED"
          }
        });

        await tx.payslipLine.deleteMany({ where: { payslipId: payslip.id } });
        if (lines.length > 0) {
          await tx.payslipLine.createMany({ data: lines.map((line) => ({ ...line, payslipId: payslip.id })) });
        }
        generatedPayslips += 1;
      }

      const updated = await tx.payrun.update({ where: { id }, data: { status: "COMPUTED", computedAt: new Date() } });
      return { payrun: updated, generatedPayslips };
    });
  }

  listPayslips() {
    return this.prisma.client.payslip.findMany({
      include: { payrun: true, employee: true, contract: true },
      orderBy: { createdAt: "desc" },
      take: 100
    });
  }
  getPayslip(id: string) {
    return this.prisma.client.payslip.findUniqueOrThrow({
      where: { id },
      include: { payrun: true, employee: true, contract: true, lines: { include: { category: true, salaryRule: true }, orderBy: { sequence: "asc" } } }
    });
  }
  updatePayslip(id: string, data: Prisma.PayslipUncheckedUpdateInput) { return this.prisma.client.payslip.update({ where: { id }, data }); }

  listRoles() { return this.prisma.client.role.findMany({ include: { permissions: { include: { permission: true } }, users: true }, orderBy: { name: "asc" } }); }
  createRole(data: Prisma.RoleCreateInput) { return this.prisma.client.role.create({ data }); }
  updateRole(id: string, data: Prisma.RoleUpdateInput) { return this.prisma.client.role.update({ where: { id }, data }); }
  deleteRole(id: string) { return this.prisma.client.role.delete({ where: { id } }); }
  listPermissions() { return this.prisma.client.permission.findMany({ orderBy: [{ resource: "asc" }, { action: "asc" }] }); }
  createPermission(data: Prisma.PermissionCreateInput) { return this.prisma.client.permission.create({ data }); }
  assignPermissionToRole(data: Prisma.RolePermissionUncheckedCreateInput) { return this.prisma.client.rolePermission.create({ data }); }
  removePermissionFromRole(id: string) { return this.prisma.client.rolePermission.delete({ where: { id } }); }
  assignRoleToUser(data: Prisma.UserRoleAssignmentUncheckedCreateInput) { return this.prisma.client.userRoleAssignment.create({ data }); }
  removeRoleFromUser(id: string) { return this.prisma.client.userRoleAssignment.delete({ where: { id } }); }

  listUsers() {
    return this.prisma.client.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        employeeId: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { email: "asc" }
    });
  }
  getUser(id: string) {
    return this.prisma.client.user.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        employeeId: true,
        employee: true,
        userRoles: { include: { role: true } },
        createdAt: true,
        updatedAt: true
      }
    });
  }
  async createUser(data: CreateUserInput) {
    const { email, password, temporaryPassword, passwordHash, ...userData } = data;
    const normalizedEmail = email?.toLowerCase().trim();
    if (!normalizedEmail) throw new BadRequestException("Email is required");

    const resolvedPasswordHash = (await this.resolvePasswordHash({ password, temporaryPassword, passwordHash }, true))!;

    return this.prisma.client.$transaction(async (tx) => {
      let employeeId = userData.employeeId;

      // Employee logins must have an employee record so profile, attendance,
      // leave and payslip access can be resolved from the authenticated user.
      if (userData.role === "EMPLOYEE" && !employeeId) {
        const existingEmployee = await tx.employee.findUnique({ where: { email: normalizedEmail } });
        if (existingEmployee) {
          employeeId = existingEmployee.id;
        } else {
          const fullName = typeof userData.name === "string" ? userData.name.trim() : "Employee";
          const [firstName, ...lastNameParts] = fullName.split(/\s+/);
          const safeFirstName = firstName || "Employee";
          const lastName = lastNameParts.join(" ") || safeFirstName;
          const employee = await tx.employee.create({
            data: {
              employeeNumber: `EMP-${Date.now().toString().slice(-8)}`,
              firstName: safeFirstName,
              lastName,
              email: normalizedEmail,
              hireDate: new Date()
            }
          });
          employeeId = employee.id;
        }
      }

      return tx.user.create({
        data: {
          ...userData,
          ...(employeeId ? { employeeId } : {}),
          email: normalizedEmail,
          passwordHash: resolvedPasswordHash
        },
        select: this.userSelect()
      });
    });
  }
  async updateUser(id: string, data: UpdateUserInput) {
    const { password, temporaryPassword, passwordHash, email, ...userData } = data;
    const resolvedPasswordHash = await this.resolvePasswordHash(
      { password, temporaryPassword, passwordHash: typeof passwordHash === "string" ? passwordHash : undefined },
      false
    );

    return this.prisma.client.user.update({
      where: { id },
      data: {
        ...userData,
        ...(typeof email === "string" ? { email: email.toLowerCase().trim() } : {}),
        ...(resolvedPasswordHash ? { passwordHash: resolvedPasswordHash } : {})
      },
      select: this.userSelect()
    });
  }
  deleteUser(id: string) { return this.prisma.client.user.delete({ where: { id } }); }

  async getDashboardData() {
    const [employees, departments, attendanceExceptions, pendingTimeOff] = await Promise.all([
      this.prisma.client.employee.count(),
      this.prisma.client.department.count(),
      this.prisma.client.attendance.count({ where: { status: "EXCEPTION" } }),
      this.prisma.client.timeOffRequest.count({ where: { status: "SUBMITTED" } })
    ]);

    return {
      employees,
      departments,
      attendanceExceptions,
      pendingTimeOff
    };
  }

  private calculateRuleAmount(type: ComputationType, value: Prisma.Decimal | null, baseSalary: Prisma.Decimal) {
    if (type === "FORMULA") return 0;
    const numericValue = Number(value ?? 0);
    if (type === "PERCENTAGE") return Number(baseSalary) * (numericValue / 100);
    return numericValue;
  }

  private async ensureContractDoesNotOverlap(
    employeeId: string,
    startDate: Date,
    endDate: Date | null | undefined,
    status: ContractStatus | undefined,
    excludeId?: string
  ) {
    if (status !== "ACTIVE") return;
    if (endDate && new Date(endDate) < new Date(startDate)) throw new BadRequestException("Contract end date must be on or after start date");
    const overlap = await this.prisma.client.contract.findFirst({
      where: {
        employeeId,
        status: "ACTIVE",
        ...(excludeId ? { id: { not: excludeId } } : {}),
        startDate: { lte: endDate ?? new Date("9999-12-31") },
        OR: [{ endDate: null }, { endDate: { gte: startDate } }]
      }
    });
    if (overlap) throw new ConflictException("Employee already has an overlapping active contract");
  }

  private async recalculateScheduleHours(id: string) {
    const schedule = await this.prisma.client.workingSchedule.findUniqueOrThrow({ where: { id }, include: { scheduleDays: true } });
    const weeklyHours = schedule.scheduleDays.reduce((total, day) => {
      if (!day.isWorkingDay || !day.startTime || !day.endTime) return total;
      const start = this.timeToMinutes(day.startTime);
      const end = this.timeToMinutes(day.endTime);
      const duration = end >= start ? end - start : (24 * 60 - start) + end;
      return total + Math.max(0, duration - day.breakMinutes) / 60;
    }, 0);
    return this.prisma.client.workingSchedule.update({ where: { id }, data: { weeklyHours } });
  }

  private timeToMinutes(value: string) {
    const [hours = NaN, minutes = NaN] = value.split(":").map(Number);
    if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new BadRequestException(`Invalid schedule time: ${value}`);
    }
    return hours * 60 + minutes;
  }

  private withWorkedMinutes<T extends { checkIn?: unknown; checkOut?: unknown; breakMinutes?: unknown }>(data: T) {
    if (!data.checkIn || !data.checkOut) return data;
    const workedMinutes = Math.max(0, Math.round((new Date(data.checkOut as string | Date).getTime() - new Date(data.checkIn as string | Date).getTime()) / 60000) - Number(data.breakMinutes ?? 0));
    return { ...data, workedMinutes };
  }

  private async deriveAttendanceStatus(data: { date: Date | string; checkIn?: Date | string | null; checkOut?: Date | string | null; status?: string; workingScheduleId?: string | null }) {
    if (data.status && data.status !== "PRESENT") return data.status as Prisma.AttendanceUncheckedCreateInput["status"];
    if (!data.checkIn) return "ABSENT";
    if (!data.checkOut) return "EXCEPTION";
    if (!data.workingScheduleId) return "PRESENT";
    const schedule = await this.prisma.client.workingSchedule.findUnique({ where: { id: data.workingScheduleId }, include: { scheduleDays: true } });
    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
    const scheduleDay = schedule?.scheduleDays.find((day) => day.dayOfWeek === dayNames[new Date(data.date).getDay()]);
    if (scheduleDay?.startTime && this.timeToMinutes(new Date(data.checkIn).getHours().toString().padStart(2, "0") + ":" + new Date(data.checkIn).getMinutes().toString().padStart(2, "0")) > this.timeToMinutes(scheduleDay.startTime)) return "LATE";
    return "PRESENT";
  }

  private async resolvePasswordHash(
    credentials: { password?: string; temporaryPassword?: string; passwordHash?: string },
    required: boolean
  ) {
    const suppliedPassword = credentials.password ?? credentials.temporaryPassword;
    if (suppliedPassword) return bcrypt.hash(this.validatePlainPassword(suppliedPassword), 10);

    if (credentials.passwordHash) {
      if (this.isBcryptHash(credentials.passwordHash)) return credentials.passwordHash;
      return bcrypt.hash(this.validatePlainPassword(credentials.passwordHash), 10);
    }

    if (required) throw new BadRequestException("Temporary password is required");
    return undefined;
  }

  private validatePlainPassword(password: string) {
    const trimmedPassword = password.trim();
    if (trimmedPassword.length < 8) throw new BadRequestException("Temporary password must be at least 8 characters");
    return trimmedPassword;
  }

  private isBcryptHash(value: string) {
    return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);
  }

  private escapeHtml(value: string) {
    return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character] ?? character));
  }

  private userSelect() {
    return {
      id: true,
      email: true,
      name: true,
      role: true,
      employeeId: true,
      createdAt: true,
      updatedAt: true
    } satisfies Prisma.UserSelect;
  }

  async getPayrunWarnings(id: string) {
    const payrun = await this.prisma.client.payrun.findUniqueOrThrow({
      where: { id },
      include: {
        salaryStructure: { include: { rules: { include: { salaryRule: true } } } },
        payslips: { include: { employee: { include: { bankAccount: true } }, contract: true } }
      }
    });
    const warnings: Array<{ code: string; message: string; blocking: boolean; employeeId?: string }> = [];
    if (payrun.status === "PAID") warnings.push({ code: "PAYRUN_PAID", message: "Payrun is already paid", blocking: true });
    if (payrun.salaryStructure.rules.length === 0) warnings.push({ code: "NO_SALARY_RULES", message: "Salary structure has no active rules", blocking: true });
    if (payrun.payslips.length === 0) warnings.push({ code: "NO_PAYSLIPS", message: "Compute the payrun before validation", blocking: true });
    for (const payslip of payrun.payslips) {
      if (!payslip.employee.bankAccount) warnings.push({ code: "MISSING_BANK_ACCOUNT", message: `Employee ${payslip.employee.employeeNumber} has no bank account`, blocking: true, employeeId: payslip.employeeId });
      if (payslip.contract.startDate > payrun.periodEnd || (payslip.contract.endDate && payslip.contract.endDate < payrun.periodStart)) warnings.push({ code: "INVALID_CONTRACT_PERIOD", message: `Employee ${payslip.employee.employeeNumber} has no valid contract for this period`, blocking: true, employeeId: payslip.employeeId });
    }
    const attendanceExceptions = await this.prisma.client.attendance.count({ where: { status: "EXCEPTION", date: { gte: payrun.periodStart, lte: payrun.periodEnd }, employeeId: { in: payrun.payslips.map((slip) => slip.employeeId) } } });
    if (attendanceExceptions > 0) warnings.push({ code: "ATTENDANCE_EXCEPTIONS", message: `${attendanceExceptions} attendance exceptions need review`, blocking: false });
    return warnings;
  }
}
