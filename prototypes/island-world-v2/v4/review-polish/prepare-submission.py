"""Local preparation only. Never reads Firebase, credentials or student exports."""
from pathlib import Path
import json, shutil, hashlib, re, base64
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[3]
RELEASE=ROOT/'renders/releases/review-polish-20260922'
M=json.loads((RELEASE/'manifest.json').read_text())
PREVIEW=RELEASE/'memory-preview'
OUT=ROOT/('renders/review-polish-20260922/submission-preparation-'+M['version'])
PROGRAM=OUT/'program'
for d in ['document','document/evidence','media/image','media/movie','media/sound','media/font','media/model','source']:(OUT/d).mkdir(parents=True,exist_ok=True)
PROGRAM.mkdir(exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
# Copy only the current version and shared runtime media, excluding stale candidates.
shutil.copytree(PREVIEW/M['assetPath'],PROGRAM/M['assetPath'],dirs_exist_ok=True)
for p in PREVIEW.iterdir():
 if p.is_file() and p.suffix in ['.png','.webp','.svg']:shutil.copy2(p,PROGRAM/p.name)
for n in ['fonts','sounds','intro']:shutil.copytree(PREVIEW/n,PROGRAM/n,dirs_exist_ok=True)
shutil.copy2(PREVIEW/'__local-transaction.js',PROGRAM/'__local-transaction.js')
s=(PREVIEW/'index.html').read_text().replace('<script src="__local-review.js"></script>','').replace('<script src="__audio-probe.js"></script>','')
s=s.replace('가상 학급 체험 중. 새로고침하면 기록이 초기화돼요.','가상 예시 체험 중. 실제 학생 기록이 아니며 새로고침하면 초기화됩니다.')
assert "connect-src 'none'" in s and not re.search(r'firebase\.initializeApp|databaseURL:|firebase-database-compat',s)
(PROGRAM/'index.html').write_text(s)
scene=PROGRAM/M['assetPath']/'scene.js'
scene.write_text(scene.read_text().replace('const V4_QUERY=new URLSearchParams(location.search)','const V4_QUERY=new URLSearchParams()'))
# Keep useful model provenance while removing the creator's local account path.
def blind_paths(value):
 if isinstance(value,list):return [blind_paths(v) for v in value]
 if isinstance(value,dict):return {('originalFileName' if k=='originalPath' else k):blind_paths(v) for k,v in value.items()}
 if isinstance(value,str) and value.startswith('/Users/'):return Path(value).name
 return value
for p in PROGRAM.rglob('*.json'):
 text=p.read_text()
 if '/Users/' in text:p.write_text(json.dumps(blind_paths(json.loads(text)),ensure_ascii=False,indent=2)+'\n')
names=json.loads((HERE/'assets-names.json').read_text())
credits=json.loads((HERE/'credits.js').read_text().split('CREDITS=',1)[1].strip().removesuffix(';'))
sounds={x['file']:x for x in json.loads((HERE.parent/'audio-type/ASSETS.json').read_text()) if x['file'].endswith('.mp3')}
sounds.update({x['file']:x for x in json.loads((HERE.parent/'final-release/ASSETS.json').read_text())})
for filename,item in zip(['piano_loop.mp3','step.mp3','woosh.mp3'],credits['sections'][-1]['items'][:3]):
 sounds[filename]={'title':item['name'],'creator':item['by'],'source':item['url'],'license':'Pixabay Content License'}
rows=[]
for p in sorted(PROGRAM.rglob('*')):
 if not p.is_file():continue
 rel=str(p.relative_to(PROGRAM));kind=None;source='제작 기록 확인';desc=p.stem;status='확인 필요';url=''
 if p.suffix in ['.png','.webp','.svg']:
  kind='그림';folder='image';source='제작 이력 개별 확인';status='원본/제작 이력 확인 필요'
  if p.name.startswith('emo_'):source='Twemoji';status='CC BY 4.0';url='https://github.com/twitter/twemoji'
  elif p.name in ['storybook-world-v1.png','voyage-crew-v1.png','drifting-cloud-v3.png']:source='OpenAI 이미지 생성';status='생성 기록 보관';url='https://openai.com/policies/terms-of-use/'
  elif p.name=='user-title-v4.png':source='사용자 제공';status='제작 이력/사용권 확인 필요'
  elif p.name in ['cta-login-v5.svg','cta-start-v5.svg']:source='Jua 글자 윤곽, 프로젝트 제작';status='SIL OFL 1.1';url='https://github.com/google/fonts/tree/main/ofl/jua'
 elif p.suffix=='.mp3':
  kind='소리';folder='sound';a=sounds[p.name];desc=a['title'];source=a['creator'];status=a['license']+' / 제출·온라인 원본 배포 범위 증빙 필요';url=a['source']
 elif p.suffix in ['.woff2','.ttf','.otf']:
  kind='폰트';folder='font';source='파일별 서체';status='원본 라이선스 확인'
  if p.name.startswith('maplestory-'):source='넥슨코리아';desc='메이플스토리 서체 '+p.stem;status='넥슨 서체 조건 / 웹 서브셋 변환 허용 범위 확인 필요';url='https://maplestory.nexon.com/Media/Font'
  elif 'Pretendard' in p.name:source='길형진';desc='Pretendard 1.3.9';status='SIL OFL 1.1 / OFL-Pretendard.txt 동봉';url='https://github.com/orioncactus/pretendard'
  elif p.name=='jua-home.woff2':source='우아한형제들';desc='주아 웹 서브셋';status='SIL OFL 1.1 / OFL-Jua.txt 동봉';url='https://github.com/google/fonts/tree/main/ofl/jua'
 elif p.name.endswith('-data.js') and 'assets/models/' in rel:
  kind='그림(3D)';folder='model';ident=p.name[:-8];desc=names.get(ident,ident);source='Tripo 유료 플랜, 사용자 제공';status='유료 제작 사용자 확인 / 당시 결제·원본 모델 증빙 보관 필요';url='https://www.tripo3d.ai/terms'
  match=re.search(r"=['\"]([A-Za-z0-9+/=]{100,})['\"]",p.read_text())
  assert match,p.name
  model=base64.b64decode(match[1]);assert model[:4]==b'glTF'
  dest=OUT/'media/model'/(ident+'.glb');dest.write_bytes(model)
  rows.append({'type':kind,'file':str(dest.relative_to(OUT)),'runtime':rel,'bytes':len(model),'MB':round(len(model)/1000000,6),'description':desc+' (감정, 섬, 소품)','creator':source,'terms':status,'url':url,'sha256':sha(model)})
  continue
 if kind:
  dest=OUT/'media'/folder/rel;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,dest)
  rows.append({'type':kind,'file':str(dest.relative_to(OUT)),'runtime':rel,'bytes':p.stat().st_size,'MB':round(p.stat().st_size/1000000,6),'description':desc+' (감정, 탐험, 학습)','creator':source,'terms':status,'url':url,'sha256':sha(p.read_bytes())})
order={'그림':0,'그림(3D)':1,'소리':2,'폰트':3}
rows.sort(key=lambda x:(order[x['type']],x['file']))
for i,r in enumerate(rows,1):r['number']=i
(OUT/'document/media-register.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
md='# 서식 5 작성용 멀티미디어 목록\n\n최종 제출 전 검토용. 정적 실행 폴더의 자산을 빠짐없이 수록하여 이전 화면용 미사용 자료가 포함될 수 있다. 개별 설명·키워드와 출처 미확인 항목은 최종 확인 대상이다. 3D는 별도 GLB로 추출해 원본 형식과 연결했다.\n\n| 번호 | 자료 형태 | 파일명 | 크기(MB) | 자료 설명(키워드) | 출처 / 이용 조건 |\n|---|---|---|---:|---|---|\n'
for r in rows:md+='| '+str(r['number'])+' | '+r['type']+' | '+r['file']+' | '+str(r['MB'])+' | '+r['description']+' | '+r['creator']+' / '+r['terms']+(' / '+r['url'] if r['url'] else '')+' |\n'
(OUT/'document/서식5-멀티미디어목록.md').write_text(md)
for n in ['CONTEST_REVIEW.md','CREDITS.md','DATA_REGISTER.md','EVIDENCE_CHECKLIST.md']:
 shutil.copy2(HERE/n,OUT/'document'/n)
for i,n in enumerate(['home-1920.jpg','teacher-conversation.jpg'],1):
 shutil.copy2(ROOT/'renders/review-polish-20260922'/n,OUT/'document'/('마음바다탐험대-'+str(i).zfill(2)+'.jpg'))
for p in (PROGRAM/M['assetPath']/'fonts').glob('*.txt'):shutil.copy2(p,OUT/'document/evidence'/p.name)
shutil.copy2(ROOT/'prototypes/island-world-v2/tripo/vendor/THREE-LICENSE.txt',OUT/'document/evidence/THREE-LICENSE.txt')
# Runtime JavaScript/HTML/CSS is the executable source; retain an exact copy.
shutil.copytree(PROGRAM,OUT/'source/runtime',dirs_exist_ok=True)
hashes={str(p.relative_to(PROGRAM)):sha(p.read_bytes()) for p in PROGRAM.rglob('*') if p.is_file()}
for n,h in hashes.items():assert sha((OUT/'source/runtime'/n).read_bytes())==h
(OUT/'document/program-hashes.json').write_text(json.dumps({'candidate':M['version'],'productionDatabase':False,'finalSubmission':False,'files':hashes},indent=2)+'\n')
(OUT/'README.md').write_text('''# 제출 준비 폴더 — 최종 제출본 아님

이 폴더에는 가상 학급만 들어 있습니다. 운영 서버에 접속하지 않습니다. 날짜는 실행일 기준 예시이며 연구 결과에 사용할 수 없습니다.

- `program/index.html`: Firebase SDK/설정을 제거한 메모리 실행본. 새로고침 시 체험 입력 초기화.
- `source/runtime`: 실행본과 바이트가 같은 HTML/JS/CSS 및 자산. 원래 제작 폴더와 추가 원본/개발환경 자료는 최종 제출 때 함께 대조해야 합니다.
- `media`: 그림, 소리, 글꼴, GLB 모델. 자산 목록과 해시를 함께 기록했습니다.
- `document`: 요강 검토, 서식 5 작성용 목록, 출처 정리, 확보된 라이선스, 파일 해시.

아직 없는 것: 연구보고서 HWP/PDF 일반·블라인드 4종, 출품원서/서약서, 서식 9 확인서, 표절검증보고서, 실제 연구자료 검토, 미확인 자산의 사용권 증빙, Windows/Linux/Edge/Chrome/Safari 실제 실행 검증.

학교 보관용 보호자 동의서와 실제 학생 명단은 이 폴더에 넣지 않습니다. 수정한 동의서는 앱의 가상 교사 화면에서 내려받을 수 있습니다. 기존 운영 데이터를 삭제하거나 옮기지 않았습니다.
''')
print(json.dumps({'path':str(OUT),'assets':len(rows),'runtimeFiles':len(hashes),'sourceMatches':True,'finalSubmission':False},ensure_ascii=False))
