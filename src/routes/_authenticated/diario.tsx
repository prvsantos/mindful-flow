import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/AppShell";
import { useAccess } from "@/hooks/use-access";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { findPatterns } from "@/lib/ai.functions";
import type { PatternInsight } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/diario")({
  component: Diario,
});

type Entry = {
  id: string;
  created_at: string;
  mood: number;
  feeling: string | null;
  what_happened: string | null;
  thoughts: string | null;
  helped: string | null;
  not_helped: string | null;
};

const MOODS = [
  { v: 1, e: "😖", l: "Muito difícil" },
  { v: 2, e: "😕", l: "Difícil" },
  { v: 3, e: "😐", l: "Neutro" },
  { v: 4, e: "🙂", l: "Bom" },
  { v: 5, e: "😄", l: "Ótimo" },
];

function Diario() {
  const qc = useQueryClient();
  const access = useAccess();
  const [mood, setMood] = useState(3);
  const [feeling, setFeeling] = useState("");
  const [whatHappened, setWhatHappened] = useState("");
  const [thoughts, setThoughts] = useState("");
  const [helped, setHelped] = useState("");
  const [notHelped, setNotHelped] = useState("");
  const [insight, setInsight] = useState<PatternInsight | null>(null);

  const analisar = useServerFn(findPatterns);

  const { data: entries = [] } = useQuery({
    queryKey: ["journal"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Entry[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("journal_entries").insert({
        user_id: u.user!.id,
        mood,
        feeling: feeling || null,
        what_happened: whatHappened || null,
        thoughts: thoughts || null,
        helped: helped || null,
        not_helped: notHelped || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setFeeling("");
      setWhatHappened("");
      setThoughts("");
      setHelped("");
      setNotHelped("");
      toast.success("Registro salvo.");
      qc.invalidateQueries({ queryKey: ["journal"] });
    },
    onError: () => toast.error("Não consegui salvar."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("journal_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["journal"] }),
  });

  const patterns = useMutation({
    mutationFn: async () => await analisar({ data: undefined }),
    onSuccess: (r) => setInsight(r),
    onError: () => toast.error("Não consegui analisar agora."),
  });

  const limite = access.maxJournalEntries;
  const limiteAtingido = limite !== null && entries.length >= limite;

  return (
    <AppShell
      title="Diário"
      subtitle="Escreva quando fizer sentido. Nenhum dia é obrigatório."
    >
      <div className="card-soft space-y-4 p-5">
        <div>
          <Label className="mb-2 block">Como estou agora?</Label>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m.v}
                type="button"
                onClick={() => setMood(m.v)}
                className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border px-4 py-2 text-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md active:scale-95 ${
                  mood === m.v
                    ? "border-primary bg-secondary text-secondary-foreground shadow-md"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                <span className="text-xl">{m.e}</span>
                {m.l}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="feeling">O que estou sentindo?</Label>
          <Input
            id="feeling"
            value={feeling}
            onChange={(e) => setFeeling(e.target.value)}
            placeholder="ex: irritado, cansado, animado, ansioso..."
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="aconteceu">O que aconteceu?</Label>
          <Textarea
            id="aconteceu"
            rows={3}
            value={whatHappened}
            onChange={(e) => setWhatHappened(e.target.value)}
            className="resize-none"
            placeholder="ex: briguei com um colega, perdi o prazo, recebi um elogio..."
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pensamentos">O que eu estava pensando?</Label>
          <Textarea
            id="pensamentos"
            rows={3}
            value={thoughts}
            onChange={(e) => setThoughts(e.target.value)}
            className="resize-none"
            placeholder="ex: 'acho que vou ser demitido', 'ninguém me leva a sério', 'consegui fazer tudo hoje'..."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ajudou">O que ajudou?</Label>
            <Input
              id="ajudou"
              value={helped}
              onChange={(e) => setHelped(e.target.value)}
              placeholder="ex: pausa de 5 min, respirar, conversar com alguém..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="naoajudou">O que não ajudou?</Label>
            <Input
              id="naoajudou"
              value={notHelped}
              onChange={(e) => setNotHelped(e.target.value)}
              placeholder="ex: ficar no celular, pular refeição, cafeína demais..."
            />
          </div>
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending || limiteAtingido}>
          Salvar registro
        </Button>
        {limite !== null ? (
          <p className={`text-xs ${limiteAtingido ? "text-destructive" : "text-muted-foreground"}`}>
            Plano {access.label}: {entries.length}/{limite} registros salvos
            {limiteAtingido ? " — exclua um registro para salvar outro." : "."}
          </p>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">Padrões e autoconhecimento</h2>
        <Button
          variant="outline"
          onClick={() => {
            if (!access.canUseAI) {
              toast("Análise por IA disponível nos planos Premium e Owner.");
              return;
            }
            patterns.mutate();
          }}
          disabled={patterns.isPending}
        >
          <Sparkles className="size-4" />
          {patterns.isPending ? "Analisando..." : "Analisar meus registros"}
        </Button>
      </div>

      {insight ? (
        <div className="card-soft mt-3 space-y-3 p-5">
          {insight.padroes.map((p, i) => (
            <p key={i} className="text-sm">
              🔎 {p}
            </p>
          ))}
          {insight.o_que_ajuda.length ? (
            <div>
              <p className="text-xs font-semibold tracking-wide text-success uppercase">
                O que costuma ajudar você
              </p>
              <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                {insight.o_que_ajuda.map((h, i) => (
                  <li key={i}>• {h}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="text-sm font-medium">💡 {insight.sugestao}</p>
          <p className="text-xs text-muted-foreground">{insight.aviso}</p>
        </div>
      ) : null}

      <h2 className="mt-8 font-display text-lg font-semibold">Seus registros</h2>
      <div className="mt-3 space-y-3">
        {entries.length === 0 ? (
          <p className="card-soft p-6 text-center text-sm text-muted-foreground">
            Nenhum registro ainda.
          </p>
        ) : null}
        {entries.map((e) => (
          <article key={e.id} className="card-soft p-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">{MOODS.find((m) => m.v === e.mood)?.e}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(e.created_at).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Excluir registro"
                title="Excluir registro"
                className="ml-auto text-destructive hover:bg-destructive hover:text-destructive-foreground focus-visible:ring-destructive"
                onClick={() => remove.mutate(e.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            {e.feeling ? <p className="mt-2 text-sm font-medium">{e.feeling}</p> : null}
            {e.what_happened ? (
              <p className="mt-1 text-sm text-muted-foreground">{e.what_happened}</p>
            ) : null}
            {e.thoughts ? (
              <p className="mt-1 text-sm text-muted-foreground italic">"{e.thoughts}"</p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {e.helped ? (
                <span className="rounded-full bg-success/12 px-2 py-0.5 text-success">
                  ajudou: {e.helped}
                </span>
              ) : null}
              {e.not_helped ? (
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-destructive">
                  não ajudou: {e.not_helped}
                </span>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
