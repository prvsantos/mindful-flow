import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Lock } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { CHANGELOG, CHANGE_TYPES, formatChangeDate, type ChangeType } from "@/lib/changelog";
import { useAccess } from "@/hooks/use-access";

export const Route = createFileRoute("/_authenticated/atualizacoes")({
  component: Atualizacoes,
});

const FILTROS: { v: "todas" | ChangeType; l: string }[] = [
  { v: "todas", l: "Tudo" },
  { v: "novidade", l: "Novidades & Melhorias" },
  { v: "seguranca", l: "Segurança & Planos" },
  { v: "correcao", l: "Correções e Bugs" },
];

function Atualizacoes() {
  const access = useAccess();
  const [filtro, setFiltro] = useState<"todas" | ChangeType>("todas");

  const permitido = (t: ChangeType) => t !== "novidade" || access.canSeeNews;
  const lista = CHANGELOG.filter(
    (c) => permitido(c.tipo) && (filtro === "todas" || c.tipo === filtro),
  );

  return (
    <AppShell
      title="Atualizações"
      subtitle="Histórico do que mudou no portal, com data e hora de cada entrega."
    >
      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => {
          const bloqueado = f.v === "novidade" && !access.canSeeNews;
          return (
            <button
              key={f.v}
              disabled={bloqueado}
              onClick={() => setFiltro(f.v)}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${
                filtro === f.v
                  ? "border-primary bg-primary text-primary-foreground shadow-md"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {bloqueado ? <Lock className="size-3" /> : null}
              {f.l}
            </button>
          );
        })}
      </div>

      {!access.canSeeNews ? (
        <p className="card-soft mt-4 p-4 text-sm text-muted-foreground">
          🔒 “Novidades & Melhorias” está disponível nos planos Premium e Owner.
        </p>
      ) : null}

      <ol className="mt-5 space-y-3">
        {lista.map((c) => {
          const tipo = CHANGE_TYPES[c.tipo];
          return (
            <li
              key={c.data + c.titulo}
              className="card-soft p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${tipo.chip}`}>
                  {tipo.label}
                </span>
                <time className="text-xs text-muted-foreground">{formatChangeDate(c.data)}</time>
              </div>
              <p className="mt-2 font-display text-base font-semibold">
                {tipo.emoji} {c.titulo}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{c.detalhe}</p>
            </li>
          );
        })}
      </ol>
    </AppShell>
  );
}
