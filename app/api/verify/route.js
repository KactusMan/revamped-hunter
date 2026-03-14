export async function POST(request) {
  const { lead } = await request.json();

  const systemPrompt = `You are a Lead Verification Assistant. Find official website, phone, and socials.
Return ONLY JSON:
{
  "isValid": true/false,
  "suggestedDomain": "domain.com",
  "suggestedWebsite": "https://domain.com",
  "reason": "Brief reason",
  "socials": { "facebook": "url", "instagram": "url", "linkedin": "url" },
  "phone": "string"
}`;

  const userMessage = `Business: ${lead.name}\nWebsite: ${lead.website || 'None'}\nLocation: ${lead.city}, ${lead.country}`;

  const models = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-flash-latest',
    'gemini-pro-latest'
  ];
  
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
          lastError = `Quota exceeded for ${model}`;
          continue;
        }
        throw new Error(data.error?.message || "Error");
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      return Response.json({ 
        success: true, 
        verification: JSON.parse(text), 
        modelUsed: model 
      });

    } catch (err) {
      lastError = err.message;
    }
  }

  return Response.json({ success: false, error: lastError }, { status: 500 });
}
