const cfg=window.LIFE_OS_CONFIG;
const sb=supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
let user=null,daily=null,entries=[],lastWeight=null;
const $=id=>document.getElementById(id);
const todayKey=()=>new Date().toLocaleDateString("en-CA",{timeZone:"America/Sao_Paulo"});
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const mealNames={breakfast:"Café da manhã",lunch:"Almoço",snack:"Lanche",dinner:"Jantar",other:"Outro"};
async function auth(){
 const {data:{session}}=await sb.auth.getSession();
 if(session){user=session.user;return boot()}
 loginBtn.onclick=async()=>{const email=prompt("E-mail do LIFE OS");if(!email)return;const password=prompt("Senha");if(!password)return;const {error}=await sb.auth.signInWithPassword({email,password});if(error)return alert(error.message);user=(await sb.auth.getUser()).data.user;boot()}
}
async function ensureDaily(){
 const day=todayKey();let {data}=await sb.from("life_daily_status").select("*").eq("day",day).maybeSingle();
 if(!data){const r=await sb.from("life_daily_status").insert({user_id:user.id,day}).select().single();data=r.data}
 daily=data;
}
async function loadData(){
 const day=todayKey();
 const [e,w]=await Promise.all([
  sb.from("nutrition_entries").select("*").eq("day",day).order("created_at"),
  sb.from("body_metrics").select("*").order("recorded_on",{ascending:false}).limit(1)
 ]);
 entries=e.data||[];lastWeight=w.data?.[0]||null;
 await syncDailyTotals();
}
async function syncDailyTotals(){
 const calories=Math.round(entries.reduce((s,x)=>s+Number(x.calories||0),0));
 const protein=Math.round(entries.reduce((s,x)=>s+Number(x.protein_g||0),0)*10)/10;
 const {data}=await sb.from("life_daily_status").update({calories_logged:calories,protein_logged_g:protein,updated_at:new Date().toISOString()}).eq("id",daily.id).select().single();
 if(data)daily=data;
}
async function boot(){gate.style.display="none";shell.style.display="grid";dateLabel.textContent=new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"});await ensureDaily();await loadData();render()}
function render(){
 calNow.textContent=daily.calories_logged;calTarget.textContent=daily.calorie_target;proteinNow.textContent=daily.protein_logged_g;proteinTarget.textContent=daily.protein_target_g;waterNow.textContent=daily.water_ml;waterTarget.textContent=daily.water_target_ml;weightNow.textContent=lastWeight?Number(lastWeight.weight_kg).toFixed(1):"—";
 const cp=Math.min(100,Math.round((daily.calories_logged/daily.calorie_target)*100)||0),pp=Math.min(100,Math.round((daily.protein_logged_g/daily.protein_target_g)*100)||0),wp=Math.min(100,Math.round((daily.water_ml/daily.water_target_ml)*100)||0);
 calBar.style.width=cp+"%";proteinBar.style.width=pp+"%";waterBar.style.width=wp+"%";calRing.style.setProperty("--pct",cp+"%");ringPct.textContent=cp+"%";
 renderMeals();
}
function renderMeals(){
 const order=["breakfast","lunch","snack","dinner","other"];
 mealList.innerHTML=order.map(type=>{
  const list=entries.filter(x=>x.meal_type===type);const kcal=Math.round(list.reduce((s,x)=>s+Number(x.calories||0),0));
  return '<div class="meal"><div class="meal-head"><div><b>'+mealNames[type]+'</b><div class="muted">'+list.length+' item(ns)</div></div><span class="badge">'+kcal+' kcal</span></div>'+(list.length?list.map(x=>'<div class="food"><div><b>'+esc(x.food_name)+'</b><div class="muted">'+(x.quantity?esc(x.quantity+" "+(x.unit||"")):"")+'</div></div><div style="text-align:right"><b>'+x.calories+' kcal</b><div class="muted">'+Number(x.protein_g||0).toFixed(1)+'g prot.</div><button class="btn danger" style="margin-top:5px;padding:5px 7px;font-size:11px" onclick="deleteFood(\''+x.id+'\')">Excluir</button></div></div>').join(""):'<div class="muted" style="margin-top:8px">Nada registrado.</div>')+'</div>';
 }).join("");
}
window.openFoodModal=()=>foodModal.style.display="flex";window.closeFoodModal=()=>foodModal.style.display="none";
window.saveFood=async()=>{
 const name=foodName.value.trim();if(!name)return alert("Digite o alimento.");
 const payload={user_id:user.id,day:todayKey(),meal_type:mealType.value,food_name:name,quantity:Number(foodQty.value)||null,unit:foodUnit.value.trim()||null,calories:Number(foodCalories.value)||0,protein_g:Number(foodProtein.value)||0,carbs_g:Number(foodCarbs.value)||0,fat_g:Number(foodFat.value)||0};
 const {error}=await sb.from("nutrition_entries").insert(payload);if(error)return alert(error.message);
 foodName.value=foodQty.value=foodUnit.value=foodCalories.value=foodProtein.value=foodCarbs.value=foodFat.value="";closeFoodModal();await loadData();render();
};
window.deleteFood=async id=>{await sb.from("nutrition_entries").delete().eq("id",id);await loadData();render()};
window.addWater=async ml=>{const {data,error}=await sb.from("life_daily_status").update({water_ml:(daily.water_ml||0)+ml,updated_at:new Date().toISOString()}).eq("id",daily.id).select().single();if(error)return alert(error.message);daily=data;render()};
window.saveWeight=async()=>{
 const w=Number(weightInput.value);if(!w)return alert("Informe o peso.");
 const {error}=await sb.from("body_metrics").upsert({user_id:user.id,recorded_on:todayKey(),weight_kg:w},{onConflict:"user_id,recorded_on"});if(error)return alert(error.message);
 weightInput.value="";await loadData();render();
};
auth();