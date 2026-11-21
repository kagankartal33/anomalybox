from pathlib import Path

ROOT = Path(".")
footer_file = ROOT / "components" / "SiteFooter.tsx"
text = footer_file.read_text(encoding="utf-8")

old_snippet = """              <li>
                <Link href="/resources" className="text-ink/75 transition hover:text-ink">
                  Creator Resources
                </Link>
              </li>"""

new_snippet = """              <li>
                <Link href="/resources" className="text-ink/75 transition hover:text-ink">
                  Creator Resources
                </Link>
              </li>
              <li>
                <Link href="/resources#all-guides-heading" className="text-ink/75 transition hover:text-ink">
                  Production Guides Directory (94)
                </Link>
              </li>"""

if old_snippet in text:
    text = text.replace(old_snippet, new_snippet)
    footer_file.write_text(text, encoding="utf-8")
    print("Updated SiteFooter.tsx with Production Guides Directory link.")
else:
    # Try with CRLF
    old_crlf = old_snippet.replace("\n", "\r\n")
    new_crlf = new_snippet.replace("\n", "\r\n")
    if old_crlf in text:
        text = text.replace(old_crlf, new_crlf)
        footer_file.write_text(text, encoding="utf-8")
        print("Updated SiteFooter.tsx with Production Guides Directory link (CRLF).")
    else:
        print("WARNING: Could not find snippet in SiteFooter.tsx")
