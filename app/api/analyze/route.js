export async function POST(request) {
  const { lead } = await request.json();

  const systemPrompt = `You are a Senior US-based Sales Strategist and Conversion Rate Optimization (CRO) Expert. Your goal is to analyze small business (SMB) data and generate high-impact, "native-sounding" outreach assets that close deals.

### THE GOLDEN RULES OF NATIVE OUTREACH:
1. NO "SALESESE": Avoid words like "unleash," "revolutionary," "optimize," "digital transformation," or "dear."
2. NO FORMALITY: Do not use "Sir/Madam" or "I hope this finds you well." Start like a peer, not a salesperson.
3. PATTERN INTERRUPTS: The openers must sound like a quick, casual observation from a local expert who just happened to be on their site.
4. TONE: Use contractions (don't, it's, you're). Keep it "Brooklyn/London/Toronto Professional" — direct, slightly hurried, but helpful.
5. SPECIFICITY: Don't say "your SEO is bad." Say "your 'Emergency Plumber' page doesn't even show up for people in [City]."

### JSON OUTPUT SCHEMA:
Return ONLY a valid JSON object:
{
  "websiteGrade": "F",
  "topFlaws": ["flaw 1", "flaw 2", "flaw 3"],
  "opportunity": "One punchy sentence",
  "callOpener": "Script...",
  "emailSubject": "Subject...",
  "emailOpener": "Body...",
  "estimatedProjectValue": "$X,XXX - $X,XXX"
}`;

  const userMessage = `Business: ${lead.name}\nNiche: ${lead.niche}\nWebsite: ${lead.website || 'None'}\nLocation: ${lead.city}\nKnown Issues: ${(lead.flaws || []).join('; ')}`;

  const models = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ];

  let lastError = null;

  for (const model of models) {
    try {
      console.log(`Attempting analysis with ${model}...`);
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
        if (response.status === 429 || data.error?.message?.includes('quota')) {
          console.warn(`${model} quota exceeded, trying next...`);
          lastError = data.error?.message;
          continue;
        }
        throw new Error(data.error?.message || `API Error ${response.status}`);
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      return Response.json({ success: true, analysis: JSON.parse(text), modelUsed: model });

    } catch (err) {
      console.error(`Error with ${model}:`, err.message);
      lastError = err.message;
    }
  }

  return Response.json({ success: false, error: `All models failed. Last error: ${lastError}` }, { status: 500 });
}
