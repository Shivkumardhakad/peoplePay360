import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { HrService } from "../shared/hr.service";

@Controller("bank-accounts")
export class BankAccountsController {
  constructor(private readonly hr: HrService) {}

  @Get() list() { return this.hr.listBankAccounts(); }
  @Get(":id") get(@Param("id") id: string) { return this.hr.getBankAccount(id); }
  @Post() create(@Body() body: Prisma.BankAccountCreateInput) { return this.hr.createBankAccount(body); }
  @Patch(":id") update(@Param("id") id: string, @Body() body: Prisma.BankAccountUpdateInput) { return this.hr.updateBankAccount(id, body); }
  @Delete(":id") delete(@Param("id") id: string) { return this.hr.deleteBankAccount(id); }
}
