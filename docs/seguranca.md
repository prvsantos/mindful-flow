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
