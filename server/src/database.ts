import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Users ───

export async function ensureUser(kakaoId: string, nickname: string) {
  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('kakao_id', kakaoId)
    .single();

  if (existing) {
    // 닉네임이 변경되었으면 업데이트
    if (nickname && nickname !== '익명' && existing.nickname !== nickname) {
      const { data } = await supabase
        .from('users')
        .update({ nickname })
        .eq('id', existing.id)
        .select()
        .single();
      return data ?? existing;
    }
    return existing;
  }

  const { data, error } = await supabase
    .from('users')
    .insert({ kakao_id: kakaoId, nickname })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserById(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

// ─── Links ───

export async function getFeedLinks(userId: string, page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;

  const { data, error } = await supabase
    .from('referral_links')
    .select('*, users!referral_links_user_id_fkey(nickname)')
    .eq('is_active', true)
    .gt('credits_remaining', 0)
    .neq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
}

export async function createLink(params: {
  userId: string;
  appName: string;
  originalUrl: string;
  shortCode: string;
  description?: string;
  rewardInfo?: string;
  expiresAt?: string;
}) {
  const { data, error } = await supabase
    .from('referral_links')
    .insert({
      user_id: params.userId,
      app_name: params.appName,
      original_url: params.originalUrl,
      short_code: params.shortCode,
      description: params.description,
      reward_info: params.rewardInfo,
      expires_at: params.expiresAt,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getMyLinks(userId: string) {
  const { data, error } = await supabase
    .from('referral_links')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateLink(linkId: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('referral_links')
    .update(updates)
    .eq('id', linkId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getLinkByShortCode(shortCode: string) {
  const { data, error } = await supabase
    .from('referral_links')
    .select('*')
    .eq('short_code', shortCode)
    .single();

  if (error) throw error;
  return data;
}

// ─── Clicks ───

export async function recordClick(clickerId: string, linkId: string) {
  const { data, error } = await supabase
    .from('click_logs')
    .insert({ clicker_id: clickerId, link_id: linkId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function confirmClickAndEarn(clickLogId: string, stayDuration: number, clickerId: string) {
  const { error } = await supabase.rpc('confirm_click_and_earn', {
    p_click_log_id: clickLogId,
    p_stay_duration: stayDuration,
    p_clicker_id: clickerId,
  });

  if (error) throw error;
}

export async function getClickedLinkIds(userId: string) {
  const { data, error } = await supabase
    .from('click_logs')
    .select('link_id')
    .eq('clicker_id', userId);

  if (error) throw error;
  return data?.map((row) => row.link_id) ?? [];
}

export async function getDailyClickCount(userId: string, dateKST: string) {
  const startOfDay = `${dateKST}T00:00:00+09:00`;
  const endOfDay = `${dateKST}T23:59:59+09:00`;

  const { count, error } = await supabase
    .from('click_logs')
    .select('*', { count: 'exact', head: true })
    .eq('clicker_id', userId)
    .gte('clicked_at', startOfDay)
    .lte('clicked_at', endOfDay);

  if (error) throw error;
  return count ?? 0;
}

// ─── Credits ───

export async function addCredit(userId: string, amount: number, type: string, referenceId?: string) {
  const { error: txError } = await supabase
    .from('credit_transactions')
    .insert({
      user_id: userId,
      amount,
      type,
      reference_id: referenceId,
    });

  if (txError) throw txError;

  const { error: userError } = await supabase.rpc('update_user_credits', {
    p_user_id: userId,
    p_amount: amount,
  });

  if (userError) throw userError;
}

export async function getCreditHistory(userId: string, limit: number = 50) {
  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function spendCredits(userId: string, linkId: string, amount: number) {
  // 유저 크레딧 확인
  const user = await getUserById(userId);
  if (user.credits < amount) {
    throw new Error('크레딧이 부족합니다');
  }

  // 크레딧 차감
  await addCredit(userId, -amount, 'spend', linkId);

  // 링크 노출 크레딧 증가
  const { error } = await supabase.rpc('add_link_credits', {
    p_link_id: linkId,
    p_amount: amount,
  });

  if (error) throw error;
}

// ─── Ranking ───

export async function getRanking(limit: number = 50) {
  const { data, error } = await supabase
    .from('users')
    .select('id, nickname, level, total_exchanges')
    .order('total_exchanges', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// ─── Apps ───

export async function getActiveApps() {
  const { data, error } = await supabase
    .from('apps')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data;
}
