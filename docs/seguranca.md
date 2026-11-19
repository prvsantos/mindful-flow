# Segurança — Portal OrganizaMente

## Modelo de acesso aos dados

- Todas as tabelas (`tasks`, `brain_dumps`, `journal_entries`) têm **RLS habilitado**.
- Uma política única por tabela: `auth.uid() = user_id` em leitura e escrita. Cada
  pessoa só enxerga e altera os próprios registros.
- Nenhum privilégio para o papel **anônimo** — sem sessão, a Data API não devolve nada.
- `user_id` agora tem `default auth.uid()`: mesmo que o cliente tente enviar outro id,
  a política `with check` bloqueia a gravação em nome de terceiros.
- Restrições de domínio e tamanho (área, prioridade, humor 1–5, energia 1–5, limites de
  texto) evitam dados inválidos ou payloads abusivos vindos do cliente.

## Credenciais

| Valor | Onde vive | Exposto ao navegador |
|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | `.env` | Sim (público por design; protegido por RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | apenas ambiente do servidor | Não |
| `LOVABLE_API_KEY` (IA) | apenas ambiente do servidor | Não |

- A chave da IA é lida **dentro** do handler em `src/lib/ai.server.ts`, nunca no cliente.
- A chave de serviço não é importada por nenhuma rota ou componente.
- Nenhuma chave secreta está escrita no código-fonte.

## Camada de servidor

- Todas as funções de IA (`organizeThoughts`, `sosOrganize`, `findPatterns`) usam
  `requireSupabaseAuth`: exigem token Bearer válido e consultam o banco **como o usuário**,
  respeitando RLS. Não há endpoint público que toque em dados pessoais.
- Entradas validadas com Zod (tamanho mínimo/máximo) antes de chegarem à IA.
- Proteção CSRF ativa para server functions em `src/start.ts`.
- Rotas privadas ficam sob `_authenticated/`, com redirecionamento para `/auth`.

## Regras de conteúdo

O prompt de sistema (`SAFETY`) proíbe diagnóstico, prescrição e interpretação clínica, e
direciona para ajuda profissional e CVV 188 em sinais de crise.

## Verificações executadas

- Scan de segurança do backend: sem achados.
- Linter do banco: sem achados.

## Privacidade do conteúdo do usuário (revisão 31.08.2026)

- `tasks`, `brain_dumps`, `journal_entries` e `categories` só respondem para o próprio
  dono (`auth.uid() = user_id`), em leitura e escrita. **O administrador não tem acesso
  ao conteúdo escrito por outras pessoas** — não existe política nem consulta que
  permita isso.
- As funções administrativas (`src/lib/admin.functions.ts`) usam a chave de serviço
  apenas para: listar contas (e-mail, provedor, datas de login), atribuir/remover
  perfil (`user_roles`) e excluir uma conta com seus dados. Nenhuma delas lê o
  conteúdo das tabelas pessoais.
- `admin_audit_logs` guarda somente ação, autor, alvo e data/hora — nunca o conteúdo.
- Execução das funções `sync_my_role()` e `has_role()` foi revogada do papel anônimo;
  apenas sessões autenticadas podem chamá-las.

## Fase 2 — Segurança, LGPD e controle da IA (19.11.2026)

- **Limites no banco**: gatilhos aplicam os limites do plano Lite (3 tarefas abertas por categoria, 4 registros no diário,
  2 categorias próprias) usando o perfil real (`my_effective_role`). A interface só reflete o que o banco garante.
- **Categorias**: `enforce_task_rules` só aceita áreas padrão ou categorias da própria conta (substituiu `tasks_area_valid`).
- **IA protegida no servidor**: toda chamada passa por `ai_begin_call` (login, perfil Premium/Admin, consentimento,
  1 chamada por vez, intervalo mínimo, limite diário por pessoa, teto mensal global, IA ligada/desligada) e termina em
  `ai_finish_call`. A tabela `ai_usage` guarda só função, modelo, tokens e status — nunca texto. Respostas limitadas por
  `max_output_tokens`.
- **Consentimento**: `user_consents` guarda o histórico (finalidade, versão do aviso, data). Sem consentimento vigente,
  `findPatterns` não lê nem envia o diário. Envio minimizado: até 10 registros dos últimos 30 dias, só com a data.
- **Administrador por UUID** em `app_config` (sem acesso pela API). O e-mail saiu das funções; continua apenas no
  histórico antigo do repositório.
- **Retenção**: textos de "Minha cabeça" mais antigos que `ai_settings.retention_days` (180) são apagados a cada novo registro
  da própria conta (não há agendador no plano atual).
- **Direitos do titular**: página `/privacidade`, área `/meus-dados` (exportar JSON, revogar autorização, excluir a conta).
- **Auditoria** com e-mails mascarados (ex.: pa***@gmail.com). Visitantes sem login não têm privilégio nas tabelas.
- **Sessão**: os dois botões Sair limpam o cache da tela e o "testar como".
- **Testes**: `tests/security/api-security.test.ts` (11 cenários, API real com sessões verdadeiras) — todos aprovados.

### Pendências / próxima etapa
- MFA para o administrador.
- Backup e restauração: verificar o que o plano oferece antes de contratar algo.
- Custo em reais por chamada: a plataforma não fornece; o painel mostra chamadas e tokens.
- Remover o e-mail do histórico do Git exige reescrever o repositório (fora do alcance daqui).
