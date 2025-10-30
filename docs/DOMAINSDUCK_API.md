# Domainsduck API 사용 가이드

## 📋 개요

이 문서는 Domainsduck API를 사용하여 도메인 가용성을 체크하는 방법을 설명합니다.

---

## 🔑 API 키 설정

### 1. Domainsduck API 키 발급

1. [Domainsduck](https://domainsduck.com) 웹사이트 방문
2. 계정 생성/로그인
3. API 키 발급

### 2. 환경 변수 설정

`.env.local` 파일에 API 키 추가:

```env
DOMAINSDUCK_API_KEY=ddk_your_api_key_here
DOMAINSDUCK_API_URL=https://api.domainsduck.com
```

---

## 📚 함수 사용법

### 1. `checkDomain()` - 단일 도메인 체크

가장 기본적인 함수로, 하나의 도메인 가용성을 체크합니다.

```typescript
import { checkDomain } from '@/lib/domainsduck';

const isAvailable = await checkDomain('example.com');

if (isAvailable) {
  console.log('✅ 도메인 사용 가능!');
} else {
  console.log('❌ 도메인 이미 등록됨');
}
```

**반환값:** `Promise<boolean>`
- `true`: 도메인 사용 가능
- `false`: 도메인 이미 등록됨

---

### 2. `checkDomainAvailability()` - 상세 정보 포함

도메인 체크 결과와 함께 상세 정보를 반환합니다.

```typescript
import { checkDomainAvailability } from '@/lib/domainsduck';

const result = await checkDomainAvailability('example.com');

console.log(result);
// {
//   domain: "example.com",
//   available: true,
//   status: "available",
//   checkedAt: Date,
//   error?: string
// }
```

**반환값:** `Promise<DomainCheckResult>`

```typescript
interface DomainCheckResult {
  domain: string;           // 체크한 도메인
  available: boolean;       // 사용 가능 여부
  status: 'available' | 'registered';  // 상태
  checkedAt: Date;          // 체크 시간
  error?: string;           // 에러 메시지 (있는 경우)
}
```

---

### 3. `checkDomainsBulk()` - 여러 도메인 한 번에 체크

여러 도메인을 한 번의 API 호출로 체크합니다 (효율적).

```typescript
import { checkDomainsBulk } from '@/lib/domainsduck';

const domains = ['example.com', 'test.com', 'demo.io'];
const results = await checkDomainsBulk(domains);

results.forEach((available, domain) => {
  console.log(`${domain}: ${available ? '✅ Available' : '❌ Registered'}`);
});
```

**반환값:** `Promise<Map<string, boolean>>`
- Key: 도메인 이름
- Value: 사용 가능 여부

---

### 4. `checkDomainsAvailability()` - 여러 도메인 상세 정보

여러 도메인의 상세 정보를 배열로 반환합니다.

```typescript
import { checkDomainsAvailability } from '@/lib/domainsduck';

const domains = ['example.com', 'test.com', 'demo.io'];
const results = await checkDomainsAvailability(domains);

results.forEach(result => {
  console.log(`${result.domain}: ${result.status}`);
  console.log(`  Checked at: ${result.checkedAt}`);
  if (result.error) {
    console.log(`  Error: ${result.error}`);
  }
});
```

**반환값:** `Promise<DomainCheckResult[]>`

---

### 5. `checkDomainWithRateLimit()` - Rate Limit 고려

Rate limit을 자동으로 체크하고 제한을 초과하면 null을 반환합니다.

```typescript
import { checkDomainWithRateLimit } from '@/lib/domainsduck';

const result = await checkDomainWithRateLimit('example.com');

if (result === null) {
  console.log('⚠️ Rate limit exceeded. Please try again later.');
} else if (result.available) {
  console.log('✅ Domain available!');
} else {
  console.log('❌ Domain registered');
}
```

**Rate Limit:** 30 요청/시간

---

## 🎯 실전 예시

### API Route에서 사용

```typescript
// app/api/check-domains/route.ts
import { checkDomainAvailability } from '@/lib/domainsduck';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const domain = url.searchParams.get('domain');

  if (!domain) {
    return Response.json({ error: 'Domain required' }, { status: 400 });
  }

  const result = await checkDomainAvailability(domain);

  return Response.json(result);
}
```

### Server Component에서 사용

```typescript
// app/domains/[domain]/page.tsx
import { checkDomainAvailability } from '@/lib/domainsduck';

export default async function DomainPage({ 
  params 
}: { 
  params: { domain: string } 
}) {
  const result = await checkDomainAvailability(params.domain);

  return (
    <div>
      <h1>{result.domain}</h1>
      <p>Status: {result.status}</p>
      <p>Available: {result.available ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

### CRON Job에서 여러 도메인 체크

```typescript
// app/api/cron/check-domains/route.ts
import { checkDomainsAvailability } from '@/lib/domainsduck';

export async function GET() {
  const domains = ['example.com', 'test.com', 'demo.io'];
  const results = await checkDomainsAvailability(domains);

  const available = results.filter(r => r.available);

  if (available.length > 0) {
    // 이메일 발송 로직
    console.log('Available domains:', available);
  }

  return Response.json({
    total: results.length,
    available: available.length,
    results,
  });
}
```

---

## ⚙️ 설정 및 제한사항

### API 설정

```typescript
const DOMAINSDUCK_CONFIG = {
  apiUrl: 'https://api.domainsduck.com',
  timeout: 8000,  // 8초 타임아웃
  rateLimit: {
    maxRequests: 30,
    perHour: 1,
  },
};
```

### Rate Limiting

- **제한:** 30 요청/시간
- **초과 시:** 다음 가능 시간까지 대기 필요
- **권장:** `checkDomainWithRateLimit()` 사용

### 타임아웃

- **기본값:** 8초
- **이유:** Vercel 10초 제한 고려
- **타임아웃 시:** `AbortError` 발생

---

## 🔍 에러 핸들링

### 일반적인 에러

```typescript
try {
  const result = await checkDomainAvailability('example.com');
  console.log(result);
} catch (error) {
  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      console.error('⏱️ Request timeout');
    } else if (error.message.includes('API key')) {
      console.error('🔑 API key not configured');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}
```

### Rate Limit 초과

```typescript
import { checkDomainWithRateLimit, rateLimiter } from '@/lib/domainsduck';

const result = await checkDomainWithRateLimit('example.com');

if (result === null) {
  const nextAvailable = rateLimiter.getNextAvailableTime();
  console.log(`Rate limit exceeded. Try again at ${nextAvailable}`);
}
```

---

## 🧪 테스트

### 단일 도메인 테스트

```typescript
// test-single.ts
import { checkDomainAvailability } from '@/lib/domainsduck';

async function test() {
  const result = await checkDomainAvailability('google.com');
  console.log('Google.com:', result);
  // Expected: { available: false, status: 'registered' }
}

test();
```

### 여러 도메인 테스트

```typescript
// test-bulk.ts
import { checkDomainsAvailability } from '@/lib/domainsduck';

async function test() {
  const domains = [
    'google.com',           // 등록됨
    'veryuniquedomain12345678.com',  // 사용 가능할 수 있음
    'example.com',          // 예약됨
  ];

  const results = await checkDomainsAvailability(domains);
  
  results.forEach(result => {
    console.log(`${result.domain}: ${result.status}`);
  });
}

test();
```

---

## 📊 API 응답 형식

### Single Check (예상)

```json
GET /v1/check?domain=example.com

{
  "domain": "example.com",
  "available": false,
  "tld": "com",
  "price": 12.99
}
```

### Bulk Check (예상)

```json
POST /v1/check/bulk
Body: { "domains": ["example.com", "test.com"] }

{
  "results": [
    {
      "domain": "example.com",
      "available": false
    },
    {
      "domain": "test.com",
      "available": true
    }
  ]
}
```

**참고:** 실제 API 응답 형식은 Domainsduck 문서를 확인하세요.

---

## 🚨 주의사항

### 1. API 키 보안
- API 키를 절대 클라이언트에 노출하지 마세요
- 환경 변수로만 관리
- GitHub 등에 커밋하지 않도록 주의

### 2. Rate Limiting
- 30 요청/시간 제한 준수
- 대량 체크 시 `checkDomainsBulk()` 사용 권장
- 프로덕션에서는 Redis 기반 rate limiter 고려

### 3. 타임아웃
- Vercel Hobby 플랜: 10초 제한
- 긴 작업은 여러 요청으로 분할
- Background job 고려

### 4. 에러 처리
- 항상 try-catch로 에러 처리
- 사용자에게 명확한 에러 메시지 제공
- 로그로 디버깅 정보 기록

---

## 🔗 참고 자료

- [Domainsduck 공식 문서](https://domainsduck.com/docs)
- [API 가격 정책](https://domainsduck.com/pricing)
- [Rate Limiting 가이드](https://domainsduck.com/docs/rate-limits)

---

## 💡 팁

### Bulk API 활용

10개 이상의 도메인을 체크할 때는 반드시 Bulk API를 사용하세요:

```typescript
// ❌ 비효율적 (10개 API 호출)
for (const domain of domains) {
  await checkDomain(domain);
}

// ✅ 효율적 (1개 API 호출)
const results = await checkDomainsBulk(domains);
```

### 캐싱 구현 (주의!)

⚠️ **경고:** 도메인 모니터링에서 캐싱은 위험할 수 있습니다!

**문제점:**
- 도메인 상태 변경을 놓칠 수 있음
- "registered" → "available" 전환 시 알림 누락 가능

**안전한 캐싱 전략:**

```typescript
// ✅ 사용자 액션에서만 짧은 캐시 (Rate limit 방지)
const uiCache = new Map<string, { result: boolean, timestamp: number }>();
const SHORT_CACHE_TTL = 30 * 1000; // 30초

async function checkForUI(domain: string) {
  const cached = uiCache.get(domain);
  
  // 30초 이내는 캐시 반환 (새로고침 연타 방지)
  if (cached && Date.now() - cached.timestamp < SHORT_CACHE_TTL) {
    return cached.result;
  }

  const result = await checkDomain(domain);
  uiCache.set(domain, { result, timestamp: Date.now() });
  
  return result;
}

// ❌ CRON Job에서는 절대 캐싱하지 마세요!
async function cronCheck(domain: string) {
  // 항상 실시간 체크
  return await checkDomain(domain);
}
```

**권장사항:**
- **CRON Job**: 캐싱 절대 금지 (상태 변경 감지가 목적)
- **대시보드**: 짧은 캐시 (30초~1분, Rate limit 방지용)
- **메타데이터**: 긴 캐시 가능 (TLD 가격 등)

### 재시도 로직

네트워크 에러 시 자동 재시도:

```typescript
async function checkWithRetry(domain: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await checkDomain(domain);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```
