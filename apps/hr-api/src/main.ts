import { config as loadDotenv } from "dotenv";
import "reflect-metadata";
import { resolve } from "node:path";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

// Load the workspace-level .env for local development. Production deployments
// should provide these values through the process environment or secret store.
loadDotenv({ path: resolve(__dirname, "../../../.env") });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api/hr");
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
    credentials: true
  });
  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
  console.log(`[HR-API] Running on http://localhost:${port}/api/hr`);
}

void bootstrap();
