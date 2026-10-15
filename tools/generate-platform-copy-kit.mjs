/**
 * tools/generate-platform-copy-kit.mjs
 * Generates copy-pasteable action cards for all 20 authority backlink platforms.
 * Can be run in terminal or outputs distribution/COPY_PASTE_DISTRIBUTION_KIT.md.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const snippetsPath = path.join(rootDir, "distribution", "social-snippets.json");
const matrixPath = path.join(rootDir, "distribution", "BACKLINK_EXECUTION_MATRIX.md");
const outputPath = path.join(rootDir, "distribution", "COPY_PASTE_DISTRIBUTION_KIT.md");

if (!fs.existsSync(snippetsPath)) {
  console.error("❌ Missing distribution/social-snippets.json");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(snippetsPath, "utf8"));
const { brand, platforms } = data;

// 20 Platforms full specification with Tiers, DAs, and exact copy cards
const fullPlatformCards = [
  // TIER 1
  {
    id: 1,
    tier: 1,
    tierName: "Kademe 1: Temel Otorite & Profil Backlinkleri (En Yüksek Öncelik)",
    name: "GitHub",
    da: "DA 96",
    dofollow: "Yes (Markdown links)",
    signupUrl: "https://github.com/signup",
    username: "anomalybox",
    profileName: "Anomaly Box",
    website: "https://anomalybox.com/tools",
    bio: "Private Creative Direction & Shoot Briefs for Instagram Creators. Eliminating on-set decision fatigue.",
    actionTitle: "Özel Profil README Reposu Açma",
    actionInstructions: "1. GitHub'da `anomalybox/anomalybox` adında yeni bir public repo açın.\n2. `distribution/github-profile/README.md` dosyasının içeriğini repo ana README.md olarak kaydedin.\n3. Profilinizde `anomalybox.com/tools` ve `/store` rotaları öne çıksın.",
    copyText: fs.readFileSync(path.join(rootDir, "distribution", "github-profile", "README.md"), "utf8"),
  },
  {
    id: 2,
    tier: 1,
    tierName: "Kademe 1: Temel Otorite & Profil Backlinkleri (En Yüksek Öncelik)",
    name: "Medium",
    da: "DA 95",
    dofollow: "Canonical + Nofollow",
    signupUrl: "https://medium.com/m/signin",
    username: "anomalybox",
    profileName: "Anomaly Box",
    website: "https://anomalybox.com",
    bio: "Private creative direction platform delivering campaign-ready shoot briefs to Creator Vault.",
    actionTitle: "Canonical Makale Yayınlama",
    actionInstructions: "1. Medium'da 'Write a story' butonuna tıklayın.\n2. `distribution/medium/01-hook-retention-framework.md` içeriğini yapıştırın.\n3. Story Settings > Advanced Settings > 'This story was originally published elsewhere' seçeneğini işaretleyip canonical link olarak `https://anomalybox.com/resources/first-3-seconds-hook-retention-framework` girin.",
    copyText: fs.readFileSync(path.join(rootDir, "distribution", "medium", "01-hook-retention-framework.md"), "utf8"),
  },
  {
    id: 3,
    tier: 1,
    tierName: "Kademe 1: Temel Otorite & Profil Backlinkleri (En Yüksek Öncelik)",
    name: "LinkedIn",
    da: "DA 98",
    dofollow: "Nofollow (High Brand Signal)",
    signupUrl: "https://www.linkedin.com/company/setup/new/",
    username: "company/anomalybox",
    profileName: "Anomaly Box",
    website: "https://anomalybox.com",
    bio: "Anomaly Box provides private creative direction and campaign-ready shoot briefs for Instagram creators, brands, and agencies.",
    actionTitle: "Şirket Sayfası ve Buton Kurulumu",
    actionInstructions: "1. LinkedIn Şirket Sayfası oluşturun.\n2. Web Sitesi alanına `https://anomalybox.com` girin.\n3. Özel Buton (Custom Button) olarak 'Visit website' seçip `https://anomalybox.com/store` ekleyin.",
    copyText: brand.full_bio,
  },
  {
    id: 4,
    tier: 1,
    tierName: "Kademe 1: Temel Otorite & Profil Backlinkleri (En Yüksek Öncelik)",
    name: "About.me",
    da: "DA 93",
    dofollow: "Yes (Profile Link)",
    signupUrl: "https://about.me/signup",
    username: "anomalybox",
    profileName: "Anomaly Box",
    website: "https://anomalybox.com",
    bio: "Private creative direction platform delivering locked Instagram shoot briefs directly to your digital vault.",
    actionTitle: "Landing Sayfası ve Spotlight Butonu",
    actionInstructions: "1. about.me/anomalybox profilini açın.\n2. Headline: 'Creative Direction & Shoot Briefs for Instagram Creators'\n3. Spotlight Button: 'Explore Creative Dossiers' -> `https://anomalybox.com/store`",
    copyText: `${brand.tagline}\n\n${brand.short_bio}\n\nExplore Dossiers: https://anomalybox.com/store`,
  },
  {
    id: 5,
    tier: 1,
    tierName: "Kademe 1: Temel Otorite & Profil Backlinkleri (En Yüksek Öncelik)",
    name: "Product Hunt",
    da: "DA 91",
    dofollow: "Dofollow Maker Profile",
    signupUrl: "https://www.producthunt.com",
    username: "anomalybox",
    profileName: "Anomaly Box",
    website: "https://anomalybox.com",
    bio: "Private Instagram shoot briefs with scene flow, spoken lines, camera angles, and edit notes.",
    actionTitle: "Maker Profili & Upcoming Ürün Sayfası",
    actionInstructions: "1. Profil bio'suna web sitesini ekleyin.\n2. 'My Products' veya 'Upcoming Product' olarak Anomaly Box'ı ekleyip web sitesi olarak `https://anomalybox.com` kaydedin.",
    copyText: `Tagline: ${brand.tagline}\nWebsite: https://anomalybox.com\nDescription: ${brand.full_bio}`,
  },
  {
    id: 6,
    tier: 1,
    tierName: "Kademe 1: Temel Otorite & Profil Backlinkleri (En Yüksek Öncelik)",
    name: "Wellfound (AngelList)",
    da: "DA 91",
    dofollow: "Yes (Company Profile)",
    signupUrl: "https://wellfound.com",
    username: "anomalybox",
    profileName: "Anomaly Box",
    website: "https://anomalybox.com",
    bio: "Creator economy creative direction platform replacing generic AI prompts with locked, campaign-ready shoot briefs.",
    actionTitle: "Girişim Profili Oluşturma",
    actionInstructions: "1. Startup sayfası oluşturun.\n2. Company Website: `https://anomalybox.com`\n3. Sektör: Creator Economy, Media, Social Media, MarTech.",
    copyText: brand.full_bio,
  },
  {
    id: 7,
    tier: 1,
    tierName: "Kademe 1: Temel Otorite & Profil Backlinkleri (En Yüksek Öncelik)",
    name: "Gravatar",
    da: "DA 94",
    dofollow: "Dofollow Verified Links",
    signupUrl: "https://gravatar.com",
    username: "anomalybox",
    profileName: "Anomaly Box",
    website: "https://anomalybox.com",
    bio: "Private creative direction and campaign-ready shoot briefs for Instagram creators.",
    actionTitle: "Web Siteleri Bölümüne Link Ekleme",
    actionInstructions: "1. Gravatar hesabınıza giriş yapın.\n2. 'Verified Websites' bölümüne `https://anomalybox.com` ve `https://anomalybox.com/pricing` adreslerini ekleyin.",
    copyText: `Website: https://anomalybox.com\nPricing & Dossiers: https://anomalybox.com/pricing`,
  },

  // TIER 2: DESIGN & VISUAL
  {
    id: 8,
    tier: 2,
    tierName: "Kademe 2: Görsel, Tasarım & Portfolyo Ağı",
    name: "Pinterest",
    da: "DA 94",
    dofollow: "Claimed Website + Pins",
    signupUrl: "https://www.pinterest.com",
    username: "anomalybox",
    profileName: "Anomaly Box",
    website: "https://anomalybox.com/pricing",
    bio: "Private Instagram shoot briefs with scene flow, spoken lines, and camera notes. Built for creators who refuse generic AI slop.",
    actionTitle: "İşletme Hesabı & Pano Oluşturma",
    actionInstructions: "1. 'Instagram Shoot Briefs' adında pano açın.\n2. Sitedeki dossier ve infografik görsellerini pinleyin.\n3. Hedef link olarak `https://anomalybox.com/pricing` ve `https://anomalybox.com/resources` ekleyin.",
    copyText: `Board Name: Instagram Shoot Briefs & Creator Direction\nDestination: https://anomalybox.com/pricing\nDescription: Explore locked shoot briefs, opening hook options, and camera framing notes for high-retention Instagram Reels.`,
  },
  {
    id: 9,
    tier: 2,
    tierName: "Kademe 2: Görsel, Tasarım & Portfolyo Ağı",
    name: "Behance",
    da: "DA 93",
    dofollow: "Dofollow Portfolio Links",
    signupUrl: "https://www.behance.net",
    username: "anomalybox",
    profileName: "Anomaly Box Studio",
    website: "https://anomalybox.com",
    bio: "Creative direction system & physical/digital dossier design for high-ticket content creators.",
    actionTitle: "Tasarım Projesi Paylaşımı",
    actionInstructions: "1. 'Create a Project' butonuna tıklayın.\n2. Başlık: 'Anomaly Box — Creative Direction Dossier UI & System'\n3. Classic Red ve Signature Purple kart arayüzü ekran görüntülerini ekleyin.\n4. Proje açıklamasına `https://anomalybox.com` ve `/pricing` linklerini gömün.",
    copyText: `Project Title: Anomaly Box — Creative Direction Dossier UI & System\nLive System: https://anomalybox.com\nPricing & Vault: https://anomalybox.com/pricing\n\nAbout the project:\nAnomaly Box replaces chaotic AI prompt generation with locked, physical-style creative dossiers delivered directly to a secure Creator Vault.`,
  },
  {
    id: 10,
    tier: 2,
    tierName: "Kademe 2: Görsel, Tasarım & Portfolyo Ağı",
    name: "Dribbble",
    da: "DA 92",
    dofollow: "Dofollow Profile & Shot Links",
    signupUrl: "https://dribbble.com/signup/new",
    username: "anomalybox",
    profileName: "Anomaly Box",
    website: "https://anomalybox.com",
    bio: "UI & Design System for private creator shoot briefs and interactive teleprompter mode.",
    actionTitle: "Shot Yükleme",
    actionInstructions: "1. 'Creator Vault & Shoot Mode UI' başlıklı bir shot yükleyin.\n2. Açıklamaya `https://anomalybox.com` linkini ekleyin.",
    copyText: `Title: Creator Vault & Shoot Mode UI — Anomaly Box\nLink: https://anomalybox.com\nTags: ui, ux, webdesign, dashboard, creator, darkmode`,
  },
  {
    id: 11,
    tier: 2,
    tierName: "Kademe 2: Görsel, Tasarım & Portfolyo Ağı",
    name: "Flickr",
    da: "DA 93",
    dofollow: "Yes (Photo Descriptions)",
    signupUrl: "https://identity.flickr.com/sign-up",
    username: "anomalybox",
    profileName: "Anomaly Box Studio",
    website: "https://anomalybox.com",
    bio: "Visual design assets and dossier photography from Anomaly Box creative direction studio.",
    actionTitle: "Fotoğraf Albümü Oluşturma",
    actionInstructions: "1. Dossier ve stüdyo mockuplarını yükleyin.\n2. Her fotoğrafın açıklamasına `Visit: https://anomalybox.com` ekleyin.",
    copyText: `Photo Title: Anomaly Box Creative Direction Dossier\nDescription: Private campaign-ready shoot briefs for Instagram creators. Learn more at https://anomalybox.com`,
  },
  {
    id: 12,
    tier: 2,
    tierName: "Kademe 2: Görsel, Tasarım & Portfolyo Ağı",
    name: "Tumblr",
    da: "DA 90",
    dofollow: "Dofollow Custom Links",
    signupUrl: "https://www.tumblr.com/register",
    username: "anomalybox",
    profileName: "Anomaly Box",
    website: "https://anomalybox.com/resources",
    bio: "Daily video shoot frameworks, hook retention breakdowns, and creative direction notes from Anomaly Box.",
    actionTitle: "Taktik Alıntı Gönderisi",
    actionInstructions: "1. Link veya Quote gönderisi oluşturun.\n2. `/resources/first-3-seconds-hook-retention-framework` makalesinden bir alıntı paylaşıp kaynak olarak linkleyin.",
    copyText: `Quote: "Viewers decide whether to stay in 1.5 seconds. If you waste the opening on greeting breaths, your retention collapses."\n\nSource: https://anomalybox.com/resources/first-3-seconds-hook-retention-framework\nPlatform: https://anomalybox.com`,
  },

  // TIER 3: DOCUMENTS
  {
    id: 13,
    tier: 3,
    tierName: "Kademe 3: Doküman & PDF Paylaşımı",
    name: "SlideShare",
    da: "DA 95",
    dofollow: "High Google PDF Indexing",
    signupUrl: "https://www.slideshare.net/signup",
    username: "anomalybox",
    profileName: "Anomaly Box",
    website: "https://anomalybox.com",
    bio: "Creative direction frameworks, hook retention audits, and short-form video systems.",
    actionTitle: "Hazır Sunum PDF'ini Yükleme",
    actionInstructions: "1. 'Upload' butonuna tıklayın.\n2. Projede oluşturulan `distribution/slideshare/Anomaly-Box-Creative-Direction-Deck.pdf` dosyasını seçin.\n3. Başlık: 'The 2026 Creative Direction Framework for High-Retention Video'\n4. Açıklamaya `https://anomalybox.com` ve `https://anomalybox.com/tools` ekleyin.",
    copyText: `Title: The 2026 Creative Direction Framework for High-Retention Video\nDescription: An executive briefing on eliminating on-set decision fatigue and structuring campaign-ready Instagram shoot briefs.\n\nVisit official platform: https://anomalybox.com\nFree Creator Tools: https://anomalybox.com/tools\nFull Resources: https://anomalybox.com/resources`,
  },
  {
    id: 14,
    tier: 3,
    tierName: "Kademe 3: Doküman & PDF Paylaşımı",
    name: "Issuu",
    da: "DA 94",
    dofollow: "Indexed Document Reader",
    signupUrl: "https://issuu.com/signup",
    username: "anomalybox",
    profileName: "Anomaly Box",
    website: "https://anomalybox.com/pricing",
    bio: "Private creative direction dossiers and shoot briefs catalogue for digital creators.",
    actionTitle: "Dijital Katalog Olarak Yayınlama",
    actionInstructions: "1. `distribution/slideshare/Anomaly-Box-Creative-Direction-Deck.pdf` dosyasını Issuu'ya yükleyin.\n2. Başlık: 'Anomaly Box — Creative Direction Dossiers Sample'\n3. Web sitesi: `https://anomalybox.com/pricing`",
    copyText: `Title: Anomaly Box — Creative Direction Dossiers Sample & Brief Architecture\nPublication Link: https://anomalybox.com/pricing\nOfficial Site: https://anomalybox.com`,
  },

  // TIER 4: RSS & COMMUNITY
  {
    id: 15,
    tier: 4,
    tierName: "Kademe 4: RSS, Kürasyon & Topluluk",
    name: "Flipboard",
    da: "DA 91",
    dofollow: "Automated Article Ingestion",
    signupUrl: "https://flipboard.com",
    username: "anomalybox",
    profileName: "Anomaly Box",
    website: "https://anomalybox.com/feed.xml",
    bio: "Daily editorial insights, video retention tactics, and creative briefs for Instagram creators.",
    actionTitle: "RSS Beslemesi Bağlama (168+ Makale Otomatik İndekslenir)",
    actionInstructions: "1. Flipboard'da profilinize gidip 'New Magazine' oluşturun.\n2. Magazin adı: 'Creator Direction Daily'\n3. 'Add from RSS' seçeneğine `https://anomalybox.com/feed.xml` linkinizi yapıştırın.\n4. Sistem tüm sitedeki makaleleri otomatik Flipboard kartlarına ve backlinklere çevirir.",
    copyText: `Magazine Name: Creator Direction Daily\nRSS URL: https://anomalybox.com/feed.xml\nWebsite: https://anomalybox.com`,
  },
  {
    id: 16,
    tier: 4,
    tierName: "Kademe 4: RSS, Kürasyon & Topluluk",
    name: "Reddit",
    da: "DA 91",
    dofollow: "Profile Link + Organic Karma",
    signupUrl: "https://www.reddit.com/register/",
    username: "u/anomalybox",
    profileName: "Anomaly Box",
    website: "https://anomalybox.com",
    bio: "Private creative direction platform delivering locked Instagram shoot briefs. No prompt slop.",
    actionTitle: "Profil Kurulumu & Topluluk Katkısı",
    actionInstructions: "1. Profil 'Social Links' alanına `https://anomalybox.com` ekleyin.\n2. `r/Instagrammarketing` veya `r/ContentCreation` alt dizinlerinde kanca ve senaryo sorularına değer sunan yanıtlar verin.",
    copyText: `Reddit Bio: Private creative direction platform delivering locked Instagram shoot briefs to Creator Vault.\nLink: https://anomalybox.com`,
  },
  {
    id: 17,
    tier: 4,
    tierName: "Kademe 4: RSS, Kürasyon & Topluluk",
    name: "Quora",
    da: "DA 93",
    dofollow: "Profile Bio Link + High Search Volume",
    signupUrl: "https://www.quora.com",
    username: "anomalybox",
    profileName: "Anomaly Box",
    website: "https://anomalybox.com",
    bio: "Creative Direction & Video Retention Systems for Short-Form Creators at Anomaly Box.",
    actionTitle: "Uzman Profili ve Soru Yanıtı",
    actionInstructions: "1. Profile bio'suna web sitesini ekleyin.\n2. 'How to hook viewers in first 3 seconds of Instagram Reels' sorusuna yanıt yazıp [`distribution/medium/01-hook-retention-framework.md`](file:///c:/Users/Kagan/OneDrive/Desktop/ViralBox/distribution/medium/01-hook-retention-framework.md) içindeki 3 kuralı özetleyin, kaynak olarak `https://anomalybox.com/resources` ekleyin.",
    copyText: `Credentials: Creative Director at Anomaly Box (https://anomalybox.com)\nBio: Helping Instagram creators and agencies structure high-retention shoot briefs.`,
  },
  {
    id: 18,
    tier: 4,
    tierName: "Kademe 4: RSS, Kürasyon & Topluluk",
    name: "Scoop.it",
    da: "DA 92",
    dofollow: "Curated Web Pages",
    signupUrl: "https://www.scoop.it/signup",
    username: "anomalybox",
    profileName: "Anomaly Box",
    website: "https://anomalybox.com/resources",
    bio: "Curated creative direction systems, hook formulas, and creator economy insights.",
    actionTitle: "Topic Oluşturup Makaleleri Scoop Etme",
    actionInstructions: "1. 'Video Directing Systems' adında yeni bir topic açın.\n2. `https://anomalybox.com/resources/first-3-seconds-hook-retention-framework` linkini girip scoop edin.",
    copyText: `Topic Name: Video Directing Systems & Creator Frameworks\nFirst Scoop URL: https://anomalybox.com/resources/first-3-seconds-hook-retention-framework`,
  },
  {
    id: 19,
    tier: 4,
    tierName: "Kademe 4: RSS, Kürasyon & Topluluk",
    name: "Pearltrees",
    da: "DA 87",
    dofollow: "Interactive Web Collections",
    signupUrl: "https://www.pearltrees.com",
    username: "anomalybox",
    profileName: "Anomaly Box",
    website: "https://anomalybox.com",
    bio: "Curated collection of creative direction tools, brief scorecards, and creator resources.",
    actionTitle: "Koleksiyon Ağacı Oluşturma",
    actionInstructions: "1. 'Anomaly Box Creator Tools' adında bir pearltree açın.\n2. İçine `https://anomalybox.com/tools`, `https://anomalybox.com/pricing` ve `https://anomalybox.com/resources` linklerini pearl olarak ekleyin.",
    copyText: `Collection: Anomaly Box Creator Tools & Systems\nURLs to add:\n- https://anomalybox.com\n- https://anomalybox.com/tools\n- https://anomalybox.com/pricing\n- https://anomalybox.com/resources`,
  },
  {
    id: 20,
    tier: 4,
    tierName: "Kademe 4: RSS, Kürasyon & Topluluk",
    name: "Diigo",
    da: "DA 90",
    dofollow: "Public Bookmarks",
    signupUrl: "https://www.diigo.com/sign-up",
    username: "anomalybox",
    profileName: "Anomaly Box",
    website: "https://anomalybox.com",
    bio: "Social bookmarks for creator direction, Instagram Reels frameworks, and shoot briefs.",
    actionTitle: "Public Bookmark Olarak Kaydetme",
    actionInstructions: "1. Diigo'da `+` butonuna tıklayın.\n2. URL: `https://anomalybox.com`\n3. Title: 'Anomaly Box — Private Creative Direction & Briefs for Instagram Creators'\n4. Tags: `instagram, contentcreator, creativedirection, videoediting, reels`",
    copyText: `URL: https://anomalybox.com\nTitle: Anomaly Box — Private Creative Direction & Briefs for Instagram Creators\nDescription: ${brand.short_bio}\nTags: instagram, creativedirection, reels, videoproduction, contentstrategy`,
  },
];

// Generate unified Markdown Guide
let md = `# Anomaly Box — 20 Platform Kopyala-Yapıştır Backlink İcra Kiti\n\n`;
md += `> Bu doküman, **Anomaly Box** (\`https://anomalybox.com\`) alan adının Google otoritesini ve indekslenme hızını zirveye çıkarmak için 20 platformda hesap açarken ve içerik girerken kullanacağınız **birebir hazır metinleri ve aksiyon adımlarını** içerir.\n\n`;
md += `--- \n\n`;

fullPlatformCards.forEach((p) => {
  md += `## #${p.id} — ${p.name} (${p.da})\n\n`;
  md += `- **Kademe:** ${p.tierName}\n`;
  md += `- **Backlink Tipi:** ${p.dofollow}\n`;
  md += `- **Kayıt / Giriş Linki:** [${p.signupUrl}](${p.signupUrl})\n`;
  md += `- **Kullanıcı Adı:** \`${p.username}\`\n`;
  md += `- **Profil İsmi:** \`${p.profileName}\`\n`;
  md += `- **Web Sitesi Alanına Girilecek URL:** \`${p.website}\`\n\n`;

  md += `### 📋 Profil Bio / Açıklama (Kopyala-Yapıştır):\n`;
  md += `\`\`\`text\n${p.bio}\n\`\`\`\n\n`;

  md += `### ⚡ İlk Aksiyon Adımı:\n`;
  md += `**${p.actionTitle}**\n\n`;
  md += `${p.actionInstructions}\n\n`;

  if (p.id === 13 || p.id === 14) {
    md += `> [!TIP]\n`;
    md += `> Sunum PDF Dosyası Projede Hazırdır: \`distribution/slideshare/Anomaly-Box-Creative-Direction-Deck.pdf\` (Doğrudan bu dosyayı yükleyin).\n\n`;
  }

  md += `--- \n\n`;
});

fs.writeFileSync(outputPath, md, "utf8");
console.log(`✅ Success! Generated complete copy-paste kit for all 20 platforms at:\n   ${outputPath}`);
