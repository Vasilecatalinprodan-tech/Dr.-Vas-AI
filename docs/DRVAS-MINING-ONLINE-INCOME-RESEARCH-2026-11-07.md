# Dr.Vas — Mining, traduceri și venituri online: cercetare și plan de lansare
**Data cercetării:** 7 noiembrie 2026  
**Piață de referință:** Regatul Unit; extindere internațională numai după verificarea regulilor locale.  
**Scop:** opțiuni legale, realiste și sustenabile, cu investiție inițială mică și fără promisiuni de câștig.

## 1. Concluzie executivă

Ordinea recomandată pentru venituri online este:
1. **Servicii digitale vândute direct** — traducere/localizare generală, subtitrări, descrieri de produse, editare și pachete de conținut. Pot aduce primele comenzi înainte de a construi o audiență mare.
2. **Produse digitale mici** — șabloane, checklist-uri, ghiduri practice, pachete de subtitrări și eBook-uri originale. Se creează o dată și se pot vinde repetat, dar cer validare și promovare.
3. **Conținut video ca motor de atragere a clienților** — serii scurte, demonstrații și educație; la început trimite către servicii și produse, nu depinde de veniturile din reclame.
4. **Cursuri și produse educaționale** — după ce există cerere dovedită și feedback de la clienți.
5. **E-commerce/dropshipping** — numai după verificarea furnizorilor, retururilor, livrării, marjelor, TVA și costurilor de publicitate. Nu este prima alegere pentru un buget mic.

Nu există venit garantat. Fiecare oportunitate trebuie evaluată după costul real de achiziție a clientului, timpul de livrare, comisioane, rambursări, taxe și cererea dovedită.

## 2. Mining — reguli, siguranță și arhitectură

### 2.1 Google Play
Politica Google Play spune că aplicațiile **nu pot mina criptomonede pe dispozitivul utilizatorului**, dar pot oferi administrare de la distanță a activității de mining. Prin urmare:
- APK-ul Dr.Vas nu va folosi CPU/GPU-ul telefonului pentru mining.
- Dr.Vas poate deveni un panou de control pentru echipamente de mining separate, deținute și controlate de utilizator.
- Orice agent de mining va fi separat de Worker și de dispozitivele vizitatorilor; utilizatorul trebuie să instaleze și să pornească în mod explicit software-ul pe echipamentul propriu.
- Butoanele START/STOP, oprirea de urgență, limitele de temperatură/putere, watchdog-ul, auditul și revocarea accesului sunt obligatorii înainte de producție.

Sursa: https://support.google.com/googleplay/android-developer/answer/13607354

### 2.2 Taxe HMRC (UK)
- Recompensele primite din mining pot fi venit impozabil la valoarea în GBP de la momentul primirii.
- Dacă activitatea nu constituie o activitate comercială, HMRC o poate trata ca venit divers; dacă este organizată și desfășurată comercial, poate constitui trading. Analiza depinde de volum, organizare, risc și comercialitate.
- Dacă monedele sunt păstrate și vândute ulterior, poate apărea separat un calcul de Capital Gains Tax/Corporation Tax on Chargeable Gains.
- Păstrează data, tipul și cantitatea monedelor, valoarea în GBP la primire, portofelul, tranzacțiile, facturile de energie, echipamentele și costurile aferente. Nu presupune că orice cost de energie este automat deductibil în orice categorie fiscală.
- Dacă Dr.Vas ar începe să tranzacționeze, să păstreze active pentru clienți sau să ofere servicii de tranzacționare/custodie, ar fi necesară o analiză FCA separată. Nu vom construi astfel de servicii în această etapă.

Surse:
- https://www.gov.uk/hmrc-internal-manuals/cryptoassets-manual/crypto22150
- https://www.gov.uk/guidance/check-if-you-need-to-pay-tax-when-you-receive-cryptoassets
- https://www.gov.uk/hmrc-internal-manuals/cryptoassets-manual/crypto20050
- https://www.fca.org.uk/publications/policy-statements/ps26-18-cryptoasset-perimeter-guidance
- https://www.gov.uk/guidance/check-if-youll-need-to-report-cryptoasset-data-to-hmrc

### 2.3 Condiții de pornire
Nu pornim un miner până când avem:
- modelul exact de ASIC/GPU/CPU și numărul de echipamente;
- consumul real măsurat în W/kW și tariful real de energie (£/kWh);
- costuri de răcire, mentenanță, pool, downtime și amortizarea hardware;
- monedă/algoritm și pool compatibile, adresă publică de payout verificată (niciodată seed phrase sau chei private);
- calcul de rentabilitate cu preț, dificultate, hashrate și fee-uri actualizate;
- test controlat, limită termică, limită de putere, watchdog și STOP verificat.
Dacă venitul brut estimat nu acoperă energia, răcirea, pool-ul, mentenanța și uzura echipamentului, recomandarea este să nu pornească.

### 2.4 Arhitectura Dr.Vas Mining
- **Mining Control Centre (APK/web):** stare, hashrate, temperatură, putere, cost energie, pool, uptime, recompense și alerte.
- **Agent separat pe echipamentul propriu:** semnat, autentificat, actualizabil, cu autorizare explicită și limitare locală; nu rulează în Cloudflare Worker.
- **Control securizat:** dispozitive înrolate individual, tokenuri revocabile, START/STOP confirmat, jurnal de audit și oprire locală de urgență.
- **Profitability Lab:** scenarii zilnice/lunare/anuale, break-even, tarif maxim de energie, variații de preț/dificultate, cost total de proprietate și rezervă fiscală.
- **Fără custodie:** Dr.Vas nu colectează seed phrase, chei private, parole de exchange sau drepturi de retragere.

## 3. Venituri online — canale validate și comisioane

### 3.1 Servicii digitale (prioritatea 1)
Pachete posibile:
- traducere generală și localizare RO–EN–IT, cu glosar și verificare umană;
- subtitrări și transcriere pentru clipuri scurte;
- adaptarea descrierilor de produse și a paginilor de magazin;
- pachete de texte pentru social media și calendare editoriale;
- formatare și corectură pentru eBook-uri și materiale de curs.

Limite de calitate: nu promite traduceri autorizate/certificate; traducerile medicale, juridice sau financiare cu consecințe trebuie verificate de un profesionist calificat. Păstrează confidențialitatea documentelor și acordul clientului.

Platforme:
- Fiverr: freelancerul primește în mod obișnuit 80% din valoarea comenzii finalizate. Sursa: https://help.fiverr.com/hc/en-us/articles/9234443621137-Your-earnings-page
- Upwork: comisionul freelancerului poate varia între 0% și 15% pe contract și este afișat înainte de acceptarea ofertei. Sursa: https://support.upwork.com/hc/en-us/articles/211062538-Learn-about-the-Freelancer-Service-Fee
- Vânzarea directă poate reduce comisioanele marketplace, dar necesită găsirea clienților, termeni clari, facturare, protecția datelor și gestionarea disputelor.

### 3.2 Produse digitale (prioritatea 2)
Produse mici pentru validare:
- șabloane de planificare și buget;
- checklist-uri pentru lansarea unui magazin sau a unui canal social;
- ghiduri practice și eBook-uri originale;
- pachete de subtitrări, scripturi și calendare de conținut;
- glosare și fișe de lucru lingvistice.

Platforme:
- Etsy UK: £0.15 per listare, 6.5% comision de tranzacție și, pentru conturi bancare UK, procesare indicată ca 4% + £0.20; pot exista taxe de configurare, TVA și comisioane de publicitate externă. Verifică tarifele exacte înainte de listare. Sursa: https://www.etsy.com/uk/sell
- Gumroad: pentru vânzări directe, 10% + $0.50 per tranzacție, plus procesarea cardului/PayPal; vânzările din marketplace Discover sunt taxate cu 30%. Sursa: https://gumroad.com/help/article/66-gumroads-fees
- Începe cu 1–3 produse pilot și măsoară vizite, conversie, rambursări, timp de suport și profit net. Nu cumpăra reclame până când produsul nu convertește organic.

### 3.3 Video și conținut (prioritatea 3)
- Folosește clipuri scurte pentru a demonstra un rezultat concret: înainte/după subtitrare, exemplu de localizare, tutorial, poveste originală sau un șablon.
- Fiecare clip trebuie să conducă spre un serviciu ori produs verificabil; nu te baza inițial pe venitul din reclame.
- YouTube Partner Program are praguri de eligibilitate și revizuire; o pagină oficială indică 1.000 de abonați și 4.000 de ore publice valide în 12 luni sau 10 milioane de vizualizări Shorts valide în 90 de zile. Verifică întotdeauna cerințele actuale în YouTube Studio. Sursa: https://support.google.com/youtube/answer/72851
- Folosește materiale originale sau licențiate și păstrează dovezile drepturilor pentru muzică, imagini, voci și fonturi.

### 3.4 Cursuri și educație
Construiește un mini-curs numai după ce serviciul sau produsul aferent a primit cereri reale. Începe cu un rezultat restrâns, lecții scurte, exerciții și feedback. Nu vinde acreditări sau calificări pe care Dr.Vas nu le poate acorda.

### 3.5 Dropshipping și comerț
Nu este recomandat ca primă sursă de venit cu buget redus: există costuri de mostre, furnizori, livrare, retururi, chargeback, suport, TVA și publicitate. Înainte de lansare: verifică produsul fizic, timpii de livrare, conformitatea UK, garanțiile, politica de retur, marja după toate taxele și furnizorul de rezervă. Nu publica listări fără dovezi despre stoc și livrare.

### 3.6 AI evaluation și micro-task-uri
Se pot cerceta doar oportunități cu operator identificabil, contract și termeni clari, metodă de plată verificabilă și fără taxe de înscriere suspecte. Nu promitem disponibilitate, volum constant sau venit; eligibilitatea depinde de țară, limbă, testare și cererea platformei.

## 4. Cum transformăm cercetarea în funcții Dr.Vas

1. **Opportunity Board:** fiecare oportunitate are sursă, dată de verificare, țară, cost de start, competențe, timp de livrare, comisioane, taxe, marjă netă estimată, nivel de risc și status de validare.
2. **Translation Station:** încărcare text, limbă sursă/țintă, glosar, ton, segmentare, traducere, verificare terminologică, comparație side-by-side, export DOCX/TXT/SRT/VTT. Traducerea consecventă trebuie să păstreze formatul și să permită revizuire umană.
3. **Creator Product Studio:** brief, verificare originalitate/drepturi, structură, editare, export eBook/PDF, fișă de produs, descriere, preț și checklist de publicare.
4. **Service Builder:** pachete Basic/Standard/Premium, livrabile, limite, termene, preț, FAQ, portofoliu și texte de listare pentru marketplace.
5. **Net Profit Calculator:** venit brut minus comision platformă, procesare, cost de producție, rambursări, publicitate, cost orar și rezervă fiscală.
6. **Income Tracker:** separat între estimat, comandat, livrat, încasat, rambursat și profit net. Nu amesteca veniturile estimate cu banii încasați.
7. **Source freshness:** verifică periodic comisioanele, eligibilitatea și regulile platformelor; păstrează data ultimei verificări și linkul oficial.

## 5. Plan de execuție recomandat

**Etapa A — stabilizare și date reale**
- Confirmă Sarah și prezentarea pe desktop și Android după deploy.
- Confirmă forma vizuală a helixurilor pe ecranul fondatorului.
- Inventariază hardware-ul disponibil și tariful real de energie înainte de a alege algoritmul/moneda.

**Etapa B — Mining pilot**
- Înrolează un singur echipament propriu.
- Rulează un test scurt cu limite stricte și loguri.
- Compară hashrate-ul și consumul măsurat cu estimarea; oprește dacă profitul net estimat este negativ sau temperaturile depășesc limita.
- Abia apoi decide dacă merită extinderea.

**Etapa C — primele venituri digitale**
- Alege un singur serviciu de traducere/subtitrare și construiește trei mostre originale.
- Publică un pachet clar pe un marketplace și contactează potențiali clienți fără spam.
- Creează un singur produs digital complementar și testează cererea.
- Folosește conținutul video ca portofoliu și canal de atragere, nu ca promisiune de bani rapizi.

**Etapa D — scalare**
- Repetă doar ceea ce are comenzi, conversie și marjă pozitivă.
- Automatizează producția și raportarea după validarea manuală.
- Integrează plăți, abonamente și marketplace publishing numai după verificarea legală, fiscală, a termenilor și a securității.

## 6. Întrebări deschise înainte de pornirea miningului
- Ce model exact de ASIC/GPU/CPU și câte unități sunt disponibile?
- Care este tariful de energie în £/kWh și unde este instalat echipamentul?
- Ce buget maxim de hardware și răcire este acceptabil?
- Se dorește mining pe echipament personal sau administrarea unei instalații externe?

**Notă:** document de cercetare și planificare, nu consultanță fiscală, juridică sau financiară. Verifică regulile actuale și cere sfat profesionist înainte de operațiuni comerciale sau reglementate.
