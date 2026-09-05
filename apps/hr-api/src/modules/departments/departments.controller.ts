import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { departmentSchema } from "@peoplepay360/validation";
import { HrService } from "../shared/hr.service";
import { DepartmentAccessGuard } from "../shared/department-access.guard";

@Controller("departments")
@UseGuards(DepartmentAccessGuard)
export class DepartmentsController {
  constructor(private readonly hr: HrService) {}

  @Get()
  list(@Query("page") page?: string, @Query("limit") limit?: string) {
    const parsedPage = page === undefined ? 1 : Number(page);
    const parsedLimit = limit === undefined ? 50 : Number(limit);
    if (!Number.isInteger(parsedPage) || parsedPage < 1 || !Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      throw new BadRequestException("page must be >= 1 and limit must be between 1 and 100");
    }
    return this.hr.listDepartments(parsedPage, parsedLimit);
  }
  @Get(":id") get(@Param("id") id: string) { return this.hr.getDepartment(id); }
  @Post() create(@Body() body: unknown) {
    const parsed = departmentSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues);
    return this.hr.createDepartment(parsed.data);
  }
  @Patch(":id") update(@Param("id") id: string, @Body() body: unknown) {
    const parsed = departmentSchema.partial().safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues);
    return this.hr.updateDepartment(id, parsed.data);
  }
  @Delete(":id") remove(@Param("id") id: string) { return this.hr.deleteDepartment(id); }
}
