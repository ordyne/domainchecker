# GitHub Actions Workflows

## Domain Check Workflow

### 설정 방법

1. **GitHub Secrets 추가**
   
   Repository Settings → Secrets and variables → Actions → New repository secret

   필요한 Secrets:
   - `VERCEL_APP_URL`: Vercel 배포 URL (예: `https://your-app.vercel.app`)
   - `CRON_SECRET`: API 인증용 비밀 키 (`.env.local`의 `CRON_SECRET`과 동일)

2. **실행 시간**
   
   - **오전 9시 (KST)**: UTC 0시 → `cron: '0 0 * * *'`
   - **오후 9시 (KST)**: UTC 12시 → `cron: '0 12 * * *'`

3. **수동 실행**
   
   Actions 탭 → Domain Availability Check → Run workflow

### Cron 표현식 설명

```
 ┌───────────── 분 (0 - 59)
 │ ┌───────────── 시 (0 - 23, UTC 기준)
 │ │ ┌───────────── 일 (1 - 31)
 │ │ │ ┌───────────── 월 (1 - 12)
 │ │ │ │ ┌───────────── 요일 (0 - 6, 일요일 = 0)
 │ │ │ │ │
 * * * * *
```

### 시간대 변환 참고

| 한국 시간 (KST) | UTC 시간 | Cron 표현식 |
|----------------|---------|------------|
| 오전 9시 (09:00) | 00:00   | `0 0 * * *` |
| 오후 9시 (21:00) | 12:00   | `0 12 * * *` |

### 트러블슈팅

**문제: 401 Unauthorized**
- `CRON_SECRET`이 올바르게 설정되었는지 확인
- API Route에서 Bearer token 검증 확인

**문제: 404 Not Found**
- `VERCEL_APP_URL`이 올바른지 확인
- `/api/check-domains` 엔드포인트 존재 확인

**문제: Workflow가 실행되지 않음**
- GitHub Actions가 활성화되어 있는지 확인
- Repository가 public이거나 Actions 권한이 있는지 확인
- Default branch에 workflow 파일이 있는지 확인

### 수동 실행 방법

1. GitHub Repository → Actions 탭
2. 왼쪽 사이드바에서 "Domain Availability Check" 선택
3. 오른쪽 "Run workflow" 버튼 클릭
4. Branch 선택 후 "Run workflow" 클릭

### 로그 확인

Actions 탭에서 각 workflow 실행을 클릭하면:
- 실행 시간
- 성공/실패 상태
- 각 step의 상세 로그
- API 응답 상태 코드 및 내용
