import { Controller, Get } from "@nestjs/common";
import { HrService } from "./hr.service";

@Controller("time-off")
export class TimeOffController {
  constructor(private readonly hr: HrService) {}

  @Get("requests")
  listRequests() {
    return this.hr.listTimeOffRequests();
  }
}
