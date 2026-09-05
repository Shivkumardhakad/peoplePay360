import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { HR_ADMIN_ROLES } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { HrService } from "../shared/hr.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...HR_ADMIN_ROLES)
@Controller("working-schedules")
export class WorkingSchedulesController {
  constructor(private readonly hr: HrService) {}

  @Get() list() { return this.hr.listWorkingSchedules(); }
  @Get(":id") get(@Param("id") id: string) { return this.hr.getWorkingSchedule(id); }
  @Post() create(@Body() body: Prisma.WorkingScheduleUncheckedCreateInput) { return this.hr.createWorkingSchedule(body); }
  @Patch(":id") update(@Param("id") id: string, @Body() body: Prisma.WorkingScheduleUncheckedUpdateInput) { return this.hr.updateWorkingSchedule(id, body); }
  @Delete(":id") delete(@Param("id") id: string) { return this.hr.deleteWorkingSchedule(id); }
  @Post(":id/days") addDay(@Param("id") id: string, @Body() body: Omit<Prisma.WorkingScheduleDayUncheckedCreateInput, "workingScheduleId">) {
    return this.hr.createWorkingScheduleDay({ ...body, workingScheduleId: id });
  }
  @Patch("days/:dayId") updateDay(@Param("dayId") dayId: string, @Body() body: Prisma.WorkingScheduleDayUncheckedUpdateInput) {
    return this.hr.updateWorkingScheduleDay(dayId, body);
  }
  @Delete("days/:dayId") deleteDay(@Param("dayId") dayId: string) { return this.hr.deleteWorkingScheduleDay(dayId); }
}
