import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { HR_ADMIN_ROLES } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { HrService } from "../shared/hr.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...HR_ADMIN_ROLES)
@Controller("bank-accounts")
export class BankAccountsController {
  constructor(private readonly hr: HrService) {}

  @Get() list() { return this.hr.listBankAccounts(); }
  @Get(":id") get(@Param("id") id: string) { return this.hr.getBankAccount(id); }
  @Post() create(@Body() body: Prisma.BankAccountCreateInput) { return this.hr.createBankAccount(body); }
  @Patch(":id") update(@Param("id") id: string, @Body() body: Prisma.BankAccountUpdateInput) { return this.hr.updateBankAccount(id, body); }
  @Delete(":id") delete(@Param("id") id: string) { return this.hr.deleteBankAccount(id); }
}
