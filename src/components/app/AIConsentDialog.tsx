import { Link } from "@tanstack/react-router";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function AIConsentDialog({
  open, onOpenChange, onAccept, onDecline,
}: { open: boolean; onOpenChange: (v: boolean) => void; onAccept: () => void; onDecline: () => void }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Autorizar a análise do seu diário?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Para apontar padrões, enviamos à IA (Lovable AI, que usa um modelo da OpenAI):</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>até 10 registros dos últimos 30 dias;</li>
                <li>humor, energia e os textos que você escreveu;</li>
                <li>só a data — sem nome, e-mail ou identificador.</li>
              </ul>
              <p>Finalidade: só gerar a análise que você pediu. O resultado aparece na tela e não é salvo.</p>
              <p>Você pode revogar quando quiser em <strong>Meus dados</strong>. <Link to="/privacidade" className="underline">Ver privacidade</Link>.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel onClick={onDecline} className="w-auto text-destructive hover:bg-destructive hover:text-destructive-foreground">
            Não autorizo
          </AlertDialogCancel>
          <AlertDialogAction onClick={onAccept} className="w-auto">Autorizo</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
