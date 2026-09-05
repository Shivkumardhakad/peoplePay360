export default function EmployeesPage() {
  return <PageShell title="Employees" description="Employee records, employment status, and core HR data." />;
}

function PageShell({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-cyan-800">People operations</p>
      <h2 className="mt-2 text-3xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-3 max-w-2xl text-slate-600">{description}</p>
    </div>
  );
}
