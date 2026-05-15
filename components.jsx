/* global React */
// Shared UI components

const { useState, useEffect } = React;

// ───────────────────────── Icons ─────────────────────────
const Icon = {
  home: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-8 9 8v10a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1V11z"/>
    </svg>
  ),
  upload: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v14m0-14l-5 5m5-5l5 5M5 21h14"/>
    </svg>
  ),
  list: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M4 12h16M4 18h16"/>
    </svg>
  ),
  user: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 21v-1a7 7 0 0114 0v1"/>
    </svg>
  ),
  chart: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10m6 10V4m6 16v-7"/>
    </svg>
  ),
  bell: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9zM10 21a2 2 0 004 0"/>
    </svg>
  ),
  more: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>
    </svg>
  ),
  back: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  ),
  check: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l5 5L20 7"/>
    </svg>
  ),
  link: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"/>
    </svg>
  ),
  plus: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  search: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
    </svg>
  ),
  trend: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17l6-6 4 4 8-8M14 7h7v7"/>
    </svg>
  ),
};

// Status bar (iOS-y) — hidden on the deployed web app since the phone's real status bar is visible.
function StatusBar() {
  return null;
}

// Bottom nav
function BottomNav({ items, active, onChange }) {
  return (
    <div className="bottomnav">
      {items.map((it, i) => (
        <button key={i} className={`bn-item ${active === i ? 'active' : ''}`} onClick={() => onChange && onChange(i)}>
          {it.icon}
          <span>{it.label}</span>
        </button>
      ))}
    </div>
  );
}

// Circular progress ring
function ProgressRing({ value, total, size = 200, stroke = 14, color, trackColor, children, showCheck }) {
  const radius = (size - stroke) / 2;
  const C = 2 * Math.PI * radius;
  const pct = total ? Math.min(1, value / total) : 0;
  const dash = C * pct;
  const c = color || 'var(--primary)';
  const tc = trackColor || 'var(--surface-2)';
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg className="ring-svg" width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={radius} stroke={tc} strokeWidth={stroke} fill="none"/>
        <circle cx={size/2} cy={size/2} r={radius}
          stroke={c} strokeWidth={stroke} fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${C - dash}`}
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div className="ring-center">
        {children || (
          <>
            <div className="ring-count">{value}<span style={{ color: 'var(--ink-4)', fontSize: 24 }}>/{total}</span></div>
            <div className="ring-total">업로드</div>
          </>
        )}
      </div>
      {showCheck && (
        <div style={{ position: 'absolute', top: -4, right: -4, width: 36, height: 36, borderRadius: '50%', background: 'var(--success)', color: 'white', display: 'grid', placeItems: 'center', boxShadow: '0 4px 12px rgba(16,185,129,0.4)' }}>
          {Icon.check}
        </div>
      )}
    </div>
  );
}

// Platform chip from URL or key
function PlatformChip({ platformKey }) {
  const { PLATFORMS } = window.AppData;
  if (!platformKey || !PLATFORMS[platformKey]) return null;
  const p = PLATFORMS[platformKey];
  return (
    <span className="plat-chip">
      <span className="plat-dot" style={{ background: p.color }}>{p.short}</span>
      {p.name}
    </span>
  );
}

// Link card
function LinkCard({ upload }) {
  const { PLATFORMS } = window.AppData;
  const p = PLATFORMS[upload.platform] || { color: '#999', short: '??', name: '' };
  return (
    <div className="link-card">
      <div className="link-thumb" style={{ background: p.color }}>{p.short}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{upload.title}</div>
        <div className="tiny mt-1" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {p.name} · {upload.date}
        </div>
      </div>
      <div className="pill">{upload.week}주차</div>
    </div>
  );
}

// Confetti
function Confetti({ count = 24, duration = 3 }) {
  const colors = ['var(--primary)', '#F59E0B', '#10B981', '#EF4444', '#A855F7'];
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {Array.from({ length: count }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 2;
        const dur = duration + Math.random() * 2;
        const color = colors[i % colors.length];
        const w = 6 + Math.random() * 6;
        const h = 10 + Math.random() * 8;
        return (
          <div key={i} className="confetti-piece" style={{
            left: `${left}%`, animationDelay: `${delay}s`, animationDuration: `${dur}s`,
            background: color, width: w, height: h,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}/>
        );
      })}
    </div>
  );
}

// Status pill for participant status
function StatusPill({ status }) {
  const map = {
    done:  { cls: 'success', label: '완주' },
    near:  { cls: 'accent',  label: '거의 완료' },
    on:    { cls: '',        label: '진행 중' },
    late:  { cls: 'warn',    label: '느린 페이스' },
    risk:  { cls: 'danger',  label: '위험' },
  };
  const v = map[status] || { cls: '', label: status };
  return <span className={`pill ${v.cls}`}>{v.label}</span>;
}

Object.assign(window, {
  Icon, StatusBar, BottomNav, ProgressRing,
  PlatformChip, LinkCard, Confetti, StatusPill,
});
