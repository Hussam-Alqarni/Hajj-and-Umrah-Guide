/* =========================================================
   محرّك التتبّع
   ثلاثة مصادر تغذّي حالةً واحدة: الماركرات، وتحديد الموقع، والعدّاد اليدوي.
   والعدّاد اليدوي هو الحَكَم عند التعارض؛ فالجهاز مُعينٌ لا مرجع.

   المخرَج الوحيد أحداثٌ يستهلكها js/guide.js:
     change         — تغيّرت الحالة (شوط، مرحلة، مصدر، دقّة)
     stagecomplete  — اكتمل عدد أشواط المرحلة، وتنتظر تأكيد المستخدم
   ========================================================= */

window.Tracker = (function () {
  var STORAGE_KEY = "umrah_progress_v1";

  var listeners = {};
  var state = {
    stage: "ihram",
    counts: { tawaf: 0, sai: 0 },
    gender: "male",
    source: "manual",     // manual | gps | marker
    accuracy: null,       // بالمتر، أو null إن لم تصل عيّنة بعد
    trackingOn: false,
    awaitingConfirm: false,
    startedAt: null
  };

  /* حالة داخلية لا تُحفظ ولا تُعرَض */
  var gps = {
    watchId: null,
    lastBearing: null,   // آخر سمتٍ من الكعبة إلى المستخدم
    accum: 0,            // مجموع الزوايا المقطوعة في الشوط الجاري
    lastEnd: "safa",     // آخر طرفٍ بلغه الساعي
    lastFixAt: 0
  };

  var markerCooldown = {}; // معرّف الماركر ← آخر وقت احتُسب فيه

  /* ——— الأحداث ——— */
  function on(evt, fn) {
    (listeners[evt] = listeners[evt] || []).push(fn);
  }

  function emit(evt, payload) {
    (listeners[evt] || []).forEach(function (fn) { fn(payload); });
  }

  /* ——— الحفظ والاستئناف ——— */
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        stage: state.stage,
        counts: state.counts,
        gender: state.gender,
        startedAt: state.startedAt
      }));
    } catch (e) { /* التخزين محجوب — يعمل الدليل بلا حفظ */ }
  }

  function loadSaved() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || !window.getRite(data.stage)) return null;
      return data;
    } catch (e) { return null; }
  }

  function clearSaved() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* تجاهُل */ }
  }

  function hasSavedProgress() {
    var d = loadSaved();
    if (!d) return false;
    // تقدّمٌ يُذكر: تجاوز مرحلة الإحرام أو سجّل شوطاً
    return d.stage !== "ihram" || d.counts.tawaf > 0 || d.counts.sai > 0;
  }

  /* ——— الحالة ——— */
  function currentRite() { return window.getRite(state.stage); }

  function currentCount() {
    var rite = currentRite();
    if (!rite || !rite.tracking) return 0;
    return state.counts[rite.tracking] || 0;
  }

  function changed() {
    save();
    emit("change", getState());
  }

  function getState() {
    var rite = currentRite();
    return {
      stage: state.stage,
      rite: rite,
      count: currentCount(),
      total: rite ? rite.count : 0,
      counts: state.counts,
      gender: state.gender,
      source: state.source,
      accuracy: state.accuracy,
      trackingOn: state.trackingOn,
      awaitingConfirm: state.awaitingConfirm
    };
  }

  /**
   * تسجيل شوط. المصدر يُعرَض للمستخدم دائماً فلا يقع عدٌّ خفيّ.
   * لا يتجاوز العدّ سقف المرحلة، وعند بلوغه يُطلَب تأكيد المستخدم.
   */
  function addCircuit(source) {
    var rite = currentRite();
    if (!rite || !rite.tracking) return false;
    if (state.awaitingConfirm) return false;

    var key = rite.tracking;
    if (state.counts[key] >= rite.count) return false;

    state.counts[key] += 1;
    state.source = source;

    if (state.counts[key] >= rite.count) {
      state.awaitingConfirm = true;
      changed();
      emit("stagecomplete", getState());
      return true;
    }

    changed();
    return true;
  }

  function undoCircuit() {
    var rite = currentRite();
    if (!rite || !rite.tracking) return false;
    var key = rite.tracking;
    if (state.counts[key] <= 0) return false;

    state.counts[key] -= 1;
    state.awaitingConfirm = false;
    state.source = "manual";
    gps.accum = 0;
    changed();
    return true;
  }

  /** الانتقال إلى المرحلة التالية بعد تأكيد المستخدم. */
  function advanceStage() {
    var idx = window.getRiteIndex(state.stage);
    if (idx < 0 || idx >= window.RITES.length - 1) return;

    state.stage = window.RITES[idx + 1].id;
    state.awaitingConfirm = false;
    gps.accum = 0;
    gps.lastBearing = null;
    gps.lastEnd = "safa";
    markerCooldown = {};
    changed();
  }

  /** إنهاء مرحلةٍ ليس فيها عدُّ أشواط (كالصلاة وزمزم والحلق). */
  function completeStage() {
    advanceStage();
  }

  function setGender(g) {
    state.gender = g === "female" ? "female" : "male";
    changed();
  }

  /* ——— مصدر ١: تحديد الموقع ——— */

  function handlePosition(pos) {
    var coords = pos.coords;
    state.accuracy = coords.accuracy;
    gps.lastFixAt = Date.now();

    var rite = currentRite();
    if (!rite || !rite.tracking) { changed(); return; }

    // العيّنات الرديئة تُهمَل تماماً بدل أن تُفسد العدّ
    if (coords.accuracy > window.CONFIG.MAX_ACCURACY_M) {
      changed();
      return;
    }

    var here = { lat: coords.latitude, lng: coords.longitude };
    if (rite.tracking === "tawaf") trackTawaf(here);
    else if (rite.tracking === "sai") trackSai(here);

    emit("position", { here: here, accuracy: coords.accuracy });
    changed();
  }

  /**
   * عدّ أشواط الطواف بمراكمة الزاوية المقطوعة حول الكعبة.
   * المراكمة موقَّعة، فالتردّد ذهاباً وإياباً لا يزيد العدّ؛ ولا يُحتسب شوطٌ
   * إلا بإتمام دورةٍ كاملة (٣٦٠°). والاتجاه غير مشروط تفادياً لخطأ الإشارة.
   */
  function trackTawaf(here) {
    var kaaba = window.CONFIG.KAABA;
    var r = window.Geo.distance(kaaba, here);

    // خارج نطاق المطاف المعقول: لا يُعتدّ بالعيّنة
    if (r < window.CONFIG.TAWAF_MIN_R || r > window.CONFIG.TAWAF_MAX_R) {
      gps.lastBearing = null;
      return;
    }

    var b = window.Geo.bearing(kaaba, here);

    if (gps.lastBearing === null) { gps.lastBearing = b; return; }

    var delta = window.Geo.angleDelta(gps.lastBearing, b);
    gps.lastBearing = b;

    // قفزة كبيرة بين عيّنتين متتاليتين = ضجيجٌ لا حركة
    if (Math.abs(delta) > window.CONFIG.MAX_STEP_DEG) return;

    gps.accum += delta;

    if (Math.abs(gps.accum) >= window.CONFIG.LAP_DEG) {
      gps.accum -= Math.sign(gps.accum) * 360;
      addCircuit("gps");
    }
  }

  /**
   * عدّ أشواط السعي بإسقاط الموضع على محور الصفا ← المروة.
   * الشوط يُحتسب ببلوغ طرفٍ مخالفٍ للطرف السابق، فلا يتكرّر العدّ بالتذبذب
   * عند الطرف الواحد. ومن الصفا إلى المروة شوط، ومن المروة إلى الصفا شوطٌ ثانٍ.
   */
  function trackSai(here) {
    var safa = window.CONFIG.SAFA;
    var marwah = window.CONFIG.MARWAH;
    var proj = window.Geo.projectOnSegment(here, safa, marwah);

    // بعيدٌ عن محور المسعى: ليس في السعي
    if (proj.offset > 40) return;

    var zone = window.CONFIG.SAI_END_ZONE;

    if (proj.t >= 1 - zone && gps.lastEnd === "safa") {
      gps.lastEnd = "marwah";
      addCircuit("gps");
    } else if (proj.t <= zone && gps.lastEnd === "marwah") {
      gps.lastEnd = "safa";
      addCircuit("gps");
    }
  }

  function handlePositionError() {
    state.accuracy = null;
    changed();
  }

  function startGeolocation() {
    if (!navigator.geolocation) return false;
    if (gps.watchId !== null) return true;

    gps.watchId = navigator.geolocation.watchPosition(
      handlePosition,
      handlePositionError,
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
    );
    state.trackingOn = true;
    changed();
    return true;
  }

  function stopGeolocation() {
    if (gps.watchId !== null) {
      navigator.geolocation.clearWatch(gps.watchId);
      gps.watchId = null;
    }
    state.trackingOn = false;
    changed();
  }

  /* ——— مصدر ٢: الماركرات ——— */

  /**
   * تسجيل التقاط ماركر. الماركر نقطة تثبيتٍ دقيقة، لكنه قد يُلتقط مرّاتٍ
   * متتالية في وقفةٍ واحدة، فيُمنع ذلك بزمن تبريد.
   */
  function registerAnchor(anchorId) {
    var now = Date.now();
    var last = markerCooldown[anchorId] || 0;
    if (now - last < window.CONFIG.MARKER_COOLDOWN_MS) return false;
    markerCooldown[anchorId] = now;

    var rite = currentRite();
    if (!rite) return false;

    if (rite.tracking === "tawaf" && anchorId === "hajar") {
      gps.accum = 0;
      gps.lastBearing = null;
      return addCircuit("marker");
    }

    if (rite.tracking === "sai") {
      if (anchorId === "marwah" && gps.lastEnd === "safa") {
        gps.lastEnd = "marwah";
        return addCircuit("marker");
      }
      if (anchorId === "safa" && gps.lastEnd === "marwah") {
        gps.lastEnd = "safa";
        return addCircuit("marker");
      }
    }

    // ماركرٌ لا يخصّ المرحلة الجارية: يُبلَّغ به ولا يُغيَّر شيء قسراً
    emit("anchorhint", { anchorId: anchorId, rite: rite });
    return false;
  }

  /* ——— مصدر ٣: العدّاد اليدوي ——— */
  function manualCount() { return addCircuit("manual"); }

  /* ——— وضع المحاكاة: بديلٌ عن الاختبار الميداني ——— */
  function injectPosition(lat, lng, accuracy) {
    handlePosition({
      coords: { latitude: lat, longitude: lng, accuracy: accuracy === undefined ? 8 : accuracy }
    });
  }

  /* ——— التهيئة ——— */
  function init(options) {
    options = options || {};
    if (options.resume) {
      var saved = loadSaved();
      if (saved) {
        state.stage = saved.stage;
        state.counts = { tawaf: saved.counts.tawaf || 0, sai: saved.counts.sai || 0 };
        state.gender = saved.gender || "male";
        state.startedAt = saved.startedAt;
      }
    } else {
      reset();
    }
    if (!state.startedAt) state.startedAt = Date.now();
    changed();
  }

  function reset() {
    state.stage = "ihram";
    state.counts = { tawaf: 0, sai: 0 };
    state.source = "manual";
    state.awaitingConfirm = false;
    state.startedAt = Date.now();
    gps.accum = 0;
    gps.lastBearing = null;
    gps.lastEnd = "safa";
    markerCooldown = {};
    clearSaved();
    changed();
  }

  return {
    on: on,
    init: init,
    reset: reset,
    getState: getState,
    hasSavedProgress: hasSavedProgress,
    setGender: setGender,
    manualCount: manualCount,
    undoCircuit: undoCircuit,
    advanceStage: advanceStage,
    completeStage: completeStage,
    registerAnchor: registerAnchor,
    startGeolocation: startGeolocation,
    stopGeolocation: stopGeolocation,
    injectPosition: injectPosition
  };
})();
