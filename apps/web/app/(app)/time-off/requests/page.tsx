"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { updateLeaveRequestStatusAction, createTimeOffRequestAction, getTimeOffRequestsAction, getTimeOffTypesAction } from "@/lib/api-actions";
import { Search, CheckCircle, XCircle, Plus, Loader2 } from "lucide-react";

interface LeaveRequestItem {
  id: string;
  employeeId: string;
  employee: string;
  type: string;
  dates: string;
  duration: string;
  status: "Pending" | "Approved" | "Rejected";
}

import { TablePagination } from "@/components/ui/table-pagination";

export default function TimeOffRequestsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [requests, setRequests] = useState<LeaveRequestItem[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<Array<{ id: string; name: string; unit: string }>>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form State
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const reloadRequests = async () => setRequests(await getTimeOffRequestsAction() as LeaveRequestItem[]);

  useEffect(() => {
    void Promise.all([getTimeOffRequestsAction(), getTimeOffTypesAction()]).then(([rows, types]) => {
      setRequests(rows as LeaveRequestItem[]);
      const activeTypes = types.filter((type) => type.status === "ACTIVE").map((type) => ({ id: type.id, name: type.name, unit: type.unit }));
      setLeaveTypes(activeTypes);
      setLeaveType(activeTypes[0]?.id ?? "");
    });
  }, []);

  const role = session?.user?.role || "ADMIN";
  const isEmployee = role === "EMPLOYEE";
  const canApprove =
    role === "ADMIN" ||
    role === "HR_MANAGER" ||
    role === "HR_PAYROLL_MANAGER" ||
    role === "PAYROLL_MANAGER" ||
    role === "HR_PAYROLL_USER";
  const currentUserName = session?.user?.name || "";

  const handleDecision = async (id: string, decision: "Approved" | "Rejected") => {
    const actionKey = `${id}-${decision.toLowerCase()}`;
    setActionLoading(actionKey);

    try {
      const result = await updateLeaveRequestStatusAction(id, decision === "Approved" ? "APPROVED" : "REJECTED", session?.user?.id);
      if (!result.success) throw new Error(result.error);
      await reloadRequests();
      toast({
        title: `Leave ${decision}`,
        description: `Request ${id} updated to ${decision.toLowerCase()}.`,
        type: decision === "Approved" ? "success" : "info",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingRequest(true);
    const empId = session?.user?.employeeId;
    if (!empId || !leaveType || !startDate || !endDate) {
      toast({ title: "Incomplete request", description: "Select a leave type and valid dates first.", type: "error" });
      setSubmittingRequest(false);
      return;
    }

    try {
      const result = await createTimeOffRequestAction({
        employeeId: empId,
        leaveTypeId: leaveType,
        startDate,
        endDate,
        reason,
      });
      if (!result.success) throw new Error(result.error);
      await reloadRequests();
      toast({
        title: "Application Submitted",
        description: "Your leave request is queued for manager review.",
        type: "success",
      });
      setDialogOpen(false);
    } catch (error) {
      toast({ title: "Unable to submit request", description: error instanceof Error ? error.message : "Database request failed.", type: "error" });
    } finally {
      setSubmittingRequest(false);
    }
  };

  // RBAC Scoping: Employees see ONLY their own requests. Managers see all requests.
  const scopedRequests = isEmployee
    ? requests.filter((r) => r.employeeId === session?.user?.employeeId)
    : requests;

  const filteredRequests = scopedRequests.filter(
    (r) =>
      r.employee.toLowerCase().includes(search.toLowerCase()) ||
      r.type.toLowerCase().includes(search.toLowerCase()) ||
      r.status.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredRequests.length / pageSize);
  const paginatedRequests = filteredRequests.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold tracking-tight text-foreground">
            {isEmployee ? "My Leave Requests" : "Time Off Requests"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isEmployee
              ? "Submit, view status, and track your personal leave requests."
              : "Review, approve, or submit employee leave applications."}
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 h-8">
              <Plus className="w-3.5 h-3.5" />
              Apply for Leave
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Request Time Off</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateRequest} className="space-y-3 pt-1">
              <div className="space-y-1">
                <Label htmlFor="type" className="text-xs font-medium">Leave Policy</Label>
                <select
                  id="type"
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="flex h-8 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {leaveTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="start" className="text-xs font-medium">Start Date</Label>
                  <Input
                    id="start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="font-mono text-xs h-8"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="end" className="text-xs font-medium">End Date</Label>
                  <Input
                    id="end"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="font-mono text-xs h-8"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="reason" className="text-xs font-medium">Reason / Remarks</Label>
                <Input
                  id="reason"
                  placeholder="Personal, travel, medical, etc."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="text-xs h-8"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={submittingRequest}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submittingRequest} className="gap-1.5">
                  {submittingRequest && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {submittingRequest ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Toolbar */}
      <div className="p-2 rounded-lg border border-border bg-card flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Filter requests..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8 h-7 text-xs"
          />
        </div>
        <span className="text-[11px] font-mono text-muted-foreground">
          {filteredRequests.length} requests
        </span>
      </div>

      {/* Table */}
      <div className="space-y-3">
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Policy</TableHead>
                <TableHead>Date Range</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Decision</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-20 text-center text-xs text-muted-foreground">
                    No leave requests found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRequests.map((req) => {
                  const isApproving = actionLoading === `${req.id}-approved`;
                  const isRejecting = actionLoading === `${req.id}-rejected`;
                  const isRowLoading = isApproving || isRejecting;
                  const isSelf = req.employee.toLowerCase() === currentUserName.toLowerCase();
                  const canApproveThis = canApprove && (role === "ADMIN" || !isSelf);

                  return (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium text-xs">
                        {req.employee}
                        {isSelf && (
                          <span className="ml-1.5 text-[10px] font-mono text-muted-foreground bg-muted px-1 py-0.2 rounded">
                            (You)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{req.type}</TableCell>
                      <TableCell className="font-mono text-[11px] text-muted-foreground">{req.dates}</TableCell>
                      <TableCell className="font-mono text-[11px] font-medium">{req.duration}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            req.status === "Approved"
                              ? "success"
                              : req.status === "Rejected"
                              ? "destructive"
                              : "warning"
                          }
                          className="text-[10px] font-mono"
                        >
                          {req.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {req.status === "Pending" ? (
                          isSelf && role !== "ADMIN" ? (
                            <span className="text-[10px] text-amber-600 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              Awaiting Admin
                            </span>
                          ) : canApproveThis ? (
                            <div className="flex justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDecision(req.id, "Rejected")}
                                disabled={isRowLoading}
                                className="h-6 px-2 text-[11px] text-destructive border-destructive/20 hover:bg-destructive/10"
                              >
                                {isRejecting ? (
                                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                ) : (
                                  <XCircle className="w-3 h-3 mr-1" />
                                )}
                                {isRejecting ? "Rejecting..." : "Reject"}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleDecision(req.id, "Approved")}
                                disabled={isRowLoading}
                                className="h-6 px-2 text-[11px] bg-emerald-600 text-white hover:bg-emerald-700"
                              >
                                {isApproving ? (
                                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                ) : (
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                )}
                                {isApproving ? "Approving..." : "Approve"}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground font-mono">Pending Review</span>
                          )
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {req.status === "Approved" ? "Approved" : "Rejected"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredRequests.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );
}

