const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const LEADS_DATA_FILE = path.join(__dirname, 'lib/leadsData.js');
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('Error: GEMINI_API_KEY not found in .env.local');
  process.exit(1);
}

async function verifyLead(lead) {
  const systemPrompt = `You are a Lead Verification Assistant. Find the official website, phone number, and social media (FB/IG) for this business. Return ONLY JSON: {"isValid":true,"suggestedWebsite":"url","phone":"string","socials":{"facebook":"url","instagram":"url"}}`;
  const userMessage = `Business: ${lead.name}, Location: ${lead.city}, ${lead.country}`;

  // Try Flash first, then Pro
  const models = ['gemini-2.0-flash', 'gemini-1.5-pro'];
  
  for (const model of models) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userMessage }] }],
          generationConfig: { response_mime_type: "application/json" }
        })
      });

      const data = await response.json();
      if (!response.ok) continue;

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      return JSON.parse(text);
    } catch (e) {
      continue;
    }
  }
  return null;
}

async function run() {
  console.log('--- Starting Batch Verification ---');
  const content = fs.readFileSync(LEADS_DATA_FILE, 'utf-8');
  const leadArrayMatch = content.match(/export const LEADS = (\[[\s\S]*?\]);/s);
  const leads = new Function(`return ${leadArrayMatch[1]}`)();

  console.log(`Processing ${leads.length} leads... This will take a while to respect rate limits.`);

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    
    // Only verify if phone or socials are missing
    if (!lead.phone || !lead.socials?.facebook) {
      console.log(`[${i+1}/${leads.length}] Verifying: ${lead.name}...`);
      const result = await verifyLead(lead);
      
      if (result) {
        leads[i].phone = result.phone || lead.phone;
        leads[i].website = result.suggestedWebsite || lead.website;
        leads[i].socials = { ...leads[i].socials, ...result.socials };
        leads[i].hasWebsite = !!leads[i].website;
        console.log(`   -> Found: ${leads[i].phone || 'No phone'} | ${leads[i].website || 'No site'}`);
      }

      // Wait 3 seconds between requests to stay safe on Free Tier
      await new Promise(r => setTimeout(r, 3000));
    } else {
      console.log(`[${i+1}/${leads.length}] Skipping (already verified): ${lead.name}`);
    }

    // Every 10 leads, save progress
    if ((i + 1) % 10 === 0) {
      fs.writeFileSync(LEADS_DATA_FILE, `export const LEADS = ${JSON.stringify(leads, null, 2)};`);
      console.log('   (Progress saved)');
    }
  }

  fs.writeFileSync(LEADS_DATA_FILE, `export const LEADS = ${JSON.stringify(leads, null, 2)};`);
  console.log('--- Batch Verification Complete! ---');
  console.log('Now run "node export_leads.js" to get your final Excel file.');
}

run();
