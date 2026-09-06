"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { TrendingUp, Users, Calendar, DollarSign, UserCheck, Clock, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { getHrDashboardAction, getPayrollDashboardAction } from "@/lib/api-actions";

// Default departments across the organization
const DEFAULT_DEPARTMENTS = [
  { id: "dept-eng", name: "Engineering" },
  { id: "dept-prod", name: "Product & Design" },
  { id: "dept-sales", name: "Sales" },
  { id: "dept-mkt", name: "Marketing" },
  { id: "dept-ops", name: "Operations & HR" }
];

// Role-specific mock configurations
const ROLE_MOCK_PROFILES = {
  ADMIN: {
    title: "Executive Overview",
    subtitle: "Organization-wide payroll expenditure, workforce distribution, and fiscal health.",
    totalNetPaid: 284950.0,
    payslipsGenerated: 64,
    averageNet: 4452.34,
    approvedLeave: 19,
    salaryByDepartment: [
      { name: "Engineering", total: 132400 },
      { name: "Product & Design", total: 54600 },
      { name: "Sales", total: 46200 },
      { name: "Marketing", total: 31750 },
      { name: "Operations & HR", total: 20000 }
    ],
    alerts: {
      missingBankDetails: 0,
      attendanceExceptions: 1,
      pendingApprovals: 3
    }
  },
  HR_MANAGER: {
    title: "HR Operations Overview",
    subtitle: "Live workforce analytics, presence monitoring, and leave management.",
    headcount: 62,
    attendanceRate: 97.4,
    pendingLeave: 5,
    approvedLeave: 24,
    departments: [
      { name: "Engineering", total: 26 },
      { name: "Product & Design", total: 12 },
      { name: "Sales", total: 11 },
      { name: "Marketing", total: 8 },
      { name: "Operations & HR", total: 5 }
    ]
  },
  HR_PAYROLL_MANAGER: {
    title: "Payroll Operations Overview",
    subtitle: "Payrun batch tracking, disbursement cycles, and deduction reconciliation.",
    totalNetPaid: 198750.0,
    payslipsGenerated: 46,
    averageNet: 4320.65,
    approvedLeave: 15,
    salaryByDepartment: [
      { name: "Engineering", total: 96500 },
      { name: "Product & Design", total: 39200 },
      { name: "Sales", total: 33850 },
      { name: "Marketing", total: 19200 },
      { name: "Operations & HR", total: 10000 }
    ],
    alerts: {
      missingBankDetails: 1,
      attendanceExceptions: 2,
      pendingApprovals: 2
    }
  },
  HR_PAYROLL_USER: {
    title: "Payroll Specialist Overview",
    subtitle: "Active payrun status, employee payslip generation, and payroll validation.",
    totalNetPaid: 154200.0,
    payslipsGenerated: 36,
    averageNet: 4283.33,
    approvedLeave: 12,
    salaryByDepartment: [
      { name: "Engineering", total: 78000 },
      { name: "Product & Design", total: 32000 },
      { name: "Sales", total: 24200 },
      { name: "Marketing", total: 12000 },
      { name: "Operations & HR", total: 8000 }
    ],
    alerts: {
      missingBankDetails: 1,
      attendanceExceptions: 1,
      pendingApprovals: 1
    }
  }
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const role = (session?.user?.role || "ADMIN") as keyof typeof ROLE_MOCK_PROFILES;
  const isHrManager = role === "HR_MANAGER";

  // Get active role profile for defaults
  const activeProfile = ROLE_MOCK_PROFILES[role] || (isHrManager ? ROLE_MOCK_PROFILES.HR_MANAGER : ROLE_MOCK_PROFILES.ADMIN);

  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [departmentId, setDepartmentId] = useState("");

  const [hrData, setHrData] = useState({
    headcount: 0,
    attendanceRate: 0,
    pendingLeave: 0,
    approvedLeave: 0,
    departments: [] as { name: string; total: number }[]
  });

  const [payrollData, setPayrollData] = useState({
    totalNetPaid: 0,
    payslipsGenerated: 0,
    averageNet: 0,
    approvedLeave: 0,
    salaryByDepartment: [] as { name: string; total: number }[],
    departments: DEFAULT_DEPARTMENTS,
    alerts: { attendanceExceptions: 0, pendingApprovals: 0, missingBankDetails: 0 }
  });

  // Fetch real data on mount or filter change
  useEffect(() => {
    if (isHrManager) {
      getHrDashboardAction()
        .then((res) => {
          if (res && res.headcount > 0) {
            setHrData(res);
          }
        })
        .catch(() => undefined);
    }
  }, [isHrManager]);

  useEffect(() => {
    if (!isHrManager) {
      getPayrollDashboardAction(period, departmentId)
        .then((res) => {
          if (res && (res.totalNetPaid > 0 || res.payslipsGenerated > 0)) {
            setPayrollData(res);
          }
        })
        .catch(() => undefined);
    }
  }, [departmentId, isHrManager, period]);

  // Compute effective display data: Use live data if present, otherwise use role-specific mock
  const displayHr = useMemo(() => {
    const mock = ROLE_MOCK_PROFILES.HR_MANAGER;
    return {
      headcount: hrData.headcount > 0 ? hrData.headcount : mock.headcount,
      attendanceRate: hrData.attendanceRate > 0 ? hrData.attendanceRate : mock.attendanceRate,
      pendingLeave: hrData.pendingLeave > 0 ? hrData.pendingLeave : mock.pendingLeave,
      approvedLeave: hrData.approvedLeave > 0 ? hrData.approvedLeave : mock.approvedLeave,
      departments: hrData.departments.length > 0 ? hrData.departments : mock.departments
    };
  }, [hrData]);

  const displayPayroll = useMemo(() => {
    const mock = ("totalNetPaid" in activeProfile ? activeProfile : ROLE_MOCK_PROFILES.ADMIN) as typeof ROLE_MOCK_PROFILES.ADMIN;
    const hasLive = payrollData.totalNetPaid > 0 || payrollData.payslipsGenerated > 0;

    let salaryByDept = hasLive && payrollData.salaryByDepartment.length > 0
      ? payrollData.salaryByDepartment
      : mock.salaryByDepartment;

    let totalPaid = hasLive ? payrollData.totalNetPaid : mock.totalNetPaid;
    let payslips = hasLive ? payrollData.payslipsGenerated : mock.payslipsGenerated;
    let avgNet = hasLive ? payrollData.averageNet : mock.averageNet;

    // If department filter is active, filter the mock/live values accordingly
    if (departmentId) {
      const selectedDept = DEFAULT_DEPARTMENTS.find((d) => d.id === departmentId);
      if (selectedDept) {
        salaryByDept = salaryByDept.filter((s) => s.name.toLowerCase().includes(selectedDept.name.toLowerCase()));
        if (salaryByDept.length > 0) {
          totalPaid = salaryByDept.reduce((sum, s) => sum + s.total, 0);
          payslips = Math.max(1, Math.round(payslips * (totalPaid / mock.totalNetPaid)));
          avgNet = Math.round(totalPaid / payslips);
        }
      }
    }

    return {
      totalNetPaid: totalPaid,
      payslipsGenerated: payslips,
      averageNet: avgNet,
      approvedLeave: hasLive && payrollData.approvedLeave > 0 ? payrollData.approvedLeave : mock.approvedLeave,
      salaryByDepartment: salaryByDept,
      departments: payrollData.departments.length > 0 ? payrollData.departments : DEFAULT_DEPARTMENTS,
      alerts: hasLive && (payrollData.alerts.attendanceExceptions > 0 || payrollData.alerts.pendingApprovals > 0)
        ? payrollData.alerts
        : mock.alerts
    };
  }, [activeProfile, departmentId, payrollData]);

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold tracking-tight text-foreground">
              {activeProfile.title}
            </h1>
            <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-mono font-medium text-primary">
              {role.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {activeProfile.subtitle}
          </p>
        </div>
      </div>

      {/* KPI Cards Row */}
      {isHrManager ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-3.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium uppercase font-mono tracking-wider">Total Headcount</span>
              <Users className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold font-mono tracking-tight text-foreground">{displayHr.headcount}</div>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5 flex items-center gap-1">
                Active employee records
              </p>
            </div>
          </Card>

          <Card className="p-3.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium uppercase font-mono tracking-wider">Attendance Rate</span>
              <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold font-mono tracking-tight text-emerald-500">{displayHr.attendanceRate}%</div>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">Rolling 30-day average</p>
            </div>
          </Card>

          <Card className="p-3.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium uppercase font-mono tracking-wider">Pending Leave</span>
              <Clock className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold font-mono tracking-tight text-amber-500">{displayHr.pendingLeave} Requests</div>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">Awaiting manager decision</p>
            </div>
          </Card>

          <Card className="p-3.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium uppercase font-mono tracking-wider">Approved Leave</span>
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold font-mono tracking-tight text-foreground">{displayHr.approvedLeave} Days</div>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">Current month cycle</p>
            </div>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-3.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium uppercase font-mono tracking-wider">Total Net Paid</span>
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold font-mono tracking-tight text-foreground">
                ${displayPayroll.totalNetPaid.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">Disbursed for {period}</p>
            </div>
          </Card>

          <Card className="p-3.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium uppercase font-mono tracking-wider">Payslips Batch</span>
              <Users className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold font-mono tracking-tight text-foreground">{displayPayroll.payslipsGenerated}</div>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">Generated payslips</p>
            </div>
          </Card>

          <Card className="p-3.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium uppercase font-mono tracking-wider">Average Net</span>
              <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold font-mono tracking-tight text-foreground">
                ${displayPayroll.averageNet.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">Per employee/period</p>
            </div>
          </Card>

          <Card className="p-3.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium uppercase font-mono tracking-wider">Approved Leave</span>
              <Calendar className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold font-mono tracking-tight text-foreground">{displayPayroll.approvedLeave} Days</div>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">Current cycle</p>
            </div>
          </Card>
        </div>
      )}

      {/* Filter Row for Payroll & Executive */}
      {!isHrManager && (
        <div className="p-2 rounded-lg border border-border bg-card flex items-center gap-3">
          <label className="text-[11px] font-mono text-muted-foreground" htmlFor="dashboard-period">Period</label>
          <input
            id="dashboard-period"
            type="month"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className="h-7 rounded-md border border-input bg-background px-2 text-xs font-mono"
          />
          <label className="text-[11px] font-mono text-muted-foreground" htmlFor="dashboard-department">Department</label>
          <select
            id="dashboard-department"
            value={departmentId}
            onChange={(event) => setDepartmentId(event.target.value)}
            className="h-7 rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="">All departments</option>
            {displayPayroll.departments.map((department) => (
              <option key={department.id} value={department.id}>{department.name}</option>
            ))}
          </select>
          {departmentId && (
            <button
              onClick={() => setDepartmentId("")}
              className="text-[10px] text-muted-foreground hover:text-foreground underline font-mono"
            >
              Reset Filter
            </button>
          )}
        </div>
      )}

      {/* Chart Card */}
      <Card className="p-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <CardTitle className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">
              {isHrManager ? "Department Headcount Distribution" : "Department Salary Expenditure"}
            </CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isHrManager ? "Active employees by division" : "Disbursed salary by division"}
            </p>
          </div>
        </div>

        <div className="h-[240px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={isHrManager ? displayHr.departments : displayPayroll.salaryByDepartment}>
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => (isHrManager ? `${value}` : `$${value >= 1000 ? `${Math.round(value / 1000)}k` : value}`)}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted)/0.5)" }}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderRadius: "var(--radius)",
                  border: "1px solid hsl(var(--border))",
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  padding: "6px 10px",
                }}
                formatter={(value: number) => [
                  isHrManager ? `${value} Employees` : `$${value.toLocaleString()}`,
                  isHrManager ? "Headcount" : "Total Cost",
                ]}
              />
              <Bar
                dataKey="total"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Alerts Card */}
      {!isHrManager && (
        <Card className="p-4">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">Payroll Alerts & Compliance</CardTitle>
            <CardDescription className="text-[11px]">Operational items requiring review for the current cycle.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="rounded-md border border-border p-2.5 text-xs flex items-center justify-between">
              <div>
                <span className="font-mono font-semibold text-foreground">{displayPayroll.alerts.missingBankDetails}</span>
                <span className="ml-1.5 text-muted-foreground">missing bank details</span>
              </div>
              {displayPayroll.alerts.missingBankDetails === 0 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              )}
            </div>
            <div className="rounded-md border border-border p-2.5 text-xs flex items-center justify-between">
              <div>
                <span className="font-mono font-semibold text-foreground">{displayPayroll.alerts.attendanceExceptions}</span>
                <span className="ml-1.5 text-muted-foreground">attendance exceptions</span>
              </div>
              <Clock className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="rounded-md border border-border p-2.5 text-xs flex items-center justify-between">
              <div>
                <span className="font-mono font-semibold text-foreground">{displayPayroll.alerts.pendingApprovals}</span>
                <span className="ml-1.5 text-muted-foreground">pending leave approvals</span>
              </div>
              <Calendar className="w-3.5 h-3.5 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
