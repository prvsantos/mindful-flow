import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, BookOpen } from "lucide-react";
import { GUIAS } from "@/lib/guias";
import { Button } from "@/components/ui/button";

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
  const [filtro, setFiltro] = useState("todos");
  const lista = GUIAS.filter((g) => filtro === "todos" || g.contexto === filtro);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-hero">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
            <Link to="/">
              <ArrowLeft className="size-4" /> Voltar
            </Link>
          </Button>
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
          {FILTROS.map((f) => (
            <button
              key={f.v}
              onClick={() => setFiltro(f.v)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                filtro === f.v
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              {f.l}
            </button>
          ))}
        </div>

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