const cfg=window.LIFE_OS_CONFIG;
const sb=supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
let user=null,routines=[],selected=null,activeSession=null,activeExercises=[],timerId=null,startedAt=null,restTimerId=null,restEndsAt=null,pendingSession=null,autosaveTimers={};
const DAYS={1:"Segunda",2:"Terça",3:"Quarta",4:"Quinta",5:"Sexta",6:"Sábado",7:"Domingo"};
const PT_EXERCISE_NAMES={
 "Dumbbell Incline Press":"Supino inclinado com halteres",
 "Cable Incline Fly":"Crucifixo inclinado na polia",
 "Chest Fly Machine":"Crucifixo na máquina / Peck Deck",
 "Shoulder Press Machine":"Desenvolvimento de ombros na máquina",
 "Cable Lateral Raise":"Elevação lateral na polia",
 "Cable Tricep Extension":"Tríceps na corda / polia",
 "Cable Overhead Tricep Extension":"Tríceps francês na polia",
 "Barbell Back Squat":"Agachamento livre com barra",
 "Leg Press Machine":"Leg press",
 "Leg Extension Machine":"Cadeira extensora",
 "Barbell Romanian Deadlift":"Stiff / levantamento terra romeno",
 "Seated Leg Curl Machine":"Cadeira flexora",
 "Seated Calf Raise Machine":"Panturrilha sentado",
 "Cable Lat Pulldown":"Puxada alta na polia",
 "Dumbbell Chest Supported Row":"Remada com halteres apoiado no banco",
 "Cable Row":"Remada baixa na polia",
 "Cable Face Pull":"Face pull na polia",
 "Dumbbell Bicep Curl":"Rosca direta com halteres",
 "Hammer Curl":"Rosca martelo com halteres",
 "Hip Thrust":"Elevação pélvica / Hip Thrust"
};
function exercisePt(name){return PT_EXERCISE_NAMES[name]||name;}
const seed=[
 {name:"LIFE OS - PUSH",day:1,ex:[["Dumbbell Incline Press",[8,8,10]],["Cable Incline Fly",[12,12,12]],["Chest Fly Machine",[12,12,12]],["Shoulder Press Machine",[10,10,10]],["Cable Lateral Raise",[15,15,15]],["Cable Tricep Extension",[12,12,12]],["Cable Overhead Tricep Extension",[12,12]]]},
 {name:"LIFE OS - LEGS",day:2,ex:[["Barbell Back Squat",[8,8,10]],["Leg Press Machine",[10,10,12]],["Leg Extension Machine",[12,12,12]],["Barbell Romanian Deadlift",[10,10,10]],["Seated Leg Curl Machine",[12,12,12]],["Seated Calf Raise Machine",[15,15,15,15]]]},
 {name:"LIFE OS - PULL",day:3,ex:[["Cable Lat Pulldown",[8,8,10]],["Dumbbell Chest Supported Row",[10,10,10]],["Cable Row",[10,10,12]],["Cable Face Pull",[12,12,15]],["Dumbbell Bicep Curl",[10,10,12]],["Hammer Curl",[12,12]]]},
 {name:"LIFE OS - LOWER",day:4,ex:[["Barbell Romanian Deadlift",[8,8,10]],["Leg Press Machine",[10,10,12]],["Hip Thrust",[10,10,12]],["Seated Leg Curl Machine",[12,12,12]],["Leg Extension Machine",[12,12]],["Seated Calf Raise Machine",[15,15,15,15]]]},
 {name:"LIFE OS - UPPER",day:5,ex:[["Dumbbell Incline Press",[8,8,10]],["Dumbbell Chest Supported Row",[10,10,10]],["Cable Lat Pulldown",[10,10,12]],["Cable Lateral Raise",[12,12,15]],["Cable Tricep Extension",[12,12]],["Dumbbell Bicep Curl",[12,12]]]}
];
async function auth(){
 const {data:{session}}=await sb.auth.getSession();
 if(session){user=session.user;boot();return}
 document.getElementById("loginBtn").onclick=async()=>{const email=prompt("E-mail do LIFE OS");if(!email)return;const pass=prompt("Senha");if(!pass)return;const {error}=await sb.auth.signInWithPassword({email,password:pass});if(error)return alert(error.message);user=(await sb.auth.getUser()).data.user;boot();}
}
async function boot(){document.getElementById("gate").style.display="none";document.getElementById("shell").style.display="grid";await ensureSeed();await load();renderToday();await loadDashboard();await checkOpenSession();setupEvolution();}
async function ensureSeed(){
 const {data}=await sb.from("training_routines").select("id").limit(1);
 if(data&&data.length)return;
 for(let i=0;i<seed.length;i++){
  const s=seed[i];
  const {data:r,error}=await sb.from("training_routines").insert({user_id:user.id,name:s.name,day_of_week:s.day,position:i}).select().single();
  if(error)throw error;
  const rows=s.ex.map((e,j)=>({user_id:user.id,routine_id:r.id,exercise_name:e[0],sets:e[1].length,reps:e[1],position:j}));
  const {error:ee}=await sb.from("training_exercises").insert(rows);if(ee)throw ee;
 }
}
async function load(){
 const {data:r}=await sb.from("training_routines").select("*").order("position");
 routines=r||[];renderRoutines();if(routines[0])selectRoutine(routines[0].id);
}
function renderToday(){const d=new Date().getDay();const day=d===0?7:d;const r=routines.find(x=>x.day_of_week===day);if(!r){todayTitle.textContent="Dia livre";todayText.textContent="Sem musculação programada. Caminhada, mobilidade ou atividade leve.";todayBtn.style.display="none";return}todayTitle.textContent=r.name.replace("LIFE OS - ","");todayText.textContent=DAYS[day]+" • treino programado para hoje";todayBtn.style.display="inline-block";todayBtn.onclick=async()=>{selected=r.id;renderRoutines();await selectRoutine(r.id);await startWorkout();};}
function renderRoutines(){
 routineGrid.innerHTML=routines.map(r=>`<div class="card routine ${selected===r.id?"active":""}" onclick="selectRoutine('${r.id}')"><span class="badge">${DAYS[r.day_of_week]}</span><h3>${r.name.replace("LIFE OS - ","")}</h3><div class="muted">${r.name}</div></div>`).join("");
}
async function selectRoutine(id){
 selected=id;renderRoutines();const r=routines.find(x=>x.id===id);routineTitle.textContent=r.name;routineDay.textContent=DAYS[r.day_of_week];
 const {data:e}=await sb.from("training_exercises").select("*").eq("routine_id",id).order("position");
 exerciseList.innerHTML=(e||[]).map(x=>`<div class="exercise"><div><b>${exercisePt(x.exercise_name)}</b><div class="muted">${x.sets} séries</div><button class="demo" style="background:none;border:0;padding:0;cursor:pointer" onclick="openExerciseDemo(\'${encodeURIComponent(x.exercise_name)}\')">▶ Ver demonstração</button></div><div class="reps">${(x.reps||[]).join(" / ")} reps</div></div>`).join("");
}
startBtn.onclick=startWorkout;
async function checkOpenSession(){const {data:s}=await sb.from("training_sessions").select("*").is("finished_at",null).order("started_at",{ascending:false}).limit(1);pendingSession=s&&s[0]?s[0]:null;if(!pendingSession){if(document.getElementById("resumeCard"))resumeCard.style.display="none";return}const r=routines.find(x=>x.id===pendingSession.routine_id);if(document.getElementById("resumeCard"))resumeCard.style.display="block";if(document.getElementById("resumeText"))resumeText.textContent=(r?r.name:"Treino")+" • iniciado "+new Date(pendingSession.started_at).toLocaleString("pt-BR");}
if(document.getElementById("resumeBtn"))resumeBtn.onclick=()=>{if(pendingSession)resumeWorkout(pendingSession);};
async function loadDashboard(){
 const {data:w}=await sb.from("body_metrics").select("weight_kg,recorded_on").order("recorded_on",{ascending:false}).limit(1);
 if(document.getElementById("currentWeight"))currentWeight.textContent=w&&w[0]&&w[0].weight_kg?Number(w[0].weight_kg).toFixed(1)+" kg":"71 kg";
 if(document.getElementById("weightHint"))weightHint.textContent=w&&w[0]?"Último registro: "+w[0].recorded_on:"Sem registro ainda";
 const {data:s}=await sb.from("training_sessions").select("id,started_at,finished_at,routine_id").not("finished_at","is",null).order("started_at",{ascending:false}).limit(20);
 if(document.getElementById("completedCount"))completedCount.textContent=(s||[]).length;
 const map=Object.fromEntries(routines.map(r=>[r.id,r.name]));
 if(!(s||[]).length){historyList.innerHTML='<div class="muted">Nenhum treino concluído ainda.</div>';return}
 const ids=s.map(x=>x.id);
 const {data:sets}=await sb.from("training_sets").select("session_id,weight_kg,reps,completed").in("session_id",ids).eq("completed",true);
 const agg={};for(const st of sets||[]){if(!agg[st.session_id])agg[st.session_id]={sets:0,volume:0};agg[st.session_id].sets++;agg[st.session_id].volume+=(Number(st.weight_kg)||0)*(Number(st.reps)||0);}
 historyList.innerHTML=s.map(x=>{const a=agg[x.id]||{sets:0,volume:0};const mins=x.finished_at?Math.max(1,Math.round((new Date(x.finished_at)-new Date(x.started_at))/60000)):0;return '<div class="item" onclick="openHistory(\''+x.id+'\')"><div><b>'+(map[x.routine_id]||"Treino")+'</b><div class="muted">'+new Date(x.started_at).toLocaleString("pt-BR")+'</div><div class="history-stats"><span class="badge">'+mins+' min</span><span class="badge">'+a.sets+' séries</span><span class="badge">'+Math.round(a.volume)+' kg volume</span></div></div><span class="demo">Ver detalhes ›</span></div>';}).join("");
}
window.openHistory=async sessionId=>{
 const {data:s,error}=await sb.from("training_sessions").select("*").eq("id",sessionId).single();if(error)return alert(error.message);
 const r=routines.find(x=>x.id===s.routine_id);
 const {data:sets}=await sb.from("training_sets").select("*").eq("session_id",sessionId).eq("completed",true).order("created_at");
 const exIds=[...new Set((sets||[]).map(x=>x.exercise_id).filter(Boolean))];
 let exMap={};if(exIds.length){const {data:e}=await sb.from("training_exercises").select("id,exercise_name,position").in("id",exIds);exMap=Object.fromEntries((e||[]).map(x=>[x.id,x]));}
 const mins=s.finished_at?Math.max(1,Math.round((new Date(s.finished_at)-new Date(s.started_at))/60000)):0;
 const volume=(sets||[]).reduce((n,x)=>n+(Number(x.weight_kg)||0)*(Number(x.reps)||0),0);
 historyTitle.textContent=r?r.name:"Treino";
 historyMeta.textContent=new Date(s.started_at).toLocaleString("pt-BR")+" • "+mins+" min • "+Math.round(volume)+" kg de volume";
 const groups={};for(const st of sets||[]){const k=st.exercise_id||"x";if(!groups[k])groups[k]=[];groups[k].push(st);}
 historyDetail.innerHTML=Object.entries(groups).map(([id,rows])=>'<div class="history-ex"><h3>'+(exMap[id]?.exercise_name||"Exercício")+'</h3>'+rows.sort((a,b)=>a.set_number-b.set_number).map(st=>'<div class="history-set"><span>S'+st.set_number+'</span><span>'+Number(st.weight_kg||0)+' kg</span><span>'+st.reps+' reps</span></div>').join("")+'</div>').join("")||'<div class="muted">Sem séries registradas.</div>';
 historyModal.classList.add("open");historyModal.scrollTop=0;
};
if(document.getElementById("closeHistoryBtn"))closeHistoryBtn.onclick=()=>historyModal.classList.remove("open");
if(document.getElementById("saveWeightBtn"))saveWeightBtn.onclick=async()=>{const kg=Number(weightInput.value.replace(",","."));if(!kg||kg<30||kg>250)return alert("Informe um peso válido.");const {error}=await sb.from("body_metrics").upsert({user_id:user.id,recorded_on:new Date().toISOString().slice(0,10),weight_kg:kg},{onConflict:"user_id,recorded_on"});if(error)return alert(error.message);weightInput.value="";await loadDashboard();};
function progressionText(ex,prevMap){const targets=ex.reps||[];const prev=Array.from({length:ex.sets},(_,i)=>prevMap[ex.id+"_"+(i+1)]).filter(Boolean);if(prev.length<ex.sets)return "Primeiro treino: encontre uma carga confortável e registre.";const hit=prev.every((p,i)=>Number(p.reps)>=Number(targets[i]||0));const max=Math.max(...prev.map(p=>Number(p.weight_kg)||0));if(!max)return "Registre sua carga para habilitar progressão.";return hit?"Sugestão: se a execução estiver boa, tente +2,5 kg hoje.":"Sugestão: mantenha a carga anterior e busque bater as repetições-alvo.";}
async function buildWorkout(session,routineId){
 const r=routines.find(x=>x.id===routineId);
 const {data:e,error:ee}=await sb.from("training_exercises").select("*").eq("routine_id",routineId).order("position");
 if(ee)return alert(ee.message);
 activeSession=session;activeExercises=e||[];startedAt=new Date(session.started_at);
 const ids=activeExercises.map(x=>x.id);
 let previous=[],current=[];
 if(ids.length){
   const {data:p}=await sb.from("training_sets").select("exercise_id,set_number,weight_kg,reps,created_at,session_id,completed").in("exercise_id",ids).neq("session_id",session.id).eq("completed",true).order("created_at",{ascending:false}).limit(300);previous=p||[];
   const {data:c}=await sb.from("training_sets").select("*").eq("session_id",session.id);current=c||[];
 }
 const prevMap={};for(const p of previous){const k=p.exercise_id+"_"+p.set_number;if(prevMap[k]===undefined)prevMap[k]=p;}
 const curMap={};for(const c of current){curMap[c.exercise_id+"_"+c.set_number]=c;}
 workoutTitle.textContent=r?r.name:"Treino";
 workoutExercises.innerHTML=activeExercises.map(ex=>{const targets=ex.reps||[];const rows=Array.from({length:ex.sets},(_,i)=>{const p=prevMap[ex.id+"_"+(i+1)],c=curMap[ex.id+"_"+(i+1)];return "<div class=\"set-row\" data-ex=\""+ex.id+"\" data-set=\""+(i+1)+"\"><b>"+(i+1)+"</b><span class=\"muted\">"+(p&&p.weight_kg!=null?p.weight_kg:"—")+"</span><input class=\"kg\" inputmode=\"decimal\" placeholder=\"kg\" value=\""+(c&&c.weight_kg!=null?c.weight_kg:(p&&p.weight_kg!=null?p.weight_kg:""))+"\"><input class=\"rp\" inputmode=\"numeric\" placeholder=\""+(targets[i]||"")+"\" value=\""+(c&&c.reps!=null?c.reps:"")+"\"><button class=\"check "+(c&&c.completed?"done":"")+"\" onclick=\"toggleSet(this)\">✓</button></div>";}).join("");return "<div class=\"work-ex\"><div class=\"top\" style=\"margin-bottom:8px\"><div><h3 style=\"margin:0\">"+exercisePt(ex.exercise_name)+"</h3><div class=\"muted\">Alvo: "+targets.join(" / ")+" reps</div><div class=\"progression\">"+progressionText(ex,prevMap)+"</div></div><button class=\"demo\" style=\"background:none;border:0;padding:0;cursor:pointer\" data-demo=\""+encodeURIComponent(ex.exercise_name)+"\" onclick=\"openExerciseDemo(this.dataset.demo)\">▶ Demonstração</button></div><div class=\"set-head\"><span>Série</span><span>Anterior</span><span>Kg</span><span>Reps</span><span>Feita</span></div>"+rows+"</div>";}).join("");
 bindAutosave();workoutModal.classList.add("open");workoutModal.scrollTop=0;startTimer();
}
async function startWorkout(){if(!selected)return;const {data:open}=await sb.from("training_sessions").select("*").is("finished_at",null).order("started_at",{ascending:false}).limit(1);if(open&&open[0]){pendingSession=open[0];return resumeWorkout(open[0]);}const {data:s,error}=await sb.from("training_sessions").insert({user_id:user.id,routine_id:selected}).select().single();if(error)return alert(error.message);await buildWorkout(s,selected);await checkOpenSession();}
async function resumeWorkout(session){selected=session.routine_id;renderRoutines();await buildWorkout(session,session.routine_id);}
async function saveRowDraft(row,completedOverride=null){if(!activeSession)return;const kgRaw=row.querySelector(".kg").value.replace(",",".");const repsRaw=row.querySelector(".rp").value;const hasAny=kgRaw!==""||repsRaw!==""||completedOverride!==null;if(!hasAny)return;const payload={user_id:user.id,session_id:activeSession.id,exercise_id:row.dataset.ex,set_number:Number(row.dataset.set),weight_kg:kgRaw===""?null:Number(kgRaw),reps:repsRaw===""?null:Number(repsRaw),completed:completedOverride===null?row.querySelector(".check").classList.contains("done"):completedOverride};const {error}=await sb.from("training_sets").upsert(payload,{onConflict:"session_id,exercise_id,set_number"});if(error)console.error("autosave",error);}
function bindAutosave(){document.querySelectorAll(".set-row input").forEach(inp=>{inp.addEventListener("input",()=>{const row=inp.closest(".set-row");const key=row.dataset.ex+"_"+row.dataset.set;clearTimeout(autosaveTimers[key]);autosaveTimers[key]=setTimeout(()=>saveRowDraft(row),350);});inp.addEventListener("blur",()=>saveRowDraft(inp.closest(".set-row")));});}
window.toggleSet=async btn=>{const row=btn.closest(".set-row");if(btn.classList.contains("done")){btn.classList.remove("done");await saveRowDraft(row,false);return}const kg=Number(row.querySelector(".kg").value.replace(",","."));const reps=Number(row.querySelector(".rp").value);if(!kg||!reps)return alert("Preencha carga e repetições.");const payload={user_id:user.id,session_id:activeSession.id,exercise_id:row.dataset.ex,set_number:Number(row.dataset.set),weight_kg:kg,reps:reps,completed:true};const {error}=await sb.from("training_sets").upsert(payload,{onConflict:"session_id,exercise_id,set_number"});if(error)return alert(error.message);btn.classList.add("done");startRest(90);};
function startRest(seconds=90){clearInterval(restTimerId);restEndsAt=Date.now()+seconds*1000;if(document.getElementById("restBar"))restBar.classList.add("show");const tick=()=>{const left=Math.max(0,Math.ceil((restEndsAt-Date.now())/1000));if(document.getElementById("restTime"))restTime.textContent=String(Math.floor(left/60)).padStart(2,"0")+":"+String(left%60).padStart(2,"0");if(left<=0){clearInterval(restTimerId);if(document.getElementById("restBar"))restBar.classList.remove("show");}};tick();restTimerId=setInterval(tick,250);}
function stopRest(){clearInterval(restTimerId);if(document.getElementById("restBar"))restBar.classList.remove("show");}
if(document.getElementById("rest60"))rest60.onclick=()=>startRest(60);if(document.getElementById("rest90"))rest90.onclick=()=>startRest(90);if(document.getElementById("rest120"))rest120.onclick=()=>startRest(120);if(document.getElementById("skipRest"))skipRest.onclick=stopRest;
function startTimer(){clearInterval(timerId);const tick=()=>{const sec=Math.max(0,Math.floor((Date.now()-startedAt.getTime())/1000));timer.textContent=String(Math.floor(sec/60)).padStart(2,"0")+":"+String(sec%60).padStart(2,"0");};tick();timerId=setInterval(tick,1000);}
if(document.getElementById("closeWorkoutBtn"))closeWorkoutBtn.onclick=async()=>{document.querySelectorAll(".set-row").forEach(r=>saveRowDraft(r));workoutModal.classList.remove("open");await checkOpenSession();};
if(document.getElementById("finishWorkoutBtn"))finishWorkoutBtn.onclick=async()=>{if(!activeSession)return;const doneRows=document.querySelectorAll(".set-row .check.done").length;if(doneRows===0)return alert("Registre pelo menos uma série.");const {error}=await sb.from("training_sessions").update({finished_at:new Date().toISOString()}).eq("id",activeSession.id);if(error)return alert(error.message);clearInterval(timerId);stopRest();activeSession=null;pendingSession=null;workoutModal.classList.remove("open");await loadDashboard();await checkOpenSession();alert("Salvo LIFE OS GYM");};

function cleanHtmlText(v=""){const d=document.createElement("div");d.innerHTML=v;return d.textContent||d.innerText||"";}
function scoreExerciseName(name,query){name=(name||"").toLowerCase();query=(query||"").toLowerCase();if(name===query)return 100;if(name.includes(query)||query.includes(name))return 80;const q=query.split(/\s+/).filter(Boolean);return q.reduce((s,w)=>s+(name.includes(w)?10:0),0);}
const CURATED_DEMOS={
 "Dumbbell Incline Press":{id:"5CECBjd7HLQ",creator:"Renaissance Periodization",title:"Incline Dumbbell Press"},
 "Shoulder Press Machine":{id:"WvLMauqrnK8",creator:"Renaissance Periodization",title:"Machine Shoulder Press"},
 "Cable Lateral Raise":{id:"lq7eLC30b9w",creator:"Renaissance Periodization",title:"Leaning Cable Lateral Raise"},
 "Barbell Back Squat":{id:"PPmvh7gBTi0",creator:"Jeff Nippard",title:"Do You Have A Perfect Squat?"},
 "Leg Press Machine":{id:"nDh_BlnLCGc",creator:"Jeff Nippard",title:"How To Leg Press With Perfect Technique"},
 "Leg Extension Machine":{id:"m0FOpMEgero",creator:"Renaissance Periodization",title:"Leg Extension"},
 "Seated Leg Curl Machine":{id:"Orxowest56U",creator:"Renaissance Periodization",title:"Seated Leg Curl"},
 "Cable Lat Pulldown":{id:"PEiIOW7HGnA",creator:"Jeff Nippard",title:"Lat Pulldown Technique"},
 "Dumbbell Chest Supported Row":{id:"0UBRfiO4zDs",creator:"Renaissance Periodization",title:"Chest Supported Row"},
 "Cable Row":{id:"UCXxvVItLoM",creator:"Renaissance Periodization",title:"Seated Cable Row"},
 "Cable Tricep Extension":{id:"9CT50QsckIE",creator:"Laércio Refundini",title:"Tríceps na polia — demonstração curta"},
 "Chest Fly Machine":{id:"zEcIgGm7fxU",creator:"Pedro Rubini",title:"Crucifixo máquina / Peck Deck"},
 "Barbell Romanian Deadlift":{id:"h2fOgVj38CU",creator:"Juarez Trancoso",title:"Execução correta do Stiff"},
 "Hammer Curl":{id:"43vzsQMvYys",creator:"Treinador Wagner Durigon",title:"Rosca martelo com halter"},
 "Hip Thrust":{id:"nFmbqSiWx04",creator:"Renato Cariani",title:"Elevação pélvica"},
 "Seated Calf Raise Machine":{id:"zKC9BR3M5tg",creator:"Academia Energy Fitness",title:"Panturrilha sentado"}
};
window.openExerciseDemo=async encodedName=>{
 const exerciseName=decodeURIComponent(encodedName);
 const exerciseSearchName=exercisePt(exerciseName);
 demoTitle.textContent=exerciseSearchName;
 demoSubtitle.textContent="Demonstração selecionada para o LIFE OS GYM";
 demoMedia.innerHTML='<div class="demo-empty">Carregando demonstração...</div>';
 demoSteps.innerHTML="";
 exerciseDemoModal.classList.add("open");
 const curated=CURATED_DEMOS[exerciseName];
 if(curated){
   demoMedia.innerHTML='<iframe allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen src="https://www.youtube-nocookie.com/embed/'+curated.id+'?rel=0&controls=1&playsinline=1"></iframe>';
   demoSteps.innerHTML='<h3>'+curated.creator+'</h3><p class="muted">'+curated.title+'</p><p>Demonstração curta selecionada especificamente para este exercício.</p>';
   return;
 }
 try{
  const res=await fetch("https://wger.de/api/v2/exerciseinfo/?limit=20&name__search="+encodeURIComponent(exerciseSearchName));
  if(!res.ok)throw new Error("Falha");
  const json=await res.json();
  const ranked=(json.results||[]).map(item=>{const names=(item.translations||[]).map(t=>t.name).filter(Boolean);return {item,best:Math.max(0,...names.map(n=>scoreExerciseName(n,exerciseSearchName)))};}).sort((a,b)=>b.best-a.best);
  if(!ranked[0]||ranked[0].best<10)throw new Error("Sem mídia");
  const item=ranked[0].item;
  const video=(item.videos||[])[0];
  const image=(item.images||[]).find(i=>i.is_main)||(item.images||[])[0];
  let media="";
  if(video){const src=video.video||video.file||video.url||video.video_url;if(src)media='<video controls playsinline preload="metadata" src="'+src+'"></video>';}
  if(!media&&image){const src=image.image||image.url||(image.thumbnails&&image.thumbnails.medium)||(image.thumbnails&&image.thumbnails.small);if(src)media='<img alt="'+exerciseSearchName+'" src="'+src+'">';}
  demoMedia.innerHTML=media||'<div class="demo-empty">Este exercício ainda não tem vídeo/imagem disponível na biblioteca.</div>';
  const tr=(item.translations||[]).find(t=>String(t.language)=="2")||(item.translations||[])[0];
  const desc=cleanHtmlText((tr&&tr.description)||"");
  demoSteps.innerHTML=desc?'<h3>Como executar</h3><p>'+desc.replace(/\n+/g,"<br>")+'</p>':'<div class="muted">Sem instruções textuais disponíveis.</div>';
 }catch(err){
  demoMedia.innerHTML='<div class="demo-empty">Não encontrei mídia interna para este exercício ainda.</div>';
  demoSteps.innerHTML="";
 }
};
if(document.getElementById("closeDemoBtn"))closeDemoBtn.onclick=()=>exerciseDemoModal.classList.remove("open");
if(document.getElementById("cancelWorkoutBtn"))cancelWorkoutBtn.onclick=async()=>{
 if(!activeSession)return;
 if(!confirm("Cancelar este treino? Os registros desta sessão serão apagados."))return;
 await sb.from("training_sets").delete().eq("session_id",activeSession.id);
 const {error}=await sb.from("training_sessions").delete().eq("id",activeSession.id);
 if(error)return alert(error.message);
 clearInterval(timerId);stopRest();activeSession=null;pendingSession=null;workoutModal.classList.remove("open");await loadDashboard();await checkOpenSession();alert("Treino cancelado");
};

function setupEvolution(){
 const trainingTab=document.getElementById("trainingTab"),evolutionTab=document.getElementById("evolutionTab");
 if(!trainingTab||!evolutionTab)return;
 trainingTab.onclick=()=>switchGymView("training");
 evolutionTab.onclick=()=>switchGymView("evolution");
 populateEvolutionExercises();
}
function switchGymView(view){
 const training=document.getElementById("trainingView"),evolution=document.getElementById("evolutionView");
 const t=document.getElementById("trainingTab"),e=document.getElementById("evolutionTab");
 const isEvolution=view==="evolution";
 training.style.display=isEvolution?"none":"block";
 evolution.style.display=isEvolution?"block":"none";
 t.classList.toggle("active",!isEvolution);t.classList.toggle("ghost",isEvolution);
 e.classList.toggle("active",isEvolution);e.classList.toggle("ghost",!isEvolution);
 if(isEvolution)loadEvolutionDashboard();
}
async function populateEvolutionExercises(){
 const {data:rows}=await sb.from("training_exercises").select("id,exercise_name").order("exercise_name");
 const seen=new Map();
 for(const x of rows||[])if(!seen.has(x.exercise_name))seen.set(x.exercise_name,x.id);
 const sel=document.getElementById("evolutionExercise");if(!sel)return;
 sel.innerHTML=[...seen.keys()].sort((a,b)=>exercisePt(a).localeCompare(exercisePt(b),"pt-BR")).map(name=>'<option value="'+name.replace(/"/g,"&quot;")+'">'+exercisePt(name)+'</option>').join("");
 sel.onchange=()=>loadExerciseEvolution(sel.value);
}
function isoDay(d){return d.toISOString().slice(0,10)}
function startOfWeek(date){const d=new Date(date);const day=(d.getDay()+6)%7;d.setHours(0,0,0,0);d.setDate(d.getDate()-day);return d}
function simpleLineChart(points,{unit="",empty="Ainda não há dados suficientes."}={}){
 if(!points||points.length<1)return '<div class="empty">'+empty+'</div>';
 const w=700,h=210,p=30;const vals=points.map(x=>Number(x.value)||0);let min=Math.min(...vals),max=Math.max(...vals);if(max===min){max+=1;min=Math.max(0,min-1)}
 const x=i=>points.length===1?w/2:p+i*(w-2*p)/(points.length-1);
 const y=v=>h-p-((v-min)/(max-min))*(h-2*p);
 const line=points.map((pt,i)=>(i?"L":"M")+x(i).toFixed(1)+","+y(pt.value).toFixed(1)).join(" ");
 const dots=points.map((pt,i)=>'<circle class="chart-dot" cx="'+x(i)+'" cy="'+y(pt.value)+'" r="4"></circle><text class="chart-value" x="'+x(i)+'" y="'+(y(pt.value)-9)+'" text-anchor="middle">'+Number(pt.value).toFixed(pt.decimals??1)+unit+'</text><text class="chart-label" x="'+x(i)+'" y="'+(h-8)+'" text-anchor="middle">'+pt.label+'</text>').join("");
 const grids=[0,.5,1].map(f=>'<line class="chart-grid" x1="'+p+'" x2="'+(w-p)+'" y1="'+(p+f*(h-2*p))+'" y2="'+(p+f*(h-2*p))+'"></line>').join("");
 return '<svg class="svg-chart" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none">'+grids+'<path class="chart-line" d="'+line+'"></path>'+dots+'</svg>';
}
async function loadEvolutionDashboard(){
 const now=new Date(),seven=new Date(now);seven.setDate(now.getDate()-7);
 const {data:sessions}=await sb.from("training_sessions").select("id,started_at,finished_at").not("finished_at","is",null).order("started_at",{ascending:true}).limit(500);
 const finished=sessions||[];
 document.getElementById("evWeekCount").textContent=finished.filter(x=>new Date(x.started_at)>=seven).length;
 const weekKeys=new Set(finished.map(x=>isoDay(startOfWeek(new Date(x.started_at)))));
 let streak=0,cursor=startOfWeek(now);for(let i=0;i<52;i++){const key=isoDay(cursor);if(weekKeys.has(key)){streak++;cursor.setDate(cursor.getDate()-7)}else if(i===0){cursor.setDate(cursor.getDate()-7)}else break}
 document.getElementById("evStreak").textContent=streak;
 const {data:weights}=await sb.from("body_metrics").select("weight_kg,recorded_on").order("recorded_on",{ascending:true}).limit(180);
 const wp=weights||[];
 const current=wp.length?Number(wp[wp.length-1].weight_kg):null;
 document.getElementById("evCurrentWeight").textContent=current?current.toFixed(1)+" kg":"—";
 document.getElementById("evGoalRemaining").textContent=current?Math.max(0,75-current).toFixed(1)+" kg":"—";
 const delta=wp.length>1?current-Number(wp[0].weight_kg):0;
 document.getElementById("weightDelta").textContent=wp.length>1?(delta>=0?"+":"")+delta.toFixed(1)+" kg desde o início":"Sem histórico";
 const baseline=wp.length?Number(wp[0].weight_kg):71;
 const progress=current?Math.max(0,Math.min(100,((current-baseline)/(75-baseline))*100)):0;
 document.getElementById("goalProgress").style.width=(isFinite(progress)?progress:0)+"%";
 document.getElementById("weightChart").innerHTML=simpleLineChart(wp.slice(-10).map(x=>({value:Number(x.weight_kg),label:new Date(x.recorded_on+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"}),decimals:1})),{unit:" kg",empty:"Registre seu peso para começar o gráfico."});
 renderWeeklyFrequency(finished);
 const sel=document.getElementById("evolutionExercise");if(sel&&sel.value)await loadExerciseEvolution(sel.value);
}
function renderWeeklyFrequency(sessions){
 const box=document.getElementById("weeklyFrequency");const now=startOfWeek(new Date());const weeks=[];
 for(let i=3;i>=0;i--){const start=new Date(now);start.setDate(start.getDate()-7*i);const end=new Date(start);end.setDate(end.getDate()+7);const count=sessions.filter(s=>{const d=new Date(s.started_at);return d>=start&&d<end}).length;weeks.push({start,count});}
 box.innerHTML=weeks.map((w,i)=>'<div class="week-card"><div class="muted">'+(i===3?"Esta semana":"Semana "+new Date(w.start).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"}))+'</div><div class="week-count">'+w.count+'</div><div class="muted">treino'+(w.count===1?"":"s")+'</div></div>').join("");
}
async function loadExerciseEvolution(exerciseName){
 const {data:exRows}=await sb.from("training_exercises").select("id").eq("exercise_name",exerciseName);
 const ids=(exRows||[]).map(x=>x.id);if(!ids.length)return;
 const {data:sets}=await sb.from("training_sets").select("session_id,exercise_id,weight_kg,reps,completed").in("exercise_id",ids).eq("completed",true);
 const sessionIds=[...new Set((sets||[]).map(x=>x.session_id))];
 let sessions=[];if(sessionIds.length){const {data:s}=await sb.from("training_sessions").select("id,started_at,finished_at").in("id",sessionIds).not("finished_at","is",null).order("started_at",{ascending:true});sessions=s||[]}
 const smap=Object.fromEntries(sessions.map(s=>[s.id,s]));
 const groups={};for(const st of sets||[]){if(!smap[st.session_id])continue;if(!groups[st.session_id])groups[st.session_id]=[];groups[st.session_id].push(st)}
 const points=Object.entries(groups).map(([sid,rows])=>{const s=smap[sid];return {date:new Date(s.started_at),max:Math.max(...rows.map(r=>Number(r.weight_kg)||0)),volume:rows.reduce((n,r)=>n+(Number(r.weight_kg)||0)*(Number(r.reps)||0),0)}}).sort((a,b)=>a.date-b.date);
 const last=points[points.length-1],best=points.length?Math.max(...points.map(p=>p.max)):0;
 document.getElementById("evLastLoad").textContent=last?last.max.toFixed(1)+" kg":"—";
 document.getElementById("evBestLoad").textContent=points.length?best.toFixed(1)+" kg":"—";
 document.getElementById("evLastVolume").textContent=last?Math.round(last.volume)+" kg":"—";
 const trend=document.getElementById("evTrend");trend.className="trend-pill";
 if(points.length<2){trend.textContent="Coletando dados"}
 else{const first=points[0].max,diff=last.max-first;if(diff>0){trend.textContent="↑ Evoluindo";trend.classList.add("up")}else if(diff<0){trend.textContent="↓ Abaixo do início";trend.classList.add("down")}else trend.textContent="→ Estável"}
 document.getElementById("exerciseChart").innerHTML=simpleLineChart(points.slice(-10).map(p=>({value:p.max,label:p.date.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"}),decimals:1})),{unit:" kg",empty:"Faça este exercício em pelo menos um treino para gerar o gráfico."});
}

auth();