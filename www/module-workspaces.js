/* Dr.Vas — dedicated feature workspaces for the six integrated modules.
   Existing forms are moved (not cloned) so IDs, validation, event handlers and project saves remain unique. */
(function(){
 "use strict";
 const built=new WeakSet();
 let voiceToolbarNode=null;
 const voiceToolbar=()=>voiceToolbarNode||(voiceToolbarNode=document.querySelector(".voice-toolbar"));
 let voiceHome=null;
 function mountModuleVoice(moduleName,workspace){
  const toolbar=voiceToolbar();
  if(!toolbar)return;
  if(!voiceHome){
   voiceHome=document.createComment("Dr.Vas voice toolbar home");
   toolbar.parentNode?.insertBefore(voiceHome,toolbar);
  }
  document.querySelectorAll(".drvas-module-voice-access").forEach(node=>node.remove());
  const isModule=["health","studio","academy","commerce","business"].includes(moduleName);
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
 function stationField(labelText,id,tag="input",attributes={}){
  const label=document.createElement("label");label.textContent=labelText;
  const field=document.createElement(tag);
  field.id=id;field.name=id;
  Object.entries(attributes).forEach(([key,value])=>{
   if(key==="options")return;
   field.setAttribute(key,String(value));
  });
  if(attributes.options)attributes.options.forEach(option=>{
   const item=document.createElement("option");item.value=option.value;item.textContent=option.label;field.appendChild(item);
  });
  label.appendChild(field);return {label,field};
 }
 function createStudioStation(kind){
  const section=document.createElement("section");section.className="studio-station-card";
  const title=document.createElement("h4"),description=document.createElement("p"),grid=document.createElement("div"),status=document.createElement("p"),button=document.createElement("button");
  grid.className="studio-station-grid";status.className="studio-station-status";status.setAttribute("role","status");status.setAttribute("aria-live","polite");
  const fields=kind==="book"?[
   stationField("Titlul cărții","drvasBookStationTitle","input",{maxlength:140,placeholder:"Titlul provizoriu"}),
   stationField("Genul editorial","drvasBookStationGenre","select",{options:[{value:"Roman dramatic",label:"Roman dramatic"},{value:"Thriller / mister",label:"Thriller / mister"},{value:"Dezvoltare personală",label:"Dezvoltare personală"},{value:"Business și antreprenoriat",label:"Business și antreprenoriat"},{value:"Memorii / autobiografie",label:"Memorii / autobiografie"},{value:"Carte educațională",label:"Carte educațională"},{value:"Copii și familie",label:"Copii și familie"}]}),
   stationField("Limba cărții","drvasBookStationLanguage","select",{options:[{value:"Română",label:"Română"},{value:"Engleză",label:"Engleză"},{value:"Italiană",label:"Italiană"},{value:"Turcă",label:"Turcă"},{value:"Germană",label:"Germană"},{value:"Franceză",label:"Franceză"},{value:"Spaniolă",label:"Spaniolă"}]}),
   stationField("Public-țintă","drvasBookStationAudience","input",{maxlength:180,placeholder:"Cui i se adresează cartea?"}),
   stationField("Dimensiune","drvasBookStationLength","select",{options:[{value:"Ghid scurt · 8–12 capitole",label:"Ghid scurt · 8–12 capitole"},{value:"Carte medie · 12–18 capitole",label:"Carte medie · 12–18 capitole"},{value:"Roman amplu · 20–30 capitole",label:"Roman amplu · 20–30 capitole"}]}),
   stationField("Ideea, mesajul și conținutul dorit","drvasBookStationConcept","textarea",{rows:6,maxlength:4500,placeholder:"Descrie ideea, personajele, mesajul, evenimentele și ce vrei să obțină cititorul."})
  ]:[
   stationField("Limba sursă","drvasTranslationSource","select",{options:[{value:"auto",label:"Detectare automată"},{value:"ro",label:"Română"},{value:"en",label:"Engleză"},{value:"it",label:"Italiană"},{value:"tr",label:"Turcă"},{value:"fr",label:"Franceză"},{value:"de",label:"Germană"},{value:"es",label:"Spaniolă"},{value:"pt",label:"Portugheză"},{value:"nl",label:"Olandeză"},{value:"pl",label:"Poloneză"},{value:"uk",label:"Ucraineană"},{value:"ru",label:"Rusă"},{value:"ar",label:"Arabă"},{value:"zh",label:"Chineză"},{value:"ja",label:"Japoneză"}]}),
   stationField("Limba țintă","drvasTranslationTarget","select",{options:[{value:"",label:"Alege limba țintă"},{value:"ro",label:"Română"},{value:"en",label:"Engleză"},{value:"it",label:"Italiană"},{value:"tr",label:"Turcă"},{value:"fr",label:"Franceză"},{value:"de",label:"Germană"},{value:"es",label:"Spaniolă"},{value:"pt",label:"Portugheză"},{value:"nl",label:"Olandeză"},{value:"pl",label:"Poloneză"},{value:"uk",label:"Ucraineană"},{value:"ru",label:"Rusă"},{value:"ar",label:"Arabă"},{value:"zh",label:"Chineză"},{value:"ja",label:"Japoneză"}]}),
   stationField("Stilul traducerii","drvasTranslationStyle","select",{options:[{value:"Fidelă și naturală",label:"Fidelă și naturală"},{value:"Formală / profesională",label:"Formală / profesională"},{value:"Juridică — cu verificare umană",label:"Juridică — cu verificare umană"},{value:"Tehnică — cu glosar",label:"Tehnică — cu glosar"},{value:"Literară / creativă",label:"Literară / creativă"},{value:"Marketing / localizare",label:"Marketing / localizare"}]}),
   stationField("Format","drvasTranslationFormat","select",{options:[{value:"Text simplu, păstrează paragrafele",label:"Text simplu, păstrează paragrafele"},{value:"SRT / VTT, păstrează timpii",label:"SRT / VTT, păstrează timpii"},{value:"Document cu tabel sursă–traducere",label:"Document cu tabel sursă–traducere"}]}),
   stationField("Glosar / termeni care trebuie păstrați","drvasTranslationGlossary","textarea",{rows:3,maxlength:1500,placeholder:"Termen original = traducere preferată"}),
   stationField("Textul de tradus","drvasTranslationText","textarea",{rows:8,maxlength:4500,placeholder:"Lipește textul aici. Pentru documente mari, folosește încărcarea fișierului în Studio."})
  ];
  title.textContent=kind==="book"?"📚 Book Studio — atelier de carte și eBook":"🌍 Translation Station — stație de traducere";
  description.textContent=kind==="book"?"Construiește proiectul editorial etapizat: sinopsis, structură, capitole, continuitate, editare și pregătire pentru export.":"Tradu integral și localizează texte în mai multe limbi, păstrând terminologia, formatarea și marcajele temporale.";
  fields.forEach(field=>grid.appendChild(field.label));
  button.type="button";button.className="studio-station-submit";button.textContent=kind==="book"?"Creează și salvează proiectul de carte":"Pregătește traducerea și salvează proiectul";
  button.addEventListener("click",async()=>{
   const value=id=>byId(id)?.value?.trim()||"";
   if(kind==="book"){
    const concept=value("drvasBookStationConcept");
    if(!concept){status.textContent="Descrie ideea cărții înainte de a continua.";byId("drvasBookStationConcept")?.focus();return;}
    const bookTitle=value("drvasBookStationTitle")||"Carte nouă";
    const idea=["TITLU: "+bookTitle,"GEN: "+value("drvasBookStationGenre"),"LIMBA: "+value("drvasBookStationLanguage"),"PUBLIC: "+value("drvasBookStationAudience"),"DIMENSIUNE: "+value("drvasBookStationLength"),"CONCEPT ȘI CERINȚE:",concept].join("\n");
    window.newStudioProject?.();
    if(byId("studioDeliverable"))byId("studioDeliverable").value="book";
    if(byId("studioProjectTitle"))byId("studioProjectTitle").value=bookTitle;
    if(byId("studioIdea"))byId("studioIdea").value=idea.slice(0,5000);
    if(byId("studioMonetization"))byId("studioMonetization").value="ebook";
   }else{
    const source=value("drvasTranslationText"),target=value("drvasTranslationTarget");
    if(!source){status.textContent="Adaugă textul care trebuie tradus.";byId("drvasTranslationText")?.focus();return;}
    if(!target){status.textContent="Alege limba țintă.";byId("drvasTranslationTarget")?.focus();return;}
    const title="Traducere "+value("drvasTranslationSource")+" → "+target;
    const idea=["STIL: "+value("drvasTranslationStyle"),"FORMAT: "+value("drvasTranslationFormat"),"GLOSAR:",value("drvasTranslationGlossary")||"Nu a fost furnizat.","TEXT SURSĂ:",source].join("\n");
    window.newStudioProject?.();
    if(byId("studioDeliverable"))byId("studioDeliverable").value="translation";
    if(byId("studioProjectTitle"))byId("studioProjectTitle").value=title;
    if(byId("studioSourceLanguage"))byId("studioSourceLanguage").value=value("drvasTranslationSource")||"auto";
    if(byId("studioTargetLanguage"))byId("studioTargetLanguage").value=target;
    if(byId("studioIdea"))byId("studioIdea").value=idea.slice(0,5000);
    if(byId("studioMonetization"))byId("studioMonetization").value="freelance";
   }
   const saved=await window.saveStudioProject?.();
   window.buildStudioPrompt?.();
   status.textContent=saved?"Proiect salvat privat. Brief-ul este pregătit în conversație; verifică-l și apasă Trimite.":"Brief pregătit. Salvarea nu a fost confirmată; verifică statusul proiectelor și apasă Trimite după revizuire.";
  });
  section.append(title,description,grid,button,status);
  return section;
 }
 function founderShortcut(title,description,targetId,buttonText){
  const section=document.createElement("section");section.className="studio-founder-shortcut";
  const heading=document.createElement("h4");heading.textContent=title;
  const copy=document.createElement("p");copy.textContent=description;
  const button=document.createElement("button");button.type="button";button.textContent=buttonText;
  button.addEventListener("click",()=>{
   const target=byId(targetId);
   if(!target){const message=byId("adminAccessNotice");if(message){message.textContent="Panoul privat nu este disponibil în sesiunea curentă.";message.classList.remove("hidden");}return;}
   target.scrollIntoView({behavior:"smooth",block:"start"});
   target.setAttribute("tabindex","-1");target.focus({preventScroll:true});
  });
  section.append(heading,copy,button);return section;
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
  const cryptoShortcut=founderShortcut("₿ Crypto & Mining","Analiză PoW, calculator de rentabilitate, registru de dispozitive și limite de siguranță. Minarea reală este dezactivată până la instalarea agentului local securizat.","cryptoEngineHeading","Deschide panoul Crypto & Mining"),incomeShortcut=founderShortcut("✍️ Creator & Online Income Lab","Cărți, traduceri, muzică, produse digitale, publicare, AI Evaluation și urmărirea oportunităților de venit.","founderProductionHeading","Deschide Creator & Online Income Lab");
  const bookStation=createStudioStation("book"),translationStation=createStudioStation("translation");
  const items=[
   {id:"video",label:"Lucrează la videoclip",title:"Video & Reels",description:"Pregătește scenariul și producția video. Randarea MP4 rămâne disponibilă numai când serviciul este configurat și verificat.",nodes:[production,render],shared:[brief,actions],deliverable:["studioDeliverable","short"]},
   {id:"series",label:"Scrie serial / scenariu",title:"Seriale și scenarii",description:"Lucrează separat la episoade, personaje, dialog și continuitatea poveștii.",shared:[brief,actions],deliverable:["studioDeliverable","series"]},
   {id:"book",label:"Book Studio",title:"Atelier de cărți și eBookuri",description:"Formular dedicat pentru proiect editorial, structură, capitole și continuitate.",nodes:[bookStation],deliverable:["studioDeliverable","book"]},
   {id:"translation",label:"Translation Station",title:"Stație de traducere și localizare",description:"Formular dedicat pentru limbi, stil, glosar și traducere integrală.",nodes:[translationStation],deliverable:["studioDeliverable","translation"]},
   {id:"music",label:"Creează muzică / versuri",title:"Muzică și versuri originale",description:"Pregătește compoziții, structuri, versuri și materiale originale.",shared:[brief,actions],deliverable:["studioDeliverable","music"]},
   {id:"projects",label:"Proiectele mele",title:"Proiecte Studio",description:"Deschide, salvează, exportă sau șterge proiecte private.",nodes:[projects]},
   {id:"income",label:"Urmărește veniturile",title:"Oportunități și venituri",description:"Ține evidența oportunităților, etapelor și încasărilor.",nodes:[income]},
   {id:"income-lab",label:"Venituri online & produse",title:"Creator & Online Income Lab",description:"Acces rapid la atelierul privat de cărți, produse digitale, publicare, muzică și evaluare AI.",nodes:[incomeShortcut]},
   {id:"crypto",label:"Crypto & Mining",title:"Crypto & Mining — centru privat",description:"Analiză, compatibilitate, rentabilitate și registru de dispozitive. Minarea reală rămâne dezactivată până la instalarea și autorizarea agentului local securizat.",nodes:[cryptoShortcut]},
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
