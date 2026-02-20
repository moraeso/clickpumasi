-- =============================================
-- 클릭품앗이 DB 스키마
-- Supabase SQL Editor에서 실행
-- =============================================

-- ─── 유저 ───

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kakao_id TEXT UNIQUE NOT NULL,
  nickname TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  credits INTEGER NOT NULL DEFAULT 3,
  total_exchanges INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 앱 프리셋 ───

CREATE TABLE IF NOT EXISTS apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon_url TEXT,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- ─── 추천 링크 ───

CREATE TABLE IF NOT EXISTS referral_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app_name TEXT NOT NULL,
  original_url TEXT NOT NULL,
  short_code TEXT UNIQUE NOT NULL,
  description TEXT,
  reward_info TEXT,
  expires_at TIMESTAMPTZ,
  credits_remaining INTEGER NOT NULL DEFAULT 0,
  click_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_links_active_credits ON referral_links (is_active, credits_remaining DESC);
CREATE INDEX IF NOT EXISTS idx_links_user ON referral_links (user_id);
CREATE INDEX IF NOT EXISTS idx_links_short_code ON referral_links (short_code);

-- ─── 클릭 기록 ───

CREATE TABLE IF NOT EXISTS click_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clicker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  link_id UUID NOT NULL REFERENCES referral_links(id) ON DELETE CASCADE,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stay_duration INTEGER,
  credit_earned BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(clicker_id, link_id)
);

-- ─── 크레딧 거래 내역 ───

CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON credit_transactions (user_id, created_at DESC);

-- ─── RPC: 유저 크레딧 업데이트 (원자적) ───

CREATE OR REPLACE FUNCTION update_user_credits(p_user_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET credits = credits + p_amount
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── RPC: 링크 크레딧 추가 ───

CREATE OR REPLACE FUNCTION add_link_credits(p_link_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE referral_links
  SET credits_remaining = credits_remaining + p_amount
  WHERE id = p_link_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Link not found: %', p_link_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── RPC: 클릭 확인 + 크레딧 적립 (트랜잭션) ───

CREATE OR REPLACE FUNCTION confirm_click_and_earn(
  p_click_log_id UUID,
  p_stay_duration INTEGER,
  p_clicker_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_link_id UUID;
BEGIN
  -- 클릭 로그 업데이트
  UPDATE click_logs
  SET stay_duration = p_stay_duration, credit_earned = true
  WHERE id = p_click_log_id AND credit_earned = false
  RETURNING link_id INTO v_link_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Click log not found or already earned';
  END IF;

  -- 클릭한 유저에게 크레딧 +1
  UPDATE users SET credits = credits + 1 WHERE id = p_clicker_id;

  -- 크레딧 거래 기록
  INSERT INTO credit_transactions (user_id, amount, type, reference_id)
  VALUES (p_clicker_id, 1, 'click', p_click_log_id);

  -- 링크 클릭 수 +1, 노출 크레딧 -1
  UPDATE referral_links
  SET click_count = click_count + 1,
      credits_remaining = GREATEST(credits_remaining - 1, 0)
  WHERE id = v_link_id;

  -- 링크 주인의 total_exchanges +1
  UPDATE users
  SET total_exchanges = total_exchanges + 1
  WHERE id = (SELECT user_id FROM referral_links WHERE id = v_link_id);

  -- 클릭한 유저의 total_exchanges +1
  UPDATE users
  SET total_exchanges = total_exchanges + 1
  WHERE id = p_clicker_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── RLS (Row Level Security) ───

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE click_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;

-- 서버(anon key)에서 모든 작업 허용
CREATE POLICY "Server full access" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Server full access" ON referral_links FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Server full access" ON click_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Server full access" ON credit_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Server full access" ON apps FOR ALL USING (true) WITH CHECK (true);

-- ─── 시드 데이터: 인기 앱 ───

INSERT INTO apps (name, category, is_active) VALUES
  ('토스', '금융', true),
  ('카카오뱅크', '금융', true),
  ('케이뱅크', '금융', true),
  ('당근', '중고거래', true),
  ('쿠팡', '쇼핑', true),
  ('네이버페이', '금융', true),
  ('배달의민족', '배달', true),
  ('야놀자', '여행', true),
  ('여기어때', '여행', true),
  ('무신사', '쇼핑', true),
  ('올리브영', '뷰티', true),
  ('카카오톡', '메신저', true)
ON CONFLICT DO NOTHING;
