import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { HrService } from "../shared/hr.service";

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
