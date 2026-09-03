import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Check, Clock, Plus, Trash2, AlarmClock, Pencil, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/hooks/use-categories";
import { useAccess } from "@/hooks/use-access";
import { chipStyle, colorOf, iconOf } from "@/lib/categories";

export const Route = createFileRoute("/_authenticated/painel")({
  component: Painel,
});

type Task = {
  id: string;
  title: string;
  notes: string | null;
  area: string;
  priority: string;
  due_at: string | null;
  remind_at: string | null;
  done: boolean;
  done_at?: string | null;
  created_at: string;
};

const PRIORIDADES = [
  { value: "alta", label: "Alta" },
  { value: "media", label: "Média" },
  { value: "baixa", label: "Baixa" },
];

const prioStyle: Record<string, string> = {
  alta: "bg-red-500/20 text-red-600 dark:text-red-300",
  media: "bg-amber-500/20 text-amber-600 dark:text-amber-300",
  baixa: "bg-blue-500/15 text-blue-600 dark:text-blue-300",
};

// Limite de caracteres das notas: rápido e objetivo.
const NOTA_MAX = 100;
// Até esse tamanho a nota aparece direto no card; acima, abre uma janelinha.
const NOTA_INLINE_MAX = 60;

function toLocalInput(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isLate(t: Task) {
  if (t.done) return false;
  if (t.due_at) return new Date(t.due_at).getTime() < Date.now();
  return Date.now() - new Date(t.created_at).getTime() > 24 * 60 * 60 * 1000;
}


function Painel() {
  const qc = useQueryClient();
  const access = useAccess();
  const { data: categorias = [] } = useCategories();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [area, setArea] = useState("pessoal");
  const [priority, setPriority] = useState("media");
  const [dueAt, setDueAt] = useState("");
  const [filtro, setFiltro] = useState("todas");
  const [, forceTick] = useState(0);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState({
    title: "",
    notes: "",
    area: "pessoal",
    priority: "media",
    dueAt: "",
  });
  const [notaModal, setNotaModal] = useState<Task | null>(null);

  function abrirEdicao(t: Task) {
    setEditing(t);
    setForm({
      title: t.title,
      notes: t.notes ?? "",
      area: t.area,
      priority: t.priority,
      dueAt: toLocalInput(t.due_at),
    });
  }


  useEffect(() => {
    const i = setInterval(() => forceTick((n) => n + 1), 60_000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (categorias.length && !categorias.some((c) => c.slug === area)) {
      setArea(categorias[0]!.slug);
    }
  }, [categorias, area]);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("done", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Task[];
    },
  });

  const abertasNaArea = tasks.filter((t) => t.area === area && !t.done).length;
  const limiteArea = access.maxTasksPerCategory;
  const bloqueado = limiteArea !== null && abertasNaArea >= limiteArea;

  const create = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("tasks").insert({
        user_id: userData.user!.id,
        title: title.trim(),
        notes: notes.trim() ? notes.trim() : null,
        area,
        priority,
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle("");
      setNotes("");
      setDueAt("");
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: () => toast.error("Não consegui salvar a atividade."),
  });


  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Task> }) => {
      const { error } = await supabase.from("tasks").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const saveEdit = useMutation({
    mutationFn: async ({
      id,
      title: nextTitle,
      notes: nextNotes,
      area: nextArea,
      priority: nextPriority,
      dueAt: nextDueAt,
    }: {
      id: string;
      title: string;
      notes: string;
      area: string;
      priority: string;
      dueAt: string;
    }) => {
      const { error } = await supabase
        .from("tasks")
        .update({
          title: nextTitle.trim(),
          notes: nextNotes.trim() ? nextNotes.trim() : null,
          area: nextArea,
          priority: nextPriority,
          due_at: nextDueAt ? new Date(nextDueAt).toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Atividade atualizada.");
    },
    onError: () => toast.error("Não consegui atualizar a atividade."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  function lembrarEm(minutos: number, t: Task) {
    const when = new Date(Date.now() + minutos * 60_000);
    update.mutate({ id: t.id, patch: { due_at: when.toISOString() } });
    toast.success(`Combinado: aviso em ${minutos} minutos.`);
    if ("Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission();
    }
    window.setTimeout(() => {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("OrganizaMente", { body: t.title });
      } else {
        toast("Lembrete: " + t.title);
      }
    }, minutos * 60_000);
  }

  const visiveis = tasks.filter((t) => {
    if (filtro === "todas") return true;
    if (filtro === "atrasadas") return isLate(t);
    if (filtro === "concluidas") return t.done;
    return t.area === filtro;
  });
  const abertas = tasks.filter((t) => !t.done).length;
  const atrasadas = tasks.filter(isLate).length;

  const filtros = [
    { v: "todas", l: `Todas (${abertas} abertas)` },
    { v: "atrasadas", l: `Atrasadas (${atrasadas})`, alerta: true },
    ...categorias.map((c) => ({ v: c.slug, l: c.label })),
    { v: "concluidas", l: "Concluídas" },
  ];

  return (
    <AppShell
      title="Organizar"
      subtitle="Capture primeiro, organize depois. Não precisa estar perfeito."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim().length < 2 || bloqueado) return;
          create.mutate();
        }}
        className="card-soft space-y-3 p-4"
      >
        <div className="flex gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="O que precisa acontecer?"
            className="h-11 text-base"
          />
          <Button type="submit" className="h-11 px-4" disabled={create.isPending || bloqueado}>
            <Plus className="size-4" />
            <span className="hidden sm:inline">Adicionar</span>
          </Button>
        </div>
        <div>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Coloque um detalhe que te ajude a lembrar, tipo: 'ligar depois das 14h'"
            rows={2}
            maxLength={NOTA_MAX}
            className="text-sm"
          />
          <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Opcional</span>
            <span>
              {notes.length}/{NOTA_MAX}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={area} onValueChange={setArea}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categorias.map((c) => (
                <SelectItem key={c.slug} value={c.slug}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORIDADES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className="w-[210px]"
          />
        </div>
        {limiteArea !== null ? (
          <p className={`text-xs ${bloqueado ? "text-destructive" : "text-muted-foreground"}`}>
            Plano {access.label}: {abertasNaArea}/{limiteArea} atividades abertas nesta categoria
            {bloqueado ? " — conclua ou exclua uma para adicionar outra." : "."}
          </p>
        ) : null}
      </form>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {filtros.map((f) => {
          const selecionado = filtro === f.v;
          const alerta = "alerta" in f && f.alerta;
          return (
            <button
              key={f.v}
              onClick={() => setFiltro(f.v)}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 ${
                selecionado
                  ? alerta
                    ? "border-destructive bg-destructive text-destructive-foreground shadow-md"
                    : "border-primary bg-primary text-primary-foreground shadow-md"
                  : alerta
                    ? "border-destructive/40 bg-card text-destructive hover:border-destructive hover:bg-destructive/10"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {f.l}
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-3">
        {isLoading ? <p className="text-sm text-muted-foreground">Carregando...</p> : null}
        {!isLoading && visiveis.length === 0 ? (
          <p className="card-soft p-6 text-center text-sm text-muted-foreground">
            Nada por aqui. Escreva a primeira coisa que estiver na sua cabeça.
          </p>
        ) : null}

        {visiveis.map((t) => {
          const late = isLate(t);
          const cat = categorias.find((c) => c.slug === t.area);
          const cor = colorOf(cat?.color ?? "slate");
          const Icone = iconOf(cat?.icon ?? "folder");
          return (
            <article
              key={t.id}
              className={`card-soft flex flex-col gap-2 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg ${
                late ? "alert-pulse border-destructive/50" : ""
              } ${t.done ? "opacity-60" : ""}`}
            >
              <div className="flex items-start gap-3">
                <button
                  aria-label="Concluir"
                  onClick={() =>
                    update.mutate({
                      id: t.id,
                      patch: { done: !t.done, done_at: t.done ? null : new Date().toISOString() },
                    })
                  }
                  className={`mt-0.5 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-all duration-200 hover:scale-110 hover:border-success active:scale-95 ${
                    t.done ? "border-success bg-success text-success-foreground" : "border-border"
                  }`}
                >
                  {t.done ? <Check className="size-3.5" /> : null}
                </button>

                <div className="min-w-0 flex-1">
                  <p className={`font-medium ${t.done ? "line-through" : ""}`}>{t.title}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
                    <span
                      style={chipStyle(cat?.color ?? "slate")}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${cor.chip}`}
                    >
                      <Icone className="size-3" />
                      {cat?.label ?? t.area}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 ${prioStyle[t.priority]}`}>
                      {PRIORIDADES.find((p) => p.value === t.priority)?.label ?? t.priority}
                    </span>
                    {t.due_at ? (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${
                          late ? "bg-destructive/12 text-destructive" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Clock className="size-3" />
                        {new Date(t.due_at).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    ) : null}
                    {late && !t.due_at ? (
                      <span className="rounded-full bg-destructive/12 px-2 py-0.5 text-destructive">
                        parada há mais de 24h
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {!t.done ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Me lembre em 30 minutos"
                      title="Me lembre em 30 minutos"
                      onClick={() => lembrarEm(30, t)}
                    >
                      <AlarmClock className="size-4" />
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Editar atividade"
                    title="Editar atividade"
                    onClick={() => abrirEdicao(t)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Excluir"
                    title="Excluir atividade"
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground focus-visible:ring-destructive"
                    onClick={() => remove.mutate(t.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              {t.notes ? (
                t.notes.length <= NOTA_INLINE_MAX ? (
                  <div className="flex w-full justify-center">
                    <p className="flex max-w-full min-w-0 items-start gap-1.5 break-words rounded-xl bg-muted/50 px-3 py-2 text-center text-sm italic text-muted-foreground">
                      <StickyNote className="mt-0.5 size-3.5 shrink-0" />
                      <span className="min-w-0 break-words whitespace-pre-wrap [overflow-wrap:anywhere]">
                        {t.notes}
                      </span>
                    </p>
                  </div>
                ) : (
                  <div className="flex w-full justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setNotaModal(t)}
                    >
                      <StickyNote className="size-3.5" />
                      Ver nota
                    </Button>
                  </div>
                )
              ) : null}
            </article>
          );
        })}
      </div>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar atividade</DialogTitle>
            <DialogDescription>Atualize o que precisar e salve quando estiver pronto.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editing || form.title.trim().length < 2) return;
              saveEdit.mutate({ id: editing.id, ...form });
            }}
            className="space-y-4"
          >
            <Input
              value={form.title}
              onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
              placeholder="O que precisa acontecer?"
              autoFocus
            />
            <div>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))}
                placeholder="Nota (opcional, até 100 caracteres)"
                rows={4}
                maxLength={NOTA_MAX}
              />
              <p className="mt-1 text-right text-[11px] text-muted-foreground">
                {form.notes.length}/{NOTA_MAX}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select
                value={form.area}
                onValueChange={(value) => setForm((current) => ({ ...current, area: value }))}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => (
                    <SelectItem key={c.slug} value={c.slug}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={form.priority}
                onValueChange={(value) => setForm((current) => ({ ...current, priority: value }))}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORIDADES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="datetime-local"
                value={form.dueAt}
                onChange={(e) => setForm((current) => ({ ...current, dueAt: e.target.value }))}
                className="w-[210px]"
              />
            </div>
            <DialogFooter className="flex-row justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground focus-visible:ring-destructive"
                onClick={() => setEditing(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saveEdit.isPending || form.title.trim().length < 2}>
                {saveEdit.isPending ? "Salvando..." : "Salvar alterações"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(notaModal)} onOpenChange={(open) => !open && setNotaModal(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="size-4 shrink-0" />
              Nota
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-y-auto rounded-xl bg-muted/50 px-3 py-2">
            <p className="break-words whitespace-pre-wrap text-sm text-muted-foreground [overflow-wrap:anywhere]">
              {notaModal?.notes}
            </p>
          </div>
          <DialogFooter className="flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground focus-visible:ring-destructive"
              onClick={() => setNotaModal(null)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
