import { Controller, Get } from "@nestjs/common";
import { HrService } from "../shared/hr.service";

@Controller("attendance")
export class AttendanceController {
  constructor(private readonly hr: HrService) {}

  @Get()
  list() {
    return this.hr.listAttendance();
  }
}
