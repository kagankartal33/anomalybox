# Viral Corpus Training Methodology

`son_10_yil_viral_fikirler.md` proje icin ham fikir bankasi degildir. Bu dosya 2016-2026 arasindaki viral davranislari anlamak icin kullanilan bir egitim corpus'udur.

## Goal

Generator eski viral icerikleri kopyalamaz. Her ornek su sorularla soyutlanir:

- Insanlar neden katildi?
- Format neden tekrar edilebildi?
- Hangi duygu tetiklendi?
- Hangi platform ozelligi bunu buyuttu?
- Riskli veya artik eskimis tarafi neydi?
- Bu mekanizma high-profile influencer icin nasil guvenli ve premium hale gelir?

## Pipeline

```text
local markdown research
-> viral_training_sources
-> viral_training_examples
-> viral_pattern_rules
-> generator_eval_cases
-> generator prompt and scoring configs
```

## Training Policy

| Kural | Aciklama |
|---|---|
| Pattern only | Yuzey, karakter, soz, kisi, marka veya birebir format kopyalanmaz |
| Anti-copy | Eski viral ornek sadece mekanizma olarak kullanilir |
| Negative examples | Tehlikeli challenge'lar generator icin yasak sinyaldir |
| Platform-native | Pattern Reels, Story, Carousel veya Shorts davranisina uyarlanir |
| Premium adaptation | High-profile influencer icin brand lift, sponsor guvenligi ve itibar etkisi eklenir |

## Core Learned Mechanisms

| Pattern | Ne Ogretir |
|---|---|
| `VTP-001` Participation Challenge Loop | Katilimi kolay, dusuk riskli challenge tasarlama |
| `VTP-002` Nostalgia Delta Loop | Gecmis referansi bugunku kimlik ve yorumla yenileme |
| `VTP-003` Meme Template Translation | Meme'in duygu geometrisini kategoriye cevirmek |
| `VTP-004` Transformation Without Harm | Before/after baskisi olmadan reveal uretmek |
| `VTP-005` Interactive Live Trigger | Yorum, poll veya live input ile ortak uretim |
| `VTP-006` AI Assisted Self-Remix | AI'yi disclosure ve insan yorumu ile guvenli kullanmak |
| `VTP-007` Imperfect Human Proof | AI/polished backlash caginda insan sureci gostermek |
| `VTP-008` Social Commerce Entertainment | Once eglence/kanit, sonra dusuk baskili conversion |

## Safety

Tehlikeli viral formatlar egitimde yasak ornek olarak tutulur. Generator:

- fiziksel zarar ihtimali olan challenge uretmez,
- saglik/finans/hukuk iddialarinda claim boundary ister,
- AI kullaniliyorsa disclosure ister,
- kisi/creator/telif/marka taklidi yapmaz,
- hassas sosyal hareketleri kampanya malzemesi gibi kullanmaz.

## Evaluation

`generator_eval_cases` her yeni generator degisikliginde kontrol edilmelidir. Basarili cikti:

- beklenen VTP mekanizmalarini fikrin ic mantiginda kullanir,
- yasakli pattern'leri uretmez,
- skor, band veya internal training bilgisini influencer kartina sizdirmaz,
- premium kart alanlarini eksiksiz doldurur.