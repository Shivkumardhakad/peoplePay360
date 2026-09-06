import { SignJWT } from "jose";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

type HrFetchOptions = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;
  headers?: HeadersInit;
};

export async function hrApiFetch<T>(path: string, options: HrFetchOptions = {}): Promise<T> {
  const token = await createHrApiToken();
  const response = await fetch(`${getHrApiBaseUrl()}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store"
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`HR API ${response.status}: ${detail || response.statusText}`);
  }

  return response.json() as Promise<T>;
}

async function createHrApiToken() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.role) {
    redirect("/login");
  }

  return new SignJWT({
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    employeeId: session.user.employeeId ?? null
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.user.id)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(getSecret());
}

function getHrApiBaseUrl() {
  return process.env.HR_API_URL ?? "http://localhost:3001/api/hr";
}

function getSecret() {
  const secret = process.env.HR_API_JWT_SECRET ?? (process.env.NODE_ENV === "production" ? process.env.NEXTAUTH_SECRET : "peoplepay360-dev-secret");
  if (!secret) {
    throw new Error("HR_API_JWT_SECRET or NEXTAUTH_SECRET must be configured");
  }

  return new TextEncoder().encode(secret);
}
