import { BadRequestException, Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Public } from "./public.decorator";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  @Public()
  login(@Body() body: { email?: string; password?: string }) {
    if (!body.email || !body.password) throw new BadRequestException("Email and password are required");
    return this.auth.login(body.email, body.password);
  }
}
