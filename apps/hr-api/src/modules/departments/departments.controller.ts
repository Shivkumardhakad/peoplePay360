import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { Prisma, UserRole } from "@prisma/client";
import { Roles } from "../auth/roles.decorator";
import { HrService } from "../shared/hr.service";

@Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.HR_PAYROLL_USER, UserRole.PAYROLL_MANAGER)
@Controller("departments")
export class DepartmentsController {
  constructor(private readonly hr: HrService) {}

  @Get()
  list() {
    return this.hr.listDepartments();
  }
  @Post() create(@Body() body: Prisma.DepartmentCreateInput) { return this.hr.createDepartment(body); }
  @Patch(":id") update(@Param("id") id: string, @Body() body: Prisma.DepartmentUpdateInput) { return this.hr.updateDepartment(id, body); }
  @Delete(":id") remove(@Param("id") id: string) { return this.hr.deleteDepartment(id); }
}
