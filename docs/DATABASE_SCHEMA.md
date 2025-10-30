# Supabase 데이터베이스 스키마 가이드

## 📋 개요

이 문서는 도메인 모니터링 애플리케이션의 Supabase 데이터베이스 스키마를 설명합니다.

---

## 🗂️ 테이블 구조

### 1. `domains` 테이블

모니터링할 도메인 정보를 저장하는 메인 테이블입니다.

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| `id` | UUID | PRIMARY KEY | 고유 식별자 (자동 생성) |
| `user_id` | UUID | NOT NULL, FK | 사용자 ID (auth.users 참조) |
| `name` | TEXT | NOT NULL | 도메인 이름 (예: example.com) |
| `status` | TEXT | NOT NULL, DEFAULT 'registered' | 도메인 상태 ('registered' 또는 'available') |
| `active` | BOOLEAN | NOT NULL, DEFAULT true | 모니터링 활성화 여부 |
| `last_checked` | TIMESTAMPTZ | DEFAULT NOW() | 마지막 체크 시간 |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 생성 시간 |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 수정 시간 (자동 업데이트) |

**제약조건:**
- `UNIQUE (name, user_id)`: 사용자별로 중복 도메인 방지
- `CHECK (status IN ('registered', 'available'))`: 상태 값 검증
- `ON DELETE CASCADE`: 사용자 삭제 시 도메인도 삭제

**인덱스:**
- `idx_domains_user_id`: 사용자별 조회 최적화
- `idx_domains_name`: 도메인 이름 검색 최적화
- `idx_domains_status`: 상태별 필터링 최적화
- `idx_domains_active`: 활성 도메인 조회 최적화
- `idx_domains_last_checked`: 체크 시간 정렬 최적화

---

### 2. `email_notifications` 테이블

이메일 알림 발송 기록을 저장하는 테이블입니다.

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| `id` | UUID | PRIMARY KEY | 고유 식별자 (자동 생성) |
| `user_id` | UUID | NOT NULL, FK | 사용자 ID |
| `domain_id` | UUID | NOT NULL, FK | 도메인 ID |
| `sent_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 발송 시간 |
| `status` | TEXT | NOT NULL | 발송 상태 ('sent' 또는 'failed') |
| `error_message` | TEXT | NULL | 실패 시 에러 메시지 |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 생성 시간 |

**제약조건:**
- `CHECK (status IN ('sent', 'failed'))`: 상태 값 검증
- `ON DELETE CASCADE`: 사용자/도메인 삭제 시 알림도 삭제

**인덱스:**
- `idx_email_notifications_user_id`: 사용자별 조회 최적화
- `idx_email_notifications_domain_id`: 도메인별 조회 최적화
- `idx_email_notifications_sent_at`: 시간별 정렬 최적화

---

## 🔐 Row Level Security (RLS) 정책

### domains 테이블

**기본 정책 (다중 사용자용):**
```sql
-- SELECT: 자신의 도메인만 조회
"Users can view their own domains"
  USING (auth.uid() = user_id)

-- INSERT: 자신의 도메인만 추가
"Users can insert their own domains"
  WITH CHECK (auth.uid() = user_id)

-- UPDATE: 자신의 도메인만 수정
"Users can update their own domains"
  USING (auth.uid() = user_id)

-- DELETE: 자신의 도메인만 삭제
"Users can delete their own domains"
  USING (auth.uid() = user_id)
```

**개인 프로젝트용 (선택):**
```sql
-- 특정 이메일만 모든 도메인 접근
CREATE POLICY "Allow specific user to access all domains"
  ON public.domains FOR ALL
  USING (auth.jwt()->>'email' = 'your-email@example.com');

-- 또는 RLS 완전 비활성화
ALTER TABLE public.domains DISABLE ROW LEVEL SECURITY;
```

### email_notifications 테이블

```sql
-- SELECT: 자신의 알림만 조회
"Users can view their own email notifications"
  USING (auth.uid() = user_id)

-- INSERT: 자신의 알림만 추가
"Users can insert their own email notifications"
  WITH CHECK (auth.uid() = user_id)
```

---

## 🚀 데이터베이스 설정 방법

### 옵션 1: Supabase Dashboard (추천)

1. [Supabase Dashboard](https://app.supabase.com) 로그인
2. 프로젝트 선택
3. **SQL Editor** 메뉴로 이동
4. `supabase/schema.sql` 파일의 내용을 복사하여 붙여넣기
5. **Run** 버튼 클릭

### 옵션 2: Supabase CLI

```bash
# Supabase CLI 설치
npm install -g supabase

# 프로젝트 연결
supabase login
supabase link --project-ref your-project-ref

# 마이그레이션 실행
supabase db push
```

### 옵션 3: 로컬 개발 (Docker)

```bash
# Supabase 로컬 시작
supabase start

# 마이그레이션 적용
supabase db reset

# 스키마 적용
supabase db push
```

---

## 📊 유용한 뷰 (Views)

### available_domains

사용 가능한 도메인만 조회하는 뷰:

```sql
SELECT * FROM public.available_domains;
```

### recently_checked_domains

최근 체크된 도메인을 조회하는 뷰:

```sql
SELECT * FROM public.recently_checked_domains;
```

---

## 🔍 유용한 쿼리 예시

### 모든 활성 도메인 조회
```sql
SELECT * FROM public.domains 
WHERE active = true;
```

### 사용 가능한 도메인만 조회
```sql
SELECT * FROM public.domains 
WHERE status = 'available' AND active = true;
```

### 최근 24시간 이내 체크된 도메인
```sql
SELECT * FROM public.domains 
WHERE last_checked > NOW() - INTERVAL '24 hours';
```

### 오래된 도메인 찾기 (7일 이상 체크 안됨)
```sql
SELECT * FROM public.domains 
WHERE last_checked < NOW() - INTERVAL '7 days'
  AND active = true;
```

### 도메인별 알림 발송 횟수
```sql
SELECT 
  d.name,
  COUNT(e.id) as notification_count,
  MAX(e.sent_at) as last_notification
FROM public.domains d
LEFT JOIN public.email_notifications e ON d.id = e.domain_id
GROUP BY d.id, d.name
ORDER BY notification_count DESC;
```

### 상태별 도메인 통계
```sql
SELECT 
  status,
  COUNT(*) as count,
  COUNT(CASE WHEN active = true THEN 1 END) as active_count
FROM public.domains
GROUP BY status;
```

---

## 🛠️ 트리거 및 함수

### handle_updated_at()

`updated_at` 컬럼을 자동으로 업데이트하는 트리거 함수:

```sql
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**사용:**
```sql
UPDATE public.domains 
SET name = 'new-domain.com' 
WHERE id = 'some-uuid';
-- updated_at이 자동으로 현재 시간으로 업데이트됨
```

---

## 📝 TypeScript 타입 생성

Supabase CLI를 사용하여 TypeScript 타입을 자동 생성할 수 있습니다:

```bash
# 타입 생성
supabase gen types typescript --local > types/database.ts

# 또는 원격 DB에서
supabase gen types typescript --project-id your-project-id > types/database.ts
```

현재 프로젝트의 `types/database.ts`는 이미 스키마에 맞게 작성되어 있습니다.

---

## 🔄 마이그레이션

### 새로운 컬럼 추가 예시

```sql
-- notes 컬럼 추가
ALTER TABLE public.domains 
ADD COLUMN notes TEXT;

-- 인덱스 추가
CREATE INDEX idx_domains_notes ON public.domains 
USING gin(to_tsvector('english', notes));
```

### 컬럼 수정 예시

```sql
-- status 기본값 변경
ALTER TABLE public.domains 
ALTER COLUMN status SET DEFAULT 'registered';

-- active 컬럼 NOT NULL 추가
ALTER TABLE public.domains 
ALTER COLUMN active SET NOT NULL;
```

---

## ⚠️ 주의사항

### 1. RLS 정책
- RLS를 비활성화하면 모든 사용자가 모든 데이터에 접근 가능
- 개인 프로젝트가 아니라면 RLS를 반드시 활성화하세요

### 2. 인덱스
- 인덱스는 조회 성능을 향상시키지만 쓰기 성능을 저하시킬 수 있음
- 필요한 인덱스만 생성하세요

### 3. CASCADE 삭제
- `ON DELETE CASCADE`는 부모 레코드 삭제 시 자식 레코드도 삭제
- 데이터 손실에 주의하세요

### 4. TIMESTAMP vs TIMESTAMPTZ
- `TIMESTAMPTZ` (권장): 타임존 정보 포함
- `TIMESTAMP`: 타임존 정보 없음

---

## 📚 참고 자료

- [Supabase Database 문서](https://supabase.com/docs/guides/database)
- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/)
- [Row Level Security 가이드](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase CLI 문서](https://supabase.com/docs/reference/cli)
