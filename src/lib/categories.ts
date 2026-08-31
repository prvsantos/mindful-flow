import {
  Briefcase,
  Folder,
  Heart,
  Home,
  Dumbbell,
  GraduationCap,
  Wallet,
  Plane,
  Music,
  Users,
  Stethoscope,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type Category = {
  id: string;
  slug: string;
  label: string;
  color: string;
  icon: string;
  created_at: string;
};

export const DEFAULT_SLUGS = ["pessoal", "trabalho", "outros"];

/** Paleta fixa — as 3 primeiras ficam disponíveis também no plano Lite. */
export const COLORS = [
  { key: "violet", label: "Violeta", dot: "bg-violet-500", chip: "bg-violet-500/12 text-violet-600 dark:text-violet-300" },
  { key: "blue", label: "Azul", dot: "bg-blue-500", chip: "bg-blue-500/12 text-blue-600 dark:text-blue-300" },
  { key: "amber", label: "Âmbar", dot: "bg-amber-500", chip: "bg-amber-500/15 text-amber-600 dark:text-amber-300" },
  { key: "teal", label: "Verde-água", dot: "bg-teal-500", chip: "bg-teal-500/12 text-teal-600 dark:text-teal-300" },
  { key: "rose", label: "Rosa", dot: "bg-rose-500", chip: "bg-rose-500/12 text-rose-600 dark:text-rose-300" },
  { key: "cyan", label: "Ciano", dot: "bg-cyan-500", chip: "bg-cyan-500/12 text-cyan-600 dark:text-cyan-300" },
  { key: "emerald", label: "Verde", dot: "bg-emerald-500", chip: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300" },
  { key: "slate", label: "Grafite", dot: "bg-slate-500", chip: "bg-slate-500/15 text-slate-600 dark:text-slate-300" },
] as const;

export const ICONS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "folder", label: "Pasta", icon: Folder },
  { key: "heart", label: "Coração", icon: Heart },
  { key: "briefcase", label: "Trabalho", icon: Briefcase },
  { key: "home", label: "Casa", icon: Home },
  { key: "dumbbell", label: "Treino", icon: Dumbbell },
  { key: "graduation", label: "Estudos", icon: GraduationCap },
  { key: "wallet", label: "Dinheiro", icon: Wallet },
  { key: "plane", label: "Viagem", icon: Plane },
  { key: "music", label: "Lazer", icon: Music },
  { key: "users", label: "Pessoas", icon: Users },
  { key: "health", label: "Saúde", icon: Stethoscope },
  { key: "sparkles", label: "Ideias", icon: Sparkles },
];

/** Cor personalizada (Premium) é guardada como hexadecimal, ex: "#ff8800". */
export function isCustomColor(key: string) {
  return /^#[0-9a-fA-F]{6}$/.test(key ?? "");
}

export function colorOf(key: string) {
  if (isCustomColor(key)) {
    return { key, label: "Personalizada", dot: "", chip: "" } as const;
  }
  return COLORS.find((c) => c.key === key) ?? COLORS[0]!;
}

/** Estilos inline usados apenas quando a cor é personalizada. */
export function dotStyle(key: string): React.CSSProperties | undefined {
  return isCustomColor(key) ? { backgroundColor: key } : undefined;
}

export function chipStyle(key: string): React.CSSProperties | undefined {
  return isCustomColor(key) ? { backgroundColor: `${key}22`, color: key } : undefined;
}

export function iconOf(key: string): LucideIcon {
  return ICONS.find((i) => i.key === key)?.icon ?? Folder;
}

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}
