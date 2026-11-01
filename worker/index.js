
export default {
  async fetch(request, env) {
    const cors = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    if (request.method === "GET") {
      return env.ASSETS.fetch(request);
    }

    if (request.method !== "POST") {
      return new Response("Dr.Vas AI server is running");
    }

    try {
      const { message } = await request.json();

      if (!message || typeof message !== "string") {
        return new Response(
          JSON.stringify({ error: "Please enter a message." }),
          { status: 400, headers: cors }
        );
      }

      let response;

      for (let attempt = 0; attempt < 3; attempt++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);

        try {
          response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": env.GEMINI_API_KEY
              },
              signal: controller.signal,
              body: JSON.stringify({
                systemInstruction: {
                  parts: [{
                    text: "You are Dr.Vas AI, a helpful, intelligent and friendly multilingual assistant. Automatically detect the language of the user's message and always reply in that same language. If the user writes in Romanian, reply in Romanian. Never switch languages unless asked. Be natural, clear, concise and fast. Be accurate and honest. You are an AI assistant, not a licensed doctor."
                  }]
                },
                contents: [{
                  parts: [{ text: message }]
                }],
                generationConfig: {
                  temperature: 0.5,
                  maxOutputTokens: 512
                }
              })
            }
          );
        } catch (error) {
          if (attempt === 2) {
            return new Response(
              JSON.stringify({ error: "AI service timed out. Please try again." }),
              { status: 504, headers: cors }
            );
          }
        } finally {
          clearTimeout(timeout);
        }

        if (response && response.ok) {
          const data = await response.json();
          return new Response(JSON.stringify(data), {
            status: 200,
            headers: cors
          });
        }

        if (response && ![429, 500, 502, 503, 504].includes(response.status)) {
          const errorData = await response.text();
          return new Response(errorData, {
            status: response.status,
            headers: cors
          });
        }

        if (attempt < 2) {
          await new Promise(resolve =>
            setTimeout(resolve, 1000 * (attempt + 1))
          );
        }
      }

      return new Response(
        JSON.stringify({ error: "AI service is busy. Please try again shortly." }),
        { status: response?.status || 503, headers: cors }
      );

    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Server error. Please try again." }),
        { status: 500, headers: cors }
      );
    }
  }
};
