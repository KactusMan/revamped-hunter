export async function POST(request) {
  const { lead } = await request.json();

  const systemPrompt = `You are a Senior Sales Strategist and CRO Expert. Analyze this lead and generate outreach assets.
Return ONLY a valid JSON object:
{
  "websiteGrade": "A-F",
  "topFlaws": ["flaw 1", "flaw 2", "flaw 3"],
  "opportunity": "punchy sentence",
  "callOpener": "Casual, peer-to-peer phone script",
  "emailSubject": "3-5 words",
  "emailOpener": "2-sentence hook",
  "estimatedProjectValue": "$X,XXX"
}`;

  const userMessage = `Business: ${lead.name}\nNiche: ${lead.niche}\nWebsite: ${lead.website || 'None'}\nLocation: ${lead.city}\nKnown Issues: ${(lead.flaws || []).join('; ')}`;

  // FALLBACK LIST based on confirmed available models
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
            generationConfig: { 
              temperature: 0.7, 
              maxOutputTokens: 2048,
              response_mime_type: "application/json"
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429 || data.error?.message?.toLowerCase().includes('quota')) {
          lastError = `Quota exceeded for ${model}`;
          continue;
        }
        throw new Error(data.error?.message || `API Error ${response.status}`);
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      return Response.json({ 
        success: true, 
        analysis: JSON.parse(text), 
        modelUsed: model 
      });

    } catch (err) {
      lastError = err.message;
    }
  }

  return Response.json({ success: false, error: `All models failed. Last error: ${lastError}` }, { status: 500 });
}
