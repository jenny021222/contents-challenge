// Supabase API wrapper — all DB calls go through here
/* global supabase */

(function () {
  const url = window.SUPABASE_URL;
  const key = window.SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error('Supabase config missing. supabase-config.js 를 확인하세요.');
    return;
  }
  const client = supabase.createClient(url, key);

  // ─── Challenges ───────────────────────────────────────────
  async function findChallengeByCode(code) {
    const { data, error } = await client
      .from('challenges')
      .select('*')
      .eq('invite_code', code.toUpperCase())
      .eq('active', true)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async function findChallengesByPin(pin) {
    const { data, error } = await client
      .from('challenges')
      .select('*')
      .eq('admin_pin', pin)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function getChallenge(id) {
    const { data, error } = await client
      .from('challenges')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async function listChallenges() {
    const { data, error } = await client
      .from('challenges')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function updateChallenge(id, patch) {
    const { data, error } = await client
      .from('challenges')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function createChallenge(payload) {
    const { data, error } = await client
      .from('challenges')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function endChallenge(id) {
    return updateChallenge(id, { active: false });
  }

  // ─── Participants ─────────────────────────────────────────
  async function createParticipant(challengeId, name) {
    const { data, error } = await client
      .from('participants')
      .insert([{ challenge_id: challengeId, name }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function getParticipant(id) {
    const { data, error } = await client
      .from('participants')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async function listParticipants(challengeId) {
    const { data, error } = await client
      .from('participants')
      .select('*')
      .eq('challenge_id', challengeId)
      .order('joined_at', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async function updateParticipant(id, patch) {
    const { data, error } = await client
      .from('participants')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function removeParticipant(id) {
    const { error } = await client
      .from('participants')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  // ─── Uploads ──────────────────────────────────────────────
  async function listUploadsForParticipant(participantId) {
    const { data, error } = await client
      .from('uploads')
      .select('*')
      .eq('participant_id', participantId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async function listUploadsForChallenge(challengeId) {
    const { data, error } = await client
      .from('uploads')
      .select('*')
      .eq('challenge_id', challengeId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async function createUpload({ participant_id, challenge_id, url: link, platform, week }) {
    const { data, error } = await client
      .from('uploads')
      .insert([{ participant_id, challenge_id, url: link, platform, week }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function deleteUpload(id) {
    const { error } = await client
      .from('uploads')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  window.api = {
    findChallengeByCode, findChallengesByPin, getChallenge, listChallenges,
    updateChallenge, createChallenge, endChallenge,
    createParticipant, getParticipant, listParticipants, updateParticipant, removeParticipant,
    listUploadsForParticipant, listUploadsForChallenge, createUpload, deleteUpload,
  };
})();
