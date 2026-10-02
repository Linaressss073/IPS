"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Agenda, Slot } from "@/lib/api/scheduling";
import { cn } from "@/lib/utils";

const SLOT_STYLES: Record<string, string> = {
  agendada: "border-amber-500/60 bg-amber-500/10",
  confirmada: "border-emerald-600/60 bg-emerald-600/10",
};

/** One agenda with its slots: free ones can be booked, taken ones opened. */
export function AgendaCard(props: {
  agenda: Agenda;
  /** Whether free slots can be clicked (booking or moving an appointment). */
  canPickFree: boolean;
  onPickFree: (agenda: Agenda, slot: Slot) => void;
  onOpenAppointment: (appointmentId: string) => void;
  onDelete?: (agenda: Agenda) => void;
  /** Slots before this instant cannot be booked. */
  now: Date;
}) {
  const { agenda } = props;
  const booked = agenda.slots.filter((s) => s.appointment).length;
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base">
            <span className="mr-2 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{agenda.service.code}</span>
            {agenda.service.name} · {agenda.location.label}
          </CardTitle>
          <CardDescription>
            {agenda.professional.displayName ?? agenda.professional.userId} · {agenda.startTime}–{agenda.endTime} · cupos de{" "}
            {agenda.slotMinutes} min · {booked}/{agenda.slots.length} ocupados
          </CardDescription>
        </div>
        {props.onDelete && booked === 0 && (
          <Button variant="ghost" size="sm" aria-label="Eliminar agenda" onClick={() => props.onDelete!(agenda)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {agenda.slots.map((slot) => {
          const taken = slot.appointment;
          const past = new Date(slot.startsAt) <= props.now;
          if (taken) {
            return (
              <button
                key={slot.time}
                type="button"
                onClick={() => props.onOpenAppointment(taken.id)}
                className={cn("min-w-28 rounded-md border px-2 py-1 text-left text-xs", SLOT_STYLES[taken.status])}
              >
                <span className="font-semibold">{slot.time}</span>
                <span className="block truncate">{taken.patient.fullName ?? "Paciente"}</span>
              </button>
            );
          }
          return (
            <button
              key={slot.time}
              type="button"
              disabled={!props.canPickFree || past}
              onClick={() => props.onPickFree(agenda, slot)}
              className="min-w-16 rounded-md border border-dashed px-2 py-1 text-xs hover:bg-muted disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <span className="font-semibold">{slot.time}</span>
              <span className="block text-muted-foreground">{past ? "pasó" : "libre"}</span>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
