import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { HR_ADMIN_ROLES } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { HrService } from "../shared/hr.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...HR_ADMIN_ROLES)
@Controller("contracts")
export class ContractsController {
  constructor(private readonly hr: HrService) {}

  @Get()
  list() {
    return this.hr.listContracts();
  }
  @Get(":id") get(@Param("id") id: string) { return this.hr.getContract(id); }
  @Post() create(@Body() body: Prisma.ContractUncheckedCreateInput) { return this.hr.createContract(body); }
  @Patch(":id") update(@Param("id") id: string, @Body() body: Prisma.ContractUncheckedUpdateInput) { return this.hr.updateContract(id, body); }
}
