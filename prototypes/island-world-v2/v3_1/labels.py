"""V3.1 display-only changes. Never replace words in records or vocabulary data.

The input is the verified local tree trial, not production index.html. Exact
boundaries fail closed when the baseline changes. Each edit is logged for review.
"""
def apply_labels(text, kind):
    edits = []

    def replace(old, new, reason, count=1):
        nonlocal text
        assert text.count(old) == count, f'{kind}: changed boundary: {old[:100]}'
        text = text.replace(old, new)
        edits.append({'reason': reason, 'occurrences': count, 'old': old, 'new': new})

    def remove_line(fragment, reason):
        lines = [line for line in text.splitlines(keepends=True) if fragment in line]
        assert len(lines) == 1, f'{kind}: expected one display line: {fragment}'
        replace(lines[0], '', reason)

    if kind == 'world':
        # The region objects keep their IDs, coordinates, colors and internal names.
        # Hide the complete region title block, including its former poetic alias.
        replace("v2h('section',{className:'v2-location'},", "!ui.zone.key&&v2h('section',{className:'v2-location'},", '구역 진입 이름/별칭 숨김; 부두·마당·해안 위치 안내 보존')
        replace("'aria-label':'활기 북쪽, 평온 동쪽, 슬픔 남쪽, 떨림 서쪽'", "'aria-label':'섬의 길과 연못, 현재 위치'", '지도 접근성 설명에서 구역명 제거')
        remove_line("V2.zones.map(z=>v2h('text'", '지도 구역 이름표 제거; 지도 도형·현재 위치 유지')
        # Retain every walking destination. Arrows are directions on the fixed map,
        # not new names for regions; no generated alias or A/B/C/D designation.
        replace("[...Object.values(V2.stops),...V2.zones.map(z=>({...z,title:z.name+' 구역'}))].map(s=>button(s.title,null,",
                "[...Object.entries(V2.stops).map(([key,s])=>key==='garden'?{...s,title:'→ 걷기',hint:'지도 오른쪽 길로 걷기'}:s),...V2.zones.map((z,i)=>({...z,title:['↑ 걷기','→ 걷기','↓ 걷기','← 걷기'][i],hint:['지도 위쪽으로 걷기','지도 오른쪽으로 걷기','지도 아래쪽으로 걷기','지도 왼쪽으로 걷기'][i]}))].map(s=>button(s.title,s.hint,",
                '기존 자동 걷기 목적지는 유지하고 구역명 버튼을 지도 방향 조작으로 표시')
    elif kind == 'landing':
        replace("v2h('i',{className:'mood-'+i,'aria-hidden':true}),name)",
                "v2h('i',{className:'mood-'+i,'aria-hidden':true}))", '첫 화면 범례: 네 색과 존중 문구를 유지하고 구역명만 제거')
    elif kind == 'board':
        remove_line('  var lab = { HA:', '게시판 구역 이름 매핑 표시 제거')
        remove_line('  var pill = function (q2)', '마음 말 옆 구역 이름 배지 제거')
        replace('}, tip.l), pill(tip.q), " ",', '}, tip.l), " ",', '실제 마음 말·뜻은 유지')
    elif kind == 'html':
        # Charts retain the four true energy/valence axes and all point data.
        # Teacher analytical terminology is not a student place label.
        for teacher, student in [('활기·흥분', '활기'), ('떨림(분노·불안)', '떨림'), ('슬픔·피로', '슬픔'), ('평온·만족', '평온')]:
            replace(f'c.fillText(teacher ? "{teacher}" : "{student}",', f'if (teacher) c.fillText("{teacher}",', '학생 감정 지도 구역명 제거; 축·교사 분석 용어 유지')
        replace('MODE==="teacher")?QM[q].tname:QM[q].name;', 'MODE==="teacher")?QM[q].tname:"";', '학생 리포트의 영역 범례 이름 제거; 데이터·비율·색 보존')
        replace('" 학생은 이 기간 동안 ‘"+qn(domQ)+"’ 감정을 가장 자주 표현했고, 긍정적인 감정이 전체의 약 "',
                '" 학생은 이 기간 동안 "+(qn(domQ)?"‘"+qn(domQ)+"’ 감정을 가장 자주 표현했고, ":"")+"긍정적인 감정이 전체의 약 "',
                '구역명 삭제 뒤 빈 인용문이 남지 않도록 해당 절만 생략')
        remove_line('}, Q_NAME[nearPlant.q] || ""),', '기존 식생 카드의 구역 배지 제거; 마음 말/뜻 보존')
        replace('"이 마음과 같은 쪽(" + (Q_NAME[nearPlant.q] || "") + ") 마음을 아직 써 본 적이 없어요. 써 본 뒤에 누를 수 있어요"',
                '"이 마음과 같은 쪽 마음을 아직 써 본 적이 없어요. 써 본 뒤에 누를 수 있어요"', '공감 안내의 구역명만 제거; 조건 보존')
        for name in ['활기', '평온', '슬픔', '떨림']:
            remove_line(f'fontWeight: 700 }} }}, "{name}"),', '기존 섬 나침반의 구역 이름만 제거; 축 캡션 유지')
        remove_line('marginBottom: 3 } }, Q_NAME[qk]),', '마음 말 목록의 구역 머리말 제거')
        remove_line('marginBottom: 4 } }, Q_NAME[qk]),', '마음 말 표의 구역 머리말 제거')
        replace('plazaFlagTexture(Q_NAME[q] || q, QC[q], flip)', 'plazaFlagTexture("", QC[q], flip)', '기존 3D 깃발의 구역명 텍스처 제거; 색·형태·배치 유지')
        remove_line('  var lab = { HA:', '기존 게시판 구역 이름 표시 매핑 제거')
        remove_line('  var pill = function (q2)', '기존 게시판 구역 배지 제거')
        replace('}, tip.l), pill(tip.q), " ",', '}, tip.l), " ",', '기존 게시판 실제 마음 말·뜻 보존')
        replace('마음의 네 방향이에요. 활기·평온·슬픔·떨림, 내 섬 나침반과 같아요.', '마음의 네 방향이에요. 내 섬 나침반과 같아요.', '기존 범례에서 구역명 나열만 제거')
        replace('활기·평온·슬픔·떨림, 네 방향이에요. 섬에서도 같은 방향에 자라요.', '마음의 네 방향이에요. 섬에서도 같은 방향에 자라요.', '튜토리얼 구역명 나열만 제거')
        for name in ['활기', '평온', '슬픔', '떨림']:
            replace(f'"{name} 영역: ', '"', '기존 첫 화면 이미지 대체 설명의 구역명 제거')
        replace('슬픔 영역에는 갈대와 들꽃, 그리고 등불이 자랍니다', '갈대와 들꽃, 그리고 등불이 자랍니다', '기존 첫 화면 설명의 장소 이름만 제거')
    else:
        raise ValueError(kind)
    return text, edits
