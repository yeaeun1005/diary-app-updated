// Generated from current PlazaView: data rules unchanged, no 3D scene.
function V2Board({ me, myState, arrive, backLabel, onBack, onSeen, onTour, tutOn }) {
  const hostRef = useRef(null);
  const [tutSeen, setTutSeen] = useState(function () { try { return localStorage.getItem("tutPlaza") === "1"; } catch (e) { return false; } });   // 광장 투어(2026-09-15)
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(null);
  const [ans, setAns] = useState(null);
  const [pub, setPub] = useState([]);
  const [words, setWords] = useState([]);
  const [tone, setTone] = useState(0.5);
  const [roster, setRoster] = useState([]);
  const [mode, setMode] = useState("view");
  const [form, setForm] = useState({ o: "", f: "", w: "", fl: [] });
  const [tip, setTip] = useState(null);        // 칩을 탭하면 뜻
  const [warn, setWarn] = useState("");
  const [saving, setSaving] = useState(false);
  const [bridge, setBridge] = useState(false); // 저장 뒤 한 줄
  const [mineOpen, setMineOpen] = useState(false); // 내 답 펼침. 2026-09-15 저녁: 카드 전체를 접던 fold를 없앴다 — 친구들의 답이 버튼 뒤에 숨어 있었다. 이제 내 답만 접고 친구들의 답은 바로 보인다
  const [reveal, setReveal] = useState(!!arrive);
  const [figKeys, setFigKeys] = useState([]);    // 오늘 답을 쓴 아이들의 익명 키. 그 수만큼 캐릭터
  const [nameBlock, setNameBlock] = useState(0); // 이름으로 막힌 횟수. 두 번째는 저장하되 숨김
  const boardRef = useRef(null);                 // 게시판 HTML 덧판(2026-09-16). 렌더 루프가 3D 판 앞면을 투영해 자리를 잡는다
  const [bIdx, setBIdx] = useState(0);           // 게시판에 돌아가며 보이는 친구 답의 차례
  const [boardShown, setBoardShown] = useState(true);   // 덧판이 보일 만큼 판이 큰가(placePlazaBoard). 아니면 카드가 TOP3 줄을 대신 보인다
  const padRef = useRef(null);                   // 터치 방향 패드 → keys(2026-09-16)
  const touch = coarsePointer();
  const [small, setSmall] = useState(function () {
    try { return window.innerWidth < 560; } catch (e) { return false; }
  });
  const code = me && me.schoolCode;
  const chips = plazaChips(myState);
  const myKey = me && me.id ? anonKey(me.id) : "";
  useEffect(function () {   // 경고는 저장 버튼 바로 위에 뜬다. 카드가 스크롤이라 보이게 끌어온다
    if (!warn) return;
    try { var el = document.getElementById("plazaWarn"); if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" }); } catch (e) {}
  }, [warn]);
  useEffect(function () {
    var tm = reveal ? window.setTimeout(function () { setReveal(false); }, 800) : 0;
    function onR() { try { setSmall(window.innerWidth < 560); } catch (e) {} }
    window.addEventListener("resize", onR);
    return function () { if (tm) window.clearTimeout(tm); window.removeEventListener("resize", onR); };
  }, []);
  // 읽기는 열 때 한 번. 실시간 리스너는 없다(⑥-2와 같은 원칙).
  useEffect(function () {
    var dead = false;
    (async function () {
      try {
        await sGetStrict(plazaKey(code) + "/cur"); var r = await Promise.all([plazaCurrent(code), dayWords(code, PLZ.SLOTS), dayTone(code), sGet(stuKey(code))]);
        if (dead) return;
        var qq = r[0];
        setQ(qq); setWords(r[1].words); setTone(r[2].tone);
        setRoster((r[3] || []).map(function (st) { return st && st.name; }).filter(Boolean));
        if (qq) {
          if (onSeen) onSeen(qq.id);
          var r2 = await Promise.all([plazaMyAnswer(code, qq.id, me.id), plazaCount(code, qq.id)]);
          if (dead) return;
          var a = r2[0];
          setAns(a); setFigKeys(r2[1]);
          if (a) { var pl = await plazaPublic(code, qq.id, me.id); if (!dead) setPub(pl); }
        }
      } catch (e) { setErr("질문을 불러오지 못했어요. 닫았다가 다시 열어 주세요."); }
      if (!dead) setLoading(false);
    })();
    return function () { dead = true; };
  }, [code]);
  // ── 카드 ──
  function chipEl(c, sel, onTap, sizeK) {
    var k = sizeK == null ? 1 : sizeK;
    return React.createElement("button", {
      key: c.l, type: "button", onClick: onTap,
      style: { display: "inline-flex", alignItems: "center", gap: 4, padding: (5 * k) + "px " + (11 * k) + "px",
               borderRadius: 999, fontSize: Math.round(13 * k), cursor: "pointer", fontFamily: "inherit",
               border: sel ? "2px solid " + QC[c.q] : c.mine === false ? "1px dashed #a9bcc5" : "1px solid " + QC[c.q] + "88",
               background: sel || c.mine !== false ? QB[c.q] : "#fff", color: "#28444f", lineHeight: 1.3 }
    }, c.l);
  }
  function toggleChip(c) {
    setWarn("");
    setTip({ l: c.l, m: c.m || emoMeaning(c.l) || "", q: c.q, isNew: c.mine === false });
    setForm(function (f) {
      var has = f.fl.some(function (x) { return x.l === c.l; });
      if (has) return { ...f, fl: f.fl.filter(function (x) { return x.l !== c.l; }) };
      if (f.fl.length >= 5) return f;
      return { ...f, fl: f.fl.concat([{ l: c.l, q: c.q }]) };
    });
  }
  function startWrite() {
    setForm(ans ? { o: plazaAnsText(ans), f: "", w: "", fl: ans.fl.slice() } : { o: "", f: "", w: "", fl: [] });   // 옛 세 칸 답은 한 글로 이어서 고친다(2026-09-16)
    setWarn(""); setTip(null); setBridge(false); setNameBlock(0); setMode("write");
  }
  // 경고의 "친구로 바꾸기". 답에서 그 이름을 걷는다(f·w는 옛 칸 — 비어 있어도 그대로 돌려도 무해).
  function fixName(nm) {
    setForm(function (f) { return { ...f, o: plazaNameFix(f.o, nm), f: plazaNameFix(f.f, nm), w: plazaNameFix(f.w, nm) }; });
    setWarn("");
  }
  async function save() {
    if (saving) return;
    var o = form.o.trim(), f = "", w = "";   // 2026-09-16: 한 칸. 마음 말 칩은 골라도 안 골라도 된다
    if (!o) { setWarn("답을 먼저 써 주세요."); return; }
    var hit = plazaNameHit(o, roster, me.name);
    var flagged = false;
    if (hit) {
      // 첫 번째는 막고 바꾸기를 돕는다. 두 번째는 저장하되 숨김 — 정말 그 말을 쓰고 싶은 아이는 쓸 수 있고,
      // 광장에는 교사 확인 없이 절대 나가지 않는다.
      if (nameBlock < 1) { setNameBlock(1); setWarn({ text: "'" + hit + "'은 친구 이름이에요. 이름 대신 '친구'라고 써 볼까요?", name: hit }); return; }
      flagged = true;
    }
    setSaving(true);
    try {
      await plazaAnswerPut(code, q.id, me, { o: o, f: f, w: w, fl: form.fl, flagged: flagged });
      setAns({ sid: String(me.id), o: o, f: f, w: w, fl: form.fl.slice(), ts: nowTs(), s: flagged ? 2 : 1, nmf: flagged });
      setFigKeys(function (ks) { return ks.indexOf(myKey) >= 0 ? ks : ks.concat([myKey]); });
      setMode("view"); setBridge(true); setTip(null); setMineOpen(true);   // 방금 쓴 답은 펼쳐 보여준다
      plazaPublic(code, q.id, me.id).then(setPub).catch(function () {});
    } catch (e) { console.error("plazaAnswerPut:", e); setWarn("저장하지 못했어요. 잠시 뒤 다시 눌러 주세요."); }
    setSaving(false);
  }
  var row = function (name, body) {
    return React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "flex-start", marginTop: 6 } },
      React.createElement("span", { style: { flex: "0 0 auto", fontSize: 11, fontWeight: 700, color: "#0e7490", background: "#e6f4f7", borderRadius: 6, padding: "2px 7px", marginTop: 2 } }, name),
      React.createElement("div", { style: { flex: 1, fontSize: 16, fontWeight:700, color: "#28444f", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" } }, body));
  };
  var flRow = function (fl, f) {
    return React.createElement("div", null,
      (fl || []).length ? React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 5, marginBottom: f ? 4 : 0 } },
        fl.map(function (x) { return React.createElement("span", { key: x.l, style: { fontSize: 12, padding: "2px 9px", borderRadius: 999, background: QB[x.q] || "#eee", border: "1px solid " + (QC[x.q] || "#ccc") + "66", color: "#28444f" } }, x.l); })) : null,
      f ? f : (!(fl || []).length ? "—" : null));
  };
  // 답 본문(2026-09-16): 한 글 + 마음 말 칩 줄. 옛 세 칸 답도 plazaAnsText로 한 글이 된다
  var ansBody = function (a) {
    return React.createElement("div", null,
      React.createElement("div", { style: { fontSize: 16, fontWeight:700, color: "#28444f", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word", marginTop: 4 } }, plazaAnsText(a) || "—"),
      (a.fl || []).length ? React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 } },
        a.fl.map(function (x) { return React.createElement("span", { key: x.l, style: { fontSize: 12, padding: "2px 9px", borderRadius: 999, background: QB[x.q] || "#eee", border: "1px solid " + (QC[x.q] || "#ccc") + "66", color: "#28444f" } }, x.l); })) : null);
  };
  var ansCard = function (a, mineTag) {
    return React.createElement("div", { style: { background: "#f7fbfc", border: "1px solid #dfeaee", borderRadius: 12, padding: "8px 12px 10px", marginTop: 8 } },
      mineTag ? React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "#0e7490", marginBottom: 2 } }, "내 답") : null,
      ansBody(a));
  };
  var wordsEl = function (compact) {
    if (!words.length) return compact ? null : React.createElement("div", { style: { fontSize: 14, color: "#5b7684", lineHeight: 1.7 } },
      "오늘은 아직 조용해요.", React.createElement("br"), "마음을 쓴 친구가 더 모이면 여기에 자라요.");
    return React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 7, alignItems: "center" } },
      words.map(function (w, i) {
        var c = { l: w.l, q: w.q, m: emoMeaning(w.l) || "" };
        return chipEl(c, tip && tip.l === w.l, function () { setTip(tip && tip.l === w.l ? null : { l: w.l, m: c.m, q: w.q }); }, compact ? 0.9 : 1.22 - i * 0.045);
      }));
  };
  var tipEl = tip ? React.createElement("div", { style: { marginTop: 8, fontSize: 13, color: "#3f5560", background: QB[tip.q] || "#f4f8fa", borderRadius: 10, padding: "7px 11px", lineHeight: 1.6 } },
    React.createElement("b", { style: { color: QC[tip.q] || "#0e7490" } }, tip.l), " ",
    tip.m || (tip.isNew ? "" : me.name + "이가 직접 쓴 마음 말이에요")) : null;
  // 광장 보는 법(2026-09-15 저녁, ③). 3D의 깃발·화분·인형이 무엇인지 화면 어디에도 없어서 학생도 교사도 몰랐다. 카드 맨 아래 세 줄
  var nOthers = figKeys.filter(function (k) { return k !== myKey; }).length;   // 나 말고 오늘 답을 쓴 아이 수(카드·게시판의 "N명이 답했어요")
  var legendEl = null;
  // 오늘 우리 반 마음 말 TOP3 한 줄(2026-09-16). 게시판 덧판이 숨는 폭(800 이하·폰)에서만 카드에 — 넓은 화면은 게시판이 보인다
  var top3El = !boardShown && words.length ? React.createElement("div", { style: { marginTop: 8, fontSize: 12, fontWeight: 700, color: "#5b7684", display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: 8 } },
    "오늘 우리 반 마음", words.slice(0, 3).map(function (w, i) {
      var mx = words[0].c || 1, k = 0.85 + 0.45 * ((w.c || 1) / mx);
      return React.createElement("span", { key: w.l, style: { fontFamily: "'Jua',sans-serif", fontSize: Math.round(15 * k), color: QC[w.q] || "#0e7490" } }, w.l);
    })) : null;
  var qFont = small ? 18 : 22;   // 질문 글자(2026-09-15 저녁, ②): 넓은 화면은 오른쪽 패널이라 22px
  var body;
  if (loading) body = React.createElement("div", { style: { fontSize: 14, color: "#5b7684" } }, "오늘의 질문을 가져오는 중…");
  else if (!q) body = React.createElement("div", null,
    React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "#5b7684" } }, "오늘은 질문이 없는 날"),
    React.createElement("div", { style: { fontFamily: "'Jua',sans-serif", fontSize: qFont - 3, color: "#0e7490", lineHeight: 1.4, marginBottom: 8 } }, "오늘 우리 반이 많이 쓴 마음 말"),
    wordsEl(false), tipEl, legendEl);
  else if (mode === "write") body = React.createElement("div", null,
    React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "#5b7684" } }, "오늘의 질문"),
    React.createElement("div", { style: { fontFamily: "'Jua',sans-serif", fontSize: qFont, color: "#0e7490", lineHeight: 1.4, marginBottom: 6 } }, q.t),
    q.nm ? React.createElement("div", { style: { fontSize: 12, color: "#9a5b2b", background: "#fff4e6", borderRadius: 8, padding: "5px 10px", marginBottom: 6 } }, "저장하면 이름 없이 자동 공개돼요. 친구 이름 대신 '어떤 친구가'라고 써요.") : null,
    // 2026-09-16 개편: 관찰·느낌·바람 세 칸 → 답 한 칸(자유롭게) + 마음 말 칩(선택). 이름 검사·교사 승인은 그대로
    React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "#0e7490", marginTop: 6 } }, "내 답 · 질문에 대한 답과 그때의 나의 마음을 자유롭게 적어주세요"),
    React.createElement("textarea", { value: form.o, maxLength: PLAZA_MAX, rows: 4, placeholder: "생각나는 대로 써요. 친구 이름 대신 '어떤 친구가'라고 써요",
      onChange: function (e) { setWarn(""); setForm({ ...form, o: e.target.value }); },
      style: { width: "100%", boxSizing: "border-box", marginTop: 3, padding: "7px 10px", border: "1px solid #cfdde3", borderRadius: 10, fontSize: 14, fontFamily: "inherit", resize: "none" } }),
    React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "#0e7490", marginTop: 8 } }, "그때의 나의 감정을 골라보세요.",
      React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: "#6b8792", marginLeft: 6 } }, "(최대 5개)")),
    React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 5, marginTop: 5, maxHeight: 92, overflowY: "auto", padding: 2 } },
      chips.map(function (c) { return chipEl(c, form.fl.some(function (x) { return x.l === c.l; }), function () { toggleChip(c); }, 0.95); })),
    React.createElement("div", { style: { fontSize: 11, fontWeight: 600, color: "#6b8792", marginTop: 4 } }, "테두리가 점선이면 아직 내 섬에 없는 말이에요. 탭하면 뜻이 보여요."),
    tipEl,
    warn ? React.createElement("div", { id: "plazaWarn", style: { marginTop: 8, fontSize: 13, color: "#b4532a", background: "#fff1ea", borderRadius: 8, padding: "6px 10px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } },
      React.createElement("span", { style: { flex: 1 } }, warn.text || warn),
      warn.name ? React.createElement("button", { onClick: function () { fixName(warn.name); }, style: { ...bSoft, padding: "4px 10px", fontSize: 12, color: "#b4532a", border: "1px solid #f0c9b3", background: "#fff" } }, "친구로 바꾸기") : null,
      warn.name ? React.createElement("span", { style: { flexBasis: "100%", fontSize: 11, fontWeight: 700, color: "#c47a5a" } }, "그대로 저장하면 선생님이 확인한 뒤에 보여요") : null) : null,
    React.createElement("div", { style: { display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 } },
      React.createElement("button", { onClick: function () { setMode("view"); setWarn(""); setTip(null); }, style: { ...bSoft, padding: "7px 14px", fontSize: 14 } }, "취소"),
      React.createElement("button", { onClick: save, disabled: saving, style: { ...bSoft, padding: "7px 18px", fontSize: 14, color: "#fff", background: "#0e7490", border: "1px solid #0e7490", opacity: saving ? 0.6 : 1 } }, saving ? "저장 중…" : "저장")));
  else body = React.createElement("div", null,
    // 2026-09-15 저녁(①): 답한 뒤 카드를 접지 않는다. 내 답만 한 줄로 접고(펼치기), 친구들의 답은 바로 아래 펼쳐진다.
    // 질문이 있는 날은 "오늘 우리 반이 많이 쓴 마음 말" 칩 줄을 빼서 질문과 겨루지 않게 했다(③) — 같은 말이 3D 화분에 있고, 칩은 질문 없는 날에만 크게 보인다.
    React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "#5b7684" } }, "오늘의 질문"),
    React.createElement("div", { "data-tut": "plz-q", style: { fontFamily: "'Jua',sans-serif", fontSize: qFont, color: "#0e7490", lineHeight: 1.4 } }, q.t),
    top3El,
    !ans ? React.createElement("div", null,
      React.createElement("div", { "data-tut": "plz-how", style: { display: "flex", alignItems: "center", gap: 10, marginTop: 12, flexWrap: "wrap" } },
        React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: "#3a5561" } }, "질문에 대한 답과 그때의 나의 마음을 자유롭게 적어주세요"),   // 2026-09-16: 세 칸 안내 → 한 칸
        React.createElement("button", { onClick: startWrite, style: { ...bSoft, padding: "8px 20px", fontSize: 15, color: "#fff", background: "#0e7490", border: "1px solid #0e7490" } }, "답하기")),
      // 쓰기 전에는 친구 답을 읽지 않는다(§8 "쓰기 전에 보면 베낀다"). 대신 몇 명이 답했는지만 알린다(게시판에도 같은 줄)
      React.createElement("div", { style: { marginTop: 10, fontSize: 13, fontWeight: 600, color: "#5b7684", background: "#f4f8fa", borderRadius: 8, padding: "7px 10px", lineHeight: 1.5 } },
        "친구들의 답은 내 답을 쓴 뒤에 보여요 · ", nOthers ? "지금 " + nOthers + "명이 답했어요" : "아직 답한 친구가 없어요"))
    : React.createElement("div", null,
      // 내 답: 접힌 한 줄(답 앞부분) + 상태 + 펼치기·고치기. 방금 저장했으면 펼쳐진 채
      React.createElement("div", { "data-tut": "plz-mine", style: { background: "#f7fbfc", border: "1px solid #dfeaee", borderRadius: 12, padding: "8px 12px 10px", marginTop: 10 } },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } },
          React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: "#0e7490" } }, "내 답"),
          ans.s === 2 ? React.createElement("span", { style: { fontSize: 12, fontWeight: 700, color: "#9a5b2b" } }, ans.nmf ? "이름이 들어 있어 선생님이 확인한 뒤에 보여요" : "선생님이 확인하고 있어요")
          : ans.s === 0 ? React.createElement("span", {style:{fontSize:12,color:"#6d786b"}}, "아직 공개되지 않았어요. 고치고 저장하면 자동 공개돼요") : ans.s === 1 ? React.createElement("span", { style: { fontSize: 14, fontWeight: 700, color: "#0e7490" } }, "이름 없이 자동 공개됐어요") : null,
          React.createElement("span", { style: { flex: 1 } }),
          React.createElement("button", { onClick: function () { setMineOpen(!mineOpen); }, style: { ...bSoft, padding: "3px 10px", fontSize: 12 } }, mineOpen ? "접기" : "펼치기"),
          ans.s !== 2 || ans.nmf ? React.createElement("button", { onClick: startWrite, style: { ...bSoft, padding: "3px 10px", fontSize: 12 } }, "고치기") : null),
        mineOpen ? ansBody(ans)
          : React.createElement("div", { style: { marginTop: 4, fontSize: 13, color: "#5b7684", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, plazaAnsText(ans) || "—")),
      // 광장은 섬을 키우지 않는다. 자동이 아니라 초대다 — 안 써도 아무것도 기록하지 않는다.
      bridge ? React.createElement("div", { style: { marginTop: 8, fontSize: 13, color: "#0e7490", background: "#e6f4f7", borderRadius: 8, padding: "6px 10px" } }, "이 마음을 일기에도 써 보면 섬에 자라요") : null,
      React.createElement("div", { "data-tut": "plz-pub", style: { display: "flex", alignItems: "baseline", gap: 8, marginTop: 16 } },
        React.createElement("span", { style: { fontFamily: "'Jua',sans-serif", fontSize: 17, color: "#2f6a97" } }, "친구들의 답"),
        React.createElement("span", { style: { fontSize: 12, fontWeight: 700, color: "#5b7684" } }, nOthers ? nOthers + "명이 답했어요" : "")),
      // 내 답은 위에 있으니 여기서는 뺀다. 문턱(3개)은 pub 전체로 세고 보이는 것만 거른다.
      pub.length ? pub.filter(function (p2) { return !p2.mine; }).map(function (p2, i) { return React.createElement(React.Fragment, { key: i }, ansCard(p2, false)); })
        : React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#5b7684", marginTop: 6, lineHeight: 1.6 } }, "답이 3개 이상 모이면 이름 없이 여기에 보여요.")),
    legendEl);

  return React.createElement("div", {className:"v2-modal-shade", onPointerDown:function(e){e.stopPropagation();}},
    React.createElement("section", {className:"v2-board", role:"dialog", "aria-modal":true, "aria-label":"우리 반 게시판"},
      React.createElement("header", null, React.createElement("div", null,
        React.createElement("small", null, "함께 나누는 마음"), React.createElement("h2", null, "우리 반 게시판")),
        React.createElement("button", {onClick:onBack, "aria-label":"게시판 닫기", autoFocus:true}, "닫기 ×")),
      React.createElement("div", {className:"v2-board-body"}, err ? React.createElement("p", {role:"alert"}, err) : body),
      React.createElement("footer", null, v2BoardNote())));
}
