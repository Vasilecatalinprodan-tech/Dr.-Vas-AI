# Dr.Vas AI — checkpoint de continuitate
## 2026-11-06 — fotografii prezentatori, animație, Crypto și continuarea platformei

### Cerința utilizatorului
Utilizatorul a încărcat două portrete:
- Sarah: fișierul conversației `Sarah23.jpg`, JPEG RGB, 928×1152 px.
- Dr.Jan: fișierul conversației `drjan.jpg`, JPEG RGB, 928×1152 px.
Fotografia fondatorului Dr.Vas există deja în repository la `www/drvas.jpeg`.

Solicitare explicită:
1. Integrarea portretelor Sarah și Dr.Jan în prezentarea publică Dr.Vas, în selectorul asistenților și în scena Live.
2. Animație a prezentatorilor ca și cum ar vorbi. Distincție obligatorie între animație CSS/indicator audio și lip-sync realist; nu se afirmă sincronizare reală a buzelor fără implementare și testare.
3. Transfer permanent al imaginilor în `www/assets/presenters/`, eliminarea URL-urilor temporare Runway din cod, verificarea încărcării imaginilor, accesibilitate, crop responsive și fallback.
4. Testare completă, PR, merge și deploy după validare; verificare production smoke și versiunea Worker.
5. Continuarea celorlalte module ale platformei.
6. Extinderea separată Dr.Vas Crypto pentru analiză și eventuală minare reală pe laptop și telefon. Nu se activează minarea fără alegerea monedei, analiză profitabilitate/consum/temperaturi/reguli magazin și consimțământ explicit. Nu se colectează chei private/seed phrases și nu se face custodie de portofel.

### Stare tehnică verificată în această conversație
- Repository: `Vasilecatalinprodan-tech/Dr.-Vas-AI`, branch implicit `main`.
- Ultimul commit cunoscut: `aad64a3100e6189a36b7a2e2048bc41b29dfaf46` (archive handoff Jan portrait).
- `www/index.html` SHA verificat la 2026-11-06: `a63a7ad6914da588f2aa4261b4527efff8dbc168`.
- Codul curent are deja selectorul cu imagini Dr.Jan/Sarah care folosesc un URL semnat Runway temporar pentru Jan și imaginea Sarah; nu a fost încă înlocuit cu asset-uri locale permanente.
- Codul are scena Live și animații CSS pentru avatar/wave, dar acestea nu constituie lip-sync realist pentru portrete fotografice.
- Portretele atașate sunt valide JPEG RGB, ambele 928×1152 px. Versiuni optimizate de lucru generate local: 720×894 px, Sarah 55,271 bytes și Jan 62,028 bytes. Nu sunt încărcate în repository.
- Nu a fost creat PR, nu a fost făcut merge sau deploy pentru integrarea noilor fișiere în acest checkpoint.
- Runway account conectat, dar instrumentul de status a raportat că modelele video nu sunt disponibile în workspace; 492 credite plan, 0 credite cumpărate. Nu cumpăra plan/credite fără aprobarea utilizatorului.
- Fișierele sursă sunt atașamentele curente; căi runtime la momentul verificării: `/mnt/data/Sarah23.jpg` și `/mnt/data/drjan.jpg`.

### Plan obligatoriu pentru următoarea sesiune
1. Reia de la acest checkpoint, fără să ceri utilizatorului să repete cerințele.
2. Transferă binarele în repository `www/assets/presenters/sarah.jpg` și `www/assets/presenters/dr-jan.jpg` (optimizate și validate).
3. Actualizează `www/index.html`: prezentare, selector și Live stage trebuie să folosească aceleași asset-uri locale permanente; păstrează fotografia fondatorului.
4. Adaugă animație de vorbire corelată cu starea audio pentru portretele fotografice (puls/mișcare discretă și wave). Pentru lip-sync realist, folosește numai un motor video/lip-sync disponibil și aprobat; dacă nu este disponibil, marchează funcția ca neimplementată, nu simula promisiunea.
5. Adaugă teste pentru încărcarea locală a imaginilor (naturalWidth > 0), selector, prezentare, Live stage, fallback și lipsa URL-urilor semnate Runway în cod.
6. Rulează suitele relevante; repară orice eșec înainte de merge.
7. Creează PR, verifică workflow-urile, merge și deploy autonom după succes; verifică URL-ul de producție, smoke test și versiunea Worker. Nu declara succes fără probe.
8. Continuă restul platformei în ordinea priorităților documentate: securitate/izolare, UX web+Android, voce TTS, Health, Studio, Academy, Commerce, Business.
9. Crypto: începe cu studiu de fezabilitate. Utilizatorul trebuie întrebat ce monedă vrea să mineze (BTC, XMR sau alta) înainte de orice implementare de mining. Bitcoin mining pe dispozitive obișnuite este în general necompetitiv; nu porni procese în fundal, nu afecta telefonul/laptopul și nu introduce mining ascuns.

### Reguli permanente
- Platformă integrată, nu proiecte separate.
- Dr.Vas Free/Health publice; modulele comerciale rămân pilot privat/admin până când entitlements/billing sunt sigure.
- Health este informativ și nu înlocuiește clinicianul/serviciile de urgență.
- Păstrează izolarea tenant/RLS, autorizarea server-side, audit și fail-safe.
- Fără costuri, credite plătite, modificări de secrete sau migrații de producție fără aprobare.
- Nu cere confirmare intermediară pentru merge/deploy după validare; utilizatorul a autorizat explicit acest flux.
- Utilizatorul dorește ca acest chat și toate deciziile/progresul să fie arhivate pentru a putea începe un chat nou fără pierderea continuității.
