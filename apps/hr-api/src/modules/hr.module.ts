import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { PrismaService } from "../infrastructure/database/prisma.service";
import { AttendanceController } from "./attendance/attendance.controller";
import { AuthController } from "./auth/auth.controller";
import { HrAuthGuard } from "./auth/auth.guard";
import { AuthService } from "./auth/auth.service";
import { BankAccountsController } from "./bank-accounts/bank-accounts.controller";
import { ContractsController } from "./contracts/contracts.controller";
import { DepartmentsController } from "./departments/departments.controller";
import { HrDashboardController } from "./dashboard/dashboard.controller";
import { EmployeesController } from "./employees/employees.controller";
import { JobPositionsController } from "./job-positions/job-positions.controller";
import { MeController } from "./me/me.controller";
import { PayrollController } from "./payroll/payroll.controller";
import { RbacController } from "./rbac/rbac.controller";
import { HrService } from "./shared/hr.service";
import { TimeOffController } from "./time-off/time-off.controller";
import { UsersController } from "./users/users.controller";
import { WorkingSchedulesController } from "./working-schedules/working-schedules.controller";

@Module({
  controllers: [
    AuthController,
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
  providers: [HrService, PrismaService, AuthService, { provide: APP_GUARD, useClass: HrAuthGuard }],
  exports: [HrService]
})
export class HrModule {}
