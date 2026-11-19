import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type OrganizedPlan = {
  resumo: string;
  proximo_passo: string;
  tarefas: Array<{
    titulo: string;
    area: "pessoal" | "trabalho" | "outros";
    prioridade: "alta" | "media" | "baixa";
    porque: string;
  }>;
  observacoes: string[];
};

export type SosPlan = {
  acolhimento: string;
  respiro: string;
  micro_passo: string;
  adiar: string[];
  lembrete: string;
};

export type PatternInsight = {
  padroes: string[];
  o_que_ajuda: string[];
  sugestao: string;
  aviso: string;
};

export const organizeThoughts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ text: z.string().min(5).max(6000) }).parse(d))
  .handler(async ({ data, context }): Promise<OrganizedPlan> => {
    const { runGuardedAI, parseJson, SAFETY } = await import("./ai.server");
    const raw = await runGuardedAI(context, "organize",
      `${SAFETY}
Tarefa: transformar um despejo mental desorganizado em um plano objetivo.
Responda SOMENTE com JSON válido no formato:
{"resumo":"1 frase","proximo_passo":"a única coisa a fazer agora, em até 15 min","tarefas":[{"titulo":"","area":"pessoal|trabalho|outros","prioridade":"alta|media|baixa","porque":"1 frase curta"}],"observacoes":["até 3 observações práticas"]}
Máximo de 8 tarefas. Títulos curtos e acionáveis, começando com verbo.`,
      data.text,
    );
    return parseJson<OrganizedPlan>(raw, {
      resumo: "Não consegui organizar agora.",
      proximo_passo: "Escolha um item da sua lista e faça por 10 minutos.",
      tarefas: [],
      observacoes: [],
    });
  });

export const sosOrganize = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ text: z.string().min(3).max(4000) }).parse(d))
  .handler(async ({ data, context }): Promise<SosPlan> => {
    const { runGuardedAI, parseJson, SAFETY } = await import("./ai.server");
    const raw = await runGuardedAI(context, "sos",
      `${SAFETY}
Tarefa: a pessoa está sobrecarregada AGORA. Conduza uma sequência curtíssima de regulação, sem perguntas extras.
Responda SOMENTE com JSON válido:
{"acolhimento":"1 a 2 frases validando, sem clichê","respiro":"uma instrução concreta de 60 segundos (respiração/corpo/ambiente)","micro_passo":"1 ação de no máximo 5 minutos","adiar":["2 a 4 coisas que podem esperar até amanhã"],"lembrete":"1 frase de encerramento realista"}`,
      data.text,
    );
    return parseJson<SosPlan>(raw, {
      acolhimento: "Faz sentido estar sobrecarregado com tudo isso junto.",
      respiro: "Respire 4 segundos inspirando, 6 soltando, por 1 minuto.",
      micro_passo: "Escreva em uma linha só a coisa mais urgente e faça 5 minutos dela.",
      adiar: [],
      lembrete: "Você não precisa resolver tudo hoje.",
    });
  });

export const findPatterns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PatternInsight> => {
    const { runGuardedAI, parseJson, SAFETY } = await import("./ai.server");
    // Consentimento conferido antes de ler qualquer registro.
    const { data: consent } = await context.supabase.rpc("has_consent", { _purpose: "ai_journal_patterns" });
    if (!consent) throw new Error("Para analisar seus registros, autorize antes o envio dos dados à IA.");
    // Minimização: só os 10 registros mais recentes dos últimos 30 dias, sem identificadores.
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const { data: rows } = await context.supabase
      .from("journal_entries")
      .select("created_at, mood, energy, feeling, what_happened, thoughts, helped, not_helped")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(10);
    const entries = (rows ?? []).map((e: any) => ({ ...e, created_at: String(e.created_at).slice(0, 10) }));

    if (!entries || entries.length < 2) {
      return {
        padroes: [],
        o_que_ajuda: [],
        sugestao: "Registre pelo menos 2 dias no diário (nos últimos 30 dias) para eu conseguir apontar padrões.",
        aviso: "Isto não é avaliação clínica.",
      };
    }

    const raw = await runGuardedAI(
      context,
      "patterns",
      `${SAFETY}
Tarefa: identificar PADRÕES observáveis nos registros de diário. Nada de diagnóstico, nada de rótulos clínicos.
Responda SOMENTE com JSON válido:
{"padroes":["até 4 observações no formato 'nos dias em que X, você relatou Y'"],"o_que_ajuda":["até 3 coisas que a própria pessoa disse que ajudaram"],"sugestao":"1 experimento simples para a próxima semana","aviso":"1 frase lembrando que isto é autoconhecimento, não avaliação clínica"}`,
      JSON.stringify(entries),
    );
    return parseJson<PatternInsight>(raw, {
      padroes: [],
      o_que_ajuda: [],
      sugestao: "Tente registrar por mais alguns dias.",
      aviso: "Isto é apoio ao autoconhecimento, não avaliação clínica.",
    });
  });