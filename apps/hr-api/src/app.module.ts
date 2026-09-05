import { Module } from "@nestjs/common";
import { AttendanceController } from "./attendance.controller";
import { ContractsController } from "./contracts.controller";
import { DepartmentsController } from "./departments.controller";
import { EmployeesController } from "./employees.controller";
import { HrDashboardController } from "./hr-dashboard.controller";
import { HrService } from "./hr.service";
import { JobPositionsController } from "./job-positions.controller";
import { PrismaService } from "./prisma.service";
import { TimeOffController } from "./time-off.controller";
import { UsersController } from "./users.controller";

@Module({
  controllers: [
    AttendanceController,
    ContractsController,
    DepartmentsController,
    EmployeesController,
    HrDashboardController,
    JobPositionsController,
    TimeOffController,
    UsersController
  ],
  providers: [HrService, PrismaService]
})
export class AppModule {}
