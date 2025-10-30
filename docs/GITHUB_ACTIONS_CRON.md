# GitHub Actions CRON Job 설정 가이드

## 📋 개요

이 가이드는 GitHub Actions를 사용하여 정기적으로 도메인 가용성을 체크하는 CRON Job을 설정하는 방법을 설명합니다.

---

## 🔐 보안 설정

### 1. CRON_SECRET 생성

#### Windows (PowerShell)
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

#### macOS/Linux
```bash
openssl rand -base64 32
```

생성된 값을 복사하세요. 예: `Kx7jN9mP4qR8sT2vW5yZ1aB3cD6eF9gH0iJ3kL6mN9pQ==`

### 2. GitHub Repository Secrets 설정

1. GitHub 저장소로 이동
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret** 클릭
4. 다음 시크릿들을 추가:

| Name | Value | 설명 |
|------|-------|------|
| `CRON_SECRET` | 생성한 비밀 토큰 | API 인증용 |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | (선택) 필요시 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | (선택) 필요시 |

### 3. 로컬 환경 변수 설정

`.env.local` 파일에 동일한 `CRON_SECRET` 값을 설정:

```env
CRON_SECRET=Kx7jN9mP4qR8sT2vW5yZ1aB3cD6eF9gH0iJ3kL6mN9pQ==
```

---

## 📁 GitHub Actions Workflow 생성

`.github/workflows/cron-check-domains.yml` 파일을 생성하세요:

```yaml
name: Check Domain Availability

on:
  # 스케줄: 매일 오전 9시 (UTC 기준, 한국시간 오후 6시)
  schedule:
    - cron: '0 9 * * *'
  
  # 수동 실행 가능
  workflow_dispatch:

jobs:
  check-domains:
    runs-on: ubuntu-latest
    
    steps:
      - name: Call CRON API
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            https://your-domain.vercel.app/api/cron/check-domains
        
      - name: Log result
        if: always()
        run: echo "Domain check completed"
```

---

## 🎯 API Route 생성

`app/api/check-domains/route.ts` 파일이 이미 생성되어 있습니다.

### 주요 기능

1. **인증 검증**: `Authorization: Bearer ${CRON_SECRET}`
2. **활성 도메인 조회**: Supabase에서 `active=true` 도메인 가져오기
3. **도메인 체크**: Domainsduck API로 각 도메인 가용성 확인
4. **상태 업데이트**: Supabase에 결과 저장
5. **이메일 알림**: 사용 가능한 도메인 발견 시 Resend로 알림
6. **타임아웃 처리**: Vercel 10초 제한 고려

### API 엔드포인트

```
GET /api/check-domains
```

### 인증

```bash
Authorization: Bearer ${CRON_SECRET}
```

### 응답 형식

```json
{
  "success": true,
  "checked": 10,
  "available": 2,
  "domains": [
    {
      "domain": "example.com",
      "status": "available",
      "changed": true,
      "previousStatus": "registered"
    }
  ],
  "duration": 3456,
  "timestamp": "2025-10-29T12:00:00.000Z"
}
```

### 로컬 테스트

```powershell
# PowerShell
$secret = $env:CRON_SECRET
curl -X GET http://localhost:3000/api/check-domains `
  -H "Authorization: Bearer $secret" `
  -H "Content-Type: application/json"
```

---

## 🔧 CRON 스케줄 설정

### CRON 표현식 이해하기

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── 요일 (0-6, 0 = 일요일)
│ │ │ └───── 월 (1-12)
│ │ └─────── 일 (1-31)
│ └───────── 시 (0-23)
└─────────── 분 (0-59)
```

### 예시

```yaml
# 매 시간마다 실행
- cron: '0 * * * *'

# 매일 오전 9시 (UTC)
- cron: '0 9 * * *'

# 매일 오전 6시, 오후 6시
- cron: '0 6,18 * * *'

# 월요일부터 금요일까지 오전 9시
- cron: '0 9 * * 1-5'

# 매 6시간마다
- cron: '0 */6 * * *'
```

💡 **주의**: GitHub Actions는 **UTC 시간**을 사용합니다.
- 한국 시간(KST) = UTC + 9시간
- 한국 오전 9시 = UTC 오전 0시 = `'0 0 * * *'`
- 한국 오후 6시 = UTC 오전 9시 = `'0 9 * * *'`

---

## 🧪 테스트

### 1. 로컬 테스트

```bash
# CRON_SECRET 생성 (PowerShell)
$secret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
echo $secret

# API 호출 테스트
curl -X POST http://localhost:3000/api/cron/check-domains `
  -H "Authorization: Bearer YOUR_CRON_SECRET" `
  -H "Content-Type: application/json"
```

### 2. GitHub Actions 수동 실행

1. GitHub 저장소 → **Actions** 탭
2. **Check Domain Availability** workflow 선택
3. **Run workflow** 클릭
4. 로그 확인

---

## 📊 Supabase RLS 정책 설정

개인 프로젝트에서 CRON Job이 모든 도메인에 접근하려면 RLS 정책을 조정해야 합니다.

### 옵션 1: 특정 조건으로 허용

```sql
-- API Key 기반 접근 허용 (추천하지 않음)
CREATE POLICY "Allow service access to all domains"
ON domains FOR ALL
USING (
  current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
);
```

### 옵션 2: 개인 프로젝트용 (간단)

```sql
-- 본인 이메일로만 제한
CREATE POLICY "Allow your email to access all domains"
ON domains FOR ALL
USING (
  auth.jwt()->>'email' = 'your-email@example.com'
);
```

### 옵션 3: RLS 비활성화 (개인 프로젝트만!)

```sql
-- 테이블의 RLS 비활성화 (주의!)
ALTER TABLE domains DISABLE ROW LEVEL SECURITY;
```

⚠️ **보안 참고**: 개인 프로젝트라면 옵션 3이 가장 간단하지만, 프로젝트를 공유할 계획이라면 옵션 2를 권장합니다.

---

## 📝 체크리스트

- [ ] CRON_SECRET 생성
- [ ] GitHub Repository Secrets에 CRON_SECRET 추가
- [ ] `.env.local`에 CRON_SECRET 추가
- [ ] `.github/workflows/cron-check-domains.yml` 파일 생성
- [ ] `app/api/cron/check-domains/route.ts` 파일 생성
- [ ] Supabase RLS 정책 조정
- [ ] 로컬에서 API 테스트
- [ ] GitHub Actions 수동 실행 테스트
- [ ] 배포 후 실제 도메인으로 테스트

---

## 🚨 문제 해결

### "Unauthorized" 에러
- CRON_SECRET이 일치하는지 확인
- GitHub Secrets가 올바르게 설정되었는지 확인

### "Failed to fetch domains" 에러
- Supabase RLS 정책 확인
- 환경 변수가 올바른지 확인

### GitHub Actions가 실행되지 않음
- CRON 표현식이 올바른지 확인
- Repository가 활성화되어 있는지 확인
- 최근 commit이 있는지 확인 (30일 이상 비활성 시 중지됨)

---

## 📚 참고 자료

- [GitHub Actions - Scheduled Events](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)
- [Crontab Guru](https://crontab.guru/) - CRON 표현식 테스트 도구
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
