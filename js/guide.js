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
    stageDoneBody:el("stage-done-body")
  };

  var heading = null;      // اتجاه الجهاز بالدرجات، أو null إن لم تتوفّر البوصلة
  var lastPos = null;      // آخر موضعٍ معلوم للمستخدم
  var visualTracking = false;

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

    // الأشواط: تظهر في مراحل العدّ فقط
    if (rite.tracking) {
      ui.shawtLine.style.display = "";
      ui.counterRow.style.display = "";
      ui.btnStageDone.style.display = "none";

      var current = Math.min(state.count + 1, state.total);
      ui.shawtLabel.textContent =
        window.t("guide_shawt") + " " + num(current) + " " + window.t("guide_of") + " " + num(state.total);
      renderBeads(state.count, state.total);
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

    if (rite.id === "done") show(ui.screenDone);
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

  function renderSource(state) {
    /* مصدر آخر شوطٍ يُعرَض كما هو دائماً، فلا يقع عدٌّ خفيٌّ لا يعلمه المعتمر،
       وحالةُ التتبّع تُعرَض مستقلّةً عنه في التنبيه أسفل الشاشة. */
    var label;
    if (state.source === "gps") label = window.t("src_gps");
    else if (state.source === "marker") label = window.t("src_marker");
    else label = window.t("src_manual");

    var text = window.t("counted_by") + ": " + label;

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

  /* ——— لوحة الأذكار ——— */

  function renderDuas(rite) {
    ui.duaBody.innerHTML = "";

    if (!rite.duas || rite.duas.length === 0) {
      var empty = document.createElement("p");
      empty.textContent = "—";
      ui.duaBody.appendChild(empty);
      return;
    }

    rite.duas.forEach(function (dua) {
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

      ui.duaBody.appendChild(box);
    });
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
    updateArrow(window.Tracker.getState());
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

  window.Tracker.on("change", render);

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

    window.Tracker.setGender(gender);

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

  el("btn-again").addEventListener("click", function () {
    hide(ui.screenDone);
    window.Tracker.reset();
  });

  el("btn-duas").addEventListener("click", function () {
    renderDuas(window.Tracker.getState().rite);
    ui.duaSheet.classList.add("open");
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
