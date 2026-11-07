/* Dr.Vas — dedicated feature workspaces for the six integrated modules.
   Existing forms are moved (not cloned) so IDs, validation, event handlers and project saves remain unique. */
(function(){
 "use strict";
 const built=new WeakSet();
 const voiceToolbar=()=>document.querySelector("#chatSection .voice-toolbar");
 let voiceHome=null;
 function mountModuleVoice(moduleName,workspace){
  const toolbar=voiceToolbar();
  if(!toolbar)return;
  if(!voiceHome){
   voiceHome=document.createComment("Dr.Vas voice toolbar home");
   toolbar.parentNode?.insertBefore(voiceHome,toolbar);
  }
  document.querySelectorAll(".drvas-module-voice-access").forEach(node=>node.remove());
  const isModule=["studio","academy","commerce","business"].includes(moduleName);
  const activeWorkspace=isModule&&workspace&&!workspace.classList.contains("hidden")&&document.body.classList.contains("module-workspace-mode");
  if(!activeWorkspace){
   if(voiceHome.parentNode)voiceHome.parentNode.insertBefore(toolbar,voiceHome.nextSibling);
   toolbar.setAttribute("aria-label","Controale vocale Dr.Vas");
   return;
  }
  const section=document.createElement("section");
  section.className="drvas-module-voice-access";
  section.setAttribute("aria-labelledby","drvasModuleVoiceHeading");
  const heading=document.createElement("h3");
  heading.id="drvasModuleVoiceHeading";
  heading.textContent="🎧 Acces vocal și accesibilitate";
  const description=document.createElement("p");
  description.textContent="Ascultă răspunsurile asistentului, dictează și trimite întrebări fără să tastezi sau începe o conversație vocală Live. Microfonul pornește numai când apeși un buton.";
  section.append(heading,description,toolbar);
  const navigation=workspace.querySelector(".drvas-feature-navigation");
  workspace.insertBefore(section,navigation||workspace.firstChild);
  toolbar.setAttribute("aria-label","Controale vocale pentru acest modul");
 }
 const direct=(root,selector)=>{const normalized=selector.replace(/^:scope\s*>\s*/,"");return Array.from(root.children).find(node=>node.matches(normalized))||null;};
 const byId=id=>document.getElementById(id);
 function makeNav(root,items){
  const nav=document.createElement("nav");nav.className="drvas-feature-navigation";nav.setAttribute("aria-label","Funcții și spații de lucru");
  const pages=document.createElement("div");pages.className="drvas-feature-pages";
  const pageMap=new Map(),savedSharedState=new Map();
  function readSharedState(item){
   const state={};
   (item.shared||[]).forEach(node=>{
    if(!node)return;
    const controls=[...(node.matches?.("input,select,textarea")?[node]:[]),...node.querySelectorAll("input,select,textarea")];
    controls.forEach(control=>{
     if(!control.id||control.type==="file")return;
     state[control.id]=control.type==="checkbox"||control.type==="radio"?{checked:control.checked}:{value:control.value};
    });
   });
   return state;
  }
  function applySharedState(item,state){
   if(!state)return;
   (item.shared||[]).forEach(node=>{
    if(!node)return;
    const controls=[...(node.matches?.("input,select,textarea")?[node]:[]),...node.querySelectorAll("input,select,textarea")];
    controls.forEach(control=>{
     const saved=control.id?state[control.id]:null;if(!saved)return;
     if(Object.prototype.hasOwnProperty.call(saved,"checked"))control.checked=saved.checked;
     else if(Object.prototype.hasOwnProperty.call(saved,"value"))control.value=saved.value;
    });
   });
  }
  const initialSharedState=items.length?readSharedState(items[0]):{};
  items.forEach(item=>{
   const button=document.createElement("button");button.type="button";button.dataset.feature=item.id;button.textContent=item.label;button.setAttribute("aria-pressed","false");
   const page=document.createElement("section");page.className="drvas-feature-page";page.dataset.featurePage=item.id;page.hidden=true;
   const heading=document.createElement("div");heading.className="drvas-feature-page-heading";
   const title=document.createElement("h3");title.textContent=item.title||item.label;heading.appendChild(title);
   if(item.description){const desc=document.createElement("p");desc.textContent=item.description;heading.appendChild(desc);}
   const content=document.createElement("div");content.className="drvas-feature-page-content";
   page.append(heading,content);pages.appendChild(page);nav.appendChild(button);pageMap.set(item.id,{button,page,content,item});(item.nodes||[]).forEach(node=>{if(node)content.appendChild(node);});
   button.addEventListener("click",()=>open(item.id));
  });
  root.append(nav,pages);
  function open(id){
   const target=pageMap.get(id);if(!target)return;
   const previousId=root.dataset.activeFeature;
   if(previousId&&previousId!==id){const previous=pageMap.get(previousId);if(previous?.item.shared?.length)savedSharedState.set(previousId,readSharedState(previous.item));}
   for(const [key,entry] of pageMap){entry.page.hidden=key!==id;entry.button.classList.toggle("active",key===id);entry.button.setAttribute("aria-pressed",String(key===id));}
   const item=target.item;
   (item.shared||[]).forEach(node=>{if(node)target.content.appendChild(node);});
   (item.nodes||[]).forEach(node=>{if(node)target.content.appendChild(node);});
   if(item.shared?.length)applySharedState(item,savedSharedState.get(id)||initialSharedState);
   if(item.deliverable&&byId(item.deliverable[0]))byId(item.deliverable[0]).value=item.deliverable[1];
   if(item.mode)window[item.mode[0]]=item.mode[1];
   root.dataset.activeFeature=id;
  }
  open(items[0].id);
  return {open,pageMap};
 }
 function studio(root){
  if(built.has(root))return;built.add(root);
  const header=direct(root,".studio-workspace-head");
  const production=direct(root,".studio-production-standard");
  const render=direct(root,".studio-render-panel");
  const brief=direct(root,":scope > .studio-form-grid");
  const actions=Array.from(root.children).find(n=>n.matches(".studio-actions"));
  const projects=Array.from(root.children).find(n=>n.matches(".studio-project-manager:not(.studio-render-panel)"));
  const income=direct(root,".income-tracker"),capabilities=direct(root,".studio-capabilities"),social=direct(root,".studio-social");
  const items=[
   {id:"video",label:"Lucrează la videoclip",title:"Video & Reels",description:"Pregătește scenariul și producția video. Randarea MP4 rămâne disponibilă numai când serviciul este configurat și verificat.",nodes:[production,render],shared:[brief,actions],deliverable:["studioDeliverable","short"]},
   {id:"series",label:"Scrie serial / scenariu",title:"Seriale și scenarii",description:"Lucrează separat la episoade, personaje, dialog și continuitatea poveștii.",shared:[brief,actions],deliverable:["studioDeliverable","series"]},
   {id:"book",label:"Scrie o carte",title:"Cărți și eBookuri",description:"Spațiu dedicat pentru concept, structură, capitole și manuscris.",shared:[brief,actions],deliverable:["studioDeliverable","book"]},
   {id:"music",label:"Creează muzică / versuri",title:"Muzică și versuri originale",description:"Pregătește compoziții, structuri, versuri și materiale originale.",shared:[brief,actions],deliverable:["studioDeliverable","music"]},
   {id:"translation",label:"Lucrează la traducere",title:"Traduceri și localizare",description:"Păstrează sensul, terminologia și formatarea materialului sursă.",shared:[brief,actions],deliverable:["studioDeliverable","translation"]},
   {id:"projects",label:"Proiectele mele",title:"Proiecte Studio",description:"Deschide, salvează, exportă sau șterge proiecte private.",nodes:[projects]},
   {id:"income",label:"Urmărește veniturile",title:"Oportunități și venituri",description:"Ține evidența oportunităților, etapelor și încasărilor.",nodes:[income]},
   {id:"social",label:"Social media",title:"Social media și distribuție",description:"Organizează conținutul și verifică starea integrărilor oficiale.",nodes:[capabilities,social]}
  ];
  const usable=items.filter(item=>(item.nodes||[]).some(Boolean)||(item.shared||[]).some(Boolean));
  makeNav(root,usable);
  if(header)root.insertBefore(header,root.firstChild);
  const disclaimer=direct(root,".studio-disclaimer");if(disclaimer)root.appendChild(disclaimer);
 }
 function simple(root,items){
  if(built.has(root))return;built.add(root);
  const header=direct(root,".studio-workspace-head");
  makeNav(root,items);
  if(header)root.insertBefore(header,root.firstChild);
 }
 function academy(root){
  const form=direct(root,":scope > .studio-form-grid"),actions=direct(root,":scope > .studio-actions"),projects=direct(root,":scope > .module-project-manager");
  const shared=[form,actions];
  simple(root,[
   {id:"course",label:"Construiește cursul",title:"Constructor de cursuri",description:"Definește obiectivele, publicul, structura și rezultatele cursului.",shared,mode:["DrVasAcademyFeature","course"]},
   {id:"lessons",label:"Scrie lecțiile",title:"Atelier de lecții",description:"Construiește lecții complete, cu explicații, exemple, recapitulare și materiale.",shared,mode:["DrVasAcademyFeature","lessons"]},
   {id:"exercises",label:"Exerciții și quiz",title:"Atelier de exerciții și evaluare",description:"Creează exerciții, teste, bareme și răspunsuri explicate.",shared,mode:["DrVasAcademyFeature","exercises"]},
   {id:"learning-plan",label:"Plan de învățare",title:"Traseu de învățare",description:"Organizează un parcurs pe săptămâni, cu obiective și verificări de progres.",shared,mode:["DrVasAcademyFeature","learning-plan"]},
   {id:"courses",label:"Cursurile mele",title:"Proiectele mele Academy",description:"Gestionează cursurile salvate privat.",nodes:[projects]}
  ]);
 }
 function commerce(root){
  const form=direct(root,":scope > .studio-form-grid"),calculator=direct(root,":scope > .crypto-calculator"),actions=direct(root,":scope > .studio-actions"),projects=direct(root,":scope > .module-project-manager");
  const shared=[form,actions];
  simple(root,[
   {id:"research",label:"Cercetează produsul",title:"Cercetare de produs și piață",description:"Analizează produsul, clientul, piața, modelul de vânzare și riscurile.",shared,mode:["DrVasCommerceFeature","research"]},
   {id:"suppliers",label:"Compară furnizorii",title:"Verificarea furnizorilor",description:"Compară furnizori, mostre, costuri totale, termene, retururi și riscuri înainte de orice plată.",shared,mode:["DrVasCommerceFeature","suppliers"]},
   {id:"launch",label:"Plan de lansare magazin",title:"Lansare și operațiuni magazin",description:"Pregătește oferta, listările, livrarea, retururile, suportul clienților și lansarea etapizată.",shared,mode:["DrVasCommerceFeature","launch"]},
   {id:"pricing",label:"Calculează prețul și marja",title:"Calculator de preț și profitabilitate",description:"Separă costurile, comisioanele, marja și pragul de rentabilitate.",nodes:[calculator]},
   {id:"projects",label:"Analizele mele",title:"Proiecte Commerce salvate",description:"Gestionează analizele private.",nodes:[projects]}
  ]);
 }
 function business(root){
  const planForm=direct(root,":scope > .studio-form-grid"),planActions=direct(root,":scope > .studio-actions"),planProjects=Array.from(root.children).find(n=>n.matches(".module-project-manager"));
  const sectionFor=id=>byId(id)?.closest("section")||null;
  const cashbook=sectionFor("businessCashbookTitle"),cashflow=sectionFor("businessCashflowTitle"),breakEven=sectionFor("businessBreakEvenTitle"),student=sectionFor("businessAssessmentTitle");
  simple(root,[
   {id:"plan",label:"Plan de afaceri",title:"Plan de afaceri",description:"Construiește și salvează strategia, bugetul și pașii de implementare.",nodes:[planForm,planActions,planProjects]},
   {id:"cashbook",label:"Contabilitate / registru",title:"Registru de încasări și cheltuieli",description:"Organizează tranzacțiile și exportă datele pentru verificarea contabilă.",nodes:[cashbook]},
   {id:"cashflow",label:"Raport Cashflow",title:"Raport de flux de numerar",description:"Analizează încasările, cheltuielile și soldul net pe perioada selectată.",nodes:[cashflow]},
   {id:"break-even",label:"Prag de rentabilitate",title:"Calculator Business",description:"Calculează volumul minim și scenarii pe baza ipotezelor introduse.",nodes:[breakEven]},
   {id:"student",label:"Student Desk",title:"Evaluare și îndrumare academică",description:"Feedback pe rubrică și structură, cu respectarea integrității academice.",nodes:[student]}
  ]);
 }
 function health(root){
  const form=direct(root,":scope > .studio-form-grid"),actions=direct(root,":scope > .studio-actions");
  simple(root,[{id:"health-brief",label:"Pregătește întrebarea",title:"Health information desk",description:"Organizează întrebările și contextul pentru o discuție informativă cu Dr.Vas Health.",nodes:[form,actions]}]);
 }
 function init(module){
  const roots={health:byId("healthWorkspace"),studio:byId("studioWorkspace"),academy:byId("academyWorkspace"),commerce:byId("commerceWorkspace"),business:byId("businessWorkspace")};
  const root=roots[module];if(!root)return;
  if(module==="health")health(root);
  if(module==="studio")studio(root);
  if(module==="academy")academy(root);
  if(module==="commerce")commerce(root);
  if(module==="business")business(root);
 }
 const original=window.selectModule;
 if(typeof original==="function"){
  window.selectModule=function(moduleName,...rest){
   const result=original.call(this,moduleName,...rest);
   init(moduleName);
   const back=byId("globalBackToModules"),chat=byId("chatSection"),workspace=byId(moduleName+"Workspace");
   mountModuleVoice(moduleName,workspace);
   const active=["free","health"].includes(moduleName)
    ?document.body.classList.contains("free-module-mode")&&chat&&!chat.classList.contains("hidden")
    :document.body.classList.contains("module-workspace-mode")&&workspace&&!workspace.classList.contains("hidden");
   if(back&&active){back.hidden=false;back.style.display="inline-flex";}
   return result;
  };
 }
 document.addEventListener("DOMContentLoaded",()=>["health","studio","academy","commerce","business"].forEach(init));
 window.DrVasFeatureWorkspaces={init,mountModuleVoice};
})();
