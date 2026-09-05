import Link from "next/link";
import { Bell, ChevronDown, CircleHelp, LayoutDashboard, Users, FileText, Clock3, CalendarDays, WalletCards, Settings2 } from "lucide-react";

const navItems = [
  ["Dashboard", "/dashboard", LayoutDashboard],
  ["Employees", "/employees", Users],
  ["Contracts", "/contracts", FileText],
  ["Attendance", "/attendance", Clock3],
  ["Time off", "/time-off/requests", CalendarDays],
  ["Payroll", "/payroll/payruns", WalletCards]
] as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f7f9fb]">
      <aside className="fixed inset-y-0 left-0 hidden w-[250px] border-r border-slate-200 bg-white px-4 py-6 md:block">
        <Link href="/dashboard" className="flex items-center gap-3 px-3">
          <span className="grid size-9 place-items-center rounded-xl bg-[#0d9488] text-sm font-bold text-white">P</span>
          <span><strong className="block text-[15px] tracking-tight text-slate-900">PeoplePay<span className="text-[#0d9488]">360</span></strong><small className="text-[10px] font-medium uppercase tracking-[.18em] text-slate-400">HR workspace</small></span>
        </Link>
        <p className="mb-2 mt-10 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Workspace</p>
        <nav className="grid gap-1">
          {navItems.map(([label, href, Icon]) => (
            <Link className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-600 transition hover:bg-teal-50 hover:text-teal-800" href={href} key={href}>
              <Icon className="size-[17px] text-slate-400 group-hover:text-teal-600" />{label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-6 left-4 right-4 border-t border-slate-100 pt-4">
          <Link href="/dashboard" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-slate-600 hover:bg-slate-50"><Settings2 className="size-[17px] text-slate-400" />Settings</Link>
          <div className="mt-5 flex items-center gap-3 px-3"><span className="grid size-8 place-items-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">AS</span><span className="min-w-0 flex-1"><strong className="block truncate text-xs text-slate-800">Ananya Sharma</strong><small className="text-[11px] text-slate-400">HR Manager</small></span><ChevronDown className="size-4 text-slate-400" /></div>
        </div>
      </aside>
      <section className="md:pl-64">
        <header className="flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-6 md:px-10"><div className="text-sm text-slate-500 md:hidden">PeoplePay<span className="text-teal-600">360</span></div><div className="ml-auto flex items-center gap-5"><CircleHelp className="size-[18px] text-slate-400" /><span className="relative"><Bell className="size-[18px] text-slate-400" /><i className="absolute -right-1 -top-1 size-1.5 rounded-full bg-orange-500" /></span><div className="hidden h-6 w-px bg-slate-200 sm:block" /><span className="text-xs font-medium text-slate-600">September 2026</span></div></header>
        <div className="mx-auto max-w-[1360px] px-6 py-8 md:px-10">{children}</div>
      </section>
    </main>
  );
}
