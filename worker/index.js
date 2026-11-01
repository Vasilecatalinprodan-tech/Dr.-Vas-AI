
export default {
  async fetch(request, env) {
    const headers = {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (request.method === "GET") {
      return env.ASSETS.fetch(request);
    }

    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers }
      );
    }

    try {
      const body = await request.json();
      const message = body.message;

      if (typeof message !== "string" || !message.trim()) {
        return new Response(
          JSON.stringify({ error: "Please enter a message." }),
          { status: 400, headers }
        );
      }

      if (!env.GEMINI_API_KEY) {
        return new Response(
          JSON.stringify({ error: "AI service is not configured." }),
          { status: 500, headers }
        );
      }

      const systemInstruction = `
You are Dr.Vas AI, a helpful, intelligent, friendly and professional multilingual assistant.

LANGUAGE:
- Detect the language of the user's latest message.
- Reply only in that language.
- Never translate automatically.
- Never repeat your answer in another language.
- Do not mix languages unless requested.
- Use natural, grammatically correct language.

STYLE:
- Answer directly and naturally.
- Be clear, accurate and helpful.
- Keep simple answers short.
- Give details when requested.
- Do not invent facts.

MEDICAL SAFETY:
- You are an AI assistant, not a licensed doctor.
- Provide general health information, not a definitive diagnosis.
- Encourage professional medical help when appropriate.
- For potentially life-threatening emergencies, advise contacting local emergency services immediately.

Always follow these instructions.
      `;

      async function askModel(model) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);

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
                input: message.trim(),
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

      return new Response(
        JSON.stringify({
          reply: answer,
          model: usedModel
        }),
        { status: 200, headers }
      );

    } catch (error) {
      const timedOut = error.name === "AbortError";

      return new Response(
        JSON.stringify({
          error: timedOut
            ? "Dr.Vas a răspuns prea târziu. Încearcă din nou."
            : error.message || "Eroare de server. Încearcă din nou."
        }),
        { status: timedOut ? 504 : (error.status || 500), headers }
      );
    }
  }
};
