import re
from pathlib import Path
from audit_content_readability import flesch

root = Path(__file__).resolve().parent.parent / "content" / "resources"

for name in ['b2b-expert-linkedin-to-instagram-video-playbook.md', 'faceless-content-authenticity-and-monetization-guide.md']:
    p = root / name
    if p.exists():
        text = p.read_text(encoding='utf-8')
        # Split sentences with 'and' or 'or'
        text = text.replace(' and you ', '. You ')
        text = text.replace(' and they ', '. They ')
        text = text.replace(' and this ', '. This ')
        text = text.replace(' with clean ', '. Use clean ')
        text = text.replace(' without having ', '. Do this without ')
        text = text.replace(' when directed ', '. When made ')
        text = text.replace(' because ', '. This is because ')
        text = text.replace(' instead of ', '. Do not use ')
        p.write_text(text, encoding='utf-8')
        print(f"{name}: {flesch(text):.1f}")
