# 🧠 Algoritmik Neden & Psikolojik Kanca: Kapsamlı Dünya Ansiklopedisi
> **Sürüm:** 3.0  
> **Kapsam:** 12 purchase lane, 8 çekim formatı, 6 varlık overlay, 62 kanca, 9 birincil platform sinyali.  
> **Bağlı Modül:** `lib/algorithmic-reason/`

---

## İÇİNDEKİLER

1. **BÖLÜM 1: Algoritma Mühendisliği & Dağıtım Matematiği**
   - 1.1 Platform Öneri Motorları Mimarisi (Meta Reels, TikTok Monolith, YouTube Shorts)
   - 1.2 Çok Aşamalı Dağıtım Basamakları (Seed → Cluster → Explore → Evergreen)
   - 1.3 9 Birincil + 7 İkincil Sinyal Ağırlık Matrisi
   - 1.4 8 Negatif Sinyal ve Algoritmik Cezalar
2. **BÖLÜM 2: Dikkat Nörobiyolojisi & Karar Psikolojisi**
   - 2.1 Beyin Anatomisi ve Algı Yolakları (VTA/Dopamin, ACC, Amigdala, Ayna Nöronlar, DMN/TPN)
   - 2.2 21 Bilişsel Önyargının Kısa Format Video Eşleşmesi
   - 2.3 İkili Süreç Teorisi (Kahneman Sistem 1 vs Sistem 2) ve ELM Modeli
   - 2.4 Cialdini'nin 7 İkna İlkesi ve Video İçi Uygulaması
3. **BÖLÜM 3: Bütün Kanca Türleri Taksonomisi (12 Kategori / 62 Alt Tür)**
   - Kategori 1: Bilişsel Çelişki & Ters Köşe Kancaları (#1 – #6)
   - Kategori 2: Merak Boşluğu & Açık Döngü Kancaları (#7 – #12)
   - Kategori 3: Fiziksel & Görsel Kancalar (#13 – #19)
   - Kategori 4: Statü & Kimlik Kancaları (#20 – #24)
   - Kategori 5: İşitsel & Ses Tonu Kancaları (#25 – #29)
   - Kategori 6: Değer & Kaydetme Kancaları (#30 – #35)
   - Kategori 7: Kayıp Korkusu & Maliyet Kancaları (#36 – #40)
   - Kategori 8: Hikaye & Otantik İtiraf Kancaları (#41 – #46)
   - Kategori 9: Yorum & Tartışma Motoru Kancaları (#47 – #51)
   - Kategori 10: Kanıt & Otorite Kancaları (#52 – #56)
   - Kategori 11: Empati & İlişki Kancaları (#57 – #60)
   - Kategori 12: Zamanlama & Yapısal Kancalar (#61 – #62)
4. **BÖLÜM 4: Saniye Saniye Retention Eğrisi Mühendisliği**
   - 4.1 5 Aşamalı Zaman Tüneli (0–1.5s, 1.5–5s, 5–15s, 15–25s, Son 3s)
   - 4.2 Retention Eğrisi Teşhis Tablosu ve Kurtarma Reçeteleri
   - 4.3 Platform Bazlı Kritik Eşik Değerleri (2026)
5. **BÖLÜM 5: Çekim Kartı Entegrasyon Standardı & Kalite Kapısı**
   - 5.1 Kamera-Diyalog-Beden Dili Senkronizasyon Formülü
   - 5.2 Quality Gate (Kırmızı Çizgi) Kuralları
6. **BÖLÜM 6: 12 Purchase Lane Matrisi**
7. **BÖLÜM 7: 8 Çekim Formatı**
8. **BÖLÜM 8: 6 Varlık Overlay**
9. **BÖLÜM 9: 2026 Eşikler, Text-Safe, Audio, 10 Anti-Desen**
10. **BÖLÜM 10: 3-Kancalı A/B Protokolü**

Kodda 9 birincil sinyal vardır. Ansiklopedideki diğer metrikler ikincil platform notudur.

---

# BÖLÜM 1: Algoritma Mühendisliği & Dağıtım Matematiği

Sosyal medya öneri motorları videoları "beğenilere" göre değil, kullanıcı dikkatini ve güvenini maksimize eden **yüksek niyetli davranış sinyallerine** göre dağıtır.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       GÖSTERİM (IMPRESSION)                                 │
│                                │                                            │
│   0.0 – 1.5 sn                 ▼                                            │
│  [Swipe Gate]        ➔ %70+ Kalma Eşiği (Desen Kırılımı & Görsel Şok)      │
│                                │                                            │
│   1.5 – 5.0 sn                 ▼                                            │
│  [Dissonance Gate]   ➔ ACC Ateşlemesi (Bilişsel Çelişki / Merak Boşluğu)   │
│                                │                                            │
│   5.0 – 25.0 sn                ▼                                            │
│  [Retention Gate]    ➔ Rasyonel Çözüm Köprüsü (Fiziksel Kanıt / Şablon)    │
│                                │                                            │
│   Kapanış Sahnesi              ▼                                            │
│  [Action Gate]       ➔ Kaydetme (Save) + Birebir DM Paylaşımı (Share)       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.1 Platform Öneri Motorları Mimarisi

- **Meta Discovery Engine (Instagram Reels):** Çok katmanlı derin sinir ağı (DNN) mimarisi kullanır. İki ana boru hattından oluşur:
  1. *Candidate Generation (Aday Üretimi):* Kullanıcının geçmiş izleme, kaydetme ve DM geçmişinden 1000'lerce potansiyel video elenir.
  2. *Ranking Model (Sıralama Modeli):* DM Paylaşımı (Share via Send) ve Kaydetme (Save) olasılıklarına en yüksek ağırlığı veren çoklu görev öğrenme (Multi-task learning) ağıdır.
- **ByteDance Monolith (TikTok FYP):** Gerçek zamanlı seyrek parametre güncellemeleri (Real-time Sparse Parameter Updates) ile çalışır. Videonun ilk 50 gösterimindeki izlenme tamamlama oranı (%70+ threshold) ve tekrar izleme (Loop) katsayısı anında global dağıtım havuzunu tetikler.
- **YouTube Shorts (CausalImpact & Satisfaction Survey):** Sadece izlenme süresini değil, "Düşük Pişmanlık" (Low-Regret Attention) prensibini ve kullanıcı memnuniyet anketlerini (1-5 yıldız geri bildirimleri) ranking formülüne katar.

---

### 1.2 Tam Algoritmik Skor Matrisi (9 birincil kod sinyali + ikincil notlar)

| # | Sinyal | Tür | Ağırlık | Algoritma İçin Anlamı | Tetikleyen Psikolojik Unsur |
|---|---|---|---|---|---|
| 1 | **Watch Time (Toplam İzlenme)** | Birincil | ⬛⬛⬛⬛⬛ | Videonun kullanıcıyı platformda tutma süresi. | Merak Boşluğu, Açık Döngü |
| 2 | **Completion Rate (Tamamlama)** | Birincil | ⬛⬛⬛⬛⬛ | Videoyu sonuna kadar izleme oranı. <%30s videolarda %65+, 30-60s videolarda %50+ eşik. | Vaat-Payoff Uyumu, Düşük Pişmanlık |
| 3 | **DM Share (Birebir Paylaşım)** | Birincil | ⬛⬛⬛⬛⬛ | En yüksek ağırlıklı organik sinyal; kullanıcı arkadaşına özel tavsiye ediyor. | Sosyal Para, Ortak Acı, Şok |
| 4 | **Save Rate (Kaydetme Oranı)** | Birincil | ⬛⬛⬛⬛◻ | İçeriğin kalıcı başvuru değeri taşıdığı sinyali. | Eleme Listesi, Şablon, Karar Matrisi |
| 5 | **Loop / Replay Rate (Tekrar)** | Birincil | ⬛⬛⬛⬛◻ | İçerikte kaçırılan detay var veya akış dairesel. | Kusursuz Döngü, Makro Doku, Hız |
| 6 | **Engagement Velocity (Hız)** | İkincil | ⬛⬛⬛⬛◻ | İlk 30-60 dakikadaki etkileşim patlaması. | Bilişsel Şok, Aciliyet |
| 7 | **Comment Depth (Yorum Derinliği)** | İkincil | ⬛⬛⬛◻◻ | Uzun cümleli fikir beyanı ve yorum zincirleri. | Kutuplaştırıcı Seçim, Tartışmalı Sıralama |
| 8 | **Comment Reply Rate (Yanıtlama)** | İkincil | ⬛⬛⬛◻◻ | İki yönlü topluluk diyaloğu. | Parasosyal Yakınlık, Karşılıklılık |
| 9 | **Profile Visit (Profil Ziyareti)** | İkincil | ⬛⬛⬛◻◻ | Videodan hesaba geçiş (Huninin bir sonraki adımı). | Otorite, Merak |
| 10 | **Follow from Content (Takip)** | İkincil | ⬛⬛⬛◻◻ | "Bu hesabın tüm içeriklerini istiyorum" dönüşümü. | Otorite Yanlılığı, Tutarlılık |
| 11 | **Affinity Score (İlişki Gücü)** | İlişki | ⬛⬛◻◻◻ | Hikaye yanıtı, DM geçmişi ve profil etkileşimi. | Benzerlik, Sürekli Maruz Kalma |
| 12 | **Like (Beğeni)** | Düşük | ⬛⬛◻◻◻ | Pasif ve manipülasyona en açık sinyal. | Düşük Efor, Alışkanlık |
| 13 | **Caption Keyword Match** | Meta | ⬛⬛◻◻◻ | Konu kümeleme ve arama (SEO) indekslemesi. | — |
| 14 | **Audio Fingerprint** | Meta | ⬛⬛◻◻◻ | Ses eşleşmesi ve müzik kütüphanesi uyumu. | Tanıdıklık |
| 15 | **Hashtag Relevance** | Meta | ⬛◻◻◻◻ | Konu doğrulaması (3-5 odak etiket). | — |
| 16 | **Originality Score** | Güvenlik | ⬛⬛⬛⬛◻ | Özgünlük puanı; kopya/watermark filtreleme. | — |

---

### 1.3 Negatif Sinyaller ve Algoritmik Cezalar

1. **Hızlı Swipe-Away (0–2. sn Terk):** %50+ swipe oranı videonun dağıtımını 1. aşamada anında keser.
2. **"İlgilenmiyorum" / "Gizle" Bildirimi:** Ağır negatif ağırlık; benzer kitle havuzlarını kapatır.
3. **Başka Platform Watermark'ı:** Meta ve TikTok, rakip logoları otomatik tespit eder ve erişimi %80 düşürür.
4. **Duplicate Content (Kopya İçerik):** Video hash eşleşmesi durumunda "Orijinal Olmayan İçerik" cezası uygulanır.
5. **Clickbait Payoff Uyuşmazlığı:** İlk 3 saniye izlenip 5. saniyede terk edilen videolar yapay dikkat avcısı olarak işaretlenir.

---

# BÖLÜM 2: Dikkat Nörobiyolojisi & Karar Psikolojisi

### 2.1 Beyin Anatomisi ve Algı Devreleri

- **Ventral Tegmental Area (VTA) & Dopamin:** Beklenmedik bir bilgi duyulduğunda beynin *Ödül Tahmin Hatası (Reward Prediction Error)* devresi ateşlenir. Dopamin, sadece ödül anında değil; ödül beklentisi ve merak anında salgılanır.
- **Anterior Cingulate Cortex (dACC):** Beynin çelişki dedektörüdür. Alışılmışın zıttı bir önerme ("Günde 4 saat uyuyup cilt bakımı yapanlar...") duyulduğunda ACC alarm verir; beyin çelişkiyi çözmeden dikkati başka yere veremez.
- **Ayna Nöron Sistemi (Mirror Neurons):** Ekrandaki insanın yüz ifadesi, göz teması ve beden dili izleyicinin beyninde fiziksel olarak simüle edilir. 0.5m mesafeden göz hizasında sakin konuşan bir creator, güven ve otorite ayna nöronlarını tetikler.
- **Default Mode Network (DMN) Bastırılması:** Otomatik kaydırma anında beyin pasif hayal kurma (DMN) modundadır. Sert bir desen kırılımı (Pattern Interrupt) DMN'i anında kapatıp Görev Odaklı Pozitif Ağa (TPN) geçiş yaptırır.
- **Amigdala & Kayıp Korkusu:** İnsan beyni kazançtan çok kayba duyarlıdır. "Bu hatayı yapıyorsanız her ay 5 bin TL kaybediyorsunuz" ifadesi amigdalayı tetikleyerek acil eylem refleksini devreye sokar.

---

### 2.2 21 Bilişsel Önyargı Tablosu

| # | Bilişsel Önyargı | Açıklama | Video Kanca Uygulaması |
|---|---|---|---|
| 1 | **Bilişsel Çelişki (Festinger)** | Çelişen iki bilginin yarattığı rahatsızlık. | Ters Reçete, Genel Yanlışı Çürütme |
| 2 | **Zeigarnik Etkisi (Zeigarnik)** | Yarım kalan görevlerin unutulamaması. | Açık Döngü, Olayın Ortasından Başlama |
| 3 | **Kayıp Korkusu (Kahneman & Tversky)** | Kayıp acısı, kazanç sevincinden 2.5 kat güçlüdür. | Bütçe Kaçağı, Geri Dönüşü Zor Hata |
| 4 | **Sosyal Kanıt (Cialdini)** | Belirsizlikte çoğunluğun davranışını taklit etme. | Sonuç Kanıtı, Takipçi Hikayesi |
| 5 | **Otorite Yanlılığı (Milgram)** | Uzman ve kıdemli figürlere koşulsuz güven. | Karar Standardı, Alıntı Çapası |
| 6 | **Kıtlık Prensibi (Cialdini)** | Az bulunan veya zamanı kısıtlı olan şeyin değeri artar. | Altın Zaman Penceresi, Sektör Sırrı |
| 7 | **Çapa Etkisi (Tversky & Kahneman)** | İlk verilen bilginin tüm yargıları çerçevelemesi. | Fiyat/Değer Karşılaştırması, Somut Sayı |
| 8 | **Tekrar Maruz Kalma (Zajonc)** | Tanıdık olan şeyin güvenli ve sevimli algılanması. | Kusursuz Döngü, Tutarlı Görsel Dil |
| 9 | **Doruk-Son Kuralı (Kahneman)** | Deneyimin en yoğun anı ve sonu ile hatırlanması. | Dönüşüm Geçişi, Güçlü Payoff |
| 10 | **Sıralama Etkisi (Ebbinghaus)** | Baştaki ve sondaki bilginin zihinde kalması. | 0. Saniye Kancası + Son Saniye Save Çağrısı |
| 11 | **Von Restorff Etkisi (Restorff)** | Homojen gruptan ayrışan öğenin hatırlanması. | Metin Öncelikli Sessiz Açılış, Makro Doku |
| 12 | **Kokteyl Partisi Etkisi (Cherry)** | Gürültüde kendi adını/grubunu seçebilme. | Hedef Kitle Çağrısı ("Küçük hesap sahipleri...") |
| 13 | **Negatiflik Yanlılığı (Baumeister)** | Olumsuz bilginin olumludan daha çok dikkat çekmesi. | Zaman Tuzağı, Ağrı Noktası Kancaları |
| 14 | **Sahiplik Etkisi (Thaler)** | Sahip olunan / kaydedilen şeye yüksek değer biçme. | Ekran Görüntüsü Şablonu |
| 15 | **IKEA Etkisi (Norton et al.)** | Kendi emeğini kattığı şeyi daha değerli bulma. | Boşluk Doldurma İskeleti, Yorum Tamamlama |
| 16 | **Pratfall Etkisi (Aronson)** | Yetkin kişinin küçük kusurunun onu sevimli kılması. | Pahalıya Patlayan Ders, Sahne Arkası |
| 17 | **Gariplik Etkisi (McDaniel)** | Tuhaf/absürt bilginin kolay hatırlanması. | İmkansız Eşleştirme, Görsel Bilmece |
| 18 | **Karşılıklılık (Cialdini)** | İyilik/değer görenin karşılık verme zorunluluğu. | Ücretsiz Eleme Listesi, Şablon Paylaşımı |
| 19 | **Taahhüt & Tutarlılık (Cialdini)** | Küçük bir adıma evet diyenin devam etmesi. | Bu mu O mu Anket Kancası |
| 20 | **Benzerlik & Beğenme (Cialdini)** | Kendine benzeyene güven duyma. | Ortak Acı, Dolaylı İltifat |
| 21 | **Birlik / Unity (Cialdini)** | "Biz aynı kulübün üyesiyiz" kimliği. | Biz vs Onlar Kancası |

---

# BÖLÜM 3: Bütün Kanca Türleri Taksonomisi (12 Kategori / 62 Alt Tür)

Aşağıdaki 62 kanca türü, modern kısa format video ekosisteminde çalışan tüm formülleri eksiksiz içerir.

---

### KATEGORİ 1: BİLİŞSEL ÇELİŞKİ & TERS KÖŞE KANCALARI

#### #1. Ters Reçete (Reverse Prescription)
- **Nörobilişsel Tetik:** Anterior Cingulate Cortex (ACC) Aktivasyonu
- **Hedef Sinyal:** Watch Time (İzlenme Süresi)
- **Formül:** *"Eğer [İstenmeyen Sonuç / Başarısızlık] istiyorsanız, tam olarak [Yaygın Yanlış Alışkanlık] yapmaya devam edin."*
- **Kamera & Kadraj:** Göz hizası, göğüs planı (0.5m). Sabit tripod, yumuşak dolgu ışığı.
- **Beden Dili & Vibe:** Ciddi bakış, hafif ironik tebessüm, sakin ve kendinden emin duruş.
- **Kurgu Kuralı:** İlk 3 saniye kesintisiz konuşma; 4. saniyede kanıt grafiğine sert kesme.
- **Örnek:** *"Eğer bu yıl hiç büyümek istemiyorsanız, her gün rastgele reels atmaya devam edin."*

#### #2. Genel Yanlışı Çürütme (Contrarian Flip)
- **Nörobilişsel Tetik:** Bilişsel Çelişki + Otorite Yanlılığı
- **Hedef Sinyal:** Save Rate (Kaydetme)
- **Formül:** *"[Konu] hakkında herkesin söylediği [Popüler Tavsiye] aslında tamamen yanlış; asıl kural [Gizli Gerçek]."*
- **Kamera & Kadraj:** Göz hizası yakın plan. Elinde konuya dair bir nesne tutarak başla.
- **Beden Dili & Vibe:** Rahat, yargılamayan ama net konuşan kıdemli uzman tonu.
- **Kurgu Kuralı:** İddiadan hemen sonra kanıt nesnesine veya karşılaştırma tablosuna zoom-in.
- **Örnek:** *"Pahalı görünmenin markalarla hiçbir ilgisi yok; her şey omuz ve paça siluetinde bitiyor."*

#### #3. Kendine Güldüren Çelişki (Painful Irony)
- **Nörobilişsel Tetik:** Negatiflik Yanlılığı + Benzerlik
- **Hedef Sinyal:** DM Share (Birebir Paylaşım)
- **Formül:** *"[Büyük Harcama / Çaba] yapıp sonra [Küçük Basit Kuralı İhmal Etme] yapanlar kulübü."*
- **Kamera & Kadraj:** Orta yakın plan, hafifçe öne doğru eğilme.
- **Beden Dili & Vibe:** Anlayışlı bir baş sallama, 'biliyorum siz de yapıyorsunuz' gülümsemesi.
- **Kurgu Kuralı:** 0.5 sn mikro sessizlik ile başla, sonra cümleye gir.
- **Örnek:** *"3 bin liralık serum alıp günde 4 saat uyuyarak cildinin düzeleceğini sananlar kulübü."*

#### #4. Sahte Düşman (False Enemy)
- **Nörobilişsel Tetik:** Bilişsel Çelişki + Çapa Etkisi
- **Hedef Sinyal:** Completion Rate (Tamamlama)
- **Formül:** *"Sorununuz [Sanılan Neden / Algoritma] değil; asıl sorun ilk [X saniyedeki Mikro Hata]."*
- **Kamera & Kadraj:** Göz hizası, 0.5m mesafe. Doğrudan lens teması.
- **Beden Dili & Vibe:** Kesin, net, suçlamayan ama gerçeği söyleyen mentor duruşu.
- **Kurgu Kuralı:** Sahte düşman söylenirken sol el hareketi, gerçek söylenirken sağ el hareketi.
- **Örnek:** *"İçerikleriniz algoritma yüzünden değil, ilk 2 saniyede nefes alıp duraksadığınız için izlenmiyor."*

#### #5. İmkansız Eşleştirme (Impossible Pairing)
- **Nörobilişsel Tetik:** Gariplik Etkisi + Tahmin Hatası
- **Hedef Sinyal:** Watch Time (İzlenme Süresi)
- **Formül:** *"[Alakasız Alan A] ile [Alakasız Alan B] arasındaki tek ortak kural: [Çarpıcı İlke]."*
- **Kamera & Kadraj:** Genişten ortaya hızlı cut veya iki farklı nesneyi kadrajda yan yana tutma.
- **Beden Dili & Vibe:** Merak uyandıran dinginlik, hafif kafa eğme.
- **Kurgu Kuralı:** İki kavram telaffuz edilirken ekranda hızlı split-screen veya minimal ikonlar.
- **Örnek:** *"Bir mimari proje ile sabah kahvesi hazırlamanın ortak kuralı: önce fazlalıkları atacaksın."*

#### #6. Sezgilere Aykırı İddia (Counter-Intuitive Claim)
- **Nörobilişsel Tetik:** Bilişsel Çelişki + Von Restorff
- **Hedef Sinyal:** Save Rate (Kaydetme)
- **Formül:** *"[Beklenen Eylem] yapmak yerine [Zıt Eylem] yaptığınızda [Hedeflenen Başarı] 3 katına çıkar."*
- **Kamera & Kadraj:** Yakın plan, masaya hafifçe iki elini koymuş vaziyette.
- **Beden Dili & Vibe:** Kendine güvenen, veriye dayalı sakin konuşma.
- **Kurgu Kuralı:** 3. saniyede iddiayı doğrulayan grafik veya öncesi/sonrası kanıtı.
- **Örnek:** *"Daha az içerik paylaştığım ay, etkileşimlerim ve gelen müşteri sayısı 2 katına çıktı. İşte mantığı."*

---

### KATEGORİ 2: MERAK BOŞLUĞU & AÇIK DÖNGÜ KANCALARI

#### #7. Olayın Ortasından Başlama (In Medias Res)
- **Nörobilişsel Tetik:** Zeigarnik Etkisi (Açık Döngü)
- **Hedef Sinyal:** Completion Rate (Tamamlama)
- **Formül:** *"Tam [Kritik An / Hata Noktası] aşamasındayken şunu fark ettim ve her şey değişti."*
- **Kamera & Kadraj:** Dinamik kadraj, hareket halindeyken veya bir işi yaparken.
- **Beden Dili & Vibe:** Hafif aciliyet, odaklanmış enerji, telaşsız ciddiyet.
- **Kurgu Kuralı:** Video sıfırıncı saniyede hareketle başlar; hiçbir karşılama cümlesi kullanılmaz.
- **Örnek:** *"Tam bu projeyi çöpe atmak üzereydim, ta ki renk katmanını ters çevirene kadar."*

#### #8. Sektörün Sakladığı Sır (Gatekept Filter)
- **Nörobilişsel Tetik:** Kıtlık Prensibi + Bilgi Boşluğu
- **Hedef Sinyal:** Save Rate (Kaydetme)
- **Formül:** *"[Sektör / Uzmanlar] müşterilerine asla söylemediği ama fatura kestiği tek kural [Sır]."*
- **Kamera & Kadraj:** 0.5m yakın plan, loş arka plan, izole aydınlatılmış yüz.
- **Beden Dili & Vibe:** Alçak ses tonu, fısıldar gibi yakın ama net artikülasyon.
- **Kurgu Kuralı:** Sırrın adı söylenmeden önce 0.3 saniyelik gerilim duraklaması.
- **Örnek:** *"Ajansların müşterilerine asla söylemediği ama fatura kestiği tek metrik: save-to-reach oranı."*

#### #9. Yarım Kalan Deney (Incomplete Test)
- **Nörobilişsel Tetik:** Zeigarnik Etkisi + Sosyal Kanıt
- **Hedef Sinyal:** Completion Rate (Tamamlama)
- **Formül:** *"[Ucuz / Yaygın Seçenek] ile [Pahalı / Profesyonel Seçenek]'i aynı teste soktum; sonuç şaşırttı."*
- **Kamera & Kadraj:** İki nesne masada yan yana; kamera yukarıdan (top-down) veya split açı.
- **Beden Dili & Vibe:** Meraklı bilim insanı sakinliği, tarafsız gözlemci tavrı.
- **Kurgu Kuralı:** Her test aşaması 2 saniyede bir kesilir, sonuç payoff sahnesinde patlar.
- **Örnek:** *"100 liralık tişört ile 2 bin liralık tasarımcı tişörtünü 10 kez yıkadım. İşte kumaş farkı."*

#### #10. Görsel Bilmece (Micro-Mystery)
- **Nörobilişsel Tetik:** Ödül Tahmin Hatası (Dopamin)
- **Hedef Sinyal:** Loop / Replay (Döngü)
- **Formül:** *"Kameranın önüne bu [Garip Obje / Filtre]'yi koymamın çok net bir sebebi var."*
- **Kamera & Kadraj:** Ekstrem yakın plan obje → sonra göz hizası yüz planına yumuşak geçiş.
- **Beden Dili & Vibe:** Merak uyandıran hafif tebessüm, sakin göz teması.
- **Kurgu Kuralı:** İlk 2 saniyede objenin işlevi gösterilmez, 4. saniyede büyüsü çözülür.
- **Örnek:** *"Çekim yaparken telefonun arkasına bu küçük siyah kartı yapıştırmamın tek bir sebebi var."*

#### #11. Yasak Bilgi (Forbidden Knowledge)
- **Nörobilişsel Tetik:** Kıtlık Prensibi + Bilgi Boşluğu
- **Hedef Sinyal:** DM Share (Birebir Paylaşım)
- **Formül:** *"Bunu normalde paylaşmamam gerekiyor ama [Grup] için tek seferlik anlatıyorum."*
- **Kamera & Kadraj:** 0.4m çok yakın plan, adeta kameraya yaklaşmış.
- **Beden Dili & Vibe:** Gizli bir ortaklık kurar gibi samimi ve alçak ses.
- **Kurgu Kuralı:** Konuşma başlarken arka plan hafif blur (bokeh) efekti alır.
- **Örnek:** *"Bunu normalde sadece özel danışmanlıkta söylüyorum ama bio kısmındaki o tek hatayı düzeltin."*

#### #12. Sayı + Vaat Çerçevesi (Numbered Promise)
- **Nörobilişsel Tetik:** Taahhüt & Tutarlılık + Bilişsel Kolaylık
- **Hedef Sinyal:** Save Rate (Kaydetme)
- **Formül:** *"[Sorun]'u çözen sadece [Sayı] kural; özellikle [Son Numara] her şeyi değiştiriyor."*
- **Kamera & Kadraj:** Göz hizası, parmakla 1-2-3 işareti yaparak başlama.
- **Beden Dili & Vibe:** Net, yapılandırılmış, öğretici sakinlik.
- **Kurgu Kuralı:** Her madde ekranda büyük, zarif serif rakamlarla belirir.
- **Örnek:** *"Fotoğraflarınızın amatör durmasını engelleyen 3 ışık kuralı; özellikle 3 numara."*

---

### KATEGORİ 3: FİZİKSEL & GÖRSEL KANCALAR

#### #13. Kameraya Yaklaşma (Proximity Lean)
- **Nörobilişsel Tetik:** Ayna Nöronlar & Parasosyal Güven
- **Hedef Sinyal:** Watch Time (İzlenme Süresi)
- **Formül:** *[Öne eğilme hareketi + 0.3 sn sessizlik] ➔ "Sana kimsenin söylemediği bir şey anlatacağım."*
- **Kamera & Kadraj:** Göz hizası, 0.6m'den 0.4m'ye hafif beden eğilmesi.
- **Beden Dili & Vibe:** Sırdaş, güven veren sakin tebessüm, doğrudan göz teması.
- **Kurgu Kuralı:** Harekete yumuşak ses efekti veya mutlak sessizlik eşlik eder.

#### #14. Aşırı Yakın Doku (Macro-Tactile Zoom)
- **Nörobilişsel Tetik:** Ödül Tahmin Hatası (Duyusal Merak)
- **Hedef Sinyal:** Loop / Replay (Döngü)
- **Formül:** *[Makro doku çekimi + dokunma hareketi] ➔ "Bu dikiş kalitesini sadece 3 marka kullanıyor."*
- **Kamera & Kadraj:** Makro lens / 0.1m aşırı yakın plan, keskin doku odağı.
- **Beden Dili & Vibe:** Dokunsal zevk, titiz kalite odağı.
- **Kurgu Kuralı:** 0.8 saniye sonra geniş açıya hızlı cut.

#### #15. Fiziksel Eleme (Physical Subtraction)
- **Nörobilişsel Tetik:** Von Restorff Etkisi + İzolasyon
- **Hedef Sinyal:** Watch Time (İzlenme Süresi)
- **Formül:** *[Masadaki 4 ürünü eliyle kenara itme] ➔ "Sabah rutininizde aslında sadece bu tek ürün yeterli."*
- **Kamera & Kadraj:** Masa üstü açısı (45 derece veya top-down).
- **Beden Dili & Vibe:** Kararlı, sadeleştiren, minimalizmin lüksünü yansıtan duruş.
- **Kurgu Kuralı:** Her itme hareketinde tok 'whoosh' veya temas sesi.

#### #16. Sert Kadraj Değişimi (Cut-to-Contrast)
- **Nörobilişsel Tetik:** Ödül Tahmin Hatası + Desen Kırılımı
- **Hedef Sinyal:** Completion Rate (Tamamlama)
- **Formül:** *[Kötü ışık / dağınık arka plan] ➔ [1. saniyede Cut] ➔ "Farkı yaratan tek şey bu ışık açısı."*
- **Kamera & Kadraj:** 0. sn amatör el kamerası → 1. sn tripodlu göz hizası portre.
- **Beden Dili & Vibe:** Öncesi/sonrası ustası duruşu, kendinden emin.
- **Kurgu Kuralı:** Tam 1.0 saniyede sert kesme (hard cut), sıfır efekt.

#### #17. Dönüşüm Geçişi (Transformation Cut)
- **Nörobilişsel Tetik:** Doruk-Son Kuralı
- **Hedef Sinyal:** Loop / Replay (Döngü)
- **Formül:** *[Ham durum + hareket] ➔ [Kusursuz bitiş] ➔ "Bunu 3 adımda nasıl yaptığımı gösteriyorum."*
- **Kamera & Kadraj:** Aynı tripod noktasından çekilmiş iki sahne; kusursuz eşleşme.
- **Beden Dili & Vibe:** Büyüleyici sonuç rahatlığı.
- **Kurgu Kuralı:** Match cut ile iki sahne arasındaki pozisyon farkı sıfıra indirilir.

#### #18. Kusursuz Döngü (Seamless Loop)
- **Nörobilişsel Tetik:** Tekrar Maruz Kalma & Tanıdıklık
- **Hedef Sinyal:** Loop / Replay (Döngü)
- **Formül:** *Son Cümle: "...ve işte tam bu yüzden..." ➔ İlk Cümle: "...bu kuralı asla bozmuyorum."*
- **Kamera & Kadraj:** Başlangıç ve bitiş kadrajı birebir aynı açı ve pozisyonda sabitlenir.
- **Beden Dili & Vibe:** Kesintisiz konuşma akışı.
- **Kurgu Kuralı:** Ses ve görüntü son kareden ilk kareye sıfır sıçrama ile bağlanır.

#### #19. Yavaş Çekim Vurgu (Slow-Mo Reveal)
- **Nörobilişsel Tetik:** Görev Moduna Geçiş (DMN Bastırma)
- **Hedef Sinyal:** Watch Time (İzlenme Süresi)
- **Formül:** *[Normal hızda başla] ➔ [Kritik temas anında 60fps yavaş çekim] ➔ "Farkı görüyor musunuz?"*
- **Kamera & Kadraj:** Yüksek kare hızlı yakın plan.
- **Beden Dili & Vibe:** Estetik hayranlık, sakin detay odaklılık.
- **Kurgu Kuralı:** Normal hızdan %40 hıza yumuşak hız rampası (speed ramp).

---

### KATEGORİ 4: STATÜ & KİMLİK KANCALARI

#### #20. Lüksün Eleme Kuralı (Subtraction Taste)
- **Nörobilişsel Tetik:** Otorite Yanlılığı + Çapa Etkisi
- **Hedef Sinyal:** DM Share (Birebir Paylaşım)
- **Formül:** *"Gerçek lüks / stil ne [Eklediğiniz] değil; evden çıkmadan önce neyi [Çıkardığınızdır]."*
- **Kamera & Kadraj:** Göz hizası orta plan, minimalist ve ferah arka plan.
- **Beden Dili & Vibe:** Quiet luxury dinginliği, telaşsız zarafet, dik omuzlar.
- **Kurgu Kuralı:** Sakin kurgu temposu, her sahne 3-4 saniye nefes alır.

#### #21. Görünmez Kalite Göstergesi (Quiet Luxury Indicator)
- **Nörobilişsel Tetik:** Kokteyl Partisi Etkisi + Kıtlık
- **Hedef Sinyal:** Save Rate (Kaydetme)
- **Formül:** *"Bir [Ürün / Mekan / İçerik]'in gerçekten kaliteli olduğunu anlamanın tek bir [Gizli Detay] kuralı var."*
- **Kamera & Kadraj:** Göz hizası portre, arkada loş mimari detay.
- **Beden Dili & Vibe:** Seçkinlik, içeriden bilen uzman bakışı.
- **Kurgu Kuralı:** Detay gösterilirken minimal çizgi veya daire ile işaretleme.

#### #22. Karar Standardı (Decision Standard)
- **Nörobilişsel Tetik:** Taahhüt & Tutarlılık + Otorite
- **Hedef Sinyal:** Save Rate (Kaydetme)
- **Formül:** *"Ben bir [Karar] verirken asla [Popüler Kriter]'e bakmam; baktığım tek şey [Derin Kriter]."*
- **Kamera & Kadraj:** Göz hizası, 0.5m sabit plan.
- **Beden Dili & Vibe:** Prensip sahibi netlik, tavizsiz sakinlik.
- **Kurgu Kuralı:** Kriter ekranda tek satır serif metin olarak belirir.

#### #23. Biz vs Onlar (In-Group Boundary)
- **Nörobilişsel Tetik:** Birlik & Paylaşılan Kimlik (Unity)
- **Hedef Sinyal:** Comment Depth (Yorum Derinliği)
- **Formül:** *"[Gürültülü Çoğunluk] [Yüzeysel Davranış] yapmaya devam etsin; biz [Bilinçli Azınlık] tarafındayız."*
- **Kamera & Kadraj:** Göz hizası samimi yakın plan.
- **Beden Dili & Vibe:** Birlikte bir kulüpteymiş gibi yakın ve sıcak üslup.
- **Kurgu Kuralı:** Yorumlara davet eden doğal bir kapanış.

#### #24. Hedef Kitle Çağrısı (Identity Call-Out)
- **Nörobilişsel Tetik:** Kokteyl Partisi Etkisi
- **Hedef Sinyal:** Completion Rate (Tamamlama)
- **Formül:** *"Eğer [Spesifik Profil / Rol] iseniz ve [Spesifik Hedef] istiyorsanız, bu video sizin için."*
- **Kamera & Kadraj:** Göz hizası, doğrudan kameraya hitap.
- **Beden Dili & Vibe:** Doğrudan, net, vakit kaybettirmeyen profesyonellik.
- **Kurgu Kuralı:** İlk kelimede hedef kitlenin adı ekranda kalın puntoyla çıkar.

---

### KATEGORİ 5: İŞİTSEL & SES TONU KANCALARI

#### #25. Mikro Sessizlik (Micro-Silence Drop)
- **Nörobilişsel Tetik:** Ödül Tahmin Hatası + Desen Kırılımı
- **Hedef Sinyal:** Watch Time (İzlenme Süresi)
- **Formül:** *[0.5 sn derin göz teması + sessizlik] ➔ Sakin ve alçak sesle: "Şimdi sana bir şey göstereceğim."*
- **Kamera & Kadraj:** Göz hizası, sabit 0.5m mesafe. Göz kırpmadan doğrudan lens.
- **Beden Dili & Vibe:** Derin özgüven, tam odaklanma, sıfır telaş.
- **Kurgu Kuralı:** Müzik 0. saniyede başlamaz; konuşmayla birlikte derinden girer.

#### #26. Fısıltı & Samimiyet (Conspiratorial Whisper)
- **Nörobilişsel Tetik:** Ayna Nöronlar & Parasosyal Güven
- **Hedef Sinyal:** Watch Time (İzlenme Süresi)
- **Formül:** *[Mikrofona hafif yaklaşma + alçak ses] ➔ "Bunu herkese söylemiyorlar ama..."*
- **Kamera & Kadraj:** Ekstrem yakın yüz kadrajı, yaka mikrofonu net duyulabilir.
- **Beden Dili & Vibe:** Gizli anlaşma, samimi sırdaşlık.
- **Kurgu Kuralı:** Ses miksajında bas ve netlik yükseltilir (ASMR yakınlığı).

#### #27. Net Ortam Sesi / ASMR (Tactile Snap)
- **Nörobilişsel Tetik:** Görev Moduna Geçiş (DMN Bastırma)
- **Hedef Sinyal:** Loop / Replay (Döngü)
- **Formül:** *[Kristal netliğinde mekanik/fiziksel ses] ➔ "İşte kaliteli bir işin ilk sesi."*
- **Kamera & Kadraj:** Nesnenin tam yanına konumlandırılmış makro ses/kamera açısı.
- **Beden Dili & Vibe:** Detay titizliği, duyusal doyum.
- **Kurgu Kuralı:** Ses dalgasında ilk vuruş (transient) en yüksek seviyeye ayarlanır.

#### #28. Aşırı Ciddi & Sakin Duruş (Deadpan Calm)
- **Nörobilişsel Tetik:** Bilişsel Çelişki (ACC Aktivasyonu)
- **Hedef Sinyal:** Watch Time (İzlenme Süresi)
- **Formül:** *[Kaotik Başlık] ➔ [Sıfır mimik, düz ses tonu] ➔ "Panik yapmayın, çözümü çok basit."*
- **Kamera & Kadraj:** Göz hizası, tam simetrik kadraj.
- **Beden Dili & Vibe:** Deadpan otorite, sıfır abartı, tam kontrol.
- **Kurgu Kuralı:** Kurguda sıfır ses efekti, sadece net ses kaydı.

#### #29. Trending Ses Kırılımı (Audio Trend Hijack)
- **Nörobilişsel Tetik:** Tekrar Maruz Kalma & Tanıdıklık
- **Hedef Sinyal:** Completion Rate (Tamamlama)
- **Formül:** *[Viral Ses Başlangıcı 1.5 sn] ➔ [Ani Kesme + Kendi Sesin] ➔ "Bu trendi boşverin, asıl mesele şu."*
- **Kamera & Kadraj:** İlk 1.5 sn trend duruşu → 2. sn kameraya doğru adım atma.
- **Beden Dili & Vibe:** Trendlerin üstünde bir otorite tavrı.
- **Kurgu Kuralı:** Ses tam ritim vuruşunda sertçe 'mute' edilir ve canlı ses girer.

---

### KATEGORİ 6: DEĞER & KAYDETME KANCALARI

#### #30. 3 Adımlı Eleme Listesi (Exclusion Filter)
- **Nörobilişsel Tetik:** Kayıp Korkusu + Bilişsel Kolaylık
- **Hedef Sinyal:** Save Rate (Kaydetme)
- **Formül:** *"Bir dahaki sefere [Karar / Satın Alma] yapmadan önce şu 3 eleme filtresini uygulayın."*
- **Kamera & Kadraj:** Göz hizası, sol veya sağ tarafta metin boşluğu bırakılmış kadraj.
- **Beden Dili & Vibe:** Eğitici, net, pratik danışman enerjisi.
- **Kurgu Kuralı:** Her madde ekranda onay kutusu (checkbox) şeklinde belirir.

#### #31. Altın Zaman Penceresi (Golden Window)
- **Nörobilişsel Tetik:** Kıtlık Prensibi + Bilgi Boşluğu
- **Hedef Sinyal:** Save Rate (Kaydetme)
- **Formül:** *"Günün sadece [X dakikalık] bir altın penceresi var; [Eylem]'i tam bu aralıkta yapmalısınız."*
- **Kamera & Kadraj:** Göz hizası, arkada doğal ışık veya saat detayı.
- **Beden Dili & Vibe:** Özel zaman bilgisi veren rehber tonu.
- **Kurgu Kuralı:** Saat/zaman dilimi ekranda şık bir sayaçla gösterilir.

#### #32. Ekran Görüntüsü Şablonu (Screenshot Frame)
- **Nörobilişsel Tetik:** Sahiplik Etkisi (Endowment)
- **Hedef Sinyal:** Save Rate (Kaydetme)
- **Formül:** *"Bunu hemen ekran görüntüsü alın veya kaydedin; [Konu]'nun tek sayfalık formülü bu."*
- **Kamera & Kadraj:** Creator hafifçe yana çekilir; ekranın 2/3'ünü temiz şablon kaplar.
- **Beden Dili & Vibe:** Cömert paylaşımcı, net eğitici.
- **Kurgu Kuralı:** Şablon ekranda tam 3 saniye sabit kalır.

#### #33. Boşluk Doldurma İskeleti (Fill-in-the-Blank)
- **Nörobilişsel Tetik:** IKEA Etkisi (Emek Değeri)
- **Hedef Sinyal:** Save Rate (Kaydetme)
- **Formül:** *"Bio kısmınıza tam olarak şu cümleyi yazın: 'Ben [Hedef Kitle] için [Fayda] üretiyorum.'"*
- **Kamera & Kadraj:** Göz hizası portre, ekranda animasyonlu boşluk doldurma kutucukları.
- **Beden Dili & Vibe:** Pratik, uygulanabilir, doğrudan sonuca götüren netlik.
- **Kurgu Kuralı:** Boşluklar kelime kelime daktilo efektiyle dolar.

#### #34. Karar Matrisi (Decision Matrix)
- **Nörobilişsel Tetik:** Çapa Etkisi + Fiyat/Değer
- **Hedef Sinyal:** Save Rate (Kaydetme)
- **Formül:** *"Eğer durum [A] ise [Seçenek 1]; eğer durum [B] ise kesinlikle [Seçenek 2]."*
- **Kamera & Kadraj:** Split screen (ikiye bölünmüş kadraj) veya yan yana karşılaştırma.
- **Beden Dili & Vibe:** Analitik, tarafsız, net danışman duruşu.
- **Kurgu Kuralı:** İki seçenek arasında yeşil ve kırmızı onay işaretleri.

#### #35. Yayın Öncesi Kontrol Listesi (Actionable Checklist)
- **Nörobilişsel Tetik:** Taahhüt & Tutarlılık
- **Hedef Sinyal:** Save Rate (Kaydetme)
- **Formül:** *"Paylaş butonuna basmadan önce şu 4 maddeyi tek tek kontrol edin."*
- **Kamera & Kadraj:** Göz hizası, elde telefon veya not defteri.
- **Beden Dili & Vibe:** Titiz, disiplinli, profesyonel son kontrolcü.
- **Kurgu Kuralı:** Her maddede 'check' sesi ve yeşil tik ikonu.

---

### KATEGORİ 7: KAYIP KORKUSU & MALİYET KANCALARI

#### #36. Gizli Bütçe Kaçağı (Silent Budget Leak)
- **Nörobilişsel Tetik:** Kayıp Korkusu (Amigdala)
- **Hedef Sinyal:** DM Share (Birebir Paylaşım)
- **Formül:** *"Farkında olmadan her ay [Bütçe / Zaman]'ınızın %40'ını şu küçük hataya ödüyorsunuz."*
- **Kamera & Kadraj:** Göz hizası yakın plan, ciddi ve uyarıcı ton.
- **Beden Dili & Vibe:** Samimi uyarıcı, dostça koruyucu.
- **Kurgu Kuralı:** Kaybedilen miktar ekranda kırmızı eksi (-TL) olarak belirir.

#### #37. Geri Dönüşü Zor Hata (Irreversible Mistake)
- **Nörobilişsel Tetik:** Kayıp Korkusu (Amigdala)
- **Hedef Sinyal:** Save Rate (Kaydetme)
- **Formül:** *"Markanızı kurarken bu adımı atlarsanız, 6 ay sonra her şeye baştan başlamak zorunda kalırsınız."*
- **Kamera & Kadraj:** Göz hizası, sabit ve odaklanmış plan.
- **Beden Dili & Vibe:** Ciddi, tecrübeli, felaketi önleyen rehber.
- **Kurgu Kuralı:** Uyarının altına 'DİKKAT' yazısı olmadan doğal konuşma.

#### #38. Zaman Tuzağı (Time Sink)
- **Nörobilişsel Tetik:** Negatiflik Yanlılığı
- **Hedef Sinyal:** Watch Time (İzlenme Süresi)
- **Formül:** *"[İş] için saatlerce uğraşıp yine de amatör sonuç almanızın tek bir sebebi var."*
- **Kamera & Kadraj:** Masa başında çalışırken veya bilgisayar ekranı önünde.
- **Beden Dili & Vibe:** Yorgunluktan kurtaran çözüm ortağı rahatlığı.
- **Kurgu Kuralı:** Zaman sayacı hızla akarken 'DUR' sesi.

#### #39. Pişmanlık Filtresi (Regret Filter)
- **Nörobilişsel Tetik:** Kayıp Korkusu (Amigdala)
- **Hedef Sinyal:** Save Rate (Kaydetme)
- **Formül:** *"[Satın Alma / Karar] vermeden önce kendinize sormanız gereken tek bir soru var."*
- **Kamera & Kadraj:** Göz hizası çok yakın plan (0.4m).
- **Beden Dili & Vibe:** Düşündüren, sakinleştiren, dürtüsel kararları durduran bilgelik.
- **Kurgu Kuralı:** Sorudan önce 0.5 saniyelik derin bir duraklama.

#### #40. Fırsat Maliyeti Aynası (Opportunity Cost Mirror)
- **Nörobilişsel Tetik:** Kayıp Korkusu + Sahiplik Etkisi
- **Hedef Sinyal:** DM Share (Birebir Paylaşım)
- **Formül:** *"Her gün [Küçük Eylem] için harcadığınız [Süre] ile aslında [Büyük Hedef]'i inşa edebilirdiniz."*
- **Kamera & Kadraj:** Göz hizası orta plan.
- **Beden Dili & Vibe:** Ufuk açan, sarsan ama ilham veren üslup.
- **Kurgu Kuralı:** Kaçırılan fırsatlar ekranda temiz bir liste halinde akar.

---

### KATEGORİ 8: HİKAYE & OTANTİK İTİRAF KANCALARI

#### #41. Pahalıya Patlayan Ders (Expensive Lesson)
- **Nörobilişsel Tetik:** Pratfall Etkisi (Sevimli Kusur)
- **Hedef Sinyal:** Completion Rate (Tamamlama)
- **Formül:** *"[Hedef]'e ulaşmaya çalışırken bana [Maliyet / Yıl]'a mal olan en büyük hatam."*
- **Kamera & Kadraj:** Göz hizası, doğal ve abartısız stüdyo ortamı.
- **Beden Dili & Vibe:** Dürüst, alçakgönüllü ama dersini almış kıdemli duruş.
- **Kurgu Kuralı:** Hikaye doğrudan kriz anından başlar.

#### #42. Filtresiz Sahne Arkası (Raw BTS)
- **Nörobilişsel Tetik:** Pratfall Etkisi (Sevimli Kusur)
- **Hedef Sinyal:** Comment Depth (Yorum Derinliği)
- **Formül:** *"O kusursuz görünen [Sonuç]'un perde arkasında aslında [Zorluk / Gerçek] yaşandı."*
- **Kamera & Kadraj:** El kamerası, dağınık masa/oda, filtresiz doğal ışık.
- **Beden Dili & Vibe:** Filtresiz dürüstlük, samimi insan hali.
- **Kurgu Kuralı:** Cilalı son fotoğraftan dağınık kulise ani geçiş.

#### #43. Rahatsız Edici Soru (Uncomfortable Question)
- **Nörobilişsel Tetik:** Bilişsel Çelişki (ACC Aktivasyonu)
- **Hedef Sinyal:** Completion Rate (Tamamlama)
- **Formül:** *"Geçen hafta bir [Müşteri / Takipçi] bana öyle bir soru sordu ki, tüm sistemi değiştirmek zorunda kaldım."*
- **Kamera & Kadraj:** Göz hizası portre, hafifçe düşünceli bir bakış.
- **Beden Dili & Vibe:** Düşünceli, sorgulayan, gerçeğe saygılı uzman tavrı.
- **Kurgu Kuralı:** Sorunun sorulma anı ile çözüm arasında 1 saniyelik düşünme payı.

#### #44. Dönüm Noktası (Pivot Point)
- **Nörobilişsel Tetik:** Doruk-Son Kuralı
- **Hedef Sinyal:** Watch Time (İzlenme Süresi)
- **Formül:** *"Tam [Pes Etme Anı] noktasındayken keşfettiğim ve [Sonuç]'u 5 katına çıkaran o sistem."*
- **Kamera & Kadraj:** Göz hizası yakın plan, hafif dramatik aydınlatma.
- **Beden Dili & Vibe:** İlham veren, sakin zafer duygusu.
- **Kurgu Kuralı:** Dönüm noktası anında arka plana derin bir pad sesi girer.

#### #45. Somut Sayı İtirafı (Specific Number Confession)
- **Nörobilişsel Tetik:** Çapa Etkisi (Anchoring)
- **Hedef Sinyal:** Completion Rate (Tamamlama)
- **Formül:** *"[Tam Rakam: örn. 47] gün boyunca [Eylem] yaptım ve hesabımda [Tam Sonuç] oldu."*
- **Kamera & Kadraj:** Göz hizası, ekranda analytics veya ajanda kanıtı.
- **Beden Dili & Vibe:** Veri odaklı, dürüst araştırmacı sakinliği.
- **Kurgu Kuralı:** Tam sayı söylenirken ekranda rakam animasyonu.

#### #46. İzleyici Hikayesi Köprüsü (User Story Bridge)
- **Nörobilişsel Tetik:** Sosyal Kanıt Prensibi
- **Hedef Sinyal:** DM Share (Birebir Paylaşım)
- **Formül:** *"Geçen ay bana DM'den [Sorun]'unu anlatan bir takipçime şu tek taktiği verdim; sonuç bu."*
- **Kamera & Kadraj:** Elde telefon, DM ekran görüntüsü blurlu arka planda.
- **Beden Dili & Vibe:** Yardımsever, sonuç odaklı topluluk lideri.
- **Kurgu Kuralı:** Sonuç mesajı ekranda parlama efektiyle açılır.

---

### KATEGORİ 9: YORUM & TARTIŞMA MOTORU KANCALARI

#### #47. Kutuplaştırıcı İkili (Polarizing Dichotomy)
- **Nörobilişsel Tetik:** Birlik & Paylaşılan Kimlik (Unity)
- **Hedef Sinyal:** Comment Depth (Yorum Derinliği)
- **Formül:** *"Sektörde sadece iki tip insan var: [Grup A] ve [Grup B]. Sen hangisisin?"*
- **Kamera & Kadraj:** Göz hizası, kamerayı iki tarafa bölmüş gibi sol ve sağ el hareketleri.
- **Beden Dili & Vibe:** Kışkırtmayan ama net ayrım yapan keskin gözlemci.
- **Kurgu Kuralı:** Videonun sonunda izleyiciye doğrudan 'Yorumlarda tarafını seç' çağrısı.

#### #48. Tartışmalı Sıralama (Unpopular Tier-List)
- **Nörobilişsel Tetik:** Negatiflik Yanlılığı
- **Hedef Sinyal:** Comment Depth (Yorum Derinliği)
- **Formül:** *"[Kategori]'deki en popüler 5 [Araç / Marka]'yı sıralıyorum; 1 numara herkesi şaşırtacak."*
- **Kamera & Kadraj:** Ekranda S-A-B-C-D tier list tablosu, creator sağ altta.
- **Beden Dili & Vibe:** Objektif eleştirmen, popülerliğe aldırmayan kalite hakemi.
- **Kurgu Kuralı:** Her sırayı yerleştirirken 'tok' yerleşme sesi.

#### #49. Kontrollü Detay (Controlled Micro-Friction)
- **Nörobilişsel Tetik:** Von Restorff Etkisi + İzolasyon
- **Hedef Sinyal:** Comment Depth (Yorum Derinliği)
- **Formül:** *[Ciddi içerik anlatılırken arka planda ters duran kitap / ilginç saat / sıra dışı fincan].*
- **Kamera & Kadraj:** Orta plan, arka plan netliğinde dikkat çeken tek bir detay.
- **Beden Dili & Vibe:** Tamamen konuya odaklı, arka plandaki objeye hiç değinmeyen ciddiyet.
- **Kurgu Kuralı:** Objeye zoom yapılmaz; izleyicinin kendi kendine keşfetmesi sağlanır.

#### #50. Tamamlama Daveti (Completion Invite)
- **Nörobilişsel Tetik:** IKEA Etkisi (Emek Değeri)
- **Hedef Sinyal:** Comment Depth (Yorum Derinliği)
- **Formül:** *"Bir [Uzman / Marka]'nın kalitesini anlamanın en kestirme yolu onun [___] bakmaktır. Sizce?"*
- **Kamera & Kadraj:** Göz hizası, son cümlede doğrudan kameraya soru sorar gibi hafif duraksama.
- **Beden Dili & Vibe:** Meraklı, izleyicinin aklına değer veren tavır.
- **Kurgu Kuralı:** Soru sorulduğu anda video biter, cevap açık bırakılır.

#### #51. Bu mu O mu? (This or That Poll)
- **Nörobilişsel Tetik:** Taahhüt & Tutarlılık
- **Hedef Sinyal:** Comment Depth (Yorum Derinliği)
- **Formül:** *"[Seçenek A] mı yoksa [Seçenek B] mi? Yoruma sadece A veya B yazın."*
- **Kamera & Kadraj:** İki seçenek ekranda solda ve sağda net kutularla gösterilir.
- **Beden Dili & Vibe:** Hızlı, dinamik, kararı izleyiciye bırakan netlik.
- **Kurgu Kuralı:** Ekranın ortasında dikey çizgiyle ayrılmış 2 seçenek.

---

### KATEGORİ 10: KANIT & OTORİTE KANCALARI

#### #52. İstatistik Şoku (Statistic Shock)
- **Nörobilişsel Tetik:** Çapa Etkisi (Anchoring)
- **Hedef Sinyal:** Save Rate (Kaydetme)
- **Formül:** *"Araştırmalara göre insanların % [Çarpıcı Yüzde]'si [Şaşırtıcı Davranış] yapıyor."*
- **Kamera & Kadraj:** Göz hizası, ekranda veri kaynağının logosu veya rapor görseli.
- **Beden Dili & Vibe:** Akademik titizlik, kanıtlanmış bilgi güveni.
- **Kurgu Kuralı:** İstatistik rakamı ekranda büyüterek 1 saniye vurgulanır.

#### #53. Canlı Deney (Live Test)
- **Nörobilişsel Tetik:** Sosyal Kanıt Prensibi
- **Hedef Sinyal:** Completion Rate (Tamamlama)
- **Formül:** *"Şimdi gözünüzün önünde [Test]'i yapıyorum; bakalım iddia doğru çıkacak mı."*
- **Kamera & Kadraj:** Açık ve net çalışma masası açısı, iki el de görünür.
- **Beden Dili & Vibe:** Şeffaf, dürüst deneyci, hilesiz netlik.
- **Kurgu Kuralı:** Kesintisiz tek plan (one-shot) hissi veren akıcı kurgu.

#### #54. Alıntı Çapası (Quotation Anchor)
- **Nörobilişsel Tetik:** Otorite Yanlılığı
- **Hedef Sinyal:** Save Rate (Kaydetme)
- **Formül:** *"[Otorite İsim] yıllar önce şöyle demişti: '[Çarpıcı Alıntı]'. İşte bugün bunun kanıtı."*
- **Kamera & Kadraj:** Göz hizası portre, arkada minimalist kitaplık veya sade fon.
- **Beden Dili & Vibe:** Kültürlü, vizyoner, büyük resmi gören bilge ton.
- **Kurgu Kuralı:** Alıntı ekranda zarif tırnak işaretleriyle belirir.

#### #55. Sonuç Kanıtı (Result Proof)
- **Nörobilişsel Tetik:** Sosyal Kanıt Prensibi
- **Hedef Sinyal:** Profile Visit (Profil Ziyareti & Takip)
- **Formül:** *"[Büyük Sonuç Ekranı] ➔ 'Bu sonucu almak için yaptığım tek stratejik değişiklik şuydu.'"*
- **Kamera & Kadraj:** 0. sn ekran görüntüsü / dashboard → 1. sn creator yüz planı.
- **Beden Dili & Vibe:** Sonuç almış profesyonel rahatlığı, hava atmayan ciddiyet.
- **Kurgu Kuralı:** Kanıt görseli ilk 1 saniyede ekranda kalır, sonra creator'a döner.

#### #56. Ters Mühendislik (Reverse Engineering)
- **Nörobilişsel Tetik:** Bilgi Boşluğu (Information Gap)
- **Hedef Sinyal:** Save Rate (Kaydetme)
- **Formül:** *"Bu [Başarılı Örnek]'in [Milyonluk Sonuç] almasının arkasındaki 3 katmanlı yapıyı açıyorum."*
- **Kamera & Kadraj:** Ekranda incelenen örnek video, creator köşede yorumcu modunda.
- **Beden Dili & Vibe:** Usta analizci, cerrah titizliği.
- **Kurgu Kuralı:** İncelenen videonun kritik anlarında donma (freeze frame) ve ok işaretleri.

---

### KATEGORİ 11: EMPATİ & İLİŞKİ KANCALARI

#### #57. Ortak Acı (Shared Pain)
- **Nörobilişsel Tetik:** Ayna Nöronlar & Parasosyal Güven
- **Hedef Sinyal:** DM Share (Birebir Paylaşım)
- **Formül:** *"O '[Günlük Kriz Anı]' hissini çok iyi biliyorum; işte bundan kurtulmanın tek yolu."*
- **Kamera & Kadraj:** Göz hizası samimi yakın plan, sıcak doğal ışık.
- **Beden Dili & Vibe:** Şefkatli, anlayan, aynı yollardan geçmiş yol arkadaşı.
- **Kurgu Kuralı:** Yumuşak geçişler, acele etmeyen nefesli kurgu.

#### #58. POV Senaryosu (POV Scenario)
- **Nörobilişsel Tetik:** Ayna Nöronlar & Parasosyal Güven
- **Hedef Sinyal:** DM Share (Birebir Paylaşım)
- **Formül:** *"POV: [Durum / Senaryo] yaşanıyor ve sen [Kritik Tepki]'yi veriyorsun."*
- **Kamera & Kadraj:** Birinci şahıs açısı (gözden bakış) veya doğrudan kullanıcıya dönük ayna planı.
- **Beden Dili & Vibe:** İçten, mizahi veya dramatik özdeşleşme.
- **Kurgu Kuralı:** Ekranda büyük 'POV:' başlığı.

#### #59. Dolaylı İltifat (Indirect Compliment)
- **Nörobilişsel Tetik:** Benzerlik & Beğenme (Liking)
- **Hedef Sinyal:** Watch Time (İzlenme Süresi)
- **Formül:** *"Eğer bu videoyu buraya kadar izlediyseniz, sektördeki insanların %95'inden daha bilinçlisiniz."*
- **Kamera & Kadraj:** Göz hizası yakın plan, sıcak ve takdir eden bir bakış.
- **Beden Dili & Vibe:** Samimi takdir, ortak zevk ortağı.
- **Kurgu Kuralı:** İltifattan hemen sonra konunun en derin tüyosuna geçiş.

#### #60. Rahatlatan Normalleştirme (Normalization Relief)
- **Nörobilişsel Tetik:** Sosyal Kanıt Prensibi
- **Hedef Sinyal:** DM Share (Birebir Paylaşım)
- **Formül:** *"İlk [X Denemeniz]'in kötü olması tamamen normal; işte profesyonellerin geçtiği o yol."*
- **Kamera & Kadraj:** Göz hizası, sıcak ve güven veren plan.
- **Beden Dili & Vibe:** Rahatlatıcı mentor, suçluluk duygusunu alan bilge.
- **Kurgu Kuralı:** Nefes alma payı, sakinleştirici tempo.

---

### KATEGORİ 12: ZAMANLAMA & YAPISAL KANCALAR

#### #61. Metin Öncelikli Sessiz Açılış (Text-First Silent Hook)
- **Nörobilişsel Tetik:** Von Restorff Etkisi (İzolasyon)
- **Hedef Sinyal:** Completion Rate (Tamamlama)
- **Formül:** *[İlk 1.5 sn ekranda büyük beyaz metin + arka planda hareket] ➔ "Sesli dinleyin."*
- **Kamera & Kadraj:** Estetik sessiz hareket (b-roll) arkada, merkezde güçlü tipografi.
- **Beden Dili & Vibe:** Modern, sessiz sinema estetiği.
- **Kurgu Kuralı:** Yazı tam 1.5 sn sonra kaybolur ve creator'ın ilk cümlesi başlar.

#### #62. 3-5 Saniyelik Desen Kırılım Ritmi (Pattern Interrupt Rhythm)
- **Nörobilişsel Tetik:** Görev Moduna Geçiş (DMN Bastırma)
- **Hedef Sinyal:** Completion Rate (Tamamlama)
- **Formül:** *[0-3 sn Geniş] ➔ [3-7 sn Yakın Zoom] ➔ [7-12 sn B-Roll Kanıtı] ➔ [12-18 sn Payoff Portre].*
- **Kamera & Kadraj:** Çok açılı çekim (A-Cam ve B-Cam veya dijital %115 zoom-in).
- **Beden Dili & Vibe:** Dinamik, ritmik, modern editoryal tempo.
- **Kurgu Kuralı:** Her sahne değişimi konuşmanın nefes aldığı milisaniyede gerçekleşir.

---

# BÖLÜM 4: Saniye Saniye Retention Eğrisi Mühendisliği

```
0.0 sn ──── 1.5 sn ───────── 5.0 sn ─────────────── 15.0 sn ─────────────── 25.0 sn ──────── Bitiş
│          │                 │                      │                       │               │
▼          ▼                 ▼                      ▼                       ▼               ▼
[GÖRSEL]   [BİLİŞSEL ÇELİŞKİ] [RASYONEL KÖPRÜ]      [FİZİKSEL KANIT]        [DORUK / PAYOFF][SAVE/SHARE]
(Desen     (Ters Önerme /    (Mantığı İzah Eden    (Test / Karşılaştırma /  (Tek Cümlelik   (Low-Regret
Kırılımı)   Merak Boşluğu)    İlk Cümle)             Ekran Görüntüsü)        Sonuç Şablonu)  Eylem)
```

### 4.1 5 Aşamalı Zaman Tüneli

1. **0.0 – 1.5 sn (Swipe Gate):** Göz teması, göz hizası yakın plan (0.5m), ilk 1.5 saniyede nefes almadan doğrudan iddiaya giriş.
2. **1.5 – 5.0 sn (Dissonance Gate):** Bilişsel çelişkiyi doğuran ters önerme söylenir. İzleyicinin beyninde soru işareti açılır.
3. **5.0 – 15.0 sn (Proof Bridge):** İddia havada bırakılmaz; hemen fiziksel bir nesneye, ekrana veya formüle bağlanır.
4. **15.0 – 25.0 sn (Payoff & Transformation):** Çözüm tek bir görsel şablon veya 3 maddelik eleme kuralı olarak ekrana basılır.
5. **Son 3 saniye (Action Gate):** "Bunu kaydetmeden geçerseniz unutursunuz" veya "Arkadaşına gönder" çağrısı yerine, değerin kendisiyle Save/Share tetiklenir.

---

### 4.2 Retention Eğrisi Teşhis Tablosu

| Eğri Tipi | Görünüm | Olası Neden | Reçete |
|---|---|---|---|
| **Uçurum (Cliff)** | İlk 3 saniyede %40+ düşüş | Zayıf kanca, yavaş giriş ("Herkese merhaba..."), amatör kadraj. | İlk 1.5 saniyede doğrudan diyalogla başla; göz hizası yakın plana geç. |
| **Kaygan Eğim (Slope)** | 5-15. sn arasında sürekli düşüş | Tempo düşük, desen kırılımı yok, tek açı sabit konuşma. | Her 4 saniyede bir kamera açısını (%110 zoom) veya B-roll'u değiştir. |
| **Orta Çöküş (Mid-Dip)** | 10. saniyede ani düşüş | Vaat edilen kanıt gecikti; izleyici sıkıldı. | Kanıt sahnesini 6. saniyeye çek; uzatmadan formülü ver. |
| **Kusursuz Tepe (Hump)** | %70+ düz çizgi ve sonda yükselme | Kusursuz döngü ve yoğun bilgi değeri. | Bu kart formatını ve şablonunu diğer konularda tekrarla. |

---

# BÖLÜM 5: Çekim Kartı Entegrasyon Standardı & Kalite Kapısı

ViralBox çekim kartlarının her biri bu ansiklopediye birebir dayanır.

### 5.1 Üçlü Senkronizasyon Kuralı

```
┌────────────────────────────────────────────────────────────────────────────┐
│  🎙️ DİYALOG (Ne söyleyeceksin?)                                           │
│  ➔ 62 Kanca türünden birine dayalı net, birinci şahıs replik.             │
│                                                                            │
│  🎬 KAMERA (Nasıl kadrajlayacaksın?)                                       │
│  ➔ Göz hizası, 0.5m mesafe, 4 saniyede bir desen kırılımı açısı.           │
│                                                                            │
│  🎭 BEDEN DİLİ (Nasıl duracaksın?)                                         │
│  ➔ Yüksek Statülü Sakinlik (High-Status Calmness), hafif tebessüm.         │
│  ➔ Bağırma yok, abartılı el kol hareketi yok, dostça otorite duruşu.      │
└────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Quality Gate (Kırmızı Çizgi) Kuralları

Bir kart sisteme kabul edilmez eğer:
1. `whyItWorks` boşsa veya `hookId` yok / lane+format'a uyumsuzsa.
2. `shootFormat` yoksa.
3. Kamera yalnızca "medium shot" ise.
4. Beden dili tembel kalıp ise ("enerjik ol", "heyecanlı anlat").
5. Kanıt sahnesi yoksa veya clickbait havada kalıyorsa.
6. Konuşulan formatta `spokenLine` yoksa.

Yönetmenlik evrensel değildir. Talking Head + editorial için göz hizası. Hands-only / text-led / voiceover için yüz dayatılmaz.

---

# BÖLÜM 6: 12 Purchase Lane Matrisi

Ürün slug'ları (`public.categories`).

| Slug | Top 3 kanca | Kanıt | İddia sınırı |
|---|---|---|---|
| `beauty` | #14 makro doku, #2 çürütme, #17 match cut | Ayna / doku | Klinik tedavi iddiası yok |
| `fashion` | #20 eleme, #2 siluet, #21 dikiş | Astar / dikiş payı | Marka övgüsü yerine kesim |
| `commerce_affiliate` | #30 eleme, #34 çapa, #9 aşınma | Yan yana test | Sponsorsuz kanıt |
| `creator_education` | #33 boşluk, #1 ters reçete, #32 ekran | Tek sayfa formül | Büyüme garantisi yok |
| `entertainment_comedy` | #28 deadpan, #3 çelişki, #23 biz/onlar | Absürt prosedür | Kişi/kimlik hedef değil |
| `fitness_wellness_safe` | #1 kardiyo tuzağı, #60 normalleştirme, #38 zaman | Form açısı | Tıbbi iddia yok |
| `food` | #27 ASMR, #8 sır, #30 3 malzeme | Kesme tahtası / çıtırlık | Mucize diyet yok |
| `lifestyle` | #25 mikro sessizlik, #3 rutin, #40 fırsat maliyeti | Zaman günlüğü | Hayat koçluğu yok |
| `luxury` | #21 görünmez kalite, #20 subtraction, #22 standart | Ağırlık / akustik | Fiyat övünmesi yok |
| `parenting_family` | #57 ortak acı, #60 normalleştirme, #39 pişmanlık | Günlük kriz | Çocuk utandırma yok |
| `thought_leadership` | #4 sahte düşman, #41 pahalı ders, #36 bütçe kaçağı | Dashboard | Uydurma rakam yok |
| `travel` | #31 17 dk pencere, #8 sır, #58 POV | Koordinat / ışık saati | Boş otel övgüsü yok |

---

# BÖLÜM 7: 8 Çekim Formatı

Checkout anahtarı değil. Kart alanı `shootFormat`.

| Format | Kurulum | Uyumlu kancalar | Dikkat çürümesi |
|---|---|---|---|
| `talking_head` | 0.5m göz hizası, dolgu | Ters reçete, otorite, sırdaş | 4 sn'de bir kesme/zoom |
| `voiceover` | 3–5 sn kanıt b-roll | In medias res, ters mühendislik | Boş talking-head yok |
| `hands_only` | 45° top-down | Makro, eleme, ASMR | El çıkar, nesne kalır |
| `pov` | Göğüs/tek el | POV senaryosu, canlı test | İlk 2 sn yön net |
| `screen_recording` | %120 zoom, işaretçi | Şablon, matris, dashboard | İmleç iddiayı işaretler |
| `object_led` | Tek nesne | Bilmece, lüks gösterge | Nesne kadrajı terk etmez |
| `text_led` | 900×1400 safe zone | Sessiz metin kancası | UI kör bölgesine binme |
| `interview` | A/B cam | Kutup, rahatsız soru | Cevap 4 sn içinde |

---

# BÖLÜM 8: 6 Varlık Overlay

DB `creator_personas` satırı değildir.

| Overlay | Vibe | Tipik persona slug |
|---|---|---|
| Editorial Insider | Analitik bakış, net diksiyon | `luxury_editor` |
| Calm Expert Editor | Telaşsız mentor | `expert_guide`, `creator_teacher` |
| Relatable Confidant | 0.4m sırdaş | `relatable_lifestyle` |
| High-Status Minimalist | Az kelime, dik duruş | `luxury_editor`, `style_strategist` |
| Faceless Curator | Makro + b-roll | shoot format faceless |
| Busy Founder Creator | Veri, ROI, hızlı giriş | `founder_operator` |

---

# BÖLÜM 9: 2026 Eşikler, 32 Tüketici Şikayet Kümesi & 10 Anti-Desen

**Text-safe (1080×1920):** kör bölgeler üst 220px, sağ 140px, alt 480px. Yazı 900×1400 içinde.

**Audio:** konuşma −3…−6 dB; müzik duck −18…−24 dB; ASMR temas −1 dB.

**Eşikler (ikincil not):** TikTok ilk 200 gösterimde %70 tamamlama; Reels 30 günde 10+ özgün olmayan repost cezası; Shorts VVS / low-regret.

### 32 Tüketici Talep ve Şikayet Atlası (Faz 30)

| # | Küme | Kategori | Tüketici Şikayeti | Yaratıcı Yönetmenlik Kuralı |
|---|---|---|---|---|
| 1 | **Feed Control & Chronology** | CONTROL | Algoritmanın her şeye karar vermesinden yoruldum. | Önerilme hacmini gerçek ilgi sanma; sadık kitleye odaklan. |
| 2 | **Recommendation Persistence** | CONTROL | "İlgilenmiyorum" dediğim halde aynı içerikler geliyor. | Tekrarlayan maruziyeti gerçek talep sanma. |
| 3 | **Repetition & Homogenization** | QUALITY | Herkes aynı trendi ve aynı formatı kopyalıyor. | Vaadi tekrarla ama bilgiyi ve açıyı özgünleştir. |
| 4 | **Compulsive Infinite Scroll** | WELLBEING | Saatlerce kaydırıyorum ama aklımda hiçbir şey kalmıyor. | Yapay cliffhanger yerine doyurucu net bitiriş yap. |
| 5 | **Ad Load & Frequency** | MONETIZATION | Aşırı reklam ve sürekli sponsorlu içerik bıktırdı. | Sponsor entegrasyonunu doğal içerik akışına yedir. |
| 6 | **In-Content Sponsor Interruption** | MONETIZATION | Videonun ortasında 2 dakikalık alakasız reklam giriyor. | Sponsor süresini max 15s tut ve bölümlere ayır. |
| 7 | **Sponsor Authenticity** | TRUST | Üreticinin ürünü gerçekten kullanıp kullanmadığı belirsiz. | Sadece heyecan değil, dürüst kullanım kanıtı sun. |
| 8 | **AI Slop & Genericness** | TRUST | Ruhsuz, yapay zeka tarafından yazılmış hissi veriyor. | Jenerik prompt dili yerine insan sesi ve anti-voice sınırları koy. |
| 9 | **AI False Positives & Nuance** | TRUST | Yapay zekaya dokunan her şeye çöp muamelesi yapılıyor. | Yapay zekayı metin için değil, araştırma analitiği için kullan. |
| 10 | **Clickbait & Promise Mismatch** | QUALITY | Başlıkta vaat edilen şey videoda asla çıkmıyor. | Açılış kancasındaki vaadi 0:02'de kanıtla destekle. |
| 11 | **Filler & Time Waste** | UTILITY | 20 saniyelik bilgi için 10 dakika video izletiyorlar. | İlk 0.5s'de doğrudan konuya gir; selamlama ve laf kalabalığını at. |
| 12 | **Format Mismatch (Text vs Video)** | FORMAT | Okuyarak 5 saniyede alacağım şeyi videoya zorlamışlar. | Bilgi türüne göre doğru formatı seç (Format Utility Router). |
| 13 | **Searchability & Ctrl+F** | FORMAT | Videoda aradığım spesifik noktaya atlayamıyorum. | Referans gerektiren konularda karusel veya web rehberi sun. |
| 14 | **Sources & Verification** | TRUST | İddianın nereden geldiği, kaynağı belli değil. | Veri ve iddiaların birincil kaynaklarını görünür kıl. |
| 15 | **Correction Visibility** | TRUST | Yanlış bilgi verildiğinde düzeltme yoruma saklanıyor. | Hataları dürüstçe metin içinde veya yeni videoda düzelt. |
| 16 | **Freshness & Outdated Info** | UTILITY | Eski yöntemler güncelmiş gibi anlatılıyor. | Platform ve algoritma kurallarında tarih damgası kullan. |
| 17 | **Oversimplification** | QUALITY | Karmaşık konular sanki herkese uyarmış gibi genelleniyor. | Tavsiyenin kimler için geçerli *olmadığını* da açıkla. |
| 18 | **Trend Sameness** | QUALITY | Bütün Reels'lar aynı estetik ve aynı sesle yapılıyor. | Farklılaşmayı bakış açısından ve kanıttan üret. |
| 19 | **Substance & Depth** | QUALITY | Yüzeysel sosyal medya tavsiyelerinden sıkıldım. | Neden-sonuç mekanizmasını ve arka plan matematiğini göster. |
| 20 | **Comment Quality** | COMMUNITY | Yorumlar spam botlarıyla ve "bilgi" yazanlarla dolu. | İzleyiciyi ucuz DM botları yerine gerçek fikir tartışmasına yönelt. |
| 21 | **Toxicity & Harassment** | COMMUNITY | Yorumlarda toksik tartışmalar akıyor. | Yorum alanını kaliteli tartışma için yönet. |
| 22 | **Privacy & Creepy Targeting** | CONTROL | Beni dinliyorlarmış gibi aşırı kişiselleştirilmiş. | Samimi ve evrensel insani durumlara hitap et. |
| 23 | **Subscription Fatigue** | MONETIZATION | Her şey aylık abonelik istiyor. | Tek seferlik net değerli paketler sun (Classic Red / Signature Purple). |
| 24 | **Notification Overload** | MONETIZATION | Her gün bildirim yağmuru istemiyorum. | Kaliteli ve seyrek haftalık yayın takvimi benimse. |
| 25 | **Membership Churn** | MONETIZATION | İptal etmek zorlaştırılıyor. | Şeffaf ve net satın alma sınırları çiz. |
| 26 | **Multi-Source Validation** | COMMERCE | Videoyu görüp başka yerlerden teyit etmeden almıyorum. | Başka kaynaklarca da doğrulanabilir güvenilir bilgi ver. |
| 27 | **Tradeoffs & Negative Info** | TRUST | Herkes sadece övüyor, ürünün eksisini söyleyen yok. | Güven için ürünün veya yöntemin dezavantajlarını da belirt. |
| 28 | **Human Relationship** | RELATIONSHIP | Karşımda samimi ve tutarlı bir insan görmek istiyorum. | Tutarlı göz hizası ve insan sıcaklığı ile konuş. |
| 29 | **Qualified Relevance** | RELEVANCE | Milyonlara hitap eden değil, benim derdimi çözen içerik. | Geniş kitle viralliği yerine hedef kitlenin satın alma niyetine odaklan. |
| 30 | **Accessibility** | ACCESS | Altyazısız veya sessiz izlenemiyor. | Net altyazı ve yüksek kontrastlı tipografi kullan. |
| 31 | **Save / Share Utility** | UTILITY | Sonradan dönüp bakabileceğim pratik bilgi istiyorum. | Ekran görüntüsü alınabilir yoğun özet tabloları koy. |
| 32 | **Applicability (Who is this for?)** | UTILITY | Bu tavsiyenin benim durumuma uyup uymadığını anlamıyorum. | Brifingin başında hedef kitleyi ve kısıtları net belirt. |

---

### 10 Anti-Desen (Publish Reject Kriterleri)
1. **Clickbait–Payoff Uyuşmazlığı:** Açılışta vaat edilen sonucun videoda çıkmaması.
2. **Kanıtı Geciktirme:** Kanıtın 3. saniyeden sonraya ertelenmesi.
3. **Jenerik Kamera:** "Kamerayı aç ve konuş" gibi belirsiz yönlendirmeler.
4. **Tembel Vibe:** "Enerjik ol, gülümse" gibi yönetmenlikten uzak notlar.
5. **Konuşulan Formatta Diyalog Yokluğu:** Söylenecek kelimelerin verilmemesi.
6. **Uyumsuz Kanca / Lane Eşleşmesi:** B2B konusuna komedi şablonu bindirmek.
7. **Jenerik Why_It_Works:** Bilişsel tetikleyici veya platform sinyali içermeyen açıklamalar.
8. **Text-Safe Taşması:** Metnin Instagram UI simgeleri altına girmesi.
9. **Sahte Influencer Tonu:** "Bugün size harika bir şey anlatacağım" gibi boş girişler.
10. **Bilişsel Aşırı Yük:** 30 saniyeye 3'ten fazla iddia sığdırmaya çalışmak.

---

# BÖLÜM 10: 3-Kancalı A/B Protokolü & Vaka Otopsisi

Aynı kanıt gövdesinden üç açılış test edilir:
- **A (Ters Reçete / Bilişsel Çelişki):** Yerleşik inancı sarsan açılış (ACC Tetikleyici).
- **B (Merak Boşluğu / Sır):** Eksik bilgiyi tamamlama dürtüsü (Zeigarnik Etkisi).
- **C (Kanıt-Önce / Makro):** İlk karede fiziksel sonucu gösteren açılış (Ödül Tahmin Doğrulaması).

**Tek Değişken Kuralı:** Yalnızca ilk 3 saniye değişir; gövde, diyalog akışı ve payoff sabittir. Bu sayede hangi kancanın test kohortunu geçtiği matematiksel olarak izole edilir.

