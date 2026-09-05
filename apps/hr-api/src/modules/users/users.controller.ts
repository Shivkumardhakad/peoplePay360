import { Controller, Get } from "@nestjs/common";
import { HrService } from "../shared/hr.service";

@Controller("users")
export class UsersController {
  constructor(private readonly hr: HrService) {}

  @Get()
  list() {
    return this.hr.listUsers();
  }
}
