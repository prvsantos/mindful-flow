/**
 * Testes de segurança contra a API real do banco, com sessões verdadeiras.
 * Requer: SEC_USER_SESSION (conta Lite descartável) e SEC_ADMIN_SESSION (arquivos JSON de sessão),
 * VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY. Sem eles, os testes são pulados.
 */
import { readFileSync, existsSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const URL_ = process.env.VITE_SUPABASE_URL ?? "";
const KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";
const userFile = process.env.SEC_USER_SESSION ?? "";
const adminFile = process.env.SEC_ADMIN_SESSION ?? "";
const ready = Boolean(URL_ && KEY && existsSync(userFile) && existsSync(adminFile));

const load = (f: string) => JSON.parse(readFileSync(f, "utf8")) as { user_id: string; session: { access_token: string } };

async function api(token: string | null, path: string, init: RequestInit = {}) {
  const headers: Record<string, string> = { apikey: KEY, "Content-Type": "application/json", Prefer: "return=representation" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${URL_}/rest/v1/${path}`, { ...init, headers: { ...headers, ...(init.headers as object) } });
  const text = await res.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { status: res.status, body };
}
const rpc = (t: string | null, fn: string, args: object = {}) => api(t, `rpc/${fn}`, { method: "POST", body: JSON.stringify(args) });

describe.skipIf(!ready)("segurança e autorização (API real)", () => {
  let A: string, ADMIN: string, aId: string, adminId: string;
  let adminTaskId: string | null = null;
  let original: any;

  beforeAll(async () => {
    const a = load(userFile), ad = load(adminFile);
    A = a.session.access_token; aId = a.user_id;
    ADMIN = ad.session.access_token; adminId = ad.user_id;
    await rpc(A, "sync_my_role");
    await rpc(ADMIN, "sync_my_role");
    const t = await api(ADMIN, "tasks", { method: "POST", body: JSON.stringify({ title: "teste-seguranca", area: "pessoal" }) });
    adminTaskId = t.body?.[0]?.id ?? null;
    original = (await api(ADMIN, "ai_settings?id=eq.1&select=*")).body?.[0];
  });

  afterAll(async () => {
    if (adminTaskId) await api(ADMIN, `tasks?id=eq.${adminTaskId}`, { method: "DELETE" });
    if (original) {
      const { id, updated_at, ...rest } = original;
      await api(ADMIN, "ai_settings?id=eq.1", { method: "PATCH", body: JSON.stringify(rest) });
    }
    await api(ADMIN, `user_roles?user_id=eq.${aId}&role=eq.premium`, { method: "DELETE" });
  });

  it("usuário A não lê, altera nem apaga dados de outra conta", async () => {
    expect((await api(A, `tasks?user_id=neq.${aId}&select=id`)).body).toEqual([]);
    expect((await api(A, `journal_entries?user_id=neq.${aId}&select=id`)).body).toEqual([]);
    expect((await api(A, `tasks?id=eq.${adminTaskId}`, { method: "PATCH", body: JSON.stringify({ title: "x" }) })).body).toEqual([]);
    expect((await api(A, `tasks?id=eq.${adminTaskId}`, { method: "DELETE" })).body).toEqual([]);
  });

  it("A não grava registros em nome de outra conta", async () => {
    const r = await api(A, "tasks", { method: "POST", body: JSON.stringify({ user_id: adminId, title: "forjada", area: "pessoal" }) });
    expect(r.status).toBeGreaterThanOrEqual(400);
  });

  it("A não associa tarefa a categoria que não é dele", async () => {
    const r = await api(A, "tasks", { method: "POST", body: JSON.stringify({ title: "x", area: "categoria-de-outro" }) });
    expect(r.status).toBeGreaterThanOrEqual(400);
  });

  it("A não se concede Premium nem vira administrador", async () => {
    expect((await api(A, "user_roles", { method: "POST", body: JSON.stringify({ user_id: aId, role: "premium" }) })).status).toBeGreaterThanOrEqual(400);
    expect((await api(A, `user_roles?user_id=eq.${aId}`, { method: "PATCH", body: JSON.stringify({ role: "owner" }) })).body).toEqual([]);
    expect((await rpc(A, "my_effective_role")).body).toBe("lite");
  });

  it("Lite não usa a IA, nem chamando o banco direto", async () => {
    expect((await rpc(A, "ai_begin_call", { _feature: "organize" })).body).toMatchObject({ ok: false, reason: "plan" });
    expect((await api(A, "ai_usage", { method: "POST", body: JSON.stringify({ feature: "organize" }) })).status).toBeGreaterThanOrEqual(400);
  });

  it("Lite: limites de 3 tarefas por categoria, 4 no diário e 2 categorias próprias", async () => {
    for (let i = 0; i < 3; i++) await api(A, "tasks", { method: "POST", body: JSON.stringify({ title: `t${i}`, area: "pessoal" }) });
    expect((await api(A, "tasks", { method: "POST", body: JSON.stringify({ title: "t4", area: "pessoal" }) })).status).toBeGreaterThanOrEqual(400);
    for (let i = 0; i < 4; i++) await api(A, "journal_entries", { method: "POST", body: JSON.stringify({ mood: 3 }) });
    expect((await api(A, "journal_entries", { method: "POST", body: JSON.stringify({ mood: 3 }) })).status).toBeGreaterThanOrEqual(400);
    await api(A, "categories", { method: "POST", body: JSON.stringify([{ slug: "c1", label: "C1" }, { slug: "c2", label: "C2" }]) });
    expect((await api(A, "categories", { method: "POST", body: JSON.stringify({ slug: "c3", label: "C3" }) })).status).toBeGreaterThanOrEqual(400);
  });

  it("só o administrador vê o resumo de consumo e a configuração da IA", async () => {
    expect((await rpc(A, "ai_usage_summary")).status).toBeGreaterThanOrEqual(400);
    expect((await api(A, "ai_settings?select=*")).body).toEqual([]);
    expect((await api(A, "app_config?select=*")).status).toBeGreaterThanOrEqual(400);
  });

  it("administrador não lê o conteúdo pessoal de outra conta", async () => {
    expect((await api(ADMIN, `journal_entries?user_id=eq.${aId}&select=id`)).body).toEqual([]);
    expect((await api(ADMIN, `tasks?user_id=eq.${aId}&select=id`)).body).toEqual([]);
    expect((await api(ADMIN, `brain_dumps?user_id=eq.${aId}&select=id`)).body).toEqual([]);
  });

  it("sem login, nada de dados privados nem IA", async () => {
    expect((await api(null, "journal_entries?select=id")).status).toBeGreaterThanOrEqual(400);
    expect((await api(null, "tasks?select=id")).status).toBeGreaterThanOrEqual(400);
    expect((await rpc(null, "ai_begin_call", { _feature: "organize" })).status).toBeGreaterThanOrEqual(400);
  });

  it("Premium: sem consentimento, ou revogado, o diário não vai para a IA", async () => {
    expect((await api(ADMIN, "user_roles", { method: "POST", body: JSON.stringify({ user_id: aId, role: "premium" }) })).status).toBeLessThan(300);
    await api(ADMIN, `user_roles?user_id=eq.${aId}&role=eq.lite`, { method: "DELETE" });
    expect((await rpc(A, "ai_begin_call", { _feature: "patterns" })).body).toMatchObject({ reason: "consent" });
    await api(A, "user_consents", { method: "POST", body: JSON.stringify({ purpose: "ai_journal_patterns", granted: true, notice_version: "test" }) });
    await api(A, "user_consents", { method: "POST", body: JSON.stringify({ purpose: "ai_journal_patterns", granted: false, notice_version: "test" }) });
    expect((await rpc(A, "ai_begin_call", { _feature: "patterns" })).body).toMatchObject({ reason: "consent" });
  });

  it("limites da IA: simultânea, intervalo, diário por pessoa e teto mensal", async () => {
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    const used = (await api(A, `ai_usage?select=id&status=neq.blocked&created_at=gte.${today.toISOString()}`)).body.length;
    await api(ADMIN, "ai_settings?id=eq.1", { method: "PATCH", body: JSON.stringify({ daily_limit_per_user: used + 1, min_interval_seconds: 0 }) });
    const first = await rpc(A, "ai_begin_call", { _feature: "organize" });
    expect(first.body).toMatchObject({ ok: true });
    expect((await rpc(A, "ai_begin_call", { _feature: "organize" })).body).toMatchObject({ reason: "concurrent" });
    await rpc(A, "ai_finish_call", { _id: first.body.id, _status: "error", _model: "teste", _in: null, _out: null, _cost: null });
    expect((await rpc(A, "ai_begin_call", { _feature: "organize" })).body).toMatchObject({ reason: "daily" });
    await api(ADMIN, "ai_settings?id=eq.1", { method: "PATCH", body: JSON.stringify({ daily_limit_per_user: 100, monthly_global_limit: 0 }) });
    expect((await rpc(A, "ai_begin_call", { _feature: "organize" })).body).toMatchObject({ reason: "monthly" });
  });
});
