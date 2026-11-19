import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const hasDb = Boolean(process.env.SUPABASE_DB_URL || process.env.PGHOST);

describe.skipIf(!hasDb)("segurança no banco (transação desfeita ao final)", () => {
  it("todas as verificações passam", () => {
    const args = ["-At", "-f", "tests/security/security.sql"];
    if (process.env.SUPABASE_DB_URL) args.unshift(process.env.SUPABASE_DB_URL);
    const out = execFileSync("psql", args, { encoding: "utf8" });
    const lines = out.split("\n").filter((l) => l.startsWith("PASS") || l.startsWith("FAIL"));
    console.log(lines.join("\n"));
    expect(lines.length).toBeGreaterThanOrEqual(20);
    expect(lines.filter((l) => l.startsWith("FAIL"))).toEqual([]);
  });
});
