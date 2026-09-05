import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const date = (value: string) => new Date(`${value}T00:00:00.000Z`);

async function main() {
  const passwordHash = await bcrypt.hash("Admin123!", 10);

  const schedule = await prisma.workingScwhedule.upsert({
    where: { name: "Standard 40 Hour Week" },
    update: {},
    create: {
      name: "Standard 40 Hour Week",
      weeklyHours: 40,
      days: [
        { day: "MONDAY", start: "09:00", end: "17:00", breakMinutes: 30 },
        { day: "TUESDAY", start: "09:00", end: "17:00", breakMinutes: 30 },
        { day: "WEDNESDAY", start: "09:00", end: "17:00", breakMinutes: 30 },
        { day: "THURSDAY", start: "09:00", end: "17:00", breakMinutes: 30 },
        { day: "FRIDAY", start: "09:00", end: "17:00", breakMinutes: 30 }
      ]
    }
  });

  const payrollDepartment = await prisma.department.upsert({
    where: { code: "PAYROLL" },
    update: {},
    create: {
      code: "PAYROLL",
      name: "Payroll"
    }
  });

  const peopleDepartment = await prisma.department.upsert({
    where: { code: "PEOPLE" },
    update: {},
    create: {
      code: "PEOPLE",
      name: "People"
    }
  });

  const productDepartment = await prisma.department.upsert({
    where: { code: "PRODUCT" },
    update: {},
    create: {
      code: "PRODUCT",
      name: "Product"
    }
  });

  const operationsDepartment = await prisma.department.upsert({
    where: { code: "OPERATIONS" },
    update: {},
    create: {
      code: "OPERATIONS",
      name: "Operations"
    }
  });

  const positions = {
    "Payroll Manager": await prisma.jobPosition.upsert({
      where: { code: "PAYROLL_MANAGER" },
      update: {},
      create: { code: "PAYROLL_MANAGER", title: "Payroll Manager", departmentId: payrollDepartment.id }
    }),
    "HR Manager": await prisma.jobPosition.upsert({
      where: { code: "HR_MANAGER" },
      update: {},
      create: { code: "HR_MANAGER", title: "HR Manager", departmentId: peopleDepartment.id }
    }),
    Engineer: await prisma.jobPosition.upsert({
      where: { code: "ENGINEER" },
      update: {},
      create: { code: "ENGINEER", title: "Engineer", departmentId: productDepartment.id }
    }),
    "Support Lead": await prisma.jobPosition.upsert({
      where: { code: "SUPPORT_LEAD" },
      update: {},
      create: { code: "SUPPORT_LEAD", title: "Support Lead", departmentId: operationsDepartment.id }
    })
  };

  const departments = {
    Payroll: payrollDepartment,
    People: peopleDepartment,
    Product: productDepartment,
    Operations: operationsDepartment
  };

  const leave = await prisma.timeOffType.upsert({
    where: { name: "Annual Leave" },
    update: {},
    create: {
      name: "Annual Leave",
      unit: "DAYS",
      requiresAllocation: true,
      paid: true,
      approvalRequired: true
    }
  });

  const sick = await prisma.timeOffType.upsert({
    where: { name: "Sick Leave" },
    update: {},
    create: {
      name: "Sick Leave",
      unit: "DAYS",
      requiresAllocation: true,
      paid: true,
      approvalRequired: true
    }
  });

  const employees = [
    ["EMP-001", "Avery", "Stone", "avery.stone@example.com", "Payroll Manager", "Payroll", 7200],
    ["EMP-002", "Maya", "Patel", "maya.patel@example.com", "HR Manager", "People", 6500],
    ["EMP-003", "Noah", "Kim", "noah.kim@example.com", "Engineer", "Product", 5800],
    ["EMP-004", "Lina", "Garcia", "lina.garcia@example.com", "Support Lead", "Operations", 5200]
  ] as const;

  for (const [employeeNumber, firstName, lastName, email, jobTitle, department, salary] of employees) {
    const employee = await prisma.employee.upsert({
      where: { employeeNumber },
      update: {},
      create: {
        employeeNumber,
        firstName,
        lastName,
        email,
        departmentId: departments[department].id,
        jobPositionId: positions[jobTitle].id,
        hireDate: date("2025-01-01")
      }
    });

    const existingContract = await prisma.contract.findFirst({
      where: {
        employeeId: employee.id,
        startDate: date("2025-01-01")
      }
    });

    if (!existingContract) {
      await prisma.contract.create({
        data: {
          employeeId: employee.id,
          title: `${jobTitle} Contract`,
          startDate: date("2025-01-01"),
          baseSalary: salary,
          weeklyHours: 40,
          payrollProfileCode: "STANDARD_MONTHLY",
          status: "ACTIVE"
        }
      });
    }

    await prisma.allocation.createMany({
      data: [
        {
          employeeId: employee.id,
          timeOffTypeId: leave.id,
          periodStart: date("2026-01-01"),
          periodEnd: date("2026-12-31"),
          allocated: 20,
          consumed: employeeNumber === "EMP-003" ? 2 : 0
        },
        {
          employeeId: employee.id,
          timeOffTypeId: sick.id,
          periodStart: date("2026-01-01"),
          periodEnd: date("2026-12-31"),
          allocated: 10,
          consumed: 0
        }
      ],
      skipDuplicates: true
    });

    await prisma.attendance.createMany({
      data: ["2026-09-01", "2026-09-02", "2026-09-03"].map((day) => ({
        employeeId: employee.id,
        workingScheduleId: schedule.id,
        date: date(day),
        checkIn: new Date(`${day}T09:00:00.000Z`),
        checkOut: new Date(`${day}T17:00:00.000Z`),
        breakMinutes: 30,
        workedMinutes: 450,
        status: "PRESENT" as const
      })),
      skipDuplicates: true
    });
  }

  const adminEmployee = await prisma.employee.findUniqueOrThrow({
    where: { employeeNumber: "EMP-001" }
  });

  await prisma.user.upsert({
    where: { email: "admin@peoplepay360.local" },
    update: {},
    create: {
      email: "admin@peoplepay360.local",
      name: "PeoplePay360 Admin",
      passwordHash,
      role: "ADMIN",
      employeeId: adminEmployee.id
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
