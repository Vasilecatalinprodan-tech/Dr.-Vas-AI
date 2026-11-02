# Dr.Vas AI — Project handoff and recovery notes

Last updated: 2026-11-02

This file is the durable project checkpoint. Update it whenever a meaningful decision, code change, deployment, or test is completed.

## 1. Repository and current working environment

- GitHub repository: `Vasilecatalinprodan-tech/Dr.-Vas-AI`
- Working branch: `drvas-integrated-platform`
- Codespaces workspace: `https://dark-cadaver-96x79prqw4x53pgqj.github.dev/`
- Current preview URL: `https://dark-cadaver-96x79prqw4x53pgqj-8000.app.github.dev`
- Production Cloudflare Worker URL: `https://dr--vas-ai.vasilecatalinprodan.workers.dev`
- Open pull request: `https://github.com/Vasilecatalinprodan-tech/Dr.-Vas-AI/pull/1`

## 2. Verified state on 2026-11-02

- Codespaces container rebuild was initiated and completed sufficiently for terminal work to continue.
- In the terminal, the project directory is `/workspaces/Dr.-Vas-AI`.
- A Python static preview server was started with:
  ```bash
  nohup python3 -m http.server 8000 --directory www --bind 0.0.0.0 > /tmp/drvas-preview.log 2>&1 < /dev/null &
  ```
- Test command:
  ```bash
  curl -s -o /dev/null -w "%{http_code}\\n" http://127.0.0.1:8000
  ```
- The user confirmed the result was `200`.
- Current preview address is the URL listed above. The user supplied that address in chat.
- This verifies the local static page server responds. It does NOT by itself verify AI chat, authentication, Supabase, Gemini, the production Worker, or an Android build.
- Port 8000 may be private or public depending on the Codespaces Ports settings. Do not assume visibility without checking.

## 3. Recent repository commits

Branch: `drvas-integrated-platform`

- `ed3c3d5748d06782ba6655962f79179aa22f8972` — added `.devcontainer/devcontainer.json` to forward port 8000 and start a static preview server after container start.
- `affe54cf366eafc5e31bd311b4a61d9c78a21c21` — added GET health endpoint in `worker/index.js` for `/health` and `/healthz`. It reports Worker status and whether assets, AI key, and database configuration are present.
- The health endpoint change is in the branch but has NOT been confirmed deployed to production. Do not claim the live production URL serves the new endpoint until it is deployed and tested.

## 4. Project vision and product decisions

Build ONE integrated Dr.Vas platform, with a web experience and Android app, not a collection of unrelated projects.

Planned modules:

1. **Dr.Vas Free** — general AI assistant for everyday questions, intended to remain free.
2. **Dr.Vas Health / Medical** — free general health information and education. It must not claim to diagnose or replace a doctor. Future clinical workflows must involve qualified clinicians, clinics, hospitals, appropriate consent, and legal/regulatory compliance.
3. **Dr.Vas Studio** — create professional video and social-media content for TikTok, YouTube, Facebook, and Instagram, following the user's ideas and scripts. Initial creative direction discussed: Romanian drama series about secrets and betrayal, realistic live-action/film feel; a concept of two episodes per day was discussed.
4. **Dr.Vas Academy** — education for entrepreneurs, from beginners to more established operators, with a modest paid subscription considered.
5. **Dr.Vas Commerce** — e-commerce and dropshipping learning/support, including low-capital business ideas.
6. **Dr.Vas Business & Management** — paid business guidance, organisation, management, and accounting-related support (without misrepresenting regulated professional services).

Free general assistant and general Health information are intended to be free. Commercial modules may become paid. Premium access must be enforced on the server, not merely hidden in the interface. Billing/subscriptions are not yet implemented.

## 5. Technical architecture and known configuration

- Frontend: `www/index.html` and static assets in `www/`.
- Worker entry: `worker/index.js`.
- Cloudflare config: `wrangler.toml` (Worker name shown as `drvas-ai`, main `worker/index.js`, assets from `./www`, binding `ASSETS`).
- App packaging: Capacitor Android, configured with `www` as web assets.
- Backend services: Supabase authentication/database and a Gemini API endpoint called by the Worker.
- Frontend API base URL currently points to `https://dr--vas-ai.vasilecatalinprodan.workers.dev`.
- Supabase project URL: `https://bqgshoqspcfbflgsnntn.supabase.co`.
- Worker secrets are configured by name: `SUPABASE_URL`, `SUPABASE_KEY`, `GEMINI_API_KEY`. Never put secret values in source files, chat, commits, screenshots, or this handoff document.

Known AI endpoint/model configuration previously inspected:
- Gemini endpoint: `https://generativelanguage.googleapis.com/v1beta/interactions`
- Primary model: `gemini-3.1-flash-lite`
- Fallback noted in code: `gemini-3.5-flash-lite`
- Worker validates Supabase JWT; frontend sends message/module/conversation_id/access_token.

## 6. Current functionality and limitations to verify

- Frontend and landing page exist in `www/index.html`.
- Supabase email/password authentication exists. Signup currently uses an email confirmation link (`emailRedirectTo`), not a numeric email verification code.
- Chat history is saved in Supabase. Messages are plaintext at rest at the application layer; application-layer encryption and end-to-end encryption are NOT implemented. Never describe conversations as end-to-end encrypted.
- Permanent AI memory should only be added when the user explicitly asks for something to be remembered.
- Founder-story response is implemented as a deterministic response in `worker/index.js` / system instruction. It identifies Cătălin Prodan (“Vas”) as founder, explains that “Dr.” is a nickname and that he is not a doctor, and describes his background and motivation without presenting him as a medical professional.
- No confirmed production deployment of the latest branch changes.
- No confirmed working end-to-end AI chat test in the current session.
- No confirmed working Android APK installation/build from the current branch.
- No billing provider/subscription implementation yet.

## 7. Founder and brand story constraints

- Founder: Cătălin Prodan (“Vas”).
- “Dr.” is a nickname, not a medical qualification. The product and founder must never imply that the founder is a physician.
- The origin story includes the founder's public/political work in Botoșani and more than eight years of UK care work, and the idea of building a useful AI platform from limited resources.
- The AI assistant “Jane” is an AI collaborator, not a human co-founder.
- Keep the story respectful and factual; do not expose private health or family information in public-facing copy.

## 8. Immediate next steps

1. Open the current preview URL and visually confirm the Dr.Vas landing page loads.
2. Check the Codespaces **Ports** tab and confirm port 8000 is forwarded. Prefer private visibility unless public access is specifically needed for a test.
3. Test the production Worker separately. Only after deploying the health endpoint should `/health` or `/healthz` be expected to return its JSON health report.
4. Test the user journey in stages: landing page → sign-up/login → free chat → refresh/history → logout.
5. Inspect Worker logs and Supabase responses for failures; never ask the user to paste API keys, JWTs, auth callback query strings, or other secrets.
6. Review security, privacy, consent, abuse prevention, and medical/legal boundaries before any public launch.
7. Validate Android build and installation separately after the web app flow is stable.
8. Add billing and server-side premium entitlements only when the paid-module model is ready.
9. Do not merge the pull request or deploy production without the user's explicit approval.

## 9. Useful terminal commands

From the Codespaces terminal:

```bash
cd /workspaces/Dr.-Vas-AI
git status
git branch --show-current
git pull --ff-only origin drvas-integrated-platform
```

Start or restart the static preview server:

```bash
pkill -f 'python3 -m http.server 8000' || true
nohup python3 -m http.server 8000 --directory www --bind 0.0.0.0 > /tmp/drvas-preview.log 2>&1 < /dev/null &
curl -s -o /dev/null -w "%{http_code}\\n" http://127.0.0.1:8000
```

Expected HTTP result for the static page: `200`.

## 10. Working agreement

- Make progress in small, verifiable steps.
- Clearly distinguish code committed to the branch from code deployed to production.
- Do not claim a feature works until it has been tested.
- Prefer making direct repository edits when possible, then report the exact file and commit.
- Keep the user informed in Romanian with clear, short terminal commands.
- Preserve this handoff document as the ongoing source of truth and update it after important work.
