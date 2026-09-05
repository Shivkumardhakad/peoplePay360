import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { HrService } from "../shared/hr.service";

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
