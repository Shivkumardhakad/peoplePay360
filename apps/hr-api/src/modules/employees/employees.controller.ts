import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { Prisma, UserRole } from "@prisma/client";
import { Roles } from "../auth/roles.decorator";
import { HrService } from "../shared/hr.service";

@Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.HR_PAYROLL_USER, UserRole.PAYROLL_MANAGER)
@Controller("employees")
export class EmployeesController {
  constructor(private readonly hr: HrService) {}

  @Get()
  list() {
    return this.hr.listEmployees();
  }

  @Get(":id") get(@Param("id") id: string) { return this.hr.getEmployee(id); }
  @Post() create(@Body() body: Prisma.EmployeeUncheckedCreateInput) { return this.hr.createEmployee(body); }
  @Patch(":id") update(@Param("id") id: string, @Body() body: Prisma.EmployeeUncheckedUpdateInput) { return this.hr.updateEmployee(id, body); }
  @Delete(":id") terminate(@Param("id") id: string) { return this.hr.terminateEmployee(id); }
}
