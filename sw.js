/* =========================================================
   عامل الخدمة — تشغيل الدليل دون إنترنت
   الشبكة داخل الحرم في المواسم مزدحمةٌ إلى حدّ الانقطاع، والمعتمر يحتاج
   الدليل في أشدّ أوقات الزحام. فتُخزَّن الملفّات كلها عند أول زيارة،
   ثم يعمل الموقع بعدها بلا اتصالٍ إطلاقاً.

   استراتيجية الاستجابة: من المخزن أولاً (cache-first) لأن الملفّات ثابتة
   ولا تتغيّر إلا بإصدارٍ جديد؛ فذلك أسرع وأضمن من انتظار شبكةٍ متعثّرة.
   ========================================================= */

var CACHE = "umrah-guide-v1";

var ASSETS = [
  "./",
  "index.html",
  "guide.html",
  "manasik.html",
  "sources.html",

  "css/style.css",
  "css/fonts.css",

  "js/i18n.js",
  "js/rites.js",
  "js/geo.js",
  "js/tracker.js",
  "js/guide.js",

  "vendor/aframe.min.js",
  "vendor/mindar-image-aframe.prod.js",

  "fonts/tajawal-arabic-400-normal.woff2",
  "fonts/tajawal-arabic-500-normal.woff2",
  "fonts/tajawal-arabic-700-normal.woff2",
  "fonts/tajawal-latin-400-normal.woff2",
  "fonts/tajawal-latin-500-normal.woff2",
  "fonts/tajawal-latin-700-normal.woff2",
  "fonts/reem-kufi-arabic-400-normal.woff2",
  "fonts/reem-kufi-arabic-600-normal.woff2",
  "fonts/reem-kufi-latin-400-normal.woff2",
  "fonts/reem-kufi-latin-600-normal.woff2",
  "fonts/amiri-quran-arabic-400-normal.woff2",

  "markers/targets.mind",
  "markers/hajar.png",
  "markers/maqam.png",
  "markers/safa.png",
  "markers/marwah.png",
  "markers/order.json",

  "icons/icon-192.png",
  "icons/icon-512.png",
  "manifest.json"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (cache) {
      /* تُضاف الملفّات فرادى لا دفعةً واحدة: فسقوط ملفٍّ واحد يجب ألّا
         يُسقط التخزين كلّه ويترك المعتمر بلا دليل. */
      return Promise.all(ASSETS.map(function (url) {
        return cache.add(url).catch(function () { /* يُتجاوز المفقود */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;

  if (req.method !== "GET" || !req.url.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;

      return fetch(req).then(function (res) {
        /* ما لم يُخزَّن عند التنصيب (كملفٍّ أُضيف لاحقاً) يُخزَّن عند أول طلب */
        if (res && res.status === 200 && res.type === "basic") {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        /* بلا شبكةٍ وبلا نسخةٍ مخزَّنة: تُعاد الصفحة الأولى للتنقّلات */
        if (req.mode === "navigate") return caches.match("index.html");
        return new Response("", { status: 504, statusText: "غير متاح دون اتصال" });
      });
    })
  );
});
