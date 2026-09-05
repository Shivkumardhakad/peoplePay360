"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { SalaryStructureForm, type SalaryStructureFormValues } from "@/components/salary-structure-form";
import { Layers, CheckCircle2, Archive, Loader2 } from "lucide-react";

interface StructureItem {
  id: string;
  name: string;
  ruleCount: number;
  status: "Active" | "Draft" | "Archived";
}

const INITIAL_STRUCTURES: StructureItem[] = [
  { id: "STR-001", name: "Standard Tech Package", ruleCount: 15, status: "Active" },
  { id: "STR-002", name: "Executive Leadership Package", ruleCount: 8, status: "Active" },
  { id: "STR-003", name: "Intern & Trainee Stipend", ruleCount: 3, status: "Draft" },
];

export default function SalaryStructuresPage() {
  const { toast } = useToast();
  const [structures, setStructures] = useState<StructureItem[]>(INITIAL_STRUCTURES);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleCreated = (data: SalaryStructureFormValues) => {
    const newStruct: StructureItem = {
      id: `STR-${String(structures.length + 1).padStart(3, "0")}`,
      name: data.name,
      ruleCount: 5,
      status: data.status === "ACTIVE" ? "Active" : data.status === "DRAFT" ? "Draft" : "Archived",
    };
    setStructures([...structures, newStruct]);
  };

  const handleToggleStatus = async (id: string) => {
    setTogglingId(id);
    await new Promise((r) => setTimeout(r, 400));
    setStructures((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: s.status === "Active" ? "Archived" : "Active" } : s
      )
    );
    setTogglingId(null);
    toast({
      title: "Structure Status Updated",
      description: `Structure ${id} updated.`,
      type: "success",
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-primary" />
            <h1 className="text-base font-semibold tracking-tight text-foreground">Salary Structures</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Reusable containers for ordered salary rules linked to employment contracts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
        {/* Table */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Ref ID</TableHead>
                <TableHead>Structure Name</TableHead>
                <TableHead className="text-right">Rules</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="w-[80px] text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {structures.map((structure) => {
                const isToggling = togglingId === structure.id;

                return (
                  <TableRow key={structure.id}>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">{structure.id}</TableCell>
                    <TableCell className="font-medium text-xs">{structure.name}</TableCell>
                    <TableCell className="font-mono text-right text-xs text-muted-foreground">
                      {structure.ruleCount} rules
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          structure.status === "Active"
                            ? "success"
                            : structure.status === "Draft"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-[10px] font-mono"
                      >
                        {structure.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right p-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(structure.id)}
                        disabled={isToggling}
                        className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                      >
                        {isToggling ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : structure.status === "Active" ? (
                          <Archive className="w-3 h-3" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        )}
                        <span>{isToggling ? "Updating..." : structure.status === "Active" ? "Archive" : "Activate"}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Form */}
        <div>
          <Card>
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">
                New Salary Structure
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <SalaryStructureForm onSuccess={handleCreated} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
