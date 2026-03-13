'use client';
import { useState, useEffect, useRef } from 'react';
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

const scoreColor = (s) => {
  if (s <= 15) return '#ff2d2d';
  if (s <= 25) return '#ff6a00';
  if (s <= 35) return '#ffb800';
  return '#22c55e';
};
const scoreLabel = (s) => {
  if (s <= 15) return 'CRITICAL';
  if (s <= 25) return 'POOR';
  if (s <= 35) return 'WEAK';
  return 'FAIR';
};

function GradeRing({ score, size = 58 }) {
  const r = size / 2 - 7;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const c = scoreColor(score);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1a1f2e" strokeWidth="6" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${c}88)` }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: c, lineHeight: 1, fontFamily: 'monospace' }}>{score}</span>
        <span style={{ fontSize: 7, fontWeight: 700, color: c + 'aa', letterSpacing: 1, marginTop: 1 }}>{scoreLabel(score)}</span>
      </div>
    </div>
  );
}

function Chip({ children, color }) {
  return (
    <span style={{
      background: color + '18', color, border: `1px solid ${color}33`,
      borderRadius: 4, padding: '3px 8px', fontSize: 11, fontWeight: 600,
      letterSpacing: 0.3, whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

function CopyBtn({ text, label = 'Copy' }) {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 2000); }}
      style={{
        background: ok ? '#0d2e1a' : 'transparent', border: `1px solid ${ok ? '#22c55e' : '#2a3040'}`,
        color: ok ? '#22c55e' : '#64748b', borderRadius: 6, padding: '5px 12px', fontSize: 11,
        fontWeight: 700, cursor: 'pointer', transition: 'all .15s', letterSpacing: 0.3,
      }}>
      {ok ? '✓ COPIED' : `⎘ ${label}`}
    </button>
  );
}

function AnalysisDrawer({ lead, onClose }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [tab, setTab] = useState('call');
  const drawerRef = useRef(null);

  useEffect(() => {
    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead }),
    }).then(r => r.json()).then(j => {
      setData(j.analysis || j);
      setLoading(false);
    }).catch(e => { setErr(e.message); setLoading(false); });
  }, [lead.id]);

  const TABS = [['call', '📞', 'CALL'], ['email', '✉️', 'EMAIL'], ['flaws', '⚠️', 'FLAWS'], ['signals', '🔥', 'SIGNALS']];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(4,6,12,0.85)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={onClose}>
      <div ref={drawerRef} onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 720, maxHeight: '88vh', background: '#0d1117',
        border: '1px solid #1e2535', borderRadius: '20px 20px 0 0',
        overflowY: 'auto', boxShadow: '0 -20px 60px rgba(0,0,0,0.6)',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 14 }}>
          <div style={{ width: 36, height: 4, background: '#2a3040', borderRadius: 99 }} />
        </div>

        {/* Header */}
        <div style={{ padding: '16px 24px 12px', borderBottom: '1px solid #1a1f2e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg,#1a2236,#0d1117)',
              border: '1px solid #2a3040', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>
              {NICHE_ICONS[lead.niche] || '🏢'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#e8eaf0', fontFamily: "'Syne', sans-serif" }}>{lead.name}</div>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 1 }}>{FLAGS[lead.countryCode]} {lead.city} · {lead.niche}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#1a1f2e', border: 'none', color: '#64748b', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {loading && (
          <div style={{ padding: '50px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>⚙️</div>
            <div style={{ color: '#475569', fontSize: 14, fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>ANALYZING LEAD...</div>
            <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: '50%', background: '#e8850055',
                  animation: 'blink 1.2s infinite', animationDelay: `${i*0.2}s`,
                }} />
              ))}
            </div>
          </div>
        )}

        {err && (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ color: '#ff4444', fontSize: 14, marginBottom: 8 }}>{err}</div>
            <div style={{ color: '#475569', fontSize: 12 }}>Add GEMINI_API_KEY to your Vercel environment variables.</div>
          </div>
        )}

        {data && !loading && (
          <div>
            {/* Stats bar */}
            <div style={{ padding: '16px 24px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, borderBottom: '1px solid #1a1f2e' }}>
              {[
                { v: data.websiteGrade || '?', l: 'Web Grade', c: '#ff6a00' },
                { v: data.estimatedProjectValue || '~$3K', l: 'Est. Value', c: '#22c55e' },
                { v: data.pitchAngle ? data.pitchAngle.split(' ').slice(0,3).join(' ') + '…' : 'Rebuild', l: 'Pitch', c: '#7c9ff0' },
              ].map(({ v, l, c }) => (
                <div key={l} style={{ background: '#080a0e', border: '1px solid #1a1f2e', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                  <div style={{ color: c, fontWeight: 800, fontSize: 15, fontFamily: "'DM Mono', monospace" }}>{v}</div>
                  <div style={{ color: '#2a3040', fontSize: 10, fontWeight: 700, letterSpacing: 1, marginTop: 3, textTransform: 'uppercase' }}>{l}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ padding: '14px 24px 0', display: 'flex', gap: 6 }}>
              {TABS.map(([k, ico, lbl]) => (
                <button key={k} onClick={() => setTab(k)} style={{
                  background: tab === k ? '#e88500' : 'transparent',
                  color: tab === k ? '#fff' : '#475569',
                  border: tab === k ? 'none' : '1px solid #1a1f2e',
                  borderRadius: 7, padding: '7px 14px', fontSize: 11,
                  fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5,
                  transition: 'all .15s',
                }}>{ico} {lbl}</button>
              ))}
            </div>

            <div style={{ padding: '18px 24px 32px' }}>
              {tab === 'call' && (
                <div>
                  <div style={{ color: '#2a3040', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' }}>Personalized Opener</div>
                  <div style={{
                    background: '#080a0e', border: '1px solid #1a1f2e', borderLeft: '3px solid #e88500',
                    borderRadius: '0 10px 10px 0', padding: '18px 20px', color: '#c0c8d8',
                    fontSize: 15, lineHeight: 1.75, fontStyle: 'italic', marginBottom: 12,
                  }}>
                    {data.callOpener || '...'}
                  </div>
                  {data.opportunity && (
                    <div style={{ background: '#080a0e', border: '1px solid #1a1f2e', borderRadius: 8, padding: '12px 14px', color: '#64748b', fontSize: 13, marginBottom: 12 }}>
                      <span style={{ color: '#e88500', fontWeight: 700 }}>→ </span>{data.opportunity}
                    </div>
                  )}
                  <CopyBtn text={data.callOpener || ''} label="COPY OPENER" />
                </div>
              )}
              {tab === 'email' && (
                <div>
                  <div style={{ color: '#2a3040', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' }}>Cold Email</div>
                  <div style={{ background: '#080a0e', border: '1px solid #1a1f2e', borderRadius: 10, padding: 18 }}>
                    <div style={{ fontSize: 10, color: '#2a3040', letterSpacing: 2, marginBottom: 5, textTransform: 'uppercase' }}>Subject</div>
                    <div style={{ color: '#e8eaf0', fontWeight: 700, fontSize: 16, marginBottom: 16, fontFamily: "'Syne', sans-serif" }}>{data.emailSubject || '...'}</div>
                    <div style={{ fontSize: 10, color: '#2a3040', letterSpacing: 2, marginBottom: 5, textTransform: 'uppercase' }}>Opening</div>
                    <div style={{ color: '#c0c8d8', fontSize: 14, lineHeight: 1.7 }}>{data.emailOpener || '...'}</div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <CopyBtn text={`Subject: ${data.emailSubject}\n\n${data.emailOpener}`} label="COPY EMAIL" />
                  </div>
                </div>
              )}
              {tab === 'flaws' && (
                <div>
                  <div style={{ color: '#2a3040', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' }}>Detected Website Issues</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[...(data.topFlaws || []), ...lead.flaws]
                      .filter((v, i, a) => a.indexOf(v) === i)
                      .slice(0, 7)
                      .map((f, i) => (
                      <div key={i} style={{
                        background: '#080a0e', border: '1px solid #1a1f2e',
                        borderRadius: 8, padding: '11px 14px',
                        display: 'flex', gap: 10, alignItems: 'flex-start',
                      }}>
                        <span style={{ color: '#ff4444', flexShrink: 0, marginTop: 1, fontSize: 12 }}>✕</span>
                        <span style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.5 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {tab === 'signals' && (
                <div>
                  <div style={{ color: '#2a3040', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' }}>Why Act Now</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    {(data.urgencySignals || []).map((s, i) => (
                      <div key={i} style={{ background: '#080a0e', border: '1px solid #1a1f2e', borderRadius: 8, padding: '11px 14px', display: 'flex', gap: 10 }}>
                        <span style={{ color: '#e88500', flexShrink: 0 }}>►</span>
                        <span style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.5 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                  {data.pitchAngle && (
                    <div style={{ background: '#0d1117', border: '1px solid #e8850033', borderLeft: '3px solid #e88500', borderRadius: '0 10px 10px 0', padding: '14px 16px' }}>
                      <div style={{ fontSize: 10, color: '#e88500', letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase', fontWeight: 700 }}>Core Pitch</div>
                      <div style={{ color: '#c0c8d8', fontSize: 14, lineHeight: 1.6 }}>{data.pitchAngle}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LeadCard({ lead, onAnalyze, index }) {
  const c = scoreColor(lead.websiteScore);
  const icon = NICHE_ICONS[lead.niche] || '🏢';
  return (
    <div style={{
      background: '#0d1117', border: '1px solid #1a1f2e',
      borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 14,
      transition: 'border-color .2s, transform .2s',
      animation: `fadeUp .35s ease forwards`, animationDelay: `${index * 35}ms`, opacity: 0,
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#e8850033'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a1f2e'; e.currentTarget.style.transform = 'none'; }}>

      {/* Top */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10, flexShrink: 0,
            background: lead.logo ? 'transparent' : '#0d1a26',
            border: '1px solid #1a2236', display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', fontSize: 20,
          }}>
            {lead.logo
              ? <img src={lead.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display='none'; e.target.parentNode.textContent = icon; }} />
              : icon}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: '#e8eaf0', fontSize: 14, fontFamily: "'Syne', sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>{lead.name}</div>
            <div style={{ color: '#2a3040', fontSize: 11, marginTop: 2 }}>{FLAGS[lead.countryCode]} {lead.city}</div>
          </div>
        </div>
        <GradeRing score={lead.websiteScore} />
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Chip color="#7c9ff0">{lead.niche}</Chip>
        {lead.hasWebsite
          ? <Chip color="#22c55e">Has Site</Chip>
          : <Chip color="#ff2d2d">No Website</Chip>}
        <Chip color={lead.techSpend === 0 ? '#ff6a00' : '#475569'}>${lead.techSpend.toLocaleString()}/yr</Chip>
      </div>

      {/* Tech */}
      <div style={{ background: '#080a0e', borderRadius: 8, padding: '9px 12px', fontSize: 11, color: '#2a3040', fontFamily: "'DM Mono', monospace", letterSpacing: 0.5 }}>
        <span style={{ color: '#e88500' }}>STACK </span>{lead.webTech}
      </div>

      {/* Top flaw */}
      <div style={{ background: '#0d0a0a', border: '1px solid #1f1515', borderRadius: 8, padding: '10px 12px' }}>
        <div style={{ fontSize: 10, color: '#ff444466', fontWeight: 700, letterSpacing: 1.5, marginBottom: 5, textTransform: 'uppercase' }}>Top Issue</div>
        <div style={{ color: '#7a6060', fontSize: 12, lineHeight: 1.5 }}>{lead.flaws[0]}</div>
      </div>

      {/* Website link */}
      {lead.hasWebsite && (
        <a href={lead.website} target="_blank" rel="noopener" style={{ color: '#2a3040', fontSize: 11, textDecoration: 'none', fontFamily: "'DM Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: 0.3 }}>
          ↗ {lead.domain}
        </a>
      )}

      {/* CTA */}
      <button onClick={() => onAnalyze(lead)} style={{
        width: '100%', background: 'linear-gradient(135deg, #1a1200, #3d2800)',
        border: '1px solid #e8850033', borderRadius: 9, color: '#e88500',
        padding: '11px', fontSize: 12, fontWeight: 800, cursor: 'pointer',
        letterSpacing: 1, transition: 'all .15s', textTransform: 'uppercase',
      }}
        onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg,#3d2800,#1a1200)'; e.currentTarget.style.borderColor = '#e88500aa'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg,#1a1200,#3d2800)'; e.currentTarget.style.borderColor = '#e8850033'; }}>
        ⚡ Generate AI Opener
      </button>
    </div>
  );
}

function Sel({ value, options, onChange, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <div style={{ fontSize: 9, color: '#2a3040', letterSpacing: 2, fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>}
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        background: '#0d1117', border: '1px solid #1a1f2e', color: '#94a3b8',
        borderRadius: 7, padding: '8px 30px 8px 12px', fontSize: 12, cursor: 'pointer',
        outline: 'none', fontFamily: "'DM Mono', monospace",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath fill='%232a3040' d='M0 0l5 6 5-6z'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', appearance: 'none',
      }}>
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}

export default function Dashboard() {
  const [activeLead, setActiveLead] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ country: 'all', site: 'all', score: 'all', niche: 'all', sort: 'score_asc' });
  const sf = (k, v) => setFilters(p => ({ ...p, [k]: v }));

  const countries = ['all', ...new Set(LEADS.map(l => l.country))];
  const niches = ['all', ...new Set(LEADS.map(l => l.niche))];

  let shown = LEADS.filter(l => {
    const q = search.toLowerCase();
    if (q && !l.name.toLowerCase().includes(q) && !l.niche.toLowerCase().includes(q) && !l.city.toLowerCase().includes(q)) return false;
    if (filters.country !== 'all' && l.country !== filters.country) return false;
    if (filters.site === 'yes' && !l.hasWebsite) return false;
    if (filters.site === 'no' && l.hasWebsite) return false;
    if (filters.niche !== 'all' && l.niche !== filters.niche) return false;
    if (filters.score === 'critical' && l.websiteScore > 15) return false;
    if (filters.score === 'poor' && (l.websiteScore <= 15 || l.websiteScore > 25)) return false;
    if (filters.score === 'weak' && (l.websiteScore <= 25 || l.websiteScore > 35)) return false;
    return true;
  });

  if (filters.sort === 'score_asc') shown = [...shown].sort((a, b) => a.websiteScore - b.websiteScore);
  if (filters.sort === 'score_desc') shown = [...shown].sort((a, b) => b.websiteScore - a.websiteScore);
  if (filters.sort === 'name') shown = [...shown].sort((a, b) => a.name.localeCompare(b.name));

  const stats = [
    { v: LEADS.length, l: 'Total Leads', i: '◈', c: '#7c9ff0' },
    { v: LEADS.filter(l => l.websiteScore <= 15).length, l: 'Critical Sites', i: '⬥', c: '#ff2d2d', note: 'Easiest close' },
    { v: LEADS.filter(l => !l.hasWebsite).length, l: 'No Website', i: '◇', c: '#ff6a00', note: 'Zero competition' },
    { v: LEADS.filter(l => l.techSpend === 0).length, l: 'Zero Tech Spend', i: '◆', c: '#ffb800', note: 'Underinvested' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#080a0e', fontFamily: "'DM Sans', system-ui, sans-serif", color: '#e8eaf0' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #080a0e; }
        ::-webkit-scrollbar-thumb { background: #1a1f2e; border-radius: 3px; }
        @keyframes blink { 0%,100%{opacity:.2} 50%{opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        select option { background: #0d1117; }
      `}</style>

      {/* Ambient glow */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: -200, left: '10%', width: 600, height: 600, background: 'radial-gradient(circle, #e8850008 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -200, right: '5%', width: 500, height: 500, background: 'radial-gradient(circle, #7c9ff008 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 20, borderBottom: '1px solid #1a1f2e',
        background: '#080a0eee', backdropFilter: 'blur(16px)', padding: '0 32px',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 36, height: 36, background: 'linear-gradient(135deg,#3d2800,#e88500)',
              borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>⚡</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px', fontFamily: "'Syne', sans-serif" }}>PitchDeck</div>
              <div style={{ fontSize: 10, color: '#2a3040', letterSpacing: 2, fontWeight: 700, marginTop: -2 }}>LEAD INTELLIGENCE</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
            <span style={{ fontSize: 11, color: '#2a3040', fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>GEMINI AI READY</span>
          </div>
        </div>
      </header>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto', padding: '28px 32px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 }}>
          {stats.map(({ v, l, i, c, note }) => (
            <div key={l} style={{ background: '#0d1117', border: '1px solid #1a1f2e', borderRadius: 12, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 12, right: 14, fontSize: 28, color: c + '14', fontWeight: 900 }}>{i}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: c, fontFamily: "'Syne', sans-serif", letterSpacing: -1 }}>{v}</div>
              <div style={{ fontSize: 12, color: '#2a3040', marginTop: 3, fontWeight: 600 }}>{l}</div>
              {note && <div style={{ fontSize: 10, color: c + 'aa', fontWeight: 700, marginTop: 4, letterSpacing: 0.5 }}>{note}</div>}
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div style={{ background: '#0d1117', border: '1px solid #1a1f2e', borderRadius: 12, padding: '14px 18px', marginBottom: 22, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 9, color: '#2a3040', letterSpacing: 2, fontWeight: 700, textTransform: 'uppercase' }}>Search</div>
            <input type="text" placeholder="company, niche, city..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: '#080a0e', border: '1px solid #1a1f2e', color: '#94a3b8', borderRadius: 7, padding: '8px 12px', fontSize: 12, outline: 'none', fontFamily: "'DM Mono', monospace", width: 200 }} />
          </div>
          <Sel value={filters.country} onChange={v => sf('country', v)} label="Country"
            options={countries.map(c => ({ v: c, l: c === 'all' ? 'All Countries' : `${FLAGS[c === 'United States' ? 'US' : c === 'United Kingdom' ? 'GB' : c === 'Canada' ? 'CA' : 'IE'] || ''} ${c}` }))} />
          <Sel value={filters.site} onChange={v => sf('site', v)} label="Website"
            options={[{v:'all',l:'All'},{v:'yes',l:'Has Website'},{v:'no',l:'No Website'}]} />
          <Sel value={filters.score} onChange={v => sf('score', v)} label="Score Range"
            options={[{v:'all',l:'All Scores'},{v:'critical',l:'🔴 Critical ≤15'},{v:'poor',l:'🟠 Poor 16–25'},{v:'weak',l:'🟡 Weak 26–35'}]} />
          <Sel value={filters.niche} onChange={v => sf('niche', v)} label="Niche"
            options={niches.map(n => ({ v: n, l: n === 'all' ? 'All Niches' : n }))} />
          <Sel value={filters.sort} onChange={v => sf('sort', v)} label="Sort By"
            options={[{v:'score_asc',l:'Worst First ↑'},{v:'score_desc',l:'Best First ↓'},{v:'name',l:'Name A–Z'}]} />
          <div style={{ marginLeft: 'auto', fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#2a3040', alignSelf: 'flex-end', paddingBottom: 8 }}>
            {shown.length}/{LEADS.length}
          </div>
        </div>

        {/* Grid */}
        {shown.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#2a3040' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⊘</div>
            <div style={{ fontFamily: "'DM Mono', monospace", letterSpacing: 1, fontSize: 13 }}>NO LEADS MATCH FILTERS</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {shown.map((lead, i) => <LeadCard key={lead.id} lead={lead} onAnalyze={setActiveLead} index={i} />)}
          </div>
        )}

        {/* Data note */}
        <div style={{ marginTop: 24, padding: '12px 16px', background: '#0d1117', border: '1px solid #1a1f2e', borderRadius: 8, fontSize: 11, color: '#1e2535', fontFamily: "'DM Mono', monospace", letterSpacing: 0.3 }}>
          // 8 leads sourced directly from Vibe Prospecting (real businesses, real enrichment) · 12 leads generated from Vibe Prospecting session data for the same niches/countries
          · Set GEMINI_API_KEY in Vercel env vars · Sort "Worst First" = hottest leads at top
        </div>
      </main>

      {activeLead && <AnalysisDrawer lead={activeLead} onClose={() => setActiveLead(null)} />}
    </div>
  );
}
