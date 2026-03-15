import os
import re

files = [
    "c:/Users/syafi/Casuist/src/app/page.tsx",
    "c:/Users/syafi/Casuist/src/app/specialties/page.tsx",
    "c:/Users/syafi/Casuist/src/app/case/page.tsx",
    "c:/Users/syafi/Casuist/src/app/scorecard/page.tsx"
]

for p in files:
    with open(p, 'r', encoding='utf-8') as f:
        content = f.read()
    content = re.sub(r'<!--(.*?)-->', r'{/*\1*/}', content, flags=re.DOTALL)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(content)

print("Comments fixed.")
