"""Bounded HTML integration for diary and board fixes; no IO or network."""
def apply(source):
    def rep(s,a,b):
        assert s.count(a)==1,(a[:90],s.count(a));return s.replace(a,b)
    s=source
    # Review mode keeps its memory boundary, but all dates now follow the user's device.
    s=rep(s,'var DEMO_CLOCK = "2026-09-16";', 'var DEMO_CLOCK = dayStamp(Date.now());')
    s=rep(s,'function nowTs() { return DEMO_FROZEN ? DEMO_CLOCK_MS + (Date.now() - DEMO_T0) : Date.now(); }', 'function nowTs() { return Date.now(); }')
    s=rep(s,'q: QC[x.q] ? x.q : "LA" }; });', 'q: QC[x.q] ? x.q : "" }; });')
    # Contracted cause clauses still describe the writer's reaction (e.g. 줘서 고마웠다).
    s=rep(s,'(?:해서|려서|어서|아서|니까|는데|지만|다가|때문에|덕분에)$', '(?:해서|려서|어서|아서|줘서|와서|봐서|돼서|여서|워서|니까|는데|지만|다가|때문에|덕분에)$')
    # Teacher-facing labels and tutorial. IDs and database paths stay unchanged.
    a=s.index('function teacherTourSteps()');b=s.index('// ── 바다 투어',a)
    part=s[a:b].replace('광장','우리반 게시판')
    part=rep(part,'    S("t-watch",', '''    S("t-reward", "탐험 보상 난이도", "학년·반을 고른 뒤 우리 반에 맞는 단계를 정해요. 1단계는 일기 저장, 2단계는 일기와 분석 확인, 3단계는 마음 대화까지예요. 대화할 내용이 없으면 학생이 [오늘은 대화할 내용이 없어요]를 선택해요. [난이도 저장하기]를 누르면 다음 활동 확인부터 적용되고, 이미 받은 선물은 유지돼요. 학생이 없는 반은 먼저 학생을 등록해 주세요."),
    S("t-watch",''')
    s=s[:a]+part+s[b:]
    a=s.index('  const plzCode =')
    b=s.index('  const [myEntries, setME]',a)
    s=s[:a]+s[a:b].replace('광장','우리반 게시판')+s[b:]
    # Tutorial/fallback board copy must agree with the actual V4 board.
    s=s.replace("친구 이름은 쓰지 않아요. '어떤 친구가'라고 써요.","나와 친구의 이름은 쓰지 않아요.")
    s=s.replace("친구 이름 대신 '어떤 친구가'라고 써요.","나와 친구의 이름은 쓰지 않아요.").replace("친구 이름 대신 '어떤 친구가'라고 써요", "나와 친구의 이름은 쓰지 않아요.")
    s=s.replace('테두리가 점선이면 아직 내 섬에 없는 말이에요. 탭하면 뜻이 보여요.', '색깔이 없는 감정 단어는 내가 아직 사용해보지 않은 단어에요. 누르면 뜻을 알 수 있어요.')
    return s
