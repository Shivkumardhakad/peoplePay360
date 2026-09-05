import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { HrService } from "../shared/hr.service";

@Controller("users")
export class UsersController {
  constructor(private readonly hr: HrService) {}

  @Get()
  list() {
    return this.hr.listUsers();
  }
  @Get(":id") get(@Param("id") id: string) { return this.hr.getUser(id); }
  @Post() create(@Body() body: Prisma.UserUncheckedCreateInput) { return this.hr.createUser(body); }
  @Patch(":id") update(@Param("id") id: string, @Body() body: Prisma.UserUncheckedUpdateInput) { return this.hr.updateUser(id, body); }
  @Delete(":id") delete(@Param("id") id: string) { return this.hr.deleteUser(id); }
}
