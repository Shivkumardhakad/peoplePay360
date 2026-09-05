import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { HR_ADMIN_ROLES } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { HrService } from "../shared/hr.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...HR_ADMIN_ROLES)
@Controller("attendance")
export class AttendanceController {
  constructor(private readonly hr: HrService) {}

  @Get()
  list() {
    return this.hr.listAttendance();
  }
  @Post() create(@Body() body: Prisma.AttendanceUncheckedCreateInput) { return this.hr.createAttendance(body); }
  @Patch(":id/correction") correct(@Param("id") id: string, @Body() body: Prisma.AttendanceUncheckedUpdateInput) { return this.hr.correctAttendance(id, body); }
}
