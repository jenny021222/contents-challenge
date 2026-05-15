/* global React, api, LiveHelpers, Icon, StatusBar, BottomNav, ProgressRing, LinkCard, Confetti */
// Participant + Admin app tabs — Supabase-backed

const { useState: useS_p, useEffect: useE_p, useMemo: useM_p, useCallback: useC_p } = React;
const { PLATFORMS: PL, detectPlatform: dp, getCurrentWeek: gcw, formatKDate: fkd, addDays: adays, encouragement: enc_fn } = LiveHelpers;

// ─────────────────────── Participant App ───────────────────────
function ParticipantApp({ initialParticipant, initialChallenge, initialUploads, onSignOut }) {
  const [participant] = useS_p(initialParticipant);
  const [challenge, setChallenge] = useS_p(initialChallenge);
  const [uploads, setUploads] = useS_p(initialUploads || []);
  const [tab, setTab] = useS_p('home');
  const currentWeek = gcw(challenge.start_date);

  // Refresh data periodically (in case admin changed challenge dates)
  const refresh = useC_p(async () => {
    try {
      const [u, ch] = await Promise.all([
        api.listUploadsForParticipant(participant.id),
        api.getChallenge(challenge.id),
      ]);
      setUploads(u); setChallenge(ch);
    } catch (e) { console.warn('refresh failed', e); }
  }, [participant.id, challenge.id]);

  useE_p(() => {
    const t = setInterval(refresh, 30000); // 30s
    const onVis = () => { if (!document.hidden) refresh(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVis); };
  }, [refresh]);

  const addUpload = async ({ url, platform, title, note }) => {
    const week = Math.max(1, currentWeek || 1);
    const u = await api.createUpload({ participant_id: participant.id, challenge_id: challenge.id, url, platform, week });
    setUploads(prev => [...prev, u]);
    return u;
  };

  const removeUpload = async (id) => {
    await api.deleteUpload(id);
    setUploads(prev => prev.filter(u => u.id !== id));
  };

  return (
    <div className="m-frame">
      <StatusBar />
      {tab === 'home'    && <P_Home    participant={participant} challenge={challenge} uploads={uploads} currentWeek={currentWeek} onNew={() => setTab('upload')} onSignOut={onSignOut}/>}
      {tab === 'upload'  && <P_Upload  challenge={challenge} uploads={uploads} currentWeek={currentWeek} onSubmit={addUpload} onCancel={() => setTab('home')}/>}
      {tab === 'history' && <P_History uploads={uploads} onRemove={removeUpload}/>}
      {tab === 'profile' && <P_Profile participant={participant} challenge={challenge} uploads={uploads} onSignOut={onSignOut}/>}
      <BottomNav active={['home','upload','history','profile'].indexOf(tab)} onChange={i => setTab(['home','upload','history','profile'][i])} items={[
        { icon: Icon.home,   label: '홈' },
        { icon: Icon.upload, label: '업로드' },
        { icon: Icon.list,   label: '기록' },
        { icon: Icon.user,   label: '내 정보' },
      ]}/>
    </div>
  );
}

function P_Home({ participant, challenge, uploads, currentWeek, onNew, onSignOut }) {
  const count = uploads.length;
  const total = challenge.total_target || 8;
  const enc = enc_fn(count);
  const isDone = count >= total;
  const cw = currentWeek || 0;
  const expected = Math.max(0, (cw - 1) * (challenge.per_week || 2) + 1);
  const pace = cw === 0 ? 'on' : count >= expected ? 'on' : (count >= expected - 1 ? 'on' : (count >= expected - 2 ? 'late' : 'risk'));
  const byWeek = [1, 2, 3, 4].map(w => uploads.filter(u => u.week === w));
  const recent = [...uploads].reverse().slice(0, 3);

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="avatar" style={{ width: 32, height: 32, fontSize: 16 }}>🌿</div>
          <div>
            <div className="tiny">안녕하세요</div>
            <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.1 }}>{participant.name}님 👋</div>
          </div>
        </div>
        <button className="topbar-action" onClick={onSignOut} title="로그아웃">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
        </button>
      </div>

      <div className="scroll">
        <div className="card-soft" style={{ padding: '20px 16px 24px', position: 'relative', overflow: 'hidden' }}>
          {isDone && <Confetti />}
          <div className="row-spread" style={{ position: 'relative' }}>
            <div>
              <div className="eyebrow">{cw === 0 ? '시작 전' : `${cw}주차`} · {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}</div>
              <div className="h3 mt-1">{challenge.name}</div>
            </div>
            <span className={`pill ${pace === 'on' ? 'success' : pace === 'late' ? 'warn' : 'danger'}`}>
              {count === 0 ? '시작 전' : pace === 'on' ? '정상 속도' : pace === 'late' ? '한 박자 느림' : '서둘러요'}
            </span>
          </div>

          <div style={{ display: 'grid', placeItems: 'center', margin: '20px 0 8px' }}>
            <ProgressRing value={count} total={total} size={200} stroke={16} showCheck={isDone}/>
          </div>

          <div className="banner mt-3"><span className="banner-emoji">{enc.emoji}</span><div style={{ flex: 1, lineHeight: 1.4 }}>{enc.msg}</div></div>
        </div>

        <div className="mt-6">
          <div className="row-spread mb-3">
            <div className="h3">주차별 현황</div>
            <span className="tiny">한 주 {challenge.per_week || 2}회</span>
          </div>
          <div className="week-grid">
            {byWeek.map((items, i) => {
              const isCurrent = i + 1 === cw;
              const isFuture = i + 1 > cw;
              const d1 = items[0]; const d2 = items[1];
              return (
                <div key={i} className="week-cell" style={{ background: isCurrent ? 'var(--ink)' : 'var(--surface)', color: isCurrent ? 'white' : 'inherit' }}>
                  <div className="week-cell-label" style={{ color: isCurrent ? 'rgba(255,255,255,0.7)' : undefined }}>{i + 1}주차</div>
                  <div className="week-cell-dots">
                    <div className="dot" style={{ background: d1 ? (isCurrent ? 'white' : 'var(--ink)') : (isFuture ? 'transparent' : 'var(--line)'), ...(isFuture && !d1 ? { border: '1.5px dashed var(--line)' } : {}) }}/>
                    <div className="dot" style={{ background: d2 ? (isCurrent ? 'white' : 'var(--ink)') : (isFuture ? 'transparent' : 'var(--line)'), ...(isFuture && !d2 ? { border: '1.5px dashed var(--line)' } : {}) }}/>
                  </div>
                  <div style={{ fontSize: 10, marginTop: 8, opacity: 0.7 }}>{items.length}/{challenge.per_week || 2}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          <div className="h3 mb-3">획득한 뱃지</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { e: '🌱', n: '첫 업로드', t: 1 },
              { e: '🔥', n: '주차 완료', t: 2 },
              { e: '🚀', n: '절반 돌파', t: 4 },
              { e: '🌟', n: '7회 달성', t: 7 },
              { e: '🎯', n: '꾸준함',   t: 5 },
              { e: '💎', n: '완주',     t: 8 },
              { e: '🏆', n: '챔피언',   t: 8 },
              { e: '🎁', n: '리워드',   t: 8 },
            ].map((b, i) => {
              const unlocked = count >= b.t;
              return (
                <div key={i} className={`badge-tile ${!unlocked ? 'locked' : ''}`}>
                  <div className="badge-glyph">{unlocked ? b.e : '🔒'}</div>
                  <div className="badge-name">{b.n}</div>
                </div>
              );
            })}
          </div>
        </div>

        {recent.length > 0 ? (
          <div className="mt-6">
            <div className="row-spread mb-3"><div className="h3">최근 업로드</div><span className="tiny">{uploads.length}개</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recent.map(u => <LinkCard key={u.id} upload={{...u, date: new Date(u.created_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }), title: u.title || `${u.week}주차 업로드`}}/>)}
            </div>
          </div>
        ) : (
          <div className="mt-6 card-soft text-c" style={{ padding: 24 }}>
            <div style={{ fontSize: 32, marginBottom: 6 }}>✨</div>
            <div className="h3">첫 번째 업로드를 시작해 보세요</div>
            <div className="body mt-2">아래 + 버튼을 누르고 콘텐츠 링크를 붙여 넣으면 돼요.</div>
          </div>
        )}
      </div>

      <button className="fab" onClick={onNew}>{Icon.plus}</button>
    </>
  );
}

function P_Upload({ challenge, uploads, currentWeek, onSubmit, onCancel }) {
  const [url, setUrl] = useS_p('');
  const [stage, setStage] = useS_p('input');
  const [busy, setBusy] = useS_p(false);
  const [err, setErr] = useS_p(null);

  const detected = url ? dp(url) : null;
  const platform = detected ? PL[detected] : null;
  const canSubmit = !!detected && !!url.trim();
  const count = uploads.length;
  const nextNum = count + 1;
  const total = challenge.total_target || 8;
  const week = currentWeek || 1;
  const inCw = uploads.filter(u => u.week === week).length;
  const day = inCw + 1;

  const submit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true); setErr(null);
    try {
      await onSubmit({ url: url.trim(), platform: detected });
      setStage('success');
      setTimeout(() => onCancel(), 1600);
    } catch (e) {
      setErr(e.message || '업로드 실패'); setBusy(false);
    }
  };

  if (count >= total) {
    return (
      <>
        <div className="topbar">
          <button className="topbar-action" onClick={onCancel}>{Icon.back}</button>
          <div className="topbar-title">완주 완료</div>
          <div style={{ width: 36 }}/>
        </div>
        <div className="scroll" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: 32, position: 'relative' }}>
          <Confetti count={30}/>
          <div style={{ fontSize: 64, marginTop: 40 }}>🎉</div>
          <div className="h2 mt-3">{total}회 모두 완료했어요!</div>
          <div className="body mt-2">더 이상 업로드하지 않아도 돼요. 정말 멋져요!</div>
          <button className="btn btn-primary btn-full mt-6" onClick={onCancel}>홈으로 돌아가기</button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="topbar">
        <button className="topbar-action" onClick={onCancel}>{Icon.back}</button>
        <div className="topbar-title">새 업로드</div>
        <div style={{ width: 36 }}/>
      </div>

      <div className="scroll" style={{ position: 'relative' }}>
        {stage === 'success' && <Confetti count={22}/>}
        <div className="eyebrow">{week}주차 · {day}번째 업로드 · ({nextNum}/{total})</div>
        <div className="h2 mt-2">링크를 붙여 넣어 주세요</div>
        <div className="body mt-2">URL만 넣으면 플랫폼이 자동 인식되고, 업로드가 바로 카운트돼요.</div>

        <div className="mt-4">
          <div className={`input-wrap ${stage === 'success' ? 'success' : url ? 'focused' : ''}`}>
            <span style={{ color: stage === 'success' ? 'var(--success)' : url ? 'var(--primary)' : 'var(--ink-4)' }}>{Icon.link}</span>
            <input autoFocus value={url} onChange={e => setUrl(e.target.value)} placeholder="https://instagram.com/p/..." disabled={stage === 'success'}/>
            {stage === 'success' && <span style={{ color: 'var(--success)' }}>{Icon.check}</span>}
          </div>

          {detected && (
            <div className="mt-3" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--line-2)' }}>
              <div className="plat-dot" style={{ background: platform.color, width: 28, height: 28, fontSize: 11 }}>{platform.short}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{platform.name} 감지됨</div>
                <div className="tiny mt-1">{stage === 'success' ? '업로드가 카운트됐어요' : '제출하면 진도에 즉시 반영돼요'}</div>
              </div>
              <span className={`pill ${stage === 'success' ? 'success' : 'accent'}`}>{stage === 'success' ? '완료' : '자동 인식'}</span>
            </div>
          )}
        </div>

        <div className="mt-6">
          <div className="eyebrow mb-3">지원 플랫폼 · 그 외 URL은 Blog로 분류돼요</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {Object.entries(PL).map(([k, p]) => (
              <span key={k} className="plat-chip"><span className="plat-dot" style={{ background: p.color }}>{p.short}</span>{p.name}</span>
            ))}
          </div>
        </div>

        {err && <div className="tiny mt-3" style={{ color: 'var(--danger)' }}>{err}</div>}

        {stage === 'success' && (
          <div className="mt-6" style={{ background: 'var(--ink)', color: 'white', borderRadius: 16, padding: '20px 18px' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ fontSize: 32 }}>🎉</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{count}번째 업로드 완료!</div>
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>{total - count > 0 ? `${total - count}회 남았어요` : '챌린지를 완주했어요!'}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 76, padding: '12px 20px 16px', background: 'linear-gradient(to top, white 60%, rgba(255,255,255,0))' }}>
        <button className="btn btn-primary btn-full" disabled={!canSubmit || busy || stage === 'success'} onClick={submit}
          style={{ background: stage === 'success' ? 'var(--success)' : (canSubmit && !busy ? 'var(--ink)' : 'var(--surface-2)'), color: stage === 'success' || (canSubmit && !busy) ? 'white' : 'var(--ink-4)' }}>
          {stage === 'success' ? '✓ 업로드 완료됨' : busy ? '저장 중…' : canSubmit ? '업로드 확정' : '링크를 입력해주세요'}
        </button>
      </div>
    </>
  );
}

function P_History({ uploads, onRemove }) {
  const groupedByWeek = useM_p(() => [1,2,3,4].map(w => uploads.filter(u => u.week === w)), [uploads]);

  return (
    <>
      <div className="topbar"><div className="topbar-title">업로드 기록 · {uploads.length}개</div><div style={{ width: 36 }}/></div>
      <div className="scroll">
        {uploads.length === 0 ? (
          <div className="card-soft text-c" style={{ padding: 32, marginTop: 24 }}>
            <div style={{ fontSize: 32, marginBottom: 6 }}>📭</div>
            <div className="h3">아직 업로드가 없어요</div>
            <div className="body mt-2">업로드 탭에서 링크를 추가해 보세요.</div>
          </div>
        ) : groupedByWeek.map((items, idx) => {
          const w = idx + 1;
          if (items.length === 0) return null;
          return (
            <div key={w} className="mt-4">
              <div className="row-spread mb-2"><div className="eyebrow">{w}주차</div><span className="tiny">{items.length}/2</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[...items].reverse().map(u => {
                  const p = PL[u.platform] || { color: '#999', short: '??', name: '' };
                  return (
                    <div key={u.id} className="link-card" style={{ alignItems: 'flex-start' }}>
                      <div className="link-thumb" style={{ background: p.color }}>{p.short}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.name}</div>
                        <a href={u.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--primary)', textDecoration: 'none', display: 'block', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{u.url}</a>
                        <div className="tiny mt-1">{new Date(u.created_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}</div>
                      </div>
                      <button onClick={() => { if (confirm('이 업로드를 삭제할까요?')) onRemove(u.id); }} title="삭제" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', padding: 4 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function P_Profile({ participant, challenge, uploads, onSignOut }) {
  const count = uploads.length;
  const total = challenge.total_target || 8;
  const pct = Math.round((count / total) * 100);
  return (
    <>
      <div className="topbar"><div className="topbar-title">내 정보</div><div style={{ width: 36 }}/></div>
      <div className="scroll">
        <div className="card-soft text-c" style={{ padding: 24 }}>
          <div className="avatar lg" style={{ margin: '0 auto' }}>🌿</div>
          <div className="h2 mt-3">{participant.name}</div>
          <div className="tiny mt-1">{challenge.name} 참가자</div>
          <div className="bar-track mt-4" style={{ height: 8 }}><div className="bar-fill" style={{ width: `${pct}%`, background: 'var(--ink)' }}/></div>
          <div className="row-spread mt-2"><div className="tiny">진도</div><div className="tiny">{count}/{total} · {pct}%</div></div>
        </div>

        <div className="mt-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          <div className="stat-tile"><div className="stat-num">{count}</div><div className="stat-label">총 업로드</div></div>
          <div className="stat-tile"><div className="stat-num">{Math.max(0, total - count)}</div><div className="stat-label">남은 횟수</div></div>
        </div>

        <div className="mt-6">
          <div className="eyebrow mb-3">챌린지 정보</div>
          <div className="card" style={{ padding: 0 }}>
            <SettingRow label="시즌" right={challenge.name}/>
            <SettingRow label="기간" right={`${fkd(challenge.start_date)} → ${fkd(challenge.end_date)}`}/>
            <SettingRow label="가입일" right={fkd(participant.joined_at?.slice(0, 10))}/>
          </div>
        </div>

        <button onClick={() => { if (confirm('정말 로그아웃할까요? 데이터는 서버에 남아있어요.')) onSignOut(); }} className="btn btn-soft btn-full mt-4">로그아웃</button>
        <div className="tiny text-c mt-4" style={{ color: 'var(--ink-4)' }}>v1.0</div>
      </div>
    </>
  );
}

function SettingRow({ label, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--line-2)' }}>
      <span style={{ flex: 1, fontSize: 14 }}>{label}</span>
      {right && <span className="tiny" style={{ marginRight: 4 }}>{right}</span>}
    </div>
  );
}

window.ParticipantApp = ParticipantApp;
