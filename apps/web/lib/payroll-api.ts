import { SignJWT } from "jose";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

type PayrollFetchOptions = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;
  headers?: HeadersInit;
};

export async function payrollApiFetch<T>(path: string, options: PayrollFetchOptions = {}): Promise<T> {
  const response = await payrollApiRequest(path, options);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function payrollApiFetchBinary(path: string, options: PayrollFetchOptions = {}) {
  const response = await payrollApiRequest(path, options);
  return Buffer.from(await response.arrayBuffer()).toString("base64");
}

async function payrollApiRequest(path: string, options: PayrollFetchOptions = {}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.role) redirect("/login");

  const token = await new SignJWT({
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    employeeId: session.user.employeeId ?? null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.user.id)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(new TextEncoder().encode(process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET ?? "PeoplePay360-dev-jwt-secret-change-in-production-2026"));

  const response = await fetch(`${process.env.PAYROLL_API_URL ?? "http://localhost:8080"}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...options.headers },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Payroll API ${response.status}: ${await response.text()}`);
  return response;
}
