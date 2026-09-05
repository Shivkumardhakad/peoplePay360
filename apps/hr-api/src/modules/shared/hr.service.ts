import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { ComputationType, Prisma } from "@prisma/client";
import { PrismaService } from "../../infrastructure/database/prisma.service";

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

  getEmployee(id: string) { return this.prisma.client.employee.findUniqueOrThrow({ where: { id }, include: { department: true, jobPosition: true, contracts: true, attendance: true, allocations: { include: { timeOffType: true } } } }); }
  createEmployee(data: Prisma.EmployeeUncheckedCreateInput) { return this.prisma.client.employee.create({ data }); }
  updateEmployee(id: string, data: Prisma.EmployeeUncheckedUpdateInput) { return this.prisma.client.employee.update({ where: { id }, data }); }
  terminateEmployee(id: string) { return this.prisma.client.employee.update({ where: { id }, data: { status: "TERMINATED" } }); }

  listBankAccounts() { return this.prisma.client.bankAccount.findMany({ include: { employee: true }, orderBy: { accountName: "asc" } }); }
  getBankAccount(id: string) { return this.prisma.client.bankAccount.findUniqueOrThrow({ where: { id }, include: { employee: true } }); }
  createBankAccount(data: Prisma.BankAccountCreateInput) { return this.prisma.client.bankAccount.create({ data }); }
  updateBankAccount(id: string, data: Prisma.BankAccountUpdateInput) { return this.prisma.client.bankAccount.update({ where: { id }, data }); }
  deleteBankAccount(id: string) { return this.prisma.client.bankAccount.delete({ where: { id } }); }

  async listDepartments(page = 1, limit = 50) {
    const [data, total] = await Promise.all([
      this.prisma.client.department.findMany({
        include: { _count: { select: { employees: true, positions: true } } },
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.client.department.count()
    ]);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
  async getDepartment(id: string) {
    const department = await this.prisma.client.department.findUnique({ where: { id }, include: { positions: true, _count: { select: { employees: true } } } });
    if (!department) throw new NotFoundException("Department not found");
    return department;
  }
  async createDepartment(data: Prisma.DepartmentCreateInput) {
    try { return await this.prisma.client.department.create({ data }); }
    catch (error) { this.handleDepartmentError(error); }
  }
  async updateDepartment(id: string, data: Prisma.DepartmentUpdateInput) {
    try { return await this.prisma.client.department.update({ where: { id }, data }); }
    catch (error) { this.handleDepartmentError(error); }
  }
  async deleteDepartment(id: string) {
    try { return await this.prisma.client.department.delete({ where: { id } }); }
    catch (error) { this.handleDepartmentError(error); }
  }

  private handleDepartmentError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") throw new NotFoundException("Department not found");
    if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2002" || error.code === "P2003")) {
      throw new ConflictException(error.code === "P2002" ? "Department code or name already exists" : "Department is still referenced");
    }
    throw error;
  }

  listJobPositions() {
    return this.prisma.client.jobPosition.findMany({
      include: { department: true },
      orderBy: { title: "asc" }
    });
  }
  createJobPosition(data: Prisma.JobPositionUncheckedCreateInput) { return this.prisma.client.jobPosition.create({ data }); }
  updateJobPosition(id: string, data: Prisma.JobPositionUncheckedUpdateInput) { return this.prisma.client.jobPosition.update({ where: { id }, data }); }
  deleteJobPosition(id: string) { return this.prisma.client.jobPosition.delete({ where: { id } }); }

  async listContracts(page?: number, limit?: number) {
    const query = {
      include: { employee: true },
      orderBy: [{ employeeId: "asc" }, { startDate: "desc" }] as [{ employeeId: "asc" }, { startDate: "desc" }],
      ...(page && limit ? { skip: (page - 1) * limit, take: limit } : {})
    };
    const data = await this.prisma.client.contract.findMany(query);
    if (!page || !limit) return data;
    const total = await this.prisma.client.contract.count();
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
  async getContract(id: string) {
    const contract = await this.prisma.client.contract.findUnique({ where: { id }, include: { employee: true, department: true, position: true, workingSchedule: true, salaryStructure: true } });
    if (!contract) throw new NotFoundException("Contract not found");
    return contract;
  }
  async createContract(data: Prisma.ContractUncheckedCreateInput) {
    await this.ensureNoActiveOverlap(data.employeeId, new Date(data.startDate), data.endDate === null || data.endDate === undefined ? data.endDate : new Date(data.endDate), data.status ?? "ACTIVE");
    try { return await this.prisma.client.contract.create({ data }); }
    catch (error) { this.handleContractError(error); }
  }
  async updateContract(id: string, data: Prisma.ContractUncheckedUpdateInput) {
    const current = await this.prisma.client.contract.findUnique({ where: { id }, include: { _count: { select: { payslips: true } } } });
    if (!current) throw new NotFoundException("Contract not found");
    const protectedFields = ["employeeId", "salaryStructureId", "startDate", "endDate", "baseSalary"];
    if (current._count.payslips > 0 && protectedFields.some((field) => field in data)) {
      throw new ConflictException("Contract terms cannot change after payroll has been generated");
    }
    const employeeId = (data.employeeId as string | undefined) ?? current.employeeId;
    const startDate = data.startDate === undefined ? current.startDate : new Date(data.startDate as string | Date);
    const endDate = data.endDate === undefined || data.endDate === null ? current.endDate : new Date(data.endDate as string | Date);
    const status = (data.status as string | undefined) ?? current.status;
    await this.ensureNoActiveOverlap(employeeId, startDate, endDate, status, id);
    try { return await this.prisma.client.contract.update({ where: { id }, data }); }
    catch (error) { this.handleContractError(error); }
  }

  private async ensureNoActiveOverlap(employeeId: string, startDate: Date, endDate: Date | null | undefined, status: string, excludeId?: string) {
    if (status !== "ACTIVE") return;
    const overlap = await this.prisma.client.contract.findFirst({
      where: { employeeId, status: "ACTIVE", ...(excludeId ? { id: { not: excludeId } } : {}), startDate: { lte: endDate ?? new Date("9999-12-31") }, OR: [{ endDate: null }, { endDate: { gte: startDate } }] }
    });
    if (overlap) throw new ConflictException("Employee already has an overlapping active contract");
  }

  private handleContractError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") throw new NotFoundException("Contract not found");
    if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2002" || error.code === "P2003")) throw new ConflictException("Contract references conflict with existing data");
    throw error;
  }

  listWorkingSchedules() {
    return this.prisma.client.workingSchedule.findMany({
      include: { scheduleDays: true },
      orderBy: { name: "asc" }
    });
  }
  getWorkingSchedule(id: string) { return this.prisma.client.workingSchedule.findUniqueOrThrow({ where: { id }, include: { scheduleDays: true, contracts: true } }); }
  createWorkingSchedule(data: Prisma.WorkingScheduleUncheckedCreateInput) { return this.prisma.client.workingSchedule.create({ data }); }
  updateWorkingSchedule(id: string, data: Prisma.WorkingScheduleUncheckedUpdateInput) { return this.prisma.client.workingSchedule.update({ where: { id }, data }); }
  deleteWorkingSchedule(id: string) { return this.prisma.client.workingSchedule.delete({ where: { id } }); }
  createWorkingScheduleDay(data: Prisma.WorkingScheduleDayUncheckedCreateInput) { return this.prisma.client.workingScheduleDay.create({ data }); }
  updateWorkingScheduleDay(id: string, data: Prisma.WorkingScheduleDayUncheckedUpdateInput) { return this.prisma.client.workingScheduleDay.update({ where: { id }, data }); }
  deleteWorkingScheduleDay(id: string) { return this.prisma.client.workingScheduleDay.delete({ where: { id } }); }

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
  createAttendance(data: Prisma.AttendanceUncheckedCreateInput) { return this.prisma.client.attendance.create({ data }); }
  correctAttendance(id: string, data: Prisma.AttendanceUncheckedUpdateInput) { return this.prisma.client.attendance.update({ where: { id }, data: { ...data, corrected: true } }); }

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
  createTimeOffRequest(data: Prisma.TimeOffRequestUncheckedCreateInput) { return this.prisma.client.timeOffRequest.create({ data }); }
  async decideTimeOff(id: string, status: "APPROVED" | "REJECTED" | "CANCELLED", approvedById?: string) {
    return this.prisma.client.$transaction(async (tx) => {
      const request = await tx.timeOffRequest.update({ where: { id }, data: { status, approvedById: status === "APPROVED" ? approvedById : undefined, approvedAt: status === "APPROVED" ? new Date() : undefined } });
      if (status === "APPROVED") {
        const allocation = await tx.allocation.findFirst({ where: { employeeId: request.employeeId, timeOffTypeId: request.timeOffTypeId, periodStart: { lte: request.startDate }, periodEnd: { gte: request.endDate } } });
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
      include: { salaryStructure: true, createdBy: true, payslips: { include: { employee: true, lines: true } } }
    });
  }
  createPayrun(data: Prisma.PayrunUncheckedCreateInput) { return this.prisma.client.payrun.create({ data }); }
  updatePayrun(id: string, data: Prisma.PayrunUncheckedUpdateInput) { return this.prisma.client.payrun.update({ where: { id }, data }); }
  validatePayrun(id: string) { return this.prisma.client.payrun.update({ where: { id }, data: { status: "VALIDATED", validatedAt: new Date() } }); }
  markPayrunPaid(id: string) {
    return this.prisma.client.$transaction(async (tx) => {
      const payrun = await tx.payrun.update({ where: { id }, data: { status: "PAID", paidAt: new Date() } });
      await tx.payslip.updateMany({ where: { payrunId: id }, data: { status: "PAID" } });
      return payrun;
    });
  }
  cancelPayrun(id: string) { return this.prisma.client.payrun.update({ where: { id }, data: { status: "CANCELLED" } }); }

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

      const contracts = await tx.contract.findMany({
        where: {
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
  createUser(data: Prisma.UserUncheckedCreateInput) { return this.prisma.client.user.create({ data }); }
  updateUser(id: string, data: Prisma.UserUncheckedUpdateInput) { return this.prisma.client.user.update({ where: { id }, data }); }
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
}
