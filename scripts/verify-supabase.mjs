import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const base = resolve(process.cwd(), 'outputs', 'aldeckot');
const configWindow = {};
new Function('window', readFileSync(resolve(base, 'supabase-config.js'), 'utf8'))(configWindow);
const { url, publishableKey } = configWindow.ALDECKOT_SUPABASE_CONFIG || {};

if (!url || !publishableKey) throw new Error('Gere supabase-config.js antes de validar a conexão.');

const sdkText = await (await fetch('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js')).text();
const sdk = new Function(`${sdkText}; return supabase;`)();
const client = sdk.createClient(url, publishableKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

const verify = async response => {
  if (response.error) throw new Error(response.error.message);
  return response.data;
};
const testName = `__aldeckot_validation_${Date.now()}`;
const created = { inventoryTable: null, genericTable: null, agenda: null, backup: null, sync: null, userId: null };

try {
  const session = await verify(await client.auth.signInAnonymously());
  if (!session.session?.user) throw new Error('A sessão anônima não foi criada. Ative Anonymous Sign-Ins no Supabase.');
  created.userId = session.session.user.id;
  console.log('✓ Sessão anônima e RLS autenticado');

  created.inventoryTable = await verify(await client.from('module_tables').insert({ module: 'inventory', name: testName, icon: '🧪' }).select().single());
  const item = await verify(await client.from('inventory_items').insert({ table_id: created.inventoryTable.id, equipment: 'Validação ALDECKOT', model: 'Teste', status: 'Ativo', situation: 'Normal' }).select().single());
  await verify(await client.from('inventory_item_logs').insert({ inventory_item_id: item.id, action: 'create', message: 'Validação temporária.' }));
  console.log('✓ Inventário, relação e log');

  let agendaResponse = await client.from('agenda_entries').insert({ kind: 'task', title: 'Validação temporária', due_date: '2030-01-01', reminder_minutes: 0, priority: 'normal' }).select().single();
  if (/(?:priority.*(?:column|schema cache)|column.*priority)/i.test(agendaResponse.error?.message || '')) {
    agendaResponse = await client.from('agenda_entries').insert({ kind: 'task', title: 'Validação temporária', due_date: '2030-01-01', reminder_minutes: 0, notes: '[[aldeckot:priority:normal]]\n' }).select().single();
    console.log('✓ Agenda com compatibilidade de nível');
  } else console.log('✓ Agenda e nível');
  created.agenda = await verify(agendaResponse);

  created.genericTable = await verify(await client.from('module_tables').insert({ module: 'control', name: `${testName}_control`, icon: '🧪' }).select().single());
  await verify(await client.from('module_records').insert({ table_id: created.genericTable.id, payload: { checked: true } }));
  console.log('✓ Estrutura de módulos adicionais');

  created.backup = await verify(await client.from('inventory_backups').insert({ label: 'Validação temporária', snapshot: { tables: [] }, source: 'network' }).select().single());
  await verify(await client.from('inventory_backup_settings').upsert({ owner_id: created.userId, automatic: false }));
  created.sync = await verify(await client.from('sync_events').insert({ module: 'inventory', operation: 'push', details: { validation: true } }).select().single());
  console.log('✓ Backup, preferência e sincronização');

  console.log('VALIDAÇÃO CONCLUÍDA: todas as chamadas do ALDECKOT estão funcionando.');
} finally {
  // A validação não deixa registros de negócio no projeto.
  if (created.agenda) await client.from('agenda_entries').delete().eq('id', created.agenda.id);
  if (created.backup) await client.from('inventory_backups').delete().eq('id', created.backup.id);
  if (created.sync) await client.from('sync_events').delete().eq('id', created.sync.id);
  if (created.inventoryTable) await client.from('module_tables').delete().eq('id', created.inventoryTable.id);
  if (created.genericTable) await client.from('module_tables').delete().eq('id', created.genericTable.id);
  if (created.userId) await client.from('inventory_backup_settings').delete().eq('owner_id', created.userId);
  await client.auth.signOut();
}
