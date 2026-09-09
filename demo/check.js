// 시연 데이터 검사기 (DESIGN.md §14). node demo/check.js [YYYY-MM-DD]
// index.html에서 앱의 분석기·키 함수를 선언 이름으로 잘라내 그대로 실행한다. 다시 구현하지 않는다.
// 1) 문장 라이브러리: 상황 문장은 감정이 잡히면 안 되고, 마음 문장은 어떤 상황 뒤에 와도 그 어휘 하나만 잡혀야 한다.
// 2) 생성 결과: 어휘 수가 성격표와 같고, 살펴봐주세요는 정확히 둘이고, 바다 색·반딧불·광장이 설계대로인지.
var fs = require("fs"), path = require("path"), vm = require("vm");

function slice(lines, startRe, endRe) {
  var s = -1, e = -1;
  for (var i = 0; i < lines.length; i++) {
    if (s < 0 && startRe.test(lines[i])) s = i;
    else if (s >= 0 && endRe.test(lines[i])) { e = i; break; }
  }
  if (s < 0 || e < 0) throw new Error("slice not found: " + startRe);
  return lines.slice(s, e).join("\n");
}
function loadApp() {
  var lines = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8").split("\n");
  var src = [
    slice(lines, /^function normalizeKorean\(/, /^const FONT = /),
    slice(lines, /^const SITUATION_MAP = /, /^var NEED_OPTIONS = /),
    slice(lines, /^var SAD_EMOS = /, /^var CREATURES = /),
    slice(lines, /^var CAUSAL_ENDINGS = /, /^var ISLE = \{/),
    "__out = { analyzeEntry: analyzeEntry, EMOTIONS_28: EMOTIONS_28, SAD_EMOS: SAD_EMOS, CESD_KEYWORDS: CESD_KEYWORDS, labelKey: labelKey, anonKey: anonKey, entryKey: entryKey, dayStamp: dayStamp, fmtDate: fmtDate, hashSeed: hashSeed, mulberry32: mulberry32, plazaNameHit: plazaNameHit, extractSituations: extractSituations, QC: QC };"
  ].join("\n");
  var ctx = { firebase: { database: function () { return { ref: function () { throw new Error("no-fb"); } }; } }, console: console, setTimeout: setTimeout, Promise: Promise, Date: Date, Math: Math, JSON: JSON, String: String, Number: Number, Object: Object, Array: Array, Set: Set, Map: Map, RegExp: RegExp, Error: Error, parseInt: parseInt, parseFloat: parseFloat, isNaN: isNaN, encodeURIComponent: encodeURIComponent, TextEncoder: TextEncoder, __out: null };
  vm.createContext(ctx);
  vm.runInContext(src, ctx, { filename: "index.html(slice)" });
  return ctx.__out;
}

var app = loadApp();
var GEN = require("./seed-gen.js"), DATA = GEN.DATA;
var fails = [];
function fail(msg) { fails.push(msg); }
function hitsOf(t) { return app.analyzeEntry(t).hits.map(function (h) { return h.label; }); }
function cesd(t) { return app.CESD_KEYWORDS.filter(function (k) { return t.indexOf(k) >= 0; }); }

// ── 1. 문장 라이브러리 ──
var sitAll = [];
Object.keys(DATA.SIT).forEach(function (g) {
  DATA.SIT[g].forEach(function (s) {
    var h = hitsOf(s), c = cesd(s);
    if (g === "lonely" || g === "drained") { if (!c.length && !app.extractSituations([s]).length) fail("신호 문장에 선별 키워드도 상황도 없다: " + s); if (h.some(function (l) { return app.SAD_EMOS.indexOf(l) < 0; })) fail("신호 문장에 다른 감정: " + s + " → " + h.join(",")); return; }
    if (h.length) fail("상황 문장에 감정이 잡힌다 [" + g + "] " + s + " → " + h.join(","));
    if (c.length) fail("상황 문장에 선별 키워드 [" + g + "] " + s + " → " + c.join(","));
    sitAll.push(s);
  });
});
DATA.CLOSE.forEach(function (s) {
  if (hitsOf(s).length) fail("마무리에 감정이 잡힌다: " + s);
  if (cesd(s).length) fail("마무리에 선별 키워드: " + s);
  if (app.extractSituations([s]).length) fail("마무리에 상황이 잡힌다: " + s + " → " + JSON.stringify(app.extractSituations([s])));
});
var mindCesd = [];
Object.keys(DATA.MIND).forEach(function (label) {
  if (!app.EMOTIONS_28.some(function (e) { return e.label === label; })) fail("없는 어휘: " + label);
  DATA.MIND[label].forEach(function (m) {
    var h = hitsOf(m);
    if (h.length !== 1 || h[0] !== label) fail("마음 문장 단독 [" + label + "] " + m + " → " + h.join(","));
    if (cesd(m).length) mindCesd.push(label + ": " + m + " (" + cesd(m).join(",") + ")");
    sitAll.forEach(function (s) {
      var t = s + " " + m, hh = hitsOf(t);
      if (hh.length !== 1 || hh[0] !== label) fail("상황+마음 [" + label + "] " + t + " → " + hh.join(",") + " / 제외: " + app.analyzeEntry(t).excluded.map(function (x) { return x.label; }).join(","));
    });
  });
  // 마음 둘 나란히: 둘 다 잡혀야 한다 (다른 어휘와 조합)
});
var labels = Object.keys(DATA.MIND);
for (var i = 0; i < labels.length; i++) for (var j = 0; j < labels.length; j++) {
  if (i === j) continue;
  var t = DATA.MIND[labels[i]][0] + " " + DATA.MIND[labels[j]][0], hh = hitsOf(t);
  if (hh.length !== 2 || hh.indexOf(labels[i]) < 0 || hh.indexOf(labels[j]) < 0) fail("마음 둘 [" + labels[i] + "+" + labels[j] + "] " + t + " → " + hh.join(","));
}
// 성격표·광장 칩의 어휘가 실제 어휘인가
DATA.STUDENTS.forEach(function (st) { st.core.forEach(function (l) { if (!DATA.MIND[l]) fail("성격표 core에 없는 말: " + st.name + " " + l); }); if (st.core.length > st.n) fail("core가 n보다 많다: " + st.name); });
[DATA.PLAZA.open].concat(DATA.PLAZA.past).forEach(function (q) { q.answers.forEach(function (a) { a.fl.forEach(function (l) { if (!DATA.MIND[l]) fail("광장 칩에 없는 말: " + l); }); }); });

// ── 2. 생성 결과 ──
function simulateWatch(gen, now) {
  // index.html 살펴봐주세요와 같은 규칙: 지난 7일(ts) 안에 슬픔 계열 또는 선별 키워드가 있는 날이 4일 이상
  var out = {};
  Object.keys(gen.entries).forEach(function (id) {
    var days = {};
    gen.entries[id].forEach(function (en) {
      if (en.ts < now - 7 * 86400000) return;   // 앱과 같다: 위쪽 경계는 없다
      var sad = en.analysis.hits.some(function (h) { return app.SAD_EMOS.indexOf(h.label) >= 0; });
      var kw = cesd(en.text).length > 0;
      if (!sad && !kw) return;
      var d = new Date(en.ts); days[(d.getMonth() + 1) + "." + d.getDate()] = true;
    });
    out[id] = Object.keys(days).length;
  });
  return out;
}
function median(a) { a = a.slice().sort(function (x, y) { return x - y; }); var n = a.length; return n ? (n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2) : 0; }

var base = process.argv[2] ? new Date(process.argv[2] + "T00:00:00") : new Date();
var report = [];
for (var dd = 0; dd < 7; dd++) {
  ["bright", "heavy"].forEach(function (mood) {
    var D = new Date(base.getFullYear(), base.getMonth(), base.getDate() + dd);
    var g = GEN.generate(D, mood, app);
    var tag = app.dayStamp(D.getTime() + 43200000) + "/" + mood;
    var names = {}; g.students.forEach(function (s) { names[s.id] = s.name; });
    // 어휘 수
    Object.keys(g.expect.vocab).forEach(function (id) {
      var n = Object.keys(g.isle[id].v).length;
      if (n !== g.expect.vocab[id]) fail(tag + " 어휘 수 " + names[id] + ": " + n + " ≠ " + g.expect.vocab[id]);
    });
    // 일기 모양
    var keys = {};
    Object.keys(g.entries).forEach(function (id) {
      g.entries[id].forEach(function (e) {
        if (e.date !== app.fmtDate(new Date(e.ts))) fail(tag + " date≠ts " + names[id]);
        var k = app.entryKey(e.ts); if (keys[id + k]) fail(tag + " 키 중복 " + names[id]); keys[id + k] = 1;
        if (e.text.length > 200) fail(tag + " 본문이 길다 " + names[id] + ": " + e.text.length);
      });
    });
    // 살펴봐주세요: D 18시와 D+1 09시
    var w1 = simulateWatch(g, D.getTime() + 18 * 3600000), w2 = simulateWatch(g, D.getTime() + 33 * 3600000);
    var f1 = Object.keys(w1).filter(function (id) { return w1[id] >= 4; }), f2 = Object.keys(w2).filter(function (id) { return w2[id] >= 4; });
    var exp = g.expect.flagged.map(String);
    if (f1.sort().join() !== exp.slice().sort().join()) fail(tag + " 살펴봐주세요(D 18시) " + f1.map(function (id) { return names[id] + "=" + w1[id]; }).join(",") + " ≠ 기대 " + exp.map(function (id) { return names[id]; }).join(","));
    if (f2.some(function (id) { return exp.indexOf(id) < 0; })) fail(tag + " 살펴봐주세요(D+1 09시) 뜻밖의 학생: " + f2.map(function (id) { return names[id]; }).join(","));
    if (f2.indexOf(String(g.expect.flagged[0])) < 0) fail(tag + " D+1에 뚜렷한 아이가 빠진다");
    // 오늘: 참여·바다 색
    var vs = Object.keys(g.day.node).map(function (ak) { return g.day.node[ak].v; });
    var med = median(vs), tone = Math.max(0.15, Math.min(0.85, 0.5 + med * 0.35));
    if (vs.length < 15) fail(tag + " 오늘 쓴 아이가 적다: " + vs.length);
    if (mood === "bright" && (tone < 0.55 || tone > 0.75)) fail(tag + " 밝은 날 tone " + tone.toFixed(2));
    if (mood === "heavy" && tone > 0.40) fail(tag + " 무거운 날 tone " + tone.toFixed(2));
    var todayStamp = g.day.date;
    var aToday = g.entries[g.expect.A].some(function (e) { return app.dayStamp(e.ts) === todayStamp; });
    var bToday = g.entries[g.expect.B].some(function (e) { return app.dayStamp(e.ts) === todayStamp; });
    if (aToday) fail(tag + " A에게 오늘 일기가 있다"); if (!bToday) fail(tag + " B에게 오늘 일기가 없다");
    // 반딧불
    var recv = {}, sent = {}, aToday2 = 0, aWeek = 0;
    Object.keys(g.emp).forEach(function (to) {
      Object.keys(g.emp[to]).forEach(function (k) {
        var e = g.emp[to][k], from = k.split("_")[1], date = k.split("_")[0];
        if (!g.isle[to].v[e.l]) fail(tag + " 반딧불 어휘가 받은 섬에 없다 " + names[to] + " " + e.l);
        if (app.dayStamp(e.ts) !== date) fail(tag + " 반딧불 키 날짜≠ts");
        recv[to] = (recv[to] || 0) + 1; sent[from] = (sent[from] || 0) + 1;
        if (String(to) === String(g.expect.A)) { aWeek++; if (date === todayStamp) aToday2++; }
      });
    });
    if (aWeek !== 6 || aToday2 !== 2) fail(tag + " A 반딧불 주 " + aWeek + " 오늘 " + aToday2);
    DATA.NO_RECV.forEach(function (i) { if (recv[GEN.sid(i)]) fail(tag + " 못 받아야 할 아이가 받았다 " + i); });
    DATA.NO_SEND.forEach(function (i) { if (sent[GEN.sid(i)]) fail(tag + " 안 보내야 할 아이가 보냈다 " + i); });
    // 광장
    var cur = g.plaza.cur, pub = Object.keys(g.plaza.pub[cur]).length, n = Object.keys(g.plaza.n[cur]).length;
    if (pub !== 12 || n !== 18) fail(tag + " 광장 승인 " + pub + " 답 " + n);
    if (g.plaza.a[cur][String(g.expect.A)]) fail(tag + " A에게 광장 답이 있다");
    if (!g.plaza.a[cur][String(g.expect.B)]) fail(tag + " B에게 광장 답이 없다");
    var allNames = g.students.map(function (s) { return s.name; });
    Object.keys(g.plaza.a).forEach(function (qid) {
      Object.keys(g.plaza.a[qid]).forEach(function (s) {
        var a = g.plaza.a[qid][s], hit = app.plazaNameHit([a.o, a.f, a.w].join(" "), allNames, names[s]);
        if (a.s === 2 && !hit) fail(tag + " 숨김 답에 이름이 안 잡힌다 " + names[s]);
        if (a.s !== 2 && hit) fail(tag + " 공개·비공개 답에 이름 " + names[s] + " → " + JSON.stringify(hit));
        if (a.ts < g.plaza.q[qid].ts || a.ts > D.getTime() + 86400000) fail(tag + " 광장 답 시각 이상 " + names[s]);
      });
    });
    if (dd === 0) {
      var total = 0; Object.keys(g.entries).forEach(function (id) { total += g.entries[id].length; });
      report.push("[" + tag + "] 일기 " + total + "개 · 오늘 " + vs.length + "명 · tone " + tone.toFixed(2) + " (중앙값 " + med.toFixed(2) + ") · 반딧불 " + Object.keys(g.emp).reduce(function (s, k) { return s + Object.keys(g.emp[k]).length; }, 0) + "개");
      if (mood === "bright") {
        report.push("살펴봐주세요 신호 일수(지난 7일): " + Object.keys(w1).filter(function (id) { return w1[id] >= 2; }).map(function (id) { return names[id] + "=" + w1[id]; }).join(", "));
        g.expect.flagged.forEach(function (id) {
          var ex = g.entries[id].filter(function (e) { return e.ts >= D.getTime() + 18 * 3600000 - 7 * 86400000; });
          report.push("  " + names[id] + " 근거: " + ex.map(function (e) { return e.date + " " + e.analysis.hits.map(function (h) { return h.label; }).join("·") + (cesd(e.text).length ? " '" + cesd(e.text)[0] + "'" : ""); }).join(" | "));
          report.push("    상황: " + JSON.stringify(app.extractSituations(ex.map(function (e) { return e.text; })).slice(0, 3)));
        });
        report.push("어휘/일기 수: " + g.students.map(function (s) { return s.name + " " + Object.keys(g.isle[s.id].v).length + "/" + g.entries[s.id].length; }).join(", "));
        var A = g.expect.A;
        report.push("A(" + names[A] + ") 최근 일기 셋:\n  " + g.entries[A].slice(-3).map(function (e) { return e.date + " " + e.text; }).join("\n  "));
        report.push("B 오늘: " + g.entries[g.expect.B].slice(-1)[0].text);
      } else {
        report.push("무거운 날 오늘 일기 셋:\n  " + Object.keys(g.entries).slice(0, 3).map(function (id) { var e = g.entries[id].slice(-1)[0]; return names[id] + " " + e.text; }).join("\n  "));
      }
    }
  });
}
console.log(report.join("\n"));
if (mindCesd.length) console.log("\n(참고) 선별 키워드가 든 마음 문장 — 슬픔 계열이라 의도된 것:\n  " + mindCesd.join("\n  "));
if (fails.length) { console.log("\n실패 " + fails.length + "건:"); fails.slice(0, 400).forEach(function (f) { console.log(" - " + f); });  process.exit(1); }
console.log("\n모두 통과.");
