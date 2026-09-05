import { Controller, Get } from "@nestjs/common";
import { HrService } from "./hr.service";

@Controller("dashboard")
export class HrDashboardController {
  constructor(private readonly hr: HrService) {}

  @Get()
  data() {
    return this.hr.getDashboardData();
  }
}
