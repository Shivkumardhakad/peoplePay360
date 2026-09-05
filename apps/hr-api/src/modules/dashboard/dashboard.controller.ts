import { Controller, Get } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../auth/roles.decorator";
import { HrService } from "../shared/hr.service";

@Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.HR_PAYROLL_USER, UserRole.PAYROLL_MANAGER)
@Controller("dashboard")
export class HrDashboardController {
  constructor(private readonly hr: HrService) {}

  @Get()
  data() {
    return this.hr.getDashboardData();
  }
}
