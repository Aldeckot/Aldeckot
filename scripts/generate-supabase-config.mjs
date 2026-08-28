import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const base = resolve(process.cwd(), 'outputs', 'aldeckot');
const envPath = resolve(base, '.env');
if (!existsSync(envPath)) {
  throw new Error('Arquivo .env não encontrado. Copie .env.example para .env e preencha as chaves.');
}

const values = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#') && line.includes('='))
    .map(line => {
      const separator = line.indexOf('=');
      return [line.slice(0, separator).trim(), line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '')];
    })
);

const url = values.NEXT_PUBLIC_SUPABASE_URL || values.SUPABASE_URL;
const publishableKey = values.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || values.SUPABASE_ANON_KEY;

if (!url || !publishableKey || url.includes('SEU-PROJETO')) {
  throw new Error('Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no arquivo .env.');
}

const output = `// Gerado localmente a partir de .env. Não publique este arquivo.\nwindow.ALDECKOT_SUPABASE_CONFIG = ${JSON.stringify({ url, publishableKey }, null, 2)};\n`;
writeFileSync(resolve(base, 'supabase-config.js'), output, 'utf8');
console.log('supabase-config.js gerado com sucesso.');
