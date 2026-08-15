/* =========================================================
   تصريف ملف الماركرات targets.mind
   يشغَّل بـ: NODE_PATH=$(npm root -g) node tools/compile-targets.js [مجلّد dist]

   مُصرِّف MindAR لا يعمل في Node مباشرةً لأنه يحتاج بيئة متصفّح،
   فيُشغَّل هنا داخل Chromium بلا واجهة. وحزمة mind-ar تُوزَّع وحدةً
   من نوع ES تستورد ملفّاتٍ مجاورة، فلا يكفي حقنها نصّاً؛ ولذلك تُقدَّم
   من خادمٍ محلّي مؤقّت.

   للحصول على مجلّد dist:
     curl -sSLo mind-ar.tgz https://registry.npmjs.org/mind-ar/-/mind-ar-1.2.2.tgz
     tar -xzf mind-ar.tgz            # الناتج في package/dist

   ترتيب الصور هنا هو ترتيب targetIndex في js/guide.js، فلا يُغيَّر.
   ========================================================= */

var fs = require("fs");
var http = require("http");
var path = require("path");
var chromium = require("playwright").chromium;

var ORDER = ["hajar", "maqam", "safa", "marwah"];
var MARKERS_DIR = path.join(__dirname, "..", "markers");
var DIST = process.argv[2];

if (!DIST || !fs.existsSync(path.join(DIST, "mindar-image.prod.js"))) {
  console.error("مرِّر مسار مجلّد dist الخاص بحزمة mind-ar.");
  console.error("مثال: node tools/compile-targets.js /tmp/mind-ar/package/dist");
  process.exit(2);
}

var TYPES = { ".js": "text/javascript", ".html": "text/html", ".wasm": "application/wasm" };

/* خادم محلّي يقدّم ملفّات dist ليعمل الاستيراد النسبي داخل الوحدة */
function serve(dir) {
  return new Promise(function (resolve) {
    var server = http.createServer(function (req, res) {
      var name = decodeURIComponent(req.url.split("?")[0]);
      if (name === "/") {
        res.writeHead(200, { "Content-Type": "text/html" });
        return res.end('<!doctype html><meta charset="utf-8"><body></body>');
      }
      var file = path.join(dir, path.basename(name));
      if (!fs.existsSync(file)) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, "127.0.0.1", function () { resolve(server); });
  });
}

(async function () {
  var server = await serve(DIST);
  var port = server.address().port;
  var base = "http://127.0.0.1:" + port;

  var browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  var page = await browser.newPage();
  page.setDefaultTimeout(900000); // التصريف بطيء بطبعه
  page.on("console", function (m) { console.log("  " + m.text()); });
  page.on("pageerror", function (e) { console.log("  خطأ: " + e.message); });

  await page.goto(base + "/", { waitUntil: "load" });

  console.log("تحميل مُصرِّف MindAR ...");
  await page.addScriptTag({ url: "/mindar-image.prod.js", type: "module" });
  await page.waitForFunction("window.MINDAR && window.MINDAR.IMAGE", null, { timeout: 60000 });

  var images = ORDER.map(function (id) {
    return fs.readFileSync(path.join(MARKERS_DIR, id + ".png")).toString("base64");
  });

  console.log("تصريف " + images.length + " صور — قد يستغرق دقائق ...");

  var bytes = await page.evaluate(async function (imgs) {
    function load(b64) {
      return new Promise(function (resolve, reject) {
        var img = new Image();
        img.onload = function () { resolve(img); };
        img.onerror = reject;
        img.src = "data:image/png;base64," + b64;
      });
    }

    var loaded = [];
    for (var i = 0; i < imgs.length; i++) loaded.push(await load(imgs[i]));

    var compiler = new window.MINDAR.IMAGE.Compiler();
    var last = -1;
    await compiler.compileImageTargets(loaded, function (p) {
      var step = Math.floor(p / 25) * 25;
      if (step !== last) { last = step; console.log("التقدّم: " + step + "%"); }
    });

    return Array.from(new Uint8Array(await compiler.exportData()));
  }, images);

  await browser.close();
  server.close();

  var out = path.join(MARKERS_DIR, "targets.mind");
  fs.writeFileSync(out, Buffer.from(bytes));

  console.log("\n✓ تمّ إنشاء markers/targets.mind (" + (bytes.length / 1024).toFixed(1) + " ك.ب)");
  console.log("  الترتيب: " + ORDER.join(" ، "));
})();
