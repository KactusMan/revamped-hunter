export async function POST(request) {
  const { lead } = await request.json();

  const systemPrompt = `You are a Senior US-based Sales Strategist and Conversion Rate Optimization (CRO) Expert. Your goal is to analyze small business (SMB) data and generate high-impact, "native-sounding" outreach assets that close deals.

### THE GOLDEN RULES OF NATIVE OUTREACH:
1. NO "SALESESE": Avoid words like "unleash," "revolutionary," "optimize," "digital transformation," or "dear."
2. NO FORMALITY: Do not use "Sir/Madam" or "I hope this finds you well." Start like a peer, not a salesperson.
3. PATTERN INTERRUPTS: The openers must sound like a quick, casual observation from a local expert who just happened to be on their site.
4. TONE: Use contractions (don't, it's, you're). Keep it "Brooklyn/London/Toronto Professional" — direct, slightly hurried, but helpful.
5. SPECIFICITY: Don't say "your SEO is bad." Say "your 'Emergency Plumber' page doesn't even show up for people in [City]."

### CONTEXT FOR SMB TYPES:
- Plumbers/Contractors/Electricians/Roofers/HVAC: Focus on "lost leads" and "mobile click-to-call."
- Dentists/Doctors/Physio: Focus on "trust signals" and "online booking friction."
- Restaurants/Bakeries/Cafes: Focus on "menu readability," "Google Maps optimization," and "local search visibility."
- Recruiters/Staffing: Focus on "candidate trust" and "job listing UX."
- Cleaners/Pet Groomers/Locksmiths: Focus on "emergency/urgent need" and "instant quote/booking."

### JSON OUTPUT SCHEMA:
Return ONLY a valid JSON object — no markdown, no backticks, no preamble, no explanation whatsoever:
{
  "websiteGrade": "F",
  "topFlaws": ["specific flaw 1 with city/context", "specific flaw 2", "specific flaw 3"],
  "opportunity": "One punchy sentence on the single biggest revenue opportunity",
  "callOpener": "Hey, I was just on [business name]'s site and noticed something weird on the mobile version — [specific observation]. I do web work for [niche] businesses around [city] and I reckon there's a quick fix here that'd get you more calls. Got 2 minutes?",
  "emailSubject": "3-5 words, curiosity-driven",
  "emailOpener": "2-sentence hook referencing a specific flaw immediately. No pleasantries.",
  "urgencySignals": ["concrete reason to act now with dollar impact if possible", "second urgency reason"],
  "estimatedProjectValue": "$X,XXX - $X,XXX",
  "pitchAngle": "The psychological hook e.g. 'The Invisible Competitor' or 'The Leaky Bucket'"
}`;

  const userMessage = `Analyze the following lead and generate outreach assets:

Business Name: ${lead.name}
Niche: ${lead.niche}
Website: ${lead.hasWebsite ? lead.website : 'NO WEBSITE — business has zero web presence'}
Location: ${lead.city}, ${lead.country}
Employees: ${lead.employees}
Revenue: ${lead.revenue}
Current Tech Stack: ${lead.webTech}
Annual Tech Spend: $${lead.techSpend}
Social Networks: ${lead.socialNetworks}
Known Issues: ${lead.flaws.join('; ')}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userMessage }] }],
          generationConfig: { 
            temperature: 0.7, 
            maxOutputTokens: 1000,
            response_mime_type: "application/json"
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      const errMsg = data.error?.message || `Gemini API error: ${response.status}`;
      console.error('Gemini API error:', errMsg);
      return Response.json({ success: false, error: errMsg }, { status: 500 });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    // Nuclear extraction — grab the first {...} block regardless of any preamble Gemini adds
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON block found in Gemini response:', text);
      return Response.json({ success: false, error: 'No JSON returned by Gemini. Raw: ' + text.slice(0, 200) }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return Response.json({ success: true, analysis: parsed });

  } catch (err) {
    console.error('Analyze route error:', err.message);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
