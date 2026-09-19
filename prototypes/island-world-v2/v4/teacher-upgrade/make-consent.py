"""Printable school-completed consent template; no student information is read."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle

HERE = Path(__file__).resolve().parent
OUT = HERE / 'output/pdf/guardian-consent.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
pdfmetrics.registerFont(TTFont('Korean', '/System/Library/Fonts/Supplemental/AppleGothic.ttf'))
c = canvas.Canvas(str(OUT), pagesize=A4)
c.setTitle('마음 바다 탐험대 - 보호자 개인정보 수집·이용 동의서')
c.setAuthor('마음 바다 탐험대')
W, H = A4
navy, sea, muted = map(HexColor, ['#173F4A', '#157F83', '#506870'])
style = ParagraphStyle('body', fontName='Korean', fontSize=10.4, leading=16, textColor=navy, wordWrap='CJK')
def text(x, y, value, size=11, color=navy):
    c.setFillColor(color); c.setFont('Korean', size); c.drawString(x, y, value)
def paragraph(value, x, top, width, font_size=10.4):
    s = ParagraphStyle('p', parent=style, fontSize=font_size)
    p = Paragraph(value, s); _, height = p.wrap(width, 1000); p.drawOn(c, x, top-height); return height
def box(x, y, w, h):
    c.setStrokeColor(HexColor('#B4CDCD')); c.setLineWidth(.7); c.roundRect(x,y,w,h,6,stroke=1,fill=0)
def checkbox(x, y, label):
    c.setStrokeColor(navy); c.rect(x,y,10,10,stroke=1,fill=0); text(x+17,y,label,11)

c.setFillColor(sea); c.rect(42,H-53,32,4,fill=1,stroke=0)
text(42,H-77,'마음 바다 탐험대  |  보호자용',11,sea)
text(42,H-111,'개인정보 수집·이용 동의서',22)
paragraph('학생이 자신의 마음을 기록하고 이해하는 학급 감정 교육 활동에 관한 안내입니다.',42,H-127,W-84)
box(42,H-239,W-84,80)
text(56,H-181,'수집·이용 주체(학교명): __________________________________________________',10.5)
text(56,H-203,'담당 교사: ___________________   문의처: _________________________________',10.5)
text(56,H-225,'대상 학급: __________학년 __________반   활동 기간: ______________________',10.5)

y=H-257
rows=[
 ('이용 목적','학생 식별 및 학급 활동 관리, 감정일기 작성·분석, 마음 대화와 감정 어휘 학습 지원',45),
 ('수집 항목','번호(또는 이름), 학년·반, 로그인 아이디, 감정일기 내용·분석 결과, 마음 대화 및 학습 활동 기록, 게시판·공감 활동 기록',61),
 ('보유·이용 기간','________년 ____월 ____일 ~ ________년 ____월 ____일<br/>기간 종료 또는 이용 목적 달성 시 학교의 절차에 따라 삭제합니다.',53),
]
for label,body,height in rows:
    c.setFillColor(HexColor('#EEF6F4')); c.rect(42,y-height,90,height,fill=1,stroke=0)
    c.setStrokeColor(HexColor('#B4CDCD')); c.rect(42,y-height,W-84,height,fill=0,stroke=1)
    text(53,y-22,label,10.5,sea); paragraph(body,144,y-12,W-200); y-=height

y-=19
y-=paragraph('번호로 등록하면 이름을 대신할 수 있습니다. 일기에는 주민등록번호·주소·전화번호 등 활동에 필요하지 않은 개인정보를 적지 않도록 지도합니다.',42,y,W-84)
y-=11
y-=paragraph('서비스 기록은 Firebase(Google) 서버에 저장됩니다. 공개 설정과 교사 검토에 따라 게시판·친구 방문에 일부 활동이 표시될 수 있습니다. 학교는 실제 운영 방식과 개인정보 처리 안내를 함께 제공합니다.',42,y,W-84)
y-=11
y-=paragraph('보호자는 동의를 거부할 수 있으며, 담당 교사에게 열람·정정·삭제 또는 동의 철회를 요청할 수 있습니다. 동의하지 않으면 계정 생성과 기록을 저장하는 활동이 제한될 수 있습니다.',42,y,W-84)
y-=24
text(42,y,'동의하지 않는 학생의 대체 활동(학교 작성): _______________________________',10.4)
y-=30
c.setStrokeColor(HexColor('#B4CDCD'));c.line(42,y,W-42,y)
y-=24
text(42,y,'위 내용을 확인하고 학생의 개인정보 수집·이용에 대해 선택합니다.',11)
y-=26
checkbox(62,y,'동의함');checkbox(245,y,'동의하지 않음')
y-=33
text(42,y,'학생 번호(또는 이름): ___________________   작성일: ______년 ___월 ___일',10.8)
y-=28
text(42,y,'보호자 성명: ___________________   학생과의 관계: __________   서명: __________',10.8)
assert y>65, ('Content overflow',y)
c.setFillColor(HexColor('#EEF6F4'));c.roundRect(42,29,W-84,30,5,fill=1,stroke=0)
paragraph('학교 작성용 양식입니다. 배포 전 학교명·기간·문의처와 실제 수집 항목을 확인해 작성하고,<br/>서명된 동의서는 담당 교사가 학교의 보관 절차에 따라 관리해 주세요.',53,54,W-106,8.5)
c.showPage();c.save();print(OUT)
