import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Download, ShieldOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAIPatternsConsent } from "@/hooks/use-consent";
import { useAccess } from "@/hooks/use-access";
import { deleteMyAccount } from "@/lib/account.functions";
import { VIEW_AS_STORAGE_KEY } from "@/lib/privacy";

export const Route = createFileRoute("/_authenticated/meus-dados")({
  head: () => ({
    meta: [
      { title: "Meus dados | OrganizaMente" },
      { name: "description", content: "Baixe uma cópia dos seus dados, revogue autorizações e exclua sua conta." },
      { property: "og:title", content: "Meus dados | OrganizaMente" },
      { property: "og:description", content: "Controle total sobre seus dados pessoais no OrganizaMente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MeusDados,
});

function MeusDados() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const access = useAccess();
  const consent = useAIPatternsConsent();
  const removeAccount = useServerFn(deleteMyAccount);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);

  async function exportar() {
    const tables = ["tasks", "categories", "journal_entries", "brain_dumps", "user_consents", "ai_usage"] as const;
    const out: Record<string, unknown> = { exportado_em: new Date().toISOString() };
    for (const t of tables) {
      const { data } = await supabase.from(t).select("*");
      out[t] = data ?? [];
    }
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `organizamente-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function excluir() {
    setBusy(true);
    try {
      await removeAccount({ data: { confirm: "EXCLUIR" } });
      qc.clear();
      window.localStorage.removeItem(VIEW_AS_STORAGE_KEY);
      await supabase.auth.signOut();
      toast.success("Sua conta e todos os seus dados foram excluídos.");
      navigate({ to: "/auth", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não consegui excluir agora.");
      setBusy(false);
    }
  }

  return (
    <AppShell title="Meus dados" subtitle="Seus dados são seus. Aqui você decide o que fazer com eles.">
      <div className="space-y-4">
        <div className="card-soft p-5">
          <h2 className="font-display text-lg font-semibold">Baixar uma cópia</h2>
          <p className="mt-1 text-sm text-muted-foreground">Tarefas, categorias, diário, "Minha cabeça", autorizações e uso da IA, em um arquivo.</p>
          <Button className="mt-3 w-auto" variant="outline" onClick={exportar}><Download className="size-4" /> Baixar meus dados</Button>
        </div>

        <div className="card-soft p-5">
          <h2 className="font-display text-lg font-semibold">Autorização da IA no Diário</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {consent.granted
              ? `Autorizada em ${new Date(consent.record!.created_at).toLocaleString("pt-BR")}.`
              : "Não autorizada. Nenhum registro do diário é enviado à IA."}
          </p>
          {consent.granted ? (
            <Button className="mt-3 w-auto text-destructive hover:bg-destructive hover:text-destructive-foreground" variant="outline"
              onClick={async () => { await consent.set.mutateAsync(false); toast.success("Autorização revogada."); }}>
              <ShieldOff className="size-4" /> Revogar autorização
            </Button>
          ) : null}
          <p className="mt-3 text-xs text-muted-foreground"><Link to="/privacidade" className="underline">Como seus dados são usados</Link></p>
        </div>

        {access.realRole !== "owner" ? (
          <div className="card-soft border-destructive/40 p-5">
            <h2 className="font-display text-lg font-semibold text-destructive">Excluir minha conta</h2>
            <p className="mt-1 text-sm text-muted-foreground">Remove sua conta e todos os seus registros permanentemente.</p>
            <Button className="mt-3 w-auto" variant="destructive" onClick={() => setOpen(true)}><Trash2 className="size-4" /> Excluir minha conta</Button>
          </div>
        ) : null}
      </div>

      <AlertDialog open={open} onOpenChange={(v) => { setOpen(v); setTyped(""); }}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir sua conta para sempre?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os seus dados (tarefas, categorias, diário, "Minha cabeça" e autorizações) serão removidos
              permanentemente e <strong>não será possível restaurar</strong> depois da confirmação. Digite EXCLUIR para confirmar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="EXCLUIR" aria-label="Digite EXCLUIR" />
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel className="w-auto">Não, manter</AlertDialogCancel>
            <Button variant="destructive" className="w-auto" disabled={typed !== "EXCLUIR" || busy} onClick={excluir}>
              {busy ? "Excluindo..." : "Sim, excluir tudo"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
