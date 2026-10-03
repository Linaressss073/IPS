"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BellRing, Maximize, Volume2, VolumeX, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Board, getBoard } from "@/lib/api/admission";
import { useApiAuth } from "@/lib/api/use-api-auth";
import { cn } from "@/lib/utils";

const REFRESH_MS = 3_000;

/** "RTH 4" → "R T H 4": letters spelled out by the voice. */
const spoken = (label: string) => label.replace(/^([A-Z]+)/, (code) => code.split("").join(" "));

/**
 * The waiting-room screen (a TV signed in with a staff account): the turn
 * being announced, large, and the last calls on the side. Every new call
 * or automatic re-announcement plays a chime and, with sound on, the voice.
 */
export function PageClient() {
  const { teamId } = useParams<{ teamId: string }>();
  const auth = useApiAuth();
  const [board, setBoard] = React.useState<Board>({
    current: null,
    recent: [],
    settings: { announceIntervalSeconds: 120, maxCalls: 3 },
  });
  const [loaded, setLoaded] = React.useState(false);
  const [offline, setOffline] = React.useState(false);
  const [sound, setSound] = React.useState(false);
  const [flash, setFlash] = React.useState(false);
  const [clock, setClock] = React.useState(() => new Date());
  const lastAnnounced = React.useRef("");

  React.useEffect(() => {
    let cancelled = false;
    const load = () =>
      getBoard(auth, teamId)
        .then((data) => {
          if (cancelled) return;
          setBoard(data);
          setLoaded(true);
          setOffline(false);
        })
        .catch(() => !cancelled && setOffline(true));
    void load();
    const timers = [setInterval(load, REFRESH_MS), setInterval(() => setClock(new Date()), 1_000)];
    return () => {
      cancelled = true;
      timers.forEach(clearInterval);
    };
  }, [auth, teamId]);

  // Announce each new call (another turn, or the same turn called again).
  React.useEffect(() => {
    const current = board.current;
    if (!current) return;
    const key = `${current.turnId}:${current.calls}`;
    if (key === lastAnnounced.current) return;
    const first = lastAnnounced.current === "";
    lastAnnounced.current = key;
    if (first) return; // what was already on screen when it opened
    setFlash(true);
    setTimeout(() => setFlash(false), 2_500);
    if (sound) announce(`Turno ${spoken(current.label)}, ${current.location}. ${current.patientName ?? ""}`);
  }, [board, sound]);

  const current = board.current;
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b px-4 py-3 md:px-8">
        <Logo link={`/dashboard/${teamId}`} />
        <div className="flex items-center gap-1 md:gap-2">
          <span className="mr-2 text-2xl font-semibold tabular-nums md:text-3xl">
            {clock.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <Button
            variant={sound ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSound((on) => !on);
              if (!sound) announce("Sonido activado");
            }}
          >
            {sound ? <Volume2 className="mr-1.5 h-4 w-4" /> : <VolumeX className="mr-1.5 h-4 w-4" />}
            {sound ? "Sonido" : "Activar sonido"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Pantalla completa"
            onClick={() => void document.documentElement.requestFullscreen?.()}
          >
            <Maximize className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Salir de la pantalla" asChild>
            <Link href={`/dashboard/${teamId}/turns`}>
              <X className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="grid flex-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <section className="order-2 overflow-y-auto border-t lg:order-1 lg:border-r lg:border-t-0">
          <h2 className="px-6 py-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Últimos llamados
          </h2>
          <ul className="divide-y">
            {board.recent.map((call) => (
              <li key={`${call.turnId}:${call.calls}`} className="flex items-center justify-between gap-3 px-6 py-4">
                <div className="min-w-0">
                  <p className="font-mono text-2xl font-bold tabular-nums md:text-3xl">{call.label}</p>
                  <p className="truncate text-muted-foreground md:text-lg">{call.location}</p>
                </div>
                {call.status === "no_se_presento" && (
                  <span className="shrink-0 rounded-full bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive">
                    No se presentó
                  </span>
                )}
              </li>
            ))}
            {loaded && board.recent.length === 0 && (
              <li className="px-6 py-4 text-muted-foreground">Aún no hay llamados hoy.</li>
            )}
          </ul>
        </section>

        <section
          className={cn(
            "order-1 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-primary/10 via-transparent to-trust/10 p-8 text-center transition-colors lg:order-2",
            flash && "bg-primary/20",
          )}
          aria-live="assertive"
        >
          {current ? (
            <>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-lg font-semibold text-primary-foreground">
                <BellRing className={cn("h-5 w-5", flash && "motion-safe:animate-bounce")} aria-hidden />
                Llamando
              </span>
              <p className="font-mono text-[clamp(4rem,14vw,12rem)] font-bold leading-none tracking-tight tabular-nums">
                {current.label}
              </p>
              <p className="text-[clamp(1.75rem,4vw,3.5rem)] font-semibold text-trust">{current.location}</p>
              {current.patientName && (
                <p className="text-[clamp(1.25rem,2.5vw,2.25rem)] text-muted-foreground">{current.patientName}</p>
              )}
              <p className="text-muted-foreground md:text-lg">
                Llamado {current.calls} de {board.settings.maxCalls}
              </p>
            </>
          ) : (
            <p className="text-[clamp(1.5rem,3vw,2.5rem)] text-muted-foreground">
              {loaded ? "Espera tu llamado" : "Cargando…"}
            </p>
          )}
          {offline && (
            <p className="rounded-md bg-destructive/10 px-3 py-1 text-sm text-destructive">
              Sin conexión con el servidor; reintentando…
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

/** A short chime and the spoken call (Spanish voice when available). */
function announce(text: string) {
  try {
    const context = new AudioContext();
    for (const [frequency, start] of [
      [880, 0],
      [660, 0.18],
    ]) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.2, context.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + start + 0.35);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(context.currentTime + start);
      oscillator.stop(context.currentTime + start + 0.35);
    }
  } catch {
    // Audio is optional.
  }
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "es-CO";
  utterance.voice = speechSynthesis.getVoices().find((voice) => voice.lang.startsWith("es")) ?? utterance.voice;
  setTimeout(() => speechSynthesis.speak(utterance), 600);
}
