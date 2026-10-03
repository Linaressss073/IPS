import { Footer } from "@/components/footer";
import { LandingPageHeader } from "@/components/landing-page-header";

export default function Layout(props: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingPageHeader
        items={[
          { title: "Módulos", href: "/#modulos" },
          { title: "Recorrido", href: "/#recorrido" },
          { title: "Roles", href: "/#roles" },
          { title: "Seguridad", href: "/#seguridad" },
        ]}
      />
      <main className="flex-1">{props.children}</main>
      <Footer />
    </div>
  );
}
