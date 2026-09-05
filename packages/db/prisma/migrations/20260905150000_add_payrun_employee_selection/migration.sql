CREATE TABLE "public"."PayrunEmployee" (
  "id" TEXT NOT NULL,
  "payrunId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PayrunEmployee_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PayrunEmployee_payrunId_employeeId_key" ON "public"."PayrunEmployee"("payrunId", "employeeId");
CREATE INDEX "PayrunEmployee_employeeId_idx" ON "public"."PayrunEmployee"("employeeId");

ALTER TABLE "public"."PayrunEmployee" ADD CONSTRAINT "PayrunEmployee_payrunId_fkey" FOREIGN KEY ("payrunId") REFERENCES "public"."Payrun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."PayrunEmployee" ADD CONSTRAINT "PayrunEmployee_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
