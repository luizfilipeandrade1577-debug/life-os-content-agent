const cfg=window.LIFE_OS_CONFIG;
const sb=supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
let user=null,agents=[],tasks=[],approvals=[],events=[],leads=[],memories=[],projects=[],selectedSector="direcao";

const SECTORS={
 direcao:{title:"CEO / Direção / Jurídico",desc:"Estratégia, decisões, governança, contratos, riscos e coordenação do cérebro empresarial."},
 comercial:{title:"Comercial & Receita",desc:"Prospecção, qualificação, vendas, propostas, pipeline e geração de receita."},
 operacoes:{title:"Engenharia & Operações",desc:"Diagnóstico, automações, agentes, sistemas, projetos e construção das soluções."},
 financeiro:{title:"Financeiro",desc:"Receitas, custos, cobranças, margem e previsibilidade."},
 cs:{title:"Cliente",desc:"Onboarding, relacionamento, suporte, retenção, feedback e expansão."},
 marketing:{title:"Growth",desc:"Conteúdo, autoridade, distribuição, aquisição, experimentos e geração de demanda."}
};

const DEFAULT_AGENTS=[
 ["CEO Copilot","Direção estratégica","direcao","Organiza prioridades, sintetiza dados e prepara decisões."],
 ["SDR AI","Prospecção & Pesquisa","comercial","Pesquisa empresas, decisores, sinais de dor e oportunidades."],
 ["Sales AI","Qualificação & Vendas","comercial","Estrutura diagnóstico, qualificação e próximos passos comerciais."],
 ["Proposal AI","Propostas & Orçamentos","comercial","Transforma diagnóstico em escopo, proposta e condições comerciais."],
 ["Process Analyst","Analista de Processos","operacoes","Mapeia perda de dados, gargalos e oportunidades de automação."],
 ["Project Manager AI","Gestor de Projetos","operacoes","Organiza entregas, prioridades, riscos e acompanhamento."],
 ["Builder AI","Automação & Sistemas","operacoes","Executa especificações de sistemas, agentes, integrações e automações."],
 ["Finance AI","Financeiro","financeiro","Acompanha caixa, cobranças, custos, margem e recorrência."],
 ["CS AI","Customer Success","cs","Acompanha clientes, pendências, satisfação e oportunidades de expansão."],
 ["Content AI","Marketing & Conteúdo","marketing","Transforma projetos, aprendizados e cases em conteúdo e demanda."]
];

async function auth(){
 const {data:{session}}=await sb.auth.getSession();
 if(session){user=session.user;boot();return}
 loginBtn.onclick=async()=>{const email=prompt("E-mail do LIFE OS");if(!email)return;const password=prompt("Senha");if(!password)return;const {error}=await sb.auth.signInWithPassword({email,password});if(error)return alert(error.message);user=(await sb.auth.getUser()).data.user;boot()}
}

async function seedAgents(){
 const {data}=await sb.from("business_agents").select("*").eq("user_id",user.id);
 if(data?.length){agents=data;return}
 const rows=DEFAULT_AGENTS.map((a,i)=>({user_id:user.id,name:a[0],role:a[1],sector:a[2],description:a[3],status:i===0?"active":"standby",sort_order:i,model_provider:"openai"}));
 const {data:created,error}=await sb.from("business_agents").insert(rows).select();
 if(error)throw error;agents=created||[];
 await sb.from("business_events").insert({user_id:user.id,event_type:"system",title:"Business Brain iniciado",detail:"Estrutura inicial de setores e agentes criada."});
}


async function seedKnowledge(){
 const {data:m}=await sb.from("business_memory").select("id").limit(1);
 if(!m?.length){
  await sb.from("business_memory").insert([
   {user_id:user.id,category:"strategy",title:"Posicionamento",content:"Transformamos informações soltas em processos inteligentes.",tags:["posicionamento","marca"],importance:5},
   {user_id:user.id,category:"strategy",title:"Resultado para o cliente",content:"Informação centralizada, processos mais eficientes, equipes mais produtivas e decisões mais assertivas.",tags:["resultado","proposta de valor"],importance:5},
   {user_id:user.id,category:"offer",title:"Oferta inicial",content:"Automação inteligente de atendimento e processos baseados em WhatsApp, com foco inicial em RH, contabilidade e consultorias.",tags:["whatsapp","automacao","oferta"],importance:5},
   {user_id:user.id,category:"sales",title:"ICP inicial",content:"Empresas de RH e recrutamento, escritórios de contabilidade e consultorias B2B com alto volume de atendimento e informações dispersas.",tags:["icp","rh","contabilidade","consultoria"],importance:5},
   {user_id:user.id,category:"process",title:"Regra de aprovação",content:"IA prepara → Luiz aprova → sistema executa. Ações externas críticas não devem ser disparadas sem aprovação humana no início.",tags:["governanca","aprovacao"],importance:5}
  ]);
 }
 const {data:p}=await sb.from("business_projects").select("id").limit(1);
 if(!p?.length){
  await sb.from("business_projects").insert({user_id:user.id,name:"Case #001 — REFRIFLOW",client_name:"Projeto interno / case",objective:"Documentar o REFRIFLOW como primeiro case real de transformação de informações soltas em processo inteligente.",status:"active",priority:"high"});
 }
}

async function boot(){
 gate.style.display="none";shell.style.display="grid";
 await seedAgents();await seedKnowledge();wireBrain();await refreshAll();selectSector("direcao");
}

async function refreshAll(){
 const [t,a,e,l,g,m,p]=await Promise.all([
  sb.from("business_tasks").select("*").order("created_at",{ascending:false}).limit(50),
  sb.from("business_approvals").select("*").order("created_at",{ascending:false}).limit(30),
  sb.from("business_events").select("*").order("created_at",{ascending:false}).limit(30),
  sb.from("business_leads").select("*").order("created_at",{ascending:false}).limit(100),
  sb.from("business_agents").select("*").order("sort_order"),
  sb.from("business_memory").select("*").order("importance",{ascending:false}).order("updated_at",{ascending:false}).limit(50),
  sb.from("business_projects").select("*").order("updated_at",{ascending:false}).limit(30)
 ]);
 tasks=t.data||[];approvals=a.data||[];events=e.data||[];leads=l.data||[];agents=g.data||agents;memories=m.data||[];projects=p.data||[];
 renderMetrics();renderTasks();renderApprovals();renderEvents();renderAgents();renderMemories();renderProjects();fillAgentSelect();fillProjectSelect();
}

function renderMetrics(){
 mAgents.textContent=agents.length;
 mDoing.textContent=tasks.filter(t=>t.status==="doing").length;
 mApprovals.textContent=approvals.filter(a=>a.status==="pending").length;
 mLeads.textContent=leads.filter(l=>!["won","lost"].includes(l.stage)).length;
 mMemories.textContent=memories.length;
 mProjects.textContent=projects.filter(p=>["planning","active","waiting"].includes(p.status)).length;
}

function wireBrain(){document.querySelectorAll(".node").forEach(n=>n.onclick=()=>selectSector(n.dataset.sector))}
function selectSector(sector){
 selectedSector=sector;
 document.querySelectorAll(".node").forEach(n=>n.classList.toggle("selected",n.dataset.sector===sector));
 sectorTitle.textContent=SECTORS[sector]?.title||sector;sectorDesc.textContent=SECTORS[sector]?.desc||"";
 renderAgents();
}
function statusLabel(s){return s==="active"?"ATIVO":s==="waiting"?"AGUARDANDO":s==="offline"?"OFFLINE":"STANDBY"}
function renderAgents(){
 const list=agents.filter(a=>a.sector===selectedSector);
 agentList.innerHTML=list.length?list.map(a=>'<div class="agent"><div class="agent-head"><div><div class="agent-role">'+a.name+'</div><div class="muted">'+a.role+'</div></div><span class="badge '+(a.status==="active"?"ok":"")+'">'+statusLabel(a.status)+'</span></div><div class="muted" style="margin-top:8px">'+(a.description||"")+'</div><div style="margin-top:8px"><span class="badge">'+a.model_provider.toUpperCase()+'</span></div></div>').join(""):'<div class="muted">Nenhum agente neste setor.</div>';
}
function fillProjectSelect(){taskProject.innerHTML='<option value="">Sem projeto</option>'+projects.filter(p=>!["done","cancelled"].includes(p.status)).map(p=>'<option value="'+p.id+'">'+escapeHtml(p.name)+'</option>').join("")}
function fillAgentSelect(){
 const opts=agents.filter(a=>a.sector===taskSector.value);
 taskAgent.innerHTML='<option value="">Selecionar agente automaticamente</option>'+opts.map(a=>'<option value="'+a.id+'">'+a.name+' — '+a.role+'</option>').join("");
}
taskSector.addEventListener("change",fillAgentSelect);

function priorityBadge(p){return p==="urgent"?"URGENTE":p==="high"?"ALTA":p==="low"?"BAIXA":"NORMAL"}
function taskStatus(s){return {todo:"A FAZER",doing:"EM EXECUÇÃO",waiting_approval:"AGUARDANDO APROVAÇÃO",done:"CONCLUÍDA",cancelled:"CANCELADA"}[s]||s}
function renderTasks(){
 taskList.innerHTML=tasks.length?tasks.slice(0,12).map(t=>{
  const ag=agents.find(a=>a.id===t.agent_id);const pr=projects.find(p=>p.id===t.project_id);
  let next=t.status==="todo"?'<button class="btn" onclick="setTaskStatus(\''+t.id+'\',\'doing\')">Iniciar</button>':t.status==="doing"?'<button class="btn success" onclick="requestApproval(\''+t.id+'\')">Enviar para aprovação</button>':t.status==="waiting_approval"?'<span class="badge wait">AGUARDANDO VOCÊ</span>':"";
  return '<div class="task"><div class="task-head"><div><b>'+escapeHtml(t.title)+'</b><div class="muted">'+SECTORS[t.sector]?.title+(ag?" • "+ag.name:"")+'</div></div><span class="badge">'+priorityBadge(t.priority)+'</span></div><div class="muted" style="margin-top:7px">'+escapeHtml(t.description||"")+'</div><div class="actions"><span class="badge">'+taskStatus(t.status)+'</span>'+next+'</div></div>'
 }).join(""):'<div class="muted">Nenhuma tarefa criada ainda.</div>';
}
async function setTaskStatus(id,status){
 await sb.from("business_tasks").update({status,updated_at:new Date().toISOString()}).eq("id",id);
 const t=tasks.find(x=>x.id===id);
 await sb.from("business_events").insert({user_id:user.id,agent_id:t?.agent_id||null,event_type:"task",title:t?.title||"Tarefa atualizada",detail:"Status: "+taskStatus(status)});
 await refreshAll();
}
window.setTaskStatus=setTaskStatus;

async function requestApproval(id){
 const t=tasks.find(x=>x.id===id);if(!t)return;
 await sb.from("business_tasks").update({status:"waiting_approval",updated_at:new Date().toISOString()}).eq("id",id);
 const existing=approvals.find(a=>a.task_id===id&&a.status==="pending");
 if(!existing)await sb.from("business_approvals").insert({user_id:user.id,task_id:id,title:"Aprovar: "+t.title,summary:t.description||"Tarefa preparada pelo setor "+SECTORS[t.sector]?.title});
 await refreshAll();
}
window.requestApproval=requestApproval;

function renderApprovals(){
 const pending=approvals.filter(a=>a.status==="pending");
 approvalList.innerHTML=pending.length?pending.map(a=>'<div class="task"><b>'+escapeHtml(a.title)+'</b><div class="muted" style="margin-top:7px">'+escapeHtml(a.summary||"")+'</div><div class="actions"><button class="btn success" onclick="decideApproval(\''+a.id+'\',\'approved\')">Aprovar</button><button class="btn danger" onclick="decideApproval(\''+a.id+'\',\'rejected\')">Rejeitar</button></div></div>').join(""):'<div class="muted">Nada aguardando sua aprovação.</div>';
}
async function decideApproval(id,status){
 const a=approvals.find(x=>x.id===id);if(!a)return;
 await sb.from("business_approvals").update({status,decided_at:new Date().toISOString()}).eq("id",id);
 if(a.task_id)await sb.from("business_tasks").update({status:status==="approved"?"done":"doing",updated_at:new Date().toISOString()}).eq("id",a.task_id);
 await sb.from("business_events").insert({user_id:user.id,event_type:"approval",title:status==="approved"?"Aprovação concedida":"Revisão solicitada",detail:a.title});
 await refreshAll();
}
window.decideApproval=decideApproval;

function renderEvents(){
 eventList.innerHTML=events.length?events.slice(0,12).map(e=>'<div class="event"><b>'+escapeHtml(e.title)+'</b><div class="muted">'+escapeHtml(e.detail||"")+'</div><small class="muted">'+new Date(e.created_at).toLocaleString("pt-BR")+'</small></div>').join(""):'<div class="muted">A memória operacional aparecerá aqui.</div>';
}

window.openTaskModal=()=>{taskModal.classList.add("open");fillAgentSelect()}
window.closeTaskModal=()=>taskModal.classList.remove("open");
window.createTask=async()=>{
 const title=taskTitle.value.trim();if(!title)return alert("Digite o título da tarefa.");
 let agentId=taskAgent.value||null;
 if(!agentId){const match=agents.find(a=>a.sector===taskSector.value);agentId=match?.id||null}
 const ctx=memories.filter(m=>m.category==="strategy"||m.category==="process"||(taskSector.value==="comercial"&&["sales","offer"].includes(m.category))).slice(0,6).map(m=>({id:m.id,title:m.title,content:m.content}));
 const {data,error}=await sb.from("business_tasks").insert({user_id:user.id,agent_id:agentId,project_id:taskProject.value||null,sector:taskSector.value,title,description:taskDesc.value.trim(),priority:taskPriority.value,status:"todo",memory_context:ctx}).select().single();
 if(error)return alert(error.message);
 await sb.from("business_events").insert({user_id:user.id,agent_id:agentId,event_type:"task",title:"Nova tarefa criada",detail:title});
 taskTitle.value="";taskDesc.value="";closeTaskModal();await refreshAll();
};


function categoryLabel(c){return {strategy:"ESTRATÉGIA",offer:"OFERTA",sales:"COMERCIAL",process:"PROCESSO",client:"CLIENTE",decision:"DECISÃO",knowledge:"CONHECIMENTO"}[c]||c.toUpperCase()}
function renderMemories(){
 memoryList.innerHTML=memories.length?memories.slice(0,10).map(m=>'<div class="agent"><div class="agent-head"><div><div class="agent-role">'+escapeHtml(m.title)+'</div><div class="muted">'+categoryLabel(m.category)+'</div></div><span class="badge">IMPORTÂNCIA '+m.importance+'</span></div><div class="muted" style="margin-top:8px">'+escapeHtml(m.content)+'</div>'+(m.tags?.length?'<div style="margin-top:8px">'+m.tags.map(t=>'<span class="badge">'+escapeHtml(t)+'</span>').join(" ")+'</div>':"")+'</div>').join(""):'<div class="muted">Nenhuma memória salva.</div>';
}
function renderProjects(){
 projectList.innerHTML=projects.length?projects.slice(0,10).map(p=>'<div class="agent"><div class="agent-head"><div><div class="agent-role">'+escapeHtml(p.name)+'</div><div class="muted">'+escapeHtml(p.client_name||"Sem cliente")+'</div></div><span class="badge '+(p.status==="active"?"ok":"")+'">'+p.status.toUpperCase()+'</span></div><div class="muted" style="margin-top:8px">'+escapeHtml(p.objective||"")+'</div></div>').join(""):'<div class="muted">Nenhum projeto criado.</div>';
}
window.openMemoryModal=()=>memoryModal.classList.add("open");
window.closeMemoryModal=()=>memoryModal.classList.remove("open");
window.createMemory=async()=>{
 const title=memoryTitle.value.trim(),content=memoryContent.value.trim();if(!title||!content)return alert("Preencha título e conteúdo.");
 const tags=memoryTags.value.split(",").map(x=>x.trim()).filter(Boolean);
 const {error}=await sb.from("business_memory").insert({user_id:user.id,category:memoryCategory.value,title,content,tags,importance:Number(memoryImportance.value)});
 if(error)return alert(error.message);
 await sb.from("business_events").insert({user_id:user.id,event_type:"memory",title:"Nova memória salva",detail:title});
 memoryTitle.value="";memoryContent.value="";memoryTags.value="";closeMemoryModal();await refreshAll();
};
window.openProjectModal=()=>projectModal.classList.add("open");
window.closeProjectModal=()=>projectModal.classList.remove("open");
window.createProject=async()=>{
 const name=projectName.value.trim();if(!name)return alert("Digite o nome do projeto.");
 const {error}=await sb.from("business_projects").insert({user_id:user.id,name,client_name:projectClient.value.trim()||null,objective:projectObjective.value.trim(),priority:projectPriority.value,status:"active"});
 if(error)return alert(error.message);
 await sb.from("business_events").insert({user_id:user.id,event_type:"project",title:"Projeto criado",detail:name});
 projectName.value="";projectClient.value="";projectObjective.value="";closeProjectModal();await refreshAll();
};

function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
auth();