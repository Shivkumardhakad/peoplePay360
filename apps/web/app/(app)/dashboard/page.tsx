"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { ArrowUpRight, TrendingUp, Users, Calendar, DollarSign } from "lucide-react";

const departmentData = [
  { name: "Eng", total: 185000 },
  { name: "HR", total: 45000 },
  { name: "Finance", total: 65000 },
  { name: "Sales", total: 110000 },
  { name: "Design", total: 55000 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold tracking-tight text-foreground">Overview</h1>
          <p className="text-xs text-muted-foreground">Executive summary and departmental payroll analytics.</p>
        </div>
      </div>

      {/* KPI Cards Row */}
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

      {/* Chart Card */}
      <Card className="p-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <CardTitle className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">
              Department Salary Expenditure
            </CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">Disbursed salary by division</p>
          </div>
        </div>

        <div className="h-[240px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={departmentData}>
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
                tickFormatter={(value) => `$${value / 1000}k`}
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
                formatter={(value: number) => [`$${value.toLocaleString()}`, "Total Cost"]}
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
