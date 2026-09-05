import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthService, AuthUser } from "./auth.service";
import { IS_PUBLIC } from "./public.decorator";
import { ROLES_KEY } from "./roles.decorator";

export const REQUIRED_ROLES = ROLES_KEY;

@Injectable()
export class HrAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService, private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [context.getHandler(), context.getClass()])) return true;
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined>; user?: AuthUser }>();
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) throw new UnauthorizedException("Bearer access token is required");
    request.user = this.auth.verify(header.slice(7));
    const roles = this.reflector.getAllAndOverride<string[]>(REQUIRED_ROLES, [context.getHandler(), context.getClass()]);
    if (roles?.length && !roles.includes(request.user.role)) throw new UnauthorizedException("You do not have permission for this operation");
    return true;
  }
}
