import { SetMetadata } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { REQUIRED_ROLES } from "./auth.guard";

export const Roles = (...roles: UserRole[]) => SetMetadata(REQUIRED_ROLES, roles);
