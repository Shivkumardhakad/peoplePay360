import { Controller, Get } from "@nestjs/common";
import { HrService } from "../shared/hr.service";

@Controller("job-positions")
export class JobPositionsController {
  constructor(private readonly hr: HrService) {}

  @Get()
  list() {
    return this.hr.listJobPositions();
  }
}
