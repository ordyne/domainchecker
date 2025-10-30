# Domainsduck API 사용 가이드

## 📋 개요

이 문서는 Domainsduck API를 사용하여 도메인 가용성을 체크하는 방법을 설명합니다.

---

## 🔑 API 키 설정

### 1. Domainsduck API 키 발급

1. [Domainsduck](https://domainsduck.com) 웹사이트 방문
2. 계정 생성/로그인 (Register)
3. API 키 발급

### 2. 환경 변수 설정

`.env.local` 파일에 API 키 추가:

```env
DOMAINSDUCK_API_KEY=your_api_key_here
DOMAINSDUCK_API_URL=https://eu.domainsduck.com
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

### 타임아웃

- **기본값:** 8초 (Vercel 10초 제한 고려)
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

### 실제 API 형식

Domainsduck API는 다음 형식을 사용합니다:

**엔드포인트:**
```
GET https://eu.domainsduck.com/api/get/?domain={domain}&apikey={apikey}
```

**응답 예시:**

```json
{
  "domain": "example.com",
  "availability": "false"
}
```

**`availability` 값:**
- `"true"`: 도메인 사용 가능
- `"false"`: 도메인 이미 등록됨
- `"premium domain"`: 프리미엄 도메인 (사용 가능)
- `"reserved"`: 예약된 도메인
- `"bad tld"`: 유효하지 않은 TLD

### Bulk Check

> **참고**: Domainsduck에는 Bulk API가 없습니다. 
> 여러 도메인 체크 시 개별 API를 병렬로 호출합니다.

```typescript
// 내부적으로 Promise.all로 병렬 처리
const results = await checkDomainsBulk(['example.com', 'test.com']);
```

---

## 🚨 주의사항

### 1. API 키 보안
- API 키를 절대 클라이언트에 노출하지 마세요
- 환경 변수로만 관리
- GitHub 등에 커밋하지 않도록 주의

### 2. Rate Limiting
- 30 요청/시간 제한 준수

### 3. 타임아웃
- Vercel Hobby 플랜: 10초 제한

### 4. 에러 처리
- try-catch로 에러 처리 필요


