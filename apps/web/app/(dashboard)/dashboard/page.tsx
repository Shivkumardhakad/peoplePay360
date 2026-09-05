import Link from "next/link";
import { ArrowUpRight, BarChart3, CalendarClock, CheckCircle2, ChevronRight, CreditCard, MoreHorizontal, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const metrics = [
  ["Total employees", "248", "+12 this month", Users, "bg-teal-50 text-teal-700"],
  ["Monthly payroll", "₹42.8L", "+4.6% vs last month", CreditCard, "bg-violet-50 text-violet-700"],
  ["Attendance rate", "96.4%", "+1.2% this month", CalendarClock, "bg-amber-50 text-amber-700"],
  ["Open exceptions", "07", "Needs attention", BarChart3, "bg-rose-50 text-rose-700"]
] as const;

export default function DashboardPage() {
  return (
    <div className="grid gap-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-teal-700">Monday, 5 September 2026</p>
          <h2 className="mt-2 text-[30px] font-semibold tracking-tight text-slate-950">Good morning, Ananya <span aria-hidden>👋</span></h2>
          <p className="mt-1 text-sm text-slate-500">Here’s what’s happening across your people operations.</p>
        </div>
        <Button className="rounded-lg bg-slate-900 px-4 text-sm shadow-sm hover:bg-slate-700">+ New payrun</Button>
      </header>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value, note, Icon, color]) => (
          <article className="rounded-2xl border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.03)]" key={label}>
            <div className="flex items-start justify-between"><span className={`grid size-10 place-items-center rounded-xl ${color}`}><Icon className="size-[19px]" /></span><MoreHorizontal className="size-5 text-slate-300" /></div>
            <p className="mt-5 text-xs font-medium text-slate-500">{label}</p><strong className="mt-1 block text-[26px] tracking-tight text-slate-900">{value}</strong>
            <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-400"><TrendingUp className="size-3 text-teal-600" />{note}</p>
          </article>
        ))}
      </section>
      <section className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
        <article className="rounded-2xl border bg-white p-6"><div className="flex items-center justify-between"><div><h3 className="font-semibold text-slate-900">Payroll overview</h3><p className="mt-1 text-xs text-slate-400">Total payroll cost · Jan–Sep 2026</p></div><button className="text-xs font-semibold text-teal-700">View report <ArrowUpRight className="ml-1 inline size-3" /></button></div><div className="mt-7 flex h-44 items-end gap-3 border-b border-slate-100 px-2">{[38,52,45,66,57,78,71,89,82].map((height, i) => <div className="group flex flex-1 flex-col items-center gap-2" key={i}><div className={`w-full max-w-10 rounded-t-md ${i === 8 ? "bg-teal-600" : "bg-teal-100 group-hover:bg-teal-200"}`} style={{height: `${height}%`}} /><span className="text-[10px] text-slate-400">{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep"][i]}</span></div>)}</div></article>
        <article className="rounded-2xl border bg-white p-6"><div className="flex items-center justify-between"><div><h3 className="font-semibold text-slate-900">Pending actions</h3><p className="mt-1 text-xs text-slate-400">Items that need your attention</p></div><span className="grid size-8 place-items-center rounded-full bg-rose-50 text-xs font-bold text-rose-600">7</span></div><div className="mt-5 grid gap-3">{[["Attendance exceptions","7 records need review","/attendance","bg-amber-50 text-amber-700",CalendarClock],["Leave approvals","3 requests pending","/time-off/requests","bg-violet-50 text-violet-700",CalendarClock],["Payroll validation","September payrun ready","/payroll/payruns","bg-teal-50 text-teal-700",CheckCircle2]].map(([title, sub, href, color, Icon]) => <Link href={href as string} key={title as string} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 hover:bg-slate-50"><span className={`grid size-9 place-items-center rounded-lg ${color}`}><Icon className="size-4" /></span><span className="flex-1"><strong className="block text-xs font-semibold text-slate-700">{title}</strong><small className="text-[11px] text-slate-400">{sub}</small></span><ChevronRight className="size-4 text-slate-300" /></Link>)}</div></article>
      </section>
      <section className="rounded-2xl border bg-white p-6"><div className="flex items-center justify-between"><div><h3 className="font-semibold text-slate-900">Recent payroll activity</h3><p className="mt-1 text-xs text-slate-400">Latest updates from your payroll workspace</p></div><Link href="/payroll/payruns" className="text-xs font-semibold text-teal-700">View all <ArrowUpRight className="ml-1 inline size-3" /></Link></div><div className="mt-5 grid gap-4 md:grid-cols-3"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-400">September 2026</p><strong className="mt-1 block text-sm text-slate-800">Monthly payroll</strong><span className="mt-3 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold text-amber-700">In review</span></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-400">28 August 2026</p><strong className="mt-1 block text-sm text-slate-800">August payroll</strong><span className="mt-3 inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">Paid · ₹41.2L</span></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-400">31 July 2026</p><strong className="mt-1 block text-sm text-slate-800">July payroll</strong><span className="mt-3 inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">Paid · ₹40.6L</span></div></div></section>
    </div>
  );
}
