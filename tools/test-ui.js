/* =========================================================
   اختبار الواجهة في متصفّح حقيقي
   يشغَّل بـ: NODE_PATH=$(npm root -g) node tools/test-ui.js [العنوان]

   يتحقّق من: تدفّق الإرشاد، والعدّ اليدوي، وحفظ التقدّم واستئنافه،
   وتبديل اللغة والمظهر، وسلامة الصفحات من أخطاء التنفيذ.
   ويحفظ لقطات الشاشة في tools/screenshots.
   ========================================================= */

var fs = require("fs");
var path = require("path");
var chromium = require("playwright").chromium;

var BASE = process.argv[2] || "http://127.0.0.1:8099";
var SHOTS = path.join(__dirname, "screenshots");

var pass = 0, fail = 0;
function check(label, actual, expected) {
  var ok = String(actual) === String(expected);
  console.log((ok ? "  ✓ " : "  ✗ ") + label + (ok ? "" : " — " + actual + " (المتوقع: " + expected + ")"));
  ok ? pass++ : fail++;
}

(async function () {
  if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });

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

  /* لوحة الأذكار */
  await page.click("#btn-duas");
  await page.waitForTimeout(400);
  check("لوحة الأذكار مفتوحة", await page.locator("#dua-sheet.open").count(), 1);
  check("أذكار الطواف معروضة", await page.locator("#dua-body .dhikr").count(), 2);
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

  /* ——— أخطاء التنفيذ ——— */
  console.log("\nسلامة التنفيذ");
  check("لا أخطاء جافاسكربت", errors.length === 0 ? 0 : errors.join(" | "), 0);

  await browser.close();

  console.log("\n" + (fail === 0
    ? "نجحت جميع اختبارات الواجهة (" + pass + ")"
    : "فشل " + fail + " من " + (pass + fail)));
  console.log("اللقطات في tools/screenshots\n");

  process.exit(fail === 0 ? 0 : 1);
})();
