import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { HrService } from "../shared/hr.service";

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
