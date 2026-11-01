export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }
if (request.method === "GET") {
  return env.ASSETS.fetch(request);
}
    if (request.method !== "POST") {
      return new Response("Dr.Vas AI server is running");
    }

    try {
      const { message } = await request.json();

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY
          },
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

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        status: response.status
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Server error" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
  }
};