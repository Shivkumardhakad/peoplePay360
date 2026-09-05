import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { Prisma, UserRole } from "@prisma/client";
import { Roles } from "../auth/roles.decorator";
import { HrService } from "../shared/hr.service";

@Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.HR_PAYROLL_USER, UserRole.PAYROLL_MANAGER)
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
