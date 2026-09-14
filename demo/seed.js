// 시연 학급 가상 데이터 — 브라우저 쓰기 (DESIGN.md §14)
// index.html이 주소에 #seed가 있을 때만 이 파일(과 seed-data.js·seed-gen.js)을 불러온다.
// 앱의 전역 함수(analyzeEntry, labelKey, anonKey, entryKey, dayStamp, fmtDate, hashSeed, mulberry32, pwHash,
// stuKey, d2Key, isleKey, empKey, dayKey, plazaKey, scredKey, schPubKey, tcredKey, firebase)를 그대로 쓴다.
// 학교 코드가 DEMO01일 때만 돌고, 지우는 것도 그 아래만 지운다.
(function (root) {
  var DAY = 86400000;
  function gen() { return root.DEMO_GEN; }
  function data() { return root.DEMO_DATA; }
  function app() {
    return { analyzeEntry: analyzeEntry, EMOTIONS_28: EMOTIONS_28, SAD_EMOS: SAD_EMOS, CESD_KEYWORDS: CESD_KEYWORDS,
             labelKey: labelKey, anonKey: anonKey, entryKey: entryKey, dayStamp: dayStamp, fmtDate: fmtDate,
             hashSeed: hashSeed, mulberry32: mulberry32 };
  }
  function ref(p) { return firebase.database().ref("app/" + p); }
  function isDenied(e) { return e && /permission/i.test(String(e.code || e.message || e)); }

  // 한 경로 쓰기. 막히면 로그에 남기고 false.
  function put(log, p, v) {
    return ref(p).set(v).then(function () { return true; }, function (e) {
      log((isDenied(e) ? "규칙에 막힘: " : "실패: ") + p + " — " + (e && e.message || e));
      return false;
    });
  }
  // 부모에 쓰기가 막히면 자식마다 쓴다 (규칙이 자식 층에 있을 때).
  function putDeep(log, p, v) {
    return ref(p).set(v).then(function () { return true; }, function (e) {
      if (!isDenied(e) || !v || typeof v !== "object") { log("실패: " + p + " — " + (e && e.message || e)); return false; }
      var keys = Object.keys(v), chain = Promise.resolve(true);
      keys.forEach(function (k) { chain = chain.then(function (ok) { return putDeep(log, p + "/" + k, v[k]).then(function (r) { return ok && r; }); }); });
      return chain;
    });
  }
  // 지우기. 부모가 막히면 읽어서 자식마다 지운다.
  function wipe(log, p) {
    return ref(p).set(null).then(function () { return true; }, function (e) {
      if (!isDenied(e)) { log("실패: " + p + " — " + (e && e.message || e)); return false; }
      return ref(p).once("value").then(function (s) {
        var v = s.val(); if (!v || typeof v !== "object") return true;
        var chain = Promise.resolve(true);
        Object.keys(v).forEach(function (k) { chain = chain.then(function (ok) { return wipe(log, p + "/" + k).then(function (r) { return ok && r; }); }); });
        return chain;
      }, function (e2) { log("읽기도 막힘: " + p); return false; });
    });
  }
  function guard() { if (!data() || data().CODE !== "DEMO01") throw new Error("시연 코드가 아니다"); }
  function d2Node(entries) {
    var o = { _migrated: true };
    entries.forEach(function (e) { o[entryKey(e.ts)] = d2Clean({ date: e.date, text: e.text, ts: e.ts, analysis: e.analysis }); });
    return o;
  }
  function chunks(arr, n, fn) {
    var chain = Promise.resolve();
    for (var i = 0; i < arr.length; i += n) (function (part) { chain = chain.then(function () { return Promise.all(part.map(fn)); }); })(arr.slice(i, i + n));
    return chain;
  }

  // 처음 한 번: 학교 공개 정보와 교사 자격. 규칙상 한 번 쓰면 못 바꾼다(§13). 이미 있으면 막히고 그대로 둔다.
  // 비밀번호는 패널 입력란에서 받는다. 저장소(공개)에는 두지 않는다.
  function bootstrap(pw, log) {
    guard();
    var d = data();
    pw = String(pw || "").trim();
    if (!pw) { log("교사 비밀번호를 입력해야 해요."); return Promise.resolve(false); }
    return pwHash("t", "", d.TEACHER.id, pw).then(function (h) {
      var o = {}; o[h] = { schoolCode: d.CODE, schoolName: d.SCHOOL_NAME, teacherName: d.TEACHER.name };
      return ref(tcredKey(d.TEACHER.id)).set(o).then(function () { log("교사 자격을 만들었다: " + d.TEACHER.id); },
        function (e) { log(isDenied(e) ? "교사 자격은 이미 있다 (그대로 둔다)" : "교사 자격 실패: " + e.message); });
    }).then(function () {
      return ref(schPubKey(d.CODE)).set({ schoolName: d.SCHOOL_NAME }).then(function () { log("학교 공개 정보를 만들었다: " + d.CODE); },
        function (e) { log(isDenied(e) ? "학교 공개 정보는 이미 있다 (그대로 둔다)" : "학교 공개 정보 실패: " + e.message); });
    });
  }

  // 교사 비밀번호 확인(5단계, 2026-09-14). 로그인과 같은 방식 — 해시를 계산해 tcred/<아이디>/<해시> 잎이 있으면 맞는 것.
  // 자격은 bootstrap이 만든 그것이라 따로 둘 데가 없고, 규칙상 부모는 못 읽으니 목록이 새지 않는다. 주소만 아는 사람이 초기화하는 것을 막는다.
  function verify(pw, log) {
    var d = data();
    pw = String(pw || "").trim();
    if (!pw) { log("교사 비밀번호를 입력해야 해요."); return Promise.resolve(false); }
    return pwHash("t", "", d.TEACHER.id, pw).then(function (h) {
      return ref(tcredKey(d.TEACHER.id, h)).once("value").then(function (s) {
        if (s.val()) return true;
        log("교사 비밀번호가 맞지 않아요. (자격이 아직 없으면 먼저 \"시연 학교 만들기\")"); return false;
      }, function (e) { log("비밀번호 확인 실패: " + (e && e.message || e)); return false; });
    });
  }

  // 전체 다시 만들기. 기준일 D(자정)와 오늘의 기분. 교사 비밀번호가 맞아야 돈다.
  function rebuild(D, mood, log, pw) {
    return verify(pw, log).then(function (ok) { if (!ok) return false; return rebuildNow(D, mood, log); });
  }
  function rebuildNow(D, mood, log) {
    guard();
    var d = data(), g = gen().generate(D, mood, app()), ids = g.students.map(function (s) { return s.id; });
    var t0 = Date.now(), okAll = true;
    function note(ok) { if (!ok) okAll = false; }
    log("생성: 기준일 " + dayStamp(g.D.getTime() + 43200000) + " · " + (mood === "heavy" ? "무거운 날" : "밝은 날") + " · 학생 " + ids.length + "명");
    // 1) 비우기
    return chunks(ids, 6, function (id) {
      return Promise.all([wipe(log, d2Key(id)), wipe(log, isleKey(id)), wipe(log, empKey(id)), wipe(log, chatKey(id)), wipe(log, dKey(id))]).then(function (r) { r.forEach(note); });
    }).then(function () {
      var dates = []; for (var i = 30; i >= -1; i--) dates.push(dayStamp(g.D.getTime() - i * DAY + 43200000));
      return chunks(dates, 8, function (dt) { return wipe(log, dayKey(d.CODE, dt)).then(note); });
    }).then(function () { return wipe(log, plazaKey(d.CODE)).then(note); })
      .then(function () { return chunks(g.students, 6, function (s) { return wipe(log, "scred/" + d.CODE + "/" + s.loginId).then(note); }); })
      .then(function () { log("비우기 끝 (" + Math.round((Date.now() - t0) / 100) / 10 + "초)"); })
    // 2) 명단·자격
      .then(function () { return put(log, stuKey(d.CODE), g.students).then(note); })
      .then(function () {
        return chunks(g.students, 4, function (s) {
          return pwHash("s", d.CODE, s.loginId, d.PW).then(function (h) { var o = {}; o[h] = true; return put(log, "scred/" + d.CODE + "/" + s.loginId, o).then(note); });
        });
      }).then(function () { log("명단·비밀번호 " + g.students.length + "명"); })
    // 3) 일기·섬 요약·반딧불
      .then(function () {
        return chunks(ids, 4, function (id) {
          var isle = g.isle[id]; isle.upd = Date.now();
          return Promise.all([put(log, d2Key(id), d2Node(g.entries[id])), put(log, isleKey(id), isle),
                              g.emp[id] ? putDeep(log, empKey(id), g.emp[id]) : Promise.resolve(true)]).then(function (r) { r.forEach(note); });
        });
      }).then(function () {
        var n = 0; ids.forEach(function (id) { n += g.entries[id].length; });
        var f = 0; Object.keys(g.emp).forEach(function (id) { f += Object.keys(g.emp[id]).length; });
        log("일기 " + n + "개 · 섬 요약 " + ids.length + " · 반딧불 " + f + "개");
      })
    // 4) 오늘 노드·광장
      .then(function () { return putDeep(log, dayKey(d.CODE, g.day.date), g.day.node).then(note); })
      .then(function () { return putDeep(log, plazaKey(d.CODE), g.plaza).then(note); })
      .then(function () {
        var cur = g.plaza.cur;
        log("오늘 노드 " + Object.keys(g.day.node).length + "명 · 광장 답 " + Object.keys(g.plaza.n[cur]).length + " (승인 " + Object.keys(g.plaza.pub[cur]).length + ")");
        log((okAll ? "완료" : "완료 — 막힌 경로가 있다. 위 줄을 확인") + " (" + Math.round((Date.now() - t0) / 100) / 10 + "초)");
        return okAll;
      });
  }

  // 오늘 일기만 다시 쓰기. 심사 계정 A·B는 건드리지 않는다. 교사 비밀번호가 맞아야 돈다.
  function today(D, mood, log, pw) {
    return verify(pw, log).then(function (ok) { if (!ok) return false; return todayNow(D, mood, log); });
  }
  function todayNow(D, mood, log) {
    guard();
    var d = data(), g = gen().generate(D, mood, app()), td = g.day.date, okAll = true;
    function note(ok) { if (!ok) okAll = false; }
    var ids = g.students.map(function (s) { return s.id; }).filter(function (id) { return id !== g.expect.A && id !== g.expect.B; });
    log("오늘(" + td + ")을 " + (mood === "heavy" ? "무거운 날" : "밝은 날") + "로 다시 쓴다 · " + ids.length + "명 (A·B 제외)");
    return chunks(ids, 4, function (id) {
      return ref(d2Key(id)).once("value").then(function (s) {
        var cur = s.val() || {}, o = {};
        Object.keys(cur).forEach(function (k) { if (k.charAt(0) === "e" && cur[k] && cur[k].ts && dayStamp(cur[k].ts) === td) o[k] = null; });
        g.entries[id].forEach(function (e) { if (dayStamp(e.ts) === td) o[entryKey(e.ts)] = d2Clean({ date: e.date, text: e.text, ts: e.ts, analysis: e.analysis }); });
        o._migrated = true;
        var isle = g.isle[id]; isle.upd = Date.now();
        var ak = anonKey(id);
        return Promise.all([
          ref(d2Key(id)).update(o).then(function () { return true; }, function (e) { log("실패: " + d2Key(id) + " — " + e.message); return false; }),
          put(log, isleKey(id), isle),
          g.day.node[ak] ? putDeep(log, dayKey(d.CODE, td) + "/" + ak, g.day.node[ak]) : wipe(log, dayKey(d.CODE, td) + "/" + ak)
        ]).then(function (r) { r.forEach(note); });
      }, function (e) { log("읽기 실패: " + d2Key(id)); okAll = false; });
    }).then(function () {
      var vs = Object.keys(g.day.node).map(function (k) { return g.day.node[k].v; }).sort(function (a, b) { return a - b; });
      var med = vs.length ? (vs.length % 2 ? vs[(vs.length - 1) / 2] : (vs[vs.length / 2 - 1] + vs[vs.length / 2]) / 2) : 0;
      log((okAll ? "완료" : "완료 — 막힌 경로가 있다") + " · 오늘 쓴 아이 " + vs.length + "명 · 바다 tone " + (Math.max(0.15, Math.min(0.85, 0.5 + med * 0.35))).toFixed(2));
      return okAll;
    });
  }

  root.DEMO_SEED = { bootstrap: bootstrap, rebuild: rebuild, today: today, verify: verify };
})(window);
