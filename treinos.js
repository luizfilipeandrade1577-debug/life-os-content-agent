const cfg=window.LIFE_OS_CONFIG;
const sb=supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
let user=null,routines=[],selected=null,activeSession=null,activeExercises=[],timerId=null,startedAt=null,restTimerId=null,restEndsAt=null,pendingSession=null,autosaveTimers={};
const DAYS={1:"Segunda",2:"Terça",3:"Quarta",4:"Quinta",5:"Sexta",6:"Sábado",7:"Domingo"};
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
async function boot(){document.getElementById("gate").style.display="none";document.getElementById("shell").style.display="grid";await ensureSeed();await load();await loadDashboard();await checkOpenSession();}
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
function renderRoutines(){
 routineGrid.innerHTML=routines.map(r=>`<div class="card routine ${selected===r.id?"active":""}" onclick="selectRoutine('${r.id}')"><span class="badge">${DAYS[r.day_of_week]}</span><h3>${r.name.replace("LIFE OS - ","")}</h3><div class="muted">${r.name}</div></div>`).join("");
}
async function selectRoutine(id){
 selected=id;renderRoutines();const r=routines.find(x=>x.id===id);routineTitle.textContent=r.name;routineDay.textContent=DAYS[r.day_of_week];
 const {data:e}=await sb.from("training_exercises").select("*").eq("routine_id",id).order("position");
 exerciseList.innerHTML=(e||[]).map(x=>`<div class="exercise"><div><b>${x.exercise_name}</b><div class="muted">${x.sets} séries</div><a class="demo" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent(x.exercise_name+" exercise form")}">▶ Ver demonstração</a></div><div class="reps">${(x.reps||[]).join(" / ")} reps</div></div>`).join("");
}
startBtn.onclick=startWorkout;
async function checkOpenSession(){const {data:s}=await sb.from("training_sessions").select("*").is("finished_at",null).order("started_at",{ascending:false}).limit(1);pendingSession=s&&s[0]?s[0]:null;if(!pendingSession){if(document.getElementById("resumeCard"))resumeCard.style.display="none";return}const r=routines.find(x=>x.id===pendingSession.routine_id);if(document.getElementById("resumeCard"))resumeCard.style.display="block";if(document.getElementById("resumeText"))resumeText.textContent=(r?r.name:"Treino")+" • iniciado "+new Date(pendingSession.started_at).toLocaleString("pt-BR");}
if(document.getElementById("resumeBtn"))resumeBtn.onclick=()=>{if(pendingSession)resumeWorkout(pendingSession);};
async function loadDashboard(){const {data:w}=await sb.from("body_metrics").select("weight_kg,recorded_on").order("recorded_on",{ascending:false}).limit(1);if(document.getElementById("currentWeight"))currentWeight.textContent=w&&w[0]&&w[0].weight_kg?Number(w[0].weight_kg).toFixed(1)+" kg":"71 kg";if(document.getElementById("weightHint"))weightHint.textContent=w&&w[0]?"Último registro: "+w[0].recorded_on:"Sem registro ainda";const {data:s}=await sb.from("training_sessions").select("id,started_at,finished_at,routine_id").not("finished_at","is",null).order("started_at",{ascending:false}).limit(8);if(document.getElementById("completedCount"))completedCount.textContent=(s||[]).length;const map=Object.fromEntries(routines.map(r=>[r.id,r.name]));if(document.getElementById("historyList"))historyList.innerHTML=(s||[]).length?(s||[]).map(x=>"<div class=\"item\"><b>"+(map[x.routine_id]||"Treino")+"</b><div class=\"muted\">"+new Date(x.started_at).toLocaleString("pt-BR")+"</div></div>").join(""):"<div class=\"muted\">Nenhum treino concluído ainda.</div>";}
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
 workoutExercises.innerHTML=activeExercises.map(ex=>{const targets=ex.reps||[];const rows=Array.from({length:ex.sets},(_,i)=>{const p=prevMap[ex.id+"_"+(i+1)],c=curMap[ex.id+"_"+(i+1)];return "<div class=\"set-row\" data-ex=\""+ex.id+"\" data-set=\""+(i+1)+"\"><b>"+(i+1)+"</b><span class=\"muted\">"+(p&&p.weight_kg!=null?p.weight_kg:"—")+"</span><input class=\"kg\" inputmode=\"decimal\" placeholder=\"kg\" value=\""+(c&&c.weight_kg!=null?c.weight_kg:(p&&p.weight_kg!=null?p.weight_kg:""))+"\"><input class=\"rp\" inputmode=\"numeric\" placeholder=\""+(targets[i]||"")+"\" value=\""+(c&&c.reps!=null?c.reps:"")+"\"><button class=\"check "+(c&&c.completed?"done":"")+"\" onclick=\"toggleSet(this)\">✓</button></div>";}).join("");return "<div class=\"work-ex\"><div class=\"top\" style=\"margin-bottom:8px\"><div><h3 style=\"margin:0\">"+ex.exercise_name+"</h3><div class=\"muted\">Alvo: "+targets.join(" / ")+" reps</div><div class=\"progression\">"+progressionText(ex,prevMap)+"</div></div><a class=\"demo\" target=\"_blank\" rel=\"noopener\" href=\"https://www.youtube.com/results?search_query="+encodeURIComponent(ex.exercise_name+" exercise form")+"\">▶ Demonstração</a></div><div class=\"set-head\"><span>Série</span><span>Anterior</span><span>Kg</span><span>Reps</span><span>Feita</span></div>"+rows+"</div>";}).join("");
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
auth();