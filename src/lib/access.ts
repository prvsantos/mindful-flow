export type Role = "owner" | "premium" | "lite";

export type Access = {
  role: Role;
  label: string;
  /** Tarefas por categoria no menu Organizar (null = ilimitado) */
  maxTasksPerCategory: number | null;
  /** Registros no Diário (null = ilimitado) */
  maxJournalEntries: number | null;
  /** Categorias criadas pelo usuário além das padrão (null = ilimitado) */
  maxCustomCategories: number | null;
  /** Quantidade de cores disponíveis na paleta (null = todas) */
  maxColors: number | null;
  canPickIcon: boolean;
  canUseDarkMode: boolean;
  canUseAI: boolean;
  canSeeNews: boolean;
  isAdmin: boolean;
  /** Contextos liberados no menu Guias (null = todos) */
  guideContexts: string[] | null;
};

const LITE: Access = {
  role: "lite",
  label: "Lite",
  maxTasksPerCategory: 3,
  maxJournalEntries: 4,
  maxCustomCategories: 2,
  maxColors: 3,
  canPickIcon: false,
  canUseDarkMode: false,
  canUseAI: false,
  canSeeNews: false,
  isAdmin: false,
  guideContexts: ["pessoal", "trabalho"],
};

const PREMIUM: Access = {
  role: "premium",
  label: "Premium",
  maxTasksPerCategory: null,
  maxJournalEntries: null,
  maxCustomCategories: null,
  maxColors: null,
  canPickIcon: true,
  canUseDarkMode: true,
  canUseAI: true,
  canSeeNews: true,
  isAdmin: false,
  guideContexts: null,
};

const OWNER: Access = { ...PREMIUM, role: "owner", label: "Administrador", isAdmin: true };

export const ACCESS_BY_ROLE: Record<Role, Access> = {
  lite: LITE,
  premium: PREMIUM,
  owner: OWNER,
};
