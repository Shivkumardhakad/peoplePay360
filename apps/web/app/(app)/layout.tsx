import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AppSidebar, type Session } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { authOptions } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.role) {
    redirect("/login");
  }

  const appSession: Session = {
    user: {
      id: session.user.id,
      name: session.user.name ?? session.user.email ?? "PeoplePay360 User",
      role: session.user.role,
      employeeId: session.user.employeeId ?? null
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar session={appSession} />
      <main className="flex-1 overflow-y-auto">
        <AppTopbar session={appSession} />
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
