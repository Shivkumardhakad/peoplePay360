import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AppSidebar, type Session } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { SessionProvider } from "@/components/session-provider";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const activeSession: Session = {
    user: {
      id: session.user.id,
      name: session.user.name || "User",
      role: session.user.role as Session["user"]["role"],
      employeeId: session.user.employeeId || null,
    },
  };

  return (
    <SessionProvider session={session}>
      <div className="flex min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
        <AppSidebar session={activeSession} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
          <AppTopbar session={activeSession} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 max-w-[1400px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
