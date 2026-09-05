import { Body, Controller, Get, Post, Req } from "@nestjs/common";
import { AttendanceStatus, Prisma, UserRole } from "@prisma/client";
import { type RequestWithUser } from "../auth/auth.types";
import { Roles } from "../auth/roles.decorator";
import { HrService } from "../shared/hr.service";

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

@Roles(UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.PAYROLL_MANAGER, UserRole.HR_PAYROLL_USER)
@Controller("me")
export class MeController {
  constructor(private readonly hr: HrService) {}

  @Get("dashboard")
  getDashboard(@Req() request: RequestWithUser) {
    return this.hr.getMyDashboard(this.employeeId(request));
  }

  @Get("profile")
  getProfile(@Req() request: RequestWithUser) {
    return this.hr.getMyProfile(this.employeeId(request));
  }

  @Get("attendance")
  listAttendance(@Req() request: RequestWithUser) {
    return this.hr.listMyAttendance(this.employeeId(request));
  }

  @Post("attendance")
  createAttendance(@Req() request: RequestWithUser, @Body() body: CreateMyAttendanceInput) {
    return this.hr.createMyAttendance(this.employeeId(request), body);
  }

  @Get("time-off")
  listTimeOffRequests(@Req() request: RequestWithUser) {
    return this.hr.listMyTimeOffRequests(this.employeeId(request));
  }

  @Get("time-off/allocations")
  listTimeOffAllocations(@Req() request: RequestWithUser) {
    return this.hr.listMyAllocations(this.employeeId(request));
  }

  @Get("time-off/types")
  listTimeOffTypes() {
    return this.hr.listMyTimeOffTypes();
  }

  @Post("time-off/requests")
  createTimeOffRequest(@Req() request: RequestWithUser, @Body() body: CreateMyTimeOffRequestInput) {
    return this.hr.createMyTimeOffRequest(this.employeeId(request), body);
  }

  private employeeId(request: RequestWithUser) {
    return this.hr.requireAuthenticatedEmployeeId(request.user?.employeeId);
  }
}
