"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatDateTime, formatHours, humanizeStatus, statusTone } from "../self-service-utils";

type Attendance = {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  breakMinutes: number;
  workedMinutes: number;
  status: string;
};

export function AttendanceTableClient({ attendance }: { attendance: Attendance[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const paginatedAttendance = attendance.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="pp-solid-surface overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-b-[0.5px] border-border bg-muted/20 hover:bg-muted/20">
            <TableHead>Date</TableHead>
            <TableHead>Check In</TableHead>
            <TableHead>Check Out</TableHead>
            <TableHead className="text-right">Break</TableHead>
            <TableHead className="text-right">Worked</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedAttendance.map((record) => (
            <TableRow key={record.id} className="border-b-[0.5px] border-border hover:bg-muted/30">
              <TableCell className="font-mono text-xs text-muted-foreground">{formatDate(record.date)}</TableCell>
              <TableCell className="font-mono text-xs">{formatDateTime(record.checkIn)}</TableCell>
              <TableCell className="font-mono text-xs">{formatDateTime(record.checkOut)}</TableCell>
              <TableCell className="text-right font-mono text-xs">{record.breakMinutes}m</TableCell>
              <TableCell className="text-right font-mono text-xs font-semibold">{formatHours(record.workedMinutes)}</TableCell>
              <TableCell className="text-right">
                <StatusBadge tone={statusTone(record.status)} label={humanizeStatus(record.status)} />
              </TableCell>
            </TableRow>
          ))}
          {attendance.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-20 text-center text-xs text-muted-foreground">
                No attendance records found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="p-2 border-t border-border">
        <TablePagination
          currentPage={currentPage}
          totalItems={attendance.length}
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
