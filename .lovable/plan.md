# Fase 1 — Auditoria e plano de segurança/LGPD do OrganizaMente

Nada foi alterado. Esta é só a análise. Cada bloco abaixo precisa da sua aprovação, que pode ser parcial.

## 1. Diagnóstico

### Já está correto
- Cada pessoa só lê e grava os próprios registros (tarefas, despejos mentais, diário, categorias). Essa regra fica no banco, por linha, e quem não está logado não acessa nada.
- As categorias já são individuais: cada conta tem as suas.
- A chave da IA e a chave administrativa ficam só no servidor e nunca chegam ao navegador.
- As três chamadas à IA exigem login válido e já têm limite de caracteres na entrada (6.000, 4.000, e o diário limitado a 20 registros).
- Ninguém consegue se dar Premium: só o administrador altera perfis, e o banco confirma isso.
- O administrador não lê conteúdo pessoal. As funções administrativas mexem apenas em contas, perfis e exclusão, e a auditoria guarda só ação, autor, alvo e data.
- Quando o administrador exclui uma conta, todos os registros dela são apagados (e o banco também apaga em cascata).
- O botão Sair da Homepage limpa os dados da tela antes de sair.
- Não existe service worker nem cache offline. A PWA hoje é só o ícone e o manifesto, então não há dados privados guardados em cache.

### Precisa corrigir ou completar
1. **Permissões só na tela.** O Lite fica bloqueado apenas visualmente. Uma pessoa Lite que chame o servidor direto consegue usar a IA, e os limites de tarefas (3), diário (4) e categorias (2) também não são aplicados no servidor nem no banco. Esta é a vulnerabilidade principal.
2. **E-mail do administrador público.** O e-mail aparece em uma migração dentro do repositório público e na função que define o perfil. O correto é trocar pelo identificador fixo (UUID) da conta, guardado de forma segura.
3. **findPatterns sem consentimento.** Ela envia até 20 registros do diário sem pedir autorização e sem registrar a autorização.
4. **Botão Sair do menu** (o do topo das páginas) não limpa os dados da tela, ao contrário do botão da Homepage. Com isso, a conta seguinte no mesmo aparelho pode ver dados da anterior por um instante. A preferência "testar como" também fica salva no aparelho.
5. **Auditoria guarda e-mails** (do autor e do alvo). Isso é aceitável para auditoria, mas pode ser mascarado (ex.: pa***@gmail.com).
6. **Tarefas em categorias criadas pelo usuário (possível bug existente).** O banco hoje só aceita as áreas pessoal, trabalho e outros. Tarefas em categorias novas podem falhar ao salvar. Preciso confirmar antes de mexer; a correção também passa a garantir que só dá para usar categorias da própria conta.
7. **Modelo de IA em descontinuação.** O modelo atual está sendo descontinuado. A troca é necessária para continuar funcionando e também permite limitar o tamanho das respostas.

### Ainda não existe
- Limite diário de chamadas à IA por pessoa, limite global mensal, bloqueio automático e aviso ao administrador.
- Registro de consumo por chamada (usuário, modelo, tokens, status, custo estimado), sem textos.
- Proteção contra cliques repetidos e chamadas simultâneas.
- Consentimento específico para a IA, com revogação e versão do aviso.
- Página de Privacidade (quais dados, para quê, quais serviços, por quanto tempo).
- Exclusão da própria conta pela pessoa, com aviso de que é permanente.
- Exportar os próprios dados (cópia) e um canal para pedidos de titular.
- Política de retenção (ex.: apagar respostas antigas da IA após X dias).
- Testes automáticos de segurança.

## 2. Limitações e custos
- **Custo zero previsto.** Tudo cabe no plano atual (banco, servidor e IA já em uso). Nenhum serviço pago novo.
- **Custo real em reais por usuário:** a plataforma não fornece esse detalhamento. O plano registra os tokens de cada chamada e calcula uma estimativa, que fica identificada como estimativa. O consumo oficial continua sendo o da tela de uso da Lovable.
- **Orçamento global da plataforma:** dá para definir um limite de gastos do workspace nas configurações da Lovable (feito por você). O app terá o próprio teto mensal de chamadas.
- **Verificação em duas etapas (MFA) para o administrador:** o sistema de login suporta, mas exige uma tela nova. Fica como item opcional.
- **Backup:** ainda vou verificar e informar o que o plano atual oferece; não altero nada.
- **Garantias LGPD do provedor de IA** (treinamento, retenção, região): vou documentar o que for confirmado na documentação da Lovable, sem afirmar o que não puder verificar.
- **Exclusão em backups ou em terceiros:** não será prometida como instantânea.

## 3. Plano por prioridade

### P1 — Autorização no servidor e no banco (crítico)
- Limites de tarefas, diário e categorias aplicados no banco, conforme o perfil real da conta. Os registros que já existem acima do limite não são apagados; só novas inclusões são bloqueadas.
- As funções de IA passam a conferir login, perfil real (Premium ou Administrador), consentimento (no caso do diário) e limites antes de chamar a IA.
- Tarefas só aceitam categorias da própria conta. Isso substitui a regra fixa das três áreas, sem perder dados (verifiquei: nenhuma tarefa atual ficaria inválida).

### P2 — Controle de consumo da IA
- Novas tabelas: limites (configuráveis pelo administrador) e consumo por chamada (sem textos).
- Limites sugeridos, a confirmar com você: 20 chamadas por dia por pessoa, 1 chamada por vez, intervalo de 5 segundos, resposta com até 1.200 tokens, teto mensal global de chamadas.
- Ao chegar em 80% do teto: alerta no menu Acessos. Ao chegar em 100%: novas chamadas bloqueadas com mensagem amigável.
- Troca para um modelo de IA atual, mantendo as instruções e o formato das respostas.
- Novo painel "Consumo da IA" no menu Acessos.

### P3 — Privacidade e LGPD
- Consentimento para "Padrões do diário": uma janela explica o que é enviado e para quem, com Autorizar/Recusar, e a escolha pode ser revogada depois. Fica registrado data, hora, finalidade e versão do aviso, sem conteúdo.
- Enviar à IA só os campos necessários e menos registros (por exemplo, os 10 mais recentes dos últimos 30 dias), sem identificadores.
- Página Privacidade, ligada no login e no rodapé.
- Área "Meus dados": exportar uma cópia (JSON), revogar consentimentos e excluir minha conta com aviso de que é permanente e confirmação. A exclusão fica registrada na auditoria, sem conteúdo.
- Retenção: apagar automaticamente o texto dos despejos e respostas da IA com mais de 180 dias (prazo a confirmar). Tarefas e diário ficam até a pessoa apagar.
- Máscara de e-mails nos novos registros de auditoria.

### P4 — Administrador por UUID
- O perfil de administrador passa a vir de um UUID guardado em configuração segura, e não do e-mail no código. O e-mail sai das funções atuais.
- Ponto importante: o e-mail continua no histórico de commits do repositório público, porque não consigo reescrever esse histórico.
- Risco: se o UUID for configurado errado, o administrador perde o acesso. Vou validar antes de remover a regra antiga.

### P5 — Sessão no aparelho
- Os dois botões Sair passam a limpar os dados da tela e a preferência "testar como". O tema claro/escuro é mantido.

### P6 — Testes automáticos
Testes contra o banco real, com duas contas temporárias criadas e removidas durante o teste:
- A não lê nem altera os registros de B.
- Lite não usa a IA nem passa dos limites.
- Ninguém se dá Premium.
- Quem não está logado não vê nada.
- O administrador não lê o diário.
- Sem consentimento, nada vai para a IA.
- Os limites da IA são respeitados.
- Ninguém usa categoria de outra conta.
Ao final: relatório com arquivos, migrações, testes e pendências.

## 4. Impactos nas funcionalidades atuais
- Sem mudança visual fora do escopo. O que é novo: janela de consentimento, Privacidade, Meus dados e painel de consumo.
- O "testar como Lite" do administrador continua apenas visual. No servidor, o administrador mantém o acesso completo.
- Contas Lite que hoje estão acima dos limites mantêm os dados, mas não conseguem criar novos registros.

## 5. Detalhes técnicos
- **Arquivos:** src/lib/ai.server.ts, src/lib/ai.functions.ts, src/lib/admin.functions.ts, src/lib/access.ts, src/components/app/AppShell.tsx, src/components/app/LogoutButton.tsx, src/routes/_authenticated/diario.tsx, mente.tsx, painel.tsx e acessos.tsx.
- **Arquivos novos:** src/routes/privacidade.tsx, src/routes/_authenticated/meus-dados.tsx, src/lib/account.functions.ts, src/lib/ai-quota.server.ts, testes em tests/security/*.test.ts (vitest).
- **Banco (somente acréscimos):**
  - função my_effective_role();
  - gatilhos de limite em tasks, journal_entries e categories;
  - gatilho que valida a categoria em tasks, com remoção da regra tasks_area_valid (é uma remoção de regra, não de dados, mas pede sua autorização);
  - tabelas ai_usage, ai_settings e user_consents, com acesso por dono e leitura de agregados pelo administrador;
  - função de retenção agendada;
  - sync_my_role() reescrita para usar o UUID de uma tabela de configuração protegida ou de um segredo.
- **IA:** migração para o SDK da Lovable AI com modelo atual e limite de tokens de saída. As tentativas automáticas seguem o padrão do SDK.

## Decisões que preciso de você
1. Valores dos limites de IA (diário por pessoa e teto mensal).
2. Prazo de retenção dos despejos e das respostas da IA.
3. Autorização para remover a regra fixa das três áreas e para trocar o modelo de IA.
4. Se inclui MFA para o administrador agora ou depois.
