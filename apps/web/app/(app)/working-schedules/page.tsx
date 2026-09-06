"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { Clock3, Edit3, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { deactivateWorkingScheduleAction, getWorkingSchedulesAction, saveWorkingScheduleAction } from "@/lib/api-actions";

const dayOptions = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
type DayCode = typeof dayOptions[number];
type Day = { dayOfWeek: DayCode; startTime: string; endTime: string; breakMinutes: number; isWorkingDay: boolean };
type Schedule = { id: string; name: string; code: string | null; description: string | null; weeklyHours: number; contractCount: number; scheduleDays: Day[] };

const emptyDays = (): Day[] => dayOptions.map((day) => ({ dayOfWeek: day, startTime: day === "SAT" || day === "SUN" ? "" : "09:00", endTime: day === "SAT" || day === "SUN" ? "" : "17:00", breakMinutes: day === "SAT" || day === "SUN" ? 0 : 60, isWorkingDay: day !== "SAT" && day !== "SUN" }));

export default function WorkingSchedulesPage() {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [days, setDays] = useState<Day[]>(emptyDays);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setSchedules(await getWorkingSchedulesAction() as Schedule[]); } catch (error) { toast({ title: "Unable to load schedules", description: error instanceof Error ? error.message : "Request failed", type: "error" }); } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const reset = () => { setEditingId(undefined); setName(""); setCode(""); setDescription(""); setDays(emptyDays()); };
  const edit = (schedule: Schedule) => {
    setEditingId(schedule.id); setName(schedule.name); setCode(schedule.code ?? ""); setDescription(schedule.description ?? "");
    const existing = new Map(schedule.scheduleDays.map((day) => [day.dayOfWeek, day]));
    setDays(dayOptions.map((day) => ({ dayOfWeek: day, startTime: existing.get(day)?.startTime ?? "", endTime: existing.get(day)?.endTime ?? "", breakMinutes: existing.get(day)?.breakMinutes ?? 0, isWorkingDay: existing.get(day)?.isWorkingDay ?? false })));
  };

  const save = async () => {
    setSaving(true);
    try {
      const result = await saveWorkingScheduleAction({ id: editingId, name, code, description, days });
      if (!result.success) throw new Error(result.error);
      toast({ title: editingId ? "Schedule updated" : "Schedule created", description: "Working hours are now available to contracts and attendance.", type: "success" });
      reset(); await load();
    } catch (error) { toast({ title: "Unable to save schedule", description: error instanceof Error ? error.message : "Request failed", type: "error" }); } finally { setSaving(false); }
  };

  const deactivate = async (id: string) => {
    const result = await deactivateWorkingScheduleAction(id);
    if (!result.success) { toast({ title: "Cannot deactivate schedule", description: result.error, type: "error" }); return; }
    toast({ title: "Schedule deactivated", type: "success" }); await load();
  };

  return <div className="space-y-4">
    <div><h1 className="text-base font-semibold">Working Schedules</h1><p className="text-xs text-muted-foreground">Define weekly working days used by contracts, attendance, and payroll context.</p></div>
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Card><CardHeader className="flex flex-row items-center justify-between space-y-0"><CardTitle className="text-sm">Active schedules</CardTitle><Button size="sm" variant="outline" onClick={reset}><Plus className="mr-1.5 h-3.5 w-3.5" />New schedule</Button></CardHeader><CardContent className="space-y-2">
        {loading ? <div className="flex items-center gap-2 py-8 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading schedules...</div> : schedules.length === 0 ? <div className="py-8 text-center text-xs text-muted-foreground">No active schedules found.</div> : schedules.map((schedule) => <div key={schedule.id} className="flex items-center justify-between rounded-md border p-3"><div><div className="flex items-center gap-2 text-sm font-medium"><Clock3 className="h-3.5 w-3.5 text-muted-foreground" />{schedule.name}<Badge variant="secondary" className="text-[10px]">{schedule.code ?? "No code"}</Badge></div><p className="mt-1 text-[11px] text-muted-foreground">{schedule.weeklyHours.toFixed(2)} hours/week · {schedule.contractCount} active contract(s)</p><p className="text-[11px] text-muted-foreground">{schedule.description || "No description"}</p></div><div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => edit(schedule)} title="Edit"><Edit3 className="h-3.5 w-3.5" /></Button><Button size="icon" variant="ghost" onClick={() => void deactivate(schedule.id)} title="Deactivate"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></div></div>)}
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-sm">{editingId ? "Edit schedule" : "New schedule"}</CardTitle></CardHeader><CardContent className="space-y-3"><div className="grid grid-cols-2 gap-2"><div><Label htmlFor="schedule-name" className="text-xs">Name</Label><Input id="schedule-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Standard 9 to 5" className="mt-1 h-8 text-xs" /></div><div><Label htmlFor="schedule-code" className="text-xs">Code</Label><Input id="schedule-code" value={code} onChange={(event) => setCode(event.target.value)} placeholder="STD-FT" className="mt-1 h-8 text-xs" /></div></div><div><Label htmlFor="schedule-description" className="text-xs">Description</Label><Input id="schedule-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Monday to Friday" className="mt-1 h-8 text-xs" /></div><div className="space-y-1">{days.map((day, index) => <div key={day.dayOfWeek} className="grid grid-cols-[42px_1fr_1fr_64px_18px] items-center gap-1.5 text-[11px]"><span className="font-medium">{day.dayOfWeek}</span><Input type="time" value={day.startTime} disabled={!day.isWorkingDay} onChange={(event) => setDays((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, startTime: event.target.value } : item))} className="h-7 text-[11px]" /><Input type="time" value={day.endTime} disabled={!day.isWorkingDay} onChange={(event) => setDays((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, endTime: event.target.value } : item))} className="h-7 text-[11px]" /><Input type="number" min="0" value={day.breakMinutes} disabled={!day.isWorkingDay} onChange={(event) => setDays((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, breakMinutes: Number(event.target.value) } : item))} className="h-7 text-[11px]" /><input type="checkbox" checked={day.isWorkingDay} onChange={(event) => setDays((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, isWorkingDay: event.target.checked } : item))} aria-label={`${day.dayOfWeek} working day`} /></div>)}</div><div className="flex justify-end gap-2 pt-2"><Button variant="ghost" size="sm" onClick={reset}>Clear</Button><Button size="sm" onClick={() => void save()} disabled={saving}>{saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}{saving ? "Saving..." : "Save schedule"}</Button></div></CardContent></Card>
    </div>
  </div>;
}
