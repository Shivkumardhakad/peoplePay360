"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { TrendingUp, Users, Calendar, DollarSign, UserCheck, Clock } from "lucide-react";
import { getHrDashboardAction, getPayrollDashboardAction } from "@/lib/api-actions";

export default function DashboardPage() {
  const { data: session } = useSession();
  const role = session?.user?.role || "ADMIN";
  const isHrManager = role === "HR_MANAGER";
  const [hrData, setHrData] = useState({ headcount: 0, attendanceRate: 0, pendingLeave: 0, approvedLeave: 0, departments: [] as { name: string; total: number }[] });
  const [payrollData, setPayrollData] = useState({ totalNetPaid: 0, payslipsGenerated: 0, averageNet: 0, approvedLeave: 0, salaryByDepartment: [] as { name: string; total: number }[], departments: [] as { id: string; name: string }[], alerts: { attendanceExceptions: 0, pendingApprovals: 0, missingBankDetails: 0 } });
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [departmentId, setDepartmentId] = useState("");
  useEffect(() => { if (isHrManager) getHrDashboardAction().then(setHrData); }, [isHrManager]);
  useEffect(() => { if (!isHrManager) getPayrollDashboardAction(period, departmentId).then(setPayrollData).catch(() => undefined); }, [departmentId, isHrManager, period]);

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold tracking-tight text-foreground">
            {isHrManager ? "HR Operations Overview" : "Executive Overview"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isHrManager
              ? "Live workforce analytics, presence monitoring, and leave management."
              : "Executive summary and departmental payroll analytics."}
          </p>
        </div>
      </div>

      {/* KPI Cards Row */}
      {isHrManager ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-3.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium uppercase font-mono tracking-wider">Total Headcount</span>
              <Users className="w-3.5 h-3.5" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold font-mono tracking-tight text-foreground">{hrData.headcount}</div>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5 flex items-center gap-1">
                Live active employee records
              </p>
            </div>
          </Card>

          <Card className="p-3.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium uppercase font-mono tracking-wider">Attendance Rate</span>
              <UserCheck className="w-3.5 h-3.5" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold font-mono tracking-tight text-foreground">{hrData.attendanceRate}%</div>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">Rolling 30-day average</p>
            </div>
          </Card>

          <Card className="p-3.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium uppercase font-mono tracking-wider">Pending Leave</span>
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold font-mono tracking-tight text-amber-500">{hrData.pendingLeave} Requests</div>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">Awaiting manager decision</p>
            </div>
          </Card>

          <Card className="p-3.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium uppercase font-mono tracking-wider">Approved Leave</span>
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold font-mono tracking-tight text-foreground">{hrData.approvedLeave} Days</div>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">Current month cycle</p>
            </div>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-3.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium uppercase font-mono tracking-wider">Total Net Paid</span>
              <DollarSign className="w-3.5 h-3.5" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold font-mono tracking-tight text-foreground">${payrollData.totalNetPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">Paid payroll for selected period</p>
            </div>
          </Card>

          <Card className="p-3.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium uppercase font-mono tracking-wider">Payslips Batch</span>
              <Users className="w-3.5 h-3.5" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold font-mono tracking-tight text-foreground">{payrollData.payslipsGenerated}</div>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">Generated payslips</p>
            </div>
          </Card>

          <Card className="p-3.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium uppercase font-mono tracking-wider">Average Net</span>
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold font-mono tracking-tight text-foreground">${payrollData.averageNet.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">Per employee/period</p>
            </div>
          </Card>

          <Card className="p-3.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium uppercase font-mono tracking-wider">Approved Leave</span>
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold font-mono tracking-tight text-foreground">{payrollData.approvedLeave} Days</div>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">Current month cycle</p>
            </div>
          </Card>
        </div>
      )}

      {/* Chart Card */}
      {!isHrManager && (
        <div className="p-2 rounded-lg border border-border bg-card flex items-center gap-3">
          <label className="text-[11px] font-mono text-muted-foreground" htmlFor="dashboard-period">Period</label>
          <input id="dashboard-period" type="month" value={period} onChange={(event) => setPeriod(event.target.value)} className="h-7 rounded-md border border-input bg-background px-2 text-xs font-mono" />
          <label className="text-[11px] font-mono text-muted-foreground" htmlFor="dashboard-department">Department</label>
          <select id="dashboard-department" value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} className="h-7 rounded-md border border-input bg-background px-2 text-xs">
            <option value="">All departments</option>
            {payrollData.departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
          </select>
        </div>
      )}

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
            <BarChart data={isHrManager ? hrData.departments : payrollData.salaryByDepartment}>
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
                tickFormatter={(value) => (isHrManager ? `${value}` : `$${value / 1000}k`)}
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

      {!isHrManager && (
        <Card className="p-4">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">Payroll Alerts</CardTitle>
            <CardDescription className="text-[11px]">Operational items requiring review for the selected period.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="rounded-md border border-border p-2 text-xs"><span className="font-mono font-semibold">{payrollData.alerts.missingBankDetails}</span><span className="ml-1.5 text-muted-foreground">missing bank details</span></div>
            <div className="rounded-md border border-border p-2 text-xs"><span className="font-mono font-semibold">{payrollData.alerts.attendanceExceptions}</span><span className="ml-1.5 text-muted-foreground">attendance exceptions</span></div>
            <div className="rounded-md border border-border p-2 text-xs"><span className="font-mono font-semibold">{payrollData.alerts.pendingApprovals}</span><span className="ml-1.5 text-muted-foreground">pending leave approvals</span></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
