import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

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

  listDepartments() {
    return this.prisma.client.department.findMany({
      include: {
        positions: true,
        _count: { select: { employees: true } }
      },
      orderBy: { name: "asc" }
    });
  }

  listJobPositions() {
    return this.prisma.client.jobPosition.findMany({
      include: { department: true },
      orderBy: { title: "asc" }
    });
  }

  listContracts() {
    return this.prisma.client.contract.findMany({
      include: { employee: true },
      orderBy: [{ employeeId: "asc" }, { startDate: "desc" }]
    });
  }

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
