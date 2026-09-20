"""Explicit, bounded edits to the last published HTML. No IO or network."""
def apply(source):
    def rep(s,a,b):
        assert s.count(a)==1,(a[:100],s.count(a));return s.replace(a,b)
    s=source
    a=s.index('  // 「말 걸어봤어요」(2026-09-15, DESIGN §9-⑤). talkMap:');b=s.index('  const [myEntries, setME]',a)
    s=s[:a]+s[b:]
    a=s.index('  // 말 걸어봤어요(2026-09-15): 누른 아이는');b=s.index('  if (page === "teacherDash"',a)
    s=s[:a]+s[b:]
    a=s.index('myStudents.length > 0 && React.createElement("div", {\n  "data-tut": "t-watch",');b=s.index('  // ⑥-2 나도 그래',a)
    s=s[:a]+'''myStudents.length > 0 && React.createElement(V4TeacherWatch,{key:currentUser.schoolCode+":"+currentUser.teacherId,user:currentUser,students:myStudents,watchList}),
'''+s[b:]
    s=rep(s,'  const [viewEntries, setVE] = useState([]);','''  const [viewEntries, setVE] = useState([]);
  const [viewLoading,setViewLoading]=useState(false),[viewError,setViewError]=useState(false);
  const viewRequest=useRef(0);''')
    a=s.index('  const viewStudentRecords = async stu => {');b=s.index('  const clearStuRecords',a)
    s=s[:a]+'''  const viewStudentRecords = async stu => {
    const request=++viewRequest.current;
    setVS(stu);setVE([]);setViewLoading(true);setViewError(false);
    try{const entries=await v4LoadTeacherDiary(stu.id);if(viewRequest.current===request)setVE(entries);}
    catch{if(viewRequest.current===request)setViewError(true);}
    finally{if(viewRequest.current===request)setViewLoading(false);}
  };
'''+s[b:]
    s=s.replace('항해 일지','탐험일지')
    s=rep(s,'"\\uD559\\uC0DD \\uD56D\\uD574 \\uC77C\\uC9C0"','"학생 탐험일지"')
    a=s.index('React.createElement(DiaryView, {\n    entries: viewEntries,');b=s.index('\n  })))));',a)
    s=s[:a]+'''React.createElement(V4TeacherJournal, {
    key:viewStu.id,student:viewStu,entries:viewEntries,loading:viewLoading,error:viewError,onRetry:()=>viewStudentRecords(viewStu)'''+s[b:]
    a=s.index('viewStu && React.createElement("div", {');b=s.index('  return null;\n}',a)
    part=s[a:b].replace('maxWidth: 760,','maxWidth: 1080,').replace('setVS(null);','viewRequest.current++;setVS(null);')
    part=rep(part,'viewStu && React.createElement("div", {','viewStu && React.createElement("div", {className:"v4-teacher-overlay",')
    part=rep(part,'    onClick: e => e.stopPropagation(),','    className:"v4-teacher-record-modal",role:"dialog","aria-modal":true,"aria-label":"학생 탐험일지",\n    onClick: e => e.stopPropagation(),')
    s=s[:a]+part+s[b:]
    s=rep(s,'if (e.key === "Escape") {\n        setVS(null);','if (e.key === "Escape") {\n        viewRequest.current++;setVS(null);')
    s=rep(s,'  const logout = () => {\n    V4ReviewClass.leave();','  const logout = () => {\n    viewRequest.current++;\n    V4ReviewClass.leave();')
    s=rep(s,'React.createElement(V2Landing, {authOpen:authOpen,','React.createElement(V2Landing, {authOpen:authOpen,signedIn:!!currentUser&&!currentUser.teacherId,')
    s=rep(s,'onLogin:function(){setMsg("");setLF(judgeForm(judge,loginForm.role));setAuthOpen(true);}', 'onLogin:function(){if(currentUser&&!currentUser.teacherId){setPage("island");return;}setMsg("");setLF(judgeForm(judge,loginForm.role));setAuthOpen(true);}')
    s=rep(s,'onDiary:function(){setPage("studentDiary");},onLogout:logout,','onDiary:function(){setPage("studentDiary");},onLogout:logout,onHome:function(){setAuthOpen(false);setPage("home");},')
    # Inline fallback board and the actually mounted bundle get the same requested copy.
    s=s.replace('있었던 일과 그때 마음을 자유롭게 써요.','질문에 대한 답과 그때의 나의 마음을 자유롭게 적어주세요').replace('있었던 일과 그때 마음을 자유롭게 써요','질문에 대한 답과 그때의 나의 마음을 자유롭게 적어주세요')
    s=s.replace('적어주세요 마음 말을', '적어주세요. 마음 말을')
    s=s.replace('"그때 마음 말",','"그때의 나의 감정을 골라보세요.",').replace('"골라도 좋아요 · 다섯 개까지"','"(최대 5개)"')
    s='\n'.join('    S("t-care", "살펴본 뒤 기록하기", "학생 카드에서 [더 지켜볼게요] 또는 [이렇게 조치했어요]를 선택해요. 조치했으면 실제로 한 내용을 고르고 저장해요. 카드는 그대로 남고 자동 재알림이나 외부 전달은 하지 않아요.", { radius: 12 }),' if 'S("t-talk",' in line else line for line in s.split('\n'))
    return s
