import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const webEnvPath = resolve(root, "apps", "web", ".env.local");
const env = { ...process.env };

if (existsSync(webEnvPath)) {
  const values = Object.fromEntries(readFileSync(webEnvPath, "utf8").split(/\r?\n/).filter((line) => /^\s*[A-Za-z_][A-Za-z0-9_]*\s*=/.test(line)).map((line) => {
    const [key, ...parts] = line.split("=");
    return [key.trim(), parts.join("=").trim().replace(/^['"]|['"]$/g, "")];
  }));
  const database = new URL(values.DATABASE_URL);
  const username = decodeURIComponent(database.username);
  const password = decodeURIComponent(database.password);
  env.DB_URL = `jdbc:postgresql://${database.hostname}:${database.port || "5432"}${database.pathname}`;
  env.DB_USERNAME = username;
  env.DB_PASSWORD = password;
  if (values.NEXTAUTH_SECRET) env.JWT_SECRET = values.NEXTAUTH_SECRET;
}

env.HR_API_URL ??= "http://localhost:3001/api/hr";
env.HR_API_JWT_SECRET ??= env.JWT_SECRET;

const command = process.platform === "win32" ? "mvnw.cmd" : "./mvnw";
const child = spawn(command, ["spring-boot:run"], { cwd: resolve(root, "apps", "payroll"), env, stdio: "inherit", shell: process.platform === "win32" });
child.on("exit", (code, signal) => process.exit(signal ? 1 : code ?? 1));
