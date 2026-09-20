const cfg=window.LIFE_OS_CONFIG;
const sb=supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
let user=null,routines=[],selected=null,activeSession=null,activeExercises=[],timerId=null,startedAt=null;
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
async function boot(){
 document.getElementById("gate").style.display="none";document.getElementById("shell").style.display="grid";
 await ensureSeed();await load();await loadDashboard();
}
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
 exerciseList.innerHTML=(e||[]).map(x=>`<div class="exercise"><div><b>${x.exercise_name}</b><div class="muted">${x.sets} séries</div></div><div class="reps">${(x.reps||[]).join(" / ")} reps</div></div>`).join("");
}
startBtn.onclick=async()=>{
 if(!selected)return;
 const {data:s,error}=await sb.from("training_sessions").insert({user_id:user.id,routine_id:selected}).select().single();
 if(error)return alert(error.message);
 alert("Treino iniciado no LIFE OS. Registro da sessão criado.");
};
async function loadDashboard(){const {data:w}=await sb.from("body_metrics").select("weight_kg,recorded_on").order("recorded_on",{ascending:false}).limit(1);if(document.getElementById("currentWeight"))currentWeight.textContent=w&&w[0]&&w[0].weight_kg?Number(w[0].weight_kg).toFixed(1)+" kg":"71 kg";if(document.getElementById("weightHint"))weightHint.textContent=w&&w[0]?"Último registro: "+w[0].recorded_on:"Sem registro ainda";const {data:s}=await sb.from("training_sessions").select("id,started_at,finished_at,routine_id").not("finished_at","is",null).order("started_at",{ascending:false}).limit(8);if(document.getElementById("completedCount"))completedCount.textContent=(s||[]).length;const map=Object.fromEntries(routines.map(r=>[r.id,r.name]));if(document.getElementById("historyList"))historyList.innerHTML=(s||[]).length?(s||[]).map(x=>"<div class=\"item\"><b>"+(map[x.routine_id]||"Treino")+"</b><div class=\"muted\">"+new Date(x.started_at).toLocaleString("pt-BR")+"</div></div>").join(""):"<div class=\"muted\">Nenhum treino concluído ainda.</div>";}
if(document.getElementById("saveWeightBtn"))saveWeightBtn.onclick=async()=>{const kg=Number(weightInput.value.replace(",","."));if(!kg||kg<30||kg>250)return alert("Informe um peso válido.");const {error}=await sb.from("body_metrics").upsert({user_id:user.id,recorded_on:new Date().toISOString().slice(0,10),weight_kg:kg},{onConflict:"user_id,recorded_on"});if(error)return alert(error.message);weightInput.value="";await loadDashboard();};
async function startWorkout(){if(!selected)return;const r=routines.find(x=>x.id===selected);const {data:e,error:ee}=await sb.from("training_exercises").select("*").eq("routine_id",selected).order("position");if(ee)return alert(ee.message);const {data:s,error}=await sb.from("training_sessions").insert({user_id:user.id,routine_id:selected}).select().single();if(error)return alert(error.message);activeSession=s;activeExercises=e||[];startedAt=new Date(s.started_at);const ids=activeExercises.map(x=>x.id);let previous=[];if(ids.length){const {data:p}=await sb.from("training_sets").select("exercise_id,set_number,weight_kg,reps,created_at").in("exercise_id",ids).eq("completed",true).order("created_at",{ascending:false}).limit(200);previous=p||[];}const prevMap={};for(const p of previous){const k=p.exercise_id+"_"+p.set_number;if(prevMap[k]===undefined)prevMap[k]=p;}workoutTitle.textContent=r.name;workoutExercises.innerHTML=activeExercises.map(ex=>{const targets=ex.reps||[];const rows=Array.from({length:ex.sets},(_,i)=>{const p=prevMap[ex.id+"_"+(i+1)];return "<div class=\"set-row\" data-ex=\""+ex.id+"\" data-set=\""+(i+1)+"\"><b>"+(i+1)+"</b><span class=\"muted\">"+(p&&p.weight_kg!=null?p.weight_kg:"—")+"</span><input class=\"kg\" inputmode=\"decimal\" placeholder=\"kg\" value=\""+(p&&p.weight_kg!=null?p.weight_kg:"")+"\"><input class=\"rp\" inputmode=\"numeric\" placeholder=\""+(targets[i]||"")+"\"><button class=\"check\" onclick=\"toggleSet(this)\">✓</button></div>";}).join("");return "<div class=\"work-ex\"><h3>"+ex.exercise_name+"</h3><div class=\"muted\">Alvo: "+targets.join(" / ")+" reps</div><div class=\"set-head\"><span>Série</span><span>Anterior</span><span>Kg</span><span>Reps</span><span>Feita</span></div>"+rows+"</div>";}).join("");workoutModal.classList.add("open");startTimer();}
window.toggleSet=async btn=>{const row=btn.closest(".set-row");if(btn.classList.contains("done")){btn.classList.remove("done");return}const kg=Number(row.querySelector(".kg").value.replace(",","."));const reps=Number(row.querySelector(".rp").value);if(!kg||!reps)return alert("Preencha carga e repetições.");const payload={user_id:user.id,session_id:activeSession.id,exercise_id:row.dataset.ex,set_number:Number(row.dataset.set),weight_kg:kg,reps:reps,completed:true};const {data:existing}=await sb.from("training_sets").select("id").eq("session_id",activeSession.id).eq("exercise_id",row.dataset.ex).eq("set_number",Number(row.dataset.set)).maybeSingle();const q=existing?sb.from("training_sets").update(payload).eq("id",existing.id):sb.from("training_sets").insert(payload);const {error}=await q;if(error)return alert(error.message);btn.classList.add("done");};
function startTimer(){clearInterval(timerId);const tick=()=>{const sec=Math.max(0,Math.floor((Date.now()-startedAt.getTime())/1000));timer.textContent=String(Math.floor(sec/60)).padStart(2,"0")+":"+String(sec%60).padStart(2,"0");};tick();timerId=setInterval(tick,1000);}
if(document.getElementById("closeWorkoutBtn"))closeWorkoutBtn.onclick=()=>workoutModal.classList.remove("open");
if(document.getElementById("finishWorkoutBtn"))finishWorkoutBtn.onclick=async()=>{if(!activeSession)return;const doneRows=document.querySelectorAll(".set-row .check.done").length;if(doneRows===0)return alert("Registre pelo menos uma série.");const {error}=await sb.from("training_sessions").update({finished_at:new Date().toISOString()}).eq("id",activeSession.id);if(error)return alert(error.message);clearInterval(timerId);activeSession=null;workoutModal.classList.remove("open");await loadDashboard();alert("Treino finalizado e salvo no LIFE OS.");};
auth();