"""Opt-in student chart typography; math/data and teacher defaults stay unchanged."""
def apply(page):
    a=page.index('function CircumplexChart({');b=page.index('function TrendChart({',a)
    chart=page[a:b]
    chart=chart.replace('  teacher\n','  teacher,\n  readable=false\n',1)
    chart=chart.replace('c.font = "700 12px \'Gowun Dodum\',system-ui";', 'c.font = readable ? "700 13px Maplestory,sans-serif" : "700 12px \'Gowun Dodum\',system-ui";')
    chart=chart.replace('if (!dim) {','if (!dim && (!readable || isH || entries.length === 1)) {')
    chart=chart.replace('c.font = (isH ? "700 " : "600 ") + (isH ? "13" : "10") + "px \'Gowun Dodum\',system-ui";', 'c.font = readable ? "700 14px Maplestory,sans-serif" : (isH ? "700 " : "600 ") + (isH ? "13" : "10") + "px \'Gowun Dodum\',system-ui";')
    chart=chart.replace('[entries, sz, hovIdx, cx, cy, rad]', '[entries, sz, hovIdx, cx, cy, rad, readable]')
    page=page[:a]+chart+page[b:]
    a=page.index('function TrendChart({');b=page.index('function EmoTag({',a)
    chart=page[a:b].replace('  entries\n','  entries,\n  readable=false\n',1)
    chart=chart.replace('  const W = 540,','''  const [chartWidth,setChartWidth]=useState(540);
  useEffect(()=>{if(!readable||!cRef.current)return;const node=cRef.current.parentElement,ro=new ResizeObserver(([e])=>setChartWidth(Math.max(220,Math.min(540,e.contentRect.width))));ro.observe(node);return()=>ro.disconnect();},[readable,entries.length>=2]);
  const W = readable ? chartWidth : 540,''')
    chart=chart.replace('c.font = "9px \'Gowun Dodum\',system-ui";', 'c.font = readable ? "700 12px Maplestory,sans-serif" : "9px \'Gowun Dodum\',system-ui";')
    chart=chart.replace('c.fillStyle = "rgba(0,0,0,0.3)";', 'c.fillStyle = readable ? "#416357" : "rgba(0,0,0,0.3)";')
    chart=chart.replace('c.fillStyle = "rgba(0,0,0,0.4)";', 'c.fillStyle = readable ? "#416357" : "rgba(0,0,0,0.4)";')
    chart=chart.replace('entries.forEach((e, i) => c.fillText(e.date, xO(i), H - 8));','entries.forEach((e, i) => {if(!readable||i % Math.max(1,Math.ceil(entries.length/Math.max(2,Math.floor(W/65))))===0||i===entries.length-1)c.fillText(readable ? e.date.replace(/^\\d{4}-/,"") : e.date, xO(i), H - 8);});')
    chart=chart.replace('}, [entries]);','}, [entries,W,readable]);')
    return page[:a]+chart+page[b:]
