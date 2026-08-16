/* =========================================================
   نموذج المناسك — بيانات صِرفة، لا منطق فيها
   يقرأ منها المرشد الحيّ وصفحة دليل المناسك معاً، فلا يتكرّر النصّ.

   الأذكار والآيات عربية في كل اللغات، ومعانيها مترجَمة في الحقل meaning.
   وحكم كل عمل مبيَّن في الحقل hukm.
   ========================================================= */

/* ——— إحداثيات المعالم ———
   تقريبية مأخوذة من المصادر الجغرافية العامّة، وتحتاج معايرةً ميدانية
   داخل الحرم لضبط العدّ التلقائي بدقّة. تعديلها هنا يكفي.               */
window.CONFIG = {
  KAABA:       { lat: 21.422487, lng: 39.826206 },
  HAJAR_ASWAD: { lat: 21.422510, lng: 39.826170 }, // الركن الشرقي
  MAQAM:       { lat: 21.422604, lng: 39.826024 },
  SAFA:        { lat: 21.421859, lng: 39.827438 },
  MARWAH:      { lat: 21.423920, lng: 39.826570 },

  /* حدود قبول عيّنات تحديد الموقع */
  MAX_ACCURACY_M: 25,   // تُهمَل العيّنة إن تجاوز خطؤها هذا الحدّ
  MAX_STEP_DEG:   45,   // قفزة زاوية أكبر من هذا تُعدّ ضجيجاً
  LAP_DEG:        359.5,// الزاوية التي تُعدّ دورةً كاملة، بهامشٍ يمنع التعثّر عند الحدّ تماماً
  TAWAF_MIN_R:    5,    // أدنى نصف قطر مقبول حول الكعبة (متر)
  /* الطواف يقع في المطاف وفي الأدوار العليا والسطح والتوسعة، فيتّسع نصف القطر
     كثيراً. واشتراط دورةٍ كاملة (٣٦٠°) هو ما يمنع احتساب مَن يمرّ في الصحن
     دون طواف، لا ضيقُ النطاق. */
  TAWAF_MAX_R:    150,  // أقصى نصف قطر مقبول حول الكعبة (متر)
  SAI_END_ZONE:   0.10, // نسبة طول المسعى التي تُعدّ منطقة طرفية
  MARKER_COOLDOWN_MS: 20000, // زمن تبريد يمنع عدّ الماركر مرّتين
  /* مدّة اعتبار عيّنة الموقع حديثةً. فإن انقطعت الإشارة أطول من ذلك — وهو
     كثيرٌ تحت السقوف وفي الزحام — رجع الاعتماد إلى الماركر وحده. */
  FIX_FRESH_MS:   30000
};

/* ——— مراحل العمرة بالترتيب ——— */
window.RITES = [
  {
    id: "ihram",
    titleKey: "rite_ihram_title",
    taskKey: "rite_ihram_task",
    hukm: "ركن",
    hukmEn: "Pillar",
    count: 1,
    locationKey: "loc_miqat",
    nextTargetKey: "loc_hajar",
    target: "HAJAR_ASWAD",
    notes: {
      ar: [
        "الإحرام نيّةُ الدخول في النُّسك، وهو ركنٌ لا تنعقد العمرة بدونه. أمّا كونه من الميقات فواجبٌ، من تجاوزه بغير إحرامٍ لزمه الرجوع أو الفدية.",
        "يُستحبّ الاغتسال والتنظّف والتطيّب في البدن دون ثوب الإحرام.",
        "المواقيت خمسة: ذو الحُليفة لأهل المدينة، والجُحفة لأهل الشام ومصر والمغرب، وقَرْنُ المنازل (السيل الكبير) لأهل نجد، ويَلَمْلَم لأهل اليمن، وذاتُ عِرْقٍ لأهل العراق. ومن كان دونها فمن حيث أنشأ.",
        "من قدِم جوّاً فليُحرِم عند محاذاة الميقات في الجوّ، ولا يؤخّر إحرامه حتى ينزل جدّة.",
        "من خاف عائقاً يمنعه من إتمام نُسُكه استحبّ له الاشتراط عند إحرامه."
      ],
      en: [
        "Ihram is the intention to enter the rites; it is a pillar without which Umrah does not begin. Entering it from the Miqat is an obligation — whoever passes the Miqat without Ihram must return or offer expiation.",
        "It is recommended to perform ghusl, groom oneself, and apply perfume to the body but not to the Ihram garments.",
        "There are five Mawaqit: Dhul-Hulayfah, Al-Juhfah, Qarn al-Manazil (As-Sayl al-Kabir), Yalamlam, and Dhat 'Irq. Whoever lives closer than these enters Ihram from where they set out.",
        "Those arriving by air should enter Ihram when passing over the Miqat, not delay it until landing in Jeddah.",
        "Whoever fears an obstacle preventing completion of the rites is encouraged to make a conditional stipulation when entering Ihram."
      ]
    },
    menOnly: {
      ar: ["يلبس الرجل إزاراً ورداءً غير مخيطين، ويكشف رأسه، ولا يلبس الخُفّين إلا عند فقد النعلين."],
      en: ["A man wears an unstitched izar and rida', leaves his head uncovered, and does not wear leather socks unless sandals are unavailable."]
    },
    womenOnly: {
      ar: ["تلبس المرأة ما شاءت من ثيابها الساترة، ولا تنتقب ولا تلبس القفّازين، وتستر وجهها عند مرور الرجال بسدل الخمار."],
      en: ["A woman wears any modest clothing she wishes, but does not wear a face veil (niqab) or gloves; she may drape her head covering over her face when men pass by."]
    },
    duas: [
      {
        ar: "لَبَّيْكَ عُمْرَةً",
        translit: "Labbayka 'Umrah",
        meaning: {
          ar: "تُقال عند عقد النيّة بالدخول في النُّسك.",
          en: "Said when making the intention to enter the rites."
        }
      },
      {
        ar: "اللَّهُمَّ إِنِّي أُرِيدُ الْعُمْرَةَ فَيَسِّرْهَا لِي وَتَقَبَّلْهَا مِنِّي",
        translit: "Allahumma inni uridu al-'Umrata fa-yassirha li wa-taqabbalha minni",
        meaning: {
          ar: "دعاءٌ بالتيسير والقبول عند الإحرام.",
          en: "A supplication for ease and acceptance upon entering Ihram."
        }
      },
      {
        ar: "فَإِنْ حَبَسَنِي حَابِسٌ فَمَحِلِّي حَيْثُ حَبَسْتَنِي",
        translit: "Fa-in habasani habisun fa-mahilli haythu habastani",
        meaning: {
          ar: "الاشتراط، ويقوله من خاف عائقاً يمنعه من إتمام نُسُكه.",
          en: "The conditional stipulation, said by one who fears being prevented from completing the rites."
        }
      },
      {
        ar: "لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ",
        translit:
          "Labbayka Allahumma labbayk, labbayka la sharika laka labbayk, inna al-hamda wa an-ni'mata laka wa al-mulk, la sharika lak",
        meaning: {
          ar: "التلبية، يُكثِر منها المُحرِم حتى يشرع في الطواف. يرفع بها الرجل صوته وتُسِرّ بها المرأة.",
          en: "The Talbiyah, recited frequently until the Tawaf begins. Men raise their voices with it; women say it quietly."
        }
      }
    ]
  },

  {
    id: "tawaf",
    titleKey: "rite_tawaf_title",
    taskKey: "rite_tawaf_task",
    hukm: "ركن",
    hukmEn: "Pillar",
    count: 7,
    locationKey: "loc_kaaba",
    nextTargetKey: "loc_maqam",
    target: "HAJAR_ASWAD",
    tracking: "tawaf",
    notes: {
      ar: [
        "يُقطع التلبية عند الشروع في الطواف.",
        "يبدأ الشوط من محاذاة الحجر الأسود وينتهي عنده، فالسبعة أشواطٍ سبعُ دوراتٍ كاملة.",
        "استلم الحجر الأسود وقبِّله إن تيسّر بلا إيذاءٍ لأحد. فإن لم تستطع فاستلمه بيدك وقبِّل يدك. فإن لم تستطع فأشِر إليه بيدك وقل: «اللهُ أكبر»، ولا تُقبِّل يدك حينئذٍ.",
        "اجعل البيت عن يسارك، وطُف من وراء الحِجْر (حِجْر إسماعيل) فإنه من البيت، ومن طاف من داخله لم يصحّ شوطه.",
        "استلم الركن اليماني بيدك إن تيسّر ولا تُقبِّله، فإن لم يتيسّر فامضِ ولا تُشِر إليه.",
        "ليس لكل شوطٍ دعاءٌ مخصوص، بل ادعُ بما شئت من خيري الدنيا والآخرة واذكر الله.",
        "الطهارة من الحدث شرطٌ في الطواف عند جمهور أهل العلم، وستر العورة كذلك."
      ],
      en: [
        "The Talbiyah stops once the Tawaf begins.",
        "Each circuit starts and ends level with the Black Stone, so seven circuits are seven complete rounds.",
        "Touch and kiss the Black Stone if you can without harming anyone. If not, touch it with your hand and kiss your hand. If not, point to it and say 'Allahu Akbar' — and do not kiss your hand in this case.",
        "Keep the Kaaba on your left, and walk outside the Hijr (Hijr Isma'il), for it is part of the House; whoever passes through it has not completed a valid circuit.",
        "Touch the Yemeni Corner with your hand if you can, but do not kiss it; if you cannot reach it, continue without pointing to it.",
        "There is no supplication specific to each circuit — supplicate with whatever good you wish for this world and the next, and remember Allah.",
        "Ritual purity is a condition for Tawaf according to the majority of scholars, as is covering the 'awrah."
      ]
    },
    menOnly: {
      ar: [
        "الاضطباع: يجعل وسط ردائه تحت إبطه الأيمن وطرفيه على كتفه الأيسر، ويكون في طواف العمرة كلّه.",
        "الرَّمَل: إسراع المشي مع تقارب الخُطا، ويكون في الأشواط الثلاثة الأُولى خاصّة، ثم يمشي على عادته في الأربعة الباقية."
      ],
      en: [
        "Idtiba': placing the middle of the rida' under the right armpit with both ends over the left shoulder, throughout the Tawaf of Umrah.",
        "Raml: walking briskly with short steps, in the first three circuits only; the remaining four are walked normally."
      ]
    },
    womenOnly: {
      ar: ["لا اضطباع على المرأة ولا رمَل، بل تمشي على هيئتها المعتادة."],
      en: ["Women do not perform Idtiba' or Raml; they walk at their normal pace."]
    },
    duas: [
      {
        ar: "بِسْمِ اللهِ وَاللهُ أَكْبَرُ",
        translit: "Bismillahi wa Allahu Akbar",
        meaning: {
          ar: "يُقال عند محاذاة الحجر الأسود في بداية كل شوط.",
          en: "Said when level with the Black Stone at the start of each circuit."
        }
      },
      {
        ar: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
        source: { ar: "سورة البقرة: ٢٠١", en: "Al-Baqarah: 201" },
        isAyah: true,
        meaning: {
          ar: "يُقال بين الركن اليماني والحجر الأسود في كل شوط.",
          en: "Said between the Yemeni Corner and the Black Stone in every circuit."
        }
      }
    ]
  },

  {
    id: "prayer",
    titleKey: "rite_prayer_title",
    taskKey: "rite_prayer_task",
    hukm: "سنة",
    hukmEn: "Sunnah",
    count: 1,
    locationKey: "loc_maqam",
    nextTargetKey: "loc_zamzam",
    target: "MAQAM",
    notes: {
      ar: [
        "غطِّ كتفك الأيمن بعد فراغك من الطواف قبل الصلاة، فالاضطباع خاصٌّ بالطواف.",
        "تقدَّم إلى مقام إبراهيم فاجعله بينك وبين الكعبة إن تيسّر، فإن كان فيه زحامٌ فصلِّ في أي موضعٍ من المسجد ولا تزاحم الناس.",
        "يُقرأ في الركعة الأولى بعد الفاتحة سورة الكافرون، وفي الثانية سورة الإخلاص.",
        "هاتان الركعتان سنّةٌ عند جمهور أهل العلم، من تركهما فطوافه صحيح."
      ],
      en: [
        "Cover your right shoulder after finishing the Tawaf and before the prayer, as Idtiba' is specific to Tawaf.",
        "Move towards Maqam Ibrahim so that it is between you and the Kaaba if possible; if it is crowded, pray anywhere in the Mosque without pushing through people.",
        "Recite Surah al-Kafirun in the first rak'ah after al-Fatihah, and Surah al-Ikhlas in the second.",
        "These two rak'ahs are a Sunnah according to the majority of scholars; the Tawaf remains valid if they are omitted."
      ]
    },
    duas: [
      {
        ar: "وَاتَّخِذُوا مِن مَّقَامِ إِبْرَاهِيمَ مُصَلًّى",
        source: { ar: "سورة البقرة: ١٢٥", en: "Al-Baqarah: 125" },
        isAyah: true,
        meaning: {
          ar: "تُقرأ عند التقدّم إلى المقام قبل الركعتين.",
          en: "Recited when approaching the Maqam before the two rak'ahs."
        }
      }
    ]
  },

  {
    id: "zamzam",
    titleKey: "rite_zamzam_title",
    taskKey: "rite_zamzam_task",
    hukm: "سنة",
    hukmEn: "Sunnah",
    count: 1,
    locationKey: "loc_zamzam",
    nextTargetKey: "loc_safa",
    target: "SAFA",
    notes: {
      ar: [
        "اشرب من ماء زمزم وتضلَّع منه، فقد ثبت أنه «طعامُ طُعْمٍ وشفاءُ سُقْمٍ».",
        "ثم ارجع إلى الحجر الأسود فاستلمه إن تيسّر لك، وإلا فامضِ إلى الصفا ولا حرج.",
        "ثم اخرج إلى المسعى من باب الصفا."
      ],
      en: [
        "Drink your fill of Zamzam water, for it is authentically described as nourishing food and a cure for illness.",
        "Then return to the Black Stone and touch it if you are able; if not, proceed to Safa — there is no harm in that.",
        "Then head out to the Mas'a through the Safa gate."
      ]
    },
    duas: [
      {
        ar: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا وَاسِعًا، وَشِفَاءً مِنْ كُلِّ دَاءٍ",
        translit: "Allahumma inni as'aluka 'ilman nafi'an, wa rizqan wasi'an, wa shifa'an min kulli da'",
        meaning: {
          ar: "مأثورٌ عن ابن عباس رضي الله عنهما عند شرب ماء زمزم، ويدعو الشارب بما شاء فإن ماء زمزم لما شُرِب له.",
          en: "Reported from Ibn 'Abbas when drinking Zamzam. One may supplicate with whatever they wish, for Zamzam water is for whatever purpose it is drunk."
        }
      }
    ]
  },

  {
    id: "sai",
    titleKey: "rite_sai_title",
    taskKey: "rite_sai_task",
    hukm: "ركن",
    hukmEn: "Pillar",
    count: 7,
    locationKey: "loc_masaa",
    nextTargetKey: "loc_marwah",
    target: "SAFA",
    tracking: "sai",
    notes: {
      ar: [
        "الذهاب من الصفا إلى المروة شوط، والرجوع من المروة إلى الصفا شوطٌ ثانٍ، فالشوط السابع ينتهي بالمروة لا بالصفا.",
        "إذا دنوتَ من الصفا في ابتداء سعيك فاقرأ الآية وقل: «أَبْدَأُ بِمَا بَدَأَ اللهُ بِهِ»، ولا تُعيد ذلك في بقيّة الأشواط.",
        "ارقَ الصفا حتى ترى الكعبة إن تيسّر، فاستقبلها ورافعاً يديك ادعُ، وقُل الذكر الوارد ثلاث مرّات تدعو بين كل مرّتين.",
        "افعل على المروة كما فعلتَ على الصفا، غير أنك لا تقرأ الآية عليها.",
        "الموالاة بين الطواف والسعي سنّة، ولا يضرّ الفصل اليسير.",
        "ليس للسعي دعاءٌ مخصوصٌ في كل شوط، فادعُ واذكر الله بما تيسّر."
      ],
      en: [
        "Going from Safa to Marwah is one circuit, and returning from Marwah to Safa is a second; thus the seventh circuit ends at Marwah, not at Safa.",
        "When approaching Safa at the start of the Sa'i, recite the verse and say: 'I begin with what Allah began with' — and do not repeat this in the remaining circuits.",
        "Ascend Safa until you can see the Kaaba if possible, face it, raise your hands and supplicate, saying the reported dhikr three times, supplicating between each.",
        "Do at Marwah as you did at Safa, except that you do not recite the verse there.",
        "Performing the Sa'i directly after the Tawaf is a Sunnah; a short interval does no harm.",
        "There is no supplication specific to each circuit — supplicate and remember Allah as you are able."
      ]
    },
    menOnly: {
      ar: ["يسعى الرجل سعياً شديداً بين العلمين الأخضرين، ثم يمشي على عادته حتى يبلغ الطرف الآخر."],
      en: ["Men jog briskly between the two green markers, then walk normally until reaching the other end."]
    },
    womenOnly: {
      ar: ["لا تسعى المرأة بين العلمين الأخضرين، بل تمشي على هيئتها المعتادة في المسعى كلّه."],
      en: ["Women do not jog between the two green markers; they walk normally throughout the Mas'a."]
    },
    duas: [
      {
        ar: "إِنَّ الصَّفَا وَالْمَرْوَةَ مِن شَعَائِرِ اللَّهِ",
        source: { ar: "سورة البقرة: ١٥٨", en: "Al-Baqarah: 158" },
        isAyah: true,
        meaning: {
          ar: "تُقرأ عند الدنوّ من الصفا في ابتداء السعي فقط.",
          en: "Recited when approaching Safa at the beginning of the Sa'i only."
        }
      },
      {
        ar: "أَبْدَأُ بِمَا بَدَأَ اللهُ بِهِ",
        translit: "Abda'u bima bada'a Allahu bih",
        meaning: {
          ar: "تُقال بعد الآية عند ابتداء السعي بالصفا.",
          en: "Said after the verse when beginning the Sa'i at Safa."
        }
      },
      {
        ar: "لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ، أَنْجَزَ وَعْدَهُ، وَنَصَرَ عَبْدَهُ، وَهَزَمَ الْأَحْزَابَ وَحْدَهُ",
        translit:
          "La ilaha illa Allahu wahdahu la sharika lah, lahu al-mulku wa lahu al-hamdu wa huwa 'ala kulli shay'in qadir, la ilaha illa Allahu wahdah, anjaza wa'dah, wa nasara 'abdah, wa hazama al-ahzaba wahdah",
        meaning: {
          ar: "يُقال على الصفا وعلى المروة، ثلاث مرّاتٍ يدعو بين كل مرّتين بما شاء.",
          en: "Said upon Safa and upon Marwah, three times, supplicating freely between each."
        }
      }
    ]
  },

  {
    id: "halq",
    titleKey: "rite_halq_title",
    taskKey: "rite_halq_task",
    hukm: "واجب",
    hukmEn: "Obligation",
    count: 1,
    locationKey: "loc_anywhere",
    nextTargetKey: null,
    target: null,
    notes: {
      ar: [
        "الحلق أو التقصير واجبٌ من واجبات العمرة، من تركه لزمه دم.",
        "يكون بعد الفراغ من السعي، ولا يجوز قبله.",
        "لا يُجزئ الأخذ من بعض الرأس، بل من جميعه."
      ],
      en: [
        "Shaving or shortening is an obligation of Umrah; whoever omits it must offer expiation.",
        "It is done after completing the Sa'i, and is not permitted before it.",
        "Taking from only part of the head is not sufficient; it must be from all of it."
      ]
    },
    menOnly: {
      ar: ["يحلق الرجل رأسه كلّه أو يُقصّر من جميعه، والحلق أفضل، فقد دعا النبيّ ﷺ للمحلّقين ثلاثاً وللمقصّرين مرّة."],
      en: ["A man shaves his entire head or shortens all of it; shaving is preferable, as the Prophet ﷺ supplicated three times for those who shave and once for those who shorten."]
    },
    womenOnly: {
      ar: ["تجمع المرأة شعرها وتقصّ منه قدر أُنملة (طرف الإصبع)، وليس عليها حلق."],
      en: ["A woman gathers her hair and cuts a fingertip's length from it; shaving is not prescribed for her."]
    },
    duas: []
  },

  {
    id: "done",
    titleKey: "rite_done_title",
    taskKey: "rite_done_task",
    hukm: null,
    hukmEn: null,
    count: 0,
    locationKey: null,
    nextTargetKey: null,
    target: null,
    notes: {
      ar: [
        "بالحلق أو التقصير تمّت عمرتك وحللتَ من إحرامك، فحلّ لك ما كان محظوراً عليك من اللباس والطيب وغيره.",
        "وليس بعد ذلك طوافُ وداعٍ واجبٌ للعمرة عند جمهور أهل العلم."
      ],
      en: [
        "With the shaving or shortening, your Umrah is complete and you have exited Ihram; what was prohibited to you — clothing, perfume, and the rest — is now permitted.",
        "According to the majority of scholars, no farewell Tawaf is obligatory for Umrah."
      ]
    },
    duas: []
  }
];

/** إرجاع المرحلة بمعرّفها. */
window.getRite = function (id) {
  return window.RITES.find(function (r) { return r.id === id; }) || null;
};

/** إرجاع ترتيب المرحلة في التسلسل. */
window.getRiteIndex = function (id) {
  return window.RITES.findIndex(function (r) { return r.id === id; });
};

/** إرجاع نصّ حكم المرحلة باللغة الحالية. */
window.riteHukm = function (rite) {
  if (!rite.hukm) return "";
  return window.currentLang === "ar" ? rite.hukm : rite.hukmEn;
};

/** إرجاع مصفوفة نصّية من حقلٍ مزدوج اللغة، ويعود إلى العربية عند الفقد. */
window.riteText = function (field) {
  if (!field) return [];
  return field[window.currentLang] || field.ar || [];
};
