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
  const icon = NICHE_ICONS[lead.niche] || '🏢';
  const scoreClass = getScoreClass(lead.websiteScore);
  const fillClass = getFillClass(lead.websiteScore);

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
        <div className={`card-niche-badge niche-${lead.niche.replace(/\s+/g, '')}`}>{lead.niche}</div>
      </div>

      <div className="card-body">
        <div className="card-meta-row">
          <div className={`meta-pill ${lead.hasWebsite ? 'has-website' : 'no-website'}`}>
            {lead.hasWebsite ? '✓ Website Online' : '✕ No Website'}
          </div>
          <div className="meta-pill">💰 ${lead.techSpend.toLocaleString()}/yr spend</div>
          <div className="meta-pill">👥 {lead.employees} employees</div>
        </div>

        <div className="tech-stack">
          {lead.webTech.split(' / ').map((t, i) => (
            <span key={i} className="tech-tag">{t}</span>
          ))}
        </div>

        <div className="analysis-box">
          <div className="analysis-score-row">
            <span className="score-label">Website Health</span>
            <div className="score-bar-wrap">
              <div className="score-bar">
                <div className={`score-fill ${fillClass}`} style={{ width: `${lead.websiteScore}%` }}></div>
              </div>
              <span className={`score-value ${scoreClass}`}>{lead.websiteScore}</span>
            </div>
          </div>
          <div className="analysis-flaws">
            <div className="flaws-title">Top Issues</div>
            {lead.flaws.slice(0, 2).map((f, i) => (
              <div key={i} className="flaw-item">{f}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="card-links">
        {lead.hasWebsite && (
          <a href={lead.website} target="_blank" rel="noopener" className="card-link">Visit Site ↗</a>
        )}
        <button 
          className="card-link" 
          onClick={(e) => {
            e.preventDefault();
            alert(`Verifying ${lead.name}... (Feature coming in next update: will cross-check with Google Search)`);
          }}
          style={{ cursor: 'help' }}
        >
          🔍 Verify
        </button>
        <button className="analyze-btn" onClick={() => onAnalyze(lead)}>
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
    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead }),
    })
      .then(r => r.json())
      .then(j => {
        if (j.success) {
          setData(j.analysis);
        } else {
          setErr(j.error);
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
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxWidth: 600, background: 'var(--surface)',
        border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
        maxHeight: '90vh', overflowY: 'auto', position: 'relative'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: 24, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>{lead.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{lead.niche} • {lead.city}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 24 }}>×</button>
        </div>

        <div style={{ padding: 24 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div className="spinner" style={{ width: 32, height: 32, marginBottom: 16 }}></div>
              <p style={{ color: 'var(--text-muted)' }}>Gemini is analyzing the lead...</p>
            </div>
          ) : err ? (
            <div style={{ color: 'var(--red)', padding: 20, textAlign: 'center' }}>
              <p>Error: {err}</p>
              <p style={{ fontSize: 12, marginTop: 8 }}>Make sure GEMINI_API_KEY is set.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <section>
                <div className="opener-title">Personalized Call Opener</div>
                <div className="opener-text" style={{ fontSize: 14 }}>"{data.callOpener}"</div>
                <button className="copy-btn" onClick={() => navigator.clipboard.writeText(data.callOpener)}>⎘ Copy to Clipboard</button>
              </section>

              <section>
                <div className="opener-title" style={{ color: 'var(--blue)' }}>Email Strategy</div>
                <div style={{ background: 'var(--card)', padding: 16, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>SUBJECT: {data.emailSubject}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6 }}>{data.emailOpener}</div>
                </div>
              </section>

              <section>
                <div className="opener-title" style={{ color: 'var(--red)' }}>Critical Flaws</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {data.topFlaws.map((f, i) => (
                    <div key={i} className="flaw-item" style={{ fontSize: 13 }}>{f}</div>
                  ))}
                </div>
              </section>

              <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: 'var(--card)', padding: 12, borderRadius: 'var(--radius)', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Est. Project Value</div>
                  <div style={{ fontSize: 18, color: 'var(--green)', fontWeight: 700 }}>{data.estimatedProjectValue}</div>
                </div>
                <div style={{ background: 'var(--card)', padding: 12, borderRadius: 'var(--radius)', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Website Grade</div>
                  <div style={{ fontSize: 18, color: 'var(--accent)', fontWeight: 700 }}>{data.websiteGrade}</div>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [activeLead, setActiveLead] = useState(null);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid');
  const [filters, setFilters] = useState({
    country: 'all',
    site: 'all',
    score: [0, 100],
    niche: 'all',
    sort: 'score_asc'
  });

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
      const matchScore = l.websiteScore >= filters.score[0] && l.websiteScore <= filters.score[1];
      
      return matchSearch && matchCountry && matchNiche && matchSite && matchScore;
    }).sort((a, b) => {
      if (filters.sort === 'score_asc') return a.websiteScore - b.websiteScore;
      if (filters.sort === 'score_desc') return b.websiteScore - a.websiteScore;
      if (filters.sort === 'name') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [search, filters]);

  const stats = {
    total: LEADS.length,
    critical: LEADS.filter(l => l.websiteScore <= 15).length,
    noSite: LEADS.filter(l => !l.hasWebsite).length,
    highValue: LEADS.filter(l => l.techSpend > 2000).length,
  };

  return (
    <div>
      <header className="header">
        <div className="header-logo">
          <div className="header-logo-icon">⚡</div>
          <span>LeadHunter <span style={{ fontWeight: 300, color: 'var(--text-muted)' }}>Pro</span></span>
        </div>
        <div className="header-meta">
          <div className="header-badge">Gemini 2.0 Flash Powered</div>
          <span>Connected: <span style={{ color: 'var(--green)' }}>● Terminal-Link Active</span></span>
        </div>
      </header>

      <div className="ticker-bar">
        <div className="ticker-inner">
          {LEADS.slice(0, 5).map((l, i) => (
            <div key={i} className="ticker-item">
              <span>{l.name}</span> detected with {l.flaws.length} critical flaws in {l.city}
            </div>
          ))}
          <div className="ticker-item"><span>NEW DATA</span> Real-time lead enrichment via Google Search enabled</div>
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Leads</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: 'var(--red)' }}>{stats.critical}</div>
          <div className="stat-label">Critical Health</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{stats.noSite}</div>
          <div className="stat-label">No Website</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: 'var(--blue)' }}>{stats.highValue}</div>
          <div className="stat-label">High Tech Spend</div>
        </div>
      </div>

      <div className="main-layout">
        <aside className="sidebar">
          <div className="sidebar-section">
            <label className="sidebar-label">Search Leads</label>
            <input 
              type="text" 
              className="filter-input" 
              placeholder="Name, city, or niche..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="sidebar-section">
            <label className="sidebar-label">Country</label>
            <div className="filter-chips">
              {countries.map(c => (
                <button 
                  key={c} 
                  className={`chip ${filters.country === c ? 'active' : ''}`}
                  onClick={() => setFilters({...filters, country: c})}
                >
                  {c === 'all' ? 'All' : (FLAGS[c === 'United States' ? 'US' : c === 'United Kingdom' ? 'GB' : c === 'Canada' ? 'CA' : 'IE'] + ' ' + c)}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <label className="sidebar-label">Website Status</label>
            <div className="filter-chips">
              <button className={`chip ${filters.site === 'all' ? 'active' : ''}`} onClick={() => setFilters({...filters, site: 'all'})}>All</button>
              <button className={`chip ${filters.site === 'yes' ? 'active' : ''}`} onClick={() => setFilters({...filters, site: 'yes'})}>Has Website</button>
              <button className={`chip ${filters.site === 'no' ? 'active' : ''}`} onClick={() => setFilters({...filters, site: 'no'})}>Missing Site</button>
            </div>
          </div>

          <div className="sidebar-section">
            <label className="sidebar-label">Score Range: {filters.score[0]} - {filters.score[1]}</label>
            <input 
              type="range" 
              min="0" max="100" 
              value={filters.score[1]} 
              onChange={e => setFilters({...filters, score: [0, parseInt(e.target.value)]})}
              style={{ width: '100%', accentColor: 'var(--accent)' }}
            />
          </div>

          <div className="sidebar-section">
            <label className="sidebar-label">Sort Order</label>
            <select className="sort-select" style={{ width: '100%' }} value={filters.sort} onChange={e => setFilters({...filters, sort: e.target.value})}>
              <option value="score_asc">Lowest Score First</option>
              <option value="score_desc">Highest Score First</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>
        </aside>

        <main className="leads-area">
          <div className="leads-header">
            <div className="leads-count">Showing <span>{filteredLeads.length}</span> results</div>
            <div className="view-toggles" style={{ display: 'flex', gap: 8 }}>
              <button 
                className={`chip ${view === 'grid' ? 'active' : ''}`} 
                onClick={() => setView('grid')}
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                ▤ Grid
              </button>
              <button 
                className={`chip ${view === 'list' ? 'active' : ''}`} 
                onClick={() => setView('list')}
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                ☰ List
              </button>
            </div>
          </div>

          {filteredLeads.length === 0 ? (
            <div className="empty-state">
              <h3>No leads found</h3>
              <p>Try adjusting your search or filters.</p>
            </div>
          ) : view === 'grid' ? (
            <div className="leads-grid">
              {filteredLeads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} onAnalyze={setActiveLead} />
              ))}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-dim)', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Business Name</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Niche</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Location</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Score</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Tech Spend</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text)' }}>{lead.name}</td>
                      <td style={{ padding: '12px 16px' }}>{lead.niche}</td>
                      <td style={{ padding: '12px 16px' }}>{FLAGS[lead.countryCode]} {lead.city}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={getScoreClass(lead.websiteScore)} style={{ fontWeight: 700 }}>{lead.websiteScore}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>${lead.techSpend.toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button 
                          className="analyze-btn" 
                          style={{ display: 'inline-flex', padding: '4px 8px', width: 'auto' }}
                          onClick={() => setActiveLead(lead)}
                        >
                          ⚡ Opener
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {activeLead && <AnalysisDrawer lead={activeLead} onClose={() => setActiveLead(null)} />}
    </div>
  );
}
