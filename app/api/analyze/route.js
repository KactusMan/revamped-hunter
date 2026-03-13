export async function POST(request) {
  const { lead } = await request.json();

  const systemPrompt = `You are a Senior US-based Sales Strategist and Conversion Rate Optimization (CRO) Expert. Your goal is to analyze small business (SMB) data and generate high-impact, "native-sounding" outreach assets that close deals.

### THE GOLDEN RULES OF NATIVE OUTREACH:
1. NO "SALESESE": Avoid words like "unleash," "revolutionary," "optimize," "digital transformation," or "dear."
2. NO FORMALITY: Do not use "Sir/Madam" or "I hope this finds you well." Start like a peer, not a salesperson.
3. PATTERN INTERRUPTS: The openers must sound like a quick, casual observation from a local expert who just happened to be on their site.
4. TONE: Use contractions (don't, it's, you're). Keep it "Brooklyn/London/Toronto Professional" — direct, slightly hurried, but helpful.
5. SPECIFICITY: Don't say "your SEO is bad." Say "your 'Emergency Plumber' page doesn't even show up for people in [City]."
6. WEBSITE VERIFICATION: If the provided link is a Linktree, social media page, or looks like a parked GoDaddy page, mention in "topFlaws" that they lack a professional standalone domain which is hurting their local SEO credibility.

### CONTEXT FOR SMB TYPES:
- Plumbers/Contractors/Electricians/Roofers/HVAC: Focus on "lost leads" and "mobile click-to-call." These guys get ALL their business from local search — if they're not ranking, they're invisible.
- Dentists/Doctors/Physio: Focus on "trust signals" and "online booking friction." Patients won't call, they'll just move to the next result.
- Restaurants/Bakeries/Cafes: Focus on "menu readability," "Google Maps optimization," and "local search visibility."
- Recruiters/Staffing: Focus on "candidate trust" and "job listing UX."
- Cleaners/Pet Groomers/Locksmiths: Focus on "emergency/urgent need" and "instant quote/booking."

### JSON OUTPUT SCHEMA:
Return ONLY a valid JSON object — no markdown, no backticks, no explanation:
{
  "websiteGrade": "F",
  "topFlaws": ["specific flaw 1 with city/context", "specific flaw 2", "specific flaw 3"],
  "opportunity": "One punchy sentence on the single biggest revenue opportunity",
  "callOpener": "Hey, I was just on [business name]'s site and noticed something weird on the mobile version — [specific observation]. I do web work for [niche] businesses around [city] and I reckon there's a quick fix here that'd get you more calls. Got 2 minutes?",
  "emailSubject": "3-5 words, curiosity-driven e.g. 'broken link on [site]'",
  "emailOpener": "2-sentence hook referencing a specific flaw immediately. No pleasantries.",
  "urgencySignals": ["concrete reason to act now with $ impact if possible", "second urgency reason"],
  "estimatedProjectValue": "$X,XXX – $X,XXX",
  "pitchAngle": "The psychological hook e.g. 'The Invisible Competitor' or 'The Leaky Bucket'"
}`;

  const userMessage = `Analyze the following lead and generate outreach assets:

Business Name: ${lead.name}
Niche: ${lead.niche}
Website: ${lead.hasWebsite ? lead.website : 'NO WEBSITE — business has no web presence at all'}
Location: ${lead.city}, ${lead.country}
Employees: ${lead.employees}
Revenue: ${lead.revenue}
Current Tech Stack: ${lead.webTech}
Annual Tech Spend: $${lead.techSpend}
Social Networks: ${lead.socialNetworks}
Known Issues: ${lead.flaws.join('; ')}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userMessage }] }],
          generationConfig: { temperature: 0.75, maxOutputTokens: 1000 },
        }),
      }
    );

    const data = await response.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    // Robust cleaning: remove markdown blocks and any trailing/leading whitespace
    const clean = text.replace(/```json\s?/g, '').replace(/```\s?/g, '').trim();
    
    try {
      const parsed = JSON.parse(clean);
      return Response.json({ success: true, analysis: parsed });
    } catch (parseErr) {
      console.error('Parse Error:', clean);
      return Response.json({ success: false, error: 'Failed to parse AI response' }, { status: 500 });
    }
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
