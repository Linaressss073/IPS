import { GitHubLogoIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { Logo } from "./logo";

const REPOSITORY = "https://github.com/Linaressss073/IPS";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container grid gap-8 px-4 py-10 md:grid-cols-[2fr_1fr_1fr] md:px-8">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-sm text-sm text-muted-foreground">
            Sistema de información hospitalaria web para la consulta externa: agendamiento, admisión y turnos,
            consulta, farmacia y trazabilidad, para cada IPS.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">Producto</p>
          <ul className="space-y-1 text-muted-foreground">
            <li><Link className="hover:text-foreground" href="/#modulos">Módulos</Link></li>
            <li><Link className="hover:text-foreground" href="/#recorrido">Recorrido del paciente</Link></li>
            <li><Link className="hover:text-foreground" href="/#seguridad">Seguridad</Link></li>
          </ul>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">Proyecto</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>Práctica de Ingeniería IV</li>
            <li>
              <a className="inline-flex items-center gap-1 hover:text-foreground" href={REPOSITORY} target="_blank" rel="noreferrer">
                <GitHubLogoIcon className="h-4 w-4" aria-hidden /> Código fuente
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <p className="container px-4 py-4 text-xs text-muted-foreground md:px-8">
          Proyecto académico. Fuera del alcance: urgencias, hospitalización y facturación.
        </p>
      </div>
    </footer>
  );
}
