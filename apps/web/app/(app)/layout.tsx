import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AppSidebar, MOCK_SESSION, type Session } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  const activeSession: Session = session?.user
    ? {
        user: {
          id: session.user.id || "1",
          name: session.user.name || "User",
          role: (session.user.role as Session["user"]["role"]) || "ADMIN",
          employeeId: session.user.employeeId || null,
        },
      }
    : MOCK_SESSION;

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <AppSidebar session={activeSession} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
        <AppTopbar session={activeSession} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
