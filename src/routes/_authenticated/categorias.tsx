import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Lock, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCategories } from "@/hooks/use-categories";
import { useAccess } from "@/hooks/use-access";
import { COLORS, DEFAULT_SLUGS, ICONS, colorOf, iconOf, slugify } from "@/lib/categories";
import type { Role } from "@/lib/access";

export const Route = createFileRoute("/_authenticated/categorias")({
  component: Categorias,
});

function Categorias() {
  const qc = useQueryClient();
  const access = useAccess();
  const { data: categorias = [], isLoading } = useCategories();

  const [novoNome, setNovoNome] = useState("");
  const [novaCor, setNovaCor] = useState<string>(COLORS[0]!.key);
  const [novoIcone, setNovoIcone] = useState("folder");
  const [editando, setEditando] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editCor, setEditCor] = useState<string>(COLORS[0]!.key);
  const [editIcone, setEditIcone] = useState("folder");

  const cores = access.maxColors ? COLORS.slice(0, access.maxColors) : COLORS;
  const icones = access.canPickIcon ? ICONS : ICONS.slice(0, 1);
  const criadas = categorias.filter((c) => !DEFAULT_SLUGS.includes(c.slug)).length;
  const limiteAtingido =
    access.maxCustomCategories !== null && criadas >= access.maxCustomCategories;

  const criar = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const slug = slugify(novoNome);
      if (!slug) throw new Error("Escolha um nome válido.");
      const { error } = await supabase.from("categories").insert({
        user_id: u.user!.id,
        slug,
        label: novoNome.trim(),
        color: novaCor,
        icon: access.canPickIcon ? novoIcone : "folder",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNovoNome("");
      toast.success("Categoria criada.");
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Não consegui criar essa categoria."),
  });

  const salvar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("categories")
        .update({
          label: editNome.trim(),
          color: editCor,
          icon: access.canPickIcon ? editIcone : "folder",
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditando(null);
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: () => toast.error("Não consegui salvar as alterações."),
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Categoria removida.");
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  return (
    <AppShell
      title="Categorias"
      subtitle="Organize as áreas da sua vida do seu jeito: nome, cor e ícone."
    >
      <div className="card-soft flex flex-wrap items-center gap-3 p-4">
        <span className="rounded-full bg-primary/12 px-3 py-1 text-xs font-semibold text-primary">
          Plano {access.label}
        </span>
        <p className="text-xs text-muted-foreground">
          {access.maxCustomCategories === null
            ? "Categorias ilimitadas, com cor e ícone livres."
            : `${criadas}/${access.maxCustomCategories} categorias novas · ${cores.length} cores disponíveis · ícone padrão`}
        </p>
        {access.isAdmin ? <PlanSimulator /> : null}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (novoNome.trim().length < 2 || limiteAtingido) return;
          criar.mutate();
        }}
        className="card-soft mt-4 space-y-4 p-4"
      >
        <div className="space-y-1.5">
          <Label htmlFor="nome">Nome da categoria</Label>
          <Input
            id="nome"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder="ex: Estudos, Saúde, Casa..."
            disabled={limiteAtingido}
          />
        </div>

        <ColorPicker cores={cores} value={novaCor} onChange={setNovaCor} />
        <IconPicker
          icones={icones}
          value={novoIcone}
          onChange={setNovoIcone}
          locked={!access.canPickIcon}
        />

        <Button type="submit" disabled={criar.isPending || limiteAtingido}>
          <Plus className="size-4" /> Criar categoria
        </Button>
        {limiteAtingido ? (
          <p className="text-xs text-destructive">
            Você atingiu o limite de categorias novas do plano {access.label}.
          </p>
        ) : null}
      </form>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {isLoading ? <p className="text-sm text-muted-foreground">Carregando...</p> : null}
        {categorias.map((c) => {
          const cor = colorOf(c.color);
          const Icone = iconOf(c.icon);
          const emEdicao = editando === c.id;
          return (
            <article
              key={c.id}
              className="card-soft p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
            >
              {emEdicao ? (
                <div className="space-y-3">
                  <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} />
                  <ColorPicker cores={cores} value={editCor} onChange={setEditCor} />
                  <IconPicker
                    icones={icones}
                    value={editIcone}
                    onChange={setEditIcone}
                    locked={!access.canPickIcon}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => salvar.mutate(c.id)}>
                      <Check className="size-4" /> Salvar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditando(null)}>
                      <X className="size-4" /> Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span
                    className={`flex size-10 items-center justify-center rounded-xl ${cor.chip}`}
                  >
                    <Icone className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{c.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {DEFAULT_SLUGS.includes(c.slug) ? "Categoria padrão" : "Categoria criada por você"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Editar categoria"
                    onClick={() => {
                      setEditando(c.id);
                      setEditNome(c.label);
                      setEditCor(c.color);
                      setEditIcone(c.icon);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Excluir categoria"
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground focus-visible:ring-destructive"
                    onClick={() => excluir.mutate(c.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </AppShell>
  );
}

function ColorPicker({
  cores,
  value,
  onChange,
}: {
  cores: readonly { key: string; label: string; dot: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>Cor</Label>
      <div className="flex flex-wrap gap-2">
        {cores.map((c) => (
          <button
            key={c.key}
            type="button"
            title={c.label}
            onClick={() => onChange(c.key)}
            className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md active:scale-95 ${
              value === c.key ? "border-primary bg-secondary shadow-md" : "border-border bg-card"
            }`}
          >
            <span className={`size-3.5 rounded-full ${c.dot}`} />
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function IconPicker({
  icones,
  value,
  onChange,
  locked,
}: {
  icones: typeof ICONS;
  value: string;
  onChange: (v: string) => void;
  locked: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5">
        Ícone {locked ? <Lock className="size-3 text-muted-foreground" /> : null}
      </Label>
      {locked ? (
        <p className="text-xs text-muted-foreground">
          Escolher o ícone da categoria está disponível nos planos Premium e Owner.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {icones.map((i) => (
          <button
            key={i.key}
            type="button"
            title={i.label}
            disabled={locked}
            onClick={() => onChange(i.key)}
            className={`flex size-10 cursor-pointer items-center justify-center rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
              value === i.key
                ? "border-primary bg-secondary text-secondary-foreground shadow-md"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            <i.icon className="size-4" />
          </button>
        ))}
      </div>
    </div>
  );
}

function PlanSimulator() {
  const { viewAs, setViewAs } = useAccess();
  const opcoes: { v: Role | null; l: string }[] = [
    { v: null, l: "Owner (real)" },
    { v: "premium", l: "Ver como Premium" },
    { v: "lite", l: "Ver como Lite" },
  ];
  return (
    <div className="ml-auto flex flex-wrap gap-1.5">
      {opcoes.map((o) => (
        <button
          key={o.l}
          onClick={() => {
            setViewAs(o.v);
            window.location.reload();
          }}
          className={`cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 ${
            (viewAs ?? null) === o.v
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:border-primary/50"
          }`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}
