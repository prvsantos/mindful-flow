import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Brain, BookHeart, ListChecks, LifeBuoy, Sparkles, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { LogoutButton } from "@/components/app/LogoutButton";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  head: () => ({
    meta: [
      { title: "Portal OrganizaMente | Organização e foco para TDAH" },
      {
        name: "description",
        content:
          "Um portal simples para quem tem TDAH: organize tarefas, descarregue pensamentos com ajuda da IA, registre como está e volte ao eixo.",
      },
      { property: "og:title", content: "Portal OrganizaMente" },
      {
        property: "og:description",
        content: "Organizar, lembrar, entender e regular — em um só lugar, sem complicação.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const PILARES = [
  {
    icon: ListChecks,
    titulo: "Organizar",
    texto: "Tirar da cabeça e virar ação, em poucos segundos.",
    cor: "text-area-trabalho",
  },
  {
    icon: Bell,
    titulo: "Lembrar",
    texto: "Prazos que avisam e cards que piscam quando passam da hora.",
    cor: "text-warning",
  },
  {
    icon: Brain,
    titulo: "Entender",
    texto: "Pensamentos e emoções registrados viram padrões visíveis.",
    cor: "text-area-pessoal",
  },
  {
    icon: BookHeart,
    titulo: "Regular",
    texto: "Um botão para os momentos de sobrecarga e o próximo passo.",
    cor: "text-success",
  },
];

function Index() {
  return (
    <div className="bg-hero min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2">
          <span className="bg-gradient-primary flex size-9 items-center justify-center rounded-xl text-primary-foreground">
            <Sparkles className="size-5" />
          </span>
          <span className="font-display font-semibold">OrganizaMente</span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/atualizacoes">Atualizações</Link>
          </Button>
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 pt-10 pb-14 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          Feito para cérebros com TDAH
        </span>
        <h1 className="mt-5 text-4xl leading-tight font-bold md:text-5xl">
          Sua cabeça bagunçada vira um plano simples
        </h1>
        <p className="mt-4 text-base text-muted-foreground md:text-lg">
          Registre primeiro, organize depois. Tarefas rápidas, descarga mental com IA, diário sem
          obrigação e orientações baseadas em evidências — tudo num lugar só.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/painel">Começar agora</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/guias">Ver os guias</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-4 pb-16 sm:grid-cols-2 lg:grid-cols-4">
        {PILARES.map((p) => (
          <article
            key={p.titulo}
            className="card-soft transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 p-5"
          >
            <p.icon className={`size-6 ${p.cor}`} />
            <h2 className="mt-3 font-display text-lg font-semibold">{p.titulo}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{p.texto}</p>
          </article>
        ))}
      </section>

      <footer className="mx-auto max-w-5xl px-4 pb-10 text-center text-xs text-muted-foreground">
        O OrganizaMente apoia organização e autoconhecimento. Não é serviço de saúde e não substitui
        avaliação profissional. Em situação de crise, ligue 188 (CVV).
      </footer>
    </div>
  );
}
