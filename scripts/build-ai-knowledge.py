"""Build grounded course context from the existing public course pages."""
from pathlib import Path
from html.parser import HTMLParser
import json, re

ROOT = Path(__file__).resolve().parent.parent
class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.tags=[]; self.text=[]; self.feed(text)
    def handle_starttag(self, tag, attrs): self.tags.append((tag,dict(attrs)))
    def handle_data(self, data):
        if data.strip(): self.text.append(data.strip())

courses=[]
for region in ['reykjavik','akureyri','egilsstadir','vesturland']:
    listing=Page((ROOT/(region+'.html')).read_text())
    for tag, attrs in listing.tags:
        if tag!='a' or 'reyk-card' not in attrs.get('class','').split(): continue
        filename=attrs['href']; raw=(ROOT/filename).read_text(); page=Page(raw)
        name=re.search(r'<title>(.*?) •',raw).group(1)
        description=next(a.get('content','') for t,a in page.tags if t=='meta' and a.get('name')=='description')
        main=re.search(r'<main\b[^>]*>(.*?)</main>',raw,re.S)
        dialogs=re.findall(r'<dialog\b[^>]*>(.*?)</dialog>',raw,re.S)
        details=' '.join(Page((main.group(1) if main else '')+' '.join(dialogs)).text)
        sources=list(dict.fromkeys(a['href'] for t,a in page.tags if t=='a' and a.get('href','').startswith('https://')))
        courses.append(dict(name=name,region=region,page=filename,description=description,details=details[:6000],sources=sources))
assert len(courses)==28, f'Expected 28 listed courses, found {len(courses)}'
(ROOT/'ai-server/course-knowledge.json').write_text(json.dumps(courses,ensure_ascii=False,indent=2)+'\n')
print(f'Indexed {len(courses)} courses from the four region pages.')
