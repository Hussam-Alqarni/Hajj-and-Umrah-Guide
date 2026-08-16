/* =========================================================
   توليد صور الماركرات
   يشغَّل بـ: NODE_PATH=$(npm root -g) node tools/make-markers.js

   أربع صور هندسية عالية التباين، لكل معلَمٍ نقشٌ مختلفٌ عن الآخر
   اختلافاً بيّناً، لأن خوارزميات تتبّع الصور تعتمد على تمايز المعالم
   الزاوية. والزخرفة إسلامية هندسية لا تصويرية.
   ========================================================= */

var fs = require("fs");
var path = require("path");
var chromium = require("playwright").chromium;

var SIZE = 512;
var OUT = path.join(__dirname, "..", "markers");

var MARKERS = [
  {
    id: "hajar",
    label: "الحجر الأسود",
    latin: "AL-HAJAR AL-ASWAD",
    /* نجمة ثمانية متشابكة داخل إطار مربّع */
    art: [
      '<rect x="56" y="56" width="400" height="400" fill="none" stroke="#000" stroke-width="14"/>',
      '<rect x="86" y="86" width="340" height="340" fill="none" stroke="#000" stroke-width="6"/>',
      '<polygon points="256,110 342,170 402,256 342,342 256,402 170,342 110,256 170,170" fill="#000"/>',
      '<polygon points="256,160 316,196 352,256 316,316 256,352 196,316 160,256 196,196" fill="#fff"/>',
      '<circle cx="256" cy="256" r="54" fill="#000"/>'
    ]
  },
  {
    id: "maqam",
    label: "مقام إبراهيم",
    latin: "MAQAM IBRAHIM",
    /* عقد مدبَّب داخل دوائر متحدة المركز */
    art: [
      '<rect x="56" y="56" width="400" height="400" fill="none" stroke="#000" stroke-width="14"/>',
      '<circle cx="256" cy="256" r="168" fill="none" stroke="#000" stroke-width="10"/>',
      '<circle cx="256" cy="256" r="126" fill="#000"/>',
      '<path d="M256 150 L332 246 L332 362 L180 362 L180 246 Z" fill="#fff"/>',
      '<path d="M256 196 L300 252 L300 330 L212 330 L212 252 Z" fill="#000"/>',
      '<rect x="140" y="380" width="232" height="22" fill="#000"/>'
    ]
  },
  {
    id: "safa",
    label: "الصفا",
    latin: "AS-SAFA",
    /* أشرطة قطرية متبادلة مع مثلّث دالٍّ على الارتفاع */
    art: [
      '<rect x="56" y="56" width="400" height="400" fill="none" stroke="#000" stroke-width="14"/>',
      '<polygon points="256,120 396,392 116,392" fill="#000"/>',
      '<polygon points="256,206 330,352 182,352" fill="#fff"/>',
      '<rect x="96" y="96" width="60" height="60" fill="#000"/>',
      '<rect x="356" y="96" width="60" height="60" fill="#000"/>',
      '<rect x="96" y="410" width="60" height="16" fill="#000"/>',
      '<rect x="356" y="410" width="60" height="16" fill="#000"/>'
    ]
  },
  {
    id: "marwah",
    label: "المروة",
    latin: "AL-MARWAH",
    /* شبكة معيّنات — تباينٌ زاويٌّ مختلفٌ تماماً عن الصفا */
    art: [
      '<rect x="56" y="56" width="400" height="400" fill="none" stroke="#000" stroke-width="14"/>',
      '<polygon points="256,96 416,256 256,416 96,256" fill="#000"/>',
      '<polygon points="256,166 346,256 256,346 166,256" fill="#fff"/>',
      '<polygon points="256,216 296,256 256,296 216,256" fill="#000"/>',
      '<circle cx="256" cy="120" r="20" fill="#000"/>',
      '<circle cx="256" cy="392" r="20" fill="#000"/>',
      '<circle cx="120" cy="256" r="20" fill="#000"/>',
      '<circle cx="392" cy="256" r="20" fill="#000"/>'
    ]
  }
];

function svgFor(m) {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + SIZE + '" height="' + SIZE + '" viewBox="0 0 512 512">' +
    '<rect width="512" height="512" fill="#fff"/>' +
    m.art.join("") +
    "</svg>"
  );
}

(async function () {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  var browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  var page = await browser.newPage({ viewport: { width: SIZE, height: SIZE } });

  for (var i = 0; i < MARKERS.length; i++) {
    var m = MARKERS[i];
    var svg = svgFor(m);

    fs.writeFileSync(path.join(OUT, m.id + ".svg"), svg);

    await page.setContent(
      '<body style="margin:0">' + svg + "</body>",
      { waitUntil: "load" }
    );
    await page.screenshot({ path: path.join(OUT, m.id + ".png"), omitBackground: false });

    console.log("✓ " + m.id + ".png — " + m.label);
  }

  await browser.close();

  fs.writeFileSync(
    path.join(OUT, "order.json"),
    JSON.stringify({
      note: "ترتيب الماركرات في ملف targets.mind يجب أن يطابق هذا الترتيب تماماً",
      order: MARKERS.map(function (m) { return m.id; })
    }, null, 2) + "\n"
  );

  console.log("\nتمّ توليد " + MARKERS.length + " ماركرات في مجلّد markers/");
})();
