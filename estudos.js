const cfg=window.LIFE_OS_CONFIG;
const sb=supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
let user=null,currentSession=null,currentIndex=0;
const questions=[
 {key:"p35_q1",prompt:"Where were you born?",type:"personal",tip:"Use: I was born in ..."},
 {key:"p35_q2",prompt:"When were you born?",type:"personal",tip:"Use: I was born on/in ..."},
 {key:"p35_q3",prompt:"What year were you born?",type:"personal",tip:"Use: I was born in ..."},
 {key:"p35_q4",prompt:"What were you like when you were 10?",type:"personal",tip:"Use: I was ..."},
 {key:"p35_q5",prompt:"How old were you in high school?",type:"personal",tip:"Use: I was ... years old."},
 {key:"p37_q1",prompt:"Where did you study in high school?",type:"personal",tip:"Answer with the school name/place."},
 {key:"p37_q2",prompt:"What was your school like?",type:"personal",tip:"Use was + adjective(s)."},
 {key:"p37_q5",prompt:"Who was your favorite teacher?",type:"personal",tip:"Use: My favorite teacher was ..."},
 {key:"p37_q9",prompt:"What was your favorite subject?",type:"personal",tip:"Use: My favorite subject was ..."},
 {key:"p38_q1",prompt:"Where were you yesterday at seven in the morning?",type:"personal",tip:"Use: I was at/in ..."},
 {key:"p39_a1",prompt:"Complete: I ___ at the gym last night. I wasn’t at home.",answer:"was",type:"objective"},
 {key:"p39_a2",prompt:"Complete: The kids ___ at school this morning. They weren’t at home.",answer:"were",type:"objective"},
 {key:"p39_a3",prompt:"Complete: My parents ___ at the bank yesterday in the afternoon.",answer:"were",type:"objective"},
 {key:"p39_b1",prompt:"Complete: I ___ at home when you arrived. I was at work.",answer:"wasn't",alts:["was not"],type:"objective"},
 {key:"p39_b5",prompt:"Complete: The kids ___ in the park with their parents. They were there with their teachers.",answer:"weren't",alts:["were not"],type:"objective"},
 {key:"p39_c1",prompt:"Complete: ___ you born in Brazil? When ___ you born?",answer:"were|were",type:"multi"},
 {key:"p39_c9",prompt:"Complete: Where ___ you last night? ___ you at home?",answer:"were|were",type:"multi"}
];
async function auth(){
 const {data:{session}}=await sb.auth.getSession();
 if(session){user=session.user;boot();return}
 loginBtn.onclick=async()=>{const email=prompt("E-mail do LIFE OS");if(!email)return;const pass=prompt("Senha");if(!pass)return;const {error}=await sb.auth.signInWithPassword({email,password:pass});if(error)return alert(error.message);user=(await sb.auth.getUser()).data.user;boot();}
}
async function boot(){gate.style.display="none";shell.style.display="grid";await ensureMaterial();await loadHistory();}
async function ensureMaterial(){
 const {data}=await sb.from("study_materials").select("*").eq("subject","Inglês").eq("source_name","BTB - 5 - A.pdf").eq("page_start",35).eq("page_end",39).limit(1);
 if(data&&data.length)return data[0];
 const {data:r}=await sb.from("study_materials").insert({user_id:user.id,title:"BTB 5 — Past of TO BE",subject:"Inglês",source_name:"BTB - 5 - A.pdf",page_start:35,page_end:39,notes:"Primeiro bloco oficial do LIFE OS Estudos."}).select().single();return r;
}
startStudyBtn.onclick=async()=>{
 if(currentSession){renderQuestion();return}
 const material=await ensureMaterial();
 const {data:s,error}=await sb.from("study_sessions").insert({user_id:user.id,material_id:material.id,subject:"Inglês",lesson_key:"btb5_p35_39"}).select().single();
 if(error)return alert(error.message);currentSession=s;currentIndex=0;renderQuestion();
}
function renderQuestion(){
 const q=questions[currentIndex];
 studyProgress.style.width=((currentIndex/questions.length)*100)+"%";
 questionArea.innerHTML='<div class="question-card"><div class="pillrow"><span class="badge">Questão '+(currentIndex+1)+' / '+questions.length+'</span></div><h2>'+q.prompt+'</h2><div class="muted">'+q.tip+'</div><textarea id="answerBox" placeholder="Responda em inglês..."></textarea><div id="feedbackBox"></div><div class="study-nav"><button class="btn ghost" id="prevBtn">Anterior</button><button class="btn" id="checkBtn">Corrigir</button></div></div>';
 prevBtn.onclick=()=>{if(currentIndex>0){currentIndex--;renderQuestion()}};
 checkBtn.onclick=checkAnswer;
}
function normalize(s){return (s||"").trim().toLowerCase().replace(/[?.!,]/g,"").replace(/’/g,"'").replace(/\s+/g," ")}
async function checkAnswer(){
 const q=questions[currentIndex],ans=answerBox.value.trim();if(!ans)return alert("Digite sua resposta.");
 let correct=null,feedback="";
 if(q.type==="objective"){
  const accepted=[q.answer,...(q.alts||[])].map(normalize);
  correct=accepted.includes(normalize(ans));
  feedback=correct?"Correto.":"Revise: a resposta esperada é “"+q.answer+"”.";
 }else if(q.type==="multi"){
  const expected=q.answer.split("|");const parts=normalize(ans).split(/[,/;| ]+/).filter(Boolean);
  correct=expected.every((x,i)=>parts[i]===x);
  feedback=correct?"Correto.":"Use “were” nas duas lacunas.";
 }else{
  const n=normalize(ans);
  const hasPast=/\b(was|were|did|studied)\b/.test(n);
  correct=hasPast;
  feedback=hasPast?"Boa estrutura. Resposta salva para sua revisão.":"Tente responder usando a estrutura no passado pedida pela questão.";
 }
 const payload={user_id:user.id,session_id:currentSession.id,question_key:q.key,prompt:q.prompt,answer:ans,is_correct:correct,feedback};
 await sb.from("study_answers").upsert(payload,{onConflict:"session_id,question_key"});
 feedbackBox.innerHTML='<div class="feedback '+(correct?"good":"fix")+'">'+feedback+'</div>';
 checkBtn.textContent=currentIndex===questions.length-1?"Finalizar":"Próxima";
 checkBtn.onclick=async()=>{if(currentIndex<questions.length-1){currentIndex++;renderQuestion()}else await finishStudy()};
}
async function finishStudy(){
 const {data:a}=await sb.from("study_answers").select("is_correct").eq("session_id",currentSession.id);
 const total=(a||[]).length,ok=(a||[]).filter(x=>x.is_correct).length,score=total?Math.round(ok/total*100):0;
 await sb.from("study_sessions").update({finished_at:new Date().toISOString(),score}).eq("id",currentSession.id);
 studyProgress.style.width="100%";questionArea.innerHTML='<div class="question-card"><h2>Sessão concluída</h2><div class="metric">'+score+'%</div><div class="muted">'+ok+' de '+total+' respostas consideradas corretas.</div><div class="section"><button class="btn" onclick="location.reload()">Nova revisão</button></div></div>';
 currentSession=null;await loadHistory();
}
async function loadHistory(){
 const {data:s}=await sb.from("study_sessions").select("started_at,finished_at,score").eq("lesson_key","btb5_p35_39").not("finished_at","is",null).order("started_at",{ascending:false}).limit(8);
 studyHistory.innerHTML=(s||[]).length?(s||[]).map(x=>'<div class="lesson"><b>'+new Date(x.started_at).toLocaleString("pt-BR")+'</b><div class="muted">Pontuação: '+Number(x.score||0).toFixed(0)+'%</div></div>').join(""):'<div class="muted">Nenhuma sessão concluída ainda.</div>';
}
auth();