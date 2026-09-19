const pages={dashboard:["Dashboard","Visão geral do seu sistema de conteúdo."],insights:["Inbox de Insights","Capture ideias antes que elas se percam."],contents:["Conteúdos","Acompanhe a produção editorial."],approval:["Aprovação","Controle humano antes de qualquer publicação."],calendar:["Calendário","Planejamento editorial e agendamentos."],analytics:["Métricas","Resultados e aprendizado do agente."],instagram:["Instagram","Conexão e publicação automática."],rules:["Regras Editoriais","A identidade que orienta o agente."]};
const labels={dashboard:"Dashboard",insights:"Insights",contents:"Conteúdos",approval:"Aprovação",calendar:"Calendário",analytics:"Métricas",instagram:"Instagram",rules:"Regras"};
const seed={insights:[{title:"Autoridade sem entregar toda a execução",body:"Mostrar domínio do problema, explicar o que e por quê, usar cases e complexidade.",source:"Estudo",status:"INSIGHT"}],contents:[{title:"IA NÃO COMEÇA PELA FERRAMENTA. COMEÇA PELO PROBLEMA.",format:"Carrossel",status:"APROVADO",caption:"Problema → Processo → Dados → Solução → Tecnologia.",objective:"Autoridade e educação",script:"Carrossel aprovado com 9 slides.",cta:"Seguir →",hashtags:"#InteligenciaArtificial #Automacao #Gestao #Processos #Tecnologia #Negocios",notes:"Post #001 aprovado.",media_urls:["https://xibmedokistlntbaoxen.supabase.co/storage/v1/object/public/instagram-posts/post-001/Post_001_slide_01.jpg","https://xibmedokistlntbaoxen.supabase.co/storage/v1/object/public/instagram-posts/post-001/Post_001_slide_02.jpg","https://xibmedokistlntbaoxen.supabase.co/storage/v1/object/public/instagram-posts/post-001/Post_001_slide_03.jpg","https://xibmedokistlntbaoxen.supabase.co/storage/v1/object/public/instagram-posts/post-001/Post_001_slide_04.jpg","https://xibmedokistlntbaoxen.supabase.co/storage/v1/object/public/instagram-posts/post-001/Post_001_slide_05.jpg","https://xibmedokistlntbaoxen.supabase.co/storage/v1/object/public/instagram-posts/post-001/Post_001_slide_06.jpg","https://xibmedokistlntbaoxen.supabase.co/storage/v1/object/public/instagram-posts/post-001/Post_001_slide_07.jpg","https://xibmedokistlntbaoxen.supabase.co/storage/v1/object/public/instagram-posts/post-001/Post_001_slide_08.jpg","https://xibmedokistlntbaoxen.supabase.co/storage/v1/object/public/instagram-posts/post-001/Post_001_slide_09.jpg"]}]};
let data={insights:[],contents:[]},client=null,currentUser=null,remoteReady=false,currentContentId=null,currentMediaUrls=[];
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

function visualStage(c){
 const t=c.text_approved?'<span class="stage ok">✓ TEXTO</span>':'<span class="stage pending">TEXTO PENDENTE</span>';
 const v=c.visual_approved?'<span class="stage ok">✓ VISUAL</span>':'<span class="stage pending">VISUAL PENDENTE</span>';
 return t+v;
}
function approvalCard(c){
 const urls=Array.isArray(c.media_urls)?c.media_urls:[];
 const first=urls[0]||"";
 const thumbs=urls.map((u,i)=>`<div class="slide-thumb ${i===0?"active":""}" onclick="showApprovalSlide('${c.id}',${i},this)"><img src="${esc(u)}" alt="Slide ${i+1}"></div>`).join("");
 const textAction=!c.text_approved?`<button class="btn" onclick="approveText('${c.id}')">Aprovar texto</button>`:"";
 const visualActions=c.text_approved&&urls.length? `
   <button class="btn ghost" onclick="regenerateVisual('${c.id}')">Regenerar visual</button>
   <button class="btn" onclick="approveVisual('${c.id}')">Aprovar slides</button>
   <button class="btn danger" onclick="requestVisualChanges('${c.id}')">Solicitar ajuste</button>`:"";
 const publish=c.text_approved===true&&c.visual_approved===true&&c.status==="APROVADO"?`<button class="btn" onclick="publishInstagram('${c.id}')">Publicar no Instagram</button>`:"";
 return `<div class="approval-card">
   <div class="approval-head"><div><b>${esc(c.title)}</b><div class="muted">${esc(c.format||"")}</div><div class="approval-stages">${visualStage(c)}</div></div>${badge(c.status)}</div>
   ${urls.length?`<div class="format-strip"><span class="format-chip">INSTAGRAM FEED</span><span class="format-chip">3:4</span><span class="format-chip">1080×1440 px</span><span id="formatCheck_${c.id}" class="format-chip">VALIDANDO...</span></div><div class="slide-preview"><div class="slide-frame"><div class="slide-hero"><img id="approvalHero_${c.id}" src="${esc(first)}" alt="Preview" onload="validateApprovalFormat(\'${c.id}\',this)"></div></div><div class="slide-thumbs">${thumbs}</div></div>`:'<div class="empty">As mídias serão geradas automaticamente após a aprovação do texto.</div>'}
   <div class="approval-notes"><textarea id="approvalNote_${c.id}" placeholder="O que precisa mudar? Ex.: mais parecido com o Post #001, menos texto, mais contraste...">${esc(c.approval_notes||"")}</textarea></div>
   <div class="toolbar" style="margin-top:12px"><button class="btn ghost" onclick="openEditor('${c.id}')">Revisar conteúdo</button>${textAction}${visualActions}${publish}</div>
 </div>`;
}
function render(){
 $("metrics").innerHTML=[
   ["Insights",data.insights.length],
   ["Em produção",data.contents.filter(x=>!["APROVADO","PUBLICADO"].includes(x.status)).length],
   ["Aguardando aprovação",data.contents.filter(x=>["AGUARDANDO_APROVACAO","PENDING_VISUAL_APPROVAL","NEEDS_CHANGES"].includes(x.status)).length],
   ["Prontos para publicar",data.contents.filter(x=>x.status==="APROVADO"&&x.text_approved&&x.visual_approved).length]
 ].map(x=>`<div class="card metric"><span class="muted">${x[0]}</span><b>${x[1]}</b></div>`).join("");
 $("queue").innerHTML=data.contents.length?data.contents.map(x=>`<div class="item"><div><b>${esc(x.title)}</b><div class="muted">${esc(x.format||"")}</div><div class="approval-stages">${visualStage(x)}</div></div>${badge(x.status)}</div>`).join(""):'<div class="empty">Fila vazia</div>';
 $("insightList").innerHTML=data.insights.length?data.insights.map(x=>`<div class="item"><div><b>${esc(x.title)}</b><div class="muted">${esc(x.source||"Outro")} • ${esc(x.body||"")}</div></div><div class="toolbar">${badge(x.status)}${x.status==="INSIGHT"?`<button class="btn ghost" onclick="promote('${x.id}')">Virar pauta</button>`:""}</div></div>`).join(""):'<div class="empty">Nenhum insight capturado.</div>';
 $("contentList").innerHTML=data.contents.length?data.contents.map(x=>`<div class="item"><div><b>${esc(x.title)}</b><div class="muted">${esc(x.format||"A definir")} • ${Array.isArray(x.media_urls)?x.media_urls.length:0} mídia(s)</div><div class="approval-stages">${visualStage(x)}</div></div><div class="toolbar">${badge(x.status)}<button class="btn ghost" onclick="openEditor('${x.id}')">Abrir editor</button><button class="btn ghost" onclick="go('approval')">Ver aprovação</button>${x.status==="DRAFT"?`<button class="btn" onclick="requestApproval('${x.id}')">Enviar p/ aprovação</button>`:""}</div></div>`).join(""):'<div class="empty">Nenhum conteúdo.</div>';
 const waiting=data.contents.filter(x=>!["PUBLICADO","ANALISADO","DESCARTADO"].includes(x.status));
 $("approvalList").innerHTML=waiting.length?waiting.map(approvalCard).join(""):'<div class="empty">Nenhum conteúdo aguardando aprovação.</div>';
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
 currentMediaUrls=Array.isArray(c.media_urls)?[...c.media_urls]:[];
 $("eMediaFiles").value="";
 $("eMediaStatus").textContent=currentMediaUrls.length?`${currentMediaUrls.length} mídia(s) carregada(s).`:"Nenhuma mídia carregada.";
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
async function sendEditorApproval(){
 if(!currentContentId)return;
 const id=currentContentId;
 const payload=editorPayload(); if(!payload.title)return alert("Informe um título.");
 if(remoteReady){const {data:r,error}=await client.from("contents").update(payload).eq("id",id).select().single();if(error)return alert("Erro ao salvar editor: "+error.message);const ix=data.contents.findIndex(x=>String(x.id)===String(id));if(ix>=0)data.contents[ix]=r}
 await requestApproval(id);closeEditor();
}
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
async function approveText(id){
 const c=data.contents.find(x=>String(x.id)===String(id)); if(!c)return;
 const {data:r,error}=await client.from("contents").update({text_approved:true,text_approved_at:new Date().toISOString(),visual_approved:false,visual_approved_at:null,status:"PENDING_VISUAL_APPROVAL"}).eq("id",id).select().single();
 if(error)return alert(error.message);Object.assign(c,r);saveLocal();
 await autoGenerateCarouselMedia(id,{silent:true,force:true});
 await refreshRemote();go("approval");
}
async function approveVisual(id){
 const c=data.contents.find(x=>String(x.id)===String(id)); if(!c||!c.text_approved)return alert("Aprove o texto primeiro.");
 if(!Array.isArray(c.media_urls)||c.media_urls.length<2)return alert("Ainda não existem slides para aprovar.");
 const {data:r,error}=await client.from("contents").update({visual_approved:true,visual_approved_at:new Date().toISOString(),status:"APROVADO",approval_notes:""}).eq("id",id).select().single();
 if(error)return alert(error.message);Object.assign(c,r);saveLocal();go("approval");
}
async function requestVisualChanges(id){
 const note=$("approvalNote_"+id)?.value.trim();
 if(!note)return alert("Descreva o ajuste que você quer antes de solicitar a regeneração.");
 const c=data.contents.find(x=>String(x.id)===String(id)); if(!c)return;
 const {data:r,error}=await client.from("contents").update({
   visual_approved:false,
   visual_approved_at:null,
   status:"NEEDS_CHANGES",
   approval_notes:note
 }).eq("id",id).select().single();
 if(error)return alert(error.message);
 Object.assign(c,r);saveLocal();
 const ok=await autoGenerateCarouselMedia(id,{silent:true,force:true});
 if(!ok)return alert("O feedback foi salvo, mas houve um erro ao regenerar o visual. Corrigi o fluxo; tente novamente após atualizar a página.");
 const {data:r2,error:e2}=await client.from("contents").update({
   status:"PENDING_VISUAL_APPROVAL",
   visual_approved:false,
   visual_approved_at:null
 }).eq("id",id).select().single();
 if(!e2&&r2)Object.assign(c,r2);
 saveLocal();
 alert("Ajuste aplicado e novo visual gerado. Revise os slides.");
 go("approval");
}
async function regenerateVisual(id,afterFeedback=false){
 const ok=await autoGenerateCarouselMedia(id,{silent:true,force:true});
 if(!ok)return;
 const c=data.contents.find(x=>String(x.id)===String(id));
 const {data:r,error}=await client.from("contents").update({visual_approved:false,visual_approved_at:null,status:"PENDING_VISUAL_APPROVAL"}).eq("id",id).select().single();
 if(!error&&c)Object.assign(c,r);
 saveLocal();if(!afterFeedback)alert("Novo visual gerado usando o feedback salvo. Revise os slides abaixo.");
 go("approval");
}
function validateApprovalFormat(id,img){
 const chip=$("formatCheck_"+id);
 if(!chip||!img?.naturalWidth||!img?.naturalHeight)return;
 const w=img.naturalWidth,h=img.naturalHeight,ratio=w/h;
 const ok=Math.abs(ratio-(3/4))<0.001;
 chip.textContent=ok?`✓ ${w}×${h} VALIDADO`:`ERRO: ${w}×${h}`;
 chip.className="format-chip "+(ok?"ok":"err");
}
function showApprovalSlide(id,index,el){
 const c=data.contents.find(x=>String(x.id)===String(id)); if(!c)return;
 const url=(c.media_urls||[])[index]; if(!url)return;
 const hero=$("approvalHero_"+id);if(hero){hero.onload=()=>validateApprovalFormat(id,hero);hero.src=url;}
 if(el){el.parentElement.querySelectorAll(".slide-thumb").forEach(x=>x.classList.remove("active"));el.classList.add("active")}
}
async function reject(id){await setStatus(id,"DRAFT");go("contents")}


function splitCarouselSlides(script=""){
 const parts=String(script).split(/\n(?=Slide\s+\d+)/i).map(x=>x.trim()).filter(Boolean);
 return parts.map((part,i)=>{
   const lines=part.split(/\n/).map(x=>x.trim()).filter(Boolean);
   if(/^Slide\s+\d+/i.test(lines[0]||"")) lines.shift();
   return {number:i+1,lines};
 });
}
function wrapCanvasText(ctx,text,maxWidth){
 const words=String(text).split(/\s+/), lines=[]; let line="";
 for(const word of words){
   const test=line?line+" "+word:word;
   if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word}else line=test;
 }
 if(line)lines.push(line); return lines;
}
function roundRect(ctx,x,y,w,h,r,fill,stroke){
 ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}
}
function visualTuningFromFeedback(feedback=""){
 const f=String(feedback).toLowerCase();
 return {
   moreBreathing:/respiro|espaço|espacamento|espaçamento/.test(f),
   lessText:/menos texto|reduzir.*texto|mais limpo|mais legível|mais legivel/.test(f),
   moreContrast:/contraste|mais legível|mais legivel/.test(f),
   morePremium:/premium|executivo|sofisticado/.test(f),
   consistent:/consist|padroniz|blocos internos/.test(f)
 };
}
async function renderCarouselSlide(slide,total,title,feedback=""){
 const canvas=document.createElement("canvas");canvas.width=1080;canvas.height=1440;
 const ctx=canvas.getContext("2d");
 const bg=ctx.createLinearGradient(0,0,1080,1440);bg.addColorStop(0,"#05080d");bg.addColorStop(.58,"#0a1625");bg.addColorStop(1,"#08111c");ctx.fillStyle=bg;ctx.fillRect(0,0,1080,1440);

 const glow=ctx.createRadialGradient(910,180,0,910,180,430);glow.addColorStop(0,"rgba(27,132,255,.30)");glow.addColorStop(.55,"rgba(13,76,145,.12)");glow.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=glow;ctx.fillRect(430,0,650,650);

 const tune=visualTuningFromFeedback(feedback);

 // Brand fixa no topo
 ctx.fillStyle="#1788ff";ctx.fillRect(72,74,74,8);
 ctx.fillStyle="#f4f8ff";ctx.font="800 27px Arial";ctx.fillText("LUIZ ANDRADE",72,126);
 ctx.fillStyle=tune.moreContrast?"#a9b9cc":"#8091a6";ctx.font="19px Arial";ctx.fillText("IA • AUTOMAÇÃO • GESTÃO",72,160);

 let lines=[...(slide.lines||[])];
 const isCover=slide.number===1;
 if(tune.lessText&&!isCover&&lines.length>5) lines=lines.slice(0,5);

 // Área visual padronizada dos slides
 const cardX=68, cardY=225, cardW=944, cardH=860;
 if(!isCover){
   ctx.fillStyle="rgba(255,255,255,.025)";
   ctx.strokeStyle="#1f334a";ctx.lineWidth=1;
   ctx.beginPath();ctx.roundRect(cardX,cardY,cardW,cardH,26);ctx.fill();ctx.stroke();
 }

 if(isCover){
   ctx.fillStyle="#6cb8ff";ctx.font="800 20px Arial";ctx.fillText("PONTO DE VISTA",74,300);
   ctx.fillStyle="rgba(23,136,255,.08)";ctx.strokeStyle="#1f4a76";
   ctx.beginPath();ctx.roundRect(62,355,956,720,28);ctx.fill();ctx.stroke();
 }

 // Monta os blocos primeiro para calcular a altura real.
 const blocks=[];
 for(let i=0;i<lines.length;i++){
   const raw=lines[i];
   const bullet=/^-\s+/.test(raw);
   const short=raw.length<52;
   const isHeading=i===0 || (isCover&&i<=1) || (!bullet&&short&&i<2);

   if(bullet){
     ctx.font="500 30px Arial";
     const wrapped=wrapCanvasText(ctx,raw.replace(/^-\s+/,""),775);
     const height=Math.max(72,wrapped.length*42+22);
     blocks.push({type:"bullet",wrapped,height});
   } else {
     ctx.font=isHeading?(isCover?"900 72px Arial":"850 58px Arial"):"400 32px Arial";
     const max=isHeading?(tune.moreBreathing&&isCover?800:850):(tune.consistent?790:825);
     const wrapped=wrapCanvasText(ctx,raw,max);
     const lineH=isHeading?(isCover?82:68):46;
     const gap=isHeading?30:18;
     blocks.push({type:"text",wrapped,isHeading,lineH,gap,height:wrapped.length*lineH+gap});
   }
 }

 const totalHeight=blocks.reduce((sum,b)=>sum+b.height,0);

 // Capa mantém composição própria; slides internos centralizam verticalmente.
 let y;
 if(isCover){
   y=tune.moreBreathing?405:385;
 }else{
   const innerTop=cardY+70;
   const innerBottom=cardY+cardH-70;
   const innerH=innerBottom-innerTop;
   y=innerTop+Math.max(0,(innerH-totalHeight)/2);
 }

 for(const b of blocks){
   if(b.type==="bullet"){
     const boxY=y;
     const boxH=b.height;
     ctx.fillStyle="rgba(255,255,255,.035)";ctx.strokeStyle="#223b55";
     ctx.beginPath();ctx.roundRect(96,boxY,856,boxH,16);ctx.fill();ctx.stroke();

     ctx.fillStyle="#1788ff";ctx.beginPath();ctx.arc(125,boxY+boxH/2,7,0,Math.PI*2);ctx.fill();

     ctx.fillStyle=tune.moreContrast?"#eef5ff":"#dce7f5";
     ctx.font="500 30px Arial";
     let ty=boxY+36;
     for(const w of b.wrapped){ctx.fillText(w,155,ty);ty+=42}
     y+=boxH+18;
   }else{
     ctx.font=b.isHeading?(isCover?"900 72px Arial":"850 58px Arial"):"400 32px Arial";
     ctx.fillStyle=b.isHeading?"#ffffff":(tune.moreContrast?"#d8e3ef":"#bac9da");
     const x=isCover?92:104;
     let ty=y+b.lineH-10;
     for(const w of b.wrapped){ctx.fillText(w,x,ty);ty+=b.lineH}
     y+=b.height;
   }
 }

 // Rodapé fixo
 ctx.strokeStyle="#1b2d40";ctx.beginPath();ctx.moveTo(72,1270);ctx.lineTo(1008,1270);ctx.stroke();
 ctx.fillStyle="#1788ff";ctx.font="800 21px Arial";ctx.fillText(String(slide.number).padStart(2,"0"),72,1328);
 ctx.fillStyle="#5f7084";ctx.font="19px Arial";ctx.fillText("/ "+String(total).padStart(2,"0"),105,1328);
 ctx.fillStyle="#8fa0b4";ctx.font="19px Arial";ctx.textAlign="right";ctx.fillText("TECNOLOGIA APLICADA A PROBLEMAS REAIS",1008,1328);ctx.textAlign="left";

 return await new Promise(resolve=>canvas.toBlob(resolve,"image/jpeg",0.95));
}
async function autoGenerateCarouselMedia(id,{silent=false,force=false}={}){
 const c=data.contents.find(x=>String(x.id)===String(id)); if(!c||!currentUser)return false;
 if(c.format!=="Carrossel")return false;
 if(!force&&Array.isArray(c.media_urls)&&c.media_urls.length>=2)return true;
 const slides=splitCarouselSlides(c.script||"");
 if(slides.length<2){if(!silent)alert("O roteiro precisa estar dividido em Slide 1, Slide 2...");return false}
 try{
   if(!silent)alert("O LIFE OS vai gerar e enviar as mídias automaticamente.");
   const urls=[];
   for(let i=0;i<slides.length;i++){
     const blob=await renderCarouselSlide(slides[i],slides.length,c.title,c.approval_notes||"");
     if(!blob)throw new Error("Falha ao gerar slide "+(i+1));
     const path=`${currentUser.id}/${c.id}/visual_v6_centered_slide_${String(i+1).padStart(2,"0")}.jpg`;
     const {error}=await client.storage.from("instagram-posts").upload(path,blob,{upsert:true,contentType:"image/jpeg"});
     if(error)throw error;
     const {data:pub}=client.storage.from("instagram-posts").getPublicUrl(path);
     urls.push(pub.publicUrl);
   }
   const {data:r,error}=await client.from("contents").update({media_urls:urls,publish_error:null,template_key:"luiz_andrade_v6_centered",visual_approved:false,visual_approved_at:null}).eq("id",c.id).select().single();
   if(error)throw error;
   Object.assign(c,r);saveLocal();
   if(currentContentId===c.id){currentMediaUrls=urls;$("eMediaStatus").textContent=`${urls.length} mídia(s) gerada(s) automaticamente.`}
   return true;
 }catch(e){
   await client.from("contents").update({publish_error:"Falha ao gerar mídias: "+e.message}).eq("id",c.id);
   if(!silent)alert("Falha ao gerar mídias automaticamente: "+e.message);
   return false;
 }
}
async function ensureApprovedMedia(){
 const pending=data.contents.filter(c=>c.text_approved&&c.format==="Carrossel"&&!c.visual_approved&&(["PENDING_VISUAL_APPROVAL","NEEDS_CHANGES"].includes(c.status))&&(!Array.isArray(c.media_urls)||c.media_urls.length<2||!(c.media_urls[0]||"").includes("visual_v6_centered_slide_")));
 for(const c of pending)await autoGenerateCarouselMedia(c.id,{silent:true,force:true});
 render();
}

async function uploadEditorMedia(){
 if(!currentContentId||!currentUser)return alert("Abra um conteúdo antes de enviar imagens.");
 const files=Array.from($("eMediaFiles").files||[]);
 if(!files.length)return alert("Selecione uma ou mais imagens.");
 $("eMediaStatus").textContent="Enviando imagens...";
 const urls=[];
 for(let i=0;i<files.length;i++){
   const file=files[i];
   const ext=(file.name.split(".").pop()||"jpg").toLowerCase();
   const filename=`slide_${String(i+1).padStart(2,"0")}.${ext}`;
   const path=`${currentUser.id}/${currentContentId}/${filename}`;
   const {error}=await client.storage.from("instagram-posts").upload(path,file,{upsert:true,contentType:file.type||undefined});
   if(error){$("eMediaStatus").textContent="Erro no upload.";return alert("Erro ao enviar "+file.name+": "+error.message)}
   const {data:pub}=client.storage.from("instagram-posts").getPublicUrl(path);
   urls.push(pub.publicUrl);
 }
 const {data:r,error}=await client.from("contents").update({media_urls:urls}).eq("id",currentContentId).select().single();
 if(error)return alert("Imagens enviadas, mas não consegui salvar as URLs: "+error.message);
 const ix=data.contents.findIndex(x=>String(x.id)===String(currentContentId)); if(ix>=0)data.contents[ix]=r;
 currentMediaUrls=urls;
 $("eMediaStatus").textContent=`${urls.length} mídia(s) carregada(s) e pronta(s) para publicação.`;
 $("eMediaFiles").value="";
 saveLocal();
}

async function invokeInstagram(body){
 const {data:sessionData}=await client.auth.getSession();
 if(!sessionData.session)throw new Error("Sessão expirada. Entre novamente.");
 const {data,error}=await client.functions.invoke("instagram-publisher",{body});
 if(error)throw error;
 if(data?.error)throw new Error(data.error);
 return data;
}
async function refreshInstagramStatus(){
 if(!currentUser)return;
 try{
   const r=await invokeInstagram({action:"status"});
   $("igBadge").textContent=r.connected?"CONECTADO":"DESCONECTADO";
   $("igBadge").className="badge "+(r.connected?"ok":"");
   $("igConnected").innerHTML=r.connected?`<div class="item"><div><b>@${esc(r.username||"")}</b><div class="muted">Conta pronta para publicar • API ${esc(r.api_version||"")}</div></div><span class="badge ok">ATIVA</span></div>`:'<div class="empty">Instagram ainda não conectado.</div>';
 }catch(e){
   $("igBadge").textContent="DESCONECTADO";$("igBadge").className="badge";
   $("igConnected").innerHTML='<div class="empty">Instagram ainda não conectado.</div>';
 }
}
async function connectInstagram(){
 const token=$("igToken").value.trim(); if(!token)return alert("Cole o token de acesso gerado pela Meta.");
 $("igBadge").textContent="CONECTANDO...";
 try{
   const r=await invokeInstagram({action:"connect",token,api_version:"v24.0"});
   $("igToken").value="";
   alert("Instagram conectado: @"+(r.username||""));
   await refreshInstagramStatus();
 }catch(e){alert("Erro ao conectar Instagram: "+e.message);await refreshInstagramStatus()}
}
async function publishInstagram(id){
 const c=data.contents.find(x=>String(x.id)===String(id)); if(!c)return;
 const qty=Array.isArray(c.media_urls)?c.media_urls.length:0;
 if(!c.text_approved||!c.visual_approved||c.status!=="APROVADO")return alert("A publicação só é liberada após aprovação do texto e dos slides.");
 if(qty<2)return alert("Ainda não existem mídias suficientes para publicar o carrossel.");
 if(!confirm(`Publicar agora "${c.title}" no Instagram com ${qty} imagens? Esta ação tornará o post público.`))return;
 try{
   await setStatus(id,"APROVADO");
   const r=await invokeInstagram({action:"publish",content_id:id});
   const ix=data.contents.findIndex(x=>String(x.id)===String(id));
   if(ix>=0){data.contents[ix].status="PUBLICADO";data.contents[ix].instagram_media_id=r.media_id;data.contents[ix].instagram_published_at=new Date().toISOString()}
   saveLocal();
   alert("Publicado no Instagram com sucesso.");
 }catch(e){
   await client.from("contents").update({publish_error:e.message}).eq("id",id);
   alert("Erro ao publicar: "+e.message);
 }
}

async function initSupabase(){
 try{const cfg=window.LIFE_OS_CONFIG;if(!cfg||!window.supabase)return setDbState("LOCAL","Supabase não carregado");client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);const {data:{session}}=await client.auth.getSession();currentUser=session?.user||null;client.auth.onAuthStateChange(async(_event,session)=>{currentUser=session?.user||null;await refreshRemote()});await refreshRemote()}catch(e){setDbState("LOCAL","Falha de conexão");console.error(e)}
}
async function refreshRemote(){
 if(!currentUser){remoteReady=false;data={insights:[],contents:[]};setDbState("OFFLINE","Faça login");renderAuth();render();return}
 const [{data:ins,error:ei},{data:con,error:ec}]=await Promise.all([client.from("insights").select("*").order("created_at",{ascending:false}),client.from("contents").select("*").order("created_at",{ascending:false})]);
 if(ei||ec){remoteReady=false;setDbState("CONFIGURAR","Execute a migração v0.5");renderAuth();return}
 remoteReady=true;data={insights:ins||[],contents:con||[]};localStorage.setItem("lifeos-content",JSON.stringify(data));setDbState("ONLINE","Supabase sincronizado");renderAuth();render();await refreshInstagramStatus();await ensureApprovedMedia();
}
function setDbState(state,msg){$("dbState").textContent=state;$("dbState").className="badge "+(state==="ONLINE"?"ok":"");$("dbHint").textContent=msg}
function renderAuth(){$("authBtn").textContent=currentUser?"Conta":"Entrar";$("authInfo").textContent=currentUser?currentUser.email:"Sem login";$("logoutBtn").style.display=currentUser?"block":"none";$("loginGate").style.display=currentUser?"none":"grid";$("appShell").classList.toggle("auth-hidden",!currentUser)}
async function signIn(){const email=$("authEmail").value.trim(),password=$("authPassword").value;if(!email||!password)return alert("Informe e-mail e senha.");const {error}=await client.auth.signInWithPassword({email,password});if(error)return alert(error.message);closeAuth()}
async function signOut(){if(client)await client.auth.signOut();currentUser=null;remoteReady=false;data={insights:[],contents:[]};localStorage.removeItem("lifeos-content");setDbState("OFFLINE","Faça login");renderAuth();render()}
render();initSupabase();
