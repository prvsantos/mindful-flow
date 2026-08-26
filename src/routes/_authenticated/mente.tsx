import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Brain, LifeBuoy, Plus, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/AppShell";
import { useAccess } from "@/hooks/use-access";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { organizeThoughts, sosOrganize } from "@/lib/ai.functions";
import type { OrganizedPlan, SosPlan } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/mente")({
  component: Mente,
});

function Mente() {
  const qc = useQueryClient();
  const access = useAccess();
  const [tab, setTab] = useState<"dump" | "sos">("dump");
  const [dump, setDump] = useState("");
  const [sos, setSos] = useState("");
  const [plano, setPlano] = useState<OrganizedPlan | null>(null);
  const [socorro, setSocorro] = useState<SosPlan | null>(null);

  const organizar = useServerFn(organizeThoughts);
  const socorrer = useServerFn(sosOrganize);

  const runDump = useMutation({
    mutationFn: async () => {
      const result = await organizar({ data: { text: dump } });
      const { data: u } = await supabase.auth.getUser();
      await supabase.from("brain_dumps").insert({
        user_id: u.user!.id,
        kind: "dump",
        raw_text: dump,
        ai_result: result,
      });
      return result;
    },
    onSuccess: (r) => setPlano(r),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Não consegui organizar agora."),
  });

  const runSos = useMutation({
    mutationFn: async () => {
      const result = await socorrer({ data: { text: sos } });
      const { data: u } = await supabase.auth.getUser();
      await supabase.from("brain_dumps").insert({
        user_id: u.user!.id,
        kind: "sos",
        raw_text: sos,
        ai_result: result,
      });
      return result;
    },
    onSuccess: (r) => setSocorro(r),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Não consegui responder agora."),
  });

  const addTask = useMutation({
    mutationFn: async (t: OrganizedPlan["tarefas"][number]) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("tasks").insert({
        user_id: u.user!.id,
        title: t.titulo,
        area: t.area,
        priority: t.prioridade,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Adicionado às suas atividades.");
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  return (
    <AppShell
      title="Minha cabeça está uma bagunça"
      subtitle="Escreva do jeito que quiser. A organização é comigo."
    >
      {!access.canUseAI ? (
        <div className="card-soft mb-4 border-primary/40 p-5">
          <p className="font-display text-lg font-semibold">
            🔒 A ajuda da IA é exclusiva dos plano Premium
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            No plano {access.label} você continua usando o menu Organizar e o Diário normalmente.
            Para transformar a bagunça da cabeça em plano automaticamente, faça upgrade.
          </p>
        </div>
      ) : null}

      <div className={`flex gap-2 ${access.canUseAI ? "" : "pointer-events-none opacity-50"}`}>
        <button
          onClick={() => setTab("dump")}
          className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 ${
            tab === "dump"
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-card border border-border hover:border-primary/50"
          }`}
        >
          <Brain className="size-4" /> Descarregar
        </button>
        <button
          onClick={() => setTab("sos")}
          className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 ${
            tab === "sos"
              ? "bg-destructive text-destructive-foreground shadow-md"
              : "bg-card border border-border hover:border-destructive/50"
          }`}
        >
          <LifeBuoy className="size-4" /> Preciso me organizar agora
        </button>
      </div>

      {!access.canUseAI ? null : tab === "dump" ? (
        <div className="mt-4 space-y-4">
          <div className="card-soft p-4">
            <Textarea
              rows={7}
              value={dump}
              onChange={(e) => setDump(e.target.value)}
              placeholder="Tenho que terminar aquele negócio do trabalho, preciso comprar ração, não respondi o fulano, marcar o carro..."
              className="resize-none text-base"
            />
            <Button
              className="mt-3"
              disabled={dump.trim().length < 5 || runDump.isPending}
              onClick={() => runDump.mutate()}
            >
              <Wand2 className="size-4" />
              {runDump.isPending ? "Organizando..." : "Organizar para mim"}
            </Button>
          </div>

          {plano ? (
            <div className="space-y-3">
              <div className="card-soft border-primary/40 p-4">
                <p className="text-sm text-muted-foreground">{plano.resumo}</p>
                <p className="mt-2 font-display text-lg font-semibold">
                  👉 Próximo passo: {plano.proximo_passo}
                </p>
              </div>
              {plano.tarefas.map((t, i) => (
                <div key={i} className="card-soft flex items-start gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{t.titulo}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{t.porque}</p>
                    <div className="mt-2 flex gap-1.5 text-[11px] font-medium text-muted-foreground">
                      <span className="rounded-full bg-muted px-2 py-0.5">{t.area}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5">{t.prioridade}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => addTask.mutate(t)}>
                    <Plus className="size-4" /> Adicionar
                  </Button>
                </div>
              ))}
              {plano.observacoes.length ? (
                <ul className="card-soft space-y-2 p-4 text-sm text-muted-foreground">
                  {plano.observacoes.map((o, i) => (
                    <li key={i}>• {o}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="card-soft border-destructive/30 p-4">
            <Textarea
              rows={5}
              value={sos}
              onChange={(e) => setSos(e.target.value)}
              placeholder="Estou irritado, não consigo focar e tenho várias coisas na cabeça. Não sei por onde começar."
              className="resize-none text-base"
            />
            <Button
              variant="destructive"
              className="mt-3"
              disabled={sos.trim().length < 3 || runSos.isPending}
              onClick={() => runSos.mutate()}
            >
              <LifeBuoy className="size-4" />
              {runSos.isPending ? "Respira, já volto..." : "Me ajude agora"}
            </Button>
          </div>

          {socorro ? (
            <div className="space-y-3">
              <div className="card-soft p-4">
                <p>{socorro.acolhimento}</p>
              </div>
              <div className="card-soft border-calm/40 p-4">
                <p className="text-xs font-semibold tracking-wide text-calm uppercase">1 minuto</p>
                <p className="mt-1">{socorro.respiro}</p>
              </div>
              <div className="card-soft border-success/40 p-4">
                <p className="text-xs font-semibold tracking-wide text-success uppercase">
                  Micro passo
                </p>
                <p className="mt-1 font-medium">{socorro.micro_passo}</p>
              </div>
              {socorro.adiar.length ? (
                <div className="card-soft p-4">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Pode esperar
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {socorro.adiar.map((a, i) => (
                      <li key={i}>• {a}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <p className="px-1 text-sm text-muted-foreground">{socorro.lembrete}</p>
            </div>
          ) : null}

          <p className="px-1 text-xs text-muted-foreground">
            Se o sofrimento estiver muito intenso ou houver risco, procure ajuda profissional. No
            Brasil, o CVV atende 24h pelo 188.
          </p>
        </div>
      )}
    </AppShell>
  );
}