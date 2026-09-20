"""Bounded changes to the published HTML; no network or production data IO."""
def apply(s):
 def rep(a,b):
  nonlocal s
  assert s.count(a)==1,(a[:90],s.count(a));s=s.replace(a,b)
 a=s.index('function isOtherSubject(tokens, emotionIdx) {');b=s.index('var NEGATION_WORDS',a)
 s=s[:a]+'''function isOtherSubject(tokens, emotionIdx) {
  for(let i=emotionIdx-1;i>=Math.max(0,emotionIdx-LOOK_BACK);i--){
    const t=tokens[i];if(t==='§')break;
    if(SELF_SUBJECTS.includes(t))return false;
    // A reason/action clause ends before the writer's omitted subject.
    if(/(?:해서|려서|어서|아서|니까|는데|지만|다가|때문에|덕분에)$/.test(t))return false;
    for(const p of PERSON_WORDS){
      if(!t.startsWith(p))continue;
      const suffix=t.slice(p.length);
      if(OBJ_PARTICLES.some(op=>suffix===op||suffix.startsWith(op)))return false;
      if(suffix===''||SUBJ_PARTICLES.includes(suffix))return true;
    }
  }
  return false;
}
'''+s[b:]
 rep('function analyzeEntry(text) {\n  const norm = normalizeKorean(text);\n  const tokens = norm.split(" ").filter(Boolean);','function analyzeEntry(text) {\n  const tokens = String(text||"").split(/[.!?。！？\\n]+/).flatMap(part=>[...normalizeKorean(part).split(" ").filter(Boolean),"§"]);')
 a=s.index('  function isNegated(idx) {',s.index('function analyzeEntry(text)'));b=s.index('  for (let ti = 0;',a)
 s=s[:a]+'''  function isNegated(idx) {
    const prev=tokens[idx-1]||'',tok=tokens[idx],next=tokens[idx+1]||'',after=tokens[idx+2]||'';
    return /^(?:안|못)$/.test(prev)||(/지$/.test(tok)&&/^(?:않|못)/.test(next))||(/^(?:안|못)$/.test(next)&&/^(?:나|났|느끼|느꼈|들|들었)/.test(after))||/^(?:없|아니)/.test(next);
  }
'''+s[b:]
 rep('|| tok.includes(kw) || kw.startsWith(tok)) {','|| tok.includes(kw) || (tok.length>=2 && kw.startsWith(tok))) {')
 rep('          seen.add(emo.name);\n          if (isNegated(ti)) break;','          if (isNegated(ti)) break;')
 rep('            hits.push(entry);','            seen.add(emo.name);hits.push(entry);')
 s=s.replace('if (!isOtherSubject(tokens, ti)) {','if (!isOtherSubject(tokens, ti) && !isNegated(ti)) {')
 rep('  return {\n    hits,\n    excluded,','  return {\n    analysisVersion: 3,\n    hits,\n    excluded,')
 rep('  }, currentUser.teacherId === MIG_OWNER && migUI(), msgBox,','  }, currentUser.teacherId === MIG_OWNER && migUI(), msgBox,\n  React.createElement(V4RewardSettingsPanel,{key:currentUser.schoolCode,user:currentUser,students:myStudents,onSaved:setMS}),')
 rep('    const updated = [...list, ns];','    ns.rewardMode=V4RewardSettings.inherited(list,ns);\n    const updated = [...list, ns];')
 rep('          updated.push(ns);','          ns.rewardMode=V4RewardSettings.inherited(updated,ns);\n          updated.push(ns);')
 return s
