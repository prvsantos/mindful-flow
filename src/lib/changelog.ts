export type ChangeType = "novidade" | "seguranca" | "correcao";

export type ChangeEntry = {
  data: string; // ISO com hora
  tipo: ChangeType;
  titulo: string;
  detalhe: string;
};

export const CHANGE_TYPES: Record<ChangeType, { label: string; emoji: string; chip: string }> = {
  novidade: {
    label: "Novidades & Melhorias",
    emoji: "✨",
    chip: "bg-primary/12 text-primary",
  },
  seguranca: {
    label: "Segurança & Planos",
    emoji: "🔒",
    chip: "bg-blue-500/12 text-blue-600 dark:text-blue-300",
  },
  correcao: {
    label: "Correções e Bugs",
    emoji: "🛠️",
    chip: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  },
};

/** Histórico do portal — mais recente primeiro. */
export const CHANGELOG: ChangeEntry[] = [
  {
    data: "2026-08-29T00:05:00-03:00",
    tipo: "novidade",
    titulo: "Modo de teste de perfis e logs com autor",
    detalhe:
      "No menu Acessos o administrador escolhe navegar como Admin, Premium ou Lite para conferir o portal do jeito que cada pessoa vê — e os botões continuam ativos mesmo no modo Lite, dá para voltar quando quiser. Os arquivos de log agora mostram quem fez cada alteração.",
  },
  {

    data: "2026-08-29T00:20:00-03:00",
    tipo: "novidade",
    titulo: "Histórico completo e pasta de logs do portal",
    detalhe:
      "O menu Atualizações passou a registrar todos os ajustes feitos no portal, inclusive os mais recentes. Também criamos a pasta /logs, com um arquivo por dia (dd.mm.aaaa.txt) e outro só para erros (dd.mm.aaaa_error.txt), num formato simples de ler.",
  },
  {
    data: "2026-08-28T22:40:00-03:00",
    tipo: "novidade",
    titulo: "Textos mais leves e acolhedores",
    detalhe:
      "Revisamos as frases do portal para soar mais natural: novo subtítulo em Minha cabeça, convite da IA no Premium, mensagens do Diário e de Categorias, e o badge do administrador simplificado.",
  },
  {
    data: "2026-08-27T21:15:00-03:00",
    tipo: "seguranca",
    titulo: "Perfil automático e registro de exclusões",
    detalhe:
      "Novas contas já entram como Lite e o perfil é reconhecido sozinho a cada acesso, sem limpar cache. O e-mail do administrador fica fixo e toda exclusão de usuário passa por confirmação e fica registrada com data, hora e autor.",
  },
  {
    data: "2026-08-26T15:30:00-03:00",
    tipo: "seguranca",
    titulo: "Menu Acessos e ajuste dos planos Lite e Premium",
    detalhe:
      "O Owner virou perfil de administrador (não é plano) e agora gerencia os planos Lite e Premium dos usuários no novo menu Acessos. Atualizações passou a ser exclusivo do administrador, a análise do Diário ficou restrita ao Premium e a Homepage e os Guias ganharam botão de sair.",
  },


  {
    data: "2026-08-24T16:30:00-03:00",
    tipo: "seguranca",
    titulo: "Perfis de acesso Owner, Premium e Lite",
    detalhe:
      "Cada conta passa a ter um perfil com limites próprios de tarefas, diário, categorias, tema e uso da IA.",
  },
  {
    data: "2026-08-24T16:20:00-03:00",
    tipo: "novidade",
    titulo: "Menu Categorias com cor e ícone",
    detalhe:
      "Criação e edição das categorias (Pessoal, Trabalho, Outros e novas), escolhendo cor e ícone de cada uma.",
  },
  {
    data: "2026-08-24T16:10:00-03:00",
    tipo: "novidade",
    titulo: "Menu Início e menu Atualizações",
    detalhe:
      "Atalho para voltar à homepage e esta página com todo o histórico de novidades, segurança e correções.",
  },
  {
    data: "2026-08-24T16:00:00-03:00",
    tipo: "correcao",
    titulo: "Botões de excluir sempre em vermelho",
    detalhe:
      "Ações destrutivas e de atenção ganharam destaque vermelho no estado normal, no hover e ao clicar.",
  },
  {
    data: "2026-08-23T15:40:00-03:00",
    tipo: "seguranca",
    titulo: "Auditoria de segurança e script do banco",
    detalhe:
      "Credenciais isoladas no servidor, RLS revisado, limites de conteúdo no banco e documentação completa criada.",
  },
  {
    data: "2026-08-22T18:10:00-03:00",
    tipo: "novidade",
    titulo: "Tema escuro metálico preto/azul/roxo",
    detalhe:
      "Novo degradê de fundo com acabamento metálico nos cards, ícone do Google no login e logo voltando à homepage.",
  },
  {
    data: "2026-08-21T17:25:00-03:00",
    tipo: "correcao",
    titulo: "Modo escuro aplicado em todas as telas",
    detalhe:
      "Fundo, contraste e botões corrigidos em /auth, homepage e guias, com botão de tema em todas as páginas.",
  },
  {
    data: "2026-08-20T14:05:00-03:00",
    tipo: "novidade",
    titulo: "Login como tela principal e homepage pós-login",
    detalhe:
      "Boas-vindas ao OrganizaMente, efeitos de hover nos cards, novo subtítulo em Minha cabeça e diário com perguntas e exemplos.",
  },
  {
    data: "2026-08-19T10:00:00-03:00",
    tipo: "novidade",
    titulo: "Lançamento do Portal OrganizaMente",
    detalhe:
      "Organizar tarefas, descarga mental com IA, diário flexível e guias práticos baseados em evidências.",
  },
];

export function formatChangeDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
