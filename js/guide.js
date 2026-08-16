/* =========================================================
   واجهة الإرشاد الحيّ — تربط محرّك التتبّع بالشاشة
   ========================================================= */

(function () {
  "use strict";

  var el = function (id) { return document.getElementById(id); };

  var ui = {
    guide:        el("guide-ui"),
    screenStart:  el("screen-start"),
    screenResume: el("screen-resume"),
    screenStage:  el("screen-stage"),
    screenDone:   el("screen-done"),
    stageName:    el("stage-name"),
    stageHukm:    el("stage-hukm"),
    shawtLine:    el("shawt-line"),
    shawtLabel:   el("shawt-label"),
    beads:        el("beads"),
    taskNow:      el("task-now"),
    stageHint:    el("stage-hint"),
    headingRow:   el("heading-row"),
    arrow:        el("arrow"),
    destName:     el("dest-name"),
    sourceDot:    el("source-dot"),
    sourceText:   el("source-text"),
    warning:      el("tracking-warning"),
    counterRow:   el("counter-row"),
    btnStageDone: el("btn-stage-done"),
    duaSheet:     el("dua-sheet"),
    duaBody:      el("dua-body"),
    stageDoneBody:el("stage-done-body"),
    btnCount:     el("btn-count"),
    live:         el("live-region"),
    elapsed:      el("elapsed"),
    elapsedText:  el("elapsed-text"),
    screenHalq:   el("screen-halq"),
    halqNotes:    el("halq-notes"),
    halqHukm:     el("halq-hukm"),
    doneDuration: el("done-duration-text")
  };

  var heading = null;      // اتجاه الجهاز بالدرجات، أو null إن لم تتوفّر البوصلة
  var lastPos = null;      // آخر موضعٍ معلوم للمستخدم
  var visualTracking = false;
  var sessionStarted = false;
  var lastCount = null;    // لتمييز الشوط الجديد عن مجرّد إعادة رسم

  /* ——— أدوات العرض ——— */

  var AR_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

  /** تحويل الرقم إلى أرقامٍ عربية في الواجهة العربية. */
  function num(n) {
    if (window.currentLang !== "ar") return String(n);
    return String(n).replace(/[0-9]/g, function (d) { return AR_DIGITS[+d]; });
  }

  function show(node) { node.classList.add("show"); }
  function hide(node) { node.classList.remove("show"); }

  /* ——— الرسم ——— */

  function render(state) {
    var rite = state.rite;
    if (!rite) return;

    ui.stageName.textContent = window.t(rite.titleKey);
    ui.stageHukm.textContent = window.riteHukm(rite);
    ui.stageHukm.style.display = rite.hukm ? "" : "none";
    ui.taskNow.textContent = window.t(rite.taskKey);
    renderHint(state);

    // الأشواط: تظهر في مراحل العدّ فقط
    if (rite.tracking) {
      ui.shawtLine.style.display = "";
      ui.counterRow.style.display = "";
      ui.btnStageDone.style.display = "none";

      var current = Math.min(state.count + 1, state.total);
      ui.shawtLabel.textContent =
        window.t("guide_shawt") + " " + num(current) + " " + window.t("guide_of") + " " + num(state.total);
      renderBeads(state.count, state.total);

      /* بعد اكتمال العدد ينتظر الدليل تأكيد المستخدم، فيُعطَّل زرّ التسجيل
         بدل أن يبقى ظاهراً لا يستجيب دون تفسير. */
      ui.btnCount.disabled = state.awaitingConfirm || state.count >= state.total;
      ui.btnCount.style.opacity = ui.btnCount.disabled ? "0.45" : "";
    } else {
      ui.shawtLine.style.display = "none";
      ui.counterRow.style.display = "none";
      ui.btnStageDone.style.display = rite.id === "done" ? "none" : "";
    }

    // الوجهة
    if (rite.nextTargetKey) {
      ui.headingRow.style.display = "";
      ui.destName.textContent = window.t(rite.nextTargetKey);
    } else {
      ui.headingRow.style.display = "none";
    }

    renderSource(state);
    updateArrow(state);
    renderElapsed(state);

    /* المرحلتان الأخيرتان لا تحتاجان كاميرا: الحلق يقع خارج المطاف والمسعى،
       فتُطفأ الكاميرا وتُعرَض التوجيهات في شاشةٍ كاملةٍ أوضحَ وأوفرَ للبطارية. */
    if (rite.id === "halq") {
      stopCamera();
      renderHalq(state);
      show(ui.screenHalq);
    } else {
      hide(ui.screenHalq);
    }

    if (rite.id === "done") {
      stopCamera();
      hide(ui.screenHalq);
      ui.doneDuration.textContent = formatDuration(elapsedMs(state));
      show(ui.screenDone);
    }
  }

  /* ——— زمن العمرة ——— */

  function elapsedMs(state) {
    if (!state.startedAt) return 0;
    return (state.finishedAt || Date.now()) - state.startedAt;
  }

  /**
   * صياغة المدّة نصّاً سليماً.
   * والعربية تُميّز العدد على أربع صور: المفرد للواحد، والمثنّى للاثنين،
   * وجمع القلّة من ثلاثةٍ إلى عشرة، ثم المفرد المنصوب فيما فوقها. فلا يصحّ
   * أن يُقال «٣ دقيقة» ولا «١١ دقائق».
   */
  function arabicPlural(n, forms) {
    if (n === 1) return forms.one;
    if (n === 2) return forms.two;
    if (n >= 3 && n <= 10) return num(n) + " " + forms.few;
    return num(n) + " " + forms.many;
  }

  function formatDuration(ms) {
    var totalMin = Math.floor(ms / 60000);
    var h = Math.floor(totalMin / 60);
    var m = totalMin % 60;

    if (window.currentLang !== "ar") {
      if (totalMin < 1) return window.t("less_than_minute");
      var parts = [];
      if (h > 0) parts.push(h + (h === 1 ? " hour" : " hours"));
      if (m > 0) parts.push(m + (m === 1 ? " minute" : " minutes"));
      return parts.join(" and ");
    }

    if (totalMin < 1) return window.t("less_than_minute");

    var hourForms = { one: "ساعةً واحدة", two: "ساعتين", few: "ساعاتٍ", many: "ساعةً" };
    var minForms  = { one: "دقيقةً واحدة", two: "دقيقتين", few: "دقائق",  many: "دقيقةً" };

    if (h === 0) return arabicPlural(m, minForms);
    if (m === 0) return arabicPlural(h, hourForms);
    return arabicPlural(h, hourForms) + " و" + arabicPlural(m, minForms);
  }

  window.__formatDuration = formatDuration; // للاختبار الآلي

  function renderElapsed(state) {
    if (!state.startedAt) { ui.elapsed.style.display = "none"; return; }
    ui.elapsed.style.display = "";

    var totalMin = Math.floor(elapsedMs(state) / 60000);
    var h = Math.floor(totalMin / 60);
    var m = totalMin % 60;
    ui.elapsedText.textContent = num(h) + ":" + num(m < 10 ? "0" + m : m);
    ui.elapsed.title = window.t("elapsed_label");
  }

  /* ——— شاشة الحلق ——— */

  function renderHalq(state) {
    ui.halqHukm.textContent = window.riteHukm(state.rite);
    ui.halqNotes.innerHTML = "";

    var notes = window.riteText(state.rite.notes);
    if (notes.length) ui.halqNotes.appendChild(listOf(notes));

    var own = state.gender === "female"
      ? window.riteText(state.rite.womenOnly)
      : window.riteText(state.rite.menOnly);

    if (own.length) {
      var label = state.gender === "female" ? window.t("women_note") : window.t("men_note");
      ui.halqNotes.appendChild(section(label, listOf(own), true));
    }
  }

  /** إيقاف الكاميرا وتحرير عدستها، فلا حاجة إليها في المرحلتين الأخيرتين. */
  function stopCamera() {
    var layer = el("camera-layer");
    if (!layer.classList.contains("camera-on")) return;

    layer.querySelectorAll("video").forEach(function (video) {
      if (video.srcObject) {
        video.srcObject.getTracks().forEach(function (track) { track.stop(); });
        video.srcObject = null;
      }
    });

    layer.innerHTML = "";
    layer.classList.remove("camera-on");
    visualTracking = false;
  }

  /**
   * تنبيه المرحلة الجارية. وهو يتغيّر بتغيّر الشوط لا بتغيّر المرحلة وحدها،
   * لأن الرمَل مشروعٌ في الأشواط الثلاثة الأُولى دون الأربعة الباقية —
   * وهذا ممّا يُغفَل، ولا يتبيّن للمعتمر إلا إذا عُرِض عليه في وقته.
   */
  function renderHint(state) {
    var key = null;
    var female = state.gender === "female";

    if (state.rite.id === "tawaf") {
      key = female ? "hint_tawaf_women" : (state.count < 3 ? "hint_raml" : "hint_walk");
    } else if (state.rite.id === "sai") {
      key = female ? "hint_sai_walk" : "hint_sai_run";
    }

    if (key) {
      ui.stageHint.textContent = window.t(key);
      ui.stageHint.style.display = "";
    } else {
      ui.stageHint.style.display = "none";
    }
  }

  function renderBeads(done, total) {
    if (ui.beads.childElementCount !== total) {
      ui.beads.innerHTML = "";
      for (var i = 0; i < total; i++) {
        var b = document.createElement("span");
        b.className = "bead";
        ui.beads.appendChild(b);
      }
    }
    Array.prototype.forEach.call(ui.beads.children, function (bead, i) {
      bead.className = "bead" + (i < done ? " done" : i === done ? " current" : "");
    });
  }

  function sourceLabel(state) {
    if (state.source === "gps") return window.t("src_gps");
    if (state.source === "marker") return window.t("src_marker");
    return window.t("src_manual");
  }

  /** إعلانٌ لقارئ الشاشة دون تغييرٍ بصريّ. */
  function announce(message) {
    ui.live.textContent = message;
  }

  function renderSource(state) {
    /* مصدر آخر شوطٍ يُعرَض كما هو دائماً، فلا يقع عدٌّ خفيٌّ لا يعلمه المعتمر،
       وحالةُ التتبّع تُعرَض مستقلّةً عنه في التنبيه أسفل الشاشة. */
    var text = window.t("counted_by") + ": " + sourceLabel(state);

    if (state.accuracy !== null) {
      text += " · " + window.t("accuracy") + " " + num(Math.round(state.accuracy)) + window.t("meters");
    }
    ui.sourceText.textContent = text;

    var weak = state.accuracy === null || state.accuracy > window.CONFIG.MAX_ACCURACY_M;
    ui.sourceDot.className = "source-dot " + (!state.trackingOn ? "" : weak ? "weak" : "live");

    if (!state.trackingOn) {
      ui.warning.style.display = "";
      ui.warning.textContent = window.t("tracking_off");
    } else if (weak) {
      ui.warning.style.display = "";
      ui.warning.textContent = window.t("tracking_weak");
    } else {
      ui.warning.style.display = "none";
    }
  }

  /** إدارة السهم نحو وجهة المرحلة الحالية. */
  function updateArrow(state) {
    var rite = state.rite;
    if (!rite || !rite.target || heading === null || !lastPos) {
      ui.arrow.style.transform = "";
      return;
    }
    var target = window.CONFIG[rite.target];
    var b = window.Geo.bearing(lastPos, target);
    ui.arrow.style.transform = "rotate(" + (b - heading) + "deg)";
  }

  /* ——— لوحة الأذكار والتنبيهات ——— */

  /**
   * لوحةٌ واحدة تجمع ما يحتاجه المعتمر في المرحلة الجارية: التنبيهات الفقهية،
   * ثم ما يخصّه بحسب كونه رجلاً أو امرأة، ثم الأذكار الواردة.
   * وإنما جُمعت هنا لأن هذه أحوج المواضع إليها — لا في صفحةٍ تُقرأ قبل الدخول.
   */
  function renderSheet(rite, gender) {
    ui.duaBody.innerHTML = "";

    var notes = window.riteText(rite.notes);
    if (notes.length) ui.duaBody.appendChild(section(window.t("notes_title"), listOf(notes)));

    var own = gender === "female" ? window.riteText(rite.womenOnly) : window.riteText(rite.menOnly);
    if (own.length) {
      var label = gender === "female" ? window.t("women_note") : window.t("men_note");
      ui.duaBody.appendChild(section(label, listOf(own), true));
    }

    if (rite.duas && rite.duas.length) {
      var wrap = document.createElement("div");
      rite.duas.forEach(function (dua) { wrap.appendChild(duaBox(dua)); });
      ui.duaBody.appendChild(section(window.t("duas_title"), wrap));
    }

    if (!ui.duaBody.childElementCount) {
      ui.duaBody.appendChild(document.createTextNode("—"));
    }
  }

  function section(title, body, highlight) {
    var box = document.createElement("section");
    if (highlight) box.className = "sheet-gender";

    var h = document.createElement("h4");
    h.className = "sheet-heading";
    h.textContent = title;

    box.appendChild(h);
    box.appendChild(body);
    return box;
  }

  function listOf(items) {
    var ul = document.createElement("ul");
    ul.className = "list";
    items.forEach(function (item) {
      var li = document.createElement("li");
      li.textContent = item;
      ul.appendChild(li);
    });
    return ul;
  }

  function duaBox(dua) {
    var box = document.createElement("div");
    box.className = "dhikr";

    var text = document.createElement("span");
    text.className = "ayah";
    text.textContent = dua.isAyah ? "﴿" + dua.ar + "﴾" : dua.ar;
    box.appendChild(text);

    var cite = document.createElement("cite");
    var parts = [];
    if (dua.source) parts.push(dua.source[window.currentLang] || dua.source.ar);
    if (dua.meaning) parts.push(dua.meaning[window.currentLang] || dua.meaning.ar);
    cite.textContent = parts.join(" — ");
    box.appendChild(cite);

    return box;
  }

  /* ——— البوصلة ——— */

  function onOrientation(e) {
    if (typeof e.webkitCompassHeading === "number") {
      heading = e.webkitCompassHeading;           // iOS: اتجاهٌ حقيقي جاهز
    } else if (e.absolute && typeof e.alpha === "number") {
      heading = (360 - e.alpha) % 360;            // معيار W3C
    } else {
      return;
    }

    /* تعويض دوران الشاشة: من أمال هاتفه عرضياً انحرف سهمه بقدر زاوية
       الدوران إن لم تُطرح، فيدلّه على غير وجهته. */
    heading = (heading + screenAngle() + 360) % 360;

    updateArrow(window.Tracker.getState());
  }

  function screenAngle() {
    if (window.screen && window.screen.orientation && typeof window.screen.orientation.angle === "number") {
      return window.screen.orientation.angle;
    }
    return typeof window.orientation === "number" ? window.orientation : 0;
  }

  function startCompass() {
    var DOE = window.DeviceOrientationEvent;
    if (!DOE) return;

    if (typeof DOE.requestPermission === "function") {
      DOE.requestPermission().then(function (res) {
        if (res === "granted") bindOrientation();
      }).catch(function () { /* رُفض الإذن — يعمل الدليل بلا سهم */ });
    } else {
      bindOrientation();
    }
  }

  function bindOrientation() {
    window.addEventListener("deviceorientationabsolute", onOrientation, true);
    window.addEventListener("deviceorientation", onOrientation, true);
  }

  /* ——— منع إطفاء الشاشة ——— */

  var wakeLock = null;

  /**
   * الطواف والسعي يستغرقان قرابة الساعة، والهاتف يُقفل من تلقائه مراراً
   * خلالها. ويُفقد قفل الشاشة عند الانتقال إلى تطبيقٍ آخر أو إخفاء الصفحة،
   * فيُعاد طلبه عند العودة.
   */
  function requestWakeLock() {
    if (!navigator.wakeLock) return;
    navigator.wakeLock.request("screen").then(function (lock) {
      wakeLock = lock;
      lock.addEventListener("release", function () { wakeLock = null; });
    }).catch(function () { /* رُفض الطلب أو البطارية منخفضة — لا يُعطَّل شيء */ });
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && wakeLock === null && sessionStarted) {
      requestWakeLock();
    }
  });

  /* ——— تأكيدٌ لمسيّ ——— */

  /** اهتزازة قصيرة عند تسجيل شوط، فالشاشة قد لا تُرى في الزحام. */
  function buzz(pattern) {
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

  /* ——— التتبّع البصري بالماركرات ——— */

  var ANCHORS = ["hajar", "maqam", "safa", "marwah"];

  /**
   * حقن مشهد MindAR. ملف الماركرات اختياري: إن تعذّر تحميله بقي الدليل
   * عاملاً بتحديد الموقع والعدّاد اليدوي، ولا تتعطّل الشاشة.
   */
  function startVisualTracking() {
    fetch("markers/targets.mind", { method: "HEAD" })
      .then(function (res) {
        if (!res.ok) throw new Error("no targets");
        injectScene();
      })
      .catch(function () {
        visualTracking = false; // لا ماركرات متاحة — لا شيء يُعطَّل
      });
  }

  function injectScene() {
    var targets = ANCHORS.map(function (id, i) {
      return '<a-entity mindar-image-target="targetIndex: ' + i + '" id="anchor-' + id + '"></a-entity>';
    }).join("");

    el("camera-layer").classList.add("camera-on");
    el("camera-layer").innerHTML =
      '<a-scene mindar-image="imageTargetSrc: markers/targets.mind; autoStart: true; uiScanning: no; uiLoading: no;" ' +
      'color-space="sRGB" renderer="colorManagement: true" vr-mode-ui="enabled: false" ' +
      'device-orientation-permission-ui="enabled: false">' +
      '<a-camera position="0 0 0" look-controls="enabled: false"></a-camera>' +
      targets +
      "</a-scene>";

    visualTracking = true;

    setTimeout(function () {
      ANCHORS.forEach(function (id) {
        var node = el("anchor-" + id);
        if (node) {
          node.addEventListener("targetFound", function () {
            window.Tracker.registerAnchor(id);
          });
        }
      });
    }, 1200);
  }

  /* ——— الأحداث ——— */

  window.Tracker.on("change", function (state) {
    render(state);

    /* الاهتزاز والإعلان الصوتي عند زيادة العدّ فقط، لا عند كل إعادة رسم */
    var key = state.stage + ":" + state.count;
    if (lastCount !== null && key !== lastCount && state.count > 0 && state.rite.tracking) {
      buzz(60);
      announce(ui.shawtLabel.textContent + " — " + window.t("counted_by") + " " + sourceLabel(state));
    }
    lastCount = key;
  });

  window.Tracker.on("position", function (data) {
    lastPos = data.here;
  });

  window.Tracker.on("stagecomplete", function (state) {
    var idx = window.getRiteIndex(state.stage);
    var next = window.RITES[idx + 1];
    ui.stageDoneBody.textContent = next
      ? window.t("stage_next") + ": " + window.t(next.titleKey)
      : "";
    show(ui.screenStage);
  });

  /* ——— الأزرار ——— */

  var gender = "male";

  function selectGender(g) {
    gender = g;
    el("btn-male").className = "btn " + (g === "male" ? "btn-primary" : "btn-outline");
    el("btn-female").className = "btn " + (g === "female" ? "btn-primary" : "btn-outline");
  }

  el("btn-male").addEventListener("click", function () { selectGender("male"); });
  el("btn-female").addEventListener("click", function () { selectGender("female"); });
  selectGender("male");

  function beginSession(auto) {
    hide(ui.screenStart);
    ui.guide.style.display = "flex";
    sessionStarted = true;

    window.Tracker.setGender(gender);
    requestWakeLock();

    /* الدقيقة أدقّ وحدةٍ معروضة، فتكفي مراجعةٌ كل عشرين ثانية ليتغيّر
       الرقم في حينه دون إنهاكٍ للبطارية. */
    setInterval(function () { renderElapsed(window.Tracker.getState()); }, 20000);

    if (auto) {
      window.Tracker.startGeolocation();
      startCompass();
      startVisualTracking();
    }
    render(window.Tracker.getState());
  }

  el("btn-start-auto").addEventListener("click", function () { beginSession(true); });
  el("btn-start-manual").addEventListener("click", function () { beginSession(false); });

  el("btn-count").addEventListener("click", function () { window.Tracker.manualCount(); });
  el("btn-undo").addEventListener("click", function () { window.Tracker.undoCircuit(); });
  el("btn-stage-done").addEventListener("click", function () { window.Tracker.completeStage(); });

  el("btn-stage-continue").addEventListener("click", function () {
    hide(ui.screenStage);
    window.Tracker.advanceStage();
  });

  el("btn-stage-undo").addEventListener("click", function () {
    hide(ui.screenStage);
    window.Tracker.undoCircuit();
  });

  el("btn-halq-done").addEventListener("click", function () {
    window.Tracker.completeStage();   // إلى مرحلة التحلّل
  });

  el("btn-halq-back").addEventListener("click", function () {
    hide(ui.screenHalq);
    window.Tracker.goBackStage();
  });

  el("btn-duas").addEventListener("click", function () {
    var state = window.Tracker.getState();
    renderSheet(state.rite, state.gender);
    ui.duaSheet.classList.add("open");
  });

  /* إغلاق اللوحة بالنقر خارجها */
  document.addEventListener("click", function (e) {
    if (!ui.duaSheet.classList.contains("open")) return;
    if (ui.duaSheet.contains(e.target) || el("btn-duas").contains(e.target)) return;
    ui.duaSheet.classList.remove("open");
  });

  el("btn-dua-close").addEventListener("click", function () {
    ui.duaSheet.classList.remove("open");
  });

  /* ——— الاستئناف ——— */

  el("btn-resume").addEventListener("click", function () {
    hide(ui.screenResume);
    window.Tracker.init({ resume: true });
    show(ui.screenStart);
  });

  el("btn-fresh").addEventListener("click", function () {
    hide(ui.screenResume);
    window.Tracker.init({ resume: false });
    show(ui.screenStart);
  });

  /* ——— التهيئة ——— */

  document.addEventListener("DOMContentLoaded", function () {
    if (window.Tracker.hasSavedProgress()) {
      hide(ui.screenStart);
      show(ui.screenResume);
    } else {
      window.Tracker.init({ resume: false });
    }

    if (new URLSearchParams(window.location.search).has("sim")) initSim();
  });

  /* =========================================================
     وضع المحاكاة — بديلٌ عن الاختبار الميداني الذي يتعذّر إجراؤه
     يُفعَّل بإضافة ?sim=1 إلى الرابط، ويحقن مواضع اصطناعية في المحرّك.
     ========================================================= */

  function initSim() {
    var bar = document.createElement("div");
    bar.style.cssText =
      "position:fixed; top:0; inset-inline:0; z-index:200; display:flex; gap:4px; " +
      "padding:6px; background:rgba(0,0,0,0.85); flex-wrap:wrap; justify-content:center;";

    function simBtn(label, fn) {
      var b = document.createElement("button");
      b.textContent = label;
      b.style.cssText =
        "font:600 12px/1 Tajawal,sans-serif; padding:7px 10px; border-radius:6px; " +
        "border:1px solid #d4af37; background:transparent; color:#d4af37; cursor:pointer;";
      b.addEventListener("click", fn);
      bar.appendChild(b);
      return b;
    }

    var badge = document.createElement("span");
    badge.textContent = window.t("sim_badge");
    badge.style.cssText = "font:700 12px/1.9 Tajawal,sans-serif; color:#9a9082; padding:0 6px;";
    bar.appendChild(badge);

    simBtn("طواف ٧", function () { simulateTawaf(7); });
    simBtn("سعي ٧", function () { simulateSai(7); });
    simBtn("ضجيج", simulateNoise);
    simBtn("عيّنة رديئة", function () {
      window.Tracker.injectPosition(window.CONFIG.KAABA.lat, window.CONFIG.KAABA.lng, 80);
    });

    document.body.appendChild(bar);
  }

  /** مسار دائري حول الكعبة: ٧ دوراتٍ بخطوات ٦° لمحاكاة مشي الطائف. */
  function simulateTawaf(laps) {
    var radius = 25;
    var stepDeg = 6;
    var total = Math.round((laps * 360) / stepDeg);
    var i = 0;

    var timer = setInterval(function () {
      if (i > total) { clearInterval(timer); return; }
      // الطواف عكس عقارب الساعة، فالسمت يتناقص
      var p = window.Geo.destination(window.CONFIG.KAABA, -i * stepDeg, radius);
      window.Tracker.injectPosition(p.lat, p.lng, 6);
      i++;
    }, 20);
  }

  /** ذهابٌ وإيابٌ على محور الصفا ← المروة، والشوط السابع ينتهي بالمروة. */
  function simulateSai(laps) {
    var safa = window.CONFIG.SAFA;
    var marwah = window.CONFIG.MARWAH;
    var steps = 24;
    var leg = 0;
    var i = 0;

    var timer = setInterval(function () {
      if (leg >= laps) { clearInterval(timer); return; }

      var t = i / steps;
      var frac = leg % 2 === 0 ? t : 1 - t; // الأشواط الفردية من الصفا، والزوجية من المروة
      var p = {
        lat: safa.lat + (marwah.lat - safa.lat) * frac,
        lng: safa.lng + (marwah.lng - safa.lng) * frac
      };
      window.Tracker.injectPosition(p.lat, p.lng, 6);

      i++;
      if (i > steps) { i = 0; leg++; }
    }, 30);
  }

  /** قفزاتٌ عشوائية بعيدة: يجب ألّا تزيد العدّاد إطلاقاً. */
  function simulateNoise() {
    for (var i = 0; i < 40; i++) {
      var b = Math.random() * 360;
      var r = 200 + Math.random() * 400; // خارج نطاق المطاف
      var p = window.Geo.destination(window.CONFIG.KAABA, b, r);
      window.Tracker.injectPosition(p.lat, p.lng, 10);
    }
  }
})();
