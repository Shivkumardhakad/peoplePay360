import { AppSidebar, MOCK_SESSION } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar session={MOCK_SESSION} />
      <main className="flex-1 overflow-y-auto">
        <AppTopbar session={MOCK_SESSION} />
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
