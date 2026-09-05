import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { HR_ADMIN_ROLES } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { HrService } from "../shared/hr.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...HR_ADMIN_ROLES)
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
