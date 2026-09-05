import { Controller, Get } from "@nestjs/common";
import { HrService } from "../shared/hr.service";

@Controller("departments")
export class DepartmentsController {
  constructor(private readonly hr: HrService) {}

  @Get()
  list() {
    return this.hr.listDepartments();
  }
}
