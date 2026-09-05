import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { HrService } from "../shared/hr.service";

@Controller("time-off")
export class TimeOffController {
  constructor(private readonly hr: HrService) {}

  @Get("requests")
  listRequests() {
    return this.hr.listTimeOffRequests();
  }
  @Post("requests") create(@Body() body: Prisma.TimeOffRequestUncheckedCreateInput) { return this.hr.createTimeOffRequest(body); }
  @Patch("requests/:id/:decision") decide(@Param("id") id: string, @Param("decision") decision: "approve" | "reject" | "cancel", @Body("approvedById") approvedById?: string) { return this.hr.decideTimeOff(id, decision === "approve" ? "APPROVED" : decision === "reject" ? "REJECTED" : "CANCELLED", approvedById); }
}
