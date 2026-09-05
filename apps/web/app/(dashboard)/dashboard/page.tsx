import { BarChart3, CalendarClock, CreditCard, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const metrics = [
  ["Employees", "4", Users],
  ["Open Attendance Exceptions", "0", CalendarClock],
  ["Draft Payruns", "0", CreditCard],
  ["Payroll Warnings", "0", BarChart3]
] as const;

export default function DashboardPage() {
  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-cyan-800">Payroll workspace</p>
          <h2 className="text-3xl font-semibold text-slate-950">Dashboard</h2>
        </div>
        <Button>New payrun</Button>
      </header>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value, Icon]) => (
          <article className="rounded-lg border border-slate-200 bg-white p-4" key={label}>
            <Icon className="mb-4 size-5 text-cyan-800" />
            <p className="text-sm text-slate-600">{label}</p>
            <strong className="text-2xl text-slate-950">{value}</strong>
          </article>
        ))}
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-base font-semibold text-slate-950">Recent payroll activity</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Employees</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>September 2026</TableCell>
              <TableCell>Setup</TableCell>
              <TableCell>4</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
