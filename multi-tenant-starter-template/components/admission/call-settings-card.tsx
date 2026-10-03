"use client";

import * as React from "react";
import { errorMessage } from "@/components/patients/error-message";
import { Field } from "@/components/patients/form-controls";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CallSettings, getCallSettings, updateCallSettings } from "@/lib/api/admission";
import { TokenSource } from "@/lib/api/client";

/** How the IPS calls turns: interval between re-announcements and number of calls. */
export function CallSettingsCard(props: { auth: TokenSource; teamId: string }) {
  const { auth, teamId } = props;
  const [settings, setSettings] = React.useState<CallSettings>({ announceIntervalSeconds: 120, maxCalls: 3 });
  const [saved, setSaved] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    getCallSettings(auth, teamId)
      .then(setSettings)
      .catch((e) => setError(errorMessage(e)));
  }, [auth, teamId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Llamado de turnos</CardTitle>
        <CardDescription>
          Cada cuánto se repite un llamado en la pantalla de sala y cuántas veces, antes de cerrar el turno como
          “no se presentó”.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            setSaved("");
            try {
              setSettings(await updateCallSettings(auth, teamId, settings));
              setSaved("Guardado.");
            } catch (e) {
              setError(errorMessage(e));
            }
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Repetir cada (minutos)" id="call-interval">
              <Input
                id="call-interval"
                type="number"
                min={0.5}
                max={15}
                step={0.5}
                value={settings.announceIntervalSeconds / 60}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, announceIntervalSeconds: Math.round(Number(e.target.value) * 60) }))
                }
              />
            </Field>
            <Field label="Número de llamados" id="call-max">
              <Input
                id="call-max"
                type="number"
                min={1}
                max={5}
                value={settings.maxCalls}
                onChange={(e) => setSettings((s) => ({ ...s, maxCalls: Number(e.target.value) }))}
              />
            </Field>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {saved && <p className="text-sm text-primary">{saved}</p>}
          <Button type="submit" size="sm">
            Guardar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
