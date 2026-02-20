import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import * as db from './database';

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───

app.use(express.json());
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:4173',
    ],
    credentials: true,
  })
);

// ─── Health ───

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Auth ───

app.post('/api/auth/kakao', async (req, res) => {
  try {
    const { code, redirectUri } = req.body;
    if (!code || !redirectUri) {
      return res.status(400).json({ error: 'code, redirectUri 필요' });
    }

    const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID;
    if (!KAKAO_CLIENT_ID) {
      return res.status(500).json({ error: 'KAKAO_CLIENT_ID 미설정' });
    }

    // 1. 인가 코드로 토큰 교환
    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: KAKAO_CLIENT_ID,
        redirect_uri: redirectUri,
        code,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.json().catch(() => ({}));
      console.error('Kakao token error:', err);
      return res.status(401).json({ error: '카카오 토큰 발급 실패' });
    }

    const tokenData = await tokenRes.json();

    // 2. 액세스 토큰으로 유저 정보 조회
    const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      return res.status(401).json({ error: '카카오 유저 정보 조회 실패' });
    }

    const kakaoUser = await userRes.json();
    const kakaoId = String(kakaoUser.id);
    const nickname = kakaoUser.kakao_account?.profile?.nickname
      ?? kakaoUser.properties?.nickname
      ?? '익명';

    const user = await db.ensureUser(kakaoId, nickname);
    res.json({ user });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// 개발용 간편 로그인
app.post('/api/auth/dev', async (req, res) => {
  try {
    const { nickname } = req.body;
    const devId = `dev_${nickname || 'tester'}`;
    const user = await db.ensureUser(devId, nickname || '테스터');
    res.json({ user });
  } catch (err) {
    console.error('Dev auth error:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ─── Links ───

app.get('/api/links/feed', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    const page = Number(req.query.page) || 1;
    if (!userId) return res.status(400).json({ error: 'userId 필요' });

    const links = await db.getFeedLinks(userId, page);

    // 이미 클릭한 링크 필터링
    const clickedIds = await db.getClickedLinkIds(userId);
    const filtered = links.filter((link) => !clickedIds.includes(link.id));

    res.json({ links: filtered });
  } catch (err) {
    console.error('Feed error:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

app.post('/api/links', async (req, res) => {
  try {
    const { userId, appName, url, description, rewardInfo, expiresAt } = req.body;
    if (!userId || !appName || !url) {
      return res.status(400).json({ error: 'userId, appName, url 필요' });
    }

    // 단축 코드 생성 (8자 랜덤)
    const shortCode = Math.random().toString(36).substring(2, 10);

    const link = await db.createLink({
      userId,
      appName,
      originalUrl: url,
      shortCode,
      description,
      rewardInfo,
      expiresAt,
    });

    res.json({ link });
  } catch (err) {
    console.error('Create link error:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

app.get('/api/links/mine', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: 'userId 필요' });

    const links = await db.getMyLinks(userId);
    res.json({ links });
  } catch (err) {
    console.error('My links error:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

app.put('/api/links/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const link = await db.updateLink(id, updates);
    res.json({ link });
  } catch (err) {
    console.error('Update link error:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ─── Clicks (리다이렉트) ───

app.get('/go/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    const userId = req.query.userId as string;

    const link = await db.getLinkByShortCode(shortCode);
    if (!link) return res.status(404).json({ error: '링크를 찾을 수 없습니다' });

    // 로그인 유저면 클릭 기록
    if (userId && userId !== link.user_id) {
      try {
        await db.recordClick(userId, link.id);
      } catch {
        // 중복 클릭은 무시 (UNIQUE 제약조건)
      }
    }

    res.redirect(302, link.original_url);
  } catch (err) {
    console.error('Redirect error:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

app.post('/api/clicks/confirm', async (req, res) => {
  try {
    const { userId, clickLogId, stayDuration } = req.body;
    if (!userId || !clickLogId || stayDuration == null) {
      return res.status(400).json({ error: 'userId, clickLogId, stayDuration 필요' });
    }

    // 체류 시간 30초 미만이면 거부
    if (stayDuration < 30) {
      return res.status(400).json({ error: '체류 시간이 부족합니다 (최소 30초)' });
    }

    // 일일 클릭 상한 확인 (20회)
    const now = new Date();
    const todayKST = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const todayFormatted = `${todayKST.getFullYear()}-${String(todayKST.getMonth() + 1).padStart(2, '0')}-${String(todayKST.getDate()).padStart(2, '0')}`;
    const dailyCount = await db.getDailyClickCount(userId, todayFormatted);
    if (dailyCount >= 20) {
      return res.status(400).json({ error: '일일 클릭 상한 초과 (20회/일)' });
    }

    // 클릭 확인 + 크레딧 적립 (RPC로 원자적 처리)
    await db.confirmClickAndEarn(clickLogId, stayDuration, userId);

    res.json({ success: true, creditEarned: 1 });
  } catch (err) {
    console.error('Confirm click error:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ─── Credits ───

app.get('/api/credits', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: 'userId 필요' });

    const user = await db.getUserById(userId);
    const history = await db.getCreditHistory(userId);

    res.json({ credits: user.credits, history });
  } catch (err) {
    console.error('Credits error:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

app.post('/api/credits/spend', async (req, res) => {
  try {
    const { userId, linkId, amount } = req.body;
    if (!userId || !linkId || !amount) {
      return res.status(400).json({ error: 'userId, linkId, amount 필요' });
    }

    await db.spendCredits(userId, linkId, amount);
    const user = await db.getUserById(userId);

    res.json({ success: true, remainingCredits: user.credits });
  } catch (err: any) {
    if (err.message === '크레딧이 부족합니다') {
      return res.status(400).json({ error: err.message });
    }
    console.error('Spend credits error:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ─── Profile ───

app.get('/api/profile', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: 'userId 필요' });

    const user = await db.getUserById(userId);
    res.json({ user });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ─── Ranking ───

app.get('/api/ranking', async (_req, res) => {
  try {
    const ranking = await db.getRanking();
    res.json({ ranking });
  } catch (err) {
    console.error('Ranking error:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ─── Apps ───

app.get('/api/apps', async (_req, res) => {
  try {
    const apps = await db.getActiveApps();
    res.json({ apps });
  } catch (err) {
    console.error('Apps error:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ─── Start ───

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
