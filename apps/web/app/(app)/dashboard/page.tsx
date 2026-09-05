"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { TrendingUp, Users, Calendar, DollarSign, UserCheck, Clock } from "lucide-react";
import { getHrDashboardAction } from "@/lib/api-actions";

const payrollDepartmentData = [
  { name: "Eng", total: 185000 },
  { name: "HR", total: 45000 },
  { name: "Finance", total: 65000 },
  { name: "Sales", total: 110000 },
  { name: "Design", total: 55000 },
];

const hrDepartmentData = [
  { name: "Eng", total: 52 },
  { name: "HR", total: 8 },
  { name: "Finance", total: 14 },
  { name: "Sales", total: 32 },
  { name: "Design", total: 18 },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const role = session?.user?.role || "ADMIN";
  const isHrManager = role === "HR_MANAGER";
  const [hrData, setHrData] = useState({ headcount: 0, attendanceRate: 0, pendingLeave: 0, approvedLeave: 0, departments: [] as { name: string; total: number }[] });
  useEffect(() => { if (isHrManager) getHrDashboardAction().then(setHrData); }, [isHrManager]);

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
                <span className="text-emerald-600 font-medium">+6</span> new hires this quarter
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
              <div className="text-xl font-bold font-mono tracking-tight text-foreground">$460,000.00</div>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5 flex items-center gap-1">
                <span className="text-emerald-600 font-medium">+4.2%</span> from prior batch
              </p>
            </div>
          </Card>

          <Card className="p-3.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium uppercase font-mono tracking-wider">Payslips Batch</span>
              <Users className="w-3.5 h-3.5" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold font-mono tracking-tight text-foreground">124</div>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">All verified active employees</p>
            </div>
          </Card>

          <Card className="p-3.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium uppercase font-mono tracking-wider">Average Net</span>
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold font-mono tracking-tight text-foreground">$3,709.67</div>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">Per employee/period</p>
            </div>
          </Card>

          <Card className="p-3.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium uppercase font-mono tracking-wider">Approved Leave</span>
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold font-mono tracking-tight text-foreground">45 Days</div>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">Current month cycle</p>
            </div>
          </Card>
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
            <BarChart data={isHrManager ? hrData.departments : payrollDepartmentData}>
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
    </div>
  );
}
