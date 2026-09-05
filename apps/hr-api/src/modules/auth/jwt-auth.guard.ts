import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { jwtVerify } from "jose";
import type { AuthRole, RequestWithUser } from "./auth.types";

type HrJwtPayload = {
  sub?: string;
  email?: string;
  name?: string;
  role?: AuthRole;
  employeeId?: string | null;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.getBearerToken(request);

    if (!token) {
      throw new UnauthorizedException("Missing bearer token");
    }

    try {
      const { payload } = await jwtVerify(token, this.getSecret());
      const claims = payload as HrJwtPayload;

      if (!claims.sub || !claims.role) {
        throw new UnauthorizedException("Invalid bearer token claims");
      }

      request.user = {
        id: claims.sub,
        email: claims.email,
        name: claims.name,
        role: claims.role,
        employeeId: claims.employeeId ?? null
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException("Invalid bearer token");
    }
  }

  private getBearerToken(request: RequestWithUser) {
    const header = request.headers.authorization;
    const value = Array.isArray(header) ? header[0] : header;
    const [scheme, token] = value?.split(" ") ?? [];

    if (scheme?.toLowerCase() !== "bearer" || !token) {
      return null;
    }

    return token;
  }

  private getSecret() {
    const secret = process.env.HR_API_JWT_SECRET ?? (process.env.NODE_ENV === "production" ? process.env.NEXTAUTH_SECRET : "peoplepay360-dev-secret");
    if (!secret) {
      throw new UnauthorizedException("HR API JWT secret is not configured");
    }

    return new TextEncoder().encode(secret);
  }
}
