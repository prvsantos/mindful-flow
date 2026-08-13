export type Guia = {
  id: string;
  titulo: string;
  contexto: "trabalho" | "pessoal" | "foco" | "regulacao";
  resumo: string;
  passos: string[];
  fonte: string;
};

export const GUIAS: Guia[] = [
  {
    id: "conflito-trabalho",
    titulo: "Conflito no trabalho: responder sem reagir",
    contexto: "trabalho",
    resumo:
      "Impulsividade verbal é comum no TDAH. Adiar a resposta em minutos reduz muito o custo do conflito.",
    passos: [
      "Não responda no calor: escreva a resposta e só envie depois de 20 minutos.",
      "Separe fato de interpretação: 'o que foi dito' x 'o que eu entendi'.",
      "Responda em 3 partes: o que entendi, o que preciso, o que proponho.",
      "Peça o combinado por escrito para não depender da memória.",
    ],
    fonte: "CHADD — Workplace issues and ADHD; NICE NG87 (estratégias não-farmacológicas).",
  },
  {
    id: "comecar-tarefa",
    titulo: "Não consigo começar (paralisia de início)",
    contexto: "foco",
    resumo:
      "Iniciar é o gargalo, não a capacidade. Reduzir o tamanho da primeira ação é o que destrava.",
    passos: [
      "Reduza a tarefa até ela caber em 2 minutos ('abrir o arquivo', não 'fazer o relatório').",
      "Use um bloco curto com tempo visível (10 a 25 min) e pausa obrigatória.",
      "Deixe o próximo passo escrito antes de parar, para o retorno não custar caro.",
      "Se travar 3 vezes seguidas, a tarefa está grande demais: quebre de novo.",
    ],
    fonte: "Ativação comportamental (TCC); Safren et al., TCC para TDAH em adultos.",
  },
  {
    id: "sobrecarga",
    titulo: "Sobrecarga: sair do modo 'tudo ao mesmo tempo'",
    contexto: "regulacao",
    resumo:
      "Na sobrecarga, a memória de trabalho satura. Externalizar a lista reduz a carga imediata.",
    passos: [
      "Despeje tudo no papel/app sem organizar — só tirar da cabeça.",
      "Regule o corpo primeiro: 1 minuto de respiração lenta (expiração mais longa que a inspiração).",
      "Escolha exatamente 1 item. Os outros ficam explicitamente 'para depois'.",
      "Feche o dia definindo as 3 prioridades de amanhã.",
    ],
    fonte: "APA — Stress management; diretrizes de regulação emocional em TCC.",
  },
  {
    id: "esquecimento",
    titulo: "Parar de depender da memória",
    contexto: "pessoal",
    resumo:
      "Sistemas externos funcionam melhor que esforço de memória. O objetivo é ter um único lugar confiável.",
    passos: [
      "Capture na hora: se leva menos de 1 minuto, faça; se não, registre.",
      "Um lugar só para tudo — listas espalhadas viram ruído.",
      "Compromissos com horário sempre com lembrete, nunca 'eu lembro'.",
      "Revisão de 5 minutos no fim do dia.",
    ],
    fonte: "NICE NG87 — apoio organizacional; Barkley, ADHD in Adults (funções executivas).",
  },
  {
    id: "hiperfoco",
    titulo: "Hiperfoco: usar a favor sem se perder",
    contexto: "foco",
    resumo: "O hiperfoco é produtivo, mas custa sono, refeições e prazos de outras coisas.",
    passos: [
      "Antes de entrar, defina hora de saída e coloque alarme fora do alcance da mão.",
      "Deixe água e um lembrete visual de pausa no campo de visão.",
      "Ao sair, anote onde parou para reduzir o custo de retomar.",
    ],
    fonte: "Ashinoff & Abu-Akel (2021), Hyperfocus: a review.",
  },
  {
    id: "relacoes",
    titulo: "Conflito pessoal: quando você já se irritou",
    contexto: "pessoal",
    resumo:
      "Desregulação emocional é parte do quadro para muitos adultos com TDAH — e é treinável.",
    passos: [
      "Nomeie a emoção em voz baixa ('estou irritado'). Nomear reduz a intensidade.",
      "Peça pausa explícita: 'preciso de 15 minutos e volto para conversar'.",
      "Volte com um pedido concreto, não com uma acusação.",
      "Repare rápido quando exagerar: reparo curto vale mais que justificativa longa.",
    ],
    fonte: "Shaw et al. (2014), Emotional dysregulation in ADHD; DBT — habilidades de tolerância ao mal-estar.",
  },
  {
    id: "sono",
    titulo: "Sono: a alavanca mais subestimada",
    contexto: "regulacao",
    resumo: "Privação de sono piora atenção, impulsividade e humor no dia seguinte.",
    passos: [
      "Horário de acordar fixo, inclusive fim de semana.",
      "Se a cabeça acelera na cama, faça um despejo mental por escrito antes de deitar.",
      "Luz forte pela manhã ajuda a ancorar o ritmo.",
    ],
    fonte: "AASM — Healthy sleep habits; NICE NG87.",
  },
  {
    id: "procrastinacao",
    titulo: "Procrastinação com culpa",
    contexto: "regulacao",
    resumo:
      "Procrastinação é regulação de emoção, não preguiça. Atacar a culpa costuma destravar mais que 'força de vontade'.",
    passos: [
      "Identifique a emoção da tarefa: tédio, medo de errar, falta de clareza?",
      "Trate a causa: tédio pede estímulo (som/ambiente); medo pede primeira versão feia; falta de clareza pede definir o próximo passo.",
      "Troque autocrítica por instrução: 'próximo passo é X'.",
    ],
    fonte: "Sirois & Pychyl (2013), Procrastination and mood regulation.",
  },
];