/* global React, api, LiveHelpers, Icon, StatusBar */
// Admin app — manages challenges, participants, uploads

const { useState: useS_a, useEffect: useE_a, useMemo: useM_a, useCallback: useC_a } = React;
const { PLATFORMS: PLA, getCurrentWeek: gcw_a, formatKDate: fkd_a, addDays: adays_a } = LiveHelpers;

function AdminApp({ initialChallenge, onSignOut }) {
  const [challenge, setChallenge] = useS_a(initialChallenge);
  const [participants, setParticipants] = useS_a([]);
  const [uploads, setUploads] = useS_a([]);
  const [tab, setTab] = useS_a('dash');  // dash | participants | settings | seasons
  const [loading, setLoading] = useS_a(true);
  const [showSwitcher, setShowSwitcher] = useS_a(false);

  const load = useC_a(async () => {
    setLoading(true);
    try {
      const [ch, ps, us] = await Promise.all([
        api.getChallenge(challenge.id),
        api.listParticipants(challenge.id),
        api.listUploadsForChallenge(challenge.id),
      ]);
      if (ch) setChallenge(ch);
      setParticipants(ps);
      setUploads(us);
    } finally { setLoading(false); }
  }, [challenge.id]);

  useE_a(() => { load(); }, [load]);
  useE_a(() => {
    const t = setInterval(load, 30000);
    const onVis = () => { if (!document.hidden) load(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVis); };
  }, [load]);

  const switchChallenge = (c) => {
    setShowSwitcher(false);
    setChallenge(c);
    // Update session so refresh keeps the new selection
    const s = JSON.parse(localStorage.getItem('cc-live-session-v1') || '{}');
    localStorage.setItem('cc-live-session-v1', JSON.stringify({ ...s, challengeId: c.id }));
  };

  if (showSwitcher) return <SeasonSwitcher current={challenge} onPick={switchChallenge} onClose={() => setShowSwitcher(false)} onCreate={(c) => switchChallenge(c)}/>;

  return (
    <div className="m-frame">
      <StatusBar />
      <div className="topbar">
        <button className="topbar-action" onClick={onSignOut} title="로그아웃">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
        </button>
        <div className="topbar-title">운영자</div>
        <button className="topbar-action" onClick={() => setShowSwitcher(true)} title="시즌 전환">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v18M16 21V3M3 8l5-5 5 5M21 16l-5 5-5-5"/></svg>
        </button>
      </div>

      <div style={{ padding: '0 20px 8px' }}>
        <div className="row-spread">
          <div>
            <div className="eyebrow">현재 시즌</div>
            <div className="h2 mt-1">{challenge.name}</div>
          </div>
          {!challenge.active && <span className="pill" style={{ background: 'var(--surface-2)' }}>종료됨</span>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '4px 20px 12px' }}>
        <div className="tabs">
          {['dash','participants','settings'].map((t, i) => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {['대시보드','참가자','설정'][i]}
            </button>
          ))}
        </div>
      </div>

      <div className="scroll" style={{ paddingTop: 4 }}>
        {tab === 'dash'         && <A_Dashboard challenge={challenge} participants={participants} uploads={uploads} loading={loading}/>}
        {tab === 'participants' && <A_Participants challenge={challenge} participants={participants} uploads={uploads} onRefresh={load}/>}
        {tab === 'settings'     && <A_Settings challenge={challenge} onChange={(c) => setChallenge(c)} onSwitch={() => setShowSwitcher(true)} onSignOut={onSignOut}/>}
      </div>
    </div>
  );
}

// ─────────────────────── Dashboard tab ───────────────────────
function A_Dashboard({ challenge, participants, uploads, loading }) {
  const total = challenge.total_target || 8;
  const cw = gcw_a(challenge.start_date);
  const expectedPer = Math.min(cw * (challenge.per_week || 2), total);
  const totalUploads = uploads.length;
  const expectedTotal = participants.length * expectedPer;
  const completionRate = expectedTotal ? Math.round((totalUploads / expectedTotal) * 100) : 0;
  const completers = participants.filter(p => uploads.filter(u => u.participant_id === p.id).length >= total).length;
  const atRisk = participants.filter(p => uploads.filter(u => u.participant_id === p.id).length < Math.max(0, expectedPer - 2)).length;

  return (
    <>
      <div className="card-soft" style={{ padding: 18 }}>
        <div className="eyebrow">{cw === 0 ? '시작 전' : `${cw}주차 진행률`}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
          <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1 }}>{completionRate}<span style={{ fontSize: 20 }}>%</span></div>
          <div className="tiny" style={{ marginLeft: 'auto' }}>{loading ? '갱신 중…' : `방금 갱신됨`}</div>
        </div>
        <div className="bar-track mt-3" style={{ height: 8 }}><div className="bar-fill" style={{ width: `${completionRate}%`, background: 'var(--ink)' }}/></div>
        <div className="row-spread mt-2">
          <div className="tiny">{totalUploads}회 / 기대 {expectedTotal}회</div>
          <div className="tiny">목표 {participants.length * total}회</div>
        </div>
      </div>

      <div className="mt-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        <div className="stat-tile"><div className="stat-num">{participants.length}</div><div className="stat-label">참가자</div></div>
        <div className="stat-tile"><div className="stat-num" style={{ color: atRisk > 0 ? 'var(--danger)' : undefined }}>{atRisk}</div><div className="stat-label">위험 참가자</div></div>
        <div className="stat-tile"><div className="stat-num">{completers}</div><div className="stat-label">완주자</div></div>
        <div className="stat-tile"><div className="stat-num">{participants.length ? Math.round(totalUploads / participants.length * 10) / 10 : 0}</div><div className="stat-label">1인 평균</div></div>
      </div>

      {/* Platform breakdown */}
      {uploads.length > 0 && (
        <div className="mt-6">
          <div className="h3 mb-3">플랫폼 분포</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(uploads.reduce((acc, u) => {
              const p = u.platform || 'blog';
              acc[p] = (acc[p] || 0) + 1;
              return acc;
            }, {})).sort((a, b) => b[1] - a[1]).map(([k, v]) => {
              const p = PLA[k] || PLA.blog;
              const pct = Math.round((v / uploads.length) * 100);
              return (
                <div key={k}>
                  <div className="row-spread mb-2">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="plat-dot" style={{ background: p.color }}>{p.short}</div>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                    </div>
                    <div className="tiny">{v}건 · {pct}%</div>
                  </div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%`, background: p.color }}/></div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {participants.length === 0 && (
        <div className="mt-6 card-soft text-c" style={{ padding: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 6 }}>👋</div>
          <div className="h3">아직 참가자가 없어요</div>
          <div className="body mt-2">초대 코드 <b style={{ color: 'var(--ink)' }}>{challenge.invite_code}</b>를 참가자에게 공유해주세요.</div>
        </div>
      )}
    </>
  );
}

// ─────────────────────── Participants tab ───────────────────────
function A_Participants({ challenge, participants, uploads, onRefresh }) {
  const total = challenge.total_target || 8;
  const cw = gcw_a(challenge.start_date);
  const expectedPer = Math.min(cw * (challenge.per_week || 2), total);
  const [filter, setFilter] = useS_a('all');

  const enriched = participants.map(p => {
    const myUploads = uploads.filter(u => u.participant_id === p.id);
    const count = myUploads.length;
    const last = myUploads.length ? myUploads[myUploads.length - 1].created_at : null;
    let status = 'on';
    if (count >= total) status = 'done';
    else if (count >= expectedPer - 1) status = 'on';
    else if (count >= expectedPer - 2) status = 'late';
    else status = 'risk';
    return { ...p, count, last, status };
  });

  const shown = enriched.filter(p => {
    if (filter === 'on')   return p.status === 'on' || p.status === 'done';
    if (filter === 'late') return p.status === 'late';
    if (filter === 'risk') return p.status === 'risk';
    return true;
  });

  const remove = async (p) => {
    if (!confirm(`${p.name}님을 챌린지에서 제거할까요? 업로드 기록도 함께 삭제돼요.`)) return;
    await api.removeParticipant(p.id);
    onRefresh();
  };

  return (
    <>
      <div className="tabs" style={{ marginBottom: 12 }}>
        {[
          { id: 'all', label: `전체 ${enriched.length}` },
          { id: 'on', label: '정상' },
          { id: 'late', label: '느림' },
          { id: 'risk', label: '위험' },
        ].map(f => (
          <button key={f.id} className={`tab ${filter === f.id ? 'active' : ''}`} onClick={() => setFilter(f.id)}>{f.label}</button>
        ))}
      </div>

      <div className="tiny mb-2">
        {cw === 0 ? '시작 전 · 기대치 0회' : `${cw}주차 · 기대치 ${expectedPer}회`}
      </div>

      {shown.length === 0 ? (
        <div className="card-soft text-c" style={{ padding: 24 }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>👥</div>
          <div className="h3">해당하는 참가자가 없어요</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {shown.map((p, i) => {
            const pct = Math.round((p.count / total) * 100);
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < shown.length - 1 ? '1px solid var(--line-2)' : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface)', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 600 }}>{p.name[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row-spread" style={{ gap: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
                    <span className={`pill ${p.status === 'done' ? 'success' : p.status === 'late' ? 'warn' : p.status === 'risk' ? 'danger' : ''}`}>
                      {p.status === 'done' ? '완주' : p.status === 'late' ? '느림' : p.status === 'risk' ? '위험' : '정상'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                    {Array.from({ length: total }).map((_, j) => (
                      <div key={j} style={{ flex: 1, height: 4, borderRadius: 99, background: j < p.count ? 'var(--ink)' : 'var(--surface-2)' }}/>
                    ))}
                  </div>
                  <div className="tiny mt-1">
                    {p.count}/{total} · 최근 {p.last ? new Date(p.last).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : '—'}
                  </div>
                </div>
                <button onClick={() => remove(p)} title="제거" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', padding: 6 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ─────────────────────── Settings tab ───────────────────────
function A_Settings({ challenge, onChange, onSwitch, onSignOut }) {
  const cw = gcw_a(challenge.start_date);
  const dDays = Math.ceil((new Date(challenge.start_date + 'T00:00:00') - new Date()) / 86400000);

  return (
    <>
      {/* Period */}
      <EditableCard
        label="챌린지 기간"
        sub={cw === 0 ? `시작 전 · D-${dDays}` : `${cw}주차 진행 중 · 총 ${challenge.weeks || 4}주`}
        display={`${fkd_a(challenge.start_date)} → ${fkd_a(challenge.end_date)}`}
        renderEditor={(close) => <PeriodEditor challenge={challenge} onSave={async (start) => {
          const end = adays_a(start, (challenge.weeks || 4) * 7 - 1);
          const updated = await api.updateChallenge(challenge.id, { start_date: start, end_date: end });
          onChange(updated); close();
        }}/>}
      />

      {/* Name */}
      <EditableCard
        label="시즌 이름"
        sub="목록과 참가자 화면에 표시돼요"
        display={challenge.name}
        renderEditor={(close) => <TextEditor initial={challenge.name} maxLen={30} onSave={async (v) => {
          const updated = await api.updateChallenge(challenge.id, { name: v });
          onChange(updated); close();
        }}/>}
      />

      {/* Invite code */}
      <EditableCard
        label="참가자 초대 코드"
        sub="참가자에게 공유할 코드"
        display={challenge.invite_code}
        mono
        renderEditor={(close) => <TextEditor initial={challenge.invite_code} maxLen={8} minLen={4}
          transform={v => v.toUpperCase().replace(/[^A-Z0-9]/g, '')}
          mono
          onSave={async (v) => {
            try {
              const updated = await api.updateChallenge(challenge.id, { invite_code: v });
              onChange(updated); close();
            } catch (e) { alert(e.message?.includes('duplicate') ? '이미 사용 중인 코드예요' : '저장 실패'); }
          }}/>}
      />

      {/* Admin PIN */}
      <EditableCard
        label="운영자 PIN"
        sub="4자리 숫자"
        display={'••••'}
        mono
        renderEditor={(close) => <TextEditor initial={challenge.admin_pin} maxLen={4} minLen={4}
          transform={v => v.replace(/[^0-9]/g, '').slice(0, 4)}
          mono
          onSave={async (v) => {
            const updated = await api.updateChallenge(challenge.id, { admin_pin: v });
            onChange(updated); close();
          }}/>}
      />

      {/* Switch / new season */}
      <div className="card mt-4" style={{ padding: 16 }}>
        <div className="row-spread">
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>시즌 관리</div>
            <div className="tiny mt-1">다른 시즌으로 전환하거나 새 시즌 시작</div>
          </div>
          <button onClick={onSwitch} className="btn btn-soft" style={{ padding: '8px 14px', fontSize: 13 }}>시즌 목록 →</button>
        </div>
      </div>

      {/* End challenge */}
      {challenge.active && (
        <button onClick={async () => {
          if (!confirm('이 시즌을 종료할까요? 참가자는 더 이상 가입할 수 없게 돼요.')) return;
          const updated = await api.endChallenge(challenge.id);
          onChange(updated);
        }} className="btn btn-soft btn-full mt-4" style={{ color: 'var(--danger)' }}>이 시즌 종료하기</button>
      )}

      <button onClick={onSignOut} className="btn btn-soft btn-full mt-2">로그아웃</button>

      <div className="tiny text-c mt-4" style={{ color: 'var(--ink-4)' }}>v1.0 · 운영자 모드</div>
    </>
  );
}

function EditableCard({ label, sub, display, mono, renderEditor }) {
  const [editing, setEditing] = useS_a(false);
  return (
    <div className="card mt-4" style={{ padding: 16 }}>
      <div className="row-spread">
        <div>
          <div className="eyebrow">{label}</div>
          {sub && <div className="tiny mt-1">{sub}</div>}
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', fontSize: 12.5, fontWeight: 600, color: 'var(--primary)', cursor: 'pointer', fontFamily: 'inherit' }}>편집</button>
        )}
      </div>
      {!editing ? (
        <div className={`mt-2 ${mono ? 'mono' : ''}`} style={{ fontSize: 17, fontWeight: 600, letterSpacing: mono ? '0.08em' : '-0.02em' }}>{display}</div>
      ) : renderEditor(() => setEditing(false))}
    </div>
  );
}

function PeriodEditor({ challenge, onSave }) {
  const [draft, setDraft] = useS_a(challenge.start_date);
  const [busy, setBusy] = useS_a(false);
  const weeks = challenge.weeks || 4;
  return (
    <div className="mt-2">
      <label className="tiny" style={{ display: 'block', marginBottom: 6 }}>시작 날짜</label>
      <input type="date" value={draft} onChange={e => setDraft(e.target.value)}
        style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--line)', borderRadius: 10, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }}/>
      <div className="tiny mt-2">→ 종료: {fkd_a(adays_a(draft, weeks * 7 - 1))} ({weeks}주)</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button onClick={() => onSave(challenge.start_date)} className="btn btn-soft" style={{ flex: 1 }} disabled={busy}>취소</button>
        <button onClick={async () => { setBusy(true); try { await onSave(draft); } finally { setBusy(false); } }} className="btn btn-primary" style={{ flex: 1 }} disabled={busy}>저장</button>
      </div>
    </div>
  );
}

function TextEditor({ initial, maxLen, minLen = 1, transform, mono, onSave }) {
  const [draft, setDraft] = useS_a(initial);
  const [busy, setBusy] = useS_a(false);
  const ok = draft.length >= minLen && draft.length <= maxLen;
  return (
    <div className="mt-2">
      <input autoFocus value={draft} onChange={e => setDraft(transform ? transform(e.target.value) : e.target.value)} maxLength={maxLen}
        style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--line)', borderRadius: 10, fontSize: 16, fontFamily: mono ? 'ui-monospace, Menlo, monospace' : 'inherit', letterSpacing: mono ? '0.08em' : 'normal', boxSizing: 'border-box' }}/>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button onClick={() => onSave(initial)} className="btn btn-soft" style={{ flex: 1 }} disabled={busy}>취소</button>
        <button onClick={async () => { setBusy(true); try { await onSave(draft); } finally { setBusy(false); } }} className="btn btn-primary" style={{ flex: 1 }} disabled={!ok || busy}>저장</button>
      </div>
    </div>
  );
}

// ─────────────────────── Season switcher / create new ───────────────────────
function SeasonSwitcher({ current, onPick, onClose, onCreate }) {
  const [list, setList] = useS_a(null);
  const [creating, setCreating] = useS_a(false);

  useE_a(() => { (async () => setList(await api.listChallenges()))(); }, []);

  if (creating) return <NewSeason onBack={() => setCreating(false)} onCreated={onCreate}/>;

  return (
    <div className="m-frame">
      <StatusBar />
      <div className="topbar">
        <button className="topbar-action" onClick={onClose}>{Icon.back}</button>
        <div className="topbar-title">시즌 목록</div>
        <button className="topbar-action" onClick={() => setCreating(true)} title="새 시즌">{Icon.plus}</button>
      </div>

      <div className="scroll">
        {!list ? (
          <div className="tiny">불러오는 중…</div>
        ) : list.length === 0 ? (
          <div className="card-soft text-c" style={{ padding: 24, marginTop: 24 }}>
            <div className="h3">시즌이 없어요</div>
            <button onClick={() => setCreating(true)} className="btn btn-primary mt-4">첫 시즌 만들기</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {list.map(c => (
              <button key={c.id} onClick={() => onPick(c)} className="card" style={{ textAlign: 'left', border: c.id === current.id ? '1.5px solid var(--ink)' : '1px solid var(--line)', cursor: 'pointer', fontFamily: 'inherit', background: c.id === current.id ? 'var(--surface)' : 'white' }}>
                <div className="row-spread">
                  <div className="h3">{c.name}</div>
                  <span className={`pill ${c.active ? 'success' : ''}`}>{c.active ? '진행 중' : '종료됨'}</span>
                </div>
                <div className="tiny mt-2">{fkd_a(c.start_date)} → {fkd_a(c.end_date)}</div>
                <div className="tiny mt-1">코드 <span className="mono">{c.invite_code}</span></div>
              </button>
            ))}

            <button onClick={() => setCreating(true)} className="btn btn-soft mt-2">+ 새 시즌 만들기</button>
          </div>
        )}
      </div>
    </div>
  );
}

function NewSeason({ onBack, onCreated }) {
  const [name, setName] = useS_a('');
  const [start, setStart] = useS_a(new Date().toISOString().slice(0, 10));
  const [code, setCode] = useS_a('');
  const [pin, setPin] = useS_a('');
  const [busy, setBusy] = useS_a(false);
  const [err, setErr] = useS_a(null);
  const ok = name.trim() && code.length >= 4 && pin.length === 4 && start;

  const submit = async () => {
    if (!ok || busy) return;
    setBusy(true); setErr(null);
    try {
      const end = adays_a(start, 27);
      const c = await api.createChallenge({
        name: name.trim(),
        start_date: start,
        end_date: end,
        invite_code: code,
        admin_pin: pin,
        total_target: 8, weeks: 4, per_week: 2, active: true,
      });
      onCreated(c);
    } catch (e) {
      setErr(e.message?.includes('duplicate') ? '이미 사용 중인 초대 코드예요' : (e.message || '생성 실패'));
      setBusy(false);
    }
  };

  return (
    <div className="m-frame">
      <StatusBar />
      <div className="topbar">
        <button className="topbar-action" onClick={onBack}>{Icon.back}</button>
        <div className="topbar-title">새 시즌</div>
        <div style={{ width: 36 }}/>
      </div>

      <div className="scroll">
        <div className="h2">시즌 정보를 입력해 주세요</div>
        <div className="body mt-2">시작일 + 28일이 자동으로 종료일이 돼요 (4주 챌린지)</div>

        <div className="mt-6">
          <div className="eyebrow mb-2">시즌 이름</div>
          <div className="input-wrap"><input value={name} onChange={e => setName(e.target.value)} placeholder="예: 4기 여름 시즌" maxLength={30}/></div>
        </div>

        <div className="mt-4">
          <div className="eyebrow mb-2">시작 날짜</div>
          <input type="date" value={start} onChange={e => setStart(e.target.value)} style={{ width: '100%', padding: '14px 16px', border: '1.5px solid var(--line)', borderRadius: 14, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }}/>
          <div className="tiny mt-2">→ 종료: {fkd_a(adays_a(start, 27))}</div>
        </div>

        <div className="mt-4">
          <div className="eyebrow mb-2">참가자 초대 코드 (4-8자, 영문/숫자)</div>
          <div className="input-wrap"><input value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))} placeholder="C8SMR4" style={{ fontFamily: 'ui-monospace, monospace', letterSpacing: '0.08em' }}/></div>
        </div>

        <div className="mt-4">
          <div className="eyebrow mb-2">운영자 PIN (숫자 4자리)</div>
          <div className="input-wrap"><input value={pin} onChange={e => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))} placeholder="1234" inputMode="numeric" style={{ fontFamily: 'ui-monospace, monospace', letterSpacing: '0.12em' }}/></div>
        </div>

        {err && <div className="tiny mt-3" style={{ color: 'var(--danger)' }}>{err}</div>}

        <button onClick={submit} disabled={!ok || busy} className="btn btn-primary btn-full mt-6"
          style={{ background: ok && !busy ? 'var(--ink)' : 'var(--surface-2)', color: ok && !busy ? 'white' : 'var(--ink-4)' }}>
          {busy ? '생성 중…' : '시즌 시작하기'}
        </button>
      </div>
    </div>
  );
}

window.AdminApp = AdminApp;
