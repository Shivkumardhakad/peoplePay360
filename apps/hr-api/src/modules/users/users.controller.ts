import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { Prisma, UserRole } from "@prisma/client";
import { HrAuthGuard } from "../auth/auth.guard";
import { Roles } from "../auth/roles.decorator";
import { HrService } from "../shared/hr.service";

@Controller("users")
@UseGuards(HrAuthGuard)
@Roles(UserRole.ADMIN)
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
