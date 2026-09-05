import Link from "next/link";

const navItems = [
  ["Dashboard", "/dashboard"],
  ["Employees", "/employees"],
  ["Contracts", "/contracts"],
  ["Attendance", "/attendance"],
  ["Time Off", "/time-off/requests"],
  ["Payroll", "/payroll/payruns"]
] as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white p-5 md:block">
        <h1 className="text-lg font-semibold text-slate-950">PeoplePay360</h1>
        <nav className="mt-8 grid gap-1">
          {navItems.map(([label, href]) => (
            <Link className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100" href={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="md:pl-64">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </section>
    </main>
  );
}
