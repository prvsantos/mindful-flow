import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, BookOpen } from "lucide-react";
import { GUIAS } from "@/lib/guias";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { LogoutButton } from "@/components/app/LogoutButton";
import { useAccess } from "@/hooks/use-access";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/guias")({
  head: () => ({
    meta: [
      { title: "Guias práticos para TDAH | OrganizaMente" },
      {
        name: "description",
        content:
          "Orientações objetivas para conflitos, foco, sobrecarga e sono, baseadas em diretrizes clínicas e literatura especializada sobre TDAH.",
      },
      { property: "og:title", content: "Guias práticos para TDAH | OrganizaMente" },
      {
        property: "og:description",
        content: "O que fazer em situações concretas — sem achismo e sem diagnóstico.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Guias,
});

const FILTROS = [
  { v: "todos", l: "Todos" },
  { v: "foco", l: "Foco" },
  { v: "regulacao", l: "Regulação" },
  { v: "trabalho", l: "Trabalho" },
  { v: "pessoal", l: "Pessoal" },
];

function Guias() {
  const access = useAccess();
  const [filtro, setFiltro] = useState("todos");
  const permitido = (ctx: string) =>
    access.guideContexts === null || access.guideContexts.includes(ctx);
  const lista = GUIAS.filter(
    (g) => permitido(g.contexto) && (filtro === "todos" || g.contexto === filtro),
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-hero">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="mb-4 flex items-center justify-between">
            <Button asChild variant="ghost" size="sm" className="-ml-2">
              <Link to="/painel">
                <ArrowLeft className="size-4" /> Voltar
              </Link>
            </Button>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <LogoutButton />
            </div>
          </div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <BookOpen className="size-7 text-primary" /> Guias práticos
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            O que fazer em situações concretas, com base em diretrizes clínicas, literatura
            especializada e organizações reconhecidas. Isto é psicoeducação — não substitui
            avaliação profissional.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((f) => {
            const bloqueado = f.v !== "todos" && !permitido(f.v);
            return (
            <button
              key={f.v}
              disabled={bloqueado}
              onClick={() => setFiltro(f.v)}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md active:scale-95 ${
                filtro === f.v
                  ? "border-primary bg-primary text-primary-foreground shadow-md"
                  : "border-border bg-card text-muted-foreground"
              } disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0`}
            >
              {bloqueado ? <Lock className="mr-1 inline size-3" /> : null}
              {f.l}
            </button>
            );
          })}
        </div>
        {access.guideContexts ? (
          <p className="mt-3 text-xs text-muted-foreground">
            🔒 No plano {access.label} os guias liberados são Pessoal e Trabalho.
          </p>
        ) : null}

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {lista.map((g) => (
            <article key={g.id} className="card-soft p-5">
              <h2 className="font-display text-lg font-semibold">{g.titulo}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{g.resumo}</p>
              <ol className="mt-3 space-y-2 text-sm">
                {g.passos.map((p, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-secondary-foreground">
                      {i + 1}
                    </span>
                    <span>{p}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 border-t border-border pt-3 text-[11px] text-muted-foreground">
                Fonte: {g.fonte}
              </p>
            </article>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Em momentos de crise ou risco, procure ajuda profissional. No Brasil, CVV: 188 (24h).
        </p>
      </main>
    </div>
  );
}