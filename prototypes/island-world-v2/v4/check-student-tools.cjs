// Uses the real, existing dictionary/analyzer without DOM, accounts or network.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const slice=(a,b)=>{const start=html.indexOf(a),end=html.indexOf(b,start);assert(start>=0&&end>start);return html.slice(start,end);};
const ctx=vm.createContext({console,Map,Set,Date});
vm.runInContext(slice('function normalizeKorean(t)','function safeAnalysis(a)'),ctx);
vm.runInContext(slice('const SITUATION_MAP =','function MindChat({'),ctx);
vm.runInContext(slice('function extractSituations(textArray)','function fmtDate(d)'),ctx);
vm.runInContext('function v4Analyze(text){return analyzeEntry(text)}',ctx);
vm.runInContext(fs.readFileSync('prototypes/island-world-v2/v4/student-tools-model.js','utf8'),ctx);
const read=s=>JSON.parse(vm.runInContext('JSON.stringify('+s+')',ctx));
const raw='오늘 발표를 했다. 나는 긴장했고 끝나고 뿌듯했다.';
ctx.raw=raw;
const d=read('V4StudentTools.detected(raw)');assert(d.situations.some(s=>s.ctx==='발표'));assert(d.words.includes('긴장'));assert(d.words.includes('뿌듯'));
const prepared=read("V4StudentTools.prepare(raw,['편안','편안'],['발표'],'2026-09-19',9)");
assert.equal(prepared.text,raw);assert.deepEqual(prepared.analysis.studentSelection,['편안']);assert(prepared.analysis.hits.some(h=>h.label==='긴장'));assert(!prepared.analysis.hits.some(h=>h.token==='직접선택'));
const selection=read("V4StudentTools.prepare('', ['행복'],['친구'],'2026-09-19',10)");assert(selection.text.includes('행복'));assert.equal(selection.analysis.hits.length,0);assert.deepEqual(selection.analysis.studentSelection,['행복']);
ctx.records=[
 {ts:3,text:'친구와 학교에서 놀았다.',analysis:{hits:[{label:'행복',val9:8,valStd:.75,aroStd:0},{label:'행복',val9:8,valStd:.75,aroStd:0},{label:'슬픔',val9:2,valStd:-.75,aroStd:0}],matchedPos:[{word:'좋아'},{word:'좋아'}],posPct:60,negPct:40}},
 {ts:2,text:'발표했다.',analysis:{hits:[{label:'행복',valStd:.75,aroStd:0},{label:'직접 말',val9:2,token:'직접선택'}],posPct:100,negPct:0}},
 {ts:1,text:'쉬었다.',analysis:{hits:[],posPct:0,negPct:0}},
 {ts:0,text:'분석 실패.',analysis:{status:'unavailable',hits:[{label:'오류',val9:8}],posPct:null,negPct:null}}
];
const before=JSON.stringify(ctx.records),summary=read('V4StudentTools.summarize(records)');
assert.equal(summary.positive.find(x=>x.label==='행복').count,2);assert.equal(summary.positive.find(x=>x.label==='좋아').count,1);assert.equal(summary.negative.length,1);assert.equal(summary.trendEntries.length,2);assert.equal(summary.trendEntries[0].ts,2);assert.equal(summary.positiveSituations.find(s=>s.text==='친구').count,1);assert.equal(JSON.stringify(ctx.records),before);
ctx.records=Array.from({length:14},(_,i)=>({text:'학교',analysis:{hits:[{label:'표현'+i,val9:8}]}}));assert.equal(read('V4StudentTools.summarize(records)').positive.length,10);
const suggestions=read("V4StudentTools.actionExamples(detectSituations('친구와 다퉜다. 발표도 했다.'))");assert(suggestions.some(x=>x.includes('내 이야기도')));assert(suggestions.some(x=>x.includes('설명해')));assert.equal(new Set(suggestions).size,suggestions.length);
const M=require('./activity-model.js');assert.deepEqual(M.words(prepared,{}).chosen,['편안']);assert.equal(M.recordDate(prepared),'2026-09-19');
console.log(JSON.stringify({pass:true,checks:['real automatic emotion/situation detection','original text unchanged by manual selection','choice-only record not misclassified as automatic','TOP 10 cap and once-per-entry counts','older valStd-only records','missing/failed analysis excluded from trend','positive and negative situation counts','contextual editable action examples','existing chosen-word/calendar compatibility']}));
