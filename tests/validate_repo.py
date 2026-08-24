from pathlib import Path
import json, re, sys

ROOT = Path(__file__).resolve().parents[1]
errors=[]

def fail(msg): errors.append(msg)

# JSON/data integrity
for p in (ROOT/'data').glob('*.json'):
    try: json.loads(p.read_text(encoding='utf-8'))
    except Exception as e: fail(f'Invalid JSON {p.relative_to(ROOT)}: {e}')

manifest_path=ROOT/'data'/'armies.json'
try:
    manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
    armies=manifest.get('armies',[])
    if not armies: fail('armies.json contains no armies')
    ids=[]
    for army in armies:
        aid=army.get('id')
        if not aid: fail('Army without id in armies.json')
        if aid in ids: fail(f'Duplicate army id: {aid}')
        ids.append(aid)
        if army.get('available'):
            f=army.get('dataFile')
            if not f: fail(f'Available army {aid} has no dataFile')
            elif not (ROOT/'data'/f).exists(): fail(f'Available army {aid} data file missing: {f}')
except Exception as e:
    fail(f'Could not validate armies.json: {e}')

# Generated bundle entry points and accidental legacy bundle use
index=(ROOT/'index.html').read_text(encoding='utf-8')
for required in ['dev_startup_bundle.js','dev_account_bundle.js','dev_campaign_bundle.js']:
    if required not in index: fail(f'index.html missing required bundle: {required}')
if 'dev_bundle.js' in index or 'dev_core_bundle.js' in index:
    fail('index.html references an obsolete bundle')

# Referenced local JS/CSS/images must exist.
for path in re.findall(r'(?:src|href)=["\']([^"\']+)["\']', index):
    clean=path.split('?')[0].split('#')[0]
    if clean.startswith(('http://','https://','mailto:','#')) or not clean:
        continue
    if clean.endswith(('.js','.css','.ico','.png','.webp')) and not (ROOT/clean).exists():
        fail(f'index.html references missing asset: {clean}')

# Basic static security regression checks.
text_files=list(ROOT.glob('*.js'))+list(ROOT.glob('*.html'))+list((ROOT/'tools').glob('*.py'))
secret_patterns=[
    (re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'), 'private key'),
    (re.compile(r'\bservice_role\b\s*[:=]\s*["\'][A-Za-z0-9._-]{20,}', re.I), 'Supabase service-role credential'),
    (re.compile(r'\b(?:password|passwd)\b\s*[:=]\s*["\'][^"\']{8,}["\']', re.I), 'hard-coded password'),
]
for p in text_files:
    try: txt=p.read_text(encoding='utf-8', errors='ignore')
    except Exception: continue
    for rx,label in secret_patterns:
        if rx.search(txt): fail(f'Potential {label} committed in {p.relative_to(ROOT)}')

# Dangerous navigation schemes should not be present in static markup.
for p in ROOT.glob('*.html'):
    txt=p.read_text(encoding='utf-8', errors='ignore')
    if re.search(r'(?:href|src)\s*=\s*["\']\s*javascript:', txt, re.I):
        fail(f'javascript: URL found in {p.name}')

if errors:
    print('\n'.join(f'FAIL: {e}' for e in errors))
    sys.exit(1)
print('Repository reliability/security validation passed.')
