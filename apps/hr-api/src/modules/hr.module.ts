import { Module } from "@nestjs/common";
import { PrismaService } from "../infrastructure/database/prisma.service";
import { AttendanceController } from "./attendance/attendance.controller";
import { BankAccountsController } from "./bank-accounts/bank-accounts.controller";
import { ContractsController } from "./contracts/contracts.controller";
import { DepartmentsController } from "./departments/departments.controller";
import { HrDashboardController } from "./dashboard/dashboard.controller";
import { EmployeesController } from "./employees/employees.controller";
import { JobPositionsController } from "./job-positions/job-positions.controller";
import { JwtAuthGuard } from "./auth/jwt-auth.guard";
import { MeController } from "./me/me.controller";
import { PayrollController } from "./payroll/payroll.controller";
import { RbacController } from "./rbac/rbac.controller";
import { RolesGuard } from "./auth/roles.guard";
import { HrService } from "./shared/hr.service";
import { TimeOffController } from "./time-off/time-off.controller";
import { UsersController } from "./users/users.controller";
import { WorkingSchedulesController } from "./working-schedules/working-schedules.controller";

@Module({
  controllers: [
    AttendanceController,
    BankAccountsController,
    ContractsController,
    DepartmentsController,
    HrDashboardController,
    EmployeesController,
    JobPositionsController,
    MeController,
    PayrollController,
    RbacController,
    TimeOffController,
    UsersController,
    WorkingSchedulesController
  ],
  providers: [HrService, PrismaService, JwtAuthGuard, RolesGuard],
  exports: [HrService]
})
export class HrModule {}
