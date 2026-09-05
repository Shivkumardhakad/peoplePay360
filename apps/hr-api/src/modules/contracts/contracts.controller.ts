import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { HrService } from "../shared/hr.service";

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
