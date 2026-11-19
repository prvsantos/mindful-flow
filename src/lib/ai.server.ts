import { generateChatCompletion, GatewayError } from "@lovable.dev/ai-gateway";

export const AI_MODEL = "openai/gpt-6.1-terra" as const;

export type AIResult = { text: string; inputTokens: number | null; outputTokens: number | null };

export async function askAI(system: string, user: string, maxOutputTokens: number): Promise<AIResult> {
  try {
    const res = await generateChatCompletion({
      model: AI_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_completion_tokens: maxOutputTokens,
    });
    const content = res.choices?.[0]?.message?.content;
    return {
      text: typeof content === "string" ? content : "",
      inputTokens: res.usage?.prompt_tokens ?? null,
      outputTokens: res.usage?.completion_tokens ?? null,
    };
  } catch (err) {
    // Nunca registrar o texto enviado: só o tipo do erro.
    if (err instanceof GatewayError) {
      console.error("[IA] falha", err.code, err.httpStatus);
      if (err.httpStatus === 429) throw new Error("Muitas solicitações agora. Tente de novo em instantes.");
      if (err.httpStatus === 402) throw new Error("A IA está temporariamente indisponível.");
    } else {
      console.error("[IA] falha inesperada");
    }
    throw new Error("Não consegui consultar a IA agora.");
  }
}

export function parseJson<T>(text: string, fallback: T): T {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as T;
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

export const SAFETY = `Você é o assistente do Portal OrganizaMente, feito para uma pessoa com TDAH.
Regras invioláveis:
- Você NÃO é psicólogo nem médico. Nunca faça diagnóstico, nunca sugira medicação, nunca interprete sintomas clinicamente.
- Você ajuda com organização, psicoeducação, estratégias comportamentais e regulação emocional, com base em práticas amplamente aceitas (TCC, ativação comportamental, GTD, técnica pomodoro, quebra de tarefas, higiene do sono, regulação por respiração).
- Se houver sinais de crise, risco à vida, autoagressão ou sofrimento intenso, oriente de forma acolhedora a procurar ajuda profissional e o CVV 188 (Brasil, 24h), sem alarmismo.
- Escreva em português do Brasil, direto, curto, sem enrolação e sem tom infantilizado.`;

type Ctx = { supabase: any };

const REASONS: Record<string, string> = {
  plan: "Esta função está disponível no plano Premium.",
  consent: "Para analisar seus registros, autorize antes o envio dos dados à IA.",
  disabled: "A IA está pausada pelo administrador no momento.",
  concurrent: "Já tem uma solicitação em andamento. Aguarde ela terminar.",
  interval: "Espere alguns segundos antes de pedir de novo.",
  daily: "Você atingiu o limite diário de uso da IA. Amanhã libera de novo.",
  monthly: "O limite mensal de uso da IA do portal foi atingido. O administrador já foi avisado.",
};

/** Valida perfil real, consentimento e limites no banco; só então chama a IA. */
export async function runGuardedAI(
  ctx: Ctx,
  feature: "organize" | "sos" | "patterns",
  system: string,
  user: string,
): Promise<string> {
  const { data, error } = await ctx.supabase.rpc("ai_begin_call", { _feature: feature });
  if (error || !data) throw new Error("Não consegui validar seu acesso à IA.");
  const gate = data as { ok: boolean; reason?: string; id?: string; max_output_tokens?: number };
  if (!gate.ok) throw new Error(REASONS[gate.reason ?? ""] ?? "Acesso à IA indisponível.");

  try {
    const r = await askAI(system, user, gate.max_output_tokens ?? 1200);
    await ctx.supabase.rpc("ai_finish_call", {
      _id: gate.id, _status: "ok", _model: AI_MODEL,
      _in: r.inputTokens, _out: r.outputTokens, _cost: null,
    });
    return r.text;
  } catch (e) {
    await ctx.supabase.rpc("ai_finish_call", {
      _id: gate.id, _status: "error", _model: AI_MODEL, _in: null, _out: null, _cost: null,
    });
    throw e;
  }
}
