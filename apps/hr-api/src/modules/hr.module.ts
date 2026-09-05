import { Module } from "@nestjs/common";
import { PrismaService } from "../infrastructure/database/prisma.service";
import { AttendanceController } from "./attendance/attendance.controller";
import { ContractsController } from "./contracts/contracts.controller";
import { DepartmentsController } from "./departments/departments.controller";
import { HrDashboardController } from "./dashboard/dashboard.controller";
import { EmployeesController } from "./employees/employees.controller";
import { JobPositionsController } from "./job-positions/job-positions.controller";
import { HrService } from "./shared/hr.service";
import { TimeOffController } from "./time-off/time-off.controller";
import { UsersController } from "./users/users.controller";

@Module({
  controllers: [
    AttendanceController,
    ContractsController,
    DepartmentsController,
    HrDashboardController,
    EmployeesController,
    JobPositionsController,
    TimeOffController,
    UsersController
  ],
  providers: [HrService, PrismaService],
  exports: [HrService]
})
export class HrModule {}
