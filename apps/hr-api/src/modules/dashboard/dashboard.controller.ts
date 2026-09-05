import { Controller, Get, UseGuards } from "@nestjs/common";
import { HR_ADMIN_ROLES } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { HrService } from "../shared/hr.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...HR_ADMIN_ROLES)
@Controller("dashboard")
export class HrDashboardController {
  constructor(private readonly hr: HrService) {}

  @Get()
  data() {
    return this.hr.getDashboardData();
  }
}
