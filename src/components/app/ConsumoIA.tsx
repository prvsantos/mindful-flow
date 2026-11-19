import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { AlertTriangle, Gauge } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getAIUsage, updateAISettings } from "@/lib/admin.functions";

export function ConsumoIA() {
  const qc = useQueryClient();
  const fetchUsage = useServerFn(getAIUsage);
  const save = useServerFn(updateAISettings);
  const q = useQuery({ queryKey: ["ai-usage"], queryFn: () => fetchUsage() });
  const [form, setForm] = useState({ enabled: true, daily_limit_per_user: 20, monthly_global_limit: 1000, max_output_tokens: 1200 });

  useEffect(() => {
    if (q.data) {
      const s = q.data.settings;
      setForm({ enabled: s.enabled, daily_limit_per_user: s.daily_limit_per_user, monthly_global_limit: s.monthly_global_limit, max_output_tokens: s.max_output_tokens });
    }
  }, [q.data]);

  const m = useMutation({
    mutationFn: () => save({ data: form }),
    onSuccess: () => { toast.success("Limites salvos."); qc.invalidateQueries({ queryKey: ["ai-usage"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Não consegui salvar."),
  });

  if (q.isLoading) return <p className="text-sm text-muted-foreground">Carregando consumo da IA...</p>;
  if (!q.data) return <p className="text-sm text-destructive">Não consegui carregar o consumo da IA.</p>;
  const d = q.data;
  const pct = d.settings.monthly_global_limit ? Math.round((d.month / d.settings.monthly_global_limit) * 100) : 100;
  const alerta = pct >= d.settings.alert_threshold_pct;

  return (
    <div className="card-soft space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Gauge className="size-5 text-primary" />
        <p className="font-medium">Consumo da IA</p>
      </div>
      {alerta ? (
        <p className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="size-4" />
          {pct >= 100 ? "Teto mensal atingido: novas chamadas estão bloqueadas." : `Atenção: ${pct}% do teto mensal já foi usado.`}
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <Stat l="Hoje" v={d.today} />
        <Stat l={`Mês (${pct}%)`} v={`${d.month}/${d.settings.monthly_global_limit}`} />
        <Stat l="Erros no mês" v={d.month_errors} />
        <Stat l="Tokens no mês" v={`${d.month_tokens_in + d.month_tokens_out}`} />
      </div>
      <p className="text-xs text-muted-foreground">
        Contagem feita pelo próprio portal, sem textos. O custo oficial em créditos está na tela de uso da Lovable.
      </p>
      {d.by_user.length ? (
        <ul className="space-y-1 text-sm">
          {d.by_user.map((u, i) => (
            <li key={i} className="flex justify-between"><span>{u.email ?? "(conta removida)"}</span><span className="text-muted-foreground">{u.calls} chamadas</span></li>
          ))}
        </ul>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <Field l="Por pessoa/dia" v={form.daily_limit_per_user} on={(n) => setForm({ ...form, daily_limit_per_user: n })} />
        <Field l="Teto mensal do portal" v={form.monthly_global_limit} on={(n) => setForm({ ...form, monthly_global_limit: n })} />
        <Field l="Tamanho máx. da resposta (tokens)" v={form.max_output_tokens} on={(n) => setForm({ ...form, max_output_tokens: n })} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} /> IA ligada
        </label>
        <Button className="w-auto" onClick={() => m.mutate()} disabled={m.isPending}>Salvar limites</Button>
      </div>
    </div>
  );
}

function Stat({ l, v }: { l: string; v: string | number }) {
  return (
    <div className="rounded-lg bg-secondary/60 p-3">
      <p className="text-xs text-muted-foreground">{l}</p>
      <p className="font-display text-lg font-semibold">{v}</p>
    </div>
  );
}

function Field({ l, v, on }: { l: string; v: number; on: (n: number) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{l}</Label>
      <Input type="number" min={0} value={v} onChange={(e) => on(Number(e.target.value) || 0)} />
    </div>
  );
}
