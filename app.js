const pages={dashboard:["Dashboard","Visão geral do seu sistema de conteúdo."],insights:["Inbox de Insights","Capture ideias antes que elas se percam."],contents:["Conteúdos","Acompanhe a produção editorial."],approval:["Aprovação","Controle humano antes de qualquer publicação."],calendar:["Calendário","Planejamento editorial e agendamentos."],analytics:["Métricas","Resultados e aprendizado do agente."],rules:["Regras Editoriais","A identidade que orienta o agente."]};
const labels={dashboard:"Dashboard",insights:"Insights",contents:"Conteúdos",approval:"Aprovação",calendar:"Calendário",analytics:"Métricas",rules:"Regras"};
const seed={insights:[{id:"local-i1",title:"Autoridade sem entregar toda a execução",body:"Mostrar domínio do problema, explicar o que e por quê, usar cases e complexidade.",source:"Estudo",status:"INSIGHT"}],contents:[{id:"local-c1",title:"IA NÃO COMEÇA PELA FERRAMENTA. COMEÇA PELO PROBLEMA.",format:"Carrossel • 9 slides",status:"APROVADO",caption:"Problema → Processo → Dados → Solução → Tecnologia.",scheduled_at:null}]};
let data={insights:[],contents:[]};
let client=null, currentUser=null, remoteReady=false;

const $=id=>document.getElementById(id);
function esc(v=""){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function saveLocal(){localStorage.setItem("lifeos-content",JSON.stringify(data));render()}
function badge(s){return `<span class="badge ${["APROVADO","PUBLICADO"].includes(s)?"ok":""}">${esc(s)}</span>`}
function go(id){document.querySelectorAll(".section").forEach(x=>x.classList.remove("active"));$(id).classList.add("active");document.querySelectorAll("nav button").forEach(x=>x.classList.toggle("active",x.dataset.id===id));$("title").textContent=pages[id][0];$("desc").textContent=pages[id][1]}
$("nav").innerHTML=Object.keys(pages).map((p,i)=>`<button data-id="${p}" class="${i===0?"active":""}" onclick="go('${p}')"><span class="dot"></span>${labels[p]}</button>`).join("");

function render(){
 $("metrics").innerHTML=[["Insights",data.insights.length],["Em produção",data.contents.filter(x=>!["APROVADO","PUBLICADO"].includes(x.status)).length],["Aguardando aprovação",data.contents.filter(x=>x.status==="AGUARDANDO_APROVACAO").length],["Aprovados",data.contents.filter(x=>x.status==="APROVADO").length]].map(x=>`<div class="card metric"><span class="muted">${x[0]}</span><b>${x[1]}</b></div>`).join("");
 $("queue").innerHTML=data.contents.length?data.contents.map(x=>`<div class="item"><div><b>${esc(x.title)}</b><div class="muted">${esc(x.format||"")}</div></div>${badge(x.status)}</div>`).join(""):'<div class="empty">Fila vazia</div>';
 $("insightList").innerHTML=data.insights.length?data.insights.map(x=>`<div class="item"><div><b>${esc(x.title)}</b><div class="muted">${esc(x.source||"Outro")} • ${esc(x.body||"")}</div></div><div class="toolbar">${badge(x.status)}<button class="btn ghost" onclick="promote('${x.id}')">Virar pauta</button></div></div>`).join(""):'<div class="empty">Nenhum insight capturado.</div>';
 $("contentList").innerHTML=data.contents.length?data.contents.map(x=>`<div class="item"><div><b>${esc(x.title)}</b><div class="muted">${esc(x.format||"")} • ${esc(x.caption||"")}</div></div><div class="toolbar">${badge(x.status)}${x.status==="DRAFT"?`<button class="btn" onclick="requestApproval('${x.id}')">Enviar p/ aprovação</button>`:""}</div></div>`).join(""):'<div class="empty">Nenhum conteúdo.</div>';
 const waiting=data.contents.filter(x=>x.status==="AGUARDANDO_APROVACAO");
 $("approvalList").innerHTML=waiting.length?waiting.map(x=>`<div class="item"><div><b>${esc(x.title)}</b><div class="muted">${esc(x.format||"")}</div></div><div class="toolbar"><button class="btn" onclick="approve('${x.id}')">APROVAR</button><button class="btn danger" onclick="reject('${x.id}')">ALTERAR</button></div></div>`).join(""):'<div class="empty">Nenhum conteúdo aguardando aprovação.</div>';
 $("calendarGrid").innerHTML=Array.from({length:14},(_,i)=>{let d=new Date();d.setDate(d.getDate()+i);let key=d.toISOString().slice(0,10);let ev=data.contents.filter(x=>(x.scheduled_at||"").slice(0,10)===key);return `<div class="day"><b>${d.toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})}</b>${ev.map(e=>`<div class="event">${esc(e.title)}</div>`).join("")}</div>`}).join("");
}

function openInsight(){$("modal").classList.add("open")} function closeModal(){$("modal").classList.remove("open")}
function openAuth(){$("authModal").classList.add("open")} function closeAuth(){$("authModal").classList.remove("open")}

async function saveInsight(){
 const title=$("iTitle").value.trim(); if(!title)return alert("Digite um título.");
 const row={title,body:$("iBody").value.trim(),source:$("iSource").value,status:"INSIGHT"};
 if(remoteReady){
   const {data:r,error}=await client.from("insights").insert({...row,user_id:currentUser.id}).select().single();
   if(error)return alert("Erro ao salvar: "+error.message);
   data.insights.unshift(r);
 }else{
   data.insights.unshift({id:"local-"+Date.now(),...row});
 }
 $("iTitle").value="";$("iBody").value="";closeModal();saveLocal();go("insights");
}
async function promote(id){
 const i=data.insights.find(x=>String(x.id)===String(id)); if(!i)return;
 if(remoteReady){
   let {error:e1}=await client.from("insights").update({status:"PAUTA"}).eq("id",id); if(e1)return alert(e1.message);
   let {data:c,error:e2}=await client.from("contents").insert({user_id:currentUser.id,insight_id:id,title:i.title,format:"A definir",status:"DRAFT",caption:i.body||""}).select().single(); if(e2)return alert(e2.message);
   i.status="PAUTA"; data.contents.unshift(c);
 }else{
   i.status="PAUTA"; data.contents.unshift({id:"local-"+Date.now(),title:i.title,format:"A definir",status:"DRAFT",caption:i.body||"",scheduled_at:null});
 }
 saveLocal();go("contents");
}
async function setStatus(id,status){
 const c=data.contents.find(x=>String(x.id)===String(id)); if(!c)return;
 if(remoteReady){const {error}=await client.from("contents").update({status}).eq("id",id);if(error)return alert(error.message)}
 c.status=status;saveLocal();
}
async function requestApproval(id){await setStatus(id,"AGUARDANDO_APROVACAO");go("approval")}
async function approve(id){await setStatus(id,"APROVADO")}
async function reject(id){await setStatus(id,"DRAFT");go("contents")}

async function initSupabase(){
 try{
   const cfg=window.LIFE_OS_CONFIG;
   if(!cfg||!window.supabase)return setDbState("LOCAL","Supabase não carregado");
   client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
   const {data:{session}}=await client.auth.getSession();
   currentUser=session?.user||null;
   client.auth.onAuthStateChange(async(_event,session)=>{currentUser=session?.user||null;await refreshRemote()});
   await refreshRemote();
 }catch(e){setDbState("LOCAL","Falha de conexão");console.error(e)}
}
async function refreshRemote(){
 if(!currentUser){remoteReady=false;data={insights:[],contents:[]};setDbState("OFFLINE","Faça login");renderAuth();render();return}
 const [{data:ins,error:ei},{data:con,error:ec}]=await Promise.all([
   client.from("insights").select("*").order("created_at",{ascending:false}),
   client.from("contents").select("*").order("created_at",{ascending:false})
 ]);
 if(ei||ec){remoteReady=false;setDbState("CONFIGURAR","Execute supabase/schema.sql");renderAuth();return}
 remoteReady=true; data={insights:ins||[],contents:con||[]};
 if(!data.insights.length&&!data.contents.length)await seedRemote();
 localStorage.setItem("lifeos-content",JSON.stringify(data));
 setDbState("ONLINE","Supabase sincronizado");renderAuth();render();
}
async function seedRemote(){
 const {data:i}=await client.from("insights").insert({user_id:currentUser.id,title:seed.insights[0].title,body:seed.insights[0].body,source:"Estudo",status:"INSIGHT"}).select().single();
 const {data:c}=await client.from("contents").insert({user_id:currentUser.id,title:seed.contents[0].title,format:seed.contents[0].format,status:"APROVADO",caption:seed.contents[0].caption}).select().single();
 data={insights:i?[i]:[],contents:c?[c]:[]};
}
function setDbState(state,msg){$("dbState").textContent=state;$("dbState").className="badge "+(state==="ONLINE"?"ok":"");$("dbHint").textContent=msg}
function renderAuth(){
 $("authBtn").textContent=currentUser?"Conta":"Entrar";
 $("authInfo").textContent=currentUser?currentUser.email:"Sem login";
 $("logoutBtn").style.display=currentUser?"block":"none";
 $("loginGate").style.display=currentUser?"none":"grid";
 $("appShell").classList.toggle("auth-hidden",!currentUser);
}
async function signIn(){
 const email=$("authEmail").value.trim(),password=$("authPassword").value;
 if(!email||!password)return alert("Informe e-mail e senha.");
 const {error}=await client.auth.signInWithPassword({email,password}); if(error)return alert(error.message);closeAuth();
}
async function signUp(){
 const email=$("authEmail").value.trim(),password=$("authPassword").value;
 if(!email||password.length<6)return alert("Use um e-mail válido e senha com pelo menos 6 caracteres.");
 const {error}=await client.auth.signUp({email,password}); if(error)return alert(error.message);
 alert("Conta criada. Se a confirmação de e-mail estiver ativa no Supabase, confirme o e-mail antes de entrar.");
}
async function signOut(){if(client)await client.auth.signOut();currentUser=null;remoteReady=false;data={insights:[],contents:[]};localStorage.removeItem("lifeos-content");setDbState("OFFLINE","Faça login");renderAuth();render()}

render();initSupabase();
