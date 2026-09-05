import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { HrService } from "../shared/hr.service";

@Controller("rbac")
export class RbacController {
  constructor(private readonly hr: HrService) {}

  @Get("roles") listRoles() { return this.hr.listRoles(); }
  @Post("roles") createRole(@Body() body: Prisma.RoleCreateInput) { return this.hr.createRole(body); }
  @Patch("roles/:id") updateRole(@Param("id") id: string, @Body() body: Prisma.RoleUpdateInput) { return this.hr.updateRole(id, body); }
  @Delete("roles/:id") deleteRole(@Param("id") id: string) { return this.hr.deleteRole(id); }

  @Get("permissions") listPermissions() { return this.hr.listPermissions(); }
  @Post("permissions") createPermission(@Body() body: Prisma.PermissionCreateInput) { return this.hr.createPermission(body); }
  @Post("role-permissions") assignPermission(@Body() body: Prisma.RolePermissionUncheckedCreateInput) { return this.hr.assignPermissionToRole(body); }
  @Delete("role-permissions/:id") removePermission(@Param("id") id: string) { return this.hr.removePermissionFromRole(id); }
  @Post("user-roles") assignRole(@Body() body: Prisma.UserRoleAssignmentUncheckedCreateInput) { return this.hr.assignRoleToUser(body); }
  @Delete("user-roles/:id") removeRole(@Param("id") id: string) { return this.hr.removeRoleFromUser(id); }
}
