# AnomalyBox (`anomalybox.com`) Master SEO, Indexation & Ranking Execution Plan
## 9 Komuta Bölümü (Divisions) & 35 Uzman Ajanlı Bütünleşik Kod ve İçerik Geliştirme Master Planı

**Tarih:** 2026-11-01  
**Hedef Alan Adı:** `https://anomalybox.com`  
**Kaynak Kod Dizini:** `c:\Users\Kagan\OneDrive\Desktop\ViralBox`  
**Referans Mimarisi:** `c:\Users\Kagan\OneDrive\Desktop\anomalybox-seo-8-agent-sistemi.md` + 8 Yeni Kod/İçerik Geliştirme Ajanı  
**Kapsam Derecesi:** %100 Full-Spectrum (9 Komuta Bölümü / 35 Operasyonel Ajan Birimi)  
**Durum:** Uygulanabilir Master Eylem Planı (Execution Blueprint)  

---

## Executive Summary: Neden 1. Sırada Değiliz ve Bu Master Plan Neyi Çözer?

Mevcut kod tabanı (`c:\Users\Kagan\OneDrive\Desktop\ViralBox`), canlı site taramaları (`tools/test-sitemap-crawler.mjs`), Google Search Console (GSC) verileri, 247 içerik dosyası ve masaüstündeki 8'li Ajan Sistemi referansı sentezlendiğinde karşılaşılan tablo:

1. **Google İndeksleme Reddi (146 Sayfa Engeli):**
   - **108 URL "Crawled - currently not indexed":** Googlebot sayfaları taradı ancak DR 0 seviyesindeki apex üzerinde %64'e varan 6-word shingle benzerliği (şablon tekrarı) gördüğü için indekslemeyi reddetti.
   - **38 URL "Discovered - currently not indexed":** Tarama bütçesi yetersizliğinden taranmaya dahi değer bulunmadı.
2. **Crawl Budget Tüketimi & Bot İstismarı:**
   - Next.js RSC (React Server Component) sorguları (`?_rsc=...`) Googlebot taramalarının %77'sini yuttu. (Robots.txt kuralı ile engellendi).
   - Yetkisiz AI scraper botları (Bytespider, CCBot vb.) SSR kaynaklarını kilitleyerek TTFB'yi yavaşlattı. (Yeni `Disallow: /` kuralları ile sınırlandırıldı).
3. **Keyword Cannibalization & Niyet Çakışması:**
   - Bilgi sayfalarının para sayfalarını ezmesi: `/resources/anomalybox-classic-red-dossier-review` sayfası doğrudan `/dossiers/classic-red` ürün sayfasıyla rekabete girdi.
   - 7 adet "burnout" sayfası ve 5 adet "content ideas" sayfası aynı arama terimlerini bölerek sıralama gücünü sıfırladı. (Faz 1 ve Faz 2 konsolidasyonu ile 84 URL, 40 ana yetkin pillar sayfaya 308 ile yönlendirildi).
4. **SERP 1. Sıra Bariyeri:**
   - Jenerik anahtar kelimelerde (`reels creative brief template`) rakipler: Notion (DA 92), ManyRequests (DA 74), Buffer (DA 89).
   - Çözüm: **BOFU mikro-niş anahtar kelimeler** (`instagram shoot briefs`), **programatik araçlar** (`/tools/*`) ve **GEO (Generative Engine Optimization)** ile AI arama motorlarında (Perplexity, ChatGPT, SGE) alıntı liderliği.
5. **Kod ve İçerik Derinliği İhtiyacı (8 Yeni Ajanın Misyonu):**
   - Yalnızca teknik redirects ve meta etiketleri yetmez; 247 markdown içeriğinin okunabilirliği (Flesch skoru), birinci elden çekim formülleri, sıfır yapay zeka kalıntısı (Zero AI-Slop), zengin React bileşenleri, 100% özgün SVG infografikleri ve semantik entity şemalarıyla **içeriden dışarıya kod ve içerik seviyesinde dönüştürülmesi** gerekir.

---

## BÖLÜM 1: 9 Komuta Bölümü & 35 Uzman Ajan Hiyerarşisi

Sistem, üst düzey 9 operasyonel komuta bölümü ve bunların emrindeki 35 teknik uzman ajandan oluşur:

```mermaid
graph TD
    subgraph ORCHESTRATION["1. Master Komuta & Koordinasyon"]
        C1["COMMANDER 01: SEO COMMANDER<br/>(Master Audit & Orchestrator)"]
    end

    subgraph DIVISIONS["2. İcra ve Denetim Bölümleri (Execution Divisions)"]
        D2["DIV 02: GOOGLE INDEX DOCTOR<br/>(Tarama, İndeks & Bot Denetimi)"]
        D3["DIV 03: CANONICAL ARCHITECT<br/>(URL Hijyeni & 308 Konsolidasyon)"]
        D4["DIV 04: TECHNICAL SEO ENGINEER<br/>(Next.js SSR/ISR & Core Web Vitals)"]
        D5["DIV 05: CONTENT INTELLIGENCE<br/>(Topical Moat & 0% Şablon Tekrarı)"]
        D6["DIV 06: SERP DOMINATOR<br/>(Şema, Görsel/Video & GEO/LLMs)"]
        D7["DIV 07: AUTHORITY GUARDIAN<br/>(Güven, PR & Vault/Politika Koruma)"]
    end

    subgraph MODERNIZATION["3. Kod ve İçerik Yenileme Motoru (YENİ)"]
        D9["DIV 09: CODE & CONTENT MODERNIZATION<br/>(8 Derin Kod & İçerik Dönüştürme Ajanı)"]
    end

    subgraph QA_LOOP["4. Sürekli Kalite, Regresyon & Otomasyon"]
        S8["SENTINEL 08: SEO SENTINEL<br/>(Test, Doğrulama, CI/CD & IndexNow)"]
    end

    C1 --> D2 & D3 & D4 & D5 & D6 & D7
    C1 --> D9
    D9 --> D5 & D6 & D4
    D2 & D3 & D4 & D5 & D6 & D7 & D9 --> S8
    S8 -- "Regresyon Raporu & Geri Bildirim Döngüsü" --> C1
```

---

## BÖLÜM 2: 9 Komuta Bölümü ve 35 Uzman Ajanın Görev Dağılım Matrisi

| Komuta Bölümü (Division) | Sorumlu Uzman Alt Ajanlar | Temel Görev & İnceleme Alanı | Kod ve Betik Entegrasyonu | Somut Çıktı / Artefakt |
|:---|:---|:---|:---|:---|
| **01. SEO COMMANDER**<br>*(Master Orchestrator)* | **P1** (Master Strategy)<br>**P6** (Content Lifecycle)<br>**P7** (Monetization Moat)<br>**A5** (Opportunity Matrix) | Tüm URL envanterini çıkarma, P0–P3 öncelik matrisi, çakışan değişiklikleri yönetme, para sayfaları ile keşif sayfalarını hizalama. | [lib/seo-metadata.ts](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/lib/seo-metadata.ts)<br>[lib/template-policy.ts](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/lib/template-policy.ts)<br>[tools/deep-crawler.mjs](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/tools/deep-crawler.mjs) | `seo-master-audit.json`<br>Görev Panosu<br>Önceliklendirilmiş Backlog |
| **02. GOOGLE INDEX DOCTOR**<br>*(Crawling & Indexing)* | **P3** (Technical Indexing)<br>**A1** (Index Failure Investigator)<br>**A15** (Edge & Bot Governance)<br>**A16** (Server Log Telemetry) | 108 taranan + 38 keşfedilen reddedilmiş sayfayı URL bazında çözme, RSC payload (`?_rsc=`) tarama bütçesi sızıntısını sıfırlama, scraper botlarını sınırlama. | [app/robots.ts](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/app/robots.ts)<br>[app/sitemap.ts](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/app/sitemap.ts)<br>[tools/test-sitemap-crawler.mjs](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/tools/test-sitemap-crawler.mjs) | Düzeltilmiş Robots.txt<br>Hassas Sitemap (120-140 URL)<br>Tarama Bütçesi Raporu |
| **03. CANONICAL ARCHITECT**<br>*(URL & Internal Linking)* | **A3** (Cannibalization Auditor)<br>**A9** (PageRank Flow Optimizer)<br>**A17** (URL Architecture & Parameter Traps) | 308 yönlendirme zincirlerini tek adıma indirme, trailing slash ve www/non-www standardizasyonu, yetim sayfaları kurtaran Hub-and-Spoke iç bağlantı ağı. | [lib/seo-consolidation.json](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/lib/seo-consolidation.json)<br>[next.config.ts](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/next.config.ts)<br>[tools/check-orphan-pages.py](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/tools/check-orphan-pages.py) | 308 Konsolidasyon Matrisi<br>Canonical Eşleştirme Tablosu<br>Topical Hub Mimarisi |
| **04. TECHNICAL SEO ENGINEER**<br>*(Rendering & Web Vitals)* | **A6** (Next.js Technical Code)<br>**A18** (Semantic DOM & a11y)<br>**A19** (Core Web Vitals Specialist) | İlk HTML yanıtında tam SSR/ISR içeriği, React hydration yükünün azaltılması, INP < 200ms, LCP < 2.5s, CLS < 0.1, tekil `<h1>` ve semantik landmark'lar. | [tools/audit-site-speed.mjs](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/tools/audit-site-speed.mjs)<br>[tools/measure-web-vitals.mjs](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/tools/measure-web-vitals.mjs)<br>[tools/audit-accessibility.mjs](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/tools/audit-accessibility.mjs) | Web Vitals Laboratuvar/Saha Raporu<br>a11y DOM Düzeltmeleri<br>Lighthouse Skoru > 95 |
| **05. CONTENT INTELLIGENCE**<br>*(Keywords & Topical Moat)* | **P2** (Intent & Keyword Universe)<br>**P4** (Anti-Template Moat)<br>**A2** (Duplication Hunter)<br>**A8** (E-E-A-T & Authority Signaler) | %64 şablon benzerliğini sıfırlama, 6-word shingle tekrarlarını yok etme, her sayfaya özel kamera/ışık/sahne çekim formülleri ve yazar E-E-A-T kartları ekleme. | [content/seo-package/](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/content/seo-package)<br>[tools/originality_gate.py](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/tools/originality_gate.py)<br>[tools/polish_ai_slop.py](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/tools/polish_ai_slop.py) | %0 Şablon Tekrarlı Makaleler<br>BOFU Keyword Eşleme<br>E-E-A-T Yazar Profilleri |
| **06. SERP DOMINATOR**<br>*(On-Page, Media & GEO)* | **A4** (SERP Benchmark Analyzer)<br>**A7** (Schema.org Validator)<br>**A13** (Multimodal & Visual SEO)<br>**A14** (GEO & LLM Citation Specialist) | Product, Offer, SoftwareApplication, FAQPage şemaları; SVG ve WebP/AVIF görsel optimizasyonu; Perplexity/ChatGPT için `llms.txt` ve semantik yanıt blokları. | [components/JsonLd.tsx](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/components/JsonLd.tsx)<br>[lib/llms-pages.ts](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/lib/llms-pages.ts)<br>[public/llms.txt](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/public/llms.txt)<br>[tools/check_article_svgs.py](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/tools/check_article_svgs.py) | Zengin Sonuç (Rich Snippet) Onayı<br>Multimodal Medya Sitemapi<br>GEO AI Citation Protokolü |
| **07. AUTHORITY GUARDIAN**<br>*(Trust, PR & Policy)* | **P5** (Authority & Entity Planner)<br>**A11** (Off-Page Acquisition)<br>**A20** (Security & Trust Reputation) | Organik backlink mıknatısları (`/tools/*`), Google Knowledge Graph Entity tanıma, Creator Vault ve özel verilerin auth-wall arkasında tutulması, CSP/HSTS. | [tools/audit-security-csp.mjs](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/tools/audit-security-csp.mjs)<br>[docs/marketing/BRAND_REGISTRATION_KIT.md](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/docs/marketing/BRAND_REGISTRATION_KIT.md)<br>Supabase RLS & Middleware | Entity Doğrulama Planı<br>Vault Gizlilik Raporu<br>Katı Güvenlik Başlıkları |
| **08. SEO SENTINEL**<br>*(Monitoring, QA & Automation)* | **A12** (IndexNow & Regression Automation)<br>**Sentinel CI Harness** | Otomatik sitemap/canonical/robots regresyon testleri, Bing/Yandex anlık IndexNow bildirimleri, GSC API entegrasyonu, haftalık trend takibi. | [tools/ping-indexnow.mjs](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/tools/ping-indexnow.mjs)<br>[tools/automatic-quality-regression.ts](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/tools/automatic-quality-regression.ts)<br>[tools/test-public-route-smoke.ps1](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/tools/test-public-route-smoke.ps1) | CI/CD SEO Test Süiti<br>IndexNow Tetikleyici<br>Regresyon Alarm Panosu |
| **09. CODE & CONTENT MODERNIZATION ENGINE**<br>*(YENİ: 8 Kod & İçerik Geliştirme Ajanı)* | **A21** (Readability Refactorer)<br>**A22** (Script & Formula Synthesizer)<br>**A23** (Anti-AI Humanizer)<br>**A24** (React Markdown Transformer)<br>**A25** (SVG Diagram Asset Generator)<br>**A26** (Entity Knowledge Graph Embedder)<br>**A27** (Contextual Conversion Bridge)<br>**A28** (Autonomous Route Gatekeeper) | Sitedeki tüm kod ve 247 markdown dosyasını derinlemesine analiz ederek; Flesch okunabilirliğini 45+ seviyesine çıkarma, çekim formülleri ekleme, AI kalıntılarını yok etme, React interaktif bileşenlerine dönüştürme, tekil SVG üretimi ve entity JSON-LD enjeksiyonu. | [tools/audit_content_readability.py](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/tools/audit_content_readability.py)<br>[tools/polish_ai_slop.py](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/tools/polish_ai_slop.py)<br>[tools/generate_diagram_assets.py](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/tools/generate_diagram_assets.py)<br>[components/MarkdownRenderer.tsx](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/components/MarkdownRenderer.tsx)<br>[content/](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/content) | Yenilenmiş 247 Markdown Dosyası<br>100% Özgün SVG Varlıkları<br>Flesch > 45 Skoru<br>İnteraktif React UI Blokları |

---

## BÖLÜM 3: Yeni Eklenen 8 Kod ve İçerik Geliştirme Ajanının (A21 - A28) Derin Görev Tanımları

```mermaid
graph TD
    A21["A21: Readability & Fluency Refactorer<br/>(Flesch Skorunu 45+ Yapma)"] --> A22["A22: Creator Script & Shoot Formula Synthesizer<br/>(Sahne, Kamera, Diyalog Enjeksiyonu)"]
    A22 --> A23["A23: Anti-AI Humanization & Stylistic Variance<br/>(Jargon & Doğal Çekim Dili)"]
    A23 --> A24["A24: Interactive UI & React Markdown Transformer<br/>(Dinamik Bileşen Dönüşümü)"]
    A24 --> A25["A25: Multimodal Infographic & Custom SVG Generator<br/>(Sıfır Görsel Tekrarı)"]
    A25 --> A26["A26: Entity Knowledge Graph & Semantic Triplets<br/>(Wikidata & Konu Düğümleri)"]
    A26 --> A27["A27: Contextual Editorial Funnel & Monetization<br/>(Dossier / Store Dönüşüm Köprüsü)"]
    A27 --> A28["A28: Autonomous Route Integrity & Code Regression<br/>(Sıfır Hata & Prebuild Onayı)"]
```

### 1. Agent A21: Readability & Cognitive Fluency Refactoring Specialist
- **Görevi:** 247 markdown dosyasındaki Flesch okunabilirlik skorunu analiz eder. Skoru 40'ın altında kalan 18 makaleyi tespit edip cümle uzunluklarını kısaltır, pasif yapıları aktif eylemlere dönüştürür.
- **Kod/Betik:** `tools/audit_content_readability.py`, `content/resources/*.md`, `content/seo-package/*.md`.
- **Standart:** Minimum Flesch Skoru >= 45. Paragraf uzunluğu en fazla 2-3 cümle (mobil cihazlarda hızlı taranabilirlik).

### 2. Agent A22: Creator Script & Video Shoot Formula Synthesizer
- **Görevi:** Jenerik içerik tavsiyelerini imha eder. Her makalenin içine doldurulabilir gerçek video çekim formülleri ekler:
  - **İlk 3 Saniye Kancası:** Konuşulan ilk cümle ve eşlik eden görsel hareket.
  - **Sahne Sıralaması (Scene Order):** Sahne 1 (Hook), Sahne 2 (Proof Beat), Sahne 3 (Core Execution), Sahne 4 (Payoff & CTA).
  - **Kamera ve Işık Notları:** Kamera açısı (göz hizası, 45 derece üst açı), lens odak uzaklığı, ışık yönü.
  - **İddia Sınırları (Claim Boundaries):** Kamerada yasal olarak söylenmemesi gerekenler.
- **Kod/Betik:** `content/seo-package/`, `content/resources/`.

### 3. Agent A23: Zero-Slop Anti-AI Humanization & Stylistic Variance Guardian
- **Görevi:** Metinlerdeki tüm yapay zeka kalıntılarını temizler. "In today's fast-paced world", "delve into", "a testament to", "seamless transition", "game-changer" gibi jenerik kalıpları siler.
- **Kod/Betik:** `tools/polish_ai_slop.py`, `tools/scan_ai_residue.py`, `tools/originality_gate.py`.
- **Standart:** Gerçek yönetmen ve solo üretici seti arkası terminolojisi ("raw take", "A-roll audio cut", "focal length", "lens flare", "jump cut timing"). Cümle uzunluklarında ritmik çeşitlilik (burstiness).

### 4. Agent A24: Interactive UI & React Markdown Component Transformer
- **Görevi:** Düz markdown formatındaki statik metin bloklarını zengin, etkileşimli React bileşenlerine dönüştürür.
- **Kod/Betik:** `components/MarkdownRenderer.tsx`, `components/SeoPackageArticle.tsx`.
- **Dönüşüm Öğeleri:**
  - `> [!NOTE]` ve callout bloklarının özel stil kartlarına çevrilmesi.
  - Kopyalanabilir tek tıkla çekim listesi (Click-to-Copy Shot Lists).
  - Genişletilebilir akordeon formatında sahne dökümleri (Expandable Scene Breakdowns).
  - Yan yana çekim brief karşılaştırma tabloları.

### 5. Agent A25: Multimodal Infographic & Custom SVG Asset Generator
- **Görevi:** Sitedeki hiçbir sayfanın görselsiz kalmamasını ve hiçbir görselin iki farklı sayfada tekrar kullanılmamasını garanti eder.
- **Kod/Betik:** `tools/generate_diagram_assets.py`, `tools/check_article_svgs.py`, `public/assets/diagrams/`.
- **Standart:** Her sayfa için 100% özgün, koyu tema uyumlu (dark mode), marka renk paletini taşıyan sahne akış şeması, çekim planı diyagramı veya izleyici tutma grafiği SVG kodu üretimi.

### 6. Agent A26: Entity Knowledge Graph & Semantic Triplets Embedder
- **Görevi:** Google Knowledge Graph ve AI Arama Motorları (Perplexity, SGE) için her makaledeki semantik üçlüleri (Özne-Yüklem-Nesne) çıkarır ve yapılandırılmış JSON-LD verisine bağlar.
- **Kod/Betik:** `components/JsonLd.tsx`, `lib/seo-metadata.ts`.
- **Enjeksiyon:** `about`, `mentions`, `creator`, `hasPart`, `genre` şemaları. Konu varlıklarının Wikidata ID'leri ile açık bağlanması (`Instagram Reels` -> Q104710188 vb.).

### 7. Agent A27: Contextual Editorial Funnel & Monetization Bridge Injector
- **Görevi:** Bilgilendirici (TOFU/MOFU) rehberleri okuyan ziyaretçiyi, sayfadan çıkmadan önce doğrudan satın alma (BOFU) sayfalarına (`/dossiers/classic-red`, `/dossiers/signature-purple`, `/store`) bağlayan editoryal geçiş köprüleri kurar.
- **Kod/Betik:** `lib/template-policy.ts`, `components/SeoPackageArticle.tsx`.
- **Standart:** Rahatsız edici banner'lar yerine, metnin akışına gömülü doğal kurgu: *"Planlamak yerine doğrudan bu lane için yazılmış çekim brief'ini sete götürmek isterseniz Classic Red veya Signature Purple dosyalarını inceleyin."*

### 8. Agent A28: Autonomous Route Integrity & Code Regression Gatekeeper
- **Görevi:** Kod veya içerik üzerinde yapılan her değişiklikten sonra tüm rotaları, derleme durumunu ve sitemap tutarlılığını test eder.
- **Kod/Betik:** `tools/test-public-route-smoke.ps1`, `tools/check-seo-package-integrity.mjs`, `package.json` (`prebuild`).
- **Doğrulama:** 0 kırık link, 0 zincirleme yönlendirme, 0 TypeScript hatası, 0 shingle benzerliği, <50KB ilk HTML boyutu.

---

## BÖLÜM 4: Uygulama ve Güvenlik Protokolü (Guardrails)

Anomalybox.com için masaüstü sisteminden entegre edilen kurallar:

1. **Ortak Envanter ve Tekil Veri Tabanı:** Tüm ajanlar tek bir `seo-master-audit.json` envanteri üzerinden çalışır; hiçbir ajan izole varsayımla dosya silmez veya URL değiştirmez.
2. **Yüksek Riskli İşlemlerde Güvenlik Duvarı:** `robots.txt`, canonical, toplu `noindex` ve `308 redirect` kuralları doğrudan uygulanmadan önce `tools/test-public-route-smoke.ps1` ve staging kontrolünden geçer.
3. **Creator Vault & Özel Veri İzolasyonu:** Yalnızca `robots.txt` ile gizlilik sağlanamaz. `/profile`, `/boxes`, `/cards`, `/admin` ve özel brief içerikleri Next.js Middleware + Supabase RLS ile 401/307 korumasına alınır. Arama botlarının erişimi engellenirken GSC'de "Indexed, though blocked" uyarısı üretilmez.
4. **Ticari Değer Koruması (`lib/template-policy.ts`):** Satılabilir ürün şablonları (reusable templates) kamuya açık indekslenmez; yalnızca editöryal karşılaştırma ve inceleme metinleri indekslenir.
5. **Geri Alma (Rollback) Güvencesi:** Her kod değişikliği Git dalı (branch) üzerinde commit'lenir; olumsuz GSC sinyallerinde tek komutla önceki duruma dönülebilir.

---

## BÖLÜM 5: Adım Adım İcra Yol Haritası (Execution Roadmap)

Bu rapor onaylandığında sırasıyla uygulanacak 5 aşama:

```mermaid
sequenceDiagram
    participant C1 as 01 SEO COMMANDER
    participant D2_3 as 02 Index Doctor & 03 Canonical
    participant D9 as 09 Code & Content Modernization
    participant D5_6 as 05 Content & 06 SERP
    participant D4_7 as 04 Technical & 07 Authority
    participant S8 as 08 SEO SENTINEL
    participant GSC as Google Search Console
    
    Note over C1,S8: FAZ 0: Master Envanter & Baseline Kilidi
    C1->>S8: Tam URL envanteri ve mevcut durum taraması (seo-master-audit.json)
    
    Note over D2_3,GSC: FAZ 1: İndeks Engeli & Tarama Bütçesi Çözümü
    D2_3->>D2_3: 84 URL'yi 40 Ana Rehbere 308 ile Konsolide Etme (Phase 1 & 2 Tamamlandı)
    D2_3->>D2_3: Robots.txt RSC & Scraper Blokajını Doğrulama
    D2_3->>S8: IndexNow ile Bing/Yandex/Google'a Güncel Sitemap Bildirimi
    D2_3->>GSC: GSC "Validate Fix" Doğrulama Talebi Başlatma
    
    Note over D9,D5_6: FAZ 2: Kod & İçerik Derin Yenileme (A21-A28)
    D9->>D9: A21 ile Flesch Okunabilirlik Skorlarını 45+ Seviyesine Yükseltme
    D9->>D9: A22 ile Her Makaleye 0-3s Kancası, Sahne Sırası ve Çekim Notu Ekleme
    D9->>D9: A23 ile Tüm AI Kalıntılarını ve Jenerik Cümleleri Temizleme
    D9->>D9: A24 ile Statik Metinleri Zengin React UI Bileşenlerine Dönüştürme
    D9->>D9: A25 ile Her Sayfaya %100 Özgün SVG Diyagramı Üretme
    D9->>D5_6: A26 & A27 ile Entity JSON-LD ve Money Page Köprülerini Kurma
    
    Note over D4_7,S8: FAZ 3: Core Web Vitals, a11y, Güvenlik & Dönüşüm
    D4_7->>D4_7: INP < 200ms, LCP < 2.5s ve a11y DOM Landmark Düzeltmeleri
    D4_7->>D4_7: Tools CTA'larını Money Pages'e (Dossiers/Store) Bağlama
    
    Note over S8,C1: FAZ 4: Otomatik CI/CD & Sürekli İzleme
    S8->>C1: A28 ile Otomatik Regresyon, Sıralama ve Index Kapsamı Raporu
```

### Uygulanacak Öncelikli Eylemler:
1. **Adım 1 (Faz 1):** Konsolide edilen 84 zombi URL'in [lib/seo-consolidation.json](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/lib/seo-consolidation.json) ve [next.config.ts](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/next.config.ts) içinde 308 kalıcı yönlendirmeleri doğrulanmış ve canlıya push edilmiştir.
2. **Adım 2 (Faz 1):** [app/robots.ts](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/app/robots.ts) ve [app/sitemap.ts](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/app/sitemap.ts) güncellenmiş, `tools/ping-indexnow.mjs` ile Bing ve Yandex motorlarına bildirim yapılmıştır.
3. **Adım 3 (Faz 2 - A21/A22/A23):** Düşük okunabilirliğe sahip makaleler A21 ve A23 ile taranarak Flesch skoru yükseltilecek, A22 ile özel çekim formülleri eklenecektir.
4. **Adım 4 (Faz 2 - A24/A25/A26):** A24 ile interaktif React bileşenleri, A25 ile 100% özgün SVG şemaları ve A26 ile Wikidata destekli JSON-LD varlıkları entegre edilecektir.
5. **Adım 5 (Faz 3 - A27):** Ücretsiz araç ve rehber sayfalarından `/dossiers/*` ve `/store` sayfalarına editoryal dönüşüm köprüleri bağlanacaktır.
6. **Adım 6 (Faz 4 - A28):** A28 ve CI/CD regresyon süiti çalıştırılarak tüm değişiklikler sıfır hata ve sıfır kırık link ile üretime dağıtılacaktır.


