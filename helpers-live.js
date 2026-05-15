// Helpers shared by live app — wrapped in IIFE to avoid global scope pollution
(function () {
  const PLATFORMS = {
    instagram: { name: 'Instagram', color: '#E4405F', short: 'IG' },
    youtube:   { name: 'YouTube',   color: '#FF0000', short: 'YT' },
    tiktok:    { name: 'TikTok',    color: '#000000', short: 'TT' },
    blog:      { name: 'Blog',      color: '#03C75A', short: 'BL' },
    threads:   { name: 'Threads',   color: '#000000', short: 'TH' },
    x:         { name: 'X',         color: '#000000', short: 'X' },
  };

  function detectPlatform(url) {
    if (!url) return null;
    const u = url.toLowerCase();
    if (u.includes('instagram.com')) return 'instagram';
    if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
    if (u.includes('tiktok.com')) return 'tiktok';
    if (u.includes('threads.net')) return 'threads';
    if (u.includes('x.com') || u.includes('twitter.com')) return 'x';
    return 'blog';
  }

  function getCurrentWeek(startDate) {
    if (!startDate) return 0;
    const start = new Date(startDate + 'T00:00:00');
    const now = new Date();
    const days = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    if (days < 0) return 0;
    return Math.min(4, Math.floor(days / 7) + 1);
  }

  function formatKDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  }

  function addDays(iso, days) {
    const d = new Date(iso + 'T00:00:00');
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function encouragement(count) {
    if (count === 0) return { emoji: '✨', msg: '오늘부터 시작이에요. 가볍게!' };
    if (count <= 2)  return { emoji: '🌱', msg: '좋은 출발이에요. 천천히 가도 괜찮아요.' };
    if (count <= 4)  return { emoji: '🔥', msg: '리듬을 잘 타고 있어요. 절반까지 한 걸음!' };
    if (count <= 6)  return { emoji: '🚀', msg: '벌써 절반 넘었어요. 마지막 스퍼트!' };
    if (count <= 7)  return { emoji: '🌟', msg: '단 한 번만 더, 완주가 눈앞이에요.' };
    return { emoji: '🎉', msg: '완주 축하해요! 정말 멋져요.' };
  }

  window.LiveHelpers = { PLATFORMS, detectPlatform, getCurrentWeek, formatKDate, addDays, encouragement };
  window.AppData = { PLATFORMS, detectPlatform, encouragement, CHALLENGE: { title: '콘텐츠 챌린지' } };
})();
