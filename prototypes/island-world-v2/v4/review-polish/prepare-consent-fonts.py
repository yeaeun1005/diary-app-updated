from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
V4=Path(__file__).resolve().parent.parent
out=V4/'teacher-upgrade/output/fonts';out.mkdir(parents=True,exist_ok=True)
for family,weight in [('Korean',500),('KoreanBold',700)]:
    font=TTFont(V4/'audio-type/assets/PretendardVariable.woff2')
    font=instantiateVariableFont(font,{'wght':weight},inplace=True)
    font.flavor=None;font.save(out/(family+'.ttf'))
print('Prepared Pretendard 500 and 700 for PDF embedding')
