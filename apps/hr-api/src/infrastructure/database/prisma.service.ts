import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { prisma } from "@peoplepay360/db";

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  client = prisma;

  async onModuleInit() {
    try {
      await this.client.$connect();
      console.log("[PrismaService] Connected to PostgreSQL database successfully.");
    } catch (err) {
      console.warn("[PrismaService] Database connection warning (retrying lazily):", err);
    }
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
