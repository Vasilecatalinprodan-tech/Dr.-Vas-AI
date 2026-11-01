
export default {
  async fetch(request, env) {
    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
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

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);

      let aiResponse;

      try {
        aiResponse = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/interactions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": env.GEMINI_API_KEY
            },
            signal: controller.signal,
            body: JSON.stringify({
              model: "gemini-3.5-flash-lite",
              input: message,
              store: false,
              system_instruction:
                "You are Dr.Vas AI, a helpful, intelligent and friendly multilingual assistant. Always reply in the same language as the user. Be natural, clear, concise and accurate. You are an AI assistant, not a licensed doctor."
            })
          }
        );
      } finally {
        clearTimeout(timeout);
      }

      const data = await aiResponse.json();

      if (!aiResponse.ok) {
        return new Response(
          JSON.stringify({
            error: data.error?.message || "AI service error"
          }),
          { status: aiResponse.status, headers }
        );
      }

      const parts = data.outputs || [];
      const answer = parts
        .flatMap(item => item.content || [])
        .filter(item => item.type === "text")
        .map(item => item.text)
        .join("\n");

      return new Response(
        JSON.stringify({ reply: answer || "Nu am primit un răspuns." }),
        { status: 200, headers }
      );

    } catch (error) {
      const timedOut = error.name === "AbortError";

      return new Response(
        JSON.stringify({
          error: timedOut
            ? "Dr.Vas a răspuns prea târziu. Încearcă din nou."
            : "Eroare de server. Încearcă din nou."
        }),
        { status: timedOut ? 504 : 500, headers }
      );
    }
  }
};
