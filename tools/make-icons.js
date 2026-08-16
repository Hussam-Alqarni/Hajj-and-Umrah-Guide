/* =========================================================
   توليد أيقونات التطبيق
   يشغَّل بـ: NODE_PATH=$(npm root -g) node tools/make-icons.js

   الأيقونة نقشٌ هندسيٌّ إسلامي: نجمةٌ ثمانية داخل إطار، بألوان هوية
   الحرم (أخضر وذهبي)، بلا تصويرٍ لمعلَمٍ أو كائن.
   ========================================================= */

var fs = require("fs");
var path = require("path");
var chromium = require("playwright").chromium;

var OUT = path.join(__dirname, "..", "icons");
var SIZES = [192, 512];

function svg() {
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">',
    '<rect width="512" height="512" fill="#0f5132"/>',
    '<g fill="none" stroke="#b08d3f" stroke-width="10">',
    '<rect x="56" y="56" width="400" height="400" rx="24"/>',
    "</g>",
    '<polygon points="256,96 352,160 416,256 352,352 256,416 160,352 96,256 160,160" fill="#f7f5f0"/>',
    '<polygon points="256,160 316,200 352,256 316,312 256,352 200,312 160,256 200,200" fill="#0f5132"/>',
    '<circle cx="256" cy="256" r="46" fill="#b08d3f"/>',
    "</svg>"
  ].join("");
}

(async function () {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  var browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  var markup = svg();

  fs.writeFileSync(path.join(OUT, "icon.svg"), markup);

  for (var i = 0; i < SIZES.length; i++) {
    var size = SIZES[i];
    var page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(
      '<body style="margin:0"><div style="width:' + size + "px;height:" + size + 'px">' +
      markup.replace('width="512" height="512"', 'width="' + size + '" height="' + size + '"') +
      "</div></body>",
      { waitUntil: "load" }
    );
    await page.screenshot({ path: path.join(OUT, "icon-" + size + ".png") });
    await page.close();
    console.log("✓ icon-" + size + ".png");
  }

  await browser.close();
})();
