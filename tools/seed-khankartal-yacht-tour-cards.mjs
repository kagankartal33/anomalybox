import { spawnSync } from "node:child_process";

const email = "khankartal@gmail.com";
const batchId = "custom_yacht_tour_tr_20260713_khankartal";

const cards = [
  {
    title: "İlk Bakışta Güven Turu",
    concept: "Tekne turunu ilk üç saniyede güven, rota ve atmosferle konumlandıran Reels.",
    premise: "Yat ya da tekne turu tanıtımı, izleyicinin önce güveni sonra manzarayı görmesiyle daha premium hissedilir.",
    ranges: [
      ["0-3s", "attention", "Marina girişinden tekneye doğru yürüyüşü tek net hareketle aç.", "Telefonu göğüs hizasında sabit tut; teknenin adı ve temiz güverte kadraja girsin.", "Bu turda önce güveni, sonra manzarayı gösteriyoruz.", "Bugünkü rota: güven + manzara", "İlk karede kalabalık ya da dağınık alan gösterme; tekneye güvenli geçişi göster.", "Hard cut ile tekne detayına geç; ilk overlay 1 saniye içinde gelsin."],
      ["4-10s", "trust", "Kaptan, can yeleği, temiz oturma alanı ve gölgeli bölgeyi hızlı seri halinde göster.", "Her detayı 1 saniyeden kısa tut, el titremesini azalt.", "Aile, çift ya da arkadaş grubu gelmeden önce bakacağım üç şey bunlar.", "Kaptan / güvenlik / konfor", "Kaptanı kameraya kısa selamlat; sahici ve sakin kalsın.", "Üç kısa kesim kullan; her kesimde tek kanıt göster."],
      ["11-20s", "desire", "Denize açılış anını, köpük izini ve oturma alanından manzarayı sırala.", "Geniş açıdan başlayıp oturan misafir perspektifine geç.", "Asıl vaat sadece deniz değil; rahatça yerleşip günü akışına bırakmak.", "Tur hissi burada başlıyor", "Bir koltuk, bir içecek, bir manzara detayı seç.", "Müziği burada hafif yükselt; voiceover altında kalsın."],
      ["21-31s", "proof", "Rotanın bir noktasını harita/ekran görüntüsü yerine gerçek kıyı detayıyla kanıtla.", "Kıyı çizgisini 2 saniye tut, sonra güvertedeki hazırlığa dön.", "Rota anlatımı soyut kalmasın; şu kıyı geçişi turun ritmini gösteriyor.", "Rota kanıtı", "Yerel bir detay söyle: koy, kıyı, gün batımı saati veya yüzme molası.", "Rota kanıtından rezervasyon çağrısına temiz geçiş yap."],
      ["32-42s", "cta", "Son karede tekneyi dışarıdan sakin bir açıyla göster ve rezervasyon sorusunu bırak.", "Kamera sabit; tekne kadrajda tam ve okunaklı olsun.", "Bu turu hangi saat için düşünürdünüz: sabah serinliği mi, gün batımı mı?", "Sabah mı gün batımı mı?", "Soruyu seçimli sor; yorum yazması kolay olsun.", "Son 2 saniyeyi durdurulabilir CTA karesi yap."],
    ],
    captions: [
      "Tekne turu seçerken önce güvene, sonra manzaraya bakarım. Bu rota tam o denge için.",
      "Sabah sakinliği mi, gün batımı ışığı mı? Bu tekne turunda seçim zor.",
      "Rezervasyon yapmadan önce görmek isteyeceğiniz üç şey: kaptan, konfor, rota."
    ],
    comments: "Sizce tekne turu için en iyi saat sabah mı gün batımı mı?",
  },
  {
    title: "Gün Batımı Rezervasyon Açısı",
    concept: "Gün batımı turunu sadece güzel görüntü değil, rezervasyon kararı olarak anlatan Reels.",
    premise: "İzleyici gün batımını zaten sever; kartın amacı hangi deneyimi satın aldığını netleştirmek.",
    ranges: [
      ["0-2s", "attention", "Güneşin suya vurduğu en güçlü 1 saniyelik görüntüyle aç.", "Objeyi değil ışığı takip et; ufuk çizgisi düz kalsın.", "Bu sadece gün batımı değil, doğru saat seçimi.", "Gün batımı turu böyle seçilir", "İlk karede aşırı zoom yapma; sakin ve net başla.", "Açılışı tek güçlü görüntüyle bırak, hemen bilgiye geç."],
      ["3-9s", "choice", "Sabah turu ve gün batımı turu arasındaki farkı iki görsel karşılaştırmayla anlat.", "Ekranı iki bölme gibi düşün: sakin deniz / sıcak ışık.", "Sabah daha serin, gün batımı daha sinematik. Beklenti buna göre seçilmeli.", "Sabah sakin / akşam sinematik", "Taraf tut ama abartma; doğru kişi doğru saati seçsin.", "İki kontrast kesimi hızlı tut; overlay sade olsun."],
      ["10-19s", "experience", "Güvertedeki oturma, içecek servisi ve fotoğraf köşesini göster.", "Yakın detay, sonra geniş plan; premium ama gerçek kalsın.", "Bu saat, fotoğraf almak ve sakin oturmak isteyenler için daha güçlü.", "Fotoğraf + sakinlik", "Misafir yoksa boş koltuğu ve ışığı kullan.", "Servis detayını 1.5 saniyeyi geçirme."],
      ["20-30s", "route", "Turun dönüş yolundaki ışık değişimini göster.", "Kamerayı teknenin arkasından su izine sabitle.", "Dönüş yolunda ışık yumuşuyor; videonun en paylaşılır anı burada çıkıyor.", "Dönüş ışığı", "Bir cümleyle rota güveni ver, saat garantisi verme.", "Müzikte küçük yükseliş, sonra final sessizliği."],
      ["31-40s", "cta", "Rezervasyon için iki seçenekli yorum CTA’sı ver.", "Yüzünü kameraya dön; arka planda deniz kalsın.", "Yorumlara sabah mı gün batımı mı yazın; size uygun tur saatini birlikte seçelim.", "Yorum: sabah / gün batımı", "Satış baskısı kurma, seçim yardımı öner.", "CTA karesini okunaklı tut ve videoyu orada bitir."],
    ],
    captions: [
      "Gün batımı turu isteyenler için karar noktası: daha sinematik ışık, daha sakin akış.",
      "Tekne turunda saat seçimi deneyimin yarısıdır. Sabah mı, gün batımı mı?",
      "Bu rota gün batımı ışığını sevenler için daha yumuşak, daha fotojenik bir akış veriyor."
    ],
    comments: "Sizin tercihiniz: sabah turu mu gün batımı turu mu?",
  },
  {
    title: "Aile İçin Rahat Tekne Turu",
    concept: "Aile ve küçük grup müşterilerine konfor, güven ve pratik detayları gösteren Reels.",
    premise: "Aile müşterisi önce pratik rahatlığı görürse tur daha güvenilir ve satın alınabilir hale gelir.",
    ranges: [
      ["0-3s", "attention", "Çocuklu/aileli misafirlerin merak edeceği oturma ve gölge alanını açılışta göster.", "Geniş planla alanı anlaşılır kıl; hızlı pan yapma.", "Aileyle tekne turunda ilk baktığım yer burası.", "Aile turu için ilk kontrol", "Gölge, oturma ve geçiş alanı aynı karede olsun.", "Açılışta bilgi ver, manzarayı sonra büyüt."],
      ["4-12s", "comfort", "Giriş basamağı, tutunma alanı, oturma düzeni ve çanta koyma yerini sırala.", "Detayları el işaretiyle göster ama kamerayı sabit tut.", "Rahat tur, küçük detayların doğru yerde olmasıyla başlıyor.", "Geçiş / oturma / gölge", "Abartılı güvenlik iddiası yerine görünen pratik kanıt kullan.", "Her detayı ayrı kes; uzun açıklama yapma."],
      ["13-22s", "experience", "Ailenin birlikte oturabileceği manzara açısını ve yüzme molası hazırlığını göster.", "Kamera oturan kişinin göz hizasına insin.", "Manzara güzel, ama asıl fark herkesin rahatça yerleşebilmesi.", "Herkes için rahat alan", "Bir havlu, su, gölge veya minder detayı ekle.", "Sıcak ve sakin müzik kullan; tempoyu düşürme."],
      ["23-33s", "proof", "Rotada kalabalıktan uzak daha sakin bir anı göster.", "Tekneyi ve çevreyi aynı planda tut.", "Kalabalıktan uzak bir mola, aile turunu daha keyifli yapıyor.", "Sakin mola", "Kalabalık karşılaştırması yaparken başka işletmeyi kötüleme.", "Kesimi rota detayıyla bağla."],
      ["34-45s", "cta", "Finalde aile, çift veya arkadaş grubu seçenekleriyle yorum çağrısı yap.", "Kamera yüzüne dönsün, tekne arka planda güven versin.", "Kaç kişilik geleceğinizi yazın; size en rahat saat ve düzeni önerelim.", "Kaç kişilik grup?", "Net soru sor; DM yerine yorumdan başlat.", "Final overlay’i en az 2 saniye görünür kalsın."],
    ],
    captions: [
      "Aileyle tekne turu seçerken manzara kadar oturma, gölge ve geçiş alanı da önemli.",
      "Bu tur, küçük grup ve aileler için rahat akışı öne çıkarıyor.",
      "Kaç kişilik geleceğinizi yazın; en rahat saat ve oturma düzenini birlikte seçelim."
    ],
    comments: "Tekne turuna aileyle mi, çift olarak mı, arkadaş grubuyla mı gelirdiniz?",
  },
  {
    title: "Lüks Detay Yakın Planı",
    concept: "Yat/tekne deneyimini premium hissettiren küçük detaylarla tanıtan Reels.",
    premise: "Premium algı büyük vaatlerden değil, temiz yüzeyler, servis detayı ve sakin kadrajlardan gelir.",
    ranges: [
      ["0-2s", "attention", "Parlayan deniz, temiz minder ve tekne logosu/isim detayını hızlı üçlü aç.", "Makro yakın planla başla; ışık patlamasın.", "Lüks hissi bazen büyük planda değil, bu küçük detaylarda belli olur.", "Detaydan lüks okunur", "Marka adı görünürse doğal kalsın, reklam gibi sallama.", "Üç mikro kesimle ritim kur."],
      ["3-11s", "texture", "Minder, masa, içecek, ip ve güverte dokusunu temiz yakın planlarla göster.", "Her detay için 0.7-1 saniye; aynı açı tekrarlanmasın.", "Temiz güverte, rahat oturma, sade servis: tur başlamadan karar verdiren sinyaller.", "Temiz / rahat / sade", "Detayları tek tek say, ama iddialı kalite garantisi verme.", "Overlay kısa olsun; görüntü nefes alsın."],
      ["12-22s", "atmosphere", "Geniş plana çıkıp detayların gerçek atmosferde nasıl durduğunu göster.", "Yakından genişe geç; tekne ve deniz aynı anda görünsün.", "Bu yüzden sadece tekneyi değil, içeride nasıl hissedildiğini gösteriyorum.", "Atmosfer kanıtı", "Bir insan eli veya hareket ekle, sahne boş showroom gibi kalmasın.", "Yakın plandan geniş plana match cut kullan."],
      ["23-33s", "trust", "Kaptan hazırlığı veya rota kontrolü gibi profesyonel bir anı göster.", "Ekran, dümen veya rota bakışı kısa ve okunaklı olsun.", "Premium deneyim, sakin hazırlıkla başlar.", "Hazırlık güven verir", "Teknik detayları abartma; sadece görünen hazırlığı anlat.", "Müziği burada azalt, ses efektini net bırak."],
      ["34-42s", "cta", "Finalde 'hangi detay sizi ikna eder?' sorusuyla bitir.", "Yüz/kamera ya da tekne dış planı; sade ve net.", "Yorumlara yazın: sizi en çok hangi detay ikna ederdi?", "Hangi detay?", "Soru tek olsun; üç farklı CTA verme.", "Finali dondurulabilir temiz kareyle bitir."],
    ],
    captions: [
      "Premium tekne turu algısı küçük detaylarda başlar: temiz güverte, rahat oturma, sakin servis.",
      "Bir yat turunu seçtirten şey bazen manzara değil, detayların verdiği güven hissidir.",
      "Hangi detay sizi rezervasyona daha çok yaklaştırırdı?"
    ],
    comments: "Sizi en çok hangi detay ikna eder: güverte, servis, rota mı?",
  },
  {
    title: "Rota Öncesi Mini Karar",
    concept: "İzleyiciyi rota seçimine dahil ederek yorum ve DM isteği oluşturan Reels.",
    premise: "İki rota seçeneği izleyiciyi pasif izleyiciden karar veren kişiye dönüştürür.",
    ranges: [
      ["0-3s", "attention", "İki rota seçeneğini aynı anda sözlü ve görsel olarak aç.", "Bir elde telefon/rota notu, arkada tekne görünsün.", "Bugün bu tekne için iki rota var; hangisi daha iyi içerik çıkarır?", "Rota A mı B mi?", "Harita detayını karmaşık gösterme; karar basit kalsın.", "İlk saniyede A/B overlay kullan."],
      ["4-12s", "route_a", "Rota A’nın en güçlü görselini göster: koy, kıyı veya yüzme molası.", "Geniş plan, sonra 1 yakın detay.", "A rotası daha sakin ve yüzme molası güçlü.", "A: sakin mola", "A rotasını tek faydaya indir.", "A kısmını 4 saniyeden uzun tutma."],
      ["13-21s", "route_b", "Rota B’nin en güçlü görselini göster: gün batımı, şehir silüeti veya fotoğraf açısı.", "Işık ve arka planı önceliklendir.", "B rotası daha fotojenik ve dönüş ışığı daha güçlü.", "B: fotoğraf ışığı", "B için de tek fayda söyle; karmaşık liste yapma.", "A ile aynı ritimde kes."],
      ["22-32s", "decision", "Teknede iki rota için hazırlık farkını göster.", "Masa, çanta, havlu, içecek gibi küçük hazırlık detayları.", "Seçim aslında şu: daha sakin mola mı, daha sinematik fotoğraf mı?", "Sakin mola / sinematik ışık", "İzleyiciye kendi ihtiyacını seçtir.", "Overlay’i iki seçenekli tut."],
      ["33-42s", "cta", "Yorum oylaması ve rezervasyon yönlendirmesiyle bitir.", "Kameraya bak; tekne arkada hareket etsin.", "A mı B mi yazın; en çok istenen rota için ayrı tur videosu çekelim.", "Yorum: A / B", "Yorum hedefi net; satış cümlesi yumuşak.", "Finalde yorum sorusunu ekranda tut."],
    ],
    captions: [
      "Tekne turu seçerken rota sadece lokasyon değil, günün hissini belirler. A mı B mi?",
      "Sakin yüzme molası mı, gün batımı fotoğraf ışığı mı? Yorumlarda seçelim.",
      "Bu format rota merakını yoruma çevirir: A rotası mı B rotası mı?"
    ],
    comments: "A rotası mı B rotası mı? Neden?",
  },
  {
    title: "Misafir Gibi Deneyim Testi",
    concept: "Tekne turunu işletme anlatımı yerine misafir deneyimi testi gibi gösteren Reels.",
    premise: "İzleyici kendini teknede hayal ederse rezervasyon bariyeri düşer.",
    ranges: [
      ["0-3s", "attention", "Kamerayı misafir gözüne koy: tekneye ilk adım, oturma, manzaraya bakış.", "POV çekim yap; adımı güvenli ve yavaş göster.", "Bu tekne turunu işletme gibi değil, misafir gibi test ediyorum.", "Misafir gözüyle test", "Aşırı hızlı yürüyüş yapma; güven hissi önemli.", "POV açılış, sonra yüz/voiceover."],
      ["4-12s", "first_impression", "İlk oturduğun yerde ne gördüğünü ve ne duyduğunu göster.", "Oturma yüksekliğinden çek; deniz, gölge ve alan görünsün.", "İlk izlenim: alan ferah mı, manzara açık mı, ses rahatsız ediyor mu?", "İlk izlenim", "Eleştiriyi yapıcı ve somut tut.", "Üç kriteri overlay olarak sırala."],
      ["13-23s", "comfort_test", "Bir çanta koyma, oturma, kalkma ve fotoğraf çekme mini testi yap.", "Kamera sabit; hareketler anlaşılır olsun.", "Rezervasyon kararında küçük konfor testleri büyük fark yaratıyor.", "Konfor testi", "Mizahi ama premium kal; dağınık görüntü yaratma.", "Her testi yarım saniyelik geçişlerle bağla."],
      ["24-34s", "highlight", "Turun en iyi anını tek cümleyle seç ve göster.", "Geniş manzara ya da tekne dış planı; görüntüyü 2 saniye tut.", "Benim için bu turun en güçlü anı şu geçiş.", "En güçlü an", "Tek bir favori seç; her şeyi en iyi diye anlatma.", "Favori anı müzik yükselişiyle destekle."],
      ["35-45s", "cta", "İzleyiciye kendi kriterini sordur.", "Kamera yüzüne dönsün; finalde tekne ve deniz kadrajda.", "Siz tekne turu seçerken ilk neye bakarsınız: konfor, rota, fiyat, fotoğraf mı?", "İlk kriteriniz ne?", "Dört seçenekli soru yorum getirir.", "Son ekranda seçenekleri okunaklı tut."],
    ],
    captions: [
      "Tekne turunu misafir gibi test ettim: ilk izlenim, konfor, rota hissi ve fotoğraf açısı.",
      "Rezervasyon kararını kolaylaştıran şey sadece manzara değil, misafir gibi hissedilen detaylar.",
      "Siz tekne turu seçerken önce neye bakarsınız?"
    ],
    comments: "İlk kriteriniz hangisi: konfor, rota, fiyat, fotoğraf?",
  },
];

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function jsonLiteral(value) {
  return sqlLiteral(JSON.stringify(value));
}

function cardPayload(card) {
  const sceneScript = card.ranges.map(([time, purpose, action, camera, say, overlay]) => ({
    second: time,
    purpose,
    voiceover: say,
    spoken_lines: [say],
    on_screen_text: overlay,
  }));
  const shotList = card.ranges.map(([time, purpose, action, camera, say, overlay]) => ({
    second: time,
    shot: purpose,
    action,
    overlay,
  }));
  const editingTimeline = card.ranges.map(([time, purpose, action, camera, say, overlay, creatorTouch, edit]) => ({
    second: time,
    beat: purpose,
    edit,
  }));
  const executionRanges = card.ranges.map(([time, purpose, action, camera, say, overlay, creatorTouch, edit]) => ({
    time_range: time,
    purpose,
    action,
    camera,
    say,
    say_tone: "Sakin, güven veren, premium ama ulaşılabilir.",
    on_screen_text_required: true,
    on_screen_text: overlay,
    creator_touch: creatorTouch,
    edit,
    shoot_direction: action,
    camera_direction: camera,
    pose_micro_behavior: "Omuzları rahat tut; ürünü değil deneyimi gösteren doğal hareketler kullan.",
    setting_or_broll: "Marina, güverte, deniz izi, rota detayı, oturma alanı ve servis dokuları.",
    spoken_line: say,
    edit_direction: edit,
    transition_style: "Temiz hard cut; gereksiz efekt yok.",
    overlay_timing: "Overlay görüntüden hemen sonra gelsin ve en az 1.5 saniye okunabilir kalsın.",
    audio_cue: "Hafif yazlık ambient müzik; deniz ve güverte sesleri mümkünse duyulsun.",
    pacing_note: "İlk 3 saniye hızlı, orta bölüm kanıt odaklı, final CTA okunaklı.",
    final_check: "İlk kare anlaşılır, rota/konfor kanıtı görünür, final sorusu tek ve net.",
    visual_cue: purpose === "cta" ? "payoff" : purpose.includes("trust") || purpose.includes("proof") ? "proof" : "environment",
  }));

  return {
    title: card.title,
    format: "instagram_reels_35_45",
    concept: card.concept,
    one_sentence_premise: card.premise,
    idea_summary: {
      premise: card.premise,
      creator_takeaway: "Tekne/yat turunu güzel görüntüden daha fazlası olarak göster: güven, konfor, rota ve rezervasyon kararını aynı Reels içinde netleştir.",
      target_emotion: "İzleyici kendini turda hayal ederken güven ve premium rahatlık hisseder.",
    },
    hook_performance_pack: {
      first_line_hook: card.ranges[0][4],
      hook_options: [
        card.ranges[0][4],
        "Bu tekne turunu seçmeden önce şu üç detaya bakardım.",
        "Manzaradan önce deneyimi gösterelim.",
      ],
      first_second_visual_hook: card.ranges[0][2],
      comment_trigger_hook: card.comments,
    },
    video_blueprint: {
      duration_seconds: 42,
      opening_visual: card.ranges[0][2],
      scene_arc: "Güven veren açılış -> rota/konfor kanıtı -> atmosfer -> seçimli yorum CTA.",
      payoff_visual: card.ranges.at(-1)[2],
    },
    execution_ranges: executionRanges,
    scene_script: sceneScript,
    shot_list: shotList,
    editing_timeline: editingTimeline,
    editing_notes: {
      pacing: "İlk saniyede karar sinyali ver; orta bölümde kanıt göster; finalde tek bir yorum sorusu bırak.",
      sound: "Deniz sesi, hafif yazlık müzik ve net voiceover; müzik voiceover'ı örtmesin.",
      transitions: "Hard cut ve match cut yeterli; tur tanıtımını reklam filmi gibi ağırlaştırma.",
    },
    edit_assembly_guide: {
      clip_order: card.ranges.map((range, index) => `${index + 1}. ${range[0]} - ${range[2]}`),
      cut_points: card.ranges.map((range) => `${range[0]} sonunda bir sonraki kanıta geç.`),
      transition_style: ["Temiz hard cut", "Yakından geniş plana match cut", "Final CTA öncesi yarım saniye nefes"],
      text_overlay_timing: card.ranges.map((range) => `${range[0]}: ${range[5]}`),
      voiceover_sync: card.ranges.map((range) => `${range[0]}: ${range[4]}`),
      music_sound_cue: ["Açılışta hafif yüksel", "Kanıt bölümünde alçalt", "Finalde soru okunurken sade bırak"],
      pacing_notes: ["İlk 3 saniye tek fikir", "Her kanıt ayrı kesim", "Final soru ekranı okunabilir"],
      final_assembly_checklist: ["Tekne temiz ve güven verici görünüyor", "Rota/konfor kanıtı görünür", "Aşırı satış dili yok", "Yorum sorusu tek ve net"],
    },
    b_roll_plan: [
      { type: "environment_detail", shot: "Marina girişi, tekne dış planı, güverte dokusu.", note: "İlk güven sinyalini kurar." },
      { type: "proof", shot: "Kaptan, can yeleği, oturma alanı, gölge ve rota hazırlığı.", note: "Rezervasyon bariyerini düşürür." },
      { type: "texture", shot: "Deniz izi, minder, servis detayı, el hareketi.", note: "Premium ama gerçek atmosfer verir." },
      { type: "payoff", shot: "Finalde tekne ve deniz aynı kadrajda.", note: "CTA ekranını sakin kapatır." },
    ],
    caption_pack: {
      caption_options: card.captions,
      on_screen_text: card.ranges.map((range) => range[5]),
      cta: card.comments,
    },
    comment_engine: {
      pinned_comment: card.comments,
      audience_question: card.comments,
      reply_strategy: "Yorumlardaki en güçlü seçimi ayrı bir rota videosu, saat önerisi veya Story anketi olarak takip et.",
    },
    story_followup: {
      poll_question: "Hangi tur hissi daha güçlü?",
      poll_options: ["Sabah sakinliği", "Gün batımı ışığı"],
      followup_frame: "Kazanan seçeneği tek kare rota önerisiyle paylaş.",
    },
    pose_direction: {
      body: "Rahat, dengeli, güven veren duruş.",
      face: "Sakin ve seçici; fazla satış heyecanı yok.",
      hands: "Detayları gösterirken yavaş ve net işaret et.",
      expression: "Deneyimi bilen biri gibi güvenli ama abartısız.",
    },
    micro_behavior_guide: {
      eye_contact: "Hook ve CTA'da kameraya bak; kanıt bölümünde tekne detayına dön.",
      facial_expression: "Gülümseme küçük ve doğal kalsın.",
      product_handling: "Tekneyi ürün gibi değil, deneyim alanı gibi göster.",
      camera_attention: "Kamera sürekli yüzünde kalmasın; kanıt detayları konuşsun.",
      avoid_over_advertising: "Fiyat baskısı, garanti vaatleri ve aşırı aciliyet kullanma.",
    },
    camera_direction: {
      framing: "Açılışta net odak, ortada rota/konfor kanıtı, finalde tekne + deniz geniş plan.",
      lighting: "Sabah veya gün batımı yumuşak ışığı; sert öğlen ışığında gölge alanı kullan.",
      movement: "Yavaş pan, sabit detay, temiz geçiş.",
    },
    production_plan: {
      equipment: ["telefon", "tripod veya sabit tutuş", "kablosuz mikrofon opsiyonel", "doğal ışık"],
      location_options: ["marina", "güverte", "tekne dış planı", "kıyı geçişi", "yüzme molası noktası"],
      shoot_time_minutes: 35,
      solo_creator_friendly: true,
      production_versions: {
        low: "Telefon + doğal ışık + voiceover.",
        mid: "Telefon + tripod + kısa kaptan/rota detayı.",
        high: "Drone veya ikinci kişiyle dış tekne planı.",
      },
    },
    atmosphere_direction: {
      mood: "Premium, sakin, yazlık ve güven veren.",
      visual_texture: "Temiz güverte, deniz izi, yumuşak ışık, doğal servis detayları.",
      color_language: "Beyaz, lacivert, turkuaz ve sıcak gün batımı tonları; aşırı filtre yok.",
      soundscape: "Hafif müzik, deniz sesi, kısa ve net voiceover.",
    },
    brand_safety: {
      disclosure_text: "Sponsorluysa video ve açıklama başında açık reklam işareti kullan.",
      claim_boundary: "Hava, deniz durumu, rota ve saat koşullara göre değişebilir; kesin garanti dili kullanma.",
      do_not_say: ["En iyi tur garantisi", "Kesin memnun kalırsınız", "Hemen almazsanız kaçırırsınız", "Her koşulda aynı rota"],
      evidence_note: "Rota, süre, kapasite ve servis bilgileri gerçek operasyon bilgisiyle uyumlu olmalı.",
      safer_alternative_phrase: "Bu rota ve saat, bu beklenti için daha uygun hissettiriyor.",
    },
    brand_lift_statement: "Bu kart, tekne/yat turunu sadece güzel manzara değil; güven, konfor ve seçilebilir deneyim olarak konumlandırır.",
    strategic_value: {
      brand_equity: "Tur markasını daha düzenli, güvenilir ve premium gösterir.",
      audience_aftertaste: "İzleyici 'burada ne yaşayacağımı anladım' hissiyle çıkar.",
      partnership_signal: "İşletmenin rota, konfor ve misafir deneyimini anlatabildiğini gösterir.",
    },
    creator_presence_mode: {
      mode: "travel_curator",
      delivery_style: "Sakin, seçici, deneyimi bilen ve karar kolaylaştıran.",
      why_it_fits_creator: "Tur içeriklerinde izleyiciye yalnızca görüntü değil, seçim kriteri verir.",
      avoid: "Bağıran satış dili, garanti vaatleri ve gereksiz lüks abartısı.",
    },
    personalization_slots: {
      product_name: "Tekne/yat adı veya tur markası",
      audience_pain: "Rota seçememe, güven, konfor, saat kararsızlığı",
      daily_context: "Bugünkü hava, deniz durumu, rota ve saat",
      signature_phrase: "Kendi tur anlatım cümlen",
    },
  };
}

const sql = `
begin;

do $$
declare
  v_user uuid;
  v_category uuid;
  v_persona uuid;
  v_product uuid;
  v_purchase uuid;
  v_delivery uuid;
  v_idea uuid;
  v_inventory uuid;
  v_payload jsonb;
  v_title text;
  v_premise text;
  v_band public.score_band;
  v_existing_delivery_ids uuid[];
  v_cards jsonb := ${jsonLiteral(cards.map((card) => ({
    title: card.title,
    premise: card.premise,
    payload: cardPayload(card),
  })))}::jsonb;
  v_item jsonb;
  v_index integer := 0;
begin
  select id into v_user from auth.users where lower(email) = lower(${sqlLiteral(email)}) limit 1;
  if v_user is null then
    raise exception 'User not found for email %', ${sqlLiteral(email)};
  end if;

  insert into public.profiles (id, display_name, role, plan, locale)
  values (v_user, 'Khan Kartal', 'creator', 'free', 'tr-TR')
  on conflict (id) do update set locale = excluded.locale, updated_at = now();

  select id into v_category from public.categories where slug = 'boat_tour_agency' limit 1;
  select id into v_persona from public.creator_personas where slug = 'travel_curator' limit 1;
  select id into v_product from public.box_products where slug = 'premium_viral_box_1000' limit 1;

  if v_category is null or v_persona is null or v_product is null then
    raise exception 'Required category/persona/product missing';
  end if;

  select coalesce(array_agg(id), '{}') into v_existing_delivery_ids
  from public.idea_box_deliveries
  where metadata->>'custom_batch_id' = ${sqlLiteral(batchId)};

  delete from public.idea_box_items where delivery_id = any(v_existing_delivery_ids);
  delete from public.idea_box_deliveries where id = any(v_existing_delivery_ids);
  delete from public.purchases where metadata->>'custom_batch_id' = ${sqlLiteral(batchId)};
  delete from public.idea_inventory where metadata->>'custom_batch_id' = ${sqlLiteral(batchId)};
  delete from public.idea_cards where idea_id in (select id from public.idea_candidates where external_idea_id like ${sqlLiteral(`${batchId}:%`)});
  delete from public.idea_candidates where external_idea_id like ${sqlLiteral(`${batchId}:%`)};

  insert into public.purchases (
    user_id, box_product_id, provider, amount_usd_cents, currency, status,
    category_id, persona_id, fulfillment_source, completed_at, metadata
  )
  values (
    v_user, v_product, 'admin', 100000, 'usd', 'paid',
    v_category, v_persona, 'admin_gift', now(),
    jsonb_build_object(
      'custom_batch_id', ${sqlLiteral(batchId)},
      'request', '6 Turkish Instagram Reels yacht/boat tour promo cards',
      'gift', true
    )
  )
  returning id into v_purchase;

  insert into public.idea_box_deliveries (
    user_id, purchase_id, box_product_id, category_id, persona_id, status,
    allocation, delivered_at, metadata
  )
  values (
    v_user, v_purchase, v_product, v_category, v_persona, 'delivered',
    jsonb_build_object('custom', 6, 'low', 2, 'mid', 2, 'high', 2),
    now(),
    jsonb_build_object(
      'custom_batch_id', ${sqlLiteral(batchId)},
      'opened_at', now(),
      'open_experience', 'preopened_for_creator_review',
      'brief', 'Türkçe, tur için yat/tekne tanıtımı, Instagram Reels'
    )
  )
  returning id into v_delivery;

  for v_item in select * from jsonb_array_elements(v_cards)
  loop
    v_index := v_index + 1;
    v_payload := v_item->'payload';
    v_title := v_item->>'title';
    v_premise := v_item->>'premise';
    v_band := case when v_index in (1, 4) then 'high'::public.score_band when v_index in (2, 5) then 'mid'::public.score_band else 'low'::public.score_band end;

    insert into public.idea_candidates (
      user_id, category_id, persona_id, platform, format, language, locale, title,
      one_sentence_premise, core_insight, opportunity_statement, mechanism_ids,
      hook_options, story_beats, human_awareness, production_requirements,
      safety_status, perspective_prism_status, confidence_band, status,
      decision_trace, external_idea_id, content_style_layers, candidate_source
    )
    values (
      v_user, v_category, v_persona, 'instagram_reels', 'reels_35_45', 'tr', 'TR', v_title,
      v_premise,
      'Tekne/yat turu tanıtımında güven, rota, konfor ve atmosfer netleşirse rezervasyon niyeti artar.',
      'İzleyiciye manzaradan önce deneyimi ve karar kriterini göster.',
      array['travel_curator', 'boat_tour_promo', 'reservation_intent'],
      v_payload->'hook_performance_pack'->'hook_options',
      v_payload->'scene_script',
      jsonb_build_object('tone', 'premium calm', 'audience', 'tour buyers'),
      jsonb_build_object('shoot_time_minutes', 35, 'platform', 'instagram_reels'),
      'SAFE', 'PASS', 'HIGH', 'published',
      jsonb_build_object('custom_batch_id', ${sqlLiteral(batchId)}, 'creator_request', true),
      ${sqlLiteral(batchId)} || ':' || lpad(v_index::text, 2, '0'),
      array['travel', 'tour_promo', 'premium_reels', 'reservation_cta'],
      'admin_direct'
    )
    returning id into v_idea;

    insert into public.idea_cards (idea_id, title, card, markdown)
    values (
      v_idea,
      v_title,
      v_payload,
      '# ' || v_title || E'\\n\\n' || v_premise
    );

    insert into public.idea_inventory (
      idea_id, category_id, persona_id, platform, language, content_style_layers,
      internal_rank_score, score_band, quality_floor_passed, status, reuse_count,
      max_reuse_count, last_assigned_at, metadata
    )
    values (
      v_idea, v_category, v_persona, 'instagram_reels', 'tr',
      array['travel', 'tour_promo', 'premium_reels', 'reservation_cta'],
      96 - v_index,
      v_band,
      true,
      'retired',
      1,
      1,
      now(),
      jsonb_build_object('custom_batch_id', ${sqlLiteral(batchId)}, 'assigned_directly', true)
    )
    returning id into v_inventory;

    insert into public.idea_box_items (
      delivery_id, user_id, inventory_id, idea_id, slot_index, assigned_band
    )
    values (
      v_delivery, v_user, v_inventory, v_idea, v_index, v_band
    );
  end loop;
end $$;

commit;
`;

const result = spawnSync("docker", ["exec", "-i", "supabase_db_ViralBox", "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1"], {
  input: sql,
  encoding: "utf8",
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.status !== 0) process.exit(result.status ?? 1);

console.log(`Seeded 6 yacht/boat tour cards for ${email}.`);
