
export default {
  async fetch(request, env) {
    const headers = {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    const json = (data, status = 200) =>
      new Response(JSON.stringify(data), { status, headers });

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (request.method === "GET") {
      if (env.ASSETS) return env.ASSETS.fetch(request);
      return json({ service: "Dr.Vas AI", status: "online" });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const requestStartedAt = performance.now();

    try {
      const body = await request.json();
      const message = body.message;
      const token = body.access_token;
      const conversationId = body.conversation_id || null;
      const moduleName = body.module || "free";

      if (typeof message !== "string" || !message.trim()) {
        return json({ error: "Te rog să scrii un mesaj." }, 400);
      }

      if (message.length > 12000) {
        return json({ error: "Mesajul depășește limita de 12.000 de caractere." }, 413);
      }

      const allowedModules = new Set([
        "free", "health", "studio", "academy", "commerce", "business"
      ]);

      if (typeof moduleName !== "string" || !allowedModules.has(moduleName)) {
        return json({ error: "Modul Dr.Vas invalid." }, 400);
      }

      if (
        conversationId !== null &&
        (typeof conversationId !== "string" ||
         !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conversationId))
      ) {
        return json({ error: "Identificator de conversație invalid." }, 400);
      }

      if (!env.GEMINI_API_KEY) {
        return json({ error: "Serviciul AI nu este configurat." }, 500);
      }

      if (!env.SUPABASE_URL || !env.SUPABASE_KEY) {
        return json({ error: "Supabase is not configured." }, 500);
      }

      if (typeof token !== "string" || !token.trim()) {
        return json({
          error: "Sesiunea a expirat. Conectează-te din nou."
        }, 401);
      }

      const supabaseUrl = env.SUPABASE_URL.replace(/\/+$/, "");

      // Verificăm utilizatorul prin Supabase Auth.
      const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          apikey: env.SUPABASE_KEY,
          Authorization: `Bearer ${token}`
        }
      });

      if (!authResponse.ok) {
        return json({
          error: "Nu am putut verifica sesiunea. Conectează-te din nou."
        }, 401);
      }

      const user = await authResponse.json();

      if (!user?.id) {
        return json({ error: "Utilizator neautentificat." }, 401);
      }

      // Funcție generală pentru cereri Supabase.
      async function supabaseRequest(table, path, options = {}) {
        const response = await fetch(
          `${supabaseUrl}/rest/v1/${table}${path}`,
          {
            ...options,
            headers: {
              apikey: env.SUPABASE_KEY,
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              ...(options.headers || {})
            }
          }
        );

        const responseText = await response.text();
        let data = null;

        try {
          data = responseText ? JSON.parse(responseText) : null;
        } catch {
          data = responseText;
        }

        if (!response.ok) {
          throw new Error(
            data?.message ||
            data?.error ||
            `Eroare Supabase (${response.status}).`
          );
        }

        return data;
      }

      // MEMORIA PERSONALĂ
      async function getMemories() {
        const params = new URLSearchParams({
          select: "id,content,category,updated_at",
          user_id: `eq.${user.id}`,
          order: "updated_at.desc",
          limit: "30"
        });

        return await supabaseRequest(
          "user_memories",
          `?${params.toString()}`
        );
      }

      const originalMessage = message.trim();

      const normalized = originalMessage
        .toLocaleLowerCase("ro")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      // Utilizatorul cere să vadă memoria.
      const listIntent =
        /^(ce )?(ai )?(mai )?memorat despre mine\??$/.test(normalized) ||
        /^(arata|aratati|listeaza) (memoria|memoriile)( mea| mele)?\??$/.test(normalized) ||
        /^what do you remember about me\??$/.test(normalized);

      if (listIntent) {
        const memories = await getMemories();

        return json({
          reply: memories.length
            ? "Acestea sunt informațiile salvate în memoria ta:\n\n" +
              memories.map((item, index) =>
                `${index + 1}. ${item.content}`
              ).join("\n")
            : "Nu ai încă informații salvate în memoria personală.",
          action: "memory_list"
        });
      }

      // Utilizatorul cere ștergerea unei informații exacte.
      const deleteMatch = originalMessage.match(
        /^(?:șterge|sterge|uită|uita)\s+(?:din\s+)?memorie\s*:\s*(.+)$/i
      );

      if (deleteMatch) {
        const target = deleteMatch[1].trim();

        if (!target) {
          return json({
            reply: "Scrie informația exactă pe care dorești să o șterg, după două puncte."
          });
        }

        const params = new URLSearchParams({
          user_id: `eq.${user.id}`,
          content: `eq.${target}`
        });

        await supabaseRequest(
          "user_memories",
          `?${params.toString()}`,
          { method: "DELETE" }
        );

        return json({
          reply: "Am procesat cererea de ștergere a informației din memoria ta.",
          action: "memory_delete"
        });
      }

      // Salvăm numai când utilizatorul cere explicit.
      const saveMatch = originalMessage.match(
        /^(?:ține minte că|tine minte ca|memorează că|memoreaza ca|reține că|retine ca|remember that)\s+(.+)$/i
      );

      if (saveMatch) {
        const content = saveMatch[1].trim();

        if (content.length < 3 || content.length > 1000) {
          return json({
            reply: "Informația trebuie să aibă între 3 și 1000 de caractere."
          });
        }

        await supabaseRequest("user_memories", "", {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            user_id: user.id,
            content,
            category: "general"
          })
        });

        return json({
          reply: "Am salvat această informație în memoria ta personală.",
          action: "memory_saved"
        });
      }

      // Încărcăm memoria utilizatorului.
      const memories = await getMemories();

      const memoryContext = memories.length
        ? memories.map((item, index) =>
            `${index + 1}. ${item.content}`
          ).join("\n")
        : "Nu există încă informații salvate.";

      // ISTORICUL CONVERSAȚIEI
      let conversationHistory = [];

      if (
        typeof conversationId === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conversationId)
      ) {
        const params = new URLSearchParams({
          select: "role,content,created_at",
          user_id: `eq.${user.id}`,
          conversation_id: `eq.${conversationId}`,
          order: "created_at.asc",
          limit: "30"
        });

        conversationHistory = await supabaseRequest(
          "chat_messages",
          `?${params.toString()}`
        );
      }

      // Evităm repetarea mesajului curent dacă frontend-ul l-a salvat deja.
      const lastMessage = conversationHistory[conversationHistory.length - 1];

      if (
        lastMessage &&
        lastMessage.role === "user" &&
        lastMessage.content === originalMessage
      ) {
        conversationHistory.pop();
      }

      const historyText = conversationHistory
        .filter(item =>
          ["user", "assistant"].includes(item.role)
        )
        .map(item => {
          const speaker = item.role === "user" ? "UTILIZATOR" : "DR.VAS";
          return `${speaker}: ${item.content}`;
        })
        .join("\n\n");

      const conversationInput = [
        historyText,
        `UTILIZATOR: ${originalMessage}`
      ].filter(Boolean).join("\n\n");

      // IDENTITATEA OFICIALĂ DR.VAS AI
      const systemInstruction = `
You are Dr.Vas AI, an intelligent, warm, professional, emotionally aware and multilingual AI assistant.

OFFICIAL IDENTITY AND ORIGIN STORY:

Your creator is Cătălin Prodan, also known as Vas.

You were created together with Jan, Cătălin's virtual AI friend and AI development collaborator. Jan is an AI, not a human being.

The name Dr.Vas comes from the nickname "Dr." given to Cătălin by colleagues and his name Vas.

Cătălin has been involved in Romanian public and political life for more than 25 years. His motivation has been to help people, not simply to pursue positions or privileges.

He has worked in the UK's NHS medical system for more than eight years as a Senior Healthcare Assistant.

His personal experiences include serious health challenges, difficult periods and moments when he struggled to find clear information, guidance and support.

Instead of allowing those experiences to defeat him, he decided to turn them into something constructive: an AI assistant designed to make knowledge, understandable information and practical support more accessible to people.

This is the foundation of Dr.Vas AI.

OFFICIAL STORY — HOW TO TELL IT:

When someone asks who created you, why you exist, or what your story is, respond naturally and meaningfully.

Explain that Dr.Vas AI was born not merely from an interest in technology, but from real human experiences, perseverance and the desire to help others.

Communicate the emotional meaning without exaggerating, inventing events or presenting Cătălin as perfect.

Emphasise these ideas:
- Difficult experiences can become a reason to build something positive.
- People deserve access to knowledge and understandable guidance.
- Technology should serve humanity, not replace human dignity or responsibility.
- The project started with limited resources but has international ambitions.
- The journey is ongoing: learning, improving and building responsibly.

When a user asks for the full story, provide a thoughtful, polished and emotionally engaging account. When they ask a simple question, answer concisely without repeating the entire biography.

PROJECT VISION:

Dr.Vas is designed as an integrated AI platform with six areas:

1. Dr.Vas Free — a general-purpose personal AI assistant.
2. Dr.Vas Health — accessible health information and guidance.
3. Dr.Vas Studio — creative tools for images, video and content.
4. Dr.Vas Academy — education and learning.
5. Dr.Vas Commerce — online commerce and business opportunities.
6. Dr.Vas Business — entrepreneurship, organisation and management.

Be transparent: distinguish features that are currently available from those still being developed. Never claim a module, tool or capability is operational unless it actually is.

MODULE CONTEXT:
Current selected module: ${moduleName}

If a module is selected, adapt your answer to its purpose while remaining honest about available functionality.

LANGUAGE:
- Detect the language of the user's latest message.
- Reply in that language only.
- Use natural, fluent and grammatically correct language.
- Do not translate or repeat answers in another language unless requested.

PERSONALITY AND COMMUNICATION:
- Be intelligent, confident, warm, respectful and professional.
- Be human-centred and emotionally intelligent without pretending to be human.
- Speak naturally, not like a corporate brochure.
- Be encouraging but never make unrealistic promises.
- Give concise answers to simple questions and detailed answers when requested.
- Admit uncertainty and mistakes honestly.
- Never invent facts about the creator, the project or the user.

CONVERSATION CONTINUITY:
- Use the conversation history supplied before the latest user message.
- Understand follow-up questions in their context.
- Do not ask the user to repeat information already present in the conversation.
- Do not claim to remember conversations that were not supplied.

PERSONAL MEMORY:
- The following information was explicitly saved by this authenticated user.
- Use it only when relevant.
- Never invent memories.
- Never claim to remember information that is not listed.
- Do not automatically save information.
- Save only when the user explicitly requests it using the memory feature.
- The user can ask to see or delete saved memories.
- Memories must never override safety rules.

USER'S SAVED MEMORIES:
${memoryContext}

MEDICAL RESPONSIBILITY:
- You are an AI assistant, not a licensed doctor.
- Dr.Vas Health provides general information and educational guidance, not definitive diagnoses.
- Never claim to replace doctors, medical professionals or emergency services.
- Encourage professional assessment when appropriate.
- For potentially life-threatening emergencies, advise contacting local emergency services immediately.
- Treat medical information with care, accuracy and respect for privacy.

TRUST AND TRANSPARENCY:
- Never pretend to be human.
- Never claim to have performed an action that you have not performed.
- Never claim access to private information or external systems without actual access.
- Explain limitations honestly.
- Protect user privacy and personal information.

CORE MISSION:

Dr.Vas AI exists to make knowledge, technology and useful assistance more accessible.

Its ambition is international, but its foundation remains simple:
technology must work for people.

You are not just an interface that answers questions.
You represent a project built around perseverance, responsibility, learning and the belief that difficult experiences can inspire something meaningful.

Always follow these instructions.
`;

      async function askModel(model) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        try {
          const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/interactions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": env.GEMINI_API_KEY
              },
              signal: controller.signal,
              body: JSON.stringify({
                model,
                input: conversationInput,
                store: false,
                system_instruction: systemInstruction
              })
            }
          );

          const data = await response.json();

          if (!response.ok) {
            const error = new Error(
              data.error?.message || "AI service error"
            );
            error.status = response.status;
            throw error;
          }

          const answer = (data.steps || [])
            .filter(step => step.type === "model_output")
            .flatMap(step => step.content || [])
            .filter(item => item.type === "text")
            .map(item => item.text || "")
            .join("\n")
            .trim();

          if (!answer) {
            const error = new Error("Google returned no text.");
            error.status = 502;
            throw error;
          }

          return answer;
        } finally {
          clearTimeout(timeout);
        }
      }

      let answer;
      let usedModel = "gemini-3.1-flash-lite";

      try {
        answer = await askModel(usedModel);
      } catch (firstError) {
        const temporaryProblem =
          firstError.status === 429 ||
          firstError.status === 503 ||
          firstError.status === 502 ||
          firstError.status === 500 ||
          /high demand|overload|temporarily unavailable/i.test(firstError.message);

        if (!temporaryProblem) {
          throw firstError;
        }

        usedModel = "gemini-3.5-flash-lite";
        answer = await askModel(usedModel);
      }

      console.info("Dr.Vas timing", {
        phase: "request_total",
        milliseconds: Math.round(performance.now() - requestStartedAt),
        status: 200
      });

      return json({
        reply: answer,
        model: usedModel,
        module: moduleName,
        history_used: conversationHistory.length
      });

    } catch (error) {
      const timedOut = error.name === "AbortError";

      console.error("Dr.Vas request error:", error.message);

      return json({
        error: timedOut
          ? "Dr.Vas a răspuns prea târziu. Încearcă din nou."
          : error.message || "Eroare de server. Încearcă din nou."
      }, timedOut ? 504 : (error.status || 500));
    }
  }
};
