import { Controller, Get } from "@nestjs/common";
import { HrService } from "./hr.service";

@Controller("contracts")
export class ContractsController {
  constructor(private readonly hr: HrService) {}

  @Get()
  list() {
    return this.hr.listContracts();
  }
}
