# Dr.Vas founder voice — recording guide

## Current sample

The file `drvasvoice(1).ogg` currently preserved privately is approximately 4.55 seconds, mono, 16 kHz. It is a useful identity/reference sample, but it is too short for a reliable production voice clone.

## Recommended next recording

For an initial Instant Voice Clone evaluation, prepare 1–2 minutes of clean, continuous speech. ElevenLabs' current documentation states that the combined minimum is 10 seconds, recommends about 1–2 minutes for Instant Voice Cloning, and recommends 30–180 minutes for Professional Voice Cloning. The provider requires voice-owner verification for Professional Voice Cloning. The exact provider and paid plan must be approved by the founder before any account or API integration is created.

## How to record

- Record alone in a quiet room; close windows and switch off TV, radio, fans and music.
- Use the same phone/microphone throughout. Keep it about 15–20 cm from the mouth and slightly off-axis.
- Speak naturally at a steady volume and pace. Do not whisper, shout, imitate another voice or add background music.
- Record one clean take if possible. Avoid cuts, heavy noise reduction, echo and long silences.
- Keep the original file private. Do not upload it to the public GitHub repository.

## Original Romanian reading script (about 1–2 minutes)

Bună ziua. Eu sunt vocea care va însoți platforma Dr.Vas. Vreau să vorbesc clar, calm și natural, astfel încât fiecare persoană să poată înțelege ușor informațiile pe care le primește.

Uneori avem nevoie de un răspuns rapid. Alteori avem nevoie de răbdare, de explicații simple și de cineva care să ne ajute să punem lucrurile în ordine. Dr.Vas trebuie să fie un asistent util, respectuos și atent la nevoile fiecărui utilizator.

Voi explica ideile pas cu pas. Voi pronunța numele, datele și numerele cu grijă. Dacă un subiect este important sau sensibil, voi vorbi mai rar și voi separa informațiile în propoziții scurte.

Te rog să reții că inteligența artificială poate ajuta la informare și organizare, dar nu înlocuiește medicii, specialiștii sau deciziile profesionale. Atunci când este nevoie, voi îndruma utilizatorul către ajutorul potrivit.

Dr.Vas înseamnă acces, claritate și sprijin. Scopul meu este să fac tehnologia mai ușor de folosit pentru oameni, inclusiv pentru cei care preferă să asculte în loc să citească sau să scrie.

Îți mulțumesc că folosești Dr.Vas. Hai să începem!

## Security and integration gate

1. Founder records and reviews the sample.
2. Founder explicitly chooses and approves a voice provider and its data-processing terms.
3. Complete the provider's own voice-owner consent/verification process.
4. Store provider credentials only as Cloudflare Worker secrets; never in `www/index.html` or the public repository.
5. Upload voice material directly to the provider through its secured workflow, not to GitHub.
6. Add a server-side speech endpoint with authentication, rate limits, cost caps, retention/deletion controls and clear AI-generated-voice disclosure.
7. Test Romanian pronunciation, other requested languages, accessibility playback, latency and failure handling before enabling it for users.
