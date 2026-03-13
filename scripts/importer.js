const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// --- Configuration ---
const LEADS_PROSPECT_DIR = "D:/rayan's laptop data/personal/pitchdeck/leads-prospect"; // Use forward slashes for cross-platform compatibility
const LEADS_DATA_FILE = path.join(__dirname, '../lib/leadsData.js');
const CSV_FILES = [
  'canada_bakeries_with_contacts_final_20260313200346.csv',
  'uk_plumbers_1_10_employees_20260313195845.csv',
  'ireland_bakeries_1_10_employees_20260313195844.csv'
];

// --- Helper Functions ---

/**
 * Generates a consistent ID for a lead.
 */
function generateId(name) {
  if (!name) return `lead_${Date.now()}_${Math.random()}`;
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 24);
}

/**
 * A placeholder for website scoring logic.
 */
function scoreWebsite(lead) {
  let score = 50;
  if (!lead.hasWebsite) return 5;
  if (lead.webTech && (lead.webTech.includes('Wix') || lead.webTech.includes('GoDaddy'))) score -= 20;
  if (lead.techSpend < 500) score -= 10;
  if (lead.flaws && lead.flaws.length > 2) score -= (lead.flaws.length * 5);
  return Math.max(5, score);
}

/**
 * Transforms a CSV row into the LEADS object format.
 */
function transformRowToLead(row) {
  if (!row.business_name) {
    return null; // Skip rows without a business name
  }
  const hasWebsite = !!row.business_website && !row.business_website.includes('facebook.com');
  let domain = 'N/A';
  try {
    domain = row.business_domain || (hasWebsite ? new URL(row.business_website).hostname.replace('www.', '') : 'N/A');
  } catch(e) {
    // ignore invalid URL
  }


  const lead = {
    id: generateId(row.business_name),
    name: row.business_name,
    domain,
    website: row.business_website || '',
    country: row.business_country_name || 'N/A',
    countryCode: (row.business_country_name || '').toUpperCase().substring(0,2) || 'N/A',
    city: row.business_city_name || 'N/A',
    region: row.business_region || 'N/A',
    industry: row.business_naics_description || 'N/A',
    niche: row.business_sic_code_description || 'N/A',
    employees: row.business_number_of_employees_range || '1-10',
    revenue: row.business_yearly_revenue_range || '$0-500K',
    logo: row.business_logo || null,
    linkedin: row.business_linkedin_profile || null,
    hasWebsite,
    webTech: 'Unknown', // Placeholder
    techSpend: 0, // Placeholder
    socialNetworks: row.business_linkedin_profile ? 1 : 0,
    siteAge: 'Unknown', // Placeholder
    techFlags: [], // Placeholder
    flaws: row.business_business_description ? [row.business_business_description.slice(0, 150) + '...'] : [],
  };

  lead.websiteScore = scoreWebsite(lead);
  return lead;
}


// --- Main Execution ---

try {
  console.log('--- Starting Lead Import ---');

  // 1. Read all specified CSV files and parse them
  let newLeads = [];
  for (const fileName of CSV_FILES) {
    const filePath = path.join(LEADS_PROSPECT_DIR, fileName);
    if (fs.existsSync(filePath)) {
      console.log(`Processing ${fileName}...`);
      const fileContent = fs.readFileSync(filePath);
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
      });
      
      const transformed = records.map(transformRowToLead).filter(Boolean); // Filter out nulls
      newLeads.push(...transformed);
      console.log(` -> Found and transformed ${transformed.length} leads.`);
    } else {
      console.warn(`WARN: File not found - ${fileName}`);
    }
  }

  // 2. Read the existing leadsData.js file
  console.log(`Reading existing leads from ${LEADS_DATA_FILE}...`);
  const existingFileContent = fs.readFileSync(LEADS_DATA_FILE, 'utf-8');
  
  const leadArrayMatch = existingFileContent.match(/export const LEADS = (\[[\s\S]*?\]);/s);
  if (!leadArrayMatch) {
    throw new Error('Could not find `export const LEADS = [...]` in leadsData.js');
  }
  
  const getLeads = new Function(`return ${leadArrayMatch[1]}`);
  const existingLeads = getLeads();
  console.log(` -> Found ${existingLeads.length} existing leads.`);

  // 3. Combine and deduplicate leads
  const existingLeadIds = new Set(existingLeads.map(l => l.id));
  const uniqueNewLeads = newLeads.filter(l => !existingLeadIds.has(l.id));
  
  console.log(` -> ${uniqueNewLeads.length} new unique leads to add.`);
  
  const combinedLeads = [...existingLeads, ...uniqueNewLeads];

  // 4. Write the new content back to the file
  const newFileContent = `export const LEADS = ${JSON.stringify(combinedLeads, null, 2)};`;
  fs.writeFileSync(LEADS_DATA_FILE, newFileContent);

  console.log('--- Lead Import Complete! ---');
  console.log(`Successfully wrote ${combinedLeads.length} total leads to leadsData.js.`);

} catch (error) {
  console.error('FATAL ERROR during lead import:', error);
  process.exit(1);
}
