const fs = require('fs');
const path = require('path');

const LEADS_DATA_FILE = path.join(__dirname, 'lib/leadsData.js');
const OUTPUT_FILE = path.join(__dirname, 'LeadHunter_Export_Full.csv');

try {
  console.log('Reading leads data...');
  const content = fs.readFileSync(LEADS_DATA_FILE, 'utf-8');
  
  // Extract array
  const leadArrayMatch = content.match(/export const LEADS = (\[[\s\S]*?\]);/s);
  if (!leadArrayMatch) throw new Error('Could not parse leads array');
  
  const getLeads = new Function(`return ${leadArrayMatch[1]}`);
  const leads = getLeads();

  const headers = [
    'Name', 'Website', 'Domain', 'Country', 'City', 'Niche', 
    'Employees', 'Revenue', 'Phone', 'Facebook', 'Instagram', 
    'LinkedIn', 'Site Health Score', 'Top Flaws'
  ];

  const rows = leads.map(l => [
    `"${l.name || ''}"`,
    `"${l.website || ''}"`,
    `"${l.domain || ''}"`,
    `"${l.country || ''}"`,
    `"${l.city || ''}"`,
    `"${l.niche || ''}"`,
    `"${l.employees || ''}"`,
    `"${l.revenue || ''}"`,
    `"${l.phone || ''}"`,
    `"${l.socials?.facebook || ''}"`,
    `"${l.socials?.instagram || ''}"`,
    `"${l.linkedin || ''}"`,
    l.websiteScore || '',
    `"${(l.flaws || []).join(' | ').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  fs.writeFileSync(OUTPUT_FILE, csvContent);
  console.log(`Success! Exported ${leads.length} leads to: ${OUTPUT_FILE}`);

} catch (err) {
  console.error('Export failed:', err.message);
}
