import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "node:crypto";

@Injectable()
export class DepartmentAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ headers: { authorization?: string } }>();
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) throw new UnauthorizedException("Authentication is required");
    const token = header.slice("Bearer ".length);
    const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");
    if (!encodedHeader || !encodedPayload || !encodedSignature) throw new UnauthorizedException("Invalid token");
    const unsigned = `${encodedHeader}.${encodedPayload}`;
    const secret = process.env.JWT_SECRET ?? "PeoplePay360-dev-jwt-secret-change-in-production-2026";
    const expected = createHmac("sha256", secret).update(unsigned).digest();
    const actual = this.decode(encodedSignature);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new UnauthorizedException("Invalid token");
    const payload = JSON.parse(this.decode(encodedPayload).toString("utf8")) as { exp?: number; role?: string | string[] };
    if (payload.exp !== undefined && payload.exp < Math.floor(Date.now() / 1000)) throw new UnauthorizedException("Token expired");
    const roles = Array.isArray(payload.role) ? payload.role : [payload.role];
    if (!roles.some((role) => role === "ADMIN" || role === "HR_MANAGER")) throw new ForbiddenException("Department access denied");
    return true;
  }

  private decode(value: string) {
    return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  }
}
