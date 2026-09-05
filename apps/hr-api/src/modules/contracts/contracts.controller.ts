import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { contractSchema } from "@peoplepay360/validation";
import { Prisma, UserRole } from "@prisma/client";
import { Roles } from "../auth/roles.decorator";
import { HrService } from "../shared/hr.service";
import { DepartmentAccessGuard } from "../shared/department-access.guard";

@Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.HR_PAYROLL_USER, UserRole.PAYROLL_MANAGER)
@Controller("contracts")
@UseGuards(DepartmentAccessGuard)
export class ContractsController {
  constructor(private readonly hr: HrService) {}

  @Get()
  list(@Query("page") page?: string, @Query("limit") limit?: string) {
    if (page === undefined && limit === undefined) return this.hr.listContracts();
    const parsedPage = page === undefined ? 1 : Number(page);
    const parsedLimit = limit === undefined ? 50 : Number(limit);
    if (!Number.isInteger(parsedPage) || parsedPage < 1 || !Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      throw new BadRequestException("page must be >= 1 and limit must be between 1 and 100");
    }
    return this.hr.listContracts(parsedPage, parsedLimit);
  }
  @Get(":id") get(@Param("id") id: string) { return this.hr.getContract(id); }
  @Post() create(@Body() body: unknown) {
    const parsed = contractSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues);
    return this.hr.createContract(parsed.data);
  }
  @Patch(":id") update(@Param("id") id: string, @Body() body: unknown) {
    const parsed = contractSchema.partial().safeParse(body);
    if (!parsed.success || Object.keys(parsed.data).length === 0) throw new BadRequestException(parsed.success ? "At least one field is required" : parsed.error.issues);
    return this.hr.updateContract(id, parsed.data);
  }
}
