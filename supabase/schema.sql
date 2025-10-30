-- ============================================
-- Domains Table Schema for Supabase
-- ============================================
-- 도메인 모니터링을 위한 테이블 스키마
--
-- 📝 아키텍처 결정 사항 (Architecture Decision Record)
-- 
-- 1. user_id 필드 제거
--    - 이유: 개인 프로젝트로 단일 사용자만 사용
--    - 장점: 스키마 간소화, 인증 로직 불필요, 개발/운영 단순화
--    - 단점: 멀티 유저 확장 시 마이그레이션 필요
--    - 결정일: 2025-10-30
--
-- 2. Row Level Security (RLS) 비활성화
--    - 이유: user_id가 없어 사용자 기반 접근 제어 불필요
--    - 보안: 개인 프로젝트이므로 데이터베이스 자체 접근 제어로 충분
--    - 주의: 프로덕션 멀티 유저 환경에서는 반드시 RLS 활성화 필요
--    - 결정일: 2025-10-30
--
-- 3. 'unknown' 상태 추가
--    - 이유: 도메인 추가 직후 첫 체크 전 상태 표시
--    - 상태: 'registered' | 'available' | 'unknown'
--    - 결정일: 2025-10-30
-- ============================================

-- 1. domains 테이블 생성
CREATE TABLE IF NOT EXISTS public.domains (
  -- Primary Key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- 도메인 정보
  name TEXT NOT NULL UNIQUE, -- user_id 제거로 name만으로 UNIQUE 제약조건
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'available', 'unknown')),
  
  -- 활성화 상태
  active BOOLEAN NOT NULL DEFAULT true,
  
  -- 마지막 체크 시간
  last_checked TIMESTAMP WITH TIME ZONE,
  
  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. 인덱스 생성 (쿼리 성능 향상)
CREATE INDEX IF NOT EXISTS idx_domains_name ON public.domains(name);
CREATE INDEX IF NOT EXISTS idx_domains_status ON public.domains(status);
CREATE INDEX IF NOT EXISTS idx_domains_active ON public.domains(active);
CREATE INDEX IF NOT EXISTS idx_domains_last_checked ON public.domains(last_checked);

-- 3. updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. updated_at 트리거 생성
DROP TRIGGER IF EXISTS set_updated_at ON public.domains;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.domains
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- Row Level Security (RLS) 정책
-- ============================================
-- 
-- ⚠️  RLS 비활성화 (개인 프로젝트)
-- 
-- 이유:
-- 1. user_id 필드가 없어 사용자 기반 접근 제어 불가능
-- 2. 단일 사용자 개인 프로젝트로 RLS 불필요
-- 3. ANON_KEY를 통한 데이터베이스 접근만으로 충분
--
-- 보안 고려사항:
-- - Supabase 프로젝트 자체가 개인 계정으로 보호됨
-- - 환경 변수(ANON_KEY)를 통한 접근 제어
-- - API Route에서 CRON_SECRET으로 추가 인증 레이어
--
-- 멀티 유저로 전환 시:
-- 1. user_id UUID NOT NULL 컬럼 추가
-- 2. auth.users(id) 외래 키 설정
-- 3. RLS 활성화 및 정책 생성
-- 4. 애플리케이션 코드에 인증 로직 추가
-- ============================================

-- RLS 비활성화
ALTER TABLE public.domains DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 참고: 멀티 유저 환경을 위한 RLS 정책 예시
-- ============================================
-- 
-- 멀티 유저로 전환 시 아래 정책들을 활성화하세요:
--
-- ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Users can view their own domains"
--   ON public.domains FOR SELECT
--   USING (auth.uid() = user_id);
-- 
-- CREATE POLICY "Users can insert their own domains"
--   ON public.domains FOR INSERT
--   WITH CHECK (auth.uid() = user_id);
-- 
-- CREATE POLICY "Users can update their own domains"
--   ON public.domains FOR UPDATE
--   USING (auth.uid() = user_id)
--   WITH CHECK (auth.uid() = user_id);
-- 
-- CREATE POLICY "Users can delete their own domains"
--   ON public.domains FOR DELETE
--   USING (auth.uid() = user_id);
-- ============================================

-- ============================================
-- Email Notifications 테이블 (선택사항)
-- ============================================
-- 이메일 발송 이력을 추적하는 테이블
-- user_id 제거로 domain_id만으로 연결
-- ============================================

CREATE TABLE IF NOT EXISTS public.email_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_email_notifications_domain_id ON public.email_notifications(domain_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_sent_at ON public.email_notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON public.email_notifications(status);

-- RLS 비활성화 (개인 프로젝트)
ALTER TABLE public.email_notifications DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 유용한 뷰 (선택사항)
-- ============================================

-- 사용 가능한 도메인만 조회하는 뷰
CREATE OR REPLACE VIEW public.available_domains AS
SELECT 
  id,
  name,
  last_checked,
  created_at,
  updated_at
FROM public.domains
WHERE status = 'available' AND active = true;

-- 최근 체크된 도메인 조회하는 뷰
CREATE OR REPLACE VIEW public.recently_checked_domains AS
SELECT 
  id,
  name,
  status,
  last_checked,
  created_at
FROM public.domains
WHERE active = true
ORDER BY last_checked DESC NULLS LAST;

-- ============================================
-- 샘플 데이터 (테스트용)
-- ============================================

-- 테스트용 도메인 추가
-- INSERT INTO public.domains (name, status, active) VALUES
--   ('example.com', 'registered', true),
--   ('awesome-domain.com', 'available', true),
--   ('my-startup.io', 'unknown', true),
--   ('test-domain.dev', 'registered', false);

-- ============================================
-- 유용한 쿼리 예시
-- ============================================

-- 모든 활성 도메인 조회
-- SELECT * FROM public.domains WHERE active = true;

-- 사용 가능한 도메인만 조회
-- SELECT * FROM public.domains WHERE status = 'available' AND active = true;

-- 최근 24시간 이내 체크된 도메인
-- SELECT * FROM public.domains 
-- WHERE last_checked > NOW() - INTERVAL '24 hours';

-- 오래된 도메인 찾기 (7일 이상 체크 안됨)
-- SELECT * FROM public.domains 
-- WHERE last_checked < NOW() - INTERVAL '7 days'
-- AND active = true;

-- 도메인별 알림 발송 횟수
-- SELECT 
--   d.name,
--   d.status,
--   COUNT(e.id) as notification_count,
--   MAX(e.sent_at) as last_notification
-- FROM public.domains d
-- LEFT JOIN public.email_notifications e ON d.id = e.domain_id
-- GROUP BY d.id, d.name, d.status
-- ORDER BY notification_count DESC;

-- ============================================
-- 마이그레이션 가이드 (멀티 유저로 전환 시)
-- ============================================
--
-- 단일 사용자에서 멀티 유저로 전환하려면:
--
-- 1. user_id 컬럼 추가
-- ALTER TABLE public.domains ADD COLUMN user_id UUID;
-- ALTER TABLE public.domains ADD CONSTRAINT domains_user_id_fkey 
--   FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- 2. 기존 데이터에 user_id 설정
-- UPDATE public.domains SET user_id = 'your-user-uuid-here';
--
-- 3. user_id를 NOT NULL로 변경
-- ALTER TABLE public.domains ALTER COLUMN user_id SET NOT NULL;
--
-- 4. UNIQUE 제약조건 수정
-- ALTER TABLE public.domains DROP CONSTRAINT IF EXISTS domains_name_key;
-- ALTER TABLE public.domains ADD CONSTRAINT domains_name_user_unique 
--   UNIQUE (name, user_id);
--
-- 5. 인덱스 추가
-- CREATE INDEX idx_domains_user_id ON public.domains(user_id);
--
-- 6. RLS 활성화 및 정책 적용 (위의 RLS 예시 참고)
-- ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
--
-- 7. email_notifications 테이블도 동일하게 수정
-- ALTER TABLE public.email_notifications ADD COLUMN user_id UUID;
-- (동일한 과정 반복)
-- ============================================
