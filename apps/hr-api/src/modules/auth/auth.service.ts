import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHmac, timingSafeEqual } from "node:crypto";
import { PrismaService } from "../../infrastructure/database/prisma.service";

export type AuthUser = { id: string; email: string; role: UserRole; employeeId: string | null };

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(email: string, password: string) {
    const user = await this.prisma.client.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new UnauthorizedException("Invalid email or password");
    const authUser: AuthUser = { id: user.id, email: user.email, role: user.role, employeeId: user.employeeId };
    return { accessToken: this.sign(authUser), user: authUser };
  }

  verify(token: string): AuthUser {
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) throw new UnauthorizedException("Invalid access token");
    const expected = this.signature(encoded);
    if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new UnauthorizedException("Invalid access token");
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString()) as AuthUser & { exp: number };
    if (!payload.exp || payload.exp < Date.now()) throw new UnauthorizedException("Access token expired");
    return { id: payload.id, email: payload.email, role: payload.role, employeeId: payload.employeeId };
  }

  private sign(user: AuthUser) {
    const encoded = Buffer.from(JSON.stringify({ ...user, exp: Date.now() + 8 * 60 * 60 * 1000 })).toString("base64url");
    return `${encoded}.${this.signature(encoded)}`;
  }

  private signature(value: string) {
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "secret_for_local_development_only_12345";
    return createHmac("sha256", secret).update(value).digest("base64url");
  }
}
