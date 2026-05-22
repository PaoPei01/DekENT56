import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

loadDotEnv(path.resolve(process.cwd(), '.env'));

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminAccessToken = process.env.SUPABASE_ADMIN_ACCESS_TOKEN;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env before running this read-only staging check.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: fetchWithTimeout },
});

const adminSupabase =
  adminAccessToken && (supabaseAnonKey || serviceRoleKey)
    ? createClient(supabaseUrl, supabaseAnonKey || serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          fetch: fetchWithTimeout,
          headers: { Authorization: `Bearer ${adminAccessToken}` },
        },
      })
    : null;

const checks = [];

await check('default event exists', async () => {
  const { data, error } = await supabase
    .from('events')
    .select('id,name_th,name_en,slug,status,visibility')
    .eq('slug', 'entaneer-bonding-69')
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Default event entaneer-bonding-69 was not found.');
  return `${data.name_th} / ${data.name_en ?? '-'} (${data.status}, ${data.visibility})`;
});

await check('people table is readable by service role', async () => {
  const { count, error } = await supabase
    .from('people')
    .select('id', { count: 'exact', head: true });

  if (error) throw error;
  return `${count ?? 0} people rows`;
});

await check('legacy profiles have nullable person_id columns', async () => {
  const [profiles, staffProfiles] = await Promise.all([
    supabase.from('profiles').select('id,person_id').limit(1),
    supabase.from('staff_profiles').select('id,person_id').limit(1),
  ]);

  if (profiles.error) throw profiles.error;
  if (staffProfiles.error) throw staffProfiles.error;
  return 'profiles.person_id and staff_profiles.person_id are selectable';
});

await check('preview_people_legacy_link RPC runs', async () => {
  if (!adminSupabase) {
    return skip('Set SUPABASE_ADMIN_ACCESS_TOKEN to run this admin-only preview RPC.');
  }

  const { data, error } = await adminSupabase.rpc('preview_people_legacy_link');
  if (error) throw error;
  return JSON.stringify(data);
});

await check('event registration tables exist', async () => {
  const tables = ['event_participants', 'staff_applications', 'event_forms', 'event_form_responses'];
  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1);
    if (error) throw new Error(`${table}: ${error.message}`);
  }
  return tables.join(', ');
});

await check('attendance sessions expose event_id', async () => {
  const { error } = await supabase.from('staff_attendance_sessions').select('id,event_id').limit(1);
  if (error) throw error;
  return 'staff_attendance_sessions.event_id is selectable';
});

await check('announcements/documents expose event_id', async () => {
  const tables = ['announcements', 'document_project_profiles', 'document_templates', 'generated_documents'];
  for (const table of tables) {
    const { error } = await supabase.from(table).select('id,event_id').limit(1);
    if (error) throw new Error(`${table}: ${error.message}`);
  }
  return tables.join(', ');
});

const failed = checks.filter((item) => item.status === 'failed');
const skipped = checks.filter((item) => item.status === 'skipped');

console.log('\nMulti-event staging foundation check');
console.log('====================================');
for (const item of checks) {
  const marker = item.status === 'passed' ? 'PASS' : item.status === 'skipped' ? 'SKIP' : 'FAIL';
  console.log(`${marker} ${item.name}`);
  console.log(`     ${item.detail}`);
}

if (failed.length) {
  console.error(`\n${failed.length} check(s) failed. Apply migrations on staging before moving to the next phase.`);
  process.exit(1);
}

if (skipped.length) {
  console.log(`\n${skipped.length} check(s) skipped. Provide the requested optional environment value to complete them.`);
}

console.log('\nAll read-only staging checks passed. Review preview counts before running any linking RPC.');

async function check(name, fn) {
  try {
    const detail = await fn();
    if (detail?.status === 'skipped') {
      checks.push({ name, status: 'skipped', detail: detail.detail });
    } else {
      checks.push({ name, status: 'passed', detail });
    }
  } catch (error) {
    checks.push({ name, status: 'failed', detail: friendlyError(error) });
  }
}

function skip(detail) {
  return { status: 'skipped', detail };
}

function friendlyError(error) {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;
  return error.message ?? JSON.stringify(error);
}

function loadDotEnv(envPath) {
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}

async function fetchWithTimeout(input, init = {}) {
  const controller = new AbortController();
  const timeoutMs = Number(process.env.STAGING_CHECK_TIMEOUT_MS ?? 15000);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}
