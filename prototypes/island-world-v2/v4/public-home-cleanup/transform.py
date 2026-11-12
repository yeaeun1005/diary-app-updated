"""Remove judging-related presentation and the credits screen from the active app."""
import re


def once(text, old, new):
    assert text.count(old) == 1, old[:100]
    return text.replace(old, new)


def apply(page, assets):
    page = once(page, ',onCredits:function(){setPage("credits");}', '')
    start = page.index('  // 출처와 저작권(2026-09-17).')
    end = page.index('  // 섬은 화면을 꽉 채운다.', start)
    page = page[:start] + page[end:]
    start = page.index('// 출처와 저작권 페이지(2026-09-17).')
    end = page.index('function App() {', start)
    page = page[:start] + page[end:]
    page = once(page, '체험 계정은 이용이 종료되었어요. 학교에서 받은 계정으로 로그인해 주세요.',
                '사용할 수 없는 계정이에요. 학교 코드와 계정 정보를 확인해 주세요.')
    obsolete = '- 체험 모드: 데이터가 저장되지 않으며, 페이지 종료 시 자동 삭제'
    escaped = ''.join('\\u%04X' % ord(c) if ord(c) > 127 else c for c in obsolete)
    page = once(page, ', React.createElement("br", null), "' + escaped + '"', '')
    page = once(page, '개인정보 보호책임자: 본 서비스 개발·운영 연구진',
                '개인정보 보호책임자: 본 서비스 개발·운영자')
    for name, tag in [('credits.js', 'script'), ('credits.css', 'link')]:
        if tag == 'script':
            page, n = re.subn(r'<script src="island-v4/[^/]+/credits\.js"></script>', '', page)
        else:
            page, n = re.subn(r'<link rel="stylesheet" href="island-v4/[^/]+/credits\.css">', '', page)
        assert n == 1
        del assets[name]
    # Remove the now-unused ribbon styles; the ribbon and review account paths
    # were already removed in the preceding release.
    diary_layout = '.diary-head { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; column-gap: 12px; row-gap: 8px; }'
    assert diary_layout in page
    page, count = re.subn(r'#demo-ribbon(?:\[data-page="[^"]+"\])?\s*\{[^{}]*\}', '', page)
    assert count == 5 and diary_layout in page
    landing = assets['legacy/landing.js'].decode()
    landing = once(landing, '{onLogin,onPrivacy,onCredits,authOpen,signedIn=false}',
                   '{onLogin,onPrivacy,authOpen,signedIn=false}')
    landing = once(landing, "    v2h('p',{className:'voyage-audience'},'초등 1-6학년, 국어, 도덕'),\n", '')
    landing = once(landing, "v2h('button',{onClick:onPrivacy,'aria-label':'개인정보 안내'},icon('privacy'),'개인정보 안내'),\n      v2h('button',{onClick:onCredits,'aria-label':'저작권 안내'},icon('credits'),'저작권 안내')",
                   "v2h('button',{onClick:onPrivacy,'aria-label':'개인정보 안내'},icon('privacy'),'개인정보 안내')")
    assets['legacy/landing.js'] = landing.encode()
    sound = assets['sound.js'].decode()
    start = sound.index(' CREDITS.sections.find(')
    end = sound.index('})();', start)
    sound = sound[:start] + sound[end:]
    assets['sound.js'] = sound.encode()
    assert not any('CREDITS.' in data.decode() for name, data in assets.items() if name.endswith('.js'))
    assert not any(word in page + landing for word in ('CreditsPage', 'onCredits', '초등 1-6학년, 국어, 도덕', '저작권 안내', '심사용'))
    return page, assets
