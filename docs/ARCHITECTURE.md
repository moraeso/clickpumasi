# Architecture

> 아키텍처, 데이터 흐름, 비즈니스 로직, API 상세

## 시스템 구조

```
클라이언트 (React, Vite)
    │ HTTPS
    ▼
Express API 서버 (Railway)
    │ PostgreSQL
    ▼
Supabase (DB + Auth)
```

## 핵심 메커니즘: 크레딧 교환

```
다른 사람 링크 클릭 → 크레딧 획득 → 내 링크에 크레딧 사용 → 다른 사람이 클릭해줌
```

### 클릭 → 크레딧 획득 플로우
```
1. 유저 A가 링크 피드에서 유저 B의 토스 추천 링크 클릭
2. GET /go/abc123 → click_logs에 기록 + 토스 추천 페이지로 리다이렉트
3. 유저 A가 토스에서 가입/설치 후 우리 앱으로 돌아옴
4. POST /api/clicks/confirm → 체류 시간 30초 이상 확인
5. credit_earned = true, 유저 A 크레딧 +1
6. 유저 B의 link.click_count +1, link.credits_remaining -1
```

### 링크 등록 → 노출 플로우
```
1. 유저가 추천 링크 등록 (앱 선택 + URL + 보상 정보)
2. 크레딧 사용 (POST /api/credits/spend) → credits_remaining +N
3. 링크가 피드에 노출됨 (credits_remaining > 0인 링크만)
4. 다른 유저가 클릭할 때마다 credits_remaining -1
5. credits_remaining = 0이면 피드에서 제외
```

## API 엔드포인트

### Auth
| 메서드 | 경로 | 설명 | 파라미터 |
|--------|------|------|----------|
| POST | `/api/auth/kakao` | 카카오 로그인/가입 | `{ kakaoAccessToken }` |

### Links
| 메서드 | 경로 | 설명 | 파라미터 |
|--------|------|------|----------|
| GET | `/api/links/feed` | 클릭할 링크 피드 | `?userId=xxx&page=1` |
| POST | `/api/links` | 링크 등록 | `{ userId, appName, url, rewardInfo, expiresAt }` |
| GET | `/api/links/mine` | 내 링크 목록 | `?userId=xxx` |
| PUT | `/api/links/:id` | 링크 수정/비활성화 | `{ isActive, ... }` |

### Clicks
| 메서드 | 경로 | 설명 | 파라미터 |
|--------|------|------|----------|
| GET | `/go/:shortCode` | 리다이렉트 + 클릭 기록 | URL param |
| POST | `/api/clicks/confirm` | 클릭 확인 + 크레딧 적립 | `{ userId, clickLogId, stayDuration }` |

### Credits
| 메서드 | 경로 | 설명 | 파라미터 |
|--------|------|------|----------|
| GET | `/api/credits` | 크레딧 잔액 + 내역 | `?userId=xxx` |
| POST | `/api/credits/spend` | 링크에 크레딧 사용 | `{ userId, linkId, amount }` |

### Profile
| 메서드 | 경로 | 설명 | 파라미터 |
|--------|------|------|----------|
| GET | `/api/profile` | 내 프로필, 레벨, 교환 이력 | `?userId=xxx` |
| GET | `/api/ranking` | 교환 랭킹 | - |

## 클릭 검증 시스템

### 리다이렉트 추적 (MVP)
- `/go/:shortCode` → 서버에서 click_logs 기록 → 원본 URL로 302 리다이렉트
- 유저가 돌아오면 `/api/clicks/confirm`으로 체류 시간 전송

### 체류 시간 검증
- 최소 30초 이상 외부 페이지에 머물러야 크레딧 적립
- 클라이언트: 리다이렉트 시점 기록 → 돌아온 시점과 차이 계산

### 어뷰징 방지
- 같은 링크 중복 클릭 방지 (`UNIQUE(clicker_id, link_id)`)
- 일일 클릭 상한 (20회/일)
- 동일 유저 간 교차 클릭 제한 (A→B, B→A 동시 방지)

## 크레딧 경제

| 항목 | 값 |
|------|-----|
| 가입 보너스 | 3 크레딧 |
| 클릭 1회 보상 | 1 크레딧 |
| 링크 노출 1회 비용 | 1 크레딧 |
| 일일 클릭 상한 | 20회 |
| 크레딧 구매 가격 | 100원/1크레딧 (v2) |

## 페이지 구조

```
/                    -- 랜딩 (로그인 전)
/feed               -- 메인 피드 (클릭할 링크들)
/my-links           -- 내 링크 관리
/register           -- 새 링크 등록
/credits            -- 크레딧 잔액 + 내역
/profile            -- 내 프로필 + 교환 이력
/ranking            -- 랭킹
/go/:code           -- 리다이렉트 (서버 API)
```

## 설계 결정

### 카카오 로그인 선택
- 한국 사용자 90%+ 보유
- 실명 인증 효과 (어뷰징 억제)
- Supabase Auth에서 카카오 OAuth 지원

### 크레딧 시스템 (vs 직접 매칭)
- 직접 1:1 매칭은 "원하는 앱이 서로 맞아야" 함 → 유동성 부족
- 크레딧은 범용 화폐 → 아무 링크나 클릭해도 내 링크 노출에 사용 가능
- 네트워크 효과 극대화

### Express 별도 서버 (vs 서버리스)
- 리다이렉트 `/go/:code`에서 콜드 스타트 없이 즉시 응답 필요
- 크레딧 트랜잭션의 원자성 보장
- 하루성경과 동일 패턴으로 빠른 개발
