# 🚀 배포 가이드

## 전체 배포 프로세스

### 1️⃣ GitHub에 업로드

```bash
# Git 초기화 (아직 안했다면)
git init

# 모든 파일 추가
git add .

# 첫 커밋
git commit -m "Initial commit: Domain Checker with automated monitoring"

# GitHub 리포지토리 연결
git remote add origin https://github.com/Ordyne/domainchecker.git

# 푸시
git branch -M main
git push -u origin main
```

---

### 2️⃣ GitHub Secrets 설정

**GitHub 리포지토리 → Settings → Secrets and variables → Actions**

#### 필수 Secrets (2개)

1. **`CRON_SECRET`**
   - 설명: API 인증 토큰
   - 값: `.env.local`의 `CRON_SECRET` 복사
   - 예시: `pjsIMpRYqRLa6tTDIhWj5apAw4LZobCDTMM5fEmt5nw=`

2. **`APP_URL`**
   - 설명: Vercel 배포 URL
   - 값: Vercel 배포 후 받은 URL (3단계 후 추가)
   - 예시: `https://domainchecker.vercel.app`

---

### 3️⃣ Vercel 배포

#### A. 프로젝트 생성

1. [vercel.com](https://vercel.com) 로그인
2. "Add New" → "Project" 클릭
3. GitHub 리포지토리 `Ordyne/domainchecker` 선택
4. Framework Preset: **Next.js** (자동 감지)

#### B. 환경 변수 설정

**Environment Variables** 섹션에서 다음 7개 추가:

| Key | Value | Environment |
|-----|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project-id.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` (Supabase 대시보드에서 복사) | Production, Preview, Development |
| `RESEND_API_KEY` | `re_...` (Resend에서 발급) | Production |
| `RESEND_FROM_EMAIL` | `onboarding@resend.dev` | Production |
| `NOTIFICATION_EMAIL` | `your-email@gmail.com` | Production |
| `DOMAINSDUCK_API_KEY` | `YOUR_API_KEY` (Domainsduck에서 발급) | Production |
| `CRON_SECRET` | `your_generated_secret` | Production |

> **⚠️ 주의**: 실제 값은 `.env.local` 파일 참고

#### C. 배포 실행

1. "Deploy" 버튼 클릭
2. 빌드 완료 대기 (약 2-3분)
3. 배포 URL 확인 (예: `https://domainchecker.vercel.app`)

---

### 4️⃣ GitHub Actions 활성화

#### A. APP_URL Secret 추가

배포 완료 후:
1. GitHub → Settings → Secrets → Actions
2. "New repository secret" 클릭
3. Name: `APP_URL`
4. Value: Vercel 배포 URL (예: `https://domainchecker.vercel.app`)
5. "Add secret" 클릭

#### B. 수동 테스트

1. GitHub → Actions 탭
2. "Check Domain Availability" 워크플로우 선택
3. "Run workflow" → "Run workflow" 클릭
4. 실행 결과 확인

---

### 5️⃣ 최종 확인 체크리스트

#### ✅ Vercel 배포 확인
- [ ] `https://your-app.vercel.app` 접속 가능
- [ ] 도메인 추가 기능 작동
- [ ] Supabase 연결 정상

#### ✅ API Route 확인
```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-app.vercel.app/api/check-domains
```

예상 응답:
```json
{
  "success": true,
  "checked": 0,
  "available": 0,
  "domains": [],
  "duration": 123
}
```

#### ✅ GitHub Actions 확인
- [ ] GitHub Actions 탭에서 워크플로우 표시됨
- [ ] 수동 실행 성공
- [ ] CRON 스케줄 설정 확인 (매일 오전 9시, 오후 9시 KST)

#### ✅ 이메일 알림 확인
1. 도메인 추가
2. API Route 수동 호출하여 상태 변경
3. 이메일 수신 확인

---

## 🔧 트러블슈팅

### 1. Vercel 빌드 실패

**에러**: `Module not found`
- **해결**: `package.json`의 의존성 확인 후 재배포

**에러**: `Environment variable not found`
- **해결**: Vercel 환경 변수 설정 확인

### 2. GitHub Actions 실패

**에러**: `401 Unauthorized`
- **해결**: GitHub Secrets의 `CRON_SECRET` 확인

**에러**: `Connection refused`
- **해결**: `APP_URL` Secret 값 확인 (https:// 포함)

### 3. API Route 에러

**에러**: `Missing required environment variables`
- **해결**: Vercel 환경 변수 7개 모두 설정 확인

**에러**: `Database connection failed`
- **해결**: Supabase URL과 ANON_KEY 확인

---

## 📊 모니터링

### Vercel Dashboard
- 배포 로그: Deployments 탭
- 함수 로그: Functions → Logs
- 사용량: Analytics

### GitHub Actions
- 실행 이력: Actions 탭
- CRON 작업 로그: 각 워크플로우 실행 결과

### Supabase
- 데이터베이스: Table Editor
- 쿼리 로그: Logs → Database

---

## 🔄 업데이트 프로세스

```bash
# 1. 코드 수정
git add .
git commit -m "Update: description of changes"

# 2. GitHub에 푸시
git push origin main

# 3. Vercel 자동 배포 (약 2-3분)
# Vercel이 자동으로 감지하여 재배포

# 4. 배포 확인
# Vercel Dashboard에서 배포 상태 확인
```

---

## 📝 중요 URL 모음

- **Production URL**: `https://your-app.vercel.app`
- **GitHub Repo**: `https://github.com/Ordyne/domainchecker`
- **Vercel Dashboard**: `https://vercel.com/your-username/domainchecker`
- **Supabase Dashboard**: `https://supabase.com/dashboard/project/your-project-id`

---

## 🎉 배포 완료!

모든 단계를 완료하셨다면:
1. 매일 오전 9시, 오후 9시에 자동으로 도메인 체크
2. 도메인 사용 가능 시 이메일 알림 발송
3. Vercel에서 안정적으로 호스팅

**문제가 발생하면**:
- Vercel 로그 확인
- GitHub Actions 로그 확인
- Supabase 데이터베이스 확인
