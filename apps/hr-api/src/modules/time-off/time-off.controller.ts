import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { Prisma, UserRole } from "@prisma/client";
import { Roles } from "../auth/roles.decorator";
import { HrService } from "../shared/hr.service";

@Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.HR_PAYROLL_USER, UserRole.PAYROLL_MANAGER)
@Controller("time-off")
export class TimeOffController {
  constructor(private readonly hr: HrService) {}

  @Get("types")
  listTypes() {
    return this.hr.listTimeOffTypes();
  }
  @Get("types/:id") getType(@Param("id") id: string) { return this.hr.getTimeOffType(id); }
  @Post("types") createType(@Body() body: Prisma.TimeOffTypeCreateInput) { return this.hr.createTimeOffType(body); }
  @Patch("types/:id") updateType(@Param("id") id: string, @Body() body: Prisma.TimeOffTypeUpdateInput) { return this.hr.updateTimeOffType(id, body); }
  @Delete("types/:id") deleteType(@Param("id") id: string) { return this.hr.deleteTimeOffType(id); }

  @Get("allocations")
  listAllocations() {
    return this.hr.listAllocations();
  }
  @Get("allocations/:id") getAllocation(@Param("id") id: string) { return this.hr.getAllocation(id); }
  @Post("allocations") createAllocation(@Body() body: Prisma.AllocationUncheckedCreateInput) { return this.hr.createAllocation(body); }
  @Patch("allocations/:id") updateAllocation(@Param("id") id: string, @Body() body: Prisma.AllocationUncheckedUpdateInput) { return this.hr.updateAllocation(id, body); }
  @Delete("allocations/:id") deleteAllocation(@Param("id") id: string) { return this.hr.deleteAllocation(id); }

  @Get("requests")
  listRequests() {
    return this.hr.listTimeOffRequests();
  }
  @Post("requests") create(@Body() body: Prisma.TimeOffRequestUncheckedCreateInput) { return this.hr.createTimeOffRequest(body); }
  @Patch("requests/:id/:decision") decide(@Param("id") id: string, @Param("decision") decision: "approve" | "reject" | "cancel", @Body("approvedById") approvedById?: string) { return this.hr.decideTimeOff(id, decision === "approve" ? "APPROVED" : decision === "reject" ? "REJECTED" : "CANCELLED", approvedById); }
}
