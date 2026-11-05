# Dr.Vas — checkpoint prezentare animată

Data: 5 noiembrie 2026
Ramură: founder-workbenches-development

Cererea fondatorului: prezentarea să fie realizată de Dr.Vas, Dr.Jan și Sarah, câte două module fiecare, într-o fereastră animată, apoi revenire la conectare și alegerea modulelor.

Implementare:
- Buton public pe pagina inițială, înainte de conectare; butonul din zona modulelor rămâne disponibil.
- Fereastră modală animată, fundal întunecat, progres în trei pași, avatar animat și două carduri de module pentru vorbitorul curent.
- Dr.Vas: Free + Health. Dr.Jan: Studio + Business. Sarah: Academy + Commerce.
- Trei segmente vocale în limba selectată, prin Speech Synthesis din browser; tonalități diferite și voci instalate diferite când sunt disponibile. Calitatea vocii depinde de browser și dispozitiv; nu este clonare vocală.
- După final, revine prin fluxul existent: autentificare pentru vizitatorii fără sesiune și alegerea modulelor pentru utilizatorii conectați. Utilizatorul poate continua manual dacă nu dorește să asculte tot.
- Test Playwright extins pentru opt limbi, șase module, ordinea prezentatorilor și revenirea la flux.

Nu au fost schimbate autentificarea, drepturile, baza de date, secretele sau producția. Nu s-a făcut merge sau deploy. Testele CI pentru această versiune sunt încă în așteptare.

Acesta este un checkpoint tehnic, nu transcrierea integrală a conversației ChatGPT. Conversația originală rămâne în istoricul ChatGPT.

## CI finding and correction

The first CI run for this feature executed 41 browser tests: 40 passed and the new presentation test failed because the modal was nested inside the module dashboard, which is hidden before sign-in. The modal was moved outside that hidden dashboard, and the regression test now clicks the public landing-page presentation button itself. A fresh CI run is required before this feature can be called verified. No merge or production deployment has been made.