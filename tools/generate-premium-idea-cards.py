from __future__ import annotations

import json
import math
from datetime import datetime
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_ROOT = ROOT / "generated_outputs"
RUN_ID = datetime.now().strftime("premium_idea_cards_%Y%m%d_%H%M%S")
OUTPUT_DIR = OUTPUT_ROOT / RUN_ID
CARD_DIR = OUTPUT_DIR / "cards"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        Path("C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"),
        Path("C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf"),
        Path("C:/Windows/Fonts/calibrib.ttf" if bold else "C:/Windows/Fonts/calibri.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.load_default(size=size)


FONTS = {
    "eyebrow": font(26, True),
    "title": font(54, True),
    "subtitle": font(29),
    "section": font(25, True),
    "body": font(24),
    "small": font(21),
    "tiny": font(18),
}


PALETTES = [
    {"bg": "#F7F3EE", "ink": "#171717", "muted": "#5F5A54", "accent": "#9E3E32", "soft": "#E8DDD3"},
    {"bg": "#F4F8F7", "ink": "#12201F", "muted": "#526360", "accent": "#0F766E", "soft": "#DCEAE7"},
    {"bg": "#F8F6FA", "ink": "#1E1A24", "muted": "#61596B", "accent": "#7C3AED", "soft": "#E8E0F3"},
    {"bg": "#F6F7F2", "ink": "#161D14", "muted": "#56604E", "accent": "#5F7A35", "soft": "#E3E9D8"},
    {"bg": "#F7F4EF", "ink": "#211A16", "muted": "#665B53", "accent": "#B45309", "soft": "#EADFCC"},
    {"bg": "#F4F6FB", "ink": "#121826", "muted": "#596278", "accent": "#2563EB", "soft": "#DDE5F7"},
    {"bg": "#F6F4F1", "ink": "#1F1D1B", "muted": "#625E58", "accent": "#BE123C", "soft": "#EDE0E1"},
    {"bg": "#F2F7F4", "ink": "#122118", "muted": "#526059", "accent": "#15803D", "soft": "#DCEADF"},
    {"bg": "#F9F5F2", "ink": "#231816", "muted": "#6B5650", "accent": "#C2410C", "soft": "#F0DED5"},
    {"bg": "#F3F7FA", "ink": "#111C24", "muted": "#51606A", "accent": "#0369A1", "soft": "#DCE9F0"},
]


IDEAS = [
    {
        "category": "Beauty",
        "persona": "Luxury Editor",
        "title": "Final Degil, Karar Masasi",
        "premise": "Parlak final goruntusunden onceki 3 secim filtresi gosterilir; takipci urun degil karar standardi satin almis gibi hisseder.",
        "visual_hook": "0. saniye: kusursuz final close-up, 1. saniye: daginik ama estetik hazirlik masasi.",
        "scene_flow": ["Final meraki", "3 karar sorusu", "Sinir ve kanit", "Kaydedilebilir checklist"],
        "pose": "Hook'ta kameraya sakin bakis; proof'ta urune degil eleme kartina bak; payoff'ta kisa bilen gulumseme.",
        "broll": "Urun close-up, havlu dokusu, checklist yazimi, gercek duzeltme ani.",
        "edit": "0-2 sn hard cut, 3-12 sn karar filtresi, 13-28 sn proof, son 4 sn save CTA.",
        "caption": "Finalden onceki karar daha degerli. Siz rutinde neyi eleyince daha iyi sonuc aliyorsunuz?",
        "brand_lift": "Creator'i sadece urun gosteren degil, zevk ve karar standardi olan premium editor gibi konumlandirir.",
    },
    {
        "category": "Fashion",
        "persona": "Quiet Luxury Stylist",
        "title": "Pahali Gosteren Sey Kombin Degil, Eleme",
        "premise": "Creator ayni kombini uc kez bozup sadeleştirir; lüks hissin eklemekten degil elemekten geldigini gosterir.",
        "visual_hook": "Ayni aynada fazla aksesuarli look bir anda sade premium versiyona kesilir.",
        "scene_flow": ["Yanlis fazla look", "Eleme kriteri", "Texture proof", "Saveable style rule"],
        "pose": "Omuzlar rahat; elde tek parca tutulur; aynaya bakis ile kameraya bakis arasinda kontrollu gecis.",
        "broll": "Kumas texture, ayakkabi detay, aksesuar eleme, kapidan cikmadan once son kontrol.",
        "edit": "Split-screen once/sonra yerine use/skip rail; her elemede soft click ve overlay.",
        "caption": "Bugun kombine ne ekleyecegim degil, neyi cikarinca daha pahali duracak diye baktim.",
        "brand_lift": "Creator'in stil otoritesini satin alma baskisi olmadan, secim kalitesiyle buyutur.",
    },
    {
        "category": "Travel",
        "persona": "Expert Guide",
        "title": "Turistik Rota Degil, 17 Dakikalik Altin Aralik",
        "premise": "Populer lokasyonun en iyi cekim zamanini, kalabalik ve isik filtresiyle mini rehbere donusturur.",
        "visual_hook": "Kalabalik meydan 1 saniye; sonra bos, altin isikli ayni nokta.",
        "scene_flow": ["Kalabalik problem", "17 dakikalik pencere", "Cekim acisi", "Kaydet rotasi"],
        "pose": "Ilk planda hizli yuruyus; rehber bolumunde kameraya net bakis; finalde lokasyona yarim donus.",
        "broll": "Saat close-up, ayak/yol detayi, harita ekrani, kahve masasi, lokasyon genis plan.",
        "edit": "Map overlay kullan; her lokasyon icin 2 saniyelik proof shot; finalde mini rota karti.",
        "caption": "Burayi herkes gosteriyor, ama bu 17 dakikalik araligi bilen az.",
        "brand_lift": "Creator'i gezen biri degil, takipcinin zamandan tasarruf etmesini saglayan premium rehber yapar.",
    },
    {
        "category": "Food",
        "persona": "Taste Curator",
        "title": "Menude Siparis Edilmeyecek Sey",
        "premise": "Creator iyi restoran deneyimini 'ne siparis etmeli' yerine 'neyi pas gecmeli' filtresiyle anlatir.",
        "visual_hook": "Menuye el uzanir, durur, kalemle bir secenek elenir.",
        "scene_flow": ["Menu kararsizligi", "3 eleme kriteri", "Doku/koku proof", "Yorum sorusu"],
        "pose": "Masada hafif one egil; yiyecegi kameraya zorlamadan goster; tadimda abartisiz ifade.",
        "broll": "Menu isaretleme, tabak doku close-up, garson servis ani, ortam detayi.",
        "edit": "Her kriter icin mini overlay: agirlik, tekrar, masa uyumu. Son kare pinned comment sorusu.",
        "caption": "Iyi siparis bazen dogru seyi secmek degil, yanlis cazibeyi elemek.",
        "brand_lift": "Creator'in damak zevkini pahali ama ulasilabilir bir karar sistemi gibi hissettirir.",
    },
    {
        "category": "Fitness / Wellness",
        "persona": "Calm Coach",
        "title": "Bugun Daha Az Yapmanin Kaniti",
        "premise": "Yuksek performans baskisi yerine, bugunku enerjiye gore daha akilli ve guvenli antrenman secimi anlatilir.",
        "visual_hook": "Ağir agirlik tutulur, creator nefes alir ve daha kontrollu varyasyona gecer.",
        "scene_flow": ["Ego lift tuzagi", "Enerji kontrolu", "Guvenli varyasyon", "Yarin icin kazanc"],
        "pose": "Nefes gorunur olsun; aynada kendini kontrol et; finalde sakin onay bas hareketi.",
        "broll": "Ayakkabi baglama, nabiz/nefes ani, hafif agirlik secimi, hareket form close-up.",
        "edit": "Agresif muzik yerine kontrollu ritim; form overlay; mucize vaat yok.",
        "caption": "Bugun daha az yapmak gerilemek degil, yarini korumak olabilir.",
        "brand_lift": "Creator'i sadece motive eden degil, takipcisini riske atmayan guvenilir performans rehberi yapar.",
    },
    {
        "category": "Luxury Lifestyle",
        "persona": "Relatable Luxury",
        "title": "Luks Hissin Ucuz Sirri",
        "premise": "Pahali gorunen bir sabah rutinindeki esas hissin urun fiyatindan degil, ritim ve duzenden geldigini gosterir.",
        "visual_hook": "Premium masa goruntusu; sonra ayni masanin 5 dakikalik sade kurulumu.",
        "scene_flow": ["Pahali goruntu", "Ucuz kurulum", "Ritim detayi", "Kendi versiyonunu yap"],
        "pose": "Acele yok; eller yavas; kahve/defter gibi objeleri reklam gibi degil yasam detayi gibi tut.",
        "broll": "Perde acilmasi, bardak sesi, defter kenari, masa silme, telefon sessize alma.",
        "edit": "Soft ASMR parcalari; 3 maddelik atmosfer formulu; finalde story poll.",
        "caption": "Luks bazen satin aldigin sey degil, sabahin ritmini nasil kurdugun.",
        "brand_lift": "Creator'i ulasilmaz luks yerine takipcinin kendi hayatina tasiyabilecegi zevk rehberi yapar.",
    },
    {
        "category": "Comedy / Relatable",
        "persona": "Smart Observer",
        "title": "Benim Profesyonel Gorunme Protokolum",
        "premise": "Creator ciddi toplantıya hazirlanirken ic monolog ve mini burokratik checklist ile relatable komedi kurar.",
        "visual_hook": "Cok ciddi yuz ifadesiyle 'normal insan gibi davran' yazili notu kapatir.",
        "scene_flow": ["Ciddi dis goruntu", "Ic protokol", "Kucuk hata", "Takipci itirafi"],
        "pose": "Disarida ciddi; ic monologda gozlerle mikro panik; hatada kisa donup kameraya bak.",
        "broll": "Laptop acilisi, not kagidi, su bardagi, kamera acmadan once son duzeltme.",
        "edit": "Resmi overlayler ile absurt basliklar; 0.5 saniyelik reaction cut.",
        "caption": "Disaridan profesyonel, iceriden 'lutfen ekran paylasimi calissin'.",
        "brand_lift": "Creator'i zeki, kendini fazla ciddiye almayan ve takipcisiyle ayni odada hissettiren biri yapar.",
    },
    {
        "category": "Home / Decor",
        "persona": "Practical Aesthete",
        "title": "Odayi Degil, Ilk Bakis Noktasini Duzelt",
        "premise": "Komple dekor degisimi yerine kamerada ilk gorunen 3 noktayi duzenleyerek buyuk fark hissi verir.",
        "visual_hook": "Kamera acilir: daginik oda; el lensi kapatir, acildiginda sadece ilk bakis noktasi duzelmistir.",
        "scene_flow": ["Daginiklik panigi", "3 nokta secimi", "Before/after yerine frame proof", "Save map"],
        "pose": "El hareketleri net; objeyi abartmadan yerlestir; finalde kadraja yandan gir.",
        "broll": "Yastik duzeltme, kablo saklama, lamba acisi, sehpa uzeri tek obje.",
        "edit": "Frame grid overlay; her nokta icin 1 saniye once/sonra yerine cover/uncover.",
        "caption": "Butun odayi degil, kameranin ilk gordugu yeri duzelt.",
        "brand_lift": "Creator'i pahali dekor satan degil, takipcinin evini daha iyi gosteren pratik estet yapar.",
    },
    {
        "category": "Business / Creator Economy",
        "persona": "Founder Creator",
        "title": "Bu Teklifi Neden Kabul Etmedim",
        "premise": "Creator bir marka is birligini reddetme kriterlerini isim/veri sizdirmeden anlatarak guven ve premium algi kurar.",
        "visual_hook": "Mail subject blurlu; creator 'para iyi ama uyum yok' yazili notu gosterir.",
        "scene_flow": ["Cazip teklif", "3 uyum filtresi", "Kibar red dili", "Takipciye karar sorusu"],
        "pose": "Masada dik otur; notlara bakarken dusunceli; kibar red cumlesinde kameraya net bak.",
        "broll": "Blurlu email, not defteri, takvim, kahve, marka-fit checklist.",
        "edit": "Hic marka adi yok; claim yok; sadece karar framework'u ve safer phrase.",
        "caption": "Her iyi teklif iyi is birligi degil. Ben boyle eliyorum.",
        "brand_lift": "Creator'i sadece ulasilan degil, secen ve marka guvenini koruyan premium partner gibi konumlandirir.",
    },
    {
        "category": "Parenting / Family Lifestyle",
        "persona": "Warm Realist",
        "title": "Mukemmel Rutin Yerine Kurtaran 7 Dakika",
        "premise": "Aile/ev hayatinda kusursuz sabah rutini degil, gercek hayatta gunu kurtaran 7 dakikalik mikro sistem anlatilir.",
        "visual_hook": "Hazirlanmis sakin masa; sert cut ile gercek daginik sabah ve 7 dakikalik timer.",
        "scene_flow": ["Mukemmel rutin miti", "7 dakika sistemi", "Gercek aksama", "Yorum/story poll"],
        "pose": "Sicak ama yorgun gerceklik; kameraya 'bende de boyle' bakisi; finalde rahat nefes.",
        "broll": "Timer, canta hazirlama, anahtar sepeti, kahvalti mini duzeni, unutulan ufak detay.",
        "edit": "Cocuk/mahremiyet gorunurse yuz yok; aileyi koruyan kadraj; sakin CTA.",
        "caption": "Mukemmel rutin degil, sabahi kurtaran 7 dakika.",
        "brand_lift": "Creator'i kusursuzluk baskisi kurmayan, takipcisini rahatlatan guvenli ve sicak rehber yapar.",
    },
]


def hex_to_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


def rounded(draw: ImageDraw.ImageDraw, xy: tuple[int, int, int, int], radius: int, fill: str, outline: str | None = None, width: int = 1) -> None:
    draw.rounded_rectangle(xy, radius=radius, fill=hex_to_rgb(fill), outline=hex_to_rgb(outline) if outline else None, width=width)


def wrap_text(draw: ImageDraw.ImageDraw, text: str, text_font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        test = f"{current} {word}".strip()
        if draw.textbbox((0, 0), test, font=text_font)[2] <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_wrapped(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, text_font: ImageFont.FreeTypeFont, fill: str, max_width: int, line_gap: int = 6) -> int:
    x, y = xy
    line_height = text_font.size + line_gap
    for line in wrap_text(draw, text, text_font, max_width):
        draw.text((x, y), line, font=text_font, fill=hex_to_rgb(fill))
        y += line_height
    return y


def draw_section(draw: ImageDraw.ImageDraw, x: int, y: int, width: int, label: str, body: str | Iterable[str], palette: dict[str, str]) -> int:
    draw.text((x, y), label.upper(), font=FONTS["section"], fill=hex_to_rgb(palette["accent"]))
    y += 35
    if isinstance(body, str):
        y = draw_wrapped(draw, (x, y), body, FONTS["body"], palette["ink"], width, line_gap=7)
    else:
        for item in body:
            bullet_y = y + 8
            draw.ellipse((x, bullet_y, x + 9, bullet_y + 9), fill=hex_to_rgb(palette["accent"]))
            y = draw_wrapped(draw, (x + 24, y), str(item), FONTS["body"], palette["ink"], width - 24, line_gap=7)
    return y + 22


def create_card(idea: dict[str, object], index: int) -> Path:
    palette = PALETTES[(index - 1) % len(PALETTES)]
    img = Image.new("RGB", (1200, 1600), hex_to_rgb(palette["bg"]))
    draw = ImageDraw.Draw(img)

    # Premium editorial frame.
    rounded(draw, (54, 54, 1146, 1546), 34, palette["bg"], palette["accent"], 3)
    rounded(draw, (84, 92, 1116, 236), 28, palette["soft"])
    draw.text((112, 122), f"PREMIUM VIRAL BOX  /  {idea['category']}  /  {idea['persona']}", font=FONTS["eyebrow"], fill=hex_to_rgb(palette["accent"]))
    draw.text((1020, 120), f"{index:02d}", font=FONTS["title"], fill=hex_to_rgb(palette["accent"]))

    y = 280
    y = draw_wrapped(draw, (88, y), str(idea["title"]), FONTS["title"], palette["ink"], 1010, line_gap=10)
    y += 18
    y = draw_wrapped(draw, (88, y), str(idea["premise"]), FONTS["subtitle"], palette["muted"], 1010, line_gap=8)
    y += 22

    rounded(draw, (88, y, 1112, y + 108), 22, palette["soft"])
    draw.text((116, y + 22), "ILK 1 SANIYE GORSEL HOOK", font=FONTS["section"], fill=hex_to_rgb(palette["accent"]))
    draw_wrapped(draw, (116, y + 58), str(idea["visual_hook"]), FONTS["body"], palette["ink"], 950, line_gap=6)
    y += 142

    left_x, right_x = 88, 625
    col_w = 475
    left_y = y
    right_y = y
    left_y = draw_section(draw, left_x, left_y, col_w, "Sahne Akisi", idea["scene_flow"], palette)
    left_y = draw_section(draw, left_x, left_y, col_w, "Poz ve Mikro Davranis", str(idea["pose"]), palette)
    left_y = draw_section(draw, left_x, left_y, col_w, "B-Roll", str(idea["broll"]), palette)

    right_y = draw_section(draw, right_x, right_y, col_w, "Edit Timeline", str(idea["edit"]), palette)
    right_y = draw_section(draw, right_x, right_y, col_w, "Caption + Comment", str(idea["caption"]), palette)
    right_y = draw_section(draw, right_x, right_y, col_w, "Brand Lift", str(idea["brand_lift"]), palette)

    footer_y = 1442
    rounded(draw, (88, footer_y, 1112, 1516), 22, "#FFFFFF")
    draw.text((116, footer_y + 20), "CREATOR-FACING KART", font=FONTS["small"], fill=hex_to_rgb(palette["accent"]))
    draw.text((388, footer_y + 20), "Skor, band ve training kaynagi influencer'a gosterilmez.", font=FONTS["small"], fill=hex_to_rgb(palette["muted"]))

    path = CARD_DIR / f"premium_idea_card_{index:02d}.png"
    img.save(path, quality=96)
    return path


def create_contact_sheet(paths: list[Path]) -> Path:
    thumbs = []
    for path in paths:
        img = Image.open(path).resize((360, 480))
        thumbs.append(img)

    cols = 5
    rows = math.ceil(len(thumbs) / cols)
    sheet = Image.new("RGB", (cols * 390 + 30, rows * 520 + 90), (246, 246, 243))
    draw = ImageDraw.Draw(sheet)
    draw.text((30, 24), "Premium ViralBox Idea Cards", font=FONTS["title"], fill=(20, 20, 20))
    for idx, thumb in enumerate(thumbs):
        x = 30 + (idx % cols) * 390
        y = 90 + (idx // cols) * 520
        sheet.paste(thumb, (x, y))
        draw.text((x, y + 488), f"Card {idx + 1:02d}", font=FONTS["small"], fill=(70, 70, 70))

    path = OUTPUT_DIR / "contact_sheet.png"
    sheet.save(path, quality=95)
    return path


def write_index(paths: list[Path]) -> None:
    cards_html = "\n".join(
        f'<article><img src="cards/{path.name}" alt="Premium idea card {i:02d}"><h2>{i:02d}. {IDEAS[i-1]["title"]}</h2><p>{IDEAS[i-1]["premise"]}</p></article>'
        for i, path in enumerate(paths, start=1)
    )
    html = f"""<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Premium ViralBox Idea Cards</title>
  <style>
    body {{ margin: 0; font-family: Arial, sans-serif; background: #f3f0eb; color: #191919; }}
    header {{ padding: 32px; max-width: 1180px; margin: 0 auto; }}
    h1 {{ margin: 0 0 8px; font-size: 36px; }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; max-width: 1180px; margin: 0 auto 48px; padding: 0 32px; }}
    article {{ background: white; border: 1px solid #ddd5cb; border-radius: 12px; padding: 14px; }}
    img {{ width: 100%; display: block; border-radius: 8px; }}
    h2 {{ font-size: 18px; margin: 14px 0 8px; }}
    p {{ color: #5b5650; line-height: 1.45; }}
  </style>
</head>
<body>
  <header>
    <h1>Premium ViralBox Idea Cards</h1>
    <p>10 adet creator-facing premium fikir karti. Internal skor, band ve training kaynagi gosterilmez.</p>
  </header>
  <main class="grid">
    {cards_html}
  </main>
</body>
</html>
"""
    (OUTPUT_DIR / "index.html").write_text(html, encoding="utf-8")


def main() -> None:
    CARD_DIR.mkdir(parents=True, exist_ok=True)
    paths = [create_card(idea, index) for index, idea in enumerate(IDEAS, start=1)]
    create_contact_sheet(paths)
    write_index(paths)
    (OUTPUT_DIR / "premium_ideas.json").write_text(json.dumps(IDEAS, ensure_ascii=False, indent=2), encoding="utf-8")
    print(OUTPUT_DIR)


if __name__ == "__main__":
    main()

