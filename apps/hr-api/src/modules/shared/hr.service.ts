import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
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
  createContract(data: Prisma.ContractUncheckedCreateInput) { return this.prisma.client.contract.create({ data }); }
  updateContract(id: string, data: Prisma.ContractUncheckedUpdateInput) { return this.prisma.client.contract.update({ where: { id }, data }); }

  listWorkingSchedules() {
    return this.prisma.client.workingSchedule.findMany({
      orderBy: { name: "asc" }
    });
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
}
