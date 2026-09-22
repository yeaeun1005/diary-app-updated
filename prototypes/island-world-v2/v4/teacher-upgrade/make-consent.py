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
font_dir=HERE/'output/fonts'
for family in ['Korean','KoreanBold']:
    pdfmetrics.registerFont(TTFont(family,str(font_dir/(family+'.ttf'))))
pdfmetrics.registerFontFamily('Korean',normal='Korean',bold='KoreanBold')
c = canvas.Canvas(str(OUT), pagesize=A4)
c.setTitle('마음 바다 탐험대 - 보호자 개인정보 수집·이용 동의서')
c.setAuthor('마음 바다 탐험대')
W, H = A4
navy, sea, muted = map(HexColor, ['#173F4A', '#157F83', '#506870'])
style = ParagraphStyle('body', fontName='Korean', fontSize=10.4, leading=16, textColor=navy, wordWrap='CJK')
def text(x, y, value, size=11, color=navy):
    c.setFillColor(color); c.setFont('KoreanBold' if size>=18 else 'Korean', size); c.drawString(x, y, value)
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
paragraph('감정일기와 마음 대화 활동에 필요한 개인정보를 아래와 같이 수집하고 이용합니다.',42,H-127,W-84)
box(42,H-239,W-84,80)
text(56,H-181,'수집·이용 주체(학교명): __________________________________________________',10.5)
text(56,H-203,'담당 교사: ___________________   문의처: _________________________________',10.5)
text(56,H-225,'대상 학급: __________학년 __________반   활동 기간: ______________________',10.5)

y=H-257
rows=[
 ('이용 목적','학생 식별 및 학급 활동 관리, 감정일기 작성·분석, 마음 대화와 감정 어휘 학습 지원',45),
 ('수집 항목','학생 번호 또는 이름, 학년과 반, 로그인 아이디, 감정일기와 분석 결과, 마음 대화, 학습 활동, 게시판 답변과 공감 기록',61),
 ('보유·이용 기간','________년 ____월 ____일 ~ ________년 ____월 ____일<br/>기간 종료 또는 이용 목적 달성 시 학교의 절차에 따라 삭제합니다.',53),
]
for label,body,height in rows:
    c.setFillColor(HexColor('#EEF6F4')); c.rect(42,y-height,90,height,fill=1,stroke=0)
    c.setStrokeColor(HexColor('#B4CDCD')); c.rect(42,y-height,W-84,height,fill=0,stroke=1)
    text(53,y-22,label,10.5,sea); paragraph(body,144,y-12,W-200); y-=height

y-=19
y-=paragraph('학생은 이름 대신 번호로 등록할 수 있습니다. 일기에 주소, 전화번호 등 활동과 관계없는 개인정보를 적지 않도록 안내합니다.',42,y,W-84)
y-=11
y-=paragraph('기록은 Google Firebase 서버에 저장됩니다. 일기와 마음 대화는 학생 본인과 담당 교사가 봅니다. 학생이 공개를 선택한 일기는 같은 반 친구도 읽을 수 있으며, 공개는 취소할 수 있습니다. 게시판 답변은 이름 없이 공개됩니다.',42,y,W-84)
y-=11
y-=paragraph('동의하지 않아도 불이익은 없습니다. 온라인 기록 활동 대신 아래 대체 활동에 참여합니다. 담당 교사에게 기록 확인과 수정, 삭제 또는 동의 철회를 요청할 수 있습니다.',42,y,W-84)
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
paragraph('학교명, 활동 기간, 문의처, 대체 활동을 적은 뒤 배부합니다.<br/>서명한 동의서는 학교에서 보관합니다.',53,54,W-106,8.5)
c.showPage();c.save();print(OUT)
