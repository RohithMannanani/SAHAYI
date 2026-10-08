import React, { useState, useRef, useEffect } from 'react';

// ── SVG Icon Helper ─────────────────────────────────────────
const Icon = ({ d, size = 18, stroke = 'currentColor', fill = 'none', strokeWidth = 2, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

export default function GlobalSearchDropdown({
  className = '',
  placeholder = "Search members, loans, units...",
  members = [],
  loans = [],
  meetings = [],
  units = [],
  onSelectResult
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchLower = query.toLowerCase().trim();

  // Filter Data
  const matchedMembers = searchLower ? members.filter(m => 
    (m.name || m.fullName || '').toLowerCase().includes(searchLower) ||
    (m.memberId || m.role || '').toLowerCase().includes(searchLower) ||
    (m.phoneNumber || m.phone || '').toLowerCase().includes(searchLower)
  ).slice(0, 5) : [];

  const matchedLoans = searchLower ? loans.filter(l =>
    (l.loanId || l.id || '').toString().toLowerCase().includes(searchLower) ||
    (l.applicantName || l.borrowerName || '').toLowerCase().includes(searchLower)
  ).slice(0, 5) : [];

  const matchedMeetings = searchLower ? meetings.filter(m =>
    (m.title || '').toLowerCase().includes(searchLower) ||
    (m.venue || m.location || '').toLowerCase().includes(searchLower)
  ).slice(0, 5) : [];

  const matchedUnits = searchLower ? units.filter(u =>
    (u.name || u.unitName || '').toLowerCase().includes(searchLower)
  ).slice(0, 5) : [];

  const hasResults = matchedMembers.length > 0 || matchedLoans.length > 0 || matchedMeetings.length > 0 || matchedUnits.length > 0;

  const handleSelect = (type, item) => {
    setQuery('');
    setIsOpen(false);
    if (onSelectResult) {
      onSelectResult(type, item);
    }
  };

  return (
    <div className={className} ref={wrapperRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <Icon d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" size={15} stroke="#809986" />
      <input 
        type="text" 
        placeholder={placeholder} 
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
      />

      {isOpen && query.trim() !== '' && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '8px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          zIndex: 1000,
          maxHeight: '400px',
          overflowY: 'auto',
          minWidth: '260px'
        }}>
          {!hasResults ? (
            <div style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.85rem', textAlign: 'center' }}>
              No results found for "{query}"
            </div>
          ) : (
            <div style={{ padding: '8px 0' }}>
              {matchedMembers.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ padding: '4px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Members</div>
                  {matchedMembers.map((m, i) => (
                    <div 
                      key={i} 
                      onClick={() => handleSelect('member', m)}
                      style={{ padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold', color: '#475569', flexShrink: 0 }}>
                        {(m.name || m.fullName || 'M').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{m.name || m.fullName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{m.memberId || m.role || 'Member'} • {m.phoneNumber || m.phone || '-'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {matchedLoans.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ padding: '4px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Loans</div>
                  {matchedLoans.map((l, i) => (
                    <div 
                      key={i}
                      onClick={() => handleSelect('loan', l)}
                      style={{ padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" size={16} stroke="#0ea5e9" className="flex-shrink-0" />
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>Loan #{l.loanId || l.id}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>₹{l.amount || l.loanAmount} • {l.applicantName || l.borrowerName || l.memberName}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {matchedMeetings.length > 0 && (
                <div>
                  <div style={{ padding: '4px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Meetings</div>
                  {matchedMeetings.map((m, i) => (
                    <div 
                      key={i}
                      onClick={() => handleSelect('meeting', m)}
                      style={{ padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" size={16} stroke="#10b981" className="flex-shrink-0" />
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{m.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{m.date} • {m.venue || m.location}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {matchedUnits.length > 0 && (
                <div>
                  <div style={{ padding: '4px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Units</div>
                  {matchedUnits.map((u, i) => (
                    <div 
                      key={i}
                      onClick={() => handleSelect('unit', u)}
                      style={{ padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Icon d="M3 21V9l9-7 9 7v12M9 21V12h6v9" size={16} stroke="#8b5cf6" className="flex-shrink-0" />
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{u.name || u.unitName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>Unit ID: {u.id || u.unitId || '-'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
