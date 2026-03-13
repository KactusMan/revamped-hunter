'use client';
import { useState, useEffect, useMemo } from 'react';
import { LEADS } from '../lib/leadsData';

const FLAGS = { US: '🇺🇸', GB: '🇬🇧', CA: '🇨🇦', IE: '🇮🇪' };
const NICHE_ICONS = {
  'Restaurant': '🍽️', 'Cleaning Service': '🧹', 'Hospitality Association': '🏛️',
  'Food & Beverage SaaS': '💻', 'Chef Recruitment Agency': '👨‍🍳', 'Fine Dining Awards': '🏆',
  'Restaurant Tech Blog': '📡', 'Restaurant Staffing': '🤝', 'Plumbing': '🔧',
  'Roofing': '🏠', 'HVAC': '❄️', 'Bakery': '🥐', 'Dental Practice': '🦷',
  'Electrician': '⚡', 'Auto Repair': '🚗', 'Landscaping / Garden': '🌿',
  'Painting & Decorating': '🖌️', 'Pet Grooming': '🐾', 'Physiotherapy': '💪', 'Locksmith': '🔑',
};

const VIBE_PROMPT = `As an expert Lead Generation Specialist using Vibe Prospecting, find me high-intent leads that fit this JSON schema:
{
  "name": "Business Name",
  "domain": "official-website.com",
  "website": "https://official-website.com",
  "country": "United States",
  "countryCode": "US",
  "city": "City Name",
  "niche": "Exact Niche",
  "employees": "1-10",
  "revenue": "$0-500K",
  "webTech": "Tech Stack found",
  "techSpend": 500,
  "flaws": ["specific website flaw 1", "specific website flaw 2"]
}

--- ENRICHMENT PROMPT ---
"I have a list of business names. For each business below, please find their official email address, primary phone number, and social media (Instagram/Facebook). Format it as a clean table:

Businesses:
[PASTE NAMES HERE]
"`;

const getScoreClass = (s) => {
  if (s <= 15) return 'score-low';
  if (s <= 35) return 'score-mid';
  return 'score-high';
};

const getFillClass = (s) => {
  if (s <= 15) return 'fill-low';
  if (s <= 35) return 'fill-mid';
  return 'fill-high';
};

function LeadCard({ lead: initialLead, onAnalyze }) {
  const [lead, setLead] = useState(initialLead);
  const [verifying, setVerifying] = useState(false);
  
  const icon = NICHE_ICONS[lead.niche] || '🏢';
  const scoreClass = getScoreClass(lead.websiteScore);
  const fillClass = getFillClass(lead.websiteScore);

  const handleVerify = async (e) => {
    e.preventDefault();
    setVerifying(true);
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead }),
      });
      const data = await res.json();
      if (data.success && data.verification) {
        const v = data.verification;
        // Update local state with verified info
        const updatedLead = { 
          ...lead, 
          website: v.suggestedWebsite || lead.website,
          domain: v.suggestedDomain || lead.domain,
          hasWebsite: v.isValid || lead.hasWebsite,
          phone: v.phone || lead.phone,
          socials: { ...lead.socials, ...v.socials }
        };
        setLead(updatedLead);
        alert(`Verification Successful!\n\nStatus: ${v.isValid ? '✓ VALID' : '✗ INVALID'}\nPhone: ${v.phone || 'Found'}\nSocials: ${Object.keys(v.socials || {}).filter(k => v.socials[k]).join(', ') || 'N/A'}`);
      } else {
        alert(`Verify failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`Network error: ${err.message}`);
    }
    setVerifying(false);
  };

  return (
    <div className="lead-card">
      <div className="card-header">
        <div className="card-logo">
          {lead.logo ? (
            <img src={lead.logo} alt="" onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.textContent = icon; }} />
          ) : icon}
        </div>
        <div className="card-title-area">
          <div className="card-name">{lead.name}</div>
          <div className="card-location">{FLAGS[lead.countryCode]} {lead.city}, {lead.country}</div>
        </div>
        <div className={`card-niche-badge`} style={{ background: 'var(--accent-dim)', color: 'var(--accent)', marginLeft: 'auto' }}>{lead.niche}</div>
      </div>

      <div className="card-body" style={{ flex: 1 }}>
        <div className="card-meta-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          <div className={`meta-pill ${lead.hasWebsite ? 'has-website' : 'no-website'}`}>
            {lead.hasWebsite ? '✓ Website' : '✕ No Website'}
          </div>
          {lead.phone && <div className="meta-pill" style={{ color: 'var(--blue)', background: 'var(--blue-dim)' }}>📞 {lead.phone}</div>}
          {!lead.phone && <div className="meta-pill" style={{ color: 'var(--red)', background: 'var(--red-dim)' }}>✕ No Number</div>}
          <div className="meta-pill">💰 ${lead.techSpend.toLocaleString()}/yr</div>
        </div>

        {lead.socials && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            {lead.socials.instagram && <a href={lead.socials.instagram} target="_blank" title="Instagram">📸</a>}
            {lead.socials.facebook && <a href={lead.socials.facebook} target="_blank" title="Facebook">👥</a>}
            {lead.socials.linkedin && <a href={lead.socials.linkedin} target="_blank" title="LinkedIn">💼</a>}
          </div>
        )}

        <div className="tech-stack" style={{ marginBottom: 12 }}>
          {lead.webTech && lead.webTech.split(' / ').map((t, i) => (
            <span key={i} className="tech-tag">{t}</span>
          ))}
        </div>

        <div className="analysis-box">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="score-label">Site Health</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="score-bar"><div className={`score-fill ${fillClass}`} style={{ width: `${lead.websiteScore}%` }}></div></div>
              <span style={{ fontWeight: 800, fontSize: 14 }}>{lead.websiteScore}</span>
            </div>
          </div>
          {lead.flaws && lead.flaws.length > 0 && (
            <div className="analysis-flaws">
              {lead.flaws.slice(0, 1).map((f, i) => <div key={i} className="flaw-item" style={{ fontSize: 12 }}>{f}</div>)}
            </div>
          )}
        </div>
      </div>

      <div className="card-links" style={{ padding: 0, marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          {lead.hasWebsite && lead.website && (
            <a href={lead.website} target="_blank" rel="noopener" className="card-link" style={{ flex: 1 }}>Site ↗</a>
          )}
          <button className="card-link" onClick={handleVerify} style={{ flex: 1, cursor: verifying ? 'wait' : 'pointer' }} disabled={verifying}>
            {verifying ? '...' : '🔍 Verify Business'}
          </button>
        </div>
        <button className="analyze-btn" onClick={() => onAnalyze(lead)}>⚡ Generate AI Opener</button>
      </div>
    </div>
  );
}

function AnalysisDrawer({ lead, onClose }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead }),
    })
      .then(r => r.json())
      .then(j => {
        if (j.success && j.analysis) {
          setData(j.analysis);
        } else {
          setErr(j.error || 'Check GEMINI_API_KEY');
        }
        setLoading(false);
      })
      .catch(e => {
        setErr(e.message);
        setLoading(false);
      });
  }, [lead.id]);

  if (!lead) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 680, background: 'white', borderRadius: 16, maxHeight: '90vh', overflowY: 'auto', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '32px 40px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a' }}>{lead.name}</h2>
            <p style={{ color: '#64748b', fontSize: 14, fontWeight: 600 }}>{lead.niche} • {lead.city}, {lead.country}</p>
            {lead.phone && <p style={{ color: 'var(--blue)', fontSize: 14, fontWeight: 700, marginTop: 4 }}>📞 {lead.phone}</p>}
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 24, width: 40, height: 40, borderRadius: '50%', fontWeight: 800 }}>×</button>
        </div>

        <div style={{ padding: 40 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div className="spinner" style={{ width: 50, height: 50, border: '4px solid #f1f5f9', borderTopColor: '#0f172a', marginBottom: 20 }}></div>
              <p style={{ color: '#0f172a', fontWeight: 700, fontSize: 16 }}>AI is crafting your pitch...</p>
            </div>
          ) : err ? (
            <div style={{ color: '#dc2626', padding: 32, textAlign: 'center', background: '#fef2f2', borderRadius: 16, border: '1px solid #fca5a5' }}>
              <p style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Analysis Failed</p>
              <p style={{ fontSize: 14 }}>{err}</p>
              <p style={{ fontSize: 12, marginTop: 12, color: '#991b1b' }}>Try switching to a different Gemini model or check your quota.</p>
            </div>
          ) : data ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 24 }}>📞</span>
                  <label style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5, color: '#64748b' }}>Call Opener</label>
                </div>
                <div className="opener-text" style={{ fontSize: 17, background: '#f8fafc', borderLeft: '6px solid #0f172a' }}>"{data.callOpener}"</div>
                <button className="copy-btn" style={{ padding: '8px 16px', fontSize: 13 }} onClick={() => navigator.clipboard.writeText(data.callOpener || '')}>⎘ Copy Call Script</button>
              </section>

              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 24 }}>✉️</span>
                  <label style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5, color: '#64748b' }}>Email Strategy</label>
                </div>
                <div style={{ background: '#f8fafc', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#64748b', marginBottom: 12, textTransform: 'uppercase' }}>Subject: <span style={{ color: '#0f172a' }}>{data.emailSubject}</span></div>
                  <div style={{ fontSize: 15, color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{data.emailOpener}</div>
                  <button className="copy-btn" style={{ marginTop: 20 }} onClick={() => navigator.clipboard.writeText(`Subject: ${data.emailSubject}\n\n${data.emailOpener}`)}>⎘ Copy Email</button>
                </div>
              </section>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ background: 'white', padding: 20, borderRadius: 16, border: '2px solid #f1f5f9' }}>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 900, marginBottom: 6 }}>Est. Deal Value</div>
                  <div style={{ fontSize: 24, color: '#16a34a', fontWeight: 900 }}>{data.estimatedProjectValue || '~$3,000'}</div>
                </div>
                <div style={{ background: 'white', padding: 20, borderRadius: 16, border: '2px solid #f1f5f9' }}>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 900, marginBottom: 6 }}>Website Grade</div>
                  <div style={{ fontSize: 24, color: '#0f172a', fontWeight: 900 }}>{data.websiteGrade || 'C'}</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [activeLead, setActiveLead] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ country: 'all', site: 'all', niche: 'all', sort: 'score_asc' });

  const countries = useMemo(() => ['all', ...new Set(LEADS.map(l => l.country))], []);
  const niches = useMemo(() => ['all', ...new Set(LEADS.map(l => l.niche))], []);

  const filteredLeads = useMemo(() => {
    return LEADS.filter(l => {
      const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) || 
                          l.city.toLowerCase().includes(search.toLowerCase()) ||
                          l.niche.toLowerCase().includes(search.toLowerCase());
      const matchCountry = filters.country === 'all' || l.country === filters.country;
      const matchNiche = filters.niche === 'all' || l.niche === filters.niche;
      const matchSite = filters.site === 'all' || (filters.site === 'yes' ? l.hasWebsite : !l.hasWebsite);
      return matchSearch && matchCountry && matchNiche && matchSite;
    }).sort((a, b) => {
      if (filters.sort === 'score_asc') return a.websiteScore - b.websiteScore;
      if (filters.sort === 'score_desc') return b.websiteScore - a.websiteScore;
      if (filters.sort === 'name') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [search, filters]);

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <header className="header">
        <div className="header-logo">
          <div className="header-logo-icon">⚡</div>
          <span>LeadHunter <span style={{ fontWeight: 400, color: '#64748b' }}>Pro</span></span>
        </div>
        <div className="header-meta">
          <button 
            onClick={() => { navigator.clipboard.writeText(VIBE_PROMPT); alert('Vibe Prompt copied!'); }}
            style={{ background: '#0f172a', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', transition: '0.2s' }}
            onMouseOver={(e) => e.target.style.opacity = '0.9'}
            onMouseOut={(e) => e.target.style.opacity = '1'}
          >
            📋 Get Vibe Prompt
          </button>
          <div className="header-badge" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bcf0da' }}>Gemini 1.5 Flash Enabled</div>
        </div>
      </header>

      <div className="ticker-bar">
        <div className="ticker-inner" style={{ display: 'flex', gap: 50, whiteSpace: 'nowrap', animation: 'ticker 40s linear infinite', paddingLeft: '100%' }}>
          {LEADS.slice(0, 20).map((l, i) => (
            <div key={i} style={{ display: 'flex', gap: 10 }}>
              <span style={{ color: '#f59e0b' }}>[OPPORTUNITY]</span> {l.name} in {l.city} — Score: {l.websiteScore}
            </div>
          ))}
        </div>
      </div>

      <div className="stats-bar" style={{ gap: 0 }}>
        <div className="stat-item">
          <div className="stat-value">{LEADS.length}</div>
          <div className="stat-label">Total Leads</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: '#dc2626' }}>{LEADS.filter(l => l.websiteScore <= 15).length}</div>
          <div className="stat-label">Critical Health</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: '#2563eb' }}>{LEADS.filter(l => l.phone).length}</div>
          <div className="stat-label">With Phone</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: '#16a34a' }}>{LEADS.filter(l => l.hasWebsite).length}</div>
          <div className="stat-label">With Website</div>
        </div>
      </div>

      <div className="main-layout">
        <aside className="sidebar">
          <div className="sidebar-section">
            <label className="sidebar-label">Search</label>
            <input type="text" className="filter-input" placeholder="Business or city..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="sidebar-section">
            <label className="sidebar-label">Country</label>
            <div className="filter-chips">
              {countries.map(c => (
                <button key={c} className={`chip ${filters.country === c ? 'active' : ''}`} onClick={() => setFilters({...filters, country: c})}>
                  {c === 'all' ? 'All' : c}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <label className="sidebar-label">Niche</label>
            <select className="filter-input" value={filters.niche} onChange={e => setFilters({...filters, niche: e.target.value})}>
              {niches.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <div className="sidebar-section">
            <label className="sidebar-label">Sorting</label>
            <select className="filter-input" value={filters.sort} onChange={e => setFilters({...filters, sort: e.target.value})}>
              <option value="score_asc">Lowest Health First</option>
              <option value="score_desc">Highest Health First</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </aside>

        <main className="leads-area">
          <div className="leads-grid">
            {filteredLeads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} onAnalyze={setActiveLead} />
            ))}
          </div>
        </main>
      </div>

      {activeLead && <AnalysisDrawer lead={activeLead} onClose={() => setActiveLead(null)} />}

      <style jsx global>{`
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-100%); } }
        .spinner { border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
