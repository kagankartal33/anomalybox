→# Anomaly Box — 2026 Master SEO, Backlink & Otorite İcra Planı

Bu doküman, **Anomaly Box** (`https://anomalybox.com`) alan adının Google indekslemesini en yüksek hıza ulaştırmak, arama motorlarında Entity (Marka Varlığı) otoritesini inşa etmek ve alan adı otoritesini (Domain Authority 90+) yükseltmek amacıyla tasarlanmış **uçtan uca stratejik icra planıdır**.

---

## 📑 İçindekiler
. [Kademe 0: Temel Altyapı & Hostinger DNS Doğrulaması](#1-kademe-0-temel-altyapı--hostinger-dns-doğrulaması)
. [24 Yüksek Otoriteli Platform Matrisi](#2-24-yüksek-otoriteli-platform-matrisi)
→3. ["Yetim Profil" Çözümü: Örümcek Ağı (Spiderweb) Protokolü](#3-yetim-profil-çözümü-örümcek-ağı-spiderweb-protokolü)
. [Çapa Metin (Anchor Text) & URL Dağılım Matrisi](#4-çapa-metin-anchor-text--url-dağılım-matrisi)
. [24–48 Saatte İndeksleme Tetikleme (Pinging) Protokolü](#5-2448-saatte-indeksleme-tetikleme-pinging-protokolü)
. [Projedeki Hazır Dosyalar ve Otomasyon Komutları](#6-projedeki-hazır-dosyalar-ve-otomasyon-komutları)
. [Adım Adım İcra Takvimi ve Kontrol Listesi](#7-adım-adım-icra-takvimi-ve-kontrol-listesi)

---

## 1. Kademe 0: Temel Altyapı & Hostinger DNS Doğrulaması

→Dışarıdan gelecek backlinklerin ve Googlebot taramalarının sitenize eksiksiz yansıması için **ilk 5 dakikada** bu temel zemin kurulmalıdır:

### A. Google Search Console (Hostinger DNS TXT Kaydı)
. [Google Search Console](https://search.google.com/search-console)'a gidin.
. Mülk türü olarak **"Alan Adı" (Domain)** seçin ve `anomalybox.com` yazın.
. Google'ın ürettiği `google-site-verification=...` ile başlayan TXT doğrulama kodunu kopyalayın.
. **Hostinger hPanel** (`https://hpanel.hostinger.com/websites`) &rarr; **Alan Adınız (anomalybox.com)** &rarr; **DNS / Ad Sunucuları** sekmesine gidin:
   * **Tür (Type):** `TXT`
   * **Ad (Name):** `@` (veya boş bırakın)
   * **TXT Değeri:** Kopyaladığınız `google-site-verification=...` metnini yapıştırın.
→   * **TTL:** `3600` (varsayılan)
   * **"Kayıt Ekle" (Add Record)** butonuna basın.
. Search Console ekranına dönüp **"Doğrula"** butonuna basın.

### B. Site Haritası ve RSS Beslemesi Gönderimi
Google Search Console doğrulandıktan hemen sonra sol menüdeki **Site Haritaları (Sitemaps)** sekmesine gidin ve şu 2 adresi ekleyin:
* `https://anomalybox.com/sitemap.xml` &rarr; (Tüm 315 sayfanın Google'a haritası)
* `https://anomalybox.com/feed.xml` &rarr; (En son 233 editoryal makalenin canlı beslemesi)

### C. Kod Katmanı: Schema.org `sameAs` Entity Mührü (Hazır)
→`lib/seo-metadata.ts` içindeki `organizationJsonLd` fonksiyonu güncellendi. Siteniz Googlebot tarafından her tarandığında şu resmi marka profillerini Google Entity Grafiğine (Knowledge Graph) bildirir:
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://anomalybox.com/#organization",
  "name": "Anomaly Box",
  "url": "https://anomalybox.com",
  "sameAs": [
    "https://www.youtube.com/@anomalybox",
→    "https://x.com/anomalybox",
    "https://github.com/anomalybox",
    "https://www.linkedin.com/company/anomalybox",
    "https://www.pinterest.com/anomalybox",
    "https://medium.com/@anomalybox"
  ]
}
```

---
→
## 2. 24 Yüksek Otoriteli Platform Matrisi

Google ekosisteminde en yüksek alan adı otoritesine (DA) sahip 24 platform, risk/fayda dengesi gözetilerek 4 kademeye ayrılmıştır:

### Kademe 1: Çekirdek Otorite & Google Ekosistemi (En Yüksek Öncelik)

| # | Platform | DA | Kayıt Linki | Hedef Web Sitesi | Çapa Metni / Link Tipi | İlk Aksiyon / Backlink | Durum |
|---|---|:---:|---|---|---|---|:---:|
| 1 | **YouTube** | **100** | [youtube.com](https://www.youtube.com) | `https://anomalybox.com` | `Anomaly Box Official` (Kanal Linki) | `@anomalybox` kanalı açın, 'Hakkında' kısmına web sitesini ekleyin, 20 sn sessiz stüdyo/dossier tanıtımı yükleyin. | [ ] |
→| 2 | **LinkedIn** | **98** | [linkedin.com](https://www.linkedin.com/company/setup/new/) | `https://anomalybox.com` | `Anomaly Box` (Şirket Profili) | Şirket sayfası açın, özel butonu `https://anomalybox.com/store` ('Visit website') yapın. | [ ] |
| 3 | **GitHub** | **96** | [github.com/signup](https://github.com/signup) | `https://anomalybox.com/tools` | `Anomaly Box Creator Tools` | `anomalybox/anomalybox` reposu açıp `distribution/github-profile/README.md` dosyasını ana README yapın. | [ ] |
| 4 | **Medium** | **95** | [medium.com](https://medium.com/m/signin) | `https://anomalybox.com` | Canonical Link & Yazar Bio | `distribution/medium/01-hook-retention-framework.md` makalesini canonical URL ile yayınlayın. | [ ] |
| 5 | **Gravatar** | **94** | [gravatar.com](https://gravatar.com) | `https://anomalybox.com` | `https://anomalybox.com` (Dofollow) | E-postanıza bağlı Gravatar profiline web sitesi ve `/pricing` sayfalarını ekleyin. | [ ] |
| 6 | **X (Twitter)** | **94** | [x.com](https://x.com) | `https://anomalybox.com` | `@anomalybox` (Realtime Bio Link) | Bio'ya site linki ekleyin; SlideShare PDF'ini ve kanca çerçevesini tweetleyin (Google gerçek zamanlı indeksler). | [ ] |
| 7 | **About.me** | **93** | [about.me/signup](https://about.me/signup) | `https://anomalybox.com` | `Explore Creative Dossiers` | about.me/anomalybox sayfasını açın; ana Spotlight butonunu `https://anomalybox.com/store` yapın. | [ ] |
| 8 | **Substack** | **92** | [substack.com](https://substack.com) | `https://anomalybox.com/resources` | `Anomaly Box Directing Notes` | Ücretsiz yayın açıp bio'ya ve ilk 'Hoş Geldiniz' yazısına `/resources` linki verin. | [ ] |
| 9 | **Product Hunt** | **91** | [producthunt.com](https://www.producthunt.com) | `https://anomalybox.com` | `Anomaly Box Maker Profile` | Maker profili açın, 'Upcoming Product' veya canlı ürün olarak Anomaly Box'ı listeleyin. | [ ] |
| 10 | **Wellfound** | **91** | [wellfound.com](https://wellfound.com) | `https://anomalybox.com` | `https://anomalybox.com` (Company URL) | AngelList girişim sayfası açarak resmi web sitesini ve sektör etiketlerini girin. | [ ] |
| 11 | **Crunchbase** | **91** | [crunchbase.com](https://www.crunchbase.com) | `https://anomalybox.com` | `Anomaly Box Organization` | Şirket profili oluşturun (Google Bilgi Paneli / Knowledge Panel için 1 numaralı kaynaktır). | [ ] |
→
---

### Kademe 2: Görsel, Tasarım & Portfolyo Ağı (Google Görseller Trafiği)

| # | Platform | DA | Kayıt Linki | Hedef Web Sitesi | Çapa Metni / Link Tipi | İlk Aksiyon / Backlink | Durum |
|---|---|:---:|---|---|---|---|:---:|
| 12 | **Pinterest** | **94** | [pinterest.com](https://www.pinterest.com) | `https://anomalybox.com/pricing` | Claimed Website + Pin Links | 'Instagram Shoot Briefs' panosu açın, dossier ve infografik görsellerini pinleyin. | [ ] |
| 13 | **Behance** | **93** | [behance.net](https://www.behance.net) | `https://anomalybox.com` | Dofollow Project Link | 'Anomaly Box — Creative Direction Dossier UI' başlıklı tasarım projesi yayınlayın. | [ ] |
| 14 | **Flickr** | **93** | [flickr.com](https://identity.flickr.com/sign-up) | `https://anomalybox.com` | Fotoğraf Açıklama Linki | Dossier ve stüdyo mockuplarını yükleyip açıklamaya site linki koyun. | [ ] |
→| 15 | **Dribbble** | **92** | [dribbble.com](https://dribbble.com/signup/new) | `https://anomalybox.com` | Dofollow Shot & Profile | 'Creator Vault & Shoot Mode UI' başlıklı bir shot paylaşın. | [ ] |
| 16 | **Tumblr** | **90** | [tumblr.com](https://www.tumblr.com/register) | `https://anomalybox.com/resources` | Dofollow Quote/Link | Kısa kanca taktikleri ve `/resources` makalelerine yönlendiren linkler paylaşın. | [ ] |

---

### Kademe 3: Doküman & PDF Paylaşımı (PDF İndeksleme & Otorite)

| # | Platform | DA | Kayıt Linki | Hedef Web Sitesi | Çapa Metni / Link Tipi | İlk Aksiyon / Backlink | Durum |
|---|---|:---:|---|---|---|---|:---:|
| 17 | **SlideShare** | **95** | [slideshare.net](https://www.slideshare.net/signup) | `https://anomalybox.com` | PDF İçi Tıklanabilir Linkler | Projede derlenen `Anomaly-Box-Creative-Direction-Deck.pdf` dosyasını sunum olarak yükleyin. | [ ] |
→| 18 | **Issuu** | **94** | [issuu.com](https://issuu.com/signup) | `https://anomalybox.com/pricing` | Dijital Katalog / Dergi | Aynı PDF sunumunu dijital broşür olarak yayınlayın. | [ ] |

---

### Kademe 4: RSS, Kürasyon & Topluluk

| # | Platform | DA | Kayıt Linki | Hedef Web Sitesi | Çapa Metni / Link Tipi | İlk Aksiyon / Backlink | Durum |
|---|---|:---:|---|---|---|---|:---:|
| 19 | **Flipboard** | **91** | [flipboard.com](https://flipboard.com) | `https://anomalybox.com/feed.xml` | Otomatik RSS İçe Aktarımı | 'Creator Direction Daily' dergisi açıp RSS beslemesini bağlayın (233 makale anında backlinke dönüşür). | [ ] |
| 20 | **Quora** | **93** | [quora.com](https://www.quora.com) | `https://anomalybox.com` | Yazar Bio & Soru Yanıtları | Profil bio'suna siteyi ekleyin; kanca ve senaryo sorularına yanıt verip `/resources` linkleyin. | [x] |
→| 21 | **Scoop.it** | **92** | [scoop.it](https://www.scoop.it/signup) | `https://anomalybox.com/resources` | Curated Topic Link | 'Video Directing Systems' konusu açıp sitedeki rehberleri scoop edin. | [ ] |
| 22 | **Reddit** | **91** | [reddit.com](https://www.reddit.com/register/) | `https://anomalybox.com` | Profil Social Links | `u/anomalybox` bio'suna site ekleyin; r/Instagrammarketing topluluğunda değer sunan yanıtlar verin. | [ ] |
| 23 | **Diigo** | **90** | [diigo.com](https://www.diigo.com/sign-up) | `https://anomalybox.com` | Public Sosyal Yer İmi | Ana sayfayı ve `/tools` rotasını public etiketlerle kaydedin. | [ ] |
| 24 | **Pearltrees** | **87** | [pearltrees.com](https://www.pearltrees.com) | `https://anomalybox.com/tools` | Koleksiyon Ağacı | Anomaly Box araçlarını ve kaynaklarını ağaç koleksiyonu olarak derleyin. | [ ] |

---

## 3. "Yetim Profil" Çözümü: Örümcek Ağı (Spiderweb) Protokolü

Yeni açılan profillerin Google tarafından indekslenmeme riskini sıfırlayan **birbirine bağlama (interlinking) mimarisi**:
→
```mermaid
graph TD
    Site[https://anomalybox.com] -->|sameAs Schema| GH[GitHub DA 96]
    Site -->|sameAs Schema| LI[LinkedIn DA 98]
    Site -->|sameAs Schema| YT[YouTube DA 100]
    Site -->|sameAs Schema| MD[Medium DA 95]

    GH -->|Repo Link| SS[SlideShare PDF DA 95]
    GH -->|Repo Link| PI[Pinterest DA 94]
→    GH -->|Repo Link| Tools[Site: /tools]

    MD -->|Canonical Link| Res[Site: /resources]
    MD -->|Author Link| AB[About.me DA 93]
    MD -->|Author Link| Sub[Substack DA 92]

    YT -->|Channel Links| Site
    YT -->|Channel Links| X[X / Twitter DA 94]
    YT -->|Channel Links| PH[Product Hunt DA 91]

→    LI -->|Company Custom Button| Store[Site: /store]
    LI -->|Post Link| Behance[Behance UI DA 93]

    FB[Flipboard DA 91] -->|RSS Auto Ingest 233 Items| Feed[Site: /feed.xml]
```

### Örümcek Ağı Kuralları:
. **GitHub Profil README:** Sadece web sitesine değil, Medium makalenize, YouTube kanalınıza ve SlideShare sunumunuza da link verir.
. **Medium Yazısı:** Alt kısımdaki yazar kutusunda About.me ve Substack bülteninize referans verir.
. **YouTube Kanalı:** Özel linkler alanına `anomalybox.com`, X/Twitter ve LinkedIn şirket profilinizi ekler.
→4. **Gravatar Profili:** Tüm profillerinizin URL'lerini *"Web Sitelerim"* sekmesinde listeler.

> **Sonuç:** Googlebot bu platformlardan herhangi birine girdiğinde, örümcek ağındaki linkleri takip ederek diğer 23 profilinizi ve sitenizin derin sayfalarını **tek bir tarama döngüsünde** keşfeder.

---

## 4. Çapa Metin (Anchor Text) & URL Dağılım Matrisi

Google Penguin ve Spam algoritmaları tarafından cezalandırılmamak için link dağılımı aşağıdaki oranlarda kilitlenmiştir:

→| Dağılım Oranı | Çapa Metin Tipi | Kullanılacak Tam Metin Örnekleri | Yönlendirilecek Hedef URL |
| :---: | :--- | :--- | :--- |
| **%50** | **Marka Çapası (Brand)** | `Anomaly Box`, `Anomaly Box Studio`, `anomalybox.com` | `https://anomalybox.com` |
| **%25** | **Çıplak URL (Naked URL)** | `https://anomalybox.com`, `https://anomalybox.com/store` | `https://anomalybox.com/store` |
| **%15** | **Derin Araç / İçerik Çapası** | `Creator Brief Scorecard`, `First 3 Seconds Hook Framework`, `Creator Tools` | `https://anomalybox.com/tools`<br>`https://anomalybox.com/resources/...` |
| **%10** | **Doğal Eylem Çapası** | `visit official website`, `explore creator vault`, `read the framework audit` | `https://anomalybox.com/pricing` |

---

## 5. 24–48 Saatte İndeksleme Tetikleme (Pinging) Protokolü
→
Hesapları açtıktan sonra haftalarca bot beklememek için uygulanacak **3 adımlı aktif tetikleme**:

. **SlideShare / Issuu PDF Ateşlemesi (1. Dakika):**
   * Hazır dosyamız olan `Anomaly-Box-Creative-Direction-Deck.pdf` yüklendiği anda SlideShare'in dahili botları dokümanı tarar ve Googlebot'a anında iletir.
. **Flipboard RSS Tetikleyicisi (2. Dakika):**
   * Flipboard'a `https://anomalybox.com/feed.xml` bağlandığı anda, Flipboard'un tarayıcı sunucuları sitedeki **233 adet** özgün makaleyi tek tek çağırır (fetch eder). Bu işlem arama motorlarına devasa bir yayın sinyali gönderir.
. **Google Search Console Manuel Dizin Talebi (3. Dakika):**
   * GSC onaylandıktan sonra Search Console üst arama çubuğuna şu 3 adresi yapıştırıp **"Dizin Oluşturulmasını İste" (Request Indexing)** deyin:
. `https://anomalybox.com`
→     2. `https://anomalybox.com/tools`
. `https://anomalybox.com/pricing`

---

## 6. Projedeki Hazır Dosyalar ve Otomasyon Komutları

İcra sırasında hiçbir metni, makaleyi veya sunumu sıfırdan hazırlamanız gerekmez. Projenizde hepsi mevcuttur:

* **SlideShare / Issuu Hazır PDF Dosyası (82.1 KB):**
→  [distribution/slideshare/Anomaly-Box-Creative-Direction-Deck.pdf](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/distribution/slideshare/Anomaly-Box-Creative-Direction-Deck.pdf)
  *(Yeniden derlemek isterseniz: `npm run distribution:pdf`)*
* **GitHub Profil README Dosyası:**
  [distribution/github-profile/README.md](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/distribution/github-profile/README.md)
* **Medium Canonical Makale Metni:**
  [distribution/medium/01-hook-retention-framework.md](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/distribution/medium/01-hook-retention-framework.md)
* **24 Platformun Kopyala-Yapıştır Bio & Snippet Kiti:**
  [distribution/COPY_PASTE_DISTRIBUTION_KIT.md](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/distribution/COPY_PASTE_DISTRIBUTION_KIT.md)
  *(Yeniden derlemek isterseniz: `npm run distribution:kit`)*

→---

## 7. Adım Adım İcra Takvimi ve Kontrol Listesi

### 🟢 Faz 1: Temel Kurulum (10 Dakika — Bugün)
- [x] **Hostinger DNS:** Google Search Console TXT kaydını ekleyin.
- [ ] **Search Console:** Mülkü doğrulayın, `sitemap.xml` ve `feed.xml` gönderin.
- [ ] **Flipboard:** Magazin açıp `https://anomalybox.com/feed.xml` bağlayın (233 makale indekslensin).
- [ ] **SlideShare:** Hazır `Anomaly-Box-Creative-Direction-Deck.pdf` dosyasını yükleyin.

→### 🟡 Faz 2: Çekirdek Otorite Profilleri (20 Dakika — Bugün / Yarın)
- [ ] **YouTube:** Kanal açın (`@anomalybox`), bio'ya `anomalybox.com` ekleyin.
- [ ] **LinkedIn:** Şirket sayfası açın, web sitesini ve butonunu `/store` olarak bağlayın.
- [x] **GitHub:** Mevcut public `kagankartal33/anomalybox` reposunun README dosyası hazır dağıtım metniyle güncellendi; profil bio ve `https://anomalybox.com/tools` bağlantısı doğrulandı.
- [x] **Medium:** Makale kaynak URL'den canonical olarak içe aktarıldı ve `@anomalybox` hesabında yayınlandı.
- [ ] **X (Twitter):** `@anomalybox` hesabını açıp bio linkini ekleyin, SlideShare linkini tweetleyin.
- [ ] **About.me:** Profil açıp Spotlight butonunu `/store` yapın.
- [x] **Gravatar:** `Anomaly Box` profili oluşturuldu; `anomalybox.com` ve `/pricing` bağlantıları eklendi.

### 🔵 Faz 3: Tasarım & Ağ Genişletme (Kalan Platformlar)
→- [ ] **Pinterest:** İşletme panosu açıp dossier pinlerini ekleyin.
- [ ] **Behance:** Proje oluşturup `/pricing` arayüzünü sergileyin.
- [ ] **Product Hunt & Wellfound:** Girişim profillerini tamamlayın.
- [ ] **Substack & Quora:** Bülten ve yazar bio'larını aktifleştirin.
- [ ] **Reddit, Tumblr, Diigo, Scoop.it, Pearltrees:** Yer imlerini kaydedin.

---

> Bu plan eksiksiz uygulandığında, `anomalybox.com` alan adı Google nezdinde **0 otoriteden 24 yüksek otoriteli düğüme (node) bağlı köklü bir dijital varlığa** dönüşecek ve tüm sayfalarınız organik arama dizinine hızla girecektir.