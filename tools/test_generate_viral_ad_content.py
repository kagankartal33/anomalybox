"""
test_generate_viral_ad_content.py
=================================
Generates an educational article on "Viral Reklam Mimarisi" using our 
unified training directives and tests it against the 3-Layer Originality Gate.
"""

import sys
from pathlib import Path
from originality_gate import OriginalityGate

ARTICLE_TITLE = "Viral Reklam Mimarisi: Sosyal Medyada Paylaşılma Oranı Yüksek Reklam Kurguları"

ARTICLE_TEXT = """# Viral Reklam Mimarisi: Sosyal Medyada Paylaşılma Oranı Yüksek Reklam Kurguları

**Viral reklam, izleyicinin reklamı sadece izlemekle kalmayıp doğrudan mesajlaşma uygulamaları (DM, WhatsApp) veya hikayeler üzerinden başkalarına göndermesini (Share Trigger) sağlayan yüksek etkileşimli video kurgusudur. Başarılı bir viral reklam, ürünü doğrudan satmaya çalışmak yerine izleyicide merak, şaşırma veya özdeşleşme hissi uyandırarak reklam algısını ortadan kaldırır.**

Büyük bütçeler harcamak bir reklamın izlenmesini garanti etmez. Son 10 yılın en çok paylaşılan reklam kampanyalarını incelediğimizde, başarının tesadüf değil, algoritmik ve psikolojik bir kurgu olduğunu görüyoruz.

## Viral Reklam Kurgusunun 3 Temel Yapıtaşı

Bir reklam filminin viral olması için ilk 0.5 saniyeden son saniyesine kadar belirli psikolojik eşikleri aşması gerekir:

| Kurgu Aşaması | Süre (Saniye) | Hedeflenen Davranış | Başarısızlık Riski |
| :--- | :--- | :--- | :--- |
| **Görsel Kanca (Visual Hook)** | 0.0 - 1.5 sn | Kaydırmayı durdurma (Pattern Interrupt) | Sıradan marka logosu göstermek |
| **Bilgi/Duygu Kazancı** | 1.5 - 15.0 sn | İzleme süresini uzatma (Watch Time) | Yavaş açılış ve uzun jenerik |
| **Paylaşma Tetikleyicisi** | 15.0 - 30.0 sn | DM/Story üzerinden paylaşma (Share) | Belirsiz Çağrı (Weak CTA) |

### 1. Deseni Kırma (Pattern Interrupt)
İzleyiciler sosyal medyada kaydırma yaparken beyinleri otomatik pilotta çalışır. İlk 1.5 saniyede sıra dışı bir ses, beklenmedik bir hareket veya soru sormadan doğrudan aksiyona başlayan bir görüntü yerleştirilmelidir.

### 2. Paylaşma Tetikleyicisi (Share Trigger)
İnsanlar içerikleri iki temel sebeple paylaşır: Ya arkadaşını güldürmek/şaşırtmak ister ya da "Bak bu tam senlik!" diyerek bir durumla özdeşleşir. Reklam senaryonuzu yazarken kendinize şu soruyu sorun: *Bir insan bu videoyu neden arkadaşına DM ile atsın?*

## Sıkça Sorulan Sorular

### Viral reklam bütçe ile mi alakalıdır?
Hayır. Yüksek bütçeli reklamlar sadece erişim satın alır. İnsanların kendi isteğiyle videoyu yayması (organik yayılım) tamamen hikaye anlatımı, duygusal bağ ve ilk 1.5 saniyelik görsel kancaya bağlıdır.

### Reklamda marka logosu ne zaman gösterilmelidir?
Logo ilk saniyede ekrana basılırsa izleyici bunu otomatik olarak "satış videosu" olarak algılar ve kaydırır. Marka, hikayenin doğal bir çözümü olarak videonun ortasında veya sonunda organik şekilde belirmelidir.
"""

def main():
    print("=" * 65)
    print("  VIRAL AD EDUCATIONAL CONTENT GENERATION & ORIGINALITY CHECK")
    print("=" * 65)
    
    # Reference sample database
    references = [
        {"id": "REF-SEO-01", "text": "Answer Engine Optimization (AEO) requires creators to place a bolded summary at the top."},
        {"id": "REF-COMP-01", "text": "Standard advertising relies on heavy media buying rather than organic sharing triggers."}
    ]
    
    gate = OriginalityGate(references)
    res = gate.evaluate(ARTICLE_TEXT)
    
    print(f"\n📑 Title: {ARTICLE_TITLE}")
    print(f"📏 Word Count: {len(ARTICLE_TEXT.split())} words")
    print(f"\n🛡️ ORIGINALITY GATE RESULT:")
    print(f"   • Status: {res.status}")
    print(f"   • Exact Match: {res.exact_match}")
    print(f"   • Max Jaccard (5-gram): {res.max_jaccard_score}")
    print(f"   • Max Cosine Similarity: {res.max_cosine_score}")
    print(f"   • Details: {res.details}")
    
    if res.status == "PASS":
        print("\n✅ SUCCESS: Content passed all 3 deduplication layers and AI-Free sanitization rules!")
    else:
        print("\n❌ WARNING: Content requires editorial review.")

if __name__ == "__main__":
    main()
