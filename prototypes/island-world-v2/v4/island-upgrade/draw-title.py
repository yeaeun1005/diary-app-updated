from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[3]
fonts=[TTFont(p) for p in (ROOT/'fonts').glob('maplestory-bold-*.woff2')]
def line(text,size,y,colors):
 x=9;paths=[]
 for i,c in enumerate(text):
  if c==' ':x+=size*.25;continue
  f=next(f for f in fonts if ord(c) in f.getBestCmap());gs=f.getGlyphSet();g=gs[f.getBestCmap()[ord(c)]];scale=size/f['head'].unitsPerEm
  p=SVGPathPen(gs);g.draw(TransformPen(p,(scale,0,0,-scale,x,y)))
  paths.append(f'<path d="{p.getCommands()}" fill="{colors[i%len(colors)]}"/>');x+=g.width*scale
 return ''.join(paths),x
small,w=line('마음 바다 탐험대',17,23,['#306e78'])
big,w=line('내 마음섬',42,70,['#198b83','#198b83','#157fba','#157fba','#ee9560','#ee9560'])
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w+12} 91" role="img" aria-label="마음 바다 탐험대 · 내 마음섬"><title>마음 바다 탐험대 · 내 마음섬</title><defs><filter id="shadow" x="-10%" y="-20%" width="130%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="0" flood-color="#3f847a" flood-opacity=".28"/></filter></defs><g stroke="#fffef1" stroke-linejoin="round" paint-order="stroke fill" stroke-width="4">{small}</g><g filter="url(#shadow)" stroke="#fffef1" stroke-linejoin="round" paint-order="stroke fill" stroke-width="6">{big}</g><path d="M15 81Q34 75 52 81T91 81" fill="none" stroke="#d9fbef" stroke-width="4" stroke-linecap="round"/><path d="m{w-5} 18 3-7 3 7 7 3-7 3-3 7-3-7-7-3Z" fill="#ffdf7c" stroke="#fffef1" stroke-width="2"/></svg>'''
(HERE/'island-title.svg').write_text(svg)
