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
"I have a list of business names. For each business below, please find their official email address, primary phone number, and the name of the owner or decision-maker. Format it as a clean table:

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

function LeadCard({ lead, onAnalyze }) {
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
        alert(`Verification: ${lead.name}\n\nStatus: ${v.isValid ? '✓ VALID' : '✗ INVALID'}\nSuggested Domain: ${v.suggestedDomain || 'N/A'}\nReason: ${v.reason || 'No reason provided'}`);
      } else {
        alert(`Verify failed for ${lead.name}\n\nError: ${data.error || 'Unknown — check Vercel function logs'}`);
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
        <div className={`card-niche-badge niche-${lead.niche.replace(/\s+/g, '')}`} style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>{lead.niche}</div>
      </div>

      <div className="card-body" style={{ flex: 1 }}>
        <div className="card-meta-row">
          <div className={`meta-pill ${lead.hasWebsite ? 'has-website' : 'no-website'}`}>
            {lead.hasWebsite ? '✓ Website' : '✕ No Site'}
          </div>
          <div className="meta-pill">💰 ${lead.techSpend.toLocaleString()}/yr</div>
          <div className="meta-pill">👥 {lead.employees}</div>
        </div>

        <div className="tech-stack" style={{ margin: '12px 0' }}>
          {lead.webTech.split(' / ').map((t, i) => (
            <span key={i} className="tech-tag">{t}</span>
          ))}
        </div>

        <div className="analysis-box">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="score-label">Health</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="score-bar">
                <div className={`score-fill ${fillClass}`} style={{ width: `${lead.websiteScore}%` }}></div>
              </div>
              <span style={{ fontWeight: 800, fontSize: 14 }}>{lead.websiteScore}</span>
            </div>
          </div>
          <div className="analysis-flaws">
            {lead.flaws.slice(0, 2).map((f, i) => (
              <div key={i} className="flaw-item" style={{ fontSize: 12 }}>{f}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="card-links" style={{ padding: 0, marginTop: 'auto' }}>
        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          {lead.hasWebsite && (
            <a href={lead.website} target="_blank" rel="noopener" className="card-link" style={{ flex: 1 }}>Site ↗</a>
          )}
          <button
            className="card-link"
            onClick={handleVerify}
            style={{ flex: 1, cursor: verifying ? 'wait' : 'pointer' }}
            disabled={verifying}
          >
            {verifying ? '...' : '🔍 Verify'}
          </button>
        </div>
        <button className="analyze-btn" style={{ marginTop: 8 }} onClick={() => onAnalyze(lead)}>
          ⚡ Generate AI Opener
        </button>
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
    setData(null);
    setErr(null);
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
          setErr(j.error || 'No analysis returned. Check GEMINI_API_KEY in Vercel env vars.');
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
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxWidth: 640, background: 'var(--surface)',
        border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
        maxHeight: '90vh', overflowY: 'auto', position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '32px 32px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800 }}>{lead.name}</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: 13, fontWeight: 500 }}>{lead.niche} • {lead.city}, {lead.country}</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20, width: 32, height: 32, borderRadius: '50%' }}>×</button>
        </div>

        <div style={{ padding: 32 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="spinner" style={{ width: 40, height: 40, border: '3px solid var(--accent-dim)', borderTopColor: 'var(--accent)', marginBottom: 16 }}></div>
              <p style={{ color: 'var(--text-dim)', fontWeight: 600 }}>Gemini is building your strategy...</p>
            </div>
          ) : err ? (
            <div style={{ color: '#dc2626', padding: 24, textAlign: 'center', background: '#fef2f2', borderRadius: 12, border: '1px solid #fca5a5' }}>
              <p style={{ fontWeight: 700, marginBottom: 8 }}>Analysis Error</p>
              <p style={{ fontSize: 13 }}>{err}</p>
            </div>
          ) : data ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 18 }}>📞</span>
                  <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)' }}>Personalized Call Opener</label>
                </div>
                <div className="opener-text">"{data.callOpener || 'Opener could not be generated.'}"</div>
                <button className="copy-btn" onClick={() => navigator.clipboard.writeText(data.callOpener || '')}>⎘ Copy Opener</button>
              </section>

              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 18 }}>✉️</span>
                  <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)' }}>Email Strategy</label>
                </div>
                <div style={{ background: 'var(--bg)', padding: 20, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Subject: <span style={{ color: 'var(--text)' }}>{data.emailSubject || 'No Subject'}</span></div>
                  <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>{data.emailOpener}</div>
                  <button className="copy-btn" style={{ marginTop: 16 }} onClick={() => navigator.clipboard.writeText(`Subject: ${data.emailSubject}\n\n${data.emailOpener}`)}>⎘ Copy Full Email</button>
                </div>
              </section>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, marginBottom: 4 }}>Est. Value</div>
                  <div style={{ fontSize: 20, color: 'var(--green)', fontWeight: 800 }}>{data.estimatedProjectValue || '~$3K'}</div>
                </div>
                <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, marginBottom: 4 }}>Web Grade</div>
                  <div style={{ fontSize: 20, color: 'var(--accent)', fontWeight: 800 }}>{data.websiteGrade || 'C'}</div>
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
    <div>
      <header className="header">
        <div className="header-logo">
          <div className="header-logo-icon">⚡</div>
          <span>LeadHunter <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>Pro</span></span>
        </div>
        <div className="header-meta">
          <button
            onClick={() => { navigator.clipboard.writeText(VIBE_PROMPT); alert('Vibe Prospecting Prompt copied to clipboard!'); }}
            style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
          >
            📋 Get Vibe Prompt
          </button>
          <div className="header-badge">Gemini 2.0 Flash</div>
        </div>
      </header>

      <div className="ticker-bar">
        <div className="ticker-inner" style={{ display: 'flex', gap: 40, whiteSpace: 'nowrap', animation: 'ticker 30s linear infinite', paddingLeft: '100%' }}>
          {LEADS.map((l, i) => (
            <div key={i}><span>NEW OPPORTUNITY</span> {l.name} ({l.city}) health score: {l.websiteScore}</div>
          ))}
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-value">{LEADS.length}</div>
          <div className="stat-label">Database Leads</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: 'var(--red)' }}>{LEADS.filter(l => l.websiteScore <= 15).length}</div>
          <div className="stat-label">Critical Priority</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: 'var(--blue)' }}>{LEADS.filter(l => l.techSpend > 1000).length}</div>
          <div className="stat-label">High Tech Spend</div>
        </div>
      </div>

      <div className="main-layout">
        <aside className="sidebar">
          <div className="sidebar-section">
            <label className="sidebar-label">Search</label>
            <input type="text" className="filter-input" placeholder="Name or City..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="sidebar-section">
            <label className="sidebar-label">Country</label>
            <div className="filter-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
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
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
