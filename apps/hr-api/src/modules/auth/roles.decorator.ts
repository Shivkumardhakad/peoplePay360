import { SetMetadata } from "@nestjs/common";
import type { AuthRole } from "./auth.types";

export const ROLES_KEY = "roles";
export const REQUIRED_ROLES = ROLES_KEY;

export const Roles = (...roles: (AuthRole | string)[]) => SetMetadata(ROLES_KEY, roles);

