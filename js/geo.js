/* =========================================================
   دوال هندسية على سطح الأرض
   المسافات هنا صغيرة جداً (عشرات الأمتار) فالتقريب المستوي كافٍ ودقيق،
   عدا haversine فيُبقى على صيغته الكروية لوضوحها.
   ========================================================= */

window.Geo = (function () {
  var R = 6371000; // نصف قطر الأرض بالمتر
  var toRad = function (d) { return (d * Math.PI) / 180; };
  var toDeg = function (r) { return (r * 180) / Math.PI; };

  /** المسافة بين نقطتين بالمتر. */
  function distance(a, b) {
    var dLat = toRad(b.lat - a.lat);
    var dLng = toRad(b.lng - a.lng);
    var lat1 = toRad(a.lat);
    var lat2 = toRad(b.lat);
    var h =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  /** السمت من النقطة الأولى إلى الثانية بالدرجات [0, 360). */
  function bearing(from, to) {
    var lat1 = toRad(from.lat);
    var lat2 = toRad(to.lat);
    var dLng = toRad(to.lng - from.lng);
    var y = Math.sin(dLng) * Math.cos(lat2);
    var x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  }

  /**
   * أقصر فرقٍ زاويٍّ موقَّع بين زاويتين، في المدى (-180, 180].
   * يمنع القفزة الوهمية عند عبور الصفر (359° ← 1° = +2° لا -358°).
   */
  function angleDelta(prev, cur) {
    var d = ((cur - prev + 540) % 360) - 180;
    return d;
  }

  /**
   * إسقاط نقطة على المستقيم الواصل بين نقطتين، والناتج نسبةُ تقدّمٍ t.
   * t = 0 عند a، و t = 1 عند b، والقيم خارج [0,1] تعني تجاوز الطرفين.
   * يُستعمل لقياس موضع الساعي على محور الصفا ← المروة.
   */
  function projectOnSegment(p, a, b) {
    // تحويل إلى إحداثيات مترية مستوية نسبةً إلى a
    var mPerDegLat = 111320;
    var mPerDegLng = 111320 * Math.cos(toRad(a.lat));

    var ax = 0, ay = 0;
    var bx = (b.lng - a.lng) * mPerDegLng;
    var by = (b.lat - a.lat) * mPerDegLat;
    var px = (p.lng - a.lng) * mPerDegLng;
    var py = (p.lat - a.lat) * mPerDegLat;

    var vx = bx - ax, vy = by - ay;
    var lenSq = vx * vx + vy * vy;
    if (lenSq === 0) return { t: 0, offset: 0 };

    var t = (px * vx + py * vy) / lenSq;

    // البعد العمودي عن المحور، يفيد في رفض المواضع البعيدة عن المسعى
    var projX = t * vx, projY = t * vy;
    var offset = Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));

    return { t: t, offset: offset };
  }

  /** توليد نقطة على بُعدٍ وسمتٍ معلومين من نقطة — يُستعمل في وضع المحاكاة. */
  function destination(from, bearingDeg, distanceM) {
    var mPerDegLat = 111320;
    var mPerDegLng = 111320 * Math.cos(toRad(from.lat));
    var rad = toRad(bearingDeg);
    return {
      lat: from.lat + (distanceM * Math.cos(rad)) / mPerDegLat,
      lng: from.lng + (distanceM * Math.sin(rad)) / mPerDegLng
    };
  }

  return {
    distance: distance,
    bearing: bearing,
    angleDelta: angleDelta,
    projectOnSegment: projectOnSegment,
    destination: destination
  };
})();
