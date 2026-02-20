# Database

> Supabase PostgreSQL 스키마 레퍼런스

## ERD

```
┌──────────────────────┐
│       users          │
│──────────────────────│
│ id (PK, UUID)        │◄─────────┐
│ kakao_id (UNIQUE)    │          │
│ nickname             │          │ 1:N
│ level                │          │
│ credits              │          │
│ total_exchanges      │          │
│ created_at           │          │
└──────────────────────┘          │
         │                        │
    ┌────┴────────┬───────────────┤
    │             │               │
┌───▼──────────┐ ┌▼────────────┐ ┌▼───────────────┐
│referral_links│ │ click_logs  │ │credit_          │
│──────────────│ │─────────────│ │ transactions    │
│ id (PK)      │ │ id (PK)     │ │─────────────────│
│ user_id (FK) │ │ clicker_id  │ │ id (PK)         │
│ app_name     │ │ link_id(FK) │ │ user_id (FK)    │
│ original_url │ │ clicked_at  │ │ amount (+/-)    │
│ short_code   │ │ stay_dur    │ │ type            │
│ reward_info  │ │ credit_     │ │ reference_id    │
│ expires_at   │ │  earned     │ │ created_at      │
│ credits_rem  │ │ UNIQUE(     │ └─────────────────┘
│ click_count  │ │ clicker,    │
│ is_active    │ │ link)       │
│ created_at   │ └─────────────┘
└──────────────┘

┌──────────────────────┐
│       apps           │
│──────────────────────│
│ id (PK, UUID)        │
│ name ("토스" 등)      │
│ icon_url             │
│ category             │
│ is_active            │
└──────────────────────┘
```

## 테이블 상세

### users

| 컬럼 | 타입 | 제약조건 | 기본값 | 설명 |
|------|------|----------|--------|------|
| `id` | UUID | PK | gen_random_uuid() | - |
| `kakao_id` | TEXT | UNIQUE, NOT NULL | - | 카카오 유저 ID |
| `nickname` | TEXT | NOT NULL | - | 닉네임 |
| `level` | INTEGER | NOT NULL | 1 | 레벨 |
| `credits` | INTEGER | NOT NULL | 3 | 보유 크레딧 |
| `total_exchanges` | INTEGER | NOT NULL | 0 | 총 교환 횟수 |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | 가입 시각 |

### referral_links

| 컬럼 | 타입 | 제약조건 | 기본값 | 설명 |
|------|------|----------|--------|------|
| `id` | UUID | PK | gen_random_uuid() | - |
| `user_id` | UUID | FK, NOT NULL | - | 등록한 유저 |
| `app_name` | TEXT | NOT NULL | - | 앱 이름 |
| `original_url` | TEXT | NOT NULL | - | 원본 추천 링크 |
| `short_code` | TEXT | UNIQUE, NOT NULL | - | 추적용 단축 코드 |
| `description` | TEXT | | - | 이벤트 설명 |
| `reward_info` | TEXT | | - | 보상 정보 ("쌍방 1,000원") |
| `expires_at` | TIMESTAMPTZ | | NULL | 만료일 |
| `credits_remaining` | INTEGER | NOT NULL | 0 | 남은 노출 크레딧 |
| `click_count` | INTEGER | NOT NULL | 0 | 총 클릭 수 |
| `is_active` | BOOLEAN | NOT NULL | true | 활성 여부 |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | - |

**인덱스**: `idx_links_active_credits (is_active, credits_remaining DESC)`, `idx_links_user (user_id)`, `idx_links_short_code (short_code)`

### click_logs

| 컬럼 | 타입 | 제약조건 | 기본값 | 설명 |
|------|------|----------|--------|------|
| `id` | UUID | PK | gen_random_uuid() | - |
| `clicker_id` | UUID | FK, NOT NULL | - | 클릭한 유저 |
| `link_id` | UUID | FK, NOT NULL | - | 클릭된 링크 |
| `clicked_at` | TIMESTAMPTZ | NOT NULL | NOW() | 클릭 시각 |
| `stay_duration` | INTEGER | | NULL | 체류 시간 (초) |
| `credit_earned` | BOOLEAN | NOT NULL | false | 크레딧 지급 여부 |

**제약조건**: `UNIQUE(clicker_id, link_id)` (같은 링크 중복 클릭 방지)

### credit_transactions

| 컬럼 | 타입 | 제약조건 | 기본값 | 설명 |
|------|------|----------|--------|------|
| `id` | UUID | PK | gen_random_uuid() | - |
| `user_id` | UUID | FK, NOT NULL | - | 유저 |
| `amount` | INTEGER | NOT NULL | - | +1(획득) / -1(소모) |
| `type` | TEXT | NOT NULL | - | 'click', 'purchase', 'bonus', 'spend' |
| `reference_id` | UUID | | NULL | 관련 click_log 또는 link ID |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | - |

**인덱스**: `idx_credit_tx_user (user_id, created_at DESC)`

### apps

| 컬럼 | 타입 | 제약조건 | 기본값 | 설명 |
|------|------|----------|--------|------|
| `id` | UUID | PK | gen_random_uuid() | - |
| `name` | TEXT | NOT NULL | - | 앱 이름 ("토스") |
| `icon_url` | TEXT | | NULL | 앱 아이콘 URL |
| `category` | TEXT | | NULL | "금융", "쇼핑" 등 |
| `is_active` | BOOLEAN | NOT NULL | true | 활성 여부 |

## 마이그레이션

초기 스키마: Supabase SQL Editor에서 `server/supabase-migration.sql` 실행
