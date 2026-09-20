const cfg=window.LIFE_OS_CONFIG;
const sb=supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
let user=null,daily=null,routine=null,todayContent=null,businessTasks=[],studyMinutes=0,trainingDone=false;
const $=id=>document.getElementById(id);
const todayKey=()=>new Date().toLocaleDateString("en-CA",{timeZone:"America/Sao_Paulo"});
const weekday=()=>{const d=new Date().getDay();return d===0?7:d};
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
async function auth(){
 const {data:{session}}=await sb.auth.getSession();
 if(session){user=session.user;return boot()}
 loginBtn.onclick=async()=>{const email=prompt("E-mail do LIFE OS");if(!email)return;const password=prompt("Senha");if(!password)return;const {error}=await sb.auth.signInWithPassword({email,password});if(error)return alert(error.message);user=(await sb.auth.getUser()).data.user;boot()}
}
async function ensureDaily(){
 const day=todayKey();
 let {data}=await sb.from("life_daily_status").select("*").eq("day",day).maybeSingle();
 if(!data){const r=await sb.from("life_daily_status").insert({user_id:user.id,day}).select().single();data=r.data}
 daily=data;
}
async function loadAll(){
 const day=todayKey(),wd=weekday(),start=day+"T00:00:00-03:00",end=day+"T23:59:59-03:00";
 const [rr,ts,ss,cp,bt]=await Promise.all([
  sb.from("training_routines").select("*").eq("active",true).eq("day_of_week",wd).order("position").limit(1),
  sb.from("training_sessions").select("id,finished_at,routine_id").gte("started_at",start).lte("started_at",end),
  sb.from("study_sessions").select("started_at,finished_at").gte("started_at",start).lte("started_at",end),
  sb.from("content_plan").select("*").eq("active",true).eq("weekday",wd).limit(1),
  sb.from("business_tasks").select("*").in("status",["todo","doing","waiting_approval"]).order("priority",{ascending:false}).order("created_at",{ascending:false}).limit(8)
 ]);
 routine=rr.data?.[0]||null;
 trainingDone=(ts.data||[]).some(x=>x.finished_at);
 studyMinutes=(ss.data||[]).reduce((sum,s)=>{if(!s.finished_at)return sum;return sum+Math.max(1,Math.round((new Date(s.finished_at)-new Date(s.started_at))/60000))},0);
 todayContent=cp.data?.[0]||null;businessTasks=bt.data||[];
}
async function boot(){
 gate.style.display="none";shell.style.display="grid";
 await ensureDaily();await loadAll();render();
}
function render(){
 const now=new Date();dateLabel.textContent=now.toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"});
 priorityInput.value=daily.top_priority||"";focusText.textContent=daily.top_priority||"Defina sua prioridade principal";
 morningBtn.textContent=daily.morning_checkin?"✓ Check-in feito":"Check-in da manhã";
 eveningBtn.textContent=daily.evening_checkin?"✓ Dia encerrado":"Fechar o dia";
 trainingMetric.textContent=routine?routine.name:"Descanso";trainingSub.textContent=trainingDone?"Treino concluído":"Treino ainda não concluído";
 waterNow.textContent=daily.water_ml;waterTarget.textContent=daily.water_target_ml;waterBar.style.width=Math.min(100,daily.water_ml/daily.water_target_ml*100)+"%";
 calNow.textContent=daily.calories_logged;calTarget.textContent=daily.calorie_target;proteinNow.textContent=daily.protein_logged_g;proteinTarget.textContent=daily.protein_target_g;
 studyNow.textContent=Math.max(daily.study_logged_min||0,studyMinutes);studyTarget.textContent=daily.study_target_min;
 renderContent();renderBusiness();renderTasks();renderSummary();renderProgress();
}
function renderContent(){
 if(!todayContent){contentToday.innerHTML='<div class="muted">Sem conteúdo programado para hoje. Use o dia para capturar insights.</div>';return}
 contentToday.innerHTML='<div class="task"><div class="task-main"><b>'+esc(todayContent.title)+'</b><div class="muted">'+esc(todayContent.pillar)+' • '+esc(todayContent.format)+'</div></div><span class="badge">'+(todayContent.publish_time||"").slice(0,5)+'</span></div><div style="margin-top:10px;padding:12px;border:1px dashed #294563;border-radius:10px"><b>Você precisa alimentar o agente com:</b><div class="muted" style="margin-top:6px">'+esc(todayContent.input_needed||"")+'</div></div><div class="quick"><a class="btn" href="./index.html">Abrir Content AI</a></div>';
}
function renderBusiness(){
 businessToday.innerHTML=businessTasks.length?businessTasks.slice(0,5).map(t=>'<div class="task"><div class="task-main"><b>'+esc(t.title)+'</b><div class="muted">'+esc(t.sector)+' • '+esc(t.status)+'</div></div><span class="badge">'+esc(t.priority||"normal").toUpperCase()+'</span></div>').join(""):'<div class="muted">Nenhuma tarefa empresarial pendente.</div>';
}
function renderTasks(){
 const items=[
  {done:trainingDone||!routine,title:routine?"Treino — "+routine.name:"Dia sem musculação",sub:trainingDone?"Concluído":"Abrir Treinos e registrar sessão",href:"./treinos.html"},
  {done:Math.max(daily.study_logged_min||0,studyMinutes)>=daily.study_target_min,title:"Estudar "+daily.study_target_min+" min",sub:"Foco atual: Inglês",href:"./estudos.html"},
  {done:daily.water_ml>=daily.water_target_ml,title:"Água — "+daily.water_target_ml+" ml",sub:daily.water_ml+" ml registrados",href:"#"},
  {done:!todayContent,title:todayContent?"Alimentar Content AI":"Capturar um insight",sub:todayContent?.title||"Sem pauta obrigatória hoje",href:"./index.html"},
  {done:businessTasks.length===0,title:"Revisar Empresa",sub:businessTasks.length+" tarefa(s) pendente(s)",href:"./empresa.html"}
 ];
 todayTasks.innerHTML=items.map(x=>'<div class="task"><div class="task-main"><b><span class="status-dot '+(x.done?"done":"")+'"></span>'+esc(x.title)+'</b><div class="muted">'+esc(x.sub)+'</div></div>'+(x.href!=="#"?'<a class="btn ghost" href="'+x.href+'">Abrir</a>':'')+'</div>').join("");
}
function renderSummary(){
 const rows=[
  ["Treino",trainingDone?"Concluído":routine?"Pendente":"Descanso"],
  ["Água",Math.round(daily.water_ml/daily.water_target_ml*100)+"% da meta"],
  ["Estudo",Math.max(daily.study_logged_min||0,studyMinutes)+" min"],
  ["Conteúdo",todayContent?todayContent.title:"Sem pauta"],
  ["Empresa",businessTasks.length+" pendência(s)"]
 ];
 dailySummary.innerHTML=rows.map(r=>'<div class="task"><span>'+esc(r[0])+'</span><span class="badge">'+esc(r[1])+'</span></div>').join("");
}
function renderProgress(){
 let checks=0,total=5;
 if(trainingDone||!routine)checks++;
 if(daily.water_ml>=daily.water_target_ml)checks++;
 if(Math.max(daily.study_logged_min||0,studyMinutes)>=daily.study_target_min)checks++;
 if(!todayContent)checks++;
 if(businessTasks.length===0)checks++;
 const pct=Math.round(checks/total*100);dayProgress.textContent=pct;dayProgressBar.style.width=pct+"%";progressSummary.textContent=checks+" de "+total+" frentes em dia.";
}
async function patchDaily(patch){const {data,error}=await sb.from("life_daily_status").update({...patch,updated_at:new Date().toISOString()}).eq("id",daily.id).select().single();if(error)return alert(error.message);daily=data;render()}
window.addWater=ml=>patchDaily({water_ml:(daily.water_ml||0)+ml});
window.savePriority=()=>patchDaily({top_priority:priorityInput.value.trim()||null});
window.toggleMorning=()=>patchDaily({morning_checkin:!daily.morning_checkin});
window.toggleEvening=()=>patchDaily({evening_checkin:!daily.evening_checkin});
auth();