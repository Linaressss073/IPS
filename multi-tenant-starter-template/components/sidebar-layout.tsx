"use client";

import { UserButton } from "@clerk/nextjs";
import { LucideIcon, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { useClerkAppearance } from "@/lib/clerk-appearance";
import { cn } from "@/lib/utils";
import { ColorModeSwitcher } from "./color-mode-switcher";
import { Logo } from "./logo";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { Separator } from "./ui/separator";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "./ui/sheet";

/** The part of the path after the team's base ("/patients", "/" …). */
function useSegment(basePath: string) {
  const path = usePathname();
  return path.slice(basePath.length) || "/";
}

type Item = {
  name: React.ReactNode;
  href: string;
  icon: LucideIcon;
  type: "item";
};

type Sep = {
  type: "separator";
};

type Label = {
  name: React.ReactNode;
  type: "label";
};

export type SidebarItem = Item | Sep | Label;

/** Selected when the path is the item or below it (/patients/123 → Pacientes). */
function isSelected(segment: string, href: string) {
  return href === "/" ? segment === "/" : segment === href || segment.startsWith(`${href}/`);
}

function NavItem(props: { item: Item; onClick?: () => void; basePath: string }) {
  const segment = useSegment(props.basePath);
  const selected = isSelected(segment, props.item.href);

  return (
    <Link
      href={props.basePath + props.item.href}
      aria-current={selected ? "page" : undefined}
      className={cn(
        "flex flex-grow items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        selected
          ? "bg-accent text-accent-foreground"
          : "text-foreground/70 hover:bg-muted hover:text-foreground",
      )}
      onClick={props.onClick}
      prefetch={true}
    >
      <props.item.icon className={cn("h-4 w-4 shrink-0", selected && "text-primary")} aria-hidden />
      {props.item.name}
    </Link>
  );
}

function SidebarContent(props: {
  onNavigate?: () => void;
  items: SidebarItem[];
  sidebarTop?: React.ReactNode;
  basePath: string;
}) {
  return (
    <div className="flex h-full flex-col items-stretch">
      <div className="flex h-14 shrink-0 items-center border-b px-4">
        <Logo link={props.basePath} />
      </div>
      {props.sidebarTop && <div className="border-b px-3 py-3">{props.sidebarTop}</div>}
      <nav className="flex flex-grow flex-col gap-1 overflow-y-auto px-3 py-4" aria-label="Menú">
        {props.items.map((item, index) => {
          if (item.type === "separator") {
            return <Separator key={index} className="my-2" />;
          }
          if (item.type === "item") {
            return (
              <div key={index} className="flex">
                <NavItem item={item} onClick={props.onNavigate} basePath={props.basePath} />
              </div>
            );
          }
          return (
            <p
              key={index}
              className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground first:pt-0"
            >
              {item.name}
            </p>
          );
        })}
      </nav>
    </div>
  );
}

export type HeaderBreadcrumbItem = { title: string; href: string };

function HeaderBreadcrumb(props: {
  items: SidebarItem[];
  baseBreadcrumb?: HeaderBreadcrumbItem[];
  basePath: string;
}) {
  const segment = useSegment(props.basePath);
  const item = props.items.find(
    (entry): entry is Item => entry.type === "item" && isSelected(segment, entry.href),
  );

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {props.baseBreadcrumb?.map((crumb, index) => (
          <React.Fragment key={index}>
            <BreadcrumbItem className="max-w-[10rem] truncate">
              <BreadcrumbLink href={crumb.href}>{crumb.title}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </React.Fragment>
        ))}
        <BreadcrumbItem>
          <BreadcrumbPage>{item?.name}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default function SidebarLayout(props: {
  children?: React.ReactNode;
  baseBreadcrumb?: HeaderBreadcrumbItem[];
  items: SidebarItem[];
  sidebarTop?: React.ReactNode;
  basePath: string;
}) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const appearance = useClerkAppearance();

  return (
    <div className="flex w-full">
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r bg-muted/30 md:flex">
        <SidebarContent items={props.items} sidebarTop={props.sidebarTop} basePath={props.basePath} />
      </aside>
      <div className="relative isolate flex w-0 flex-grow flex-col">
        {/* The landing's soft green and blue light, at the top of every page. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(50%_80%_at_20%_0%,hsl(var(--primary)/0.08),transparent),radial-gradient(40%_70%_at_95%_0%,hsl(var(--trust)/0.07),transparent)]"
        />
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-2 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Sheet onOpenChange={setSidebarOpen} open={sidebarOpen}>
              <SheetTrigger className="md:hidden" aria-label="Abrir menú">
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-[264px] p-0">
                <SheetTitle className="sr-only">Menú</SheetTitle>
                <SidebarContent
                  onNavigate={() => setSidebarOpen(false)}
                  items={props.items}
                  sidebarTop={props.sidebarTop}
                  basePath={props.basePath}
                />
              </SheetContent>
            </Sheet>
            <div className="min-w-0">
              <HeaderBreadcrumb baseBreadcrumb={props.baseBreadcrumb} basePath={props.basePath} items={props.items} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ColorModeSwitcher />
            <UserButton appearance={appearance} />
          </div>
        </header>
        <main className="flex flex-grow flex-col">{props.children}</main>
      </div>
    </div>
  );
}
