import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { SYSTEM_ADMIN_ROLES } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { HrService } from "../shared/hr.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...SYSTEM_ADMIN_ROLES)
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
