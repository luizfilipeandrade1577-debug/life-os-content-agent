const cfg=window.LIFE_OS_CONFIG;
const sb=supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
let user=null,routines=[],selected=null;
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
 await ensureSeed();await load();
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
auth();