import json
from pathlib import Path

ROOT = Path(".")

# 1. Update lib/seo-package.ts
package_ts = ROOT / "lib" / "seo-package.ts"
code = package_ts.read_text(encoding="utf-8")

# Replace published / dateModified in loadLegacyResourcePages
target_old = 'function loadLegacyResourcePages(): SeoPackagePage[] {\n  const published = "2026-08-09T00:00:00Z";'
target_crlf = 'function loadLegacyResourcePages(): SeoPackagePage[] {\r\n  const published = "2026-08-09T00:00:00Z";'

if target_old in code:
    code = code.replace(
        target_old,
        'function loadLegacyResourcePages(): SeoPackagePage[] {\n  const published = "2026-08-09T00:00:00Z";\n  const modified = "2026-11-21T15:00:00Z";'
    )
    code = code.replace("dateModified: published,", "dateModified: modified,")
elif target_crlf in code:
    code = code.replace(
        target_crlf,
        'function loadLegacyResourcePages(): SeoPackagePage[] {\r\n  const published = "2026-08-09T00:00:00Z";\r\n  const modified = "2026-11-21T15:00:00Z";'
    )
    code = code.replace("dateModified: published,", "dateModified: modified,")
else:
    print("WARNING: Could not find target in lib/seo-package.ts")

package_ts.write_text(code, encoding="utf-8")
print("Updated lib/seo-package.ts dateModified to 2026-11-21T15:00:00Z.")

# 2. Update lib/seo-package-registry.json dateModified
reg_file = ROOT / "lib" / "seo-package-registry.json"
reg_data = json.loads(reg_file.read_text(encoding="utf-8"))
count = 0
for page in reg_data.get("pages", []):
    page["dateModified"] = "2026-11-21T15:00:00Z"
    count += 1

reg_file.write_text(json.dumps(reg_data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"Updated {count} registry pages in lib/seo-package-registry.json to dateModified: 2026-11-21T15:00:00Z.")
