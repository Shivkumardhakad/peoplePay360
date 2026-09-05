import { UserRound } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { hrApiFetch } from "@/lib/hr-api";
import { formatDate, humanizeStatus, statusTone } from "../self-service-utils";

type Profile = {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  hireDate: string;
  status: string;
  department: { name: string } | null;
  jobPosition: { title: string } | null;
  contracts: Array<{
    id: string;
    title: string;
    startDate: string;
    endDate: string | null;
    status: string;
    employmentType: string;
    weeklyHours: string;
    workingSchedule: { name: string; weeklyHours: string } | null;
  }>;
};

export default async function MyProfilePage() {
  const profile = await hrApiFetch<Profile>("/me/profile");
  const activeContract = profile.contracts.find((contract) => contract.status === "ACTIVE") ?? profile.contracts[0];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <UserRound className="h-5 w-5 text-accent" />
          <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">Read-only employee details from HR records.</p>
      </div>

      <div className="pp-solid-surface overflow-hidden">
        <Table>
          <TableBody>
            <TableRow className="border-b-[0.5px] border-border">
              <TableCell className="w-56 bg-muted/20 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employee</TableCell>
              <TableCell className="font-medium">{profile.firstName} {profile.lastName}</TableCell>
            </TableRow>
            <TableRow className="border-b-[0.5px] border-border">
              <TableCell className="bg-muted/20 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employee No.</TableCell>
              <TableCell className="font-mono text-xs">{profile.employeeNumber}</TableCell>
            </TableRow>
            <TableRow className="border-b-[0.5px] border-border">
              <TableCell className="bg-muted/20 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</TableCell>
              <TableCell className="font-mono text-xs">{profile.email}</TableCell>
            </TableRow>
            <TableRow className="border-b-[0.5px] border-border">
              <TableCell className="bg-muted/20 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</TableCell>
              <TableCell>{profile.phone ?? "-"}</TableCell>
            </TableRow>
            <TableRow className="border-b-[0.5px] border-border">
              <TableCell className="bg-muted/20 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Department</TableCell>
              <TableCell>{profile.department?.name ?? "-"}</TableCell>
            </TableRow>
            <TableRow className="border-b-[0.5px] border-border">
              <TableCell className="bg-muted/20 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Position</TableCell>
              <TableCell>{profile.jobPosition?.title ?? "-"}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="bg-muted/20 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableCell>
              <TableCell><StatusBadge tone={statusTone(profile.status)} label={humanizeStatus(profile.status)} /></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="pp-solid-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b-[0.5px] border-border bg-muted/20 hover:bg-muted/20">
              <TableHead>Current Contract</TableHead>
              <TableHead>Employment Type</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead className="text-right">Weekly Hours</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeContract ? (
              <TableRow className="border-b-[0.5px] border-border hover:bg-muted/30">
                <TableCell className="font-medium">{activeContract.title}</TableCell>
                <TableCell>{humanizeStatus(activeContract.employmentType)}</TableCell>
                <TableCell>{activeContract.workingSchedule?.name ?? "Contract default"}</TableCell>
                <TableCell className="text-right font-mono text-xs">{activeContract.workingSchedule?.weeklyHours ?? activeContract.weeklyHours}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{formatDate(activeContract.startDate)} - {formatDate(activeContract.endDate)}</TableCell>
                <TableCell><StatusBadge tone={statusTone(activeContract.status)} label={humanizeStatus(activeContract.status)} /></TableCell>
              </TableRow>
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">No contract found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
