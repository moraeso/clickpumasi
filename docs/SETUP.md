# Setup

> 개발 환경 빠른 설정

## 요구사항
- Node.js 18+
- npm
- Supabase 계정 ([supabase.com](https://supabase.com))
- 카카오 개발자 계정 ([developers.kakao.com](https://developers.kakao.com))

## 빠른 시작

### 1. DB 설정
1. Supabase New Project (Seoul 리전)
2. SQL Editor에서 `server/supabase-migration.sql` 실행
3. Settings → API에서 URL + anon key 복사

### 2. 카카오 로그인 설정
1. 카카오 개발자 콘솔에서 앱 생성
2. 카카오 로그인 활성화
3. Redirect URI 설정
4. REST API 키 복사

### 3. 서버
```bash
cd server
npm install
cp .env.example .env
# .env에 SUPABASE_URL, SUPABASE_ANON_KEY, KAKAO_CLIENT_ID 입력
npm run dev  # http://localhost:3000
```

### 4. 클라이언트
```bash
cd client
npm install
echo "VITE_API_URL=http://localhost:3000" > .env.local
npm run dev  # http://localhost:5173
```

## 환경변수

### server/.env
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
KAKAO_CLIENT_ID=<카카오 REST API 키>
PORT=3000
```

### client/.env.local
```
VITE_API_URL=http://localhost:3000
```

## 트러블슈팅

| 문제 | 해결 |
|------|------|
| "Missing Supabase environment variables" | `.env` 파일 확인 |
| "relation does not exist" | SQL 마이그레이션 실행 |
| CORS 에러 | `server/src/index.ts`의 `allowedOrigins` 확인 |
