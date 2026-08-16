/* =========================================================
   اختبار الواجهة في متصفّح حقيقي
   يشغَّل بـ: NODE_PATH=$(npm root -g) node tools/test-ui.js [العنوان]

   يتحقّق من: تدفّق الإرشاد، والعدّ اليدوي، وحفظ التقدّم واستئنافه،
   وتبديل اللغة والمظهر، وسلامة الصفحات من أخطاء التنفيذ.
   ويحفظ لقطات الشاشة في tools/screenshots.
   ========================================================= */

var fs = require("fs");
var http = require("http");
var path = require("path");
var chromium = require("playwright").chromium;

var ROOT = path.join(__dirname, "..");
var SHOTS = path.join(__dirname, "screenshots");
var BASE = process.argv[2] || null;   // يُمرَّر عنوانٌ خارجي، وإلا شُغِّل خادمٌ داخلي

var TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".mind": "application/octet-stream"
};

/* خادمٌ داخليّ حتى لا يعتمد الاختبار على خادمٍ يُشغَّل يدوياً فينقطع بينه وبينه */
function serve() {
  return new Promise(function (resolve) {
    var server = http.createServer(function (req, res) {
      var rel = decodeURIComponent(req.url.split("?")[0]);
      if (rel === "/") rel = "/index.html";

      var file = path.join(ROOT, path.normalize(rel).replace(/^(\.\.[/\\])+/, ""));
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404); return res.end();
      }

      res.writeHead(200, {
        "Content-Type": TYPES[path.extname(file)] || "application/octet-stream",
        "Service-Worker-Allowed": "/"
      });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, "127.0.0.1", function () { resolve(server); });
  });
}

var pass = 0, fail = 0;
function check(label, actual, expected) {
  var ok = String(actual) === String(expected);
  console.log((ok ? "  ✓ " : "  ✗ ") + label + (ok ? "" : " — " + actual + " (المتوقع: " + expected + ")"));
  ok ? pass++ : fail++;
}

(async function () {
  if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });

  var server = null;
  if (!BASE) {
    server = await serve();
    BASE = "http://127.0.0.1:" + server.address().port;
    console.log("الخادم: " + BASE);
  }

  var browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  var context = await browser.newContext({
    viewport: { width: 390, height: 844 },   // مقاس هاتف
    deviceScaleFactor: 2,
    permissions: []
  });

  var errors = [];
  context.on("weberror", function (e) { errors.push(e.error().message); });

  var page = await context.newPage();
  page.on("pageerror", function (e) { errors.push(e.message); });

  /* ——— الصفحة الأولى ——— */
  console.log("\nالصفحة الأولى");
  await page.goto(BASE + "/index.html", { waitUntil: "networkidle" });

  check("العنوان عربي", await page.getAttribute("html", "lang"), "ar");
  check("الاتجاه من اليمين", await page.getAttribute("html", "dir"), "rtl");
  check("مراحل العمرة الست معروضة", await page.locator("#rites-summary li").count(), 6);

  await page.screenshot({ path: path.join(SHOTS, "01-home-light.png"), fullPage: true });

  /* تبديل المظهر */
  await page.click("[data-action='toggle-theme']");
  await page.waitForTimeout(300);
  check("المظهر تبدّل إلى الداكن", await page.getAttribute("html", "data-theme"), "dark");
  await page.screenshot({ path: path.join(SHOTS, "02-home-dark.png"), fullPage: true });

  /* ثبات المظهر بعد إعادة التحميل */
  await page.reload({ waitUntil: "networkidle" });
  check("المظهر ثابت بعد إعادة التحميل", await page.getAttribute("html", "data-theme"), "dark");

  /* ——— دليل المناسك ——— */
  console.log("\nدليل المناسك");
  await page.goto(BASE + "/manasik.html", { waitUntil: "networkidle" });

  check("سبع بطاقات للمراحل", await page.locator(".rite-block").count(), 7);
  check("فهرس المحتويات مبنيّ", await page.locator("#toc a").count(), 7);

  var duaCount = await page.locator(".dhikr").count();
  check("الأذكار معروضة", duaCount > 8, "true");

  /* الآيات تُقوَّس بقوسي التنصيص المُصحفي، والأذكار غير القرآنية لا تُقوَّس */
  var tawafAyah = await page.locator("#rite-tawaf .dhikr .ayah").nth(1).textContent();
  check("الآية مقوَّسة بقوسي التنصيص المُصحفي", tawafAyah.trim().charAt(0), "﴿");

  var talbiyah = await page.locator("#rite-ihram .dhikr .ayah").first().textContent();
  check("الذكر غير القرآني بلا تقويس", talbiyah.trim().charAt(0) !== "﴿", "true");

  await page.screenshot({ path: path.join(SHOTS, "03-manasik-dark.png"), fullPage: true });

  await page.click("[data-action='toggle-theme']");
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SHOTS, "04-manasik-light.png"), fullPage: true });

  /* ——— الإرشاد الحيّ ——— */
  console.log("\nالإرشاد الحيّ");
  await page.goto(BASE + "/guide.html", { waitUntil: "networkidle" });

  check("شاشة البدء ظاهرة", await page.locator("#screen-start").isVisible(), true);

  await page.click("#btn-start-manual");
  await page.waitForTimeout(400);

  check("واجهة الإرشاد ظهرت", await page.locator("#guide-ui").isVisible(), true);
  check("المرحلة الأولى الإحرام", (await page.textContent("#stage-name")).trim(), "الإحرام والنيّة والتلبية");
  check("حكمها ركن", (await page.textContent("#stage-hukm")).trim(), "ركن");
  check("لا عدّاد أشواط في الإحرام", await page.locator("#counter-row").isVisible(), false);
  check("تنبيه إيقاف التتبّع ظاهر", await page.locator("#tracking-warning").isVisible(), true);

  await page.screenshot({ path: path.join(SHOTS, "05-guide-ihram.png") });

  /* الانتقال إلى الطواف */
  await page.click("#btn-stage-done");
  await page.waitForTimeout(300);
  check("المرحلة الثانية الطواف", (await page.textContent("#stage-name")).trim(), "الطواف بالبيت");
  check("عدّاد الأشواط ظهر", await page.locator("#counter-row").isVisible(), true);
  check("سبع خرزات", await page.locator("#beads .bead").count(), 7);
  check("الشوط الأول", (await page.textContent("#shawt-label")).trim(), "الشوط ١ من ٧");

  /* العدّ اليدوي */
  for (var i = 0; i < 3; i++) { await page.click("#btn-count"); await page.waitForTimeout(60); }
  check("بعد ثلاث ضغطات", (await page.textContent("#shawt-label")).trim(), "الشوط ٤ من ٧");
  check("ثلاث خرزات ممتلئة", await page.locator("#beads .bead.done").count(), 3);

  await page.screenshot({ path: path.join(SHOTS, "06-guide-tawaf.png") });

  /* تنبيه الرمَل: مشروعٌ في الثلاثة الأُولى دون الأربعة الباقية */
  check("تنبيه الشوط ظاهر", await page.locator("#stage-hint").isVisible(), true);
  check("الشوط الرابع بلا رمَل", (await page.textContent("#stage-hint")).indexOf("على عادتك") > -1, true);

  /* لوحة التنبيهات والأذكار */
  await page.click("#btn-duas");
  await page.waitForTimeout(400);
  check("اللوحة مفتوحة", await page.locator("#dua-sheet.open").count(), 1);
  check("أذكار الطواف معروضة", await page.locator("#dua-body .dhikr").count(), 2);

  var sheet = await page.textContent("#dua-body");
  check("التنبيهات الفقهية معروضة أثناء الطواف", sheet.indexOf("الحِجْر") > -1, true);
  check("أحكام الرجال معروضة", sheet.indexOf("الاضطباع") > -1, true);
  check("أحكام النساء غير معروضة للرجل", sheet.indexOf("لا اضطباع على المرأة") === -1, true);

  await page.screenshot({ path: path.join(SHOTS, "07-guide-duas.png") });
  await page.click("#btn-dua-close");
  await page.waitForTimeout(300);

  /* التراجع */
  await page.click("#btn-undo");
  await page.waitForTimeout(150);
  check("التراجع يُنقص شوطاً", (await page.textContent("#shawt-label")).trim(), "الشوط ٣ من ٧");

  /* إكمال الطواف */
  for (var j = 0; j < 5; j++) { await page.click("#btn-count"); await page.waitForTimeout(60); }
  await page.waitForTimeout(300);
  check("شاشة اكتمال المرحلة ظهرت", await page.locator("#screen-stage").isVisible(), true);
  check("تُعلن المرحلة التالية", (await page.textContent("#stage-done-body")).indexOf("ركعتا الطواف") > -1, true);
  await page.screenshot({ path: path.join(SHOTS, "08-guide-stage-complete.png") });

  await page.click("#btn-stage-continue");
  await page.waitForTimeout(300);
  check("انتقل إلى ركعتي الطواف", (await page.textContent("#stage-name")).trim(), "ركعتا الطواف");

  /* ——— حفظ التقدّم واستئنافه ——— */
  console.log("\nحفظ التقدّم");
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  check("شاشة الاستئناف ظهرت", await page.locator("#screen-resume").isVisible(), true);
  await page.screenshot({ path: path.join(SHOTS, "09-guide-resume.png") });

  await page.click("#btn-resume");
  await page.waitForTimeout(300);
  await page.click("#btn-start-manual");
  await page.waitForTimeout(300);
  check("استُؤنفت المرحلة المحفوظة", (await page.textContent("#stage-name")).trim(), "ركعتا الطواف");

  /* ——— وضع المحاكاة: عدّ الطواف بتحديد الموقع ——— */
  console.log("\nوضع المحاكاة");
  await page.goto(BASE + "/guide.html?sim=1", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  if (await page.locator("#screen-resume").isVisible()) {
    await page.click("#btn-fresh");
    await page.waitForTimeout(300);
  }
  await page.click("#btn-start-manual");
  await page.waitForTimeout(300);
  await page.click("#btn-stage-done");   // إلى الطواف
  await page.waitForTimeout(300);

  await page.evaluate(function () {
    var K = window.CONFIG.KAABA;
    for (var i = 0; i <= 7 * 60; i++) {
      var p = window.Geo.destination(K, -i * 6, 25);
      window.Tracker.injectPosition(p.lat, p.lng, 6);
    }
  });
  await page.waitForTimeout(400);
  check("سبعة أشواط بتحديد الموقع", await page.locator("#beads .bead.done").count(), 7);
  check("مصدر العدّ معلَن", (await page.textContent("#source-text")).indexOf("تحديد الموقع") > -1, true);
  await page.screenshot({ path: path.join(SHOTS, "10-guide-sim.png") });

  /* ——— اختيار المرأة يغيّر الأحكام المعروضة ——— */
  console.log("\nأحكام النساء");
  await page.goto(BASE + "/guide.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  if (await page.locator("#screen-resume").isVisible()) {
    await page.click("#btn-fresh");
    await page.waitForTimeout(300);
  }
  await page.click("#btn-female");
  await page.click("#btn-start-manual");
  await page.waitForTimeout(300);
  await page.click("#btn-stage-done");         // إلى الطواف
  await page.waitForTimeout(300);

  check("تنبيه المرأة في الطواف",
    (await page.textContent("#stage-hint")).indexOf("لا اضطباع") > -1, true);

  await page.click("#btn-duas");
  await page.waitForTimeout(400);
  var wSheet = await page.textContent("#dua-body");
  check("أحكام النساء معروضة", wSheet.indexOf("لا اضطباع على المرأة") > -1, true);
  check("أحكام الرجال غير معروضة للمرأة", wSheet.indexOf("تحت إبطه الأيمن") === -1, true);
  await page.screenshot({ path: path.join(SHOTS, "13-guide-women.png") });
  await page.click("#btn-dua-close");

  /* ——— شاشة الحلق والختام ——— */
  console.log("\nالحلق والختام");
  await page.goto(BASE + "/guide.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  if (await page.locator("#screen-resume").isVisible()) {
    await page.click("#btn-fresh");
    await page.waitForTimeout(300);
  }
  await page.click("#btn-start-manual");
  await page.waitForTimeout(300);

  /* القفز إلى مرحلة الحلق */
  await page.evaluate(function () {
    for (var i = 0; i < 5; i++) window.Tracker.completeStage();
  });
  await page.waitForTimeout(400);

  check("المرحلة هي الحلق", await page.evaluate(function () {
    return window.Tracker.getState().stage;
  }), "halq");
  check("شاشة الحلق ظاهرة", await page.locator("#screen-halq").isVisible(), true);
  check("الكاميرا مُطفأة", await page.locator("#camera-layer.camera-on").count(), 0);
  check("التوجيهات معروضة", (await page.textContent("#halq-notes")).indexOf("بعد الفراغ من السعي") > -1, true);
  check("حكمها واجب", (await page.textContent("#halq-hukm")).trim(), "واجب");
  await page.screenshot({ path: path.join(SHOTS, "15-halq.png") });

  await page.click("#btn-halq-done");
  await page.waitForTimeout(400);
  check("شاشة الختام ظاهرة", await page.locator("#screen-done").isVisible(), true);
  check("لا زرّ عمرة جديدة", await page.locator("#btn-again").count(), 0);
  check("مدّة العمرة معروضة", (await page.textContent("#done-duration-text")).length > 1, true);
  await page.screenshot({ path: path.join(SHOTS, "16-done.png") });

  /* ——— عدّاد الوقت ——— */
  console.log("\nعدّاد الوقت");
  var elapsed = await page.evaluate(function () {
    var s = window.Tracker.getState();
    return { started: !!s.startedAt, finished: !!s.finishedAt };
  });
  check("وقت البدء مسجَّل", elapsed.started, true);
  check("وقت الانتهاء مسجَّل فيتجمّد العدّاد", elapsed.finished, true);

  /* عدّاد يعرض الساعات والدقائق دون ثوانٍ */
  await page.goto(BASE + "/guide.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await page.click("#btn-fresh");
  await page.waitForTimeout(200);
  await page.click("#btn-start-manual");
  await page.waitForTimeout(300);

  var shown = (await page.textContent("#elapsed-text")).trim();
  check("صيغة العدّاد ساعات:دقائق", /^[٠-٩0-9]+:[٠-٩0-9]{2}$/.test(shown), true);
  check("العدّاد ظاهر", await page.locator("#elapsed").isVisible(), true);

  /* محاكاة مرور ثمانين دقيقة بتقديم وقت البدء، مع تقدّمٍ يُتيح الاستئناف */
  await page.evaluate(function () {
    var raw = JSON.parse(localStorage.getItem("umrah_progress_v1"));
    raw.startedAt = Date.now() - (80 * 60 * 1000);
    raw.stage = "tawaf";
    raw.counts = { tawaf: 2, sai: 0 };
    localStorage.setItem("umrah_progress_v1", JSON.stringify(raw));
  });
  await page.goto(BASE + "/guide.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await page.click("#btn-resume");
  await page.waitForTimeout(200);
  await page.click("#btn-start-manual");
  await page.waitForTimeout(400);
  check("ثمانون دقيقة تُعرَض ١:٢٠", (await page.textContent("#elapsed-text")).trim(), "١:٢٠");

  /* تمييز العدد في العربية: مفردٌ ومثنّى وجمع قلّةٍ ومفردٌ منصوب */
  var durations = await page.evaluate(function () {
    var out = {};
    [0, 1, 2, 5, 11, 60, 80, 120, 190].forEach(function (min) {
      var s = window.Tracker.getState();
      out[min] = window.__formatDuration(min * 60000);
    });
    return out;
  });
  check("أقلّ من دقيقة", durations["0"], "أقلَّ من دقيقة");
  check("المفرد للواحد", durations["1"], "دقيقةً واحدة");
  check("المثنّى للاثنين", durations["2"], "دقيقتين");
  check("جمع القلّة من ثلاثةٍ إلى عشرة", durations["5"], "٥ دقائق");
  check("المفرد المنصوب فوق العشرة", durations["11"], "١١ دقيقةً");
  check("الساعة الواحدة", durations["60"], "ساعةً واحدة");
  check("ساعةٌ ودقائق", durations["80"], "ساعةً واحدة و٢٠ دقيقةً");
  check("الساعتان", durations["120"], "ساعتين");
  check("ثلاث ساعاتٍ وعشر دقائق", durations["190"], "٣ ساعاتٍ و١٠ دقائق");

  /* ——— اسم زرّ التنبيهات ——— */
  console.log("\nتسمية الأزرار");
  check("الزرّ يجمع التنبيهات والأذكار",
    (await page.textContent("#btn-duas")).trim(), "التنبيهات والأذكار المستحبّة");

  /* ——— التنويه ورابط المصادر ——— */
  console.log("\nالتنويه والمصادر");
  await page.goto(BASE + "/index.html", { waitUntil: "networkidle" });
  var link = page.locator(".notice .link-underline").first();
  check("رابط المصادر موجود", await link.count(), 1);
  check("الرابط يشير إلى صفحة المصادر", await link.getAttribute("href"), "sources.html");
  check("الرابط مسطَّر",
    await link.evaluate(function (el) { return getComputedStyle(el).textDecorationLine; }), "underline");
  check("نصّ التنويه يذكر بناءه على المصادر",
    (await page.textContent(".notice")).indexOf("استناداً إلى") > -1, true);

  await link.click();
  await page.waitForLoadState("networkidle");
  check("النقر ينتقل إلى صفحة المصادر", page.url().indexOf("sources.html") > -1, true);

  /* ——— اللغة الإنجليزية ——— */
  console.log("\nاللغة الإنجليزية");
  await page.goto(BASE + "/index.html", { waitUntil: "networkidle" });
  /* زرّ اللغة يعيد تحميل الصفحة، فيُرصد الانتقال قبل الضغط لا بعده */
  var navigated = page.waitForNavigation({ waitUntil: "networkidle" });
  await page.click("[data-action='toggle-lang']");
  await navigated;
  await page.waitForTimeout(200);
  check("اللغة إنجليزية", await page.getAttribute("html", "lang"), "en");
  check("الاتجاه من اليسار", await page.getAttribute("html", "dir"), "ltr");
  check("العنوان مترجَم", (await page.textContent("h1")).trim(), "Your Umrah companion, step by step");
  await page.screenshot({ path: path.join(SHOTS, "11-home-english.png"), fullPage: true });

  await page.goto(BASE + "/manasik.html", { waitUntil: "networkidle" });
  var enAyah = await page.locator(".dhikr .ayah").first().textContent();
  check("نصّ الآية عربي في الواجهة الإنجليزية", enAyah.indexOf("رَبَّنَا") > -1 || enAyah.indexOf("لَبَّيْكَ") > -1, true);
  await page.screenshot({ path: path.join(SHOTS, "12-manasik-english.png"), fullPage: true });

  /* ——— لا اعتماد على خدمةٍ خارجية ——— */
  console.log("\nالاستقلال عن الشبكة الخارجية");
  var external = [];
  page.on("request", function (r) {
    if (r.url().indexOf(BASE) !== 0 && r.url().indexOf("data:") !== 0) external.push(r.url());
  });
  await page.goto(BASE + "/manasik.html", { waitUntil: "networkidle" });
  check("لا طلبات إلى خوادم خارجية", external.length === 0 ? 0 : external.join(" | "), 0);

  var fontLoaded = await page.evaluate(function () {
    return document.fonts.check('1rem "Amiri Quran"');
  });
  check("خط المصحف محمَّل محلياً", fontLoaded, true);

  /* ——— العمل دون إنترنت ——— */
  console.log("\nالعمل دون إنترنت");
  await page.goto(BASE + "/index.html", { waitUntil: "networkidle" });
  await page.evaluate(function () {
    return navigator.serviceWorker.ready.then(function () { return null; });
  });
  await page.waitForTimeout(2500); // مهلة تخزين الملفّات

  /* عامل الخدمة مسجَّلٌ في هذا السياق، فيُقطَع الاتصال عنه هو لا عن سياقٍ
     جديد؛ إذ لكل سياقٍ تخزينه المستقلّ ولا يرث تسجيل غيره. */
  await context.setOffline(true);

  await page.goto(BASE + "/index.html", { waitUntil: "domcontentloaded" });
  check("الصفحة الأولى تفتح دون اتصال", (await page.textContent("h1")).length > 5, true);

  await page.goto(BASE + "/guide.html", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  /* تظهر شاشة البدء أو شاشة الاستئناف بحسب وجود تقدّمٍ محفوظ، وأيّهما ظهرت
     فقد عملت الصفحة وجافاسكربتها دون اتصال. */
  var started = await page.locator("#screen-start").isVisible();
  var resuming = await page.locator("#screen-resume").isVisible();
  check("شاشة الإرشاد تفتح دون اتصال", started || resuming, true);

  /* المكتبات المستضافة محلياً (٣ م.ب) تُحمَّل من المخزن لا من الشبكة */
  check("مكتبة A-Frame محمَّلة دون اتصال",
    await page.evaluate(function () { return typeof window.AFRAME !== "undefined"; }), true);
  check("مكتبة MindAR محمَّلة دون اتصال",
    await page.evaluate(function () {
      return !!(window.AFRAME && window.AFRAME.components["mindar-image"]);
    }), true);

  await page.goto(BASE + "/manasik.html", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  check("دليل المناسك يُبنى دون اتصال", await page.locator(".rite-block").count(), 7);
  check("الأذكار تُعرَض دون اتصال", (await page.locator(".dhikr").count()) > 8, true);
  await page.screenshot({ path: path.join(SHOTS, "14-offline.png") });

  await context.setOffline(false);

  /* ——— أخطاء التنفيذ ——— */
  console.log("\nسلامة التنفيذ");
  check("لا أخطاء جافاسكربت", errors.length === 0 ? 0 : errors.join(" | "), 0);

  await browser.close();
  if (server) server.close();

  console.log("\n" + (fail === 0
    ? "نجحت جميع اختبارات الواجهة (" + pass + ")"
    : "فشل " + fail + " من " + (pass + fail)));
  console.log("اللقطات في tools/screenshots\n");

  process.exit(fail === 0 ? 0 : 1);
})();
