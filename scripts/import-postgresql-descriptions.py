"""Import PostgreSQL --describe-config and upstream PO files; no running DB needed.

Usage: python3 scripts/import-postgresql-descriptions.py POSTGRES_BINARY PO_DIRECTORY
PO files: tastedev-postgres-{ko,ja,zh_CN,es,fr,de,ru,pt_BR}.po
Merge additional upstream languages without running PostgreSQL:
python3 scripts/import-postgresql-descriptions.py --merge-existing PO_DIRECTORY
"""
import ast
import hashlib
import json
from pathlib import Path
import subprocess
import sys


def catalog(path):
    entries, current, field, fuzzy = {}, {}, None, False
    def finish():
        if not fuzzy and current.get('msgid') and current.get('msgstr'):
            entries[current['msgid']] = current['msgstr']
    for line in path.read_text().splitlines() + ['']:
        if not line:
            finish()
            current, field, fuzzy = {}, None, False
        elif line.startswith('#,') and 'fuzzy' in line:
            fuzzy = True
        elif line.startswith('msgid ') or line.startswith('msgstr '):
            field, value = line.split(' ', 1)
            current[field] = ast.literal_eval(value)
        elif line.startswith('"') and field:
            current[field] += ast.literal_eval(line)
    return entries


root = Path(__file__).resolve().parent.parent
target = root / 'lib/locales/postgresql-descriptions.json'
manifest_file = root / 'lib/locales/postgresql-descriptions.sources.json'
merge = sys.argv[1] == '--merge-existing'
languages = {'ko': 'ko', 'ja': 'ja', 'zh': 'zh_CN', 'es': 'es', 'fr': 'fr', 'de': 'de', 'ru': 'ru', 'pt': 'pt_BR',
             'id': 'id', 'it': 'it', 'ka': 'ka', 'pl': 'pl', 'sv': 'sv', 'tr': 'tr', 'uk': 'uk'}
if merge:
    output = json.loads(target.read_text())
    descriptions = output['en']
    manifest = json.loads(manifest_file.read_text())
    sources = manifest['sources']
else:
    raw = subprocess.check_output([sys.argv[1], '--describe-config'], text=True)
    descriptions = {}
    for line in raw.splitlines():
        cells = line.split('\t')
        if len(cells) >= 9:
            descriptions[cells[0]] = [value for value in cells[7:9] if value]
    output = {'en': descriptions}
    sources = {}
    manifest = {'version': subprocess.check_output([sys.argv[1], '--version'], text=True).strip(),
                'parameters': len(descriptions), 'describeConfigSha256': hashlib.sha256(raw.encode()).hexdigest(),
                'sources': sources}
for language, source in languages.items():
    path = Path(sys.argv[2]) / ('tastedev-postgres-' + source + '.po')
    if not path.exists() and (merge or language in ['id', 'it', 'ka', 'pl', 'sv', 'tr', 'uk']):
        continue
    translations = catalog(path)
    # Only complete explanations are marked translated. Never mix languages silently.
    output[language] = {name: [translations[text] for text in paragraphs]
                        for name, paragraphs in descriptions.items()
                        if all(text in translations for text in paragraphs)}
    sources[language] = {'url': 'https://github.com/postgres/postgres/blob/REL_18_STABLE/src/backend/po/' + source + '.po',
                         'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                         'translated': len(output[language])}
target.write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n')
manifest_file.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(manifest, indent=2))
