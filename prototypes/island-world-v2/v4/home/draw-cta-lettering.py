"""Generate level SVG button lettering; every glyph uses the same unrotated baseline."""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen
from html import escape
import sys
font=TTFont(sys.argv[1]);glyphs=font.getGlyphSet();cmap=font.getBestCmap();upm=font['head'].unitsPerEm
out=Path(__file__).resolve().parent/'art'
for name,text,size in [('cta-login-v5.svg','로그인하고',26),('cta-start-v5.svg','시작하기',44)]:
    x=0;paths=[];bounds=[];scale=size/upm
    for i,c in enumerate(text):
        g=glyphs[cmap[ord(c)]]
        matrix=(scale,0,0,-scale,x,0)
        pen=SVGPathPen(glyphs);g.draw(TransformPen(pen,matrix));paths.append('<path d="'+pen.getCommands()+'"/>')
        bp=BoundsPen(glyphs);g.draw(TransformPen(bp,matrix));bounds.append(bp.bounds);x+=g.width*scale
    left=min(b[0] for b in bounds)-5;top=min(b[1] for b in bounds)-5
    right=max(b[2] for b in bounds)+5;bottom=max(b[3] for b in bounds)+7
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{left:.3f} {top:.3f} {right-left:.3f} {bottom-top:.3f}" width="{right-left:.3f}" height="{bottom-top:.3f}" role="img" aria-label="{escape(text)}"><title>{escape(text)}</title><defs><linearGradient id="cream" x2="0" y2="1"><stop stop-color="#fffffa"/><stop offset="1" stop-color="#fff1bd"/></linearGradient><filter id="depth" x="-20%" y="-35%" width="140%" height="180%"><feDropShadow dx="0" dy="1.5" stdDeviation="0" flood-color="#a84e46" flood-opacity=".5"/></filter></defs><g fill="url(#cream)" stroke="#b84640" stroke-width="1.6" paint-order="stroke fill" stroke-linejoin="round" filter="url(#depth)">'+''.join(paths)+'</g></svg>'
    (out/name).write_text(svg)
    print(name,round(right-left,2),round(bottom-top,2))
