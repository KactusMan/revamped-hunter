export async function POST(request) {
  const { lead } = await request.json();

  const systemPrompt = `You are a Lead Verification Assistant. Your job is to check if the provided website for a business is likely their official, most professional domain.
If the website is a Linktree, a Facebook page, or a parked domain, you should suggest a real, standalone professional website if one exists.

Return ONLY a JSON object:
{
  "isValid": true/false,
  "suggestedDomain": "actual-domain.com",
  "suggestedWebsite": "https://actual-domain.com",
  "reason": "Brief reason why it's valid or what's wrong with it",
  "socials": {
    "facebook": "url or null",
    "instagram": "url or null",
    "linkedin": "url or null"
  },
  "phone": "string or null"
}`;

  const userMessage = `Business: ${lead.name}
Current Website: ${lead.website || 'None'}
Location: ${lead.city}, ${lead.country}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userMessage }] }],
          generationConfig: {
            response_mime_type: "application/json"
          }
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error?.message || 'Gemini API Error');
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    // Nuclear clean: Extract raw JSON from possible markdown wrappers
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');

    const parsed = JSON.parse(jsonMatch[0]);
    return Response.json({ success: true, verification: parsed });
  } catch (err) {
    console.error('Verify API error:', err.message);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}


