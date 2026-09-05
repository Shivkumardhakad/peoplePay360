import bcrypt from "bcryptjs";
import {
  PrismaClient,
  UserRole,
  EmploymentStatus,
  ContractStatus,
  EmploymentType,
  RecordStatus,
  ScheduleDay,
  RuleCategoryType,
  ComputationType,
  PayrunStatus,
  PayslipStatus,
  TimeOffUnit,
  TimeOffStatus,
  AttendanceStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

const FIRST_NAMES = [
  "Alexander", "Amara", "Benjamin", "Charlotte", "Daniel", "Elena", "Felix", "Grace",
  "Henry", "Isabella", "Jacob", "Katherine", "Liam", "Mia", "Nathan", "Olivia",
  "Peter", "Quinn", "Rachel", "Samuel", "Sophia", "Thomas", "Victoria", "William",
  "Xavier", "Yara", "Zachary", "Abigail", "Caleb", "Diana", "Ethan", "Fiona",
  "Gabriel", "Hannah", "Isaac", "Julia", "Kevin", "Laura", "Marcus", "Nora",
  "Oliver", "Penelope", "Richard", "Stella", "Tristan", "Uma", "Victor", "Wendy",
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas",
  "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White",
  "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young",
  "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
];

const DEPARTMENTS = [
  { code: "ENG", name: "Engineering", description: "Software development & infrastructure" },
  { code: "HR", name: "Human Resources", description: "Talent acquisition & employee success" },
  { code: "FIN", name: "Finance & Accounting", description: "Payroll, accounting & audit" },
  { code: "PROD", name: "Product & Design", description: "Product management & UX design" },
  { code: "OPS", name: "Operations", description: "Business operations & logistics" },
  { code: "SALES", name: "Sales & Business Dev", description: "Enterprise sales & growth" },
  { code: "MKTG", name: "Marketing", description: "Brand strategy & digital marketing" },
  { code: "LEGAL", name: "Legal & Compliance", description: "Corporate law & regulatory risk" },
  { code: "CS", name: "Customer Support", description: "Client success & technical support" },
  { code: "IT", name: "IT Services", description: "Internal IT, hardware & security" },
  { code: "EXEC", name: "Executive Office", description: "Leadership & strategic direction" },
  { code: "RD", name: "Research & Innovation", description: "R&D and emerging technologies" },
];

const JOB_TITLES_BY_DEPT: Record<string, string[]> = {
  ENG: ["Senior Software Engineer", "Backend Developer", "Frontend Architect", "DevOps Engineer", "QA Lead"],
  HR: ["HR Manager", "Talent Specialist", "HR Generalist", "People Partner"],
  FIN: ["Finance Director", "Senior Accountant", "Payroll Specialist", "Financial Analyst"],
  PROD: ["Lead Product Manager", "Senior UX Designer", "Product Owner", "UI Designer"],
  OPS: ["Operations Manager", "Supply Chain Lead", "Operations Coordinator"],
  SALES: ["Account Executive", "Sales Director", "Business Development Rep"],
  MKTG: ["Marketing Director", "Content Strategist", "SEO Specialist"],
  LEGAL: ["Corporate Counsel", "Compliance Manager", "Legal Assistant"],
  CS: ["Customer Success Manager", "Support Lead", "Technical Specialist"],
  IT: ["IT Administrator", "Network Security Engineer", "System Specialist"],
  EXEC: ["Chief Executive Officer", "Chief Operating Officer", "VP of Operations"],
  RD: ["Principal Research Scientist", "Innovation Engineer", "Data Scientist"],
};

const BANK_NAMES = [
  "JPMorgan Chase", "Bank of America", "Wells Fargo", "Citigroup", "Capital One",
  "U.S. Bank", "PNC Financial", "TD Bank", "BNY Mellon", "State Street",
];

async function main() {
  console.log("🧹 Resetting existing database records...");

  try {
    await prisma.userRoleAssignment.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.permission.deleteMany({});
    await prisma.role.deleteMany({});

    await prisma.payslipLine.deleteMany({});
    await prisma.payslip.deleteMany({});
    await prisma.payrunEmployee.deleteMany({});
    await prisma.payrun.deleteMany({});

    await prisma.salaryStructureRule.deleteMany({});
    await prisma.salaryRule.deleteMany({});
    await prisma.salaryRuleCategory.deleteMany({});
    await prisma.salaryStructure.deleteMany({});

    await prisma.attendance.deleteMany({});
    await prisma.timeOffRequest.deleteMany({});
    await prisma.allocation.deleteMany({});
    await prisma.timeOffType.deleteMany({});

    await prisma.workingScheduleDay.deleteMany({});
    await prisma.contract.deleteMany({});
    await prisma.workingSchedule.deleteMany({});

    await prisma.user.deleteMany({});
    await prisma.employee.deleteMany({});
    await prisma.bankAccount.deleteMany({});
    await prisma.jobPosition.deleteMany({});
    await prisma.department.deleteMany({});
    console.log("✅ Database reset complete.");
  } catch (err) {
    console.warn("⚠️ Reset warning (proceeding with upserts):", err);
  }

  const defaultPasswordHash = await bcrypt.hash("Password123!", 10);
  const adminPasswordHash = await bcrypt.hash("Admin123!", 10);

  // 1. Departments & Job Positions (using Upsert)
  console.log("🌱 Seeding Departments and Job Positions...");
  const createdDepartments: Array<{ id: string; code: string; name: string }> = [];
  const createdPositions: Array<{ id: string; code: string; title: string; departmentId: string | null }> = [];

  for (const dept of DEPARTMENTS) {
    const d = await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name, description: dept.description },
      create: { code: dept.code, name: dept.name, description: dept.description },
    });
    createdDepartments.push(d);

    const titles = JOB_TITLES_BY_DEPT[dept.code] || ["Specialist"];
    for (let i = 0; i < titles.length; i++) {
      const title = titles[i]!;
      const posCode = `${dept.code}_POS_${i + 1}`;
      const p = await prisma.jobPosition.upsert({
        where: { code: posCode },
        update: { title, departmentId: d.id },
        create: { code: posCode, title, departmentId: d.id, description: `${title} in ${dept.name}` },
      });
      createdPositions.push(p);
    }
  }

  // 2. Working Schedules (using Upsert)
  console.log("🌱 Seeding Working Schedules...");
  const scheduleNames = ["Standard 40H Week", "Flexible 37.5H Week", "Shift Alpha 40H", "Part-Time 20H Week", "Executive 45H Week"];
  const createdSchedules: Array<{ id: string; name: string }> = [];

  for (let i = 0; i < scheduleNames.length; i++) {
    const name = scheduleNames[i]!;
    const hours = i === 3 ? 20 : i === 1 ? 37.5 : i === 4 ? 45 : 40;
    const code = `SCHED_${i + 1}`;

    const sched = await prisma.workingSchedule.upsert({
      where: { name },
      update: { weeklyHours: hours },
      create: {
        name,
        code,
        weeklyHours: hours,
        status: RecordStatus.ACTIVE,
        days: [
          { day: "MONDAY", start: "09:00", end: "17:00", breakMinutes: 30 },
          { day: "TUESDAY", start: "09:00", end: "17:00", breakMinutes: 30 },
          { day: "WEDNESDAY", start: "09:00", end: "17:00", breakMinutes: 30 },
          { day: "THURSDAY", start: "09:00", end: "17:00", breakMinutes: 30 },
          { day: "FRIDAY", start: "09:00", end: "17:00", breakMinutes: 30 },
        ],
      },
    });
    createdSchedules.push(sched);

    const days: ScheduleDay[] = [ScheduleDay.MON, ScheduleDay.TUE, ScheduleDay.WED, ScheduleDay.THU, ScheduleDay.FRI];
    for (const dayOfWeek of days) {
      await prisma.workingScheduleDay.upsert({
        where: { workingScheduleId_dayOfWeek: { workingScheduleId: sched.id, dayOfWeek } },
        update: { startTime: "09:00", endTime: "17:00", breakMinutes: 30, isWorkingDay: true },
        create: {
          workingScheduleId: sched.id,
          dayOfWeek,
          startTime: "09:00",
          endTime: "17:00",
          breakMinutes: 30,
          isWorkingDay: true,
        },
      });
    }
  }

  // 3. Time Off Types (using Upsert)
  console.log("🌱 Seeding Time Off Types...");
  const timeOffTypesData = [
    { name: "Annual Paid Leave", unit: TimeOffUnit.DAYS, paid: true, requiresAllocation: true, code: "ANNUAL" },
    { name: "Sick Leave", unit: TimeOffUnit.DAYS, paid: true, requiresAllocation: true, code: "SICK" },
    { name: "Parental Leave", unit: TimeOffUnit.DAYS, paid: true, requiresAllocation: true, code: "PARENTAL" },
    { name: "Unpaid Personal Leave", unit: TimeOffUnit.DAYS, paid: false, requiresAllocation: false, code: "UNPAID" },
    { name: "Bereavement Leave", unit: TimeOffUnit.DAYS, paid: true, requiresAllocation: false, code: "BEREAVEMENT" },
    { name: "Study & Training Leave", unit: TimeOffUnit.DAYS, paid: true, requiresAllocation: true, code: "STUDY" },
    { name: "Compassionate Leave", unit: TimeOffUnit.DAYS, paid: true, requiresAllocation: false, code: "COMPASSIONATE" },
    { name: "Remote Work Allowance", unit: TimeOffUnit.DAYS, paid: true, requiresAllocation: true, code: "REMOTE" },
    { name: "Sabbatical Leave", unit: TimeOffUnit.DAYS, paid: false, requiresAllocation: true, code: "SABBATICAL" },
    { name: "Floating Holiday", unit: TimeOffUnit.DAYS, paid: true, requiresAllocation: true, code: "FLOATING" },
  ];
  const createdTimeOffTypes: Array<{ id: string; name: string }> = [];

  for (const tot of timeOffTypesData) {
    const type = await prisma.timeOffType.upsert({
      where: { name: tot.name },
      update: { unit: tot.unit, paid: tot.paid },
      create: {
        name: tot.name,
        code: tot.code,
        unit: tot.unit,
        paid: tot.paid,
        requiresAllocation: tot.requiresAllocation,
        approvalRequired: true,
        payrollBehavior: tot.paid ? "PAID" : "UNPAID",
        status: RecordStatus.ACTIVE,
      },
    });
    createdTimeOffTypes.push(type);
  }

  // 4. Salary Categories, Rules & Structures (using Upsert)
  console.log("🌱 Seeding Salary Rule Categories, Rules, and Structures...");
  const catBasic = await prisma.salaryRuleCategory.upsert({
    where: { code: "BASIC" },
    update: {},
    create: { name: "Basic Salary", code: "BASIC", type: RuleCategoryType.EARNING, description: "Base pay earnings" },
  });
  const catAllowance = await prisma.salaryRuleCategory.upsert({
    where: { code: "ALLOWANCE" },
    update: {},
    create: { name: "Allowances", code: "ALLOWANCE", type: RuleCategoryType.EARNING, description: "Housing and transport allowances" },
  });
  const catBonus = await prisma.salaryRuleCategory.upsert({
    where: { code: "BONUS" },
    update: {},
    create: { name: "Bonuses & Performance", code: "BONUS", type: RuleCategoryType.EARNING, description: "Performance incentive" },
  });
  const catDeduction = await prisma.salaryRuleCategory.upsert({
    where: { code: "DEDUCTION" },
    update: {},
    create: { name: "Deductions & Taxes", code: "DEDUCTION", type: RuleCategoryType.DEDUCTION, description: "Tax and insurance deductions" },
  });
  const catNet = await prisma.salaryRuleCategory.upsert({
    where: { code: "NET" },
    update: {},
    create: { name: "Net Salary", code: "NET", type: RuleCategoryType.AGGREGATE, description: "Final net calculation" },
  });

  const ruleBasic = await prisma.salaryRule.upsert({
    where: { code: "RULE_BASIC" },
    update: {},
    create: { name: "Basic Base Wage", code: "RULE_BASIC", categoryId: catBasic.id, sequence: 10, calculationType: ComputationType.PERCENTAGE, value: 60, status: RecordStatus.ACTIVE },
  });
  const ruleHRA = await prisma.salaryRule.upsert({
    where: { code: "RULE_HRA" },
    update: {},
    create: { name: "House Rent Allowance", code: "RULE_HRA", categoryId: catAllowance.id, sequence: 20, calculationType: ComputationType.PERCENTAGE, value: 20, status: RecordStatus.ACTIVE },
  });
  const ruleTransport = await prisma.salaryRule.upsert({
    where: { code: "RULE_TA" },
    update: {},
    create: { name: "Transport Allowance", code: "RULE_TA", categoryId: catAllowance.id, sequence: 30, calculationType: ComputationType.FIXED, value: 300, status: RecordStatus.ACTIVE },
  });
  const ruleTax = await prisma.salaryRule.upsert({
    where: { code: "RULE_TAX" },
    update: {},
    create: { name: "Income Tax Deduction", code: "RULE_TAX", categoryId: catDeduction.id, sequence: 40, calculationType: ComputationType.PERCENTAGE, value: 10, status: RecordStatus.ACTIVE },
  });
  const ruleInsurance = await prisma.salaryRule.upsert({
    where: { code: "RULE_INS" },
    update: {},
    create: { name: "Health Insurance Contribution", code: "RULE_INS", categoryId: catDeduction.id, sequence: 50, calculationType: ComputationType.FIXED, value: 150, status: RecordStatus.ACTIVE },
  });

  const salaryStructures = [
    { name: "Executive Salary Structure", code: "STRUCT_EXEC" },
    { name: "Standard Full-Time Structure", code: "STRUCT_STD" },
    { name: "Part-Time Contractor Structure", code: "STRUCT_PT" },
    { name: "Engineering Specialist Structure", code: "STRUCT_ENG" },
    { name: "Operations Support Structure", code: "STRUCT_OPS" },
  ];
  const createdStructures: Array<{ id: string; name: string }> = [];

  for (const s of salaryStructures) {
    const struct = await prisma.salaryStructure.upsert({
      where: { code: s.code },
      update: { name: s.name },
      create: { name: s.name, code: s.code, status: RecordStatus.ACTIVE },
    });
    createdStructures.push(struct);

    await prisma.salaryStructureRule.upsert({
      where: { salaryStructureId_salaryRuleId: { salaryStructureId: struct.id, salaryRuleId: ruleBasic.id } },
      update: {},
      create: { salaryStructureId: struct.id, salaryRuleId: ruleBasic.id, sequence: 10 },
    });
    await prisma.salaryStructureRule.upsert({
      where: { salaryStructureId_salaryRuleId: { salaryStructureId: struct.id, salaryRuleId: ruleHRA.id } },
      update: {},
      create: { salaryStructureId: struct.id, salaryRuleId: ruleHRA.id, sequence: 20 },
    });
    await prisma.salaryStructureRule.upsert({
      where: { salaryStructureId_salaryRuleId: { salaryStructureId: struct.id, salaryRuleId: ruleTransport.id } },
      update: {},
      create: { salaryStructureId: struct.id, salaryRuleId: ruleTransport.id, sequence: 30 },
    });
    await prisma.salaryStructureRule.upsert({
      where: { salaryStructureId_salaryRuleId: { salaryStructureId: struct.id, salaryRuleId: ruleTax.id } },
      update: {},
      create: { salaryStructureId: struct.id, salaryRuleId: ruleTax.id, sequence: 40 },
    });
    await prisma.salaryStructureRule.upsert({
      where: { salaryStructureId_salaryRuleId: { salaryStructureId: struct.id, salaryRuleId: ruleInsurance.id } },
      update: {},
      create: { salaryStructureId: struct.id, salaryRuleId: ruleInsurance.id, sequence: 50 },
    });
  }

  // 4.5 System Admin and Manager Accounts (Seed Admin immediately)
  console.log("🌱 Seeding System Admin and Manager Users...");
  const systemUsers = [
    { email: "admin@peoplepay360.com", name: "System Admin", role: UserRole.ADMIN },
    { email: "hr.manager@peoplepay360.com", name: "Sarah Connor (HR Mgr)", role: UserRole.HR_MANAGER },
    { email: "payroll.mgr@peoplepay360.com", name: "David Miller (Payroll Mgr)", role: UserRole.PAYROLL_MANAGER },
    { email: "payroll.user@peoplepay360.com", name: "Jessica Alba (Payroll Asst)", role: UserRole.HR_PAYROLL_USER },
  ];

  for (const su of systemUsers) {
    await prisma.user.upsert({
      where: { email: su.email },
      update: { name: su.name, passwordHash: adminPasswordHash, role: su.role },
      create: {
        email: su.email,
        name: su.name,
        passwordHash: adminPasswordHash,
        role: su.role,
      },
    });
  }

  // 5. Generate 210 Employees, Bank Accounts, Contracts & Users
  const TOTAL_EMPLOYEES = 210;
  console.log(`🌱 Seeding ${TOTAL_EMPLOYEES} Employees, Bank Accounts, Contracts and Users in fast parallel batches...`);

  const createdEmployees: Array<{ id: string; employeeNumber: string; email: string; name: string }> = [];
  const createdContracts: Array<{ id: string; employeeId: string; baseSalary: number }> = [];

  const BATCH_SIZE = 20;
  for (let b = 1; b <= TOTAL_EMPLOYEES; b += BATCH_SIZE) {
    const indices = Array.from({ length: Math.min(BATCH_SIZE, TOTAL_EMPLOYEES - b + 1) }, (_, idx) => b + idx);
    const results = await Promise.all(
      indices.map(async (i) => {
        const empNum = `EMP-${String(i).padStart(3, "0")}`;
        const fn = FIRST_NAMES[(i - 1) % FIRST_NAMES.length]!;
        const ln = LAST_NAMES[(i - 1) % LAST_NAMES.length]!;
        const name = `${fn} ${ln}`;
        const email = `${fn.toLowerCase()}.${ln.toLowerCase()}.${i}@peoplepay360.com`;

        const dept = createdDepartments[(i - 1) % createdDepartments.length]!;
        const deptPositions = createdPositions.filter((p) => p.departmentId === dept.id);
        const pos = deptPositions[0] || createdPositions[0]!;
        const schedule = createdSchedules[(i - 1) % createdSchedules.length]!;
        const structure = createdStructures[(i - 1) % createdStructures.length]!;
        const bankName = BANK_NAMES[(i - 1) % BANK_NAMES.length]!;

        const bankAccount = await prisma.bankAccount.create({
          data: {
            accountName: name,
            accountNumber: `ACCT-${10000000 + i}`,
            bankName,
            routingCode: `ROUT-${20000 + i}`,
          },
        });

        const status = i % 15 === 0 ? EmploymentStatus.ON_LEAVE : i % 25 === 0 ? EmploymentStatus.TERMINATED : EmploymentStatus.ACTIVE;

        const emp = await prisma.employee.upsert({
          where: { employeeNumber: empNum },
          update: { firstName: fn, lastName: ln, email, departmentId: dept.id, jobPositionId: pos.id },
          create: {
            employeeNumber: empNum,
            firstName: fn,
            lastName: ln,
            email,
            phone: `+1 (555) ${String(100 + (i % 900)).padStart(3, "0")}-${String(1000 + i).slice(-4)}`,
            dateOfBirth: new Date(1985 + (i % 15), (i % 12), 1 + (i % 28)),
            gender: i % 2 === 0 ? "Female" : "Male",
            address: `${100 + i} Corporate Boulevard, Suite ${i}`,
            bankAccountId: bankAccount.id,
            departmentId: dept.id,
            jobPositionId: pos.id,
            hireDate: new Date(2022 + (i % 4), (i % 12), 1 + (i % 28)),
            status,
          },
        });

        const baseSalary = 45000 + (i * 350);
        const contract = await prisma.contract.create({
          data: {
            employeeId: emp.id,
            positionId: pos.id,
            departmentId: dept.id,
            workingScheduleId: schedule.id,
            salaryStructureId: structure.id,
            employmentType: i % 10 === 0 ? EmploymentType.PART_TIME : EmploymentType.FULL_TIME,
            title: `${pos.title} Contract`,
            startDate: new Date(2023, 0, 1),
            baseSalary,
            weeklyHours: i % 10 === 0 ? 20 : 40,
            currency: "USD",
            payrollProfileCode: "STANDARD_MONTHLY",
            status: status === EmploymentStatus.TERMINATED ? ContractStatus.TERMINATED : ContractStatus.ACTIVE,
          },
        });

        await prisma.user.upsert({
          where: { email },
          update: { name, role: UserRole.EMPLOYEE, employeeId: emp.id, passwordHash: defaultPasswordHash },
          create: {
            email,
            name,
            passwordHash: defaultPasswordHash,
            role: UserRole.EMPLOYEE,
            employeeId: emp.id,
          },
        });

        return { emp: { id: emp.id, employeeNumber: empNum, email, name }, contract: { id: contract.id, employeeId: emp.id, baseSalary } };
      })
    );

    for (const res of results) {
      createdEmployees.push(res.emp);
      createdContracts.push(res.contract);
    }
  }



  // 6. Allocations (420+ records)
  console.log("🌱 Seeding Leave Allocations (420+ records)...");
  const annualType = createdTimeOffTypes[0]!;
  const sickType = createdTimeOffTypes[1]!;

  const allocationData = createdEmployees.flatMap((emp) => [
    {
      employeeId: emp.id,
      timeOffTypeId: annualType.id,
      periodStart: new Date(2026, 0, 1),
      periodEnd: new Date(2026, 11, 31),
      allocated: 20,
      consumed: 4,
      remaining: 16,
      status: RecordStatus.ACTIVE,
    },
    {
      employeeId: emp.id,
      timeOffTypeId: sickType.id,
      periodStart: new Date(2026, 0, 1),
      periodEnd: new Date(2026, 11, 31),
      allocated: 10,
      consumed: 1,
      remaining: 9,
      status: RecordStatus.ACTIVE,
    },
  ]);
  await prisma.allocation.createMany({ data: allocationData, skipDuplicates: true });

  // 7. Time Off Requests (210+ records)
  console.log("🌱 Seeding Time Off Requests (210+ records)...");
  const timeOffRequestData = createdEmployees.map((emp, idx) => {
    const status = idx % 3 === 0 ? TimeOffStatus.APPROVED : idx % 3 === 1 ? TimeOffStatus.SUBMITTED : TimeOffStatus.REJECTED;
    return {
      employeeId: emp.id,
      timeOffTypeId: annualType.id,
      startDate: new Date(2026, 4, 10 + (idx % 15)),
      endDate: new Date(2026, 4, 12 + (idx % 15)),
      quantity: 3,
      status,
      reason: `Annual leave request #${idx + 1} for family vacation`,
    };
  });
  await prisma.timeOffRequest.createMany({ data: timeOffRequestData });

  // 8. Attendance Records (630+ records)
  console.log("🌱 Seeding Attendance Records (630+ records)...");
  const attendanceDates = ["2026-09-01", "2026-09-02", "2026-09-03"];
  const attendanceData = createdEmployees.flatMap((emp, idx) =>
    attendanceDates.map((d) => ({
      employeeId: emp.id,
      workingScheduleId: createdSchedules[idx % createdSchedules.length]!.id,
      date: new Date(`${d}T00:00:00.000Z`),
      checkIn: new Date(`${d}T09:00:00.000Z`),
      checkOut: new Date(`${d}T17:00:00.000Z`),
      breakMinutes: 30,
      workedMinutes: 450,
      status: idx % 10 === 0 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
    }))
  );
  await prisma.attendance.createMany({ data: attendanceData, skipDuplicates: true });

  // 9. Payruns, Selections, Payslips & Payslip Lines (200+ each)
  console.log("🌱 Seeding Payruns, Selections, Payslips and Payslip Lines (200+ per table)...");
  const defaultStructure = createdStructures[0]!;
  const payrunMonths = [
    { name: "January 2026 Payrun", start: new Date(2026, 0, 1), end: new Date(2026, 0, 31), status: PayrunStatus.PAID },
    { name: "February 2026 Payrun", start: new Date(2026, 1, 1), end: new Date(2026, 1, 28), status: PayrunStatus.PAID },
    { name: "March 2026 Payrun", start: new Date(2026, 2, 1), end: new Date(2026, 2, 31), status: PayrunStatus.PAID },
    { name: "April 2026 Payrun", start: new Date(2026, 3, 1), end: new Date(2026, 3, 30), status: PayrunStatus.VALIDATED },
    { name: "May 2026 Payrun", start: new Date(2026, 4, 1), end: new Date(2026, 4, 31), status: PayrunStatus.DRAFT },
  ];

  for (const pr of payrunMonths) {
    const payrun = await prisma.payrun.create({
      data: {
        name: pr.name,
        periodStart: pr.start,
        periodEnd: pr.end,
        salaryStructureId: defaultStructure.id,
        status: pr.status,
        paidAt: pr.status === PayrunStatus.PAID ? pr.end : undefined,
        validatedAt: pr.status === PayrunStatus.PAID || pr.status === PayrunStatus.VALIDATED ? pr.end : undefined,
      },
    });

    const selections = createdEmployees.map((emp) => ({
      payrunId: payrun.id,
      employeeId: emp.id,
    }));
    await prisma.payrunEmployee.createMany({ data: selections, skipDuplicates: true });

    if (pr.name === "January 2026 Payrun") {
      for (const contract of createdContracts) {
        const emp = createdEmployees.find((e) => e.id === contract.employeeId)!;
        const gross = Number(contract.baseSalary) / 12;
        const deductions = gross * 0.15;
        const net = gross - deductions;

        const payslip = await prisma.payslip.create({
          data: {
            payrunId: payrun.id,
            employeeId: emp.id,
            contractId: contract.id,
            periodStart: pr.start,
            periodEnd: pr.end,
            grossAmount: gross,
            deductionAmount: deductions,
            netAmount: net,
            status: PayslipStatus.PAID,
          },
        });

        await prisma.payslipLine.createMany({
          data: [
            { payslipId: payslip.id, code: "BASIC", name: "Basic Salary", categoryId: catBasic.id, sequence: 10, amount: gross * 0.6 },
            { payslipId: payslip.id, code: "HRA", name: "House Rent Allowance", categoryId: catAllowance.id, sequence: 20, amount: gross * 0.2 },
            { payslipId: payslip.id, code: "TA", name: "Transport Allowance", categoryId: catAllowance.id, sequence: 30, amount: 300 },
            { payslipId: payslip.id, code: "TAX", name: "Income Tax", categoryId: catDeduction.id, sequence: 40, amount: deductions * 0.7 },
            { payslipId: payslip.id, code: "INS", name: "Health Insurance", categoryId: catDeduction.id, sequence: 50, amount: deductions * 0.3 },
          ],
        });
      }
    }
  }

  // 10. RBAC Roles, Permissions, RolePermissions & UserRoleAssignments
  console.log("🌱 Seeding RBAC Roles, Permissions & Assignments (200+ per table)...");
  const rolesData = [
    { name: "System Administrator", description: "Full system administrative access" },
    { name: "HR Manager", description: "Full access to HR contracts and employees" },
    { name: "Payroll Officer", description: "Payruns, payslips and salary rule processing" },
    { name: "Department Manager", description: "Department level approvals and attendance" },
    { name: "Employee Self Service", description: "Standard employee portal access" },
  ];
  const createdRoles: Array<{ id: string; name: string }> = [];

  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: r,
    });
    createdRoles.push(role);
  }

  const resources = ["employees", "contracts", "attendance", "time_off", "payruns", "payslips", "salary_rules", "departments", "reports", "users"];
  const actions = ["create", "read", "update", "delete", "export", "approve", "validate", "compute", "pay", "send"];

  const createdPermissions: Array<{ id: string }> = [];
  for (const res of resources) {
    for (const act of actions) {
      const permName = `${res}:${act}`;
      const perm = await prisma.permission.upsert({
        where: { name: permName },
        update: {},
        create: {
          name: permName,
          resource: res,
          action: act,
          description: `Ability to ${act} ${res}`,
        },
      });
      createdPermissions.push(perm);
    }
  }

  const adminRole = createdRoles[0]!;
  const rolePermissionsData = createdPermissions.map((perm) => ({
    roleId: adminRole.id,
    permissionId: perm.id,
  }));
  await prisma.rolePermission.createMany({ data: rolePermissionsData, skipDuplicates: true });

  const allUsers = await prisma.user.findMany({ select: { id: true } });
  const userRoleAssignmentsData = allUsers.map((u, idx) => ({
    userId: u.id,
    roleId: createdRoles[idx % createdRoles.length]!.id,
  }));
  await prisma.userRoleAssignment.createMany({ data: userRoleAssignmentsData, skipDuplicates: true });

  console.log("🎉 Database seeding completed successfully!");
  console.log(`
📊 Seed Summary:
---------------------------------------------
  • Departments:         ${createdDepartments.length}
  • Job Positions:       ${createdPositions.length}
  • Working Schedules:   ${createdSchedules.length}
  • Bank Accounts:       ${TOTAL_EMPLOYEES}
  • Employees:           ${TOTAL_EMPLOYEES}
  • Users:               ${allUsers.length}
  • Contracts:           ${createdContracts.length}
  • Allocations:         ${allocationData.length}
  • Time Off Requests:   ${timeOffRequestData.length}
  • Attendance Records:  ${attendanceData.length}
  • Payruns:             ${payrunMonths.length}
  • Payrun Selections:   ${payrunMonths.length * TOTAL_EMPLOYEES}
  • Payslips:            210
  • Payslip Lines:       1050
  • Roles & Permissions: ${createdRoles.length} Roles, ${createdPermissions.length} Permissions, ${userRoleAssignmentsData.length} User Assignments
---------------------------------------------
  `);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("❌ Seeding failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
