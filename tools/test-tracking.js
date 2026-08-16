/* =========================================================
   اختبار محرّك التتبّع خارج المتصفّح
   يشغَّل بـ: node tools/test-tracking.js
   يحاكي المشي في المطاف والمسعى، ويتحقّق من صحّة العدّ ومن رفض الضجيج.
   ========================================================= */

var path = require("path");

/* بيئة متصفّح مصغّرة تكفي لتحميل الملفّات */
global.window = global;
global.localStorage = { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} };
global.document = { documentElement: {}, addEventListener: function () {}, querySelectorAll: function () { return []; } };
global.navigator = {};
global.matchMedia = function () { return { matches: false }; };

var root = path.join(__dirname, "..");
require(path.join(root, "js/i18n.js"));
require(path.join(root, "js/rites.js"));
require(path.join(root, "js/geo.js"));
require(path.join(root, "js/tracker.js"));

var T = window.Tracker;
var C = window.CONFIG;
var G = window.Geo;

var pass = 0, fail = 0;

function check(label, actual, expected) {
  var ok = actual === expected;
  console.log((ok ? "  ✓ " : "  ✗ ") + label + " — " + actual + (ok ? "" : " (المتوقع: " + expected + ")"));
  ok ? pass++ : fail++;
}

/* ——— أدوات المحاكاة ——— */

function walkTawaf(laps, radius, stepDeg) {
  var steps = Math.round((laps * 360) / stepDeg);
  for (var i = 0; i <= steps; i++) {
    var p = G.destination(C.KAABA, -i * stepDeg, radius);
    T.injectPosition(p.lat, p.lng, 6);
  }
}

/** المشي حول الكعبة حتى زاويةٍ معيّنة دون إتمام الدورة. */
function walkTawafPartial(degrees, radius, stepDeg) {
  walkTawafFrom(0, degrees, radius, stepDeg);
}

/** المشي بين زاويتين مع إبقاء التسلسل متّصلاً كما يمشي الطائف. */
function walkTawafFrom(fromDeg, toDeg, radius, stepDeg) {
  for (var a = fromDeg; a <= toDeg; a += stepDeg) {
    var p = G.destination(C.KAABA, -a, radius);
    T.injectPosition(p.lat, p.lng, 6);
  }
}

/** موضعٌ على محور المسعى بنسبة تقدّمٍ من الصفا إلى المروة. */
function saiPoint(t) {
  return {
    lat: C.SAFA.lat + (C.MARWAH.lat - C.SAFA.lat) * t,
    lng: C.SAFA.lng + (C.MARWAH.lng - C.SAFA.lng) * t
  };
}

function walkSaiFrom(fromT, toT) {
  var steps = 24;
  for (var i = 0; i <= steps; i++) {
    var p = saiPoint(fromT + (toT - fromT) * (i / steps));
    T.injectPosition(p.lat, p.lng, 6);
  }
}

function walkSaiPartial(toT) {
  walkSaiFrom(0, toT);
}

function walkSai(legs) {
  var steps = 24;
  for (var leg = 0; leg < legs; leg++) {
    for (var i = 0; i <= steps; i++) {
      var frac = leg % 2 === 0 ? i / steps : 1 - i / steps;
      T.injectPosition(
        C.SAFA.lat + (C.MARWAH.lat - C.SAFA.lat) * frac,
        C.SAFA.lng + (C.MARWAH.lng - C.SAFA.lng) * frac,
        6
      );
    }
  }
}

/* زمن التبريد عشرون ثانيةً حقيقية، فيُعطَّل مؤقّتاً لاختبار المسح المتكرّر */
function markerCooldownBypass() {
  C.MARKER_COOLDOWN_MS = 0;
}

function goToStage(id) {
  C.MARKER_COOLDOWN_MS = 20000;
  T.reset();
  var guard = 0;
  while (T.getState().stage !== id && guard++ < 20) T.advanceStage();
}

/* ——— الاختبارات ——— */

console.log("\nالطواف");
goToStage("tawaf");
walkTawaf(7, 25, 6);
check("سبعة أشواط حول الكعبة", T.getState().counts.tawaf, 7);
check("ينتظر تأكيد المستخدم", T.getState().awaitingConfirm, true);
check("لا يتجاوز السبعة بعد مزيد من الدوران", (walkTawaf(2, 25, 6), T.getState().counts.tawaf), 7);

console.log("\nالطواف من مسافات مختلفة");
goToStage("tawaf");
walkTawaf(3, 60, 4);
check("ثلاثة أشواط على بُعد 60م", T.getState().counts.tawaf, 3);

console.log("\nرفض الضجيج");
goToStage("tawaf");
for (var i = 0; i < 60; i++) {
  var p = G.destination(C.KAABA, Math.random() * 360, 200 + Math.random() * 400);
  T.injectPosition(p.lat, p.lng, 8);
}
check("المواضع البعيدة لا تُعدّ", T.getState().counts.tawaf, 0);

goToStage("tawaf");
for (var j = 0; j <= 7 * 60; j++) {
  var q = G.destination(C.KAABA, -j * 6, 25);
  T.injectPosition(q.lat, q.lng, 80); // دقة رديئة
}
check("العيّنات رديئة الدقّة تُهمَل", T.getState().counts.tawaf, 0);

console.log("\nالسعي");
goToStage("sai");
walkSai(7);
check("سبعة أشواط بين الصفا والمروة", T.getState().counts.sai, 7);

goToStage("sai");
walkSai(1);
check("الشوط الأول من الصفا إلى المروة", T.getState().counts.sai, 1);

/* التذبذب عند طرفٍ واحد يجب ألّا يزيد العدّ */
goToStage("sai");
walkSai(1);
for (var k = 0; k < 30; k++) {
  var frac = 0.97 + (k % 2) * 0.02;
  T.injectPosition(
    C.SAFA.lat + (C.MARWAH.lat - C.SAFA.lat) * frac,
    C.SAFA.lng + (C.MARWAH.lng - C.SAFA.lng) * frac,
    6
  );
}
check("التذبذب عند المروة لا يزيد العدّ", T.getState().counts.sai, 1);

console.log("\nالعدّاد اليدوي");
goToStage("tawaf");
T.manualCount(); T.manualCount(); T.manualCount();
check("ثلاث ضغطات يدوية", T.getState().counts.tawaf, 3);
T.undoCircuit();
check("التراجع", T.getState().counts.tawaf, 2);
T.undoCircuit(); T.undoCircuit(); T.undoCircuit();
check("التراجع لا ينزل تحت الصفر", T.getState().counts.tawaf, 0);

console.log("\nالماركرات");
goToStage("tawaf");
T.registerAnchor("hajar");
check("أول مسحة تُثبّت البداية ولا تُحتسب شوطاً", T.getState().counts.tawaf, 0);
T.registerAnchor("hajar");
check("زمن التبريد يمنع العدّ المضاعف", T.getState().counts.tawaf, 0);
T.registerAnchor("safa");
check("ماركر لا يخصّ المرحلة لا يغيّر شيئاً", T.getState().counts.tawaf, 0);

/* بلا تحديد موقع يُعتمد على المسح وحده: كل مسحةٍ بعد الأولى شوط */
goToStage("tawaf");
T.registerAnchor("hajar");                       // البداية
for (var m = 0; m < 7; m++) {
  markerCooldownBypass();
  T.registerAnchor("hajar");
}
check("سبع مسحاتٍ بعد البداية = سبعة أشواط", T.getState().counts.tawaf, 7);

console.log("\nالتراجع في السعي");
goToStage("sai");
walkSai(1);
check("شوط واحد", T.getState().counts.sai, 1);
T.undoCircuit();
check("بعد التراجع", T.getState().counts.sai, 0);
walkSai(1);
check("إعادة الشوط نفسه تُنتج شوطاً واحداً لا اثنين", T.getState().counts.sai, 1);

goToStage("sai");
walkSai(3);
T.undoCircuit();
walkSai(1);
check("التراجع في منتصف السعي ثم المتابعة", T.getState().counts.sai, 3);

console.log("\nنطاق الطواف");
goToStage("tawaf");
walkTawaf(2, 120, 4);
check("الطواف في الأدوار العليا يُحتسب", T.getState().counts.tawaf, 2);

/* =========================================================
   تكامل المصادر الثلاثة
   المصادر تعمل معاً في وقتٍ واحد لا بالتناوب، فيجب ألّا يُعيد مصدرٌ
   عدَّ ما عدّه غيره، ولا أن يُسقط شوطاً ظنّاً أن غيره عدّه.
   ========================================================= */

console.log("\nتكامل: يدوي مع تحديد الموقع (الطواف)");
goToStage("tawaf");
walkTawafPartial(348, 25, 6);                 // قارب إتمام الدورة
check("لم يُحتسب شيءٌ قبل إتمام الدورة", T.getState().counts.tawaf, 0);
T.manualCount();                              // ضغط يدوياً عند الحجر
check("الضغط اليدوي يسجّل الشوط", T.getState().counts.tawaf, 1);
walkTawafFrom(348, 372, 25, 6);               // أكمل الدورة مشياً
check("الموقع لا يُعيد عدّ ما عدّه اليدوي", T.getState().counts.tawaf, 1);

console.log("\nتكامل: يدوي مع تحديد الموقع (السعي)");
goToStage("sai");
walkSaiPartial(0.85);                          // قارب المروة
T.manualCount();                               // ضغط يدوياً عند بلوغه
check("الضغط اليدوي يسجّل الشوط", T.getState().counts.sai, 1);
walkSaiFrom(0.85, 1.0);                        // أتمّ الوصول
check("الموقع لا يُعيد عدّ ما عدّه اليدوي", T.getState().counts.sai, 1);

console.log("\nتكامل: ماركر مع تحديد الموقع (الطواف)");
goToStage("tawaf");
T.registerAnchor("hajar");                     // تثبيت البداية
walkTawaf(1, 25, 6);
check("الموقع يعدّ الدورة الأولى", T.getState().counts.tawaf, 1);
C.MARKER_COOLDOWN_MS = 0;
T.registerAnchor("hajar");                     // مسح عند الحجر بعد الدورة
check("الماركر لا يُعيد عدّ الدورة نفسها", T.getState().counts.tawaf, 1);

console.log("\nتكامل: ماركر ثم موقع في السعي");
goToStage("sai");
C.MARKER_COOLDOWN_MS = 0;
T.registerAnchor("marwah");                    // مسح عند المروة
check("الماركر يسجّل الشوط الأول", T.getState().counts.sai, 1);
walkSaiFrom(0.9, 1.0);                         // الموقع يبلغ المروة أيضاً
check("الموقع لا يُعيد عدّه", T.getState().counts.sai, 1);
walkSaiFrom(1.0, 0.0);                         // رجع إلى الصفا
check("الرجوع إلى الصفا شوطٌ ثانٍ", T.getState().counts.sai, 2);

console.log("\nتكامل: الضغط اليدوي والمسح في الموضع نفسه");
goToStage("tawaf");
C.MARKER_COOLDOWN_MS = 0;
walkTawafPartial(348, 25, 6);
T.manualCount();
T.registerAnchor("hajar");                     // مسحٌ في الموضع نفسه بلا مشي
check("المسح في موضع الضغط اليدوي لا يُضاعف العدّ", T.getState().counts.tawaf, 1);

console.log("\nتكامل: مسارٌ كاملٌ مختلط");
goToStage("tawaf");
C.MARKER_COOLDOWN_MS = 0;
var deg = 0;
T.registerAnchor("hajar");                     // البداية بالماركر — لا تُحتسب

walkTawafFrom(deg, deg + 720, 25, 6); deg += 720;   // شوطان بالموقع
check("شوطان بالموقع", T.getState().counts.tawaf, 2);

T.manualCount();                                     // شوطٌ يدوي
check("وشوطٌ يدوي", T.getState().counts.tawaf, 3);

/* مشى أكثر الدورة ثم بلغ الحجر فمسح الماركر: الماركر أضبط في تحديد
   حدّ الشوط من تقدير الموقع، فيُحتسب به. */
walkTawafFrom(deg, deg + 340, 25, 6); deg += 340;
check("لم تكتمل الدورة بالموقع بعد", T.getState().counts.tawaf, 3);
T.registerAnchor("hajar");
check("الماركر يُتمّ الشوط الرابع", T.getState().counts.tawaf, 4);

walkTawafFrom(deg, deg + 1080, 25, 6); deg += 1080;  // ثلاثة بالموقع
check("سبعة أشواط من مصادر مختلطة", T.getState().counts.tawaf, 7);
check("اكتملت المرحلة", T.getState().awaitingConfirm, true);
check("لا يتجاوز السبعة بمزيدٍ من المشي",
  (walkTawaf(2, 25, 6), T.getState().counts.tawaf), 7);
check("ولا بضغطٍ يدوي", (T.manualCount(), T.getState().counts.tawaf), 7);
check("ولا بمسح ماركر", (T.registerAnchor("hajar"), T.getState().counts.tawaf), 7);

console.log("\nتكامل: التراجع وسط مسارٍ مختلط");
goToStage("tawaf");
C.MARKER_COOLDOWN_MS = 0;
T.registerAnchor("hajar");
walkTawaf(3, 25, 6);
T.undoCircuit();
check("التراجع بعد عدٍّ بالموقع", T.getState().counts.tawaf, 2);
walkTawaf(1, 25, 6);
check("المتابعة بعد التراجع تُنتج شوطاً واحداً", T.getState().counts.tawaf, 3);

console.log("\nتسلسل المراحل");
T.reset();
var order = [];
for (var s = 0; s < 8; s++) { order.push(T.getState().stage); T.advanceStage(); }
check("الترتيب الصحيح", order.join(">"), "ihram>tawaf>prayer>zamzam>sai>halq>done>done");

console.log("\n" + (fail === 0
  ? "نجحت جميع الاختبارات (" + pass + ")"
  : "فشل " + fail + " من " + (pass + fail)) + "\n");

process.exit(fail === 0 ? 0 : 1);
