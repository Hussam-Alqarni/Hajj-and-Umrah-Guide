/* =========================================================
   نظام الترجمة
   بنية قابلة للتوسّع: تُضاف لغة جديدة بإضافة مدخل في LANGS ثم كائن
   ترجمة بنفس المفاتيح. لا يحتاج ذلك تعديلاً في أي ملف آخر.

   ملاحظة: نصوص الأذكار والآيات عربية في كل اللغات، وهي محفوظة في
   js/rites.js لا هنا؛ والمترجَم هنا هو معانيها وواجهة الاستعمال.
   ========================================================= */

window.LANGS = {
  ar: { label: "العربية", dir: "rtl", native: "العربية" },
  en: { label: "English", dir: "ltr", native: "English" }
  // لإضافة لغة لاحقاً:
  // ur: { label: "اردو", dir: "rtl", native: "اردو" },
  // id: { label: "Indonesia", dir: "ltr", native: "Bahasa Indonesia" }
};

window.translations = {
  ar: {
    /* ——— عام ——— */
    brand: "مُرشد العمرة",
    site_title: "مُرشد العمرة — دليل مصوَّر بالواقع المعزّز",
    nav_guide: "الإرشاد الحيّ",
    nav_manasik: "دليل المناسك",
    nav_sources: "المصادر",
    nav_home: "الرئيسية",
    theme_toggle: "تبديل المظهر",
    lang_toggle: "English",

    /* ——— الصفحة الأولى ——— */
    home_eyebrow: "دليل العمرة · المسجد الحرام",
    home_h1: "مُرشدك في العمرة، خطوةً بخطوة",
    home_lead:
      "دليلٌ يرافقك داخل المسجد الحرام فيبيّن لك أين أنت الآن، وفي أي شوطٍ أنت، وما المهمّة التالية، وإلى أين تتوجّه؛ مبنيٌّ على صفة العمرة الثابتة في السنّة.",

    home_how_title: "كيف يعمل الدليل؟",
    home_how_1:
      "يُحدّد موضعك داخل الحرم بثلاث وسائل مجتمعة: مسح الماركرات بالكاميرا، وتحديد الموقع، والعدّاد اليدوي.",
    home_how_2:
      "يعرض لك في كل لحظة مرحلتك الحالية ورقم الشوط والمهمّة التالية مع سهمٍ يشير إلى وجهتك.",
    home_how_3:
      "يحفظ تقدّمك في جهازك، فإن أُقفل الهاتف أو أُعيد تحميل الصفحة استأنفتَ من حيث توقّفت.",

    home_rites_title: "مراحل العمرة",
    home_start: "ابدأ الإرشاد الحيّ",
    home_read: "قراءة دليل المناسك أولاً",

    home_before_title: "قبل أن تُحرِم",
    home_before_1: "اغتسل وتطيَّب في بدنك دون ثوب الإحرام.",
    home_before_2: "البس ثياب الإحرام قبل بلوغ الميقات.",
    home_before_3: "انوِ الدخول في النُّسك عند محاذاة الميقات، ثم لبِّ.",

    /* ——— التنويه الشرعي ——— */
    disclaimer_title: "تنويه",
    disclaimer_body:
      "هذا دليلُ تذكيرٍ وإرشاد، أُنشئ محتواه استناداً إلى كتب أهل السنّة المعتبرة في المناسك، ويمكنك الاطّلاع على",
    disclaimer_link: "المصادر التي بُني عليها",
    disclaimer_tail:
      "· وليس هذا الدليل فتوى؛ وإذا شككتَ في عدد الأشواط فالمرجع يقينُك أنت لا الجهاز، والأصل البناء على الأقل. وعند الإشكال فاسأل أهل العلم.",

    /* ——— شاشة الإرشاد ——— */
    guide_permission_title: "قبل البدء",
    guide_permission_body:
      "يحتاج الدليل إذنك باستعمال الكاميرا وتحديد الموقع والبوصلة ليتتبّع أشواطك تلقائياً. ويمكنك رفض ذلك والاعتماد على العدّاد اليدوي، فالدليل يعمل كاملاً بدونها.",
    guide_start_full: "ابدأ بالتتبّع التلقائي",
    guide_start_manual: "ابدأ بالعدّاد اليدوي فقط",
    guide_resume_title: "لديك عمرة لم تكتمل",
    guide_resume_body: "وجدنا تقدّماً محفوظاً في جهازك. أتريد استئنافه أم البدء من جديد؟",
    guide_resume: "استئناف من حيث توقّفت",
    guide_restart: "بدء عمرة جديدة",

    guide_shawt: "الشوط",
    guide_of: "من",
    guide_task_now: "المهمّة الآن",
    guide_destination: "توجَّه إلى",
    guide_count_btn: "سجِّل شوطاً",
    guide_undo_btn: "تراجع",
    guide_next_stage: "أنهيتُ هذه المرحلة",
    guide_duas_btn: "التنبيهات والأذكار المستحبّة",
    guide_exit: "إنهاء",

    /* ——— تنبيهات المرحلة الجارية ——— */
    hint_raml: "أسرِع المشي مع تقارب الخُطا (الرمَل)، وأبقِ كتفك الأيمن مكشوفاً (الاضطباع).",
    hint_walk: "امشِ على عادتك في الأشواط الباقية، والاضطباع باقٍ إلى نهاية الطواف.",
    hint_tawaf_women: "امشي على هيئتك المعتادة، ولا اضطباع عليكِ ولا رمَل.",
    hint_sai_run: "إذا بلغتَ العلمين الأخضرين فاسعَ بينهما سعياً شديداً، ثم امشِ.",
    hint_sai_walk: "امشي على هيئتك المعتادة، ولا سعي بين العلمين الأخضرين.",
    hint_hijr: "طُف من وراء الحِجْر فإنه من البيت.",

    /* ——— مصادر العدّ ——— */
    src_manual: "العدّ اليدوي",
    src_gps: "تحديد الموقع",
    src_marker: "الماركر",
    src_none: "لا تتبّع تلقائي",
    accuracy: "الدقّة",
    meters: "م",
    tracking_weak: "تعذّر التتبّع التلقائي — اعتمِد العدّاد اليدوي.",
    tracking_off: "التتبّع التلقائي متوقّف — استعمل العدّاد اليدوي.",
    counted_by: "سُجِّل بواسطة",

    /* ——— انتقال المراحل ——— */
    stage_done_title: "تمّت المرحلة",
    stage_next: "المرحلة التالية",
    stage_continue: "متابعة",
    umrah_done_title: "تقبّل الله منك",
    umrah_done_body: "تمّت عمرتك بالحلق أو التقصير، وحللتَ من إحرامك.",
    halq_confirm: "أنهيتُ الحلق أو التقصير",
    elapsed_label: "منذ بدء العمرة",
    done_duration: "استغرقت عمرتك",
    hours_short: "س",
    minutes_short: "د",
    minutes_word: "دقيقة",
    less_than_minute: "أقلَّ من دقيقة",

    /* ——— دليل المناسك ——— */
    manasik_h1: "دليل العمرة",
    manasik_lead:
      "صفة العمرة كما وردت في السنّة، مرتّبةً على مراحلها، مع بيان حكم كل عمل: ركنٌ لا تصحّ العمرة بتركه، أو واجبٌ يُجبَر تركه بدم، أو سنّةٌ يُثاب فاعلها ولا يأثم تاركها.",
    manasik_toc: "المحتويات",
    hukm_label: "الحكم",
    count_label: "العدد",
    once: "مرّة واحدة",
    shawts: "أشواط",
    notes_title: "تنبيهات",
    duas_title: "ما يُقال",
    men_note: "للرجال خاصّة",
    women_note: "للنساء خاصّة",

    /* ——— المصادر ——— */
    sources_h1: "المصادر",
    sources_lead:
      "اعتمد محتوى هذا الدليل على كتب أهل السنّة المعتبرة في المناسك، وهذه أهمّها:",
    sources_note:
      "وما ورد في هذا الدليل من ترتيبٍ للأشواط وبيانٍ للأذكار فمَحلُّ اتفاقٍ بين هذه المصادر. وما اختُلف فيه فقد اقتُصر على المتّفق عليه أو نُبِّه عليه.",

    /* ——— أسماء المعالم ——— */
    loc_miqat: "الميقات",
    loc_hajar: "الحجر الأسود",
    loc_kaaba: "الكعبة المشرّفة",
    loc_maqam: "مقام إبراهيم",
    loc_zamzam: "ماء زمزم",
    loc_safa: "الصفا",
    loc_marwah: "المروة",
    loc_masaa: "المسعى",
    loc_anywhere: "أي موضع",

    /* ——— أسماء المراحل ——— */
    rite_ihram_title: "الإحرام والنيّة والتلبية",
    rite_ihram_task: "انوِ العمرة عند الميقات ثم أكثِر من التلبية حتى تشرع في الطواف.",

    rite_tawaf_title: "الطواف بالبيت",
    rite_tawaf_task: "طُف سبعة أشواط، كلُّ شوطٍ من الحجر الأسود إلى الحجر الأسود، والبيت عن يسارك.",

    rite_prayer_title: "ركعتا الطواف",
    rite_prayer_task: "صلِّ ركعتين خلف مقام إبراهيم إن تيسّر، وإلا ففي أي موضع من المسجد.",

    rite_zamzam_title: "زمزم واستلام الحجر",
    rite_zamzam_task: "اشرب من ماء زمزم، ثم ارجع فاستلم الحجر الأسود إن تيسّر لك.",

    rite_sai_title: "السعي بين الصفا والمروة",
    rite_sai_task: "اسعَ سبعة أشواط تبدأ بالصفا وتنتهي بالمروة.",

    rite_halq_title: "الحلق أو التقصير",
    rite_halq_task: "احلِق رأسك أو قصِّر من جميعه، وبذلك تتمّ عمرتك.",

    rite_done_title: "تمّت العمرة",
    rite_done_task: "حللتَ من إحرامك، وحلّ لك ما كان محظوراً عليك.",

    /* ——— وضع المحاكاة ——— */
    sim_badge: "وضع المحاكاة"
  },

  en: {
    brand: "Umrah Guide",
    site_title: "Umrah Guide — An Augmented Reality Companion",
    nav_guide: "Live Guide",
    nav_manasik: "Rites Guide",
    nav_sources: "Sources",
    nav_home: "Home",
    theme_toggle: "Toggle theme",
    lang_toggle: "العربية",

    home_eyebrow: "Umrah Guide · The Sacred Mosque",
    home_h1: "Your Umrah companion, step by step",
    home_lead:
      "A guide that accompanies you inside the Sacred Mosque, showing where you are, which circuit you are on, what comes next, and where to head — based on the manner of Umrah established in the Sunnah.",

    home_how_title: "How does it work?",
    home_how_1:
      "It locates you inside the Mosque using three combined methods: scanning markers with the camera, geolocation, and a manual counter.",
    home_how_2:
      "It shows your current stage, circuit number, and next task at all times, with an arrow pointing to your destination.",
    home_how_3:
      "It saves your progress on your device, so if your phone locks or the page reloads, you resume where you stopped.",

    home_rites_title: "Stages of Umrah",
    home_start: "Start the live guide",
    home_read: "Read the rites guide first",

    home_before_title: "Before entering Ihram",
    home_before_1: "Perform ghusl and apply perfume to your body, not to the Ihram garments.",
    home_before_2: "Put on the Ihram garments before reaching the Miqat.",
    home_before_3: "Make your intention at the Miqat, then recite the Talbiyah.",

    disclaimer_title: "Please note",
    disclaimer_body:
      "This is a guide for reminder and direction. Its content was compiled from recognised Sunni works on the rites of pilgrimage, and you may review",
    disclaimer_link: "the sources it was built upon",
    disclaimer_tail:
      "· It is not a religious verdict. If you doubt the number of circuits, your own certainty is the reference — not the device — and the default is to build on the lesser number. When in doubt, ask a scholar.",

    guide_permission_title: "Before you begin",
    guide_permission_body:
      "The guide needs permission to use your camera, location, and compass to track your circuits automatically. You may decline and rely on the manual counter — the guide works fully without them.",
    guide_start_full: "Start with automatic tracking",
    guide_start_manual: "Start with the manual counter only",
    guide_resume_title: "You have an unfinished Umrah",
    guide_resume_body: "We found saved progress on your device. Resume it or start over?",
    guide_resume: "Resume where I stopped",
    guide_restart: "Start a new Umrah",

    guide_shawt: "Circuit",
    guide_of: "of",
    guide_task_now: "Your task now",
    guide_destination: "Head to",
    guide_count_btn: "Record a circuit",
    guide_undo_btn: "Undo",
    guide_next_stage: "I finished this stage",
    guide_duas_btn: "Notes & recommended supplications",
    guide_exit: "Exit",

    hint_raml: "Walk briskly with short steps (Raml), keeping your right shoulder uncovered (Idtiba').",
    hint_walk: "Walk normally for the remaining circuits; Idtiba' continues until the Tawaf ends.",
    hint_tawaf_women: "Walk at your normal pace — Idtiba' and Raml do not apply to you.",
    hint_sai_run: "When you reach the two green markers, jog briskly between them, then walk.",
    hint_sai_walk: "Walk at your normal pace — jogging between the green markers does not apply to you.",
    hint_hijr: "Walk outside the Hijr, for it is part of the House.",

    src_manual: "Manual count",
    src_gps: "Geolocation",
    src_marker: "Marker",
    src_none: "No automatic tracking",
    accuracy: "Accuracy",
    meters: "m",
    tracking_weak: "Automatic tracking unavailable — please use the manual counter.",
    tracking_off: "Automatic tracking is off — use the manual counter.",
    counted_by: "Recorded by",

    stage_done_title: "Stage complete",
    stage_next: "Next stage",
    stage_continue: "Continue",
    umrah_done_title: "May Allah accept it from you",
    umrah_done_body:
      "Your Umrah is complete with the shaving or shortening of the hair, and you have exited the state of Ihram.",
    halq_confirm: "I have shaved or shortened",
    elapsed_label: "Since starting Umrah",
    done_duration: "Your Umrah took",
    hours_short: "h",
    minutes_short: "m",
    minutes_word: "minutes",
    less_than_minute: "less than a minute",

    manasik_h1: "The Rites of Umrah",
    manasik_lead:
      "The manner of Umrah as established in the Sunnah, ordered by stage, with the ruling of each act: a pillar (rukn) without which Umrah is invalid, an obligation (wajib) whose omission requires expiation, or a Sunnah that is rewarded but not sinful to omit.",
    manasik_toc: "Contents",
    hukm_label: "Ruling",
    count_label: "Count",
    once: "Once",
    shawts: "circuits",
    notes_title: "Notes",
    duas_title: "What is said",
    men_note: "For men specifically",
    women_note: "For women specifically",

    sources_h1: "Sources",
    sources_lead:
      "The content of this guide relies on recognised Sunni works on the rites of pilgrimage. The principal ones are:",
    sources_note:
      "The sequence of circuits and the supplications mentioned here are agreed upon across these sources. Where they differ, only the agreed-upon position is given, or the difference is noted.",

    loc_miqat: "The Miqat",
    loc_hajar: "The Black Stone",
    loc_kaaba: "The Kaaba",
    loc_maqam: "Maqam Ibrahim",
    loc_zamzam: "Zamzam water",
    loc_safa: "Safa",
    loc_marwah: "Marwah",
    loc_masaa: "The Mas'a",
    loc_anywhere: "Anywhere",

    rite_ihram_title: "Ihram, intention and Talbiyah",
    rite_ihram_task:
      "Make the intention for Umrah at the Miqat, then recite the Talbiyah frequently until you begin the Tawaf.",

    rite_tawaf_title: "Tawaf around the Kaaba",
    rite_tawaf_task:
      "Perform seven circuits, each from the Black Stone back to the Black Stone, keeping the Kaaba on your left.",

    rite_prayer_title: "The two Rak'ahs of Tawaf",
    rite_prayer_task:
      "Pray two rak'ahs behind Maqam Ibrahim if possible, otherwise anywhere in the Mosque.",

    rite_zamzam_title: "Zamzam and touching the Stone",
    rite_zamzam_task:
      "Drink Zamzam water, then return and touch the Black Stone if you are able.",

    rite_sai_title: "Sa'i between Safa and Marwah",
    rite_sai_task: "Perform seven circuits, beginning at Safa and ending at Marwah.",

    rite_halq_title: "Shaving or shortening the hair",
    rite_halq_task: "Shave your head or shorten all of it — with this your Umrah is complete.",

    rite_done_title: "Umrah complete",
    rite_done_task: "You have exited Ihram, and what was prohibited to you is now permitted.",

    sim_badge: "Simulation mode"
  }
};

/* ——— تهيئة اللغة ——— */
(function initLang() {
  var saved = null;
  try { saved = localStorage.getItem("umrah_lang"); } catch (e) { /* التخزين محجوب */ }
  var lang = saved && window.translations[saved] ? saved : "ar";
  window.currentLang = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = window.LANGS[lang].dir;
})();

/* ——— تهيئة المظهر: يتبع الجهاز ما لم يختر المستخدم ——— */
(function initTheme() {
  var saved = null;
  try { saved = localStorage.getItem("umrah_theme"); } catch (e) { /* التخزين محجوب */ }
  if (saved === "light" || saved === "dark") {
    document.documentElement.setAttribute("data-theme", saved);
  }
})();

/** إرجاع نصّ مترجَم بمفتاحه، ويعود إلى العربية ثم إلى المفتاح نفسه عند الفقد. */
window.t = function (key) {
  var dict = window.translations[window.currentLang] || {};
  if (dict[key] !== undefined) return dict[key];
  var fallback = window.translations.ar;
  return fallback[key] !== undefined ? fallback[key] : key;
};

/** تطبيق الترجمة على كل عنصر يحمل data-i18n داخل الجذر المُمرَّر. */
window.applyTranslations = function (root) {
  (root || document).querySelectorAll("[data-i18n]").forEach(function (el) {
    el.textContent = window.t(el.getAttribute("data-i18n"));
  });
  (root || document).querySelectorAll("[data-i18n-aria]").forEach(function (el) {
    el.setAttribute("aria-label", window.t(el.getAttribute("data-i18n-aria")));
  });
  document.title = window.t("site_title");
};

window.setLang = function (lang) {
  if (!window.translations[lang]) return;
  try { localStorage.setItem("umrah_lang", lang); } catch (e) { /* تجاهُل */ }
  window.location.reload();
};

window.toggleLang = function () {
  var codes = Object.keys(window.translations);
  var next = codes[(codes.indexOf(window.currentLang) + 1) % codes.length];
  window.setLang(next);
};

window.toggleTheme = function () {
  var root = document.documentElement;
  var current = root.getAttribute("data-theme");
  if (!current) {
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    current = prefersDark ? "dark" : "light";
  }
  var next = current === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  try { localStorage.setItem("umrah_theme", next); } catch (e) { /* تجاهُل */ }
};

/* تسجيل عامل الخدمة ليعمل الدليل دون إنترنت.
   يحتاج https أو localhost، ويُتجاوَز بصمتٍ إن تعذّر. */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").catch(function () { /* تجاهُل */ });
  });
}

document.addEventListener("DOMContentLoaded", function () {
  window.applyTranslations(document);

  document.querySelectorAll("[data-action='toggle-lang']").forEach(function (btn) {
    btn.addEventListener("click", window.toggleLang);
  });
  document.querySelectorAll("[data-action='toggle-theme']").forEach(function (btn) {
    btn.addEventListener("click", window.toggleTheme);
  });
});
