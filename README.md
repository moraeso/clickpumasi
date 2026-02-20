# 클릭품앗이

> 추천 링크 품앗이 플랫폼 - 클릭을 주고, 클릭을 받자

## 소개

토스, 당근, 케이뱅크 등 앱의 "친구 초대" 이벤트에서 온라인 상의 누군가와 추천 링크를 공정하게 교환하는 서비스입니다.

### 핵심 원리
- 다른 사람의 추천 링크를 클릭하면 **크레딧** 획득
- 크레딧을 사용하면 다른 사람이 **내 링크**를 클릭
- 무임승차 불가 - 받으려면 줘야 한다

## 기술 스택

- **Frontend**: React 18 + TypeScript, Vite, TanStack Query v5
- **Backend**: Node.js 18+ + Express
- **Database**: Supabase (PostgreSQL)
- **Auth**: 카카오 로그인
- **배포**: Railway ($5/월) + Supabase (무료)

## 빠른 시작

```bash
# 서버
cd server && npm install && cp .env.example .env
# .env에 SUPABASE_URL, SUPABASE_ANON_KEY, KAKAO_CLIENT_ID 입력
npm run dev

# 클라이언트
cd client && npm install
echo "VITE_API_URL=http://localhost:3000" > .env.local
npm run dev
```

## 문서

| 문서 | 설명 |
|------|------|
| [CLAUDE.md](./CLAUDE.md) | AI 컨텍스트 (프로젝트 핵심) |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | 아키텍처, API, 비즈니스 로직 |
| [docs/DATABASE.md](./docs/DATABASE.md) | DB 스키마 |
| [docs/SETUP.md](./docs/SETUP.md) | 개발 환경 설정 |

## 라이선스

MIT License
