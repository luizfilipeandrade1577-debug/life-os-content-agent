const cfg=window.LIFE_OS_CONFIG;
const sb=supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
let user=null,currentSession=null,currentIndex=0;

const P=(key,prompt,tip,intent,subject="I")=>({key,prompt,tip,type:"personal",intent,subject});
const O=(key,prompt,answer,alts=[])=>({key,prompt,type:"objective",answer,alts});
const M=(key,prompt,answers)=>({key,prompt,type:"multi",answer:answers.join("|")});

const questions=[
P("p35_q1","Where were you born?","Use: I was born in ...","where_born"),
P("p35_q2","When were you born?","Use a date, month or year: I was born on/in ...","when_born"),
P("p35_q3","What year were you born?","Use: I was born in + year.","year_born"),
P("p35_q4","What were you like when you were 10?","Use: I was + adjective(s).","what_like"),
P("p35_q5","How old were you in high school?","Use: I was ... years old.","how_old"),
P("p35_q6","What were you like in high school?","Use: I was + adjective(s).","what_like"),
P("p35_q7","Were you a good or a bad student?","Use: I was a good/bad student.","good_bad_student"),
P("p35_q8","How old were you ten years ago?","Use: I was ... years old.","how_old"),
P("p35_q9","How old were you in 2020?","Use: I was ... years old.","how_old"),
P("p35_q10","How old were you at your first job?","Use: I was ... years old.","how_old"),
P("p35_q11","What were you like at your first job?","Use: I was + adjective(s).","what_like"),
P("p35_q12","What were you like when you were 20?","Use: I was + adjective(s).","what_like"),
P("p35_q13","Were you an easy or difficult teenager?","Use: I was an easy/difficult teenager.","teenager"),
P("p35_q14","Where was your mother born?","Use: My mother was born in ...","where_born","mother"),
P("p35_q15","When was your mother born?","Use a date, month or year.","when_born","mother"),
P("p35_q16","What year was your mother born?","Use: My mother was born in + year.","year_born","mother"),
P("p35_q17","How old was your mother ten years ago?","Use: She was ... years old.","how_old","she"),
P("p35_q18","Where was your father born?","Use: My father was born in ...","where_born","father"),
P("p35_q19","When was your father born?","Use a date, month or year.","when_born","father"),
P("p35_q20","How old was your father ten years ago?","Use: He was ... years old.","how_old","he"),
P("p35_q21","Where was your sister born?","Use: My sister was born in ...","where_born","sister"),
P("p35_q22","When was your sister born?","Use a date, month or year.","when_born","sister"),
P("p35_q23","What year was your sister born?","Use: My sister was born in + year.","year_born","sister"),
P("p35_q24","Where was your brother born?","Use: My brother was born in ...","where_born","brother"),
P("p35_q25","When was your brother born?","Use a date, month or year.","when_born","brother"),
P("p35_q26","What year was your brother born?","Use: My brother was born in + year.","year_born","brother"),

P("p37_q1","Where did you study in high school?","Use: I studied at/in ...","where_study"),
P("p37_q2","What was your school like?","Use: My school was ... / It was ...","school_like"),
P("p37_q3","What were the restrooms like?","Use: They were ... / The restrooms were ...","plural_like"),
P("p37_q4","What was the food like at your school?","Use: The food was ... / It was ...","singular_like"),
P("p37_q5","Who was your favorite teacher?","Use: My favorite teacher was ...","favorite_teacher"),
P("p37_q6","Why was he/she your favorite teacher?","Use: Because he/she was ...","because"),
P("p37_q7","How old was he/she?","Use: He/She was ... years old.","how_old_person"),
P("p37_q8","What was he/she like?","Use: He/She was ...","person_like"),
P("p37_q9","What was your favorite subject?","Use: My favorite subject was ...","favorite_subject"),
P("p37_q10","Who was your best friend in high school and what was he/she like?","Use: My best friend was ... He/She was ...","best_friend"),
P("p37_q11","What were the teachers like?","Use: The teachers were ... / They were ...","plural_like"),
P("p37_q12","What was the principal like at your school?","Use: The principal was ... / He/She was ...","singular_like"),
P("p37_q13","What was the sports court like?","Use: The sports court was ... / It was ...","singular_like"),

...[
"Where were you yesterday at seven in the morning?",
"Where were you yesterday around ten in the morning?",
"Where were you yesterday around three thirty in the afternoon?",
"Where were you yesterday around six in the evening?",
"Where were you last night?",
"Where were you before this class?",
"Where were you last Saturday in the morning?",
"Where were you last Saturday night?",
"Where were you last Sunday in the morning?"
].map((prompt,i)=>P("p38_q"+(i+1),prompt,"Use: I was at/in/on ...","where_were")),

O("p39_a1","Complete: I ___ at the gym last night. I wasn’t at home.","was"),
O("p39_a2","Complete: The kids ___ at school this morning. They weren’t at home.","were"),
O("p39_a3","Complete: My parents ___ at the bank yesterday in the afternoon.","were"),
O("p39_a4","Complete: The teachers ___ at the cafeteria talking about the bad students.","were"),
M("p39_a5","Complete: Jon ___ at the bar with his friends last night. They ___ drinking beer.",["was","were"]),
O("p39_a6","Complete: Jenny ___ wearing a cool red jacket last night when I saw her.","was"),
O("p39_a7","Complete: They ___ eating a pizza. They weren’t eating a sandwich.","were"),
O("p39_a8","Complete: Britney ___ in the living room watching a movie with her friends.","was"),
M("p39_a9","Complete: Nina and Peter ___ at home the whole weekend because they ___ sick.",["were","were"]),
O("p39_a10","Complete: Lory ___ on the phone with her father for hours.","was"),

O("p39_b1","Complete: I ___ at home when you arrived. I was at work.","wasn't",["was not"]),
O("p39_b2","Complete: Danny ___ at school yesterday. He was in the hospital.","wasn't",["was not"]),
O("p39_b3","Complete: My sister ___ born in Mexico. She was born in Brazil.","wasn't",["was not"]),
O("p39_b4","Complete: Nick ___ at the meeting. He was on the phone with the client.","wasn't",["was not"]),
O("p39_b5","Complete: The kids ___ in the park with their parents. They were there with their teachers.","weren't",["were not"]),
O("p39_b6","Complete: They ___ at the office yesterday. They were at the warehouse.","weren't",["were not"]),
O("p39_b7","Complete: Kathy ___ in the bedroom. She was in the office studying for her test.","wasn't",["was not"]),
O("p39_b8","Complete: The managers ___ at the office today. They were at an event.","weren't",["were not"]),
O("p39_b9","Complete: Nina ___ at the mall with her friends. She was at the movie theater.","wasn't",["was not"]),
O("p39_b10","Complete: Your teacher ___ in class. She was at the cafeteria buying some coffee.","wasn't",["was not"]),

M("p39_c1","Complete: ___ you born in Brazil? When ___ you born?",["were","were"]),
M("p39_c2","Complete: ___ your best friend born in Brazil? ___ he/she born before you?",["was","was"]),
M("p39_c3","Complete: ___ you in your house last morning? What ___ you doing?",["were","were"]),
M("p39_c4","Complete: Where ___ you last morning? ___ you at school?",["were","were"]),
M("p39_c5","Complete: Where ___ your parents born? ___ they born in the same state?",["were","were"]),
M("p39_c6","Complete: What year ___ your parents born? ___ they born in the same year?",["were","were"]),
M("p39_c7","Complete: Where ___ your father born? ___ he born in the same city as you?",["was","was"]),
M("p39_c8","Complete: What year ___ your father born? ___ he born before or after your mom?",["was","was"]),
M("p39_c9","Complete: Where ___ you last night? ___ you at home?",["were","were"]),
M("p39_c10","Complete: ___ you at the gym last night after work? ___ you tired?",["were","were"])
];


let activeQuestions=questions;
let activeBlock=null;
const studyBlocks=[
 {id:"p35a",page:35,title:"Origem e nascimento",desc:"Where, When e What year",keys:["p35_q1","p35_q2","p35_q3","p35_q4","p35_q5"]},
 {id:"p35b",page:35,title:"Escola e adolescência",desc:"Como você era e sua idade",keys:["p35_q6","p35_q7","p35_q8","p35_q9","p35_q10"]},
 {id:"p35c",page:35,title:"Primeiro emprego",desc:"Descrições no passado",keys:["p35_q11","p35_q12","p35_q13"]},
 {id:"p35d",page:35,title:"Família — mãe e pai",desc:"Nascimento e idade",keys:["p35_q14","p35_q15","p35_q16","p35_q17","p35_q18","p35_q19","p35_q20"]},
 {id:"p35e",page:35,title:"Família — irmãos",desc:"Onde, quando e ano de nascimento",keys:["p35_q21","p35_q22","p35_q23","p35_q24","p35_q25","p35_q26"]},
 {id:"p37a",page:37,title:"Sua escola",desc:"Lugar, estrutura e comida",keys:["p37_q1","p37_q2","p37_q3","p37_q4"]},
 {id:"p37b",page:37,title:"Professor e matéria",desc:"Teacher, age, personality e subject",keys:["p37_q5","p37_q6","p37_q7","p37_q8","p37_q9"]},
 {id:"p37c",page:37,title:"Pessoas e escola",desc:"Best friend, teachers, principal e court",keys:["p37_q10","p37_q11","p37_q12","p37_q13"]},
 {id:"p38a",page:38,title:"Onde você estava? — 1",desc:"Manhã e tarde",keys:["p38_q1","p38_q2","p38_q3","p38_q4","p38_q5"]},
 {id:"p38b",page:38,title:"Onde você estava? — 2",desc:"Aula e fim de semana",keys:["p38_q6","p38_q7","p38_q8","p38_q9"]},
 {id:"p39a1",page:39,title:"Was / Were — parte 1",desc:"Frases afirmativas",keys:["p39_a1","p39_a2","p39_a3","p39_a4","p39_a5"]},
 {id:"p39a2",page:39,title:"Was / Were — parte 2",desc:"Frases afirmativas",keys:["p39_a6","p39_a7","p39_a8","p39_a9","p39_a10"]},
 {id:"p39b1",page:39,title:"Wasn't / Weren't — parte 1",desc:"Formas negativas",keys:["p39_b1","p39_b2","p39_b3","p39_b4","p39_b5"]},
 {id:"p39b2",page:39,title:"Wasn't / Weren't — parte 2",desc:"Formas negativas",keys:["p39_b6","p39_b7","p39_b8","p39_b9","p39_b10"]},
 {id:"p39c1",page:39,title:"Perguntas — parte 1",desc:"Was...? / Were...?",keys:["p39_c1","p39_c2","p39_c3","p39_c4","p39_c5"]},
 {id:"p39c2",page:39,title:"Perguntas — parte 2",desc:"Was...? / Were...?",keys:["p39_c6","p39_c7","p39_c8","p39_c9","p39_c10"]}
];
const pageInfo={
 35:{title:"Página 35 — About you",subtitle:"Nascimento, idade, adolescência, primeiro emprego e família."},
 36:{title:"Página 36 — Past of TO BE — Part 2",subtitle:"Página de apoio e continuação do conteúdo de was / were."},
 37:{title:"Página 37 — At school",subtitle:"Escola, professores, matérias e descrições no passado."},
 38:{title:"Página 38 — Places",subtitle:"Where were you...? + in / at / on."},
 39:{title:"Página 39 — Practice",subtitle:"was / were / wasn't / weren't e perguntas."}
};
function renderBlocks(){
 const box=document.getElementById("studyBlocks");if(!box)return;
 box.innerHTML=studyBlocks.map(b=>'<div class="study-block"><span class="badge">PÁG. '+b.page+'</span><h3>'+b.title+'</h3><div class="muted">'+b.desc+' • '+b.keys.length+' questões</div><div class="actions"><button class="btn" onclick="startStudyBlock(\''+b.id+'\')">Estudar bloco</button><button class="btn ghost" onclick="openStudyPage('+b.page+')">Abrir página</button></div></div>').join("");
}
function blockQuestions(block){return block.keys.map(k=>questions.find(q=>q.key===k)).filter(Boolean)}
window.startStudyBlock=async id=>{
 const block=studyBlocks.find(b=>b.id===id);if(!block)return;
 activeBlock=block;activeQuestions=blockQuestions(block);currentIndex=0;
 const material=await ensureMaterial();
 const {data:s,error}=await sb.from("study_sessions").insert({user_id:user.id,material_id:material.id,subject:"Inglês",lesson_key:"btb5_"+block.id}).select().single();
 if(error)return alert(error.message);
 currentSession=s;
 document.querySelector(".study-area")?.scrollIntoView({behavior:"smooth",block:"start"});
 renderQuestion();
};
window.openStudyPage=page=>{
 const info=pageInfo[page]||{title:"Página "+page,subtitle:"BTB 5"};
 pageBadge.textContent="PÁGINA "+page;pageTitle.textContent=info.title;pageSubtitle.textContent=info.subtitle;
 const qs=studyBlocks.filter(b=>b.page===page).flatMap(b=>blockQuestions(b));
 if(page===36){
   pageContent.innerHTML='<div class="question-card"><h3>Past of TO BE — Part 2</h3><p class="muted">Esta página funciona como apoio do conteúdo antes dos exercícios da página 37.</p><div class="rule"><b>was</b>: I, he, she, it</div><div class="rule"><b>were</b>: you, we, they</div></div>';
 }else{
   pageContent.innerHTML=qs.length?'<div class="question-card"><h3>Conteúdo usado pelo agente</h3>'+qs.map((q,i)=>'<div class="page-question"><span class="badge">'+(i+1)+'</span> '+q.prompt+'</div>').join("")+'</div>':'<div class="empty">Sem exercícios mapeados nesta página.</div>';
 }
 pageModal.classList.add("open");pageModal.scrollTop=0;
};
window.closeStudyPage=()=>pageModal.classList.remove("open");
async function auth(){
 const {data:{session}}=await sb.auth.getSession();
 if(session){user=session.user;boot();return}
 loginBtn.onclick=async()=>{const email=prompt("E-mail do LIFE OS");if(!email)return;const pass=prompt("Senha");if(!pass)return;const {error}=await sb.auth.signInWithPassword({email,password:pass});if(error)return alert(error.message);user=(await sb.auth.getUser()).data.user;boot();}
}
async function boot(){gate.style.display="none";shell.style.display="grid";await ensureMaterial();renderBlocks();await loadHistory();}
async function ensureMaterial(){
 const {data}=await sb.from("study_materials").select("*").eq("subject","Inglês").eq("source_name","BTB - 5 - A.pdf").eq("page_start",35).eq("page_end",39).limit(1);
 if(data&&data.length)return data[0];
 const {data:r}=await sb.from("study_materials").insert({user_id:user.id,title:"BTB 5 — Past of TO BE",subject:"Inglês",source_name:"BTB - 5 - A.pdf",page_start:35,page_end:39,notes:"Bloco oficial LIFE OS Estudos — validação completa."}).select().single();return r;
}
startStudyBtn.onclick=async()=>{
 if(currentSession){renderQuestion();return}
 if(!activeBlock)return startStudyBlock("p35a");
 return startStudyBlock(activeBlock.id);
}
function renderQuestion(){
 const q=activeQuestions[currentIndex];
 studyProgress.style.width=((currentIndex/activeQuestions.length)*100)+"%";
 questionArea.innerHTML='<div class="question-card"><div class="pillrow"><span class="badge">Questão '+(currentIndex+1)+' / '+activeQuestions.length+'</span></div><h2>'+q.prompt+'</h2><div class="muted">'+(q.tip||"Preencha corretamente em inglês.")+'</div><textarea id="answerBox" placeholder="Responda em inglês..."></textarea><div id="feedbackBox"></div><div class="study-nav"><button class="btn ghost" id="prevBtn">Anterior</button><button class="btn" id="checkBtn">Corrigir</button></div></div>';
 prevBtn.onclick=()=>{if(currentIndex>0){currentIndex--;renderQuestion()}};
 checkBtn.onclick=checkAnswer;
}
function normalize(s){return (s||"").trim().toLowerCase().replace(/[?.!,]/g,"").replace(/’/g,"'").replace(/\s+/g," ")}
function tokens(s){return normalize(s).split(/[,/;|\s]+/).filter(Boolean)}
function subjectPatterns(subject){
 const map={I:["i"],mother:["my mother","she"],father:["my father","he"],sister:["my sister","she"],brother:["my brother","he"],she:["she"],he:["he"]};
 return map[subject]||["i"];
}
function validatePersonal(q,ans){
 const n=normalize(ans), subs=subjectPatterns(q.subject);
 switch(q.intent){
  case "where_born":{
   const ok=subs.some(s=>new RegExp("^"+s+" was born in\\s+.+").test(n));
   return {ok,msg:"Esta pergunta é ONDE. Responda com lugar usando “... was born in ...”"};
  }
  case "when_born":{
   const prefix=subs.find(s=>n.startsWith(s+" was born "))||null;
   if(!prefix)return {ok:false,msg:"Use a estrutura: “... was born on/in ...”"};
   const tail=n.slice((prefix+" was born ").length);
   const onDate=/^on\s+.+/.test(tail);
   const inTime=/^in\s+((19|20)\d{2}|january|february|march|april|may|june|july|august|september|october|november|december|the\s+\w+ies)$/.test(tail);
   return {ok:onDate||inTime,msg:"Esta pergunta é QUANDO. Use data, mês ou ano — não um lugar. Ex.: “I was born in 2003.”"};
  }
  case "year_born":{
   const ok=subs.some(s=>new RegExp("^"+s+" was born in\\s+(19|20)\\d{2}$").test(n));
   return {ok,msg:"Informe o ANO: “... was born in 2003.”"};
  }
  case "what_like":return {ok:/^i was\s+.+/.test(n)&&!/^i was born/.test(n),msg:"Descreva como você era: “I was shy / outgoing / quiet...”"};
  case "how_old":return {ok:/^(i|she|he) was\s+\d{1,3}\s+years? old$/.test(n),msg:"Use: “I/He/She was ... years old.”"};
  case "good_bad_student":return {ok:/^i was (a )?(good|bad) student$/.test(n),msg:"Use: “I was a good student.” ou “I was a bad student.”"};
  case "teenager":return {ok:/^i was an? (easy|difficult) teenager$/.test(n),msg:"Use: “I was an easy teenager.” ou “I was a difficult teenager.”"};
  case "where_study":return {ok:/^i studied (at|in)\s+.+/.test(n),msg:"Use: “I studied at Cotuca.”"};
  case "school_like":return {ok:/^(my school|it) was\s+.+/.test(n),msg:"Use “My school was...” ou “It was...”"};
  case "plural_like":return {ok:/^(they|the restrooms|the teachers) were\s+.+/.test(n),msg:"Sujeito plural → use WERE: “They were...”"};
  case "singular_like":return {ok:/^(it|the food|the principal|the sports court|he|she) was\s+.+/.test(n),msg:"Sujeito singular → use WAS: “It was...”"};
  case "favorite_teacher":return {ok:/^my favorite teacher was\s+.+/.test(n),msg:"Use: “My favorite teacher was ...”"};
  case "because":return {ok:/^because\s+.+/.test(n)&&/\b(was|were|did|had|made|helped|taught)\b/.test(n),msg:"Explique o motivo começando com “Because...” e use passado."};
  case "how_old_person":return {ok:/^(he|she) was\s+\d{1,3}\s+years? old$/.test(n),msg:"Use: “He/She was ... years old.”"};
  case "person_like":return {ok:/^(he|she) was\s+.+/.test(n),msg:"Use: “He/She was ...” + descrição."};
  case "favorite_subject":return {ok:/^my favorite subject was\s+.+/.test(n),msg:"Use: “My favorite subject was ...”"};
  case "best_friend":return {ok:/^my best friend was\s+.+/.test(n)&&/\b(he|she) was\b/.test(n),msg:"Diga quem era e descreva: “My best friend was Ana. She was...”"};
  case "where_were":return {ok:/^i was (at|in|on)\s+.+/.test(n),msg:"Use lugar/contexto: “I was at home.”, “I was in class.” ou “I was on the bus.”"};
  default:return {ok:false,msg:"Revise a estrutura da resposta."};
 }
}
async function checkAnswer(){
 const q=activeQuestions[currentIndex],ans=answerBox.value.trim();if(!ans)return alert("Digite sua resposta.");
 let correct=false,feedback="";
 if(q.type==="objective"){
  const accepted=[q.answer,...(q.alts||[])].map(normalize);
  correct=accepted.includes(normalize(ans));
  feedback=correct?"Correto.":"Incorreto. A resposta esperada é “"+q.answer+"”.";
 }else if(q.type==="multi"){
  const expected=q.answer.split("|"),parts=tokens(ans);
  correct=parts.length>=expected.length&&expected.every((x,i)=>parts[i]===x);
  feedback=correct?"Correto.":"Incorreto. Preencha as lacunas na ordem: "+expected.join(" / ")+".";
 }else{
  const result=validatePersonal(q,ans);correct=result.ok;
  feedback=correct?"Correto. Boa estrutura. Resposta salva para sua revisão.":result.msg;
 }
 const payload={user_id:user.id,session_id:currentSession.id,question_key:q.key,prompt:q.prompt,answer:ans,is_correct:correct,feedback};
 await sb.from("study_answers").upsert(payload,{onConflict:"session_id,question_key"});
 feedbackBox.innerHTML='<div class="feedback '+(correct?"good":"fix")+'">'+feedback+'</div>';
 if(!correct){
   checkBtn.textContent="Tentar novamente";
   checkBtn.onclick=()=>{feedbackBox.innerHTML="";checkBtn.textContent="Corrigir";checkBtn.onclick=checkAnswer;answerBox.focus();};
   return;
 }
 checkBtn.textContent=currentIndex===activeQuestions.length-1?"Finalizar":"Próxima";
 checkBtn.onclick=async()=>{if(currentIndex<activeQuestions.length-1){currentIndex++;renderQuestion()}else await finishStudy()};
}
async function finishStudy(){
 const {data:a}=await sb.from("study_answers").select("is_correct").eq("session_id",currentSession.id);
 const total=(a||[]).length,ok=(a||[]).filter(x=>x.is_correct).length,score=total?Math.round(ok/total*100):0;
 await sb.from("study_sessions").update({finished_at:new Date().toISOString(),score}).eq("id",currentSession.id);
 studyProgress.style.width="100%";
 questionArea.innerHTML='<div class="question-card"><h2>Sessão concluída</h2><div class="metric">'+score+'%</div><div class="muted">'+ok+' de '+total+' respostas corretas.</div><div class="section"><button class="btn" onclick="location.reload()">Nova revisão</button></div></div>';
 currentSession=null;await loadHistory();
}
async function loadHistory(){
 const {data:s}=await sb.from("study_sessions").select("started_at,finished_at,score,lesson_key").eq("subject","Inglês").not("finished_at","is",null).order("started_at",{ascending:false}).limit(12);
 studyHistory.innerHTML=(s||[]).length?(s||[]).map(x=>'<div class="lesson"><b>'+new Date(x.started_at).toLocaleString("pt-BR")+'</b><div class="muted">Pontuação: '+Number(x.score||0).toFixed(0)+'%</div></div>').join(""):'<div class="muted">Nenhuma sessão concluída ainda.</div>';
}
auth();
// pages-rebuild: 2026-09-20T00:20-03:00
