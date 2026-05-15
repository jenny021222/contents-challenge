/* global React, ReactDOM, api, LiveHelpers, Icon, StatusBar, BottomNav, ProgressRing, PlatformChip, LinkCard, Confetti */
// Live production app — uses Supabase for data persistence.

const { useState, useEffect, useMemo, useCallback, useRef } = React;
const { PLATFORMS, detectPlatform, getCurrentWeek, formatKDate, addDays, encouragement } = LiveHelpers;

const SESSION_KEY = 'cc-live-session-v1';
const loadSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || '{}'); } catch { return {}; } };
const saveSession = (s) => localStorage.setItem(SESSION_KEY, JSON.stringify(s));
const clearSession = () => localStorage.removeItem(SESSION_KEY);

// ──────────────────────── Top-level ────────────────────────
function App() {
  const [session, setSession] = useState(loadSession);
  const [booting, setBooting] = useState(true);
  const [bootError, setBootError] = useState(null);

  // On first load, hydrate from server if we have a saved session
  const [hydrated, setHydrated] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        if (session.role === 'participant' && session.participantId && session.challengeId) {
          const [p, ch, uploads] = await Promise.all([
            api.getParticipant(session.participantId),
            api.getChallenge(session.challengeId),
            api.listUploadsForParticipant(session.participantId),
          ]);
          if (!p || !ch) { clearSession(); setSession({}); setBooting(false); return; }
          setHydrated({ participant: p, challenge: ch, uploads });
        } else if (session.role === 'admin' && session.challengeId) {
          const ch = await api.getChallenge(session.challengeId);
          if (!ch) { clearSession(); setSession({}); setBooting(false); return; }
          setHydrated({ challenge: ch });
        }
        setBooting(false);
      } catch (e) {
        console.error(e);
        setBootError(e.message || '연결에 실패했어요');
        setBooting(false);
      }
    })();
  }, []);

  const signOut = () => { clearSession(); setSession({}); setHydrated(null); };

  if (booting) {
    return (
      <div className="m-frame" style={{ display: 'grid', placeItems: 'center' }}>
        <div className="tiny">불러오는 중…</div>
      </div>
    );
  }

  if (bootError) {
    return (
      <div className="m-frame" style={{ padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="h3">연결에 실패했어요</div>
        <div className="body mt-2">{bootError}</div>
        <button className="btn btn-soft mt-4" onClick={() => location.reload()}>새로고침</button>
      </div>
    );
  }

  if (session.role === 'participant' && hydrated && hydrated.participant) {
    return <ParticipantApp
      initialParticipant={hydrated.participant}
      initialChallenge={hydrated.challenge}
      initialUploads={hydrated.uploads}
      onSignOut={signOut}
    />;
  }
  if (session.role === 'admin' && hydrated && hydrated.challenge) {
    return <AdminApp
      initialChallenge={hydrated.challenge}
      onSignOut={signOut}
    />;
  }
  return <Entry onParticipant={(p, ch) => {
    const next = { role: 'participant', participantId: p.id, challengeId: ch.id };
    saveSession(next); setSession(next); setHydrated({ participant: p, challenge: ch, uploads: [] });
  }} onAdmin={(ch) => {
    const next = { role: 'admin', challengeId: ch.id };
    saveSession(next); setSession(next); setHydrated({ challenge: ch });
  }}/>;
}

// ──────────────────────── Entry / role select ────────────────────────
function Entry({ onParticipant, onAdmin }) {
  const [screen, setScreen] = useState('role'); // role | p-code | a-pin

  if (screen === 'p-code') return <ParticipantCode onBack={() => setScreen('role')} onDone={onParticipant}/>;
  if (screen === 'a-pin')  return <AdminPin onBack={() => setScreen('role')} onDone={onAdmin}/>;

  return (
    <div className="m-frame">
      <StatusBar />
      <div className="scroll" style={{ paddingTop: 40, paddingBottom: 32, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--ink)', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 16, letterSpacing: '-0.04em' }}>C8</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>콘텐츠 챌린지</div>
        </div>

        <div className="h1" style={{ marginBottom: 8 }}>
          꾸준함이<br/>실력이 되는 <span className="brand-mark">8주</span>
        </div>
        <div className="body mt-2">
          주 2회 × 4주, 총 8회.<br/>
          링크만 붙여 넣으면 자동으로 체크돼요.
        </div>

        <div style={{ marginTop: 36 }}>
          <div className="eyebrow mb-3">어떻게 들어오셨어요?</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button onClick={() => setScreen('p-code')} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: 16, borderRadius: 14,
              border: '1.5px solid var(--ink)', background: 'var(--surface)',
              cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', fontSize: 22 }}>✍️</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>참가자로 시작하기</div>
                <div className="tiny mt-1">초대받은 코드로 입장해요</div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
            </button>

            <button onClick={() => setScreen('a-pin')} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: 16, borderRadius: 14,
              border: '1px solid var(--line)', background: 'white',
              cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', fontSize: 18 }}>🔒</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                  운영자 로그인 <span className="pill" style={{ fontSize: 10, padding: '2px 6px' }}>비공개</span>
                </div>
                <div className="tiny mt-1">4자리 암호로 입장해요</div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
            </button>
          </div>
        </div>

        <div style={{ flex: 1 }}/>
        <div className="tiny text-c mt-6">콘텐츠 챌린지 트래커</div>
      </div>
    </div>
  );
}

// ──────────────────────── Participant entry code + name ────────────────────────
function ParticipantCode({ onBack, onDone }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [stage, setStage] = useState('code'); // code | name
  const [challenge, setChallenge] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);
  const [joining, setJoining] = useState(false);

  // Check code as user types (debounced)
  useEffect(() => {
    if (code.length < 4) { setChallenge(null); setError(null); return; }
    let cancel = false;
    setChecking(true); setError(null);
    const t = setTimeout(async () => {
      try {
        const c = await api.findChallengeByCode(code);
        if (cancel) return;
        if (c) { setChallenge(c); setError(null); }
        else { setChallenge(null); setError('해당 코드의 챌린지를 찾을 수 없어요'); }
      } catch (e) {
        if (!cancel) setError(e.message || '확인 실패');
      } finally {
        if (!cancel) setChecking(false);
      }
    }, 400);
    return () => { cancel = true; clearTimeout(t); };
  }, [code]);

  const join = async () => {
    if (!challenge || !name.trim()) return;
    setJoining(true);
    try {
      const p = await api.createParticipant(challenge.id, name.trim());
      onDone(p, challenge);
    } catch (e) {
      setError(e.message || '가입 실패');
      setJoining(false);
    }
  };

  if (stage === 'name' && challenge) {
    return (
      <div className="m-frame">
        <StatusBar />
        <div className="topbar">
          <button className="topbar-action" onClick={() => setStage('code')}>{Icon.back}</button>
          <div className="topbar-title">참가자 정보</div>
          <div style={{ width: 36 }}/>
        </div>
        <div className="scroll" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-soft mt-2" style={{ padding: 14 }}>
            <div className="eyebrow">참가할 챌린지</div>
            <div className="h3 mt-1">{challenge.name}</div>
            <div className="tiny mt-1">{formatKDate(challenge.start_date)} → {formatKDate(challenge.end_date)}</div>
          </div>

          <div className="mt-6">
            <div className="eyebrow mb-2">이름</div>
            <div className="input-wrap focused">
              <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="실명 또는 닉네임" maxLength={16}/>
            </div>
            <div className="tiny mt-2">관리자가 보는 참가자 목록에 표시되는 이름이에요</div>
          </div>

          {error && <div className="tiny mt-3" style={{ color: 'var(--danger)' }}>{error}</div>}

          <div style={{ flex: 1 }}/>
          <button
            className="btn btn-primary btn-full mt-6"
            disabled={!name.trim() || joining}
            onClick={join}
            style={{ background: name.trim() ? 'var(--ink)' : 'var(--surface-2)', color: name.trim() ? 'white' : 'var(--ink-4)' }}
          >
            {joining ? '가입 중…' : '챌린지 시작하기'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="m-frame">
      <StatusBar />
      <div className="topbar">
        <button className="topbar-action" onClick={onBack}>{Icon.back}</button>
        <div className="topbar-title">참가자 입장</div>
        <div style={{ width: 36 }}/>
      </div>

      <div className="scroll" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="h2 mt-2">초대 코드를 입력해주세요</div>
        <div className="body mt-2">운영자가 보내드린 코드를 넣으면 바로 시작할 수 있어요.</div>

        <div className="mt-6">
          <div className="input-wrap focused">
            <input
              autoFocus
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
              placeholder="ABCD12"
              style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: 22, fontWeight: 600, letterSpacing: '0.16em',
                textAlign: 'center',
              }}
            />
          </div>
        </div>

        <div className="mt-4" style={{
          padding: '12px 14px', borderRadius: 10,
          background: challenge ? '#F0FDF4' : error ? '#FEF2F2' : 'var(--surface)',
          color: challenge ? '#065F46' : error ? '#991B1B' : 'var(--ink-3)',
          fontSize: 13, fontWeight: 600, minHeight: 20,
        }}>
          {checking ? '확인 중…' :
           challenge ? <><span style={{ color: 'var(--success)' }}>{Icon.check}</span> {challenge.name} 코드가 확인됐어요</> :
           error ? error :
           '코드를 입력해주세요'}
        </div>

        <div style={{ flex: 1 }}/>
        <button
          className="btn btn-primary btn-full mt-6"
          disabled={!challenge}
          onClick={() => setStage('name')}
          style={{ background: challenge ? 'var(--ink)' : 'var(--surface-2)', color: challenge ? 'white' : 'var(--ink-4)' }}
        >
          다음
        </button>
      </div>
    </div>
  );
}

// ──────────────────────── Admin PIN ────────────────────────
function AdminPin({ onBack, onDone }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [matches, setMatches] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (full) => {
    setBusy(true);
    try {
      const found = await api.findChallengesByPin(full);
      if (found.length === 0) {
        setError(true); setPin('');
      } else if (found.length === 1) {
        onDone(found[0]);
      } else {
        setMatches(found);
      }
    } catch (e) {
      console.error(e);
      setError(true); setPin('');
    } finally {
      setBusy(false);
    }
  };

  const push = (d) => {
    setError(false);
    const next = (pin + d).slice(0, 4);
    setPin(next);
    if (next.length === 4) submit(next);
  };

  if (matches) {
    return (
      <div className="m-frame">
        <StatusBar />
        <div className="topbar">
          <button className="topbar-action" onClick={() => { setMatches(null); setPin(''); }}>{Icon.back}</button>
          <div className="topbar-title">챌린지 선택</div>
          <div style={{ width: 36 }}/>
        </div>
        <div className="scroll">
          <div className="body mb-3">같은 PIN을 쓰는 챌린지가 여러 개 있어요. 들어갈 챌린지를 골라주세요.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {matches.map(c => (
              <button key={c.id} onClick={() => onDone(c)} className="card" style={{ textAlign: 'left', border: '1px solid var(--line)', cursor: 'pointer', fontFamily: 'inherit' }}>
                <div className="row-spread">
                  <div className="h3">{c.name}</div>
                  <span className={`pill ${c.active ? 'success' : ''}`}>{c.active ? '진행 중' : '종료됨'}</span>
                </div>
                <div className="tiny mt-2">{formatKDate(c.start_date)} → {formatKDate(c.end_date)}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="m-frame">
      <StatusBar />
      <div className="topbar">
        <button className="topbar-action" onClick={onBack}>{Icon.back}</button>
        <div className="topbar-title">운영자 로그인</div>
        <div style={{ width: 36 }}/>
      </div>

      <div className="scroll" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--ink)', color: 'white', display: 'grid', placeItems: 'center', marginTop: 12 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="10" width="16" height="11" rx="2"/>
            <path d="M8 10V7a4 4 0 018 0v3"/>
          </svg>
        </div>

        <div className="h2 mt-4">운영자 암호</div>
        <div className="body mt-2" style={{ maxWidth: 280 }}>
          챌린지를 만들 때 설정한 4자리 PIN을 입력해주세요.
        </div>

        <div style={{ display: 'flex', gap: 14, marginTop: 28 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{
              width: 16, height: 16, borderRadius: '50%',
              background: i < pin.length ? (error ? 'var(--danger)' : 'var(--ink)') : 'transparent',
              border: i < pin.length ? 'none' : `1.5px solid ${error ? 'var(--danger)' : 'var(--line)'}`,
            }}/>
          ))}
        </div>

        {error && <div className="mt-3" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--danger)' }}>일치하는 챌린지가 없어요</div>}

        <div style={{ flex: 1 }}/>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: '100%', maxWidth: 280, marginBottom: 8 }}>
          {['1','2','3','4','5','6','7','8','9','','0','del'].map((k, i) => {
            if (k === '') return <div key={i}/>;
            if (k === 'del') return (
              <button key={i} disabled={busy} onClick={() => setPin(p => p.slice(0, -1))} style={{ height: 56, border: 'none', borderRadius: 14, background: 'transparent', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--ink-2)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l5-6h13v12H8z"/><path d="M12 9l5 6M17 9l-5 6"/></svg>
              </button>
            );
            return (
              <button key={i} disabled={busy} onClick={() => push(k)} style={{
                height: 56, border: 'none', borderRadius: 14,
                background: 'var(--surface)', fontSize: 22, fontWeight: 500,
                fontFamily: 'inherit', color: 'var(--ink)', cursor: 'pointer',
                letterSpacing: '-0.02em',
              }}>{k}</button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Export
window.LiveApp = { App, Entry };
