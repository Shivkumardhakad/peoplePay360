import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { HR_ADMIN_ROLES } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { HrService } from "../shared/hr.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...HR_ADMIN_ROLES)
@Controller("job-positions")
export class JobPositionsController {
  constructor(private readonly hr: HrService) {}

  @Get()
  list() {
    return this.hr.listJobPositions();
  }
  @Post() create(@Body() body: Prisma.JobPositionUncheckedCreateInput) { return this.hr.createJobPosition(body); }
  @Patch(":id") update(@Param("id") id: string, @Body() body: Prisma.JobPositionUncheckedUpdateInput) { return this.hr.updateJobPosition(id, body); }
  @Delete(":id") remove(@Param("id") id: string) { return this.hr.deleteJobPosition(id); }
}
