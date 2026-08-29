import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const cwd = process.cwd();
const candidates = [resolve(cwd, 'outputs', 'aldeckot'), cwd];
const base = candidates.find(path => existsSync(resolve(path, 'inventory.html')));
if (!base) throw new Error('Não foi possível localizar a pasta do ALDECKOT.');
const envPath = resolve(base, '.env');

const fileValues = existsSync(envPath) ? Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#') && line.includes('='))
    .map(line => {
      const separator = line.indexOf('=');
      return [line.slice(0, separator).trim(), line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '')];
    })
) : {};
// No Vercel, as credenciais chegam por process.env durante o build.
// No desenvolvimento local, o arquivo .env continua sendo aceito.
const values = { ...fileValues, ...process.env };

const url = values.NEXT_PUBLIC_SUPABASE_URL || values.VITE_SUPABASE_URL || values.SUPABASE_URL;
const publishableKey = values.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || values.VITE_SUPABASE_ANON_KEY || values.VITE_SUPABASE_ANON || values.SUPABASE_ANON_KEY;

if (!url || !publishableKey || url.includes('SEU-PROJETO')) {
  throw new Error('Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ou os aliases VITE_/SUPABASE_) nas variáveis do ambiente.');
}

const output = `// Gerado durante o build. Contém somente a chave publicável do Supabase.\nwindow.ALDECKOT_SUPABASE_CONFIG = ${JSON.stringify({ url, publishableKey }, null, 2)};\n`;
writeFileSync(resolve(base, 'supabase-config.js'), output, 'utf8');
console.log('supabase-config.js gerado com sucesso.');
