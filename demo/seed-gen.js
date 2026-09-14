// 시연 학급 가상 데이터 — 생성기 (DESIGN.md §14)
// 순수 함수. 저장소를 건드리지 않는다. 기준일 D와 오늘의 기분(bright·heavy)을 받아
// 앱이 읽는 노드 모양 그대로를 돌려준다. 브라우저(seed.js)가 쓰고, node(check.js)가 검사한다.
// 앱의 분석기·키 함수(analyzeEntry, labelKey, anonKey, entryKey, dayStamp, fmtDate, hashSeed, mulberry32,
// EMOTIONS_28, SAD_EMOS, CESD_KEYWORDS)는 app 인자로 받는다 — 다시 구현하면 어긋난다.
// 난수는 학생 번호로만 시드를 잡는다. 기준일이 바뀌어도 이야기는 같고 날짜만 따라온다.
(function (root) {
  var DATA = typeof module !== "undefined" && module.exports ? require("./seed-data.js") : root.DEMO_DATA;
  var DAY = 86400000;
  var SPAN = 20;   // D-20 ~ D

  function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
  function shuffle(rng, arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function weightedPick(rng, items, wOf) {
    var tot = 0, i;
    for (i = 0; i < items.length; i++) tot += wOf(items[i]);
    if (tot <= 0) return null;
    var r = rng() * tot;
    for (i = 0; i < items.length; i++) { r -= wOf(items[i]); if (r <= 0) return items[i]; }
    return items[items.length - 1];
  }
  function sid(i) { return DATA.ID_BASE + i; }
  function lid(i) { return "d" + (i < 10 ? "0" + i : "" + i); }
  function midnight(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function isWeekend(d) { var w = d.getDay(); return w === 0 || w === 6; }

  // 달력: D-20~D. 등교일(평일 + 오늘은 항상)에 k(오늘=0에서 거꾸로)를 매긴다.
  function calendar(D) {
    var days = [], i;
    for (i = SPAN; i >= 0; i--) {
      var d = new Date(D.getTime() - i * DAY);
      days.push({ off: i, date: d, wd: d.getDay(), weekend: isWeekend(d) && i !== 0, k: null });
    }
    var k = 0;
    for (i = days.length - 1; i >= 0; i--) if (!days[i].weekend) days[i].k = k++;
    return days;
  }

  // 시각: 등교 시간대에 흩뿌린다. 15%는 저녁.
  function stampFor(rng, day) {
    var r = rng(), h, m;
    // 오늘은 아침 활동 시간. 아침에 다시 만들어도 "미래에 쓴 일기"가 되지 않는다.
    if (day.off === 0) r = 0;
    if (r < 0.35) { h = 8; m = 35 + Math.floor(rng() * 20); }
    else if (r < 0.60) { h = 12; m = 40 + Math.floor(rng() * 25); }
    else if (r < 0.85) { h = 14; m = 20 + Math.floor(rng() * 50); }
    else { h = 19 + Math.floor(rng() * 2); m = Math.floor(rng() * 60); }
    if (day.weekend) { h = 10 + Math.floor(rng() * 10); m = Math.floor(rng() * 60); }
    var d = new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate(), h, m, Math.floor(rng() * 60));
    return d.getTime() + rng();
  }

  function emoOf(app, label) {
    for (var i = 0; i < app.EMOTIONS_28.length; i++) if (app.EMOTIONS_28[i].label === label) return app.EMOTIONS_28[i];
    return null;
  }
  function isSad(app, label) { return app.SAD_EMOS.indexOf(label) >= 0; }
  function hasCesd(app, text) {
    for (var i = 0; i < app.CESD_KEYWORDS.length; i++) if (text.indexOf(app.CESD_KEYWORDS[i]) >= 0) return true;
    return false;
  }

  // 어휘 주머니: core + 기분 가중치로 뽑은 나머지. 정확히 n개.
  function makePool(rng, st, app) {
    var pool = st.core.slice();
    var all = app.EMOTIONS_28.map(function (e) { return e.label; });
    var w = DATA.MOOD_W[st.mood];
    var guard = 0;
    while (pool.length < st.n && guard++ < 500) {
      var cand = all.filter(function (l) { return pool.indexOf(l) < 0 && (w[l] || 0) > 0; });
      var l = weightedPick(rng, cand, function (x) { return w[x]; });
      if (!l) { cand = all.filter(function (x) { return pool.indexOf(x) < 0; }); l = pick(rng, cand); }
      pool.push(l);
    }
    return pool.slice(0, st.n);
  }

  // 한 학생의 일기 목록
  function genStudent(st, days, mood, app) {
    var rng = app.mulberry32(app.hashSeed("demo:" + st.i));
    var pool = makePool(rng, st, app);
    var isA = st.i === DATA.A, isB = st.i === DATA.B;
    var isClear = st.i === DATA.FLAG_CLEAR, isBorder = st.i === DATA.FLAG_BORDER, flagged = isClear || isBorder;
    var today = DATA.TODAY[mood];
    var ev = DATA.EVENTS;

    // 쓰는 날
    var writing = {};
    days.forEach(function (d) {
      if (d.weekend) { if (DATA.WEEKEND.indexOf(st.i) >= 0 && rng() < 0.5) writing[d.off] = true; return; }
      if (d.off === 0) { writing[0] = !isA && (st.freq >= 0.5 || rng() < today.share); return; }
      if (rng() < st.freq) writing[d.off] = true;
    });
    // 사건 날에 그 어휘가 있으면 쓰게 한다 (반이 같은 방향으로 움직인다)
    days.forEach(function (d) {
      if (d.k !== null && ev[d.k] && ev[d.k].pref.some(function (l) { return pool.indexOf(l) >= 0; }) && rng() < 0.5) writing[d.off] = true;
    });
    // 살펴봐주세요 신호 날 (D 기준 오프셋)
    var signalOffs = isClear ? [0, 1, 2, 3, 5] : isBorder ? [0, 2, 3, 5] : [];
    signalOffs.forEach(function (o) { writing[o] = true; });
    if (isClear) writing[4] = true;   // 밝은 날 하나를 섞는다
    if (isA) writing[0] = false;
    if (isB) writing[0] = true;
    // 어휘 수를 채우려면 날이 모자라면 안 된다
    var need = Math.ceil(st.n / 2) + 1, guard = 0;
    var gapShift = st.shift === "gap";   // 요즘 달라진 아이 ②: 지난 7일(오늘 포함)은 한 편도 없다. 다른 학생의 흐름은 건드리지 않는다
    while (Object.keys(writing).filter(function (o) { return writing[o]; }).length < need && guard++ < 100) {
      var d = pick(rng, days.filter(function (x) { return !x.weekend && x.off !== 0 && (!gapShift || x.off > 6); }));
      writing[d.off] = true;
    }
    if (gapShift) days.forEach(function (d) { if (d.off <= 6) writing[d.off] = false; });
    // 요즘 달라진 아이 ③: 지난 7일 안의 평일 셋(오늘 제외, 가까운 쪽부터)에 반드시 쓰고, 그날은 긍정+부정을 함께 쓴다(아래)
    var swingShift = st.shift === "swing", swingOffs = [];
    if (swingShift) days.filter(function (d) { return d.off >= 1 && d.off <= 6 && !d.weekend; }).sort(function (a, b) { return a.off - b.off; }).slice(0, 3).forEach(function (d) { writing[d.off] = true; swingOffs.push(d.off); });
    var wdays = days.filter(function (d) { return writing[d.off]; });   // 오래된 날부터

    // 처음 쓰는 날 배정. core는 첫 이틀. 사건 어휘는 그 사건 날. 나머지는 앞쪽에 몰아서(학습 곡선).
    // 슬픔 계열은 되도록 지난 7일 밖에 처음 쓰게 해 살펴봐주세요 문턱을 건드리지 않는다.
    var first = {};   // label -> wdays index
    var eventDayIdx = {};
    wdays.forEach(function (d, idx) { if (d.k !== null && ev[d.k]) ev[d.k].pref.forEach(function (l) { if (eventDayIdx[l] === undefined) eventDayIdx[l] = idx; }); });
    var early = wdays.map(function (d, idx) { return d.off > 6 ? idx : -1; }).filter(function (x) { return x >= 0; });
    var rest = shuffle(rng, pool.filter(function (l) { return st.core.indexOf(l) < 0; }));
    st.core.forEach(function (l, i) { first[l] = Math.min(Math.floor(i / 2), wdays.length - 1); });
    // 요즘 달라진 아이 ①: 모든 말을 8일 전보다 앞에서 먼저 쓴다(고르게). 최근 8일은 "편안"만.
    // 판정 창은 "지금부터 7×24시간"이라 D-7 저녁 일기가 걸쳐 들어온다 — 그래서 7일이 아니라 8일(off ≤ 7)을 덮는다
    var monoShift = st.shift === "mono", monoEarly = wdays.map(function (d, idx) { return d.off > 7 ? idx : -1; }).filter(function (x) { return x >= 0; });
    if (monoShift) rest.forEach(function (l, j) { first[l] = monoEarly.length ? monoEarly[j % monoEarly.length] : 0; });
    var swingFree = wdays.map(function (d, idx) { return swingOffs.indexOf(d.off) < 0 ? idx : -1; }).filter(function (x) { return x >= 0; });
    if (swingShift) rest.forEach(function (l, j) { first[l] = swingFree.length ? swingFree[j % swingFree.length] : 0; });   // 처음 쓰는 말은 기복 날을 피한다
    rest.forEach(function (l) {
      if (monoShift || swingShift) return;
      if (eventDayIdx[l] !== undefined && rng() < 0.7) { first[l] = eventDayIdx[l]; return; }
      if (isSad(app, l) && !flagged && early.length) { first[l] = pick(rng, early); return; }
      first[l] = Math.min(wdays.length - 1, Math.floor(wdays.length * Math.pow(rng(), 1.6)));
    });
    // 한 날에 셋 넘게 몰리면 다음 날로
    var perDay = {};
    Object.keys(first).forEach(function (l) { var i = first[l]; while ((perDay[i] || 0) >= 3 && i < wdays.length - 1) i++; first[l] = i; perDay[i] = (perDay[i] || 0) + 1; });

    var used = [];   // 지금까지 쓴 말
    var signalDays = 0;
    var entries = [];
    wdays.forEach(function (d, idx) {
      var inWin = d.off <= 6;
      var isToday = d.off === 0;
      var evt = isToday ? today : (d.k !== null ? ev[d.k] : null);
      var sit = d.weekend ? DATA.SIT.weekend : (evt ? DATA.SIT[evt.sit] : DATA.SIT.plain);
      var signalHere = signalOffs.indexOf(d.off) >= 0;

      var words = Object.keys(first).filter(function (l) { return first[l] === idx; });
      var target = signalHere ? 2 : (rng() < 0.10 ? 0 : rng() < 0.55 ? 1 : rng() < 0.8 ? 2 : 3);
      if (words.length) target = Math.max(target, words.length);
      // 사건·요일 우선 어휘
      var prefs = [];
      if (evt && rng() < evt.p) prefs = prefs.concat(evt.pref);
      if (!isToday && d.wd === 1 && rng() < DATA.MON.p) prefs = prefs.concat(DATA.MON.pref);
      if (!isToday && d.wd === 5 && rng() < DATA.FRI.p) prefs = prefs.concat(DATA.FRI.pref);
      if (signalHere) prefs = isClear ? ["외로움", "슬픔", "우울"] : ["피곤", "우울"];
      if (isClear && d.off === 4) prefs = ["즐거움", "뿌듯", "편안", "차분", "만족"];   // 뚜렷한 아이의 밝은 하루
      // 슬픔 계열을 막는 날: 문턱(4일)을 넘길 아이의 지난 7일, 그리고 대상 아이의 신호가 아닌 날(딱 그 일수만)
      var noSad = (!flagged && inWin && signalDays >= 2) || (flagged && inWin && !signalHere);
      function allowed(l) { return !(noSad && isSad(app, l)); }
      var avail = used.filter(function (l) { return words.indexOf(l) < 0 && allowed(l); });
      var poolAvail = pool.filter(function (l) { return words.indexOf(l) < 0 && allowed(l); });
      // 오늘은 주머니 전체에서 사건 어휘를 꺼낸다(아직 안 쓴 말이어도). 무거운 날은 채우는 말도 낮은 정서가만
      if (isToday) {
        if (mood === "heavy") avail = poolAvail.filter(function (l) { var e = emoOf(app, l); return e && e.val <= 4; });
        else avail = poolAvail;
      }
      // 신호 날도 주머니 전체에서 꺼내고, 밝은 말로 채우지 않는다 ("입맛이 없었다 + 안심" 같은 조합을 막는다)
      if (signalHere) avail = poolAvail.filter(function (l) { var e = emoOf(app, l); return e && e.val <= 5; });
      var pf = prefs.filter(function (l) { return (isToday || signalHere ? poolAvail : avail).indexOf(l) >= 0; });
      while (words.length < target && (pf.length || avail.length)) {
        var l = pf.length ? pf.shift() : weightedPick(rng, avail, function (x) { return st.core.indexOf(x) >= 0 ? 3 : 1; });
        if (!l) break;
        if (words.indexOf(l) < 0) words.push(l);
        avail = avail.filter(function (x) { return x !== l; });
      }
      // 밝은 날도 "약간" 밝게: 연습 뒤라 절반은 피곤을 같이 쓴다 (중앙값이 0.4 안팎으로 내려온다)
      if (isToday && mood === "bright" && pool.indexOf("피곤") >= 0 && words.indexOf("피곤") < 0 && rng() < 0.5) words.push("피곤");
      if (monoShift && d.off <= 7) words = ["편안"];   // 최근 8일은 한 가지 말뿐. 긍정(LA)이라 살펴봐주세요·기복에는 안 걸린다
      if (swingShift && swingOffs.indexOf(d.off) >= 0) words = [["즐거움", "짜증"], ["편안", "긴장"], ["즐거움", "긴장"]][swingOffs.indexOf(d.off)];   // 긍정+부정(HV). 슬픔 계열이 아니라 살펴봐주세요는 안 건드린다
      words = words.filter(function (l, i) { return l && words.indexOf(l) === i; }).slice(0, 3);
      words.forEach(function (l) { if (used.indexOf(l) < 0) used.push(l); });

      // 본문
      var parts = [];
      if (signalHere) parts.push(pick(rng, isClear ? DATA.SIT.lonely : DATA.SIT.drained));
      else parts.push(pick(rng, sit));
      words.forEach(function (l) { parts.push(pick(rng, DATA.MIND[l])); });
      if (rng() < 0.45) parts.push(pick(rng, DATA.CLOSE));
      if (!words.length && rng() < 0.5) parts = [parts[0]];
      var text = parts.join(" ");
      var ts = stampFor(rng, d);
      var analysis = app.analyzeEntry(text);
      var sig = analysis.hits.some(function (h) { return isSad(app, h.label); }) || hasCesd(app, text);
      if (inWin && sig) signalDays++;
      entries.push({ date: app.fmtDate(new Date(ts)), text: text, ts: ts, analysis: analysis, _off: d.off, _words: words });
    });
    entries.sort(function (a, b) { return a.ts - b.ts; });
    return { st: st, pool: pool, entries: entries };
  }

  // 섬 요약: 처음 나온 순서로 종류만 (islandState와 같은 규칙)
  function isleOf(app, st, entries) {
    var v = {};
    entries.forEach(function (e) {
      (e.analysis.hits || []).forEach(function (h) {
        var k = app.labelKey(h.label);
        if (!v[k]) v[k] = { l: h.label, q: h.q, vs: h.valStd, as: h.aroStd };
      });
    });
    return { name: st.name, code: DATA.CODE, upd: 0, v: v };
  }

  // 오늘 노드 (dayMark와 같은 계산)
  function dayNodeOf(app, gens, D) {
    var today = app.dayStamp(D.getTime() + 12 * 3600000), o = {};
    gens.forEach(function (g) {
      var v = 0, a = 0, n = 0, w = {};
      g.entries.forEach(function (e) {
        if (app.dayStamp(e.ts) !== today) return;
        (e.analysis.hits || []).forEach(function (h) { v += h.valStd; a += h.aroStd; n++; w[app.labelKey(h.label)] = { l: h.label, q: h.q }; });
      });
      if (n) o[app.anonKey(sid(g.st.i))] = { v: v / n, a: a / n, w: w };
    });
    return { date: today, node: o };
  }

  // 반딧불: 지난 7일. 보낸 아이는 그 영역의 말을 가졌고, 받은 섬에 그 말이 있다.
  function empOf(app, gens, days, D) {
    var rng = app.mulberry32(app.hashSeed("demo:emp"));
    var byI = {}; gens.forEach(function (g) { byI[g.st.i] = g; });
    var quads = {}; gens.forEach(function (g) { var q = {}; g.pool.forEach(function (l) { var e = emoOf(app, l); if (e) q[e.q] = true; }); quads[g.st.i] = q; });
    var isleV = {}; gens.forEach(function (g) { isleV[g.st.i] = isleOf(app, g.st, g.entries).v; });
    var out = {};
    function put(from, to, day) {
      if (from === to || DATA.NO_SEND.indexOf(from) >= 0 || DATA.NO_RECV.indexOf(to) >= 0) return false;
      var keys = Object.keys(isleV[to]).filter(function (k) { return quads[from][isleV[to][k].q]; });
      if (!keys.length) return false;
      var k = pick(rng, keys), date = app.dayStamp(day.date.getTime() + 12 * 3600000);
      var ts = stampFor(rng, day);
      out[sid(to)] = out[sid(to)] || {};
      out[sid(to)][date + "_" + sid(from)] = { n: byI[from].st.name, q: isleV[to][k].q, l: k, ts: ts };
      return true;
    }
    var week = days.filter(function (d) { return d.off <= 6; });
    week.forEach(function (day) {
      var n = day.off === 0 ? 9 : day.weekend ? 3 : 9 + Math.floor(rng() * 4);
      var guard = 0;
      while (n > 0 && guard++ < 60) {
        var N = DATA.STUDENTS.length;
        var from = 1 + Math.floor(rng() * N);
        var to = ((from - 1 + (rng() < 0.7 ? 1 + Math.floor(rng() * 3) : 4 + Math.floor(rng() * 20))) % N) + 1;
        if (put(from, to, day)) n--;
      }
    });
    // 심사 계정 A: 이번 주 6개, 오늘 2개 — 배너에 이름이 뜬다
    var a = DATA.A, cur = Object.keys(out[sid(a)] || {}), want = [0, 0, 1, 2, 4, 5], gi = 0;
    delete out[sid(a)];
    want.forEach(function (off) {
      var day = days.filter(function (d) { return d.off === off; })[0], g = 0;
      while (g++ < 30) { var from = ((a - 1 + 1 + gi++ * 7) % DATA.STUDENTS.length) + 1; if (put(from, a, day)) break; }
    });
    // 심사 계정 B: 이번 주에 둘은 보낸다 (가장 자란 섬의 아이가 하나도 안 보냈으면 어색하다)
    var b = DATA.B, bi = 0;
    [1, 3].forEach(function (off) {
      var day = days.filter(function (d) { return d.off === off; })[0], g = 0;
      while (g++ < 30) { var to = ((b - 1 + 2 + bi++ * 5) % DATA.STUDENTS.length) + 1; if (put(b, to, day)) break; }
    });
    // 요즘 달라진 아이(단조·끊김)도 반딧불을 하나씩 받고, 단조 아이는 하나 보낸다. 다른 아이의 난수 흐름 **뒤에** 붙인다
    var N2 = DATA.STUDENTS.length;
    [[DATA.SHIFT_MONO, 3, 2], [DATA.SHIFT_GAP, 12, 5]].forEach(function (p) {
      var day = days.filter(function (d) { return d.off === p[2]; })[0], g = 0;
      while (g++ < 30) { var from = ((p[1] - 1 + g * 7) % N2) + 1; if (put(from, p[0], day)) break; }
    });
    (function () { var day = days.filter(function (d) { return d.off === 1; })[0], g = 0;
      while (g++ < 30) { var to = ((g * 5) % N2) + 1; if (put(DATA.SHIFT_MONO, to, day)) break; } })();
    return out;
  }

  // 광장
  function plazaOf(app, gens, D, mood) {
    var byI = {}; gens.forEach(function (g) { byI[g.st.i] = g; });
    var out = { cur: null, q: {}, a: {}, pub: {}, n: {} };
    function at(back, h) { return D.getTime() - back * DAY + h * 3600000; }
    function putQ(qd, open) {
      var ts = at(qd.dayBack, 9), qid = "q" + ts;
      out.q[qid] = { t: qd.t, cat: qd.cat, nm: !!qd.nm, ts: ts, open: !!open };
      if (!open) out.q[qid].closed = at(qd.closedBack, 16);
      var rng = app.mulberry32(app.hashSeed("demo:plaza:" + qd.dayBack));
      out.a[qid] = {}; out.pub[qid] = {}; out.n[qid] = {};
      qd.answers.forEach(function (an, idx) {
        var s = String(sid(an.i)), ak = app.anonKey(s);
        var ats = ts + 3600000 * (2 + rng() * 24 * ((open ? qd.dayBack : qd.dayBack - qd.closedBack) - 0.2));
        var fl = an.fl.map(function (l) { var e = emoOf(app, l); return { l: l, q: e ? e.q : "LA" }; });
        var rec = { o: an.o, f: an.f, w: an.w || "", fl: fl, ts: ats, s: an.s };
        if (an.nmf) rec.nmf = true;
        out.a[qid][s] = rec;
        out.n[qid][ak] = 1;
        if (an.s === 1) out.pub[qid][ak] = { o: an.o, f: an.f, w: an.w || "", fl: fl };
      });
      return qid;
    }
    DATA.PLAZA.past.forEach(function (qd) { putQ(qd, false); });
    out.cur = putQ(DATA.PLAZA.open, true);
    return out;
  }

  function generate(D, mood, app) {
    D = midnight(D);
    mood = mood === "heavy" ? "heavy" : "bright";
    var days = calendar(D);
    var gens = DATA.STUDENTS.map(function (st) { return genStudent(st, days, mood, app); });
    var students = DATA.STUDENTS.map(function (st) { return { id: sid(st.i), name: st.name, loginId: lid(st.i), grade: DATA.GRADE, classNumber: DATA.CLASS }; });
    var entries = {}, isle = {};
    gens.forEach(function (g) { entries[sid(g.st.i)] = g.entries; isle[sid(g.st.i)] = isleOf(app, g.st, g.entries); });
    var day = dayNodeOf(app, gens, D);
    return {
      code: DATA.CODE, schoolName: DATA.SCHOOL_NAME, teacher: DATA.TEACHER, pw: DATA.PW,
      D: D, mood: mood, students: students, entries: entries, isle: isle,
      day: day, emp: empOf(app, gens, days, D), plaza: plazaOf(app, gens, D, mood),
      expect: { flagged: [sid(DATA.FLAG_CLEAR), sid(DATA.FLAG_BORDER)], A: sid(DATA.A), B: sid(DATA.B),
                shift: { mono: sid(DATA.SHIFT_MONO), gap: sid(DATA.SHIFT_GAP), swing: sid(DATA.SHIFT_SWING) },   // 요즘 달라진 아이 ①②③(③은 심은 아이 + 자연 발생)
                vocab: DATA.STUDENTS.reduce(function (o, st) { o[sid(st.i)] = st.n; return o; }, {}) }
    };
  }

  var G = { generate: generate, sid: sid, lid: lid, DATA: DATA };
  if (typeof module !== "undefined" && module.exports) module.exports = G;
  else root.DEMO_GEN = G;
})(typeof window !== "undefined" ? window : this);
