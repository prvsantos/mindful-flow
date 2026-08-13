const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

export async function askAI(system: string, user: string): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("IA indisponível no momento.");

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-3.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (res.status === 429) throw new Error("Muitas solicitações agora. Tente de novo em instantes.");
  if (!res.ok) throw new Error(`Falha ao consultar a IA (${res.status}).`);

  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content ?? "";
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
