import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const failures = [];
const passes = [];

function test(name, fn) {
  try {
    fn();
    passes.push(name);
    console.log(`PASS  ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.error(`FAIL  ${name}\n      ${error.message}`);
  }
}

function walk(dir, predicate = () => true) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', '.deploy', 'node_modules'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, predicate));
    else if (predicate(full)) out.push(full);
  }
  return out;
}

const indexPath = path.join(root, 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

test('index.html local scripts and styles all exist', () => {
  const refs = [...indexHtml.matchAll(/(?:src|href)=["']([^"']+)["']/gi)].map(m => m[1]);
  const local = refs.filter(ref => !/^(?:https?:|mailto:|tel:|#|data:|javascript:)/i.test(ref));
  const missing = [];
  for (const ref of local) {
    const clean = ref.split(/[?#]/)[0].replace(/^\.\//, '');
    if (!clean) continue;
    if (!fs.existsSync(path.join(root, clean))) missing.push(ref);
  }
  assert.deepEqual(missing, [], `Missing local assets: ${missing.join(', ')}`);
});

test('index.html contains no duplicate element IDs', () => {
  const ids = [...indexHtml.matchAll(/\bid=["']([^"']+)["']/gi)].map(m => m[1]);
  const duplicates = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  assert.deepEqual(duplicates, [], `Duplicate IDs: ${duplicates.join(', ')}`);
});

test('all JSON files parse successfully', () => {
  const bad = [];
  for (const file of walk(root, f => f.endsWith('.json'))) {
    try { JSON.parse(fs.readFileSync(file, 'utf8')); }
    catch (error) { bad.push(`${path.relative(root, file)}: ${error.message}`); }
  }
  assert.deepEqual(bad, [], `Invalid JSON:\n${bad.join('\n')}`);
});

test('all JavaScript and module files pass Node syntax checking', () => {
  const bad = [];
  for (const file of walk(root, f => /\.(?:js|mjs)$/i.test(f))) {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (result.status !== 0) bad.push(`${path.relative(root, file)}: ${(result.stderr || result.stdout).trim()}`);
  }
  assert.deepEqual(bad, [], `JavaScript syntax failures:\n${bad.join('\n\n')}`);
});

test('Supabase migrations have unique sequential numbers with no gaps', () => {
  const dir = path.join(root, 'supabase');
  const files = fs.readdirSync(dir).filter(name => /^\d{3}_.+\.sql$/i.test(name)).sort();
  const nums = files.map(name => Number(name.slice(0, 3)));
  assert.equal(new Set(nums).size, nums.length, 'Duplicate migration numbers found');
  const expected = Array.from({ length: Math.max(...nums) }, (_, i) => i + 1);
  assert.deepEqual(nums, expected, `Migration sequence has gaps. Found: ${nums.join(', ')}`);
});

test('campaign migrations retain cascade cleanup paths', () => {
  const required = {
    'supabase/004_campaign_foundation.sql': [
      'campaign_id uuid not null references public.campaigns(id) on delete cascade',
      'campaign_id uuid not null references public.campaigns(id) on delete cascade'
    ],
    'supabase/006_campaign_armies.sql': [
      'campaign_id uuid references public.campaigns(id) on delete cascade'
    ],
    'supabase/007_campaign_territories.sql': [
      'campaign_id uuid not null references public.campaigns(id) on delete cascade',
      'parent_territory_id uuid references public.campaign_territories(id) on delete cascade'
    ]
  };
  for (const [file, needles] of Object.entries(required)) {
    const text = fs.readFileSync(path.join(root, file), 'utf8').toLowerCase();
    for (const needle of needles) assert.ok(text.includes(needle.toLowerCase()), `${file} missing cascade: ${needle}`);
  }
});

test('development loader includes campaign security and deletion layers', () => {
  const loader = fs.readFileSync(path.join(root, 'global_release_finalize.js'), 'utf8');
  for (const script of [
    'dev_campaigns.js',
    'dev_campaign_armies.js',
    'dev_campaign_territories.js',
    'dev_territory_permissions.js',
    'dev_territory_random_server.js',
    'dev_territory_specific_create.js',
    'dev_campaign_dialog_guard.js',
    'dev_campaign_delete.js'
  ]) {
    assert.ok(loader.includes(script), `Loader does not include ${script}`);
  }
});

test('browser source contains no obviously privileged Supabase secret markers', () => {
  const bad = [];
  const pattern = /(SUPABASE_SERVICE_ROLE_KEY|sb_secret_|service[_-]?role\s*[:=])/i;
  for (const file of walk(root, f => /\.(?:js|mjs|html|css|json)$/i.test(f))) {
    const rel = path.relative(root, file);
    if (rel.startsWith(`tests${path.sep}`)) continue;
    const text = fs.readFileSync(file, 'utf8');
    if (pattern.test(text)) bad.push(rel);
  }
  assert.deepEqual(bad, [], `Potential privileged secret marker found in: ${bad.join(', ')}`);
});

console.log(`\nSite integrity regression: ${passes.length}/${passes.length + failures.length} passed.`);
if (failures.length) process.exit(1);
