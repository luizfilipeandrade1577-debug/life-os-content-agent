const pages={dashboard:["Dashboard","Visão geral do seu sistema de conteúdo."],insights:["Inbox de Insights","Capture ideias antes que elas se percam."],contents:["Conteúdos","Acompanhe a produção editorial."],approval:["Aprovação","Controle humano antes de qualquer publicação."],calendar:["Calendário","Planejamento editorial e agendamentos."],analytics:["Métricas","Resultados e aprendizado do agente."],rules:["Regras Editoriais","A identidade que orienta o agente."]};
const labels={dashboard:"Dashboard",insights:"Insights",contents:"Conteúdos",approval:"Aprovação",calendar:"Calendário",analytics:"Métricas",rules:"Regras"};
const seed={insights:[{title:"Autoridade sem entregar toda a execução",body:"Mostrar domínio do problema, explicar o que e por quê, usar cases e complexidade.",source:"Estudo",status:"INSIGHT"}],contents:[{title:"IA NÃO COMEÇA PELA FERRAMENTA. COMEÇA PELO PROBLEMA.",format:"Carrossel",status:"APROVADO",caption:"Problema → Processo → Dados → Solução → Tecnologia.",objective:"Autoridade e educação",script:"Carrossel aprovado com 9 slides.",cta:"Seguir →",hashtags:"#InteligenciaArtificial #Automacao #Gestao #Processos #Tecnologia #Negocios",notes:"Post #001 aprovado.",media_urls:[]}]};
let data={insights:[],contents:[]},client=null,currentUser=null,remoteReady=false,currentContentId=null;
const POST001={
 title:"IA NÃO COMEÇA PELA FERRAMENTA. COMEÇA PELO PROBLEMA.",
 objective:"Mostrar que IA e automação devem partir de um problema real de negócio, reforçando autoridade em tecnologia aplicada à gestão e processos.",
 format:"Carrossel",
 script:`Slide 1
IA NÃO COMEÇA PELA FERRAMENTA.
COMEÇA PELO PROBLEMA.

Tecnologia só faz sentido quando resolve algo real.

Slide 2
Talvez a pergunta esteja errada.

“Qual IA devo implementar na minha empresa?”

Antes da ferramenta, existem perguntas mais importantes.

Slide 3
Onde perdemos tempo?
Onde existe retrabalho?
Onde informações se perdem?
O que depende demais de trabalho manual?
O que poderia ser padronizado?

Slide 4
Existe uma ordem:

Problema → Processo → Dados → Solução → Tecnologia

Slide 5
Sem processo, a tecnologia não resolve.

Automatizar um processo ruim
só faz o problema acontecer mais rápido.

Slide 6
Com processo, a tecnologia libera o que importa:

- menos tarefas operacionais
- menos erros
- mais produtividade
- mais tempo para decidir
- mais foco no que gera valor

Slide 7
Na prática, isso pode gerar:

- redução de custos
- mais eficiência
- melhor entrega
- mais controle
- capacidade de escalar

Slide 8
Tecnologia não é moda.
É alavanca.

IA, automação e sistemas devem entrar quando resolvem um problema e geram valor real.

Slide 9
Construindo na prática.

Aqui vou compartilhar projetos, cases, aprendizados e aplicações reais de IA, automação e gestão.

Seguir →`,
 caption:`A pergunta não deveria ser apenas:

“Qual IA devo implementar na minha empresa?”

Antes da tecnologia, vem algo mais importante: entender o problema.

Onde existe retrabalho?
Onde perdemos tempo?
Onde informações se perdem?
O que ainda depende demais de trabalho manual?

A sequência que faz mais sentido é:

Problema → Processo → Dados → Solução → Tecnologia

Tecnologia não é o objetivo. É a alavanca.

É essa visão que quero compartilhar por aqui: projetos, aprendizados, aplicações e bastidores de soluções construídas na prática.`,
 cta:"Se esse assunto faz sentido para você, acompanhe os próximos conteúdos.",
 hashtags:"#InteligenciaArtificial #Automacao #Gestao #Processos #Tecnologia #Negocios",
 notes:"Manter a identidade aprovada: fundo preto/navy, tipografia branca forte, detalhes em azul, visual limpo e profissional. Pouco texto por bloco, bastante contraste, sem aparência genérica de post de IA. Slide 1 pode usar sua imagem; demais slides priorizam processo, operação, tecnologia e ambiente empresarial."
};

const $=id=>document.getElementById(id);
function esc(v=""){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function saveLocal(){localStorage.setItem("lifeos-content",JSON.stringify(data));render()}
function badge(s){return `<span class="badge ${["APROVADO","PUBLICADO"].includes(s)?"ok":""}">${esc(s)}</span>`}
function go(id){document.querySelectorAll(".section").forEach(x=>x.classList.remove("active"));$(id).classList.add("active");document.querySelectorAll("nav button").forEach(x=>x.classList.toggle("active",x.dataset.id===id));$("title").textContent=pages[id][0];$("desc").textContent=pages[id][1]}
$("nav").innerHTML=Object.keys(pages).map((p,i)=>`<button data-id="${p}" class="${i===0?"active":""}" onclick="go('${p}')"><span class="dot"></span>${labels[p]}</button>`).join("");

function render(){
 $("metrics").innerHTML=[["Insights",data.insights.length],["Em produção",data.contents.filter(x=>!["APROVADO","PUBLICADO"].includes(x.status)).length],["Aguardando aprovação",data.contents.filter(x=>x.status==="AGUARDANDO_APROVACAO").length],["Aprovados",data.contents.filter(x=>x.status==="APROVADO").length]].map(x=>`<div class="card metric"><span class="muted">${x[0]}</span><b>${x[1]}</b></div>`).join("");
 $("queue").innerHTML=data.contents.length?data.contents.map(x=>`<div class="item"><div><b>${esc(x.title)}</b><div class="muted">${esc(x.format||"")}</div></div>${badge(x.status)}</div>`).join(""):'<div class="empty">Fila vazia</div>';
 $("insightList").innerHTML=data.insights.length?data.insights.map(x=>`<div class="item"><div><b>${esc(x.title)}</b><div class="muted">${esc(x.source||"Outro")} • ${esc(x.body||"")}</div></div><div class="toolbar">${badge(x.status)}${x.status==="INSIGHT"?`<button class="btn ghost" onclick="promote('${x.id}')">Virar pauta</button>`:""}</div></div>`).join(""):'<div class="empty">Nenhum insight capturado.</div>';
 $("contentList").innerHTML=data.contents.length?data.contents.map(x=>`<div class="item"><div><b>${esc(x.title)}</b><div class="muted">${esc(x.format||"A definir")} • ${esc(x.caption||"")}</div></div><div class="toolbar">${badge(x.status)}<button class="btn ghost" onclick="openEditor('${x.id}')">Abrir editor</button>${x.status==="DRAFT"?`<button class="btn" onclick="requestApproval('${x.id}')">Enviar p/ aprovação</button>`:""}</div></div>`).join(""):'<div class="empty">Nenhum conteúdo.</div>';
 const waiting=data.contents.filter(x=>x.status==="AGUARDANDO_APROVACAO");
 $("approvalList").innerHTML=waiting.length?waiting.map(x=>`<div class="item"><div><b>${esc(x.title)}</b><div class="muted">${esc(x.format||"")}</div></div><div class="toolbar"><button class="btn ghost" onclick="openEditor('${x.id}')">Revisar</button><button class="btn" onclick="approve('${x.id}')">APROVAR</button><button class="btn danger" onclick="reject('${x.id}')">ALTERAR</button></div></div>`).join(""):'<div class="empty">Nenhum conteúdo aguardando aprovação.</div>';
 $("calendarGrid").innerHTML=Array.from({length:14},(_,i)=>{let d=new Date();d.setDate(d.getDate()+i);let key=d.toISOString().slice(0,10);let ev=data.contents.filter(x=>(x.scheduled_at||"").slice(0,10)===key);return `<div class="day"><b>${d.toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})}</b>${ev.map(e=>`<div class="event">${esc(e.title)}</div>`).join("")}</div>`}).join("");
}

function openInsight(){$("modal").classList.add("open")} function closeModal(){$("modal").classList.remove("open")}
function openAuth(){$("authModal").classList.add("open")} function closeAuth(){$("authModal").classList.remove("open")}
function closeEditor(){$("editorModal").classList.remove("open");currentContentId=null}
function openEditor(id){
 const c=data.contents.find(x=>String(x.id)===String(id)); if(!c)return;
 currentContentId=id;
 const isPost001=(c.title||"").trim().toUpperCase()===POST001.title;
 const val=(field)=>isPost001?(c[field]||POST001[field]||""):(c[field]||"");
 $("eTitle").value=c.title||"";
 $("eFormat").value=isPost001?POST001.format:(["Carrossel","Reel","Post estático","Story","A definir"].includes(c.format)?c.format:"A definir");
 $("eObjective").value=val("objective");
 $("eScript").value=val("script");
 $("eCaption").value=val("caption");
 $("eCta").value=val("cta");
 $("eHashtags").value=val("hashtags");
 $("eNotes").value=val("notes");
 $("editorModal").classList.add("open");
}
function editorPayload(){return {title:$("eTitle").value.trim(),format:$("eFormat").value,objective:$("eObjective").value.trim(),script:$("eScript").value.trim(),caption:$("eCaption").value.trim(),cta:$("eCta").value.trim(),hashtags:$("eHashtags").value.trim(),notes:$("eNotes").value.trim()}}

async function saveEditor(){
 if(!currentContentId)return;
 const payload=editorPayload(); if(!payload.title)return alert("Informe um título.");
 if(remoteReady){const {data:r,error}=await client.from("contents").update(payload).eq("id",currentContentId).select().single();if(error)return alert("Erro ao salvar editor: "+error.message);const ix=data.contents.findIndex(x=>x.id===currentContentId);data.contents[ix]=r}
 else Object.assign(data.contents.find(x=>x.id===currentContentId),payload);
 saveLocal();closeEditor();
}
async function sendEditorApproval(){await saveEditor();if(currentContentId)return;const c=data.contents.find(x=>x.title===$("eTitle").value.trim());if(c)await requestApproval(c.id)}
async function copyGenerationBrief(){
 const c=data.contents.find(x=>String(x.id)===String(currentContentId)); if(!c)return;
 const insight=data.insights.find(i=>i.id===c.insight_id);
 const prompt=`LIFE OS Content Agent — gere um conteúdo profissional para o Instagram de Luiz Andrade.

Posicionamento: IA, automação e gestão aplicadas a problemas reais de empresas.
Narrativa: aprender → aplicar → construir → medir → compartilhar.
Tom: profissional, natural, direto, sem linguagem de guru.
Identidade visual: preto/navy, branco e azul.

Pauta: ${c.title}
Insight de origem: ${insight?.body||c.caption||""}
Formato sugerido: ${c.format||"A definir"}

Entregue:
1) título final;
2) objetivo;
3) roteiro completo (se carrossel, slide por slide; se Reel, roteiro por cenas);
4) legenda;
5) CTA natural;
6) hashtags relevantes;
7) observações de visual.`;
 try{await navigator.clipboard.writeText(prompt);alert("Briefing copiado. Cole no ChatGPT para gerar o conteúdo e depois volte ao editor para salvar.")}catch{alert(prompt)}
}

async function saveInsight(){
 const title=$("iTitle").value.trim(); if(!title)return alert("Digite um título.");
 const row={title,body:$("iBody").value.trim(),source:$("iSource").value,status:"INSIGHT"};
 const {data:r,error}=await client.from("insights").insert({...row,user_id:currentUser.id}).select().single(); if(error)return alert("Erro ao salvar: "+error.message);
 data.insights.unshift(r);$("iTitle").value="";$("iBody").value="";closeModal();saveLocal();go("insights");
}
async function promote(id){
 const i=data.insights.find(x=>String(x.id)===String(id)); if(!i)return;
 let {error:e1}=await client.from("insights").update({status:"PAUTA"}).eq("id",id); if(e1)return alert(e1.message);
 let {data:c,error:e2}=await client.from("contents").insert({user_id:currentUser.id,insight_id:id,title:i.title,format:"A definir",status:"DRAFT",caption:i.body||""}).select().single(); if(e2)return alert(e2.message);
 i.status="PAUTA";data.contents.unshift(c);saveLocal();go("contents");openEditor(c.id);
}
async function setStatus(id,status){const c=data.contents.find(x=>String(x.id)===String(id));if(!c)return;const {data:r,error}=await client.from("contents").update({status}).eq("id",id).select().single();if(error)return alert(error.message);Object.assign(c,r);saveLocal()}
async function requestApproval(id){await setStatus(id,"AGUARDANDO_APROVACAO");go("approval")}
async function approve(id){await setStatus(id,"APROVADO")}
async function reject(id){await setStatus(id,"DRAFT");go("contents")}

async function initSupabase(){
 try{const cfg=window.LIFE_OS_CONFIG;if(!cfg||!window.supabase)return setDbState("LOCAL","Supabase não carregado");client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);const {data:{session}}=await client.auth.getSession();currentUser=session?.user||null;client.auth.onAuthStateChange(async(_event,session)=>{currentUser=session?.user||null;await refreshRemote()});await refreshRemote()}catch(e){setDbState("LOCAL","Falha de conexão");console.error(e)}
}
async function refreshRemote(){
 if(!currentUser){remoteReady=false;data={insights:[],contents:[]};setDbState("OFFLINE","Faça login");renderAuth();render();return}
 const [{data:ins,error:ei},{data:con,error:ec}]=await Promise.all([client.from("insights").select("*").order("created_at",{ascending:false}),client.from("contents").select("*").order("created_at",{ascending:false})]);
 if(ei||ec){remoteReady=false;setDbState("CONFIGURAR","Execute a migração v0.5");renderAuth();return}
 remoteReady=true;data={insights:ins||[],contents:con||[]};localStorage.setItem("lifeos-content",JSON.stringify(data));setDbState("ONLINE","Supabase sincronizado");renderAuth();render();
}
function setDbState(state,msg){$("dbState").textContent=state;$("dbState").className="badge "+(state==="ONLINE"?"ok":"");$("dbHint").textContent=msg}
function renderAuth(){$("authBtn").textContent=currentUser?"Conta":"Entrar";$("authInfo").textContent=currentUser?currentUser.email:"Sem login";$("logoutBtn").style.display=currentUser?"block":"none";$("loginGate").style.display=currentUser?"none":"grid";$("appShell").classList.toggle("auth-hidden",!currentUser)}
async function signIn(){const email=$("authEmail").value.trim(),password=$("authPassword").value;if(!email||!password)return alert("Informe e-mail e senha.");const {error}=await client.auth.signInWithPassword({email,password});if(error)return alert(error.message);closeAuth()}
async function signOut(){if(client)await client.auth.signOut();currentUser=null;remoteReady=false;data={insights:[],contents:[]};localStorage.removeItem("lifeos-content");setDbState("OFFLINE","Faça login");renderAuth();render()}
render();initSupabase();
