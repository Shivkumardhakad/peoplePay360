"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

const data = [
  { name: "Engineering", total: 185000 },
  { name: "HR", total: 45000 },
  { name: "Finance", total: 65000 },
  { name: "Sales", total: 110000 },
  { name: "Marketing", total: 55000 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Executive ledger summary and departmental payroll breakdown.</p>
      </div>

      {/* KPI Row: Cards are glass per Section 4 item 10 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Single most important figure gets the gold accent */}
        <Card className="pp-glass border-accent shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Net Salary Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-accent">$460,000.00</div>
            <p className="text-xs text-muted-foreground font-mono mt-1">October 2023 Batch</p>
          </CardContent>
        </Card>

        <Card className="pp-glass shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payslips Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">124</div>
            <p className="text-xs text-muted-foreground font-mono mt-1">+4 from prior period</p>
          </CardContent>
        </Card>

        <Card className="pp-glass shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Average Net Salary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">$3,709.67</div>
            <p className="text-xs text-muted-foreground font-mono mt-1">Per employee/month</p>
          </CardContent>
        </Card>

        <Card className="pp-glass shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Approved Time Off</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">45 Days</div>
            <p className="text-xs text-muted-foreground font-mono mt-1">Total approved days</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart container is solid-surface per Section 4 item 10 */}
      <Card className="pp-solid-surface overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/20 pb-4">
          <CardTitle className="text-base font-semibold">Salary Cost by Department</CardTitle>
        </CardHeader>
        <CardContent className="pl-2 pt-6">
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted)/0.15)' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderRadius: 'var(--radius)',
                    border: '1px solid hsl(var(--border))',
                    fontFamily: 'var(--font-mono)'
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total Cost']}
                />
                <Bar 
                  dataKey="total" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
