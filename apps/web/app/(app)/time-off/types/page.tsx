"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { TimeOffTypeForm, type TimeOffTypeFormValues } from "@/components/time-off-type-form";
import { Sparkles, Trash2, Loader2 } from "lucide-react";
import { getTimeOffTypesAction } from "@/lib/api-actions";

interface LeaveTypeItem {
  id: string;
  name: string;
  unit: string;
  requiresApproval: boolean;
  isPaid: boolean;
}

export default function TimeOffTypesPage() {
  const { toast } = useToast();
  const [types, setTypes] = useState<LeaveTypeItem[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { getTimeOffTypesAction().then((rows) => setTypes(rows.map((row) => ({ id: row.id, name: row.name, unit: row.unit === "DAYS" ? "Days" : "Hours", requiresApproval: row.approvalRequired, isPaid: row.paid })))); }, []);

  const handleCreated = (data: TimeOffTypeFormValues) => {
    const newType: LeaveTypeItem = {
      id: `TYP-${String(types.length + 1).padStart(3, "0")}`,
      name: data.name,
      unit: data.unit === "DAYS" ? "Days" : "Hours",
      requiresApproval: data.requiresApproval,
      isPaid: data.isPaid,
    };
    setTypes([...types, newType]);
  };

  const handleDelete = async (id: string, name: string) => {
    setDeletingId(id);
    await new Promise((r) => setTimeout(r, 450));
    setTypes((prev) => prev.filter((t) => t.id !== id));
    setDeletingId(null);
    toast({
      title: "Leave Policy Removed",
      description: `Policy ${name} (${id}) has been removed.`,
      type: "info",
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-primary" />
            <h1 className="text-base font-semibold tracking-tight text-foreground">Time Off Types</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Configure leave categories, approval workflows, unit tracking, and compensation settings.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
        {/* Table */}
        <div className="md:col-span-2 rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Policy Name</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Approval Workflow</TableHead>
                <TableHead className="text-right">Compensation</TableHead>
                <TableHead className="w-[50px] text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {types.map((type) => {
                const isDeleting = deletingId === type.id;

                return (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium text-xs">{type.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{type.unit}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {type.requiresApproval ? "Approval Required" : "Auto-Approved"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={type.isPaid ? "success" : "secondary"} className="text-[10px] font-mono">
                        {type.isPaid ? "Paid Leave" : "Unpaid"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right p-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(type.id, type.name)}
                        disabled={isDeleting}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3 h-3 animate-spin text-destructive" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Form Card */}
        <div>
          <Card>
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">
                Create Leave Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <TimeOffTypeForm onSuccess={handleCreated} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
