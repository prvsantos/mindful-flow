import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAccess } from "@/hooks/use-access";
import { deletePortalUser, listPortalUsers, setPortalUserRole } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/acessos")({
  head: () => ({
    meta: [
      { title: "Acessos e perfis | OrganizaMente" },
      {
        name: "description",
        content:
          "Área do administrador do portal para atribuir ou remover os planos Lite e Premium dos usuários autenticados.",
      },
      { property: "og:title", content: "Acessos e perfis | OrganizaMente" },
      {
        property: "og:description",
        content: "Gerencie os planos Lite e Premium dos usuários do portal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Acessos,
});

const PLANOS = [
  { v: "lite" as const, l: "Lite" },
  { v: "premium" as const, l: "Premium" },
];

function Acessos() {
  const access = useAccess();
  const qc = useQueryClient();
  const fetchUsers = useServerFn(listPortalUsers);
  const saveRole = useServerFn(setPortalUserRole);

  const users = useQuery({
    queryKey: ["portal-users"],
    queryFn: () => fetchUsers(),
    enabled: access.isAdmin,
  });

  const mutate = useMutation({
    mutationFn: (v: { userId: string; role: "lite" | "premium" | null }) =>
      saveRole({ data: v }),
    onSuccess: () => {
      toast.success("Perfil atualizado.");
      qc.invalidateQueries({ queryKey: ["portal-users"] });
      qc.invalidateQueries({ queryKey: ["my-role"] });
    },
    onError: (e: Error) => toast.error(e.message || "Não consegui atualizar o perfil."),
  });

  const removeUser = useServerFn(deletePortalUser);
  const [toDelete, setToDelete] = useState<{ id: string; email: string } | null>(null);

  const del = useMutation({
    mutationFn: (userId: string) => removeUser({ data: { userId } }),
    onSuccess: () => {
      toast.success("Usuário e dados excluídos. Registro salvo nos logs.");
      setToDelete(null);
      qc.invalidateQueries({ queryKey: ["portal-users"] });
    },
    onError: (e: Error) => toast.error(e.message || "Não consegui excluir o usuário."),
  });


  if (!access.isAdmin) {
    return (
      <AppShell title="Acessos" subtitle="Área restrita ao administrador do portal.">
        <p className="card-soft p-5 text-sm text-muted-foreground">
          🔒 Esta página é exclusiva do administrador do portal.
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Acessos"
      subtitle="Atribua ou remova os planos Lite e Premium dos usuários autenticados."
    >
      {users.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando usuários...</p>
      ) : users.isError ? (
        <p className="text-sm text-destructive">Não consegui carregar a lista de usuários.</p>
      ) : (
        <ul className="space-y-3">
          {(users.data ?? []).map((u) => {
            const isOwner = u.role === "owner";
            return (
              <li
                key={u.id}
                className="card-soft flex flex-wrap items-center gap-3 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
              >
                <div className="min-w-[220px] flex-1">
                  <p className="flex items-center gap-2 font-medium">
                    {isOwner ? <ShieldCheck className="size-4 text-primary" /> : null}
                    {u.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Entrou por {u.provider === "google" ? "Google" : "conta local"} ·{" "}
                    {u.lastSignInAt
                      ? `último acesso em ${new Date(u.lastSignInAt).toLocaleDateString("pt-BR")}`
                      : "nunca acessou"}
                  </p>
                </div>

                {isOwner ? (
                  <span className="rounded-full bg-primary/12 px-2.5 py-1 text-[11px] font-semibold text-primary">
                    Administrador
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {PLANOS.map((p) => (
                      <button
                        key={p.v}
                        disabled={mutate.isPending}
                        onClick={() => mutate.mutate({ userId: u.id, role: p.v })}
                        className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 disabled:opacity-50 ${
                          u.role === p.v
                            ? "border-primary bg-primary text-primary-foreground shadow-md"
                            : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        }`}
                      >
                        {p.l}
                      </button>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={mutate.isPending || del.isPending}
                      onClick={() => setToDelete({ id: u.id, email: u.email })}
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground focus-visible:ring-destructive"
                    >
                      Remover
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => (o ? null : setToDelete(null))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir o usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.email} e todos os seus dados (tarefas, diário, categorias e anotações) serão
              apagados definitivamente. A exclusão fica registrada nos logs com data, hora e autor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={del.isPending}>Não</AlertDialogCancel>
            <AlertDialogAction
              disabled={del.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (toDelete) del.mutate(toDelete.id);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive"
            >
              {del.isPending ? "Excluindo..." : "Sim, excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
