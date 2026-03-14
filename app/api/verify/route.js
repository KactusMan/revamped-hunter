export async function POST(request) {
  const { lead } = await request.json();

  const systemPrompt = `You are a Lead Verification Assistant. Your job is to check if the provided website for a business is likely their official, most professional domain.
If the website is a Linktree, a Facebook page, or a parked domain, suggest a real, standalone professional website if one exists.

Return ONLY a JSON object:
{
  "isValid": true/false,
  "suggestedDomain": "actual-domain.com",
  "suggestedWebsite": "https://actual-domain.com",
  "reason": "Brief reason",
  "socials": { "facebook": "url or null", "instagram": "url or null", "linkedin": "url or null" },
  "phone": "string or null"
}`;

  const userMessage = `Business: ${lead.name}\nWebsite: ${lead.website || 'None'}\nLocation: ${lead.city}, ${lead.country}`;

  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
  let lastError = null;

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: userMessage }] }],
            generationConfig: { response_mime_type: "application/json" }
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          lastError = "Quota exceeded";
          continue;
        }
        throw new Error(data.error?.message || "Error");
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      return Response.json({ success: true, verification: JSON.parse(text), modelUsed: model });

    } catch (err) {
      lastError = err.message;
    }
  }

  return Response.json({ success: false, error: lastError }, { status: 500 });
}
