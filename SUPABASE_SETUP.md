# Conectar o ALDECKOT ao Supabase

O site foi preparado para usar o Supabase como fonte única de dados do Inventário, da Agenda e dos backups em rede. Não há dados de exemplo nem armazenamento local desses módulos.

## 1. Criar a estrutura do banco

1. Crie ou abra o projeto no Supabase.
2. Acesse **SQL Editor** e execute por completo o arquivo [001_aldeckot_schema.sql](supabase/001_aldeckot_schema.sql).
3. Em **Authentication → Providers**, ative **Anonymous Sign-Ins**.

Se o banco já estiver em uso, execute também [002_agenda_priority.sql](supabase/002_agenda_priority.sql) para adicionar o campo **Nível** à Agenda.

O ALDECKOT não precisa de uma tela de login nesta etapa: a autenticação anônima cria uma identidade privada para cada instalação/navegador. As políticas RLS garantem que uma identidade não consiga ler ou alterar os dados de outra. Quando houver necessidade de usuários compartilharem a mesma empresa, a evolução correta é adicionar login por e-mail/SSO e uma tabela de organizações — não desativar RLS.

## 2. Inserir a Project URL e a Anon Key

Na raiz da pasta `aldeckot`:

1. Copie `.env.example` e renomeie a cópia para `.env`.
2. Preencha exatamente estas duas linhas no `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua-chave-publishable
```

Encontre ambos os valores em **Supabase → Project Settings → API**. Use somente a chave `publishable` (ou a `anon` em projetos mais antigos). **Nunca** cole a `service_role` no site.

3. Na pasta `C:\Users\ricardon\Documents\Codex\2026-08-27\se-x20`, execute:

```powershell
& "C:\Users\ricardon\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" outputs\aldeckot\scripts\generate-supabase-config.mjs
```

O comando cria `supabase-config.js`, que é ignorado pelo Git. É esse arquivo que o navegador lê; o `.env` nunca é enviado ao navegador diretamente.

## Publicação no Vercel

Mantenha a **Root Directory** do projeto como a raiz do repositório e cadastre, em **Settings → Environment Variables**, as duas variáveis abaixo para os ambientes necessários (Production, Preview e Development):

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua-chave-publishable
```

O arquivo `vercel.json` executa a geração de `outputs/aldeckot/supabase-config.js` durante cada build e publica a pasta `outputs/aldeckot`. Além disso, a rota `/api/supabase-config` lê essas mesmas variáveis durante a execução no Vercel; portanto, o ALDECKOT não depende do arquivo estático para conectar. Não use `service_role` no Vercel nem no frontend.

## 3. Abrir o site

Abra a pasta `outputs\aldeckot` usando um servidor local (por exemplo, Live Server) e navegue para `index.html`. Evite `file://` para a versão conectada, pois navegadores podem bloquear a comunicação segura com o Supabase nesse modo.

## Estrutura criada

| Entidade | Finalidade |
| --- | --- |
| `profiles` | Identidade do titular dos dados |
| `module_tables` | Listas/tabelas dos módulos |
| `inventory_items` | Equipamentos do Inventário |
| `inventory_item_logs` | Histórico de alterações dos equipamentos |
| `agenda_entries` | Eventos e tarefas da Agenda |
| `inventory_backups` | Snapshots de backup em rede |
| `inventory_backup_settings` | Preferência e agendamento do backup automático |
| `module_records` | Dados flexíveis para Controle TI, Flux e NF-e enquanto seus campos definitivos evoluem |
| `sync_events` | Auditoria de sincronizações, backups e restaurações |

Todas as tabelas têm RLS ativo, chaves estrangeiras, índices e validação dos valores de Status e Situação.

O botão de backup automático guarda sua preferência no banco. Quando o Inventário for aberto ou sincronizado, o sistema cria uma cópia se já se passaram sete dias desde o último backup.

## Validação ponta a ponta

Depois de ativar **Anonymous Sign-Ins**, execute o validador abaixo. Ele cria dados temporários, testa RLS, Inventário, Agenda, Backups e Sincronização, e remove os registros de negócio ao final.

```powershell
& "C:\Users\ricardon\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" outputs\aldeckot\scripts\verify-supabase.mjs
```
