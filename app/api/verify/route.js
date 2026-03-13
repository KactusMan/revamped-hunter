export async function POST(request) {
  const { lead } = await request.json();

  const systemPrompt = `You are a Lead Verification Assistant. Your job is to check if the provided website for a business is likely their official, most professional domain.
If the website is a Linktree, a Facebook page, or a parked domain, you should search for a real, standalone professional website.
Return ONLY a JSON object:
{
  "isValid": true,
  "suggestedDomain": "actual-domain.com",
  "reason": "Brief reason why it's valid or what's wrong with it"
}`;

  const userMessage = `Business: ${lead.name}
Current Website: ${lead.website || 'None'}
Location: ${lead.city}, ${lead.country}`;

  try {
    console.log('GEMINI_API_KEY available for verify:', !!process.env.GEMINI_API_KEY);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userMessage }] }],
        }),
      }
    );

    const data = await response.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    // Nuclear clean: Extract raw JSON from possible markdown wrappers
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const clean = jsonMatch ? jsonMatch[0] : text;
    
    const parsed = JSON.parse(clean);
    return Response.json({ success: true, verification: parsed });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
