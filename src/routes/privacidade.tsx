import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { PRIVACY_NOTICE_VERSION } from "@/lib/privacy";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Privacidade e seus dados | OrganizaMente" },
      { name: "description", content: "Como o OrganizaMente trata seus dados pessoais: o que coletamos, para quê, com quem e por quanto tempo." },
      { property: "og:title", content: "Privacidade e seus dados | OrganizaMente" },
      { property: "og:description", content: "Transparência sobre o uso dos seus dados no OrganizaMente, conforme a LGPD." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacidade,
});

function Section({ t, children }: { t: string; children: React.ReactNode }) {
  return (
    <section className="card-soft space-y-2 p-5">
      <h2 className="font-display text-lg font-semibold">{t}</h2>
      <div className="space-y-2 text-sm text-muted-foreground">{children}</div>
    </section>
  );
}

function Privacidade() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Voltar
        </Link>
        <div className="ml-auto"><ThemeToggle /></div>
      </header>
      <main className="mx-auto max-w-3xl space-y-4 px-4 pb-16">
        <div className="flex items-center gap-3">
          <span className="bg-gradient-primary flex size-10 items-center justify-center rounded-xl text-primary-foreground">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold md:text-3xl">Privacidade e seus dados</h1>
            <p className="text-xs text-muted-foreground">Versão do aviso: {PRIVACY_NOTICE_VERSION}</p>
          </div>
        </div>

        <Section t="O que guardamos">
          <p>Seu e-mail e dados de login; suas tarefas, categorias, o que você escreve em "Minha cabeça" e no Diário (sentimentos, pensamentos e situações). Esses textos podem conter dados sensíveis de saúde, por isso recebem proteção reforçada.</p>
        </Section>
        <Section t="Quem pode ver">
          <p>Somente você. Cada registro é protegido no banco de dados para que apenas a própria conta consiga ler, alterar ou excluir. O administrador do portal <strong>não</strong> tem acesso ao conteúdo que você escreve — vê apenas e-mail, plano e datas de acesso, para administrar contas.</p>
        </Section>
        <Section t="Uso da inteligência artificial">
          <p>A IA é usada só quando você pede (organizar pensamentos, SOS ou analisar o diário). O texto é enviado ao Lovable AI, que repassa a um modelo da OpenAI apenas para gerar a resposta.</p>
          <p>A análise do Diário exige uma autorização separada e específica. Enviamos no máximo 10 registros dos últimos 30 dias, sem nome, e-mail ou identificador. Você pode revogar a qualquer momento em Meus dados.</p>
          <p>Os registros de consumo da IA guardam só a data, a função usada e a quantidade de tokens — nunca o texto.</p>
        </Section>
        <Section t="Por quanto tempo">
          <p>Tarefas, categorias e Diário ficam guardados até você apagar ou excluir sua conta. Os textos de "Minha cabeça" e as respostas da IA são apagados automaticamente após 180 dias.</p>
          <p>Cópias de segurança mantidas pela infraestrutura podem levar algum tempo para expirar; não prometemos remoção instantânea dessas cópias.</p>
        </Section>
        <Section t="Seus direitos (LGPD)">
          <p>Em <strong>Meus dados</strong> você pode baixar uma cópia de tudo, revogar autorizações e excluir sua conta. Correções podem ser feitas direto nas telas do portal.</p>
          <p>Para outros pedidos (acesso, correção ou dúvidas), escreva ao responsável pelo portal. Respondemos em até 15 dias.</p>
        </Section>
        <Section t="O que o portal não é">
          <p>O OrganizaMente não é serviço de saúde, não faz diagnóstico e não substitui profissionais. Em crise, procure ajuda profissional ou ligue para o CVV 188 (24h).</p>
        </Section>
      </main>
    </div>
  );
}
