const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Auth ───

export function loginWithKakaoCode(code: string, redirectUri: string) {
  return request<{ user: User }>('/api/auth/kakao', {
    method: 'POST',
    body: JSON.stringify({ code, redirectUri }),
  });
}

export function loginDev(nickname: string) {
  return request<{ user: User }>('/api/auth/dev', {
    method: 'POST',
    body: JSON.stringify({ nickname }),
  });
}

// ─── Links ───

export function getFeed(userId: string, page = 1) {
  return request<{ links: ReferralLink[] }>(`/api/links/feed?userId=${userId}&page=${page}`);
}

export function createLink(params: {
  userId: string;
  appName: string;
  url: string;
  description?: string;
  rewardInfo?: string;
  expiresAt?: string;
}) {
  return request<{ link: ReferralLink }>('/api/links', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function getMyLinks(userId: string) {
  return request<{ links: ReferralLink[] }>(`/api/links/mine?userId=${userId}`);
}

export function updateLink(linkId: string, updates: Partial<ReferralLink>) {
  return request<{ link: ReferralLink }>(`/api/links/${linkId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

// ─── Clicks ───

export function confirmClick(userId: string, clickLogId: string, stayDuration: number) {
  return request<{ success: boolean; creditEarned: number }>('/api/clicks/confirm', {
    method: 'POST',
    body: JSON.stringify({ userId, clickLogId, stayDuration }),
  });
}

// ─── Credits ───

export function getCredits(userId: string) {
  return request<{ credits: number; history: CreditTransaction[] }>(
    `/api/credits?userId=${userId}`
  );
}

export function spendCredits(userId: string, linkId: string, amount: number) {
  return request<{ success: boolean; remainingCredits: number }>('/api/credits/spend', {
    method: 'POST',
    body: JSON.stringify({ userId, linkId, amount }),
  });
}

// ─── Profile ───

export function getProfile(userId: string) {
  return request<{ user: User }>(`/api/profile?userId=${userId}`);
}

// ─── Ranking ───

export function getRanking() {
  return request<{ ranking: User[] }>('/api/ranking');
}

// ─── Apps ───

export function getApps() {
  return request<{ apps: App[] }>('/api/apps');
}

// ─── Types ───

export interface User {
  id: string;
  kakao_id: string;
  nickname: string;
  level: number;
  credits: number;
  total_exchanges: number;
  created_at: string;
}

export interface ReferralLink {
  id: string;
  user_id: string;
  app_name: string;
  original_url: string;
  short_code: string;
  description?: string;
  reward_info?: string;
  expires_at?: string;
  credits_remaining: number;
  click_count: number;
  is_active: boolean;
  created_at: string;
  users?: { nickname: string };
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  reference_id?: string;
  created_at: string;
}

export interface App {
  id: string;
  name: string;
  icon_url?: string;
  category?: string;
  is_active: boolean;
}
