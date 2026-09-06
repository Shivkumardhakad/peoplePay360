"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, humanizeStatus, statusTone } from "../self-service-utils";

type TimeOffType = {
  id: string;
  name: string;
  unit: string;
};

type Allocation = {
  id: string;
  allocated: string;
  consumed: string;
  remaining: string | null;
  periodStart: string;
  periodEnd: string;
  timeOffType: TimeOffType;
};

type TimeOffRequest = {
  id: string;
  startDate: string;
  endDate: string;
  quantity: string;
  status: string;
  reason: string | null;
  timeOffType: TimeOffType;
};

export function TimeOffTablesClient({ allocations, requests }: { allocations: Allocation[]; requests: TimeOffRequest[] }) {
  const [allocPage, setAllocPage] = useState(1);
  const [allocPageSize, setAllocPageSize] = useState(10);
  const [reqPage, setReqPage] = useState(1);
  const [reqPageSize, setReqPageSize] = useState(10);

  const paginatedAllocations = allocations.slice((allocPage - 1) * allocPageSize, allocPage * allocPageSize);
  const paginatedRequests = requests.slice((reqPage - 1) * reqPageSize, reqPage * reqPageSize);

  return (
    <div className="space-y-6">
      <div className="pp-solid-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b-[0.5px] border-border bg-muted/20 hover:bg-muted/20">
              <TableHead>Leave Type</TableHead>
              <TableHead className="text-right">Allocated</TableHead>
              <TableHead className="text-right">Taken</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
              <TableHead>Validity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedAllocations.map((allocation) => (
              <TableRow key={allocation.id} className="border-b-[0.5px] border-border hover:bg-muted/30">
                <TableCell className="font-medium">{allocation.timeOffType.name}</TableCell>
                <TableCell className="text-right font-mono text-xs">{allocation.allocated}</TableCell>
                <TableCell className="text-right font-mono text-xs">{allocation.consumed}</TableCell>
                <TableCell className="text-right font-mono text-xs font-semibold">{allocation.remaining ?? allocation.allocated}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{formatDate(allocation.periodStart)} - {formatDate(allocation.periodEnd)}</TableCell>
              </TableRow>
            ))}
            {allocations.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-20 text-center text-xs text-muted-foreground">
                  No leave allocations found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="p-2 border-t border-border">
          <TablePagination
            currentPage={allocPage}
            totalItems={allocations.length}
            pageSize={allocPageSize}
            onPageChange={setAllocPage}
            onPageSizeChange={(size) => {
              setAllocPageSize(size);
              setAllocPage(1);
            }}
          />
        </div>
      </div>

      <div className="pp-solid-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b-[0.5px] border-border bg-muted/20 hover:bg-muted/20">
              <TableHead>Request</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead className="text-right">Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRequests.map((request) => (
              <TableRow key={request.id} className="border-b-[0.5px] border-border hover:bg-muted/30">
                <TableCell className="font-medium">{request.timeOffType.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{formatDate(request.startDate)} - {formatDate(request.endDate)}</TableCell>
                <TableCell className="text-right font-mono text-xs">{request.quantity} {request.timeOffType.unit.toLowerCase()}</TableCell>
                <TableCell>
                  <StatusBadge tone={statusTone(request.status)} label={request.status === "REJECTED" ? "Refused" : humanizeStatus(request.status)} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{request.reason || "-"}</TableCell>
              </TableRow>
            ))}
            {requests.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-20 text-center text-xs text-muted-foreground">
                  No time off requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="p-2 border-t border-border">
          <TablePagination
            currentPage={reqPage}
            totalItems={requests.length}
            pageSize={reqPageSize}
            onPageChange={setReqPage}
            onPageSizeChange={(size) => {
              setReqPageSize(size);
              setReqPage(1);
            }}
          />
        </div>
      </div>
    </div>
  );
}
