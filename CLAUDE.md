# 클릭품앗이 (가제)

추천 링크 품앗이 플랫폼. 내 링크를 클릭받으려면, 먼저 다른 사람의 링크를 클릭해야 한다.

## 핵심 컨셉
- 앱 추천 이벤트(토스, 당근, 케이뱅크 등) 링크를 교환하는 플랫폼
- 크레딧 시스템: 클릭을 주면 크레딧 획득 → 크레딧으로 내 링크 노출
- 무임승차 불가: 받으려면 줘야 한다
- 카카오 로그인 기반

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 18, TypeScript, Vite, TanStack Query v5, Biome |
| Backend | Node.js 18+, Express, TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | 카카오 로그인 |
| 배포 | Railway (서버 $5/월), Supabase (무료) |

## 프로젝트 구조

```
clickpumasi/
├── client/                     # React 프론트엔드
│   ├── src/
│   │   ├── pages/             # 페이지 컴포넌트
│   │   ├── components/        # 공통 컴포넌트
│   │   ├── services/api.ts    # API 클라이언트
│   │   ├── hooks/             # React Query hooks
│   │   └── utils/             # 유틸리티
│   └── public/
├── server/
│   └── src/
│       ├── index.ts           # Express 라우팅
│       └── database.ts        # Supabase 쿼리
└── docs/                      # 상세 문서
```

## 핵심 아키텍처

### API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/auth/kakao` | 카카오 로그인 |
| GET | `/api/links/feed` | 클릭할 링크 피드 |
| POST | `/api/links` | 링크 등록 |
| GET | `/api/links/mine` | 내 링크 목록 |
| PUT | `/api/links/:id` | 링크 수정/비활성화 |
| GET | `/go/:shortCode` | 리다이렉트 + 클릭 기록 |
| POST | `/api/clicks/confirm` | 클릭 확인 + 크레딧 적립 |
| GET | `/api/credits` | 크레딧 잔액 + 내역 |
| POST | `/api/credits/spend` | 링크에 크레딧 사용 |
| GET | `/api/profile` | 내 프로필 |
| GET | `/api/ranking` | 랭킹 |

### 크레딧 시스템
- 1 크레딧 = 내 링크 1회 노출
- 획득: 다른 사람 링크 클릭 (무료) / 직접 구매 (100원)
- 소모: 내 링크 대기열에 올리기
- 가입 보너스: 3 크레딧

### 클릭 검증
- 리다이렉트 추적 (서버 경유)
- 체류 시간 30초 이상 확인
- 같은 링크 중복 클릭 방지

## 코딩 규칙

| 항목 | 규칙 |
|------|------|
| 포맷터 | Biome (저장 시 자동) |
| 들여쓰기 | 2칸 |
| 쿼터 | 싱글 쿼터 |
| 세미콜론 | 사용 |
| 경로 | `@/` alias |
| 패키지 | npm만 (yarn 금지) |
| 커밋 | 한글로 간단하게 |
| 컴포넌트 | PascalCase (.tsx) |
| 함수/변수 | camelCase |
| 상수 | UPPER_SNAKE_CASE |

## 환경 변수

### client/.env.local
```
VITE_API_URL=http://localhost:3000
```

### server/.env
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
KAKAO_CLIENT_ID=<카카오 앱 키>
PORT=3000
```

## 새 기능 추가 시

| 작업 | 위치 |
|------|------|
| UI 컴포넌트 | `client/src/pages/` |
| API 호출 | `client/src/services/api.ts` |
| React Query hooks | `client/src/hooks/` |
| 서버 라우팅 | `server/src/index.ts` |
| DB 쿼리 | `server/src/database.ts` |
| DB 스키마 변경 | Supabase SQL Editor → `database.ts` 수정 |

## 참조 문서

| 상황 | 문서 |
|------|------|
| 아키텍처, 데이터 흐름, 비즈니스 로직 | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| DB 스키마, 테이블 | [docs/DATABASE.md](docs/DATABASE.md) |
| 개발 환경 설정 | [docs/SETUP.md](docs/SETUP.md) |

## 다음 구현 예정
- [ ] 카카오 로그인
- [ ] 추천 링크 등록/관리
- [ ] 링크 피드 + 클릭 리다이렉트
- [ ] 크레딧 시스템 (획득/소모/잔액)
- [ ] 체류 시간 검증
- [ ] 프로필 + 랭킹
