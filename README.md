# 🌐 Domain Checker

**원하는 도메인이 사용 가능해지는 순간을 놓치지 마세요!**

Domain Checker는 원하는 도메인의 등록 가능 여부를 자동으로 모니터링하고, 도메인이 사용 가능해지면 즉시 이메일 알림을 보내주는 웹 애플리케이션입니다.

---

## ✨ Features

### 핵심 기능
- 🔍 **자동 도메인 조회**: Domainsduck API를 통한 정확한 도메인 등록 상태 확인
- 📊 **모니터링 대시보드**: 추가한 모든 도메인의 상태를 한눈에 확인
- 📧 **자동 이메일 알림**: 도메인이 사용 가능해지면 즉시 이메일 통지
- ⏰ **스케줄링**: GitHub Actions를 통한 자동 도메인 체크 (매일 오전 9시, 오후 9시)
- 🎨 **Premium Dark UI**: Slate 컬러 팔레트 기반의 세련된 다크 모드 디자인
- 📱 **반응형 디자인**: 모바일, 태블릿, 데스크톱 모든 환경 지원

### 기술적 특징
- ⚡ **Next.js 16**: 최신 App Router 및 Server Components 활용
- 🔒 **Type-Safe**: TypeScript로 작성된 완전한 타입 안정성
- � **자동 데이터 동기화**: Supabase Realtime으로 대시보드 자동 업데이트
- 🎯 **API Routes**: RESTful API 엔드포인트 및 CRON 작업 지원
- 📦 **모듈화**: 재사용 가능한 컴포넌트 구조

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 16.0.1](https://nextjs.org/) (App Router)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **UI Library**: [React 19.2.0](https://react.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Date Formatting**: [date-fns 4.1.0](https://date-fns.org/)

### Backend & Services
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL + Realtime)
- **Authentication**: Supabase Auth
- **Email**: [Resend 6.3.0](https://resend.com/)
- **Domain API**: [Domainsduck](https://domainsduck.com/)

### DevOps
- **Deployment**: [Vercel](https://vercel.com/)
- **CI/CD**: [GitHub Actions](https://github.com/features/actions)
- **Automation**: Cron Jobs (매일 2회 자동 도메인 체크)

---

## 📁 Project Structure

```
domainchecker/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   └── check-domains/    # 도메인 체크 CRON 엔드포인트
│   ├── layout.tsx            # 루트 레이아웃
│   ├── page.tsx              # 메인 대시보드
│   └── globals.css           # 글로벌 스타일
├── components/               # React 컴포넌트
│   ├── AddDomainForm.tsx     # 도메인 추가 폼
│   └── DomainList.tsx        # 도메인 목록 표시
├── lib/                      # 외부 서비스 클라이언트
│   ├── supabase/             # Supabase 클라이언트
│   │   ├── client.ts         # 클라이언트 사이드
│   │   └── server.ts         # 서버 사이드
│   ├── domainsduck.ts        # Domainsduck API 클라이언트
│   └── resend.ts             # Resend 이메일 클라이언트
├── types/                    # TypeScript 타입 정의
│   ├── database.ts           # Supabase 데이터베이스 타입
│   ├── domain.ts             # 도메인 관련 타입 & 유틸리티
│   └── index.ts              # 타입 export
├── supabase/                 # Supabase 설정
│   └── schema.sql            # 데이터베이스 스키마
├── public/                   # 정적 파일
│   └── *.svg                 # 아이콘 및 이미지
├── .github/                  # GitHub 설정
│   └── workflows/            # GitHub Actions 워크플로우
│       ├── domain-check.yml  # 자동 도메인 체크
│       └── README.md         # 워크플로우 설정 가이드
├── docs/                     # 프로젝트 문서
│   ├── DATABASE_SCHEMA.md    # 데이터베이스 스키마 문서
│   ├── DOMAINSDUCK_API.md    # Domainsduck API 사용법
│   ├── GITHUB_ACTIONS_CRON.md # GitHub Actions 설정
│   └── SUPABASE_USAGE.md     # Supabase 사용 가이드
├── .env.example              # 환경 변수 템플릿
└── LICENSE                   # MIT License
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x 이상
- npm 또는 yarn
- Supabase 계정
- Resend 계정
- Domainsduck API 키

### Installation

1. **저장소 클론**

```bash
git clone https://github.com/Ordyne/domainchecker.git
cd domainchecker
```

2. **의존성 설치**

```bash
npm install
```

3. **환경 변수 설정**

`.env.local` 파일을 프로젝트 루트에 생성하고 아래 내용을 입력하세요:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Resend 설정
RESEND_API_KEY=your_resend_api_key

# Domainsduck 설정
DOMAINSDUCK_API_KEY=your_domainsduck_api_key

# CRON 보안 (GitHub Actions용)
CRON_SECRET=your_random_secret_string
```

**환경 변수 상세 설명:**

| 변수명 | 설명 | 획득 방법 |
|--------|------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | [Supabase Dashboard](https://app.supabase.com/) → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Key | 동일한 위치 |
| `RESEND_API_KEY` | Resend API 키 | [Resend Dashboard](https://resend.com/api-keys) → API Keys |
| `DOMAINSDUCK_API_KEY` | Domainsduck API 키 | [Domainsduck](https://domainsduck.com/) 가입 후 발급 |
| `CRON_SECRET` | CRON 엔드포인트 보안용 시크릿 | 임의의 안전한 문자열 생성 (예: UUID) |

4. **Supabase 데이터베이스 설정**

Supabase SQL Editor에서 `supabase/schema.sql` 파일을 실행하여 데이터베이스 스키마를 생성하세요.

```sql
-- supabase/schema.sql 파일 내용 복사 & 실행
```

5. **개발 서버 실행**

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 애플리케이션을 확인하세요.

---

## 📝 Available Scripts

```bash
# 개발 서버 실행 (포트 3000)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start

# ESLint 코드 검사
npm run lint
```

---

## 🌍 Deployment

### Vercel 배포 (권장)

Vercel은 Next.js 애플리케이션 배포에 최적화되어 있습니다.

1. **Vercel 계정 연결**

```bash
# Vercel CLI 설치 (선택사항)
npm i -g vercel

# 배포
vercel
```

2. **환경 변수 설정**

Vercel Dashboard → Settings → Environment Variables에서 다음 환경 변수를 추가하세요:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `RESEND_API_KEY`
- `DOMAINSDUCK_API_KEY`
- `CRON_SECRET`

3. **GitHub Actions 설정**

GitHub Repository → Settings → Secrets and variables → Actions에서 다음 시크릿을 추가하세요:
- `VERCEL_APP_URL`: Vercel에서 배포된 애플리케이션 URL
- `CRON_SECRET`: `.env.local`과 동일한 값

자세한 내용은 [`.github/workflows/README.md`](.github/workflows/README.md)를 참고하세요.

### 수동 배포

기타 플랫폼에서도 배포 가능합니다:
- **Railway**: Database 통합 지원
- **Render**: 무료 티어 제공
- **Netlify**: Next.js 지원

---

##  How It Works

### 1. 도메인 추가
사용자가 모니터링하고 싶은 도메인을 대시보드에서 추가합니다.

### 2. 자동 체크
GitHub Actions가 매일 2회(오전 9시, 오후 9시 KST) 자동으로 모든 활성 도메인을 체크합니다.

### 3. 상태 업데이트
Domainsduck API를 통해 각 도메인의 등록 가능 여부를 확인하고 데이터베이스를 업데이트합니다.

### 4. 이메일 알림
도메인 상태가 "등록됨"에서 "사용 가능"으로 변경되면 Resend를 통해 이메일을 발송합니다.

### 5. 대시보드 업데이트
Supabase Realtime을 통해 대시보드에 변경 사항이 자동으로 반영됩니다.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React 프레임워크
- [Supabase](https://supabase.com/) - 백엔드 인프라
- [Resend](https://resend.com/) - 이메일 전송
- [Domainsduck](https://domainsduck.com/) - 도메인 조회 API
- [Tailwind CSS](https://tailwindcss.com/) - 스타일링
- [Vercel](https://vercel.com/) - 배포 플랫폼

---

<div align="center">

**Made with ❤️ using Next.js and Supabase**

[⬆ Back to Top](#-domain-checker)

</div>
