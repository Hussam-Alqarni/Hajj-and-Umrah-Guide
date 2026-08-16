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

console.log("\nتسلسل المراحل");
T.reset();
var order = [];
for (var s = 0; s < 8; s++) { order.push(T.getState().stage); T.advanceStage(); }
check("الترتيب الصحيح", order.join(">"), "ihram>tawaf>prayer>zamzam>sai>halq>done>done");

console.log("\n" + (fail === 0
  ? "نجحت جميع الاختبارات (" + pass + ")"
  : "فشل " + fail + " من " + (pass + fail)) + "\n");

process.exit(fail === 0 ? 0 : 1);
