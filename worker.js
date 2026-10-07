const API_KEY = "AQ.Ab8RN6Kk1aIaij0Zr0X7GqrClgINWWjJIntlueJLrmWP3EK8Kwcontent://com.android.providers.downloads.documents/document/681";

export default {
  async fetch(request) {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS"
    };
    if (!API_KEY) {
      return Response.json({ text: "API kalit fayl ichiga qo‘yilmagan." }, { headers: headers });
    }
    if (request.method === "OPTIONS") return new Response(null, { headers: headers });
    if (request.method !== "POST") return new Response("faqat post", { status: 405, headers: headers });
    const body = await request.json();
    const contents = (body.messages || []).filter(function (msg) {
      return msg.text && msg.text.indexOf("O‘ylayapti") !== 0;
    }).map(function (msg) {
      return { role: msg.role === "bot" ? "model" : "user", parts: [{ text: msg.text }] };
    });
    const models = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
    let last = "Javob yo‘q";
    for (const model of models) {
      const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": API_KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: "Sen ChatUZB yordamchisisan. Savollarga oddiy, hurmatli va tushunarli o‘zbek tilida javob ber." }] },
          contents: contents
        })
      });
      const data = await res.json();
      const text = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts
        ? data.candidates[0].content.parts.map(function (part) { return part.text || ""; }).join("").trim()
        : "";
      if (res.ok && text) return Response.json({ text: text }, { headers: headers });
      last = (data.error && data.error.message) || last;
      if (res.status !== 404) break;
    }
    return Response.json({ text: "Gemini ulanmadi: " + last }, { headers: headers });
  }
};
