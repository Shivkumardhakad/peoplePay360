import { Controller, Get } from "@nestjs/common";
import { HrService } from "../shared/hr.service";

@Controller("employees")
export class EmployeesController {
  constructor(private readonly hr: HrService) {}

  @Get()
  list() {
    return this.hr.listEmployees();
  }
}
