# Supabase 클라이언트 사용 가이드

## 📋 개요

이 프로젝트는 Next.js 15 App Router와 Supabase를 통합하여 사용합니다. 서버 컴포넌트, 클라이언트 컴포넌트, API Routes에서 각각 적절한 클라이언트를 사용해야 합니다.

## 🔧 설정된 클라이언트

### 1. `createClient()` - 클라이언트 컴포넌트용
### 2. `createServerSupabaseClient()` - 서버 컴포넌트용
### 3. `createAdminClient()` - Admin 작업용 (Server Actions/API Routes)

---

## 📦 타입 정의

`types/database.ts`에 Supabase 데이터베이스 스키마의 TypeScript 타입이 정의되어 있습니다.

### 자동 타입 생성 (선택사항)

Supabase CLI를 사용하여 실제 데이터베이스 스키마에서 타입을 자동 생성할 수 있습니다:

```bash
# Supabase CLI 설치
npm install -g supabase

# 프로젝트 연결
supabase login
supabase link --project-ref your-project-ref

# 타입 생성
supabase gen types typescript --local > types/database.ts
```

---

## 🎯 사용 예시

### 1️⃣ 클라이언트 컴포넌트에서 사용

```tsx
'use client';

import { createClient } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import type { Domain } from '@/types/database';

export function DomainList() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchDomains() {
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching domains:', error);
        return;
      }

      setDomains(data);
    }

    fetchDomains();
  }, []);

  return (
    <div>
      {domains.map((domain) => (
        <div key={domain.id}>{domain.name}</div>
      ))}
    </div>
  );
}
```

### 2️⃣ 서버 컴포넌트에서 사용

```tsx
import { createServerSupabaseClient } from '@/lib/supabase';
import type { Domain } from '@/types/database';

export default async function DomainsPage() {
  const supabase = await createServerSupabaseClient();

  const { data: domains, error } = await supabase
    .from('domains')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return <div>Error loading domains: {error.message}</div>;
  }

  return (
    <div>
      <h1>Domains</h1>
      {domains.map((domain: Domain) => (
        <div key={domain.id}>
          <h2>{domain.name}</h2>
          <p>Available: {domain.is_available ? 'Yes' : 'No'}</p>
        </div>
      ))}
    </div>
  );
}
```

### 3️⃣ Server Action에서 사용

```tsx
'use server';

import { createServerSupabaseClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import type { DomainInsert } from '@/types/database';

export async function addDomain(formData: FormData) {
  const supabase = await createServerSupabaseClient();

  const domainName = formData.get('domain') as string;

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  // Insert domain
  const newDomain: DomainInsert = {
    name: domainName,
    user_id: user.id,
    is_available: false,
  };

  const { data, error } = await supabase
    .from('domains')
    .insert(newDomain)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/domains');
  return { data };
}
```

### 4️⃣ API Route에서 사용

```tsx
// app/api/domains/route.ts
import { createServerSupabaseClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('domains')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const { data, error } = await supabase
    .from('domains')
    .insert({ ...body, user_id: user.id })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
```

### 5️⃣ Admin 클라이언트 사용 (Row Level Security 우회)

```tsx
// app/api/cron/check-domains/route.ts
import { createAdminClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // CRON secret 검증
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Admin 클라이언트는 RLS를 우회하므로 모든 도메인 조회 가능
  const { data: domains, error } = await supabase
    .from('domains')
    .select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 도메인 체크 로직...
  
  return NextResponse.json({ 
    success: true, 
    checked: domains.length 
  });
}
```

---

## 🔐 인증 관련 작업

### 회원가입

```tsx
'use client';

import { createClient } from '@/lib/supabase';

export function SignUpForm() {
  const supabase = createClient();

  async function handleSignUp(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('Sign up error:', error);
      return;
    }

    console.log('User created:', data.user);
  }

  return (
    <form action={handleSignUp}>
      <input type="email" name="email" required />
      <input type="password" name="password" required />
      <button type="submit">Sign Up</button>
    </form>
  );
}
```

### 로그인

```tsx
'use client';

import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export function SignInForm() {
  const supabase = createClient();
  const router = useRouter();

  async function handleSignIn(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error);
      return;
    }

    router.push('/dashboard');
  }

  return (
    <form action={handleSignIn}>
      <input type="email" name="email" required />
      <input type="password" name="password" required />
      <button type="submit">Sign In</button>
    </form>
  );
}
```

### 로그아웃

```tsx
'use client';

import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export function SignOutButton() {
  const supabase = createClient();
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <button onClick={handleSignOut}>
      Sign Out
    </button>
  );
}
```

### 현재 사용자 가져오기 (서버)

```tsx
import { createServerSupabaseClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  return (
    <div>
      <h1>Welcome, {user.email}</h1>
    </div>
  );
}
```

---

## 🎨 실시간 구독 (Realtime)

```tsx
'use client';

import { createClient } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import type { Domain } from '@/types/database';

export function RealtimeDomains() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const supabase = createClient();

  useEffect(() => {
    // 초기 데이터 로드
    supabase
      .from('domains')
      .select('*')
      .then(({ data }) => {
        if (data) setDomains(data);
      });

    // 실시간 구독
    const channel = supabase
      .channel('domains-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'domains',
        },
        (payload) => {
          console.log('Change received!', payload);
          
          if (payload.eventType === 'INSERT') {
            setDomains((prev) => [...prev, payload.new as Domain]);
          } else if (payload.eventType === 'UPDATE') {
            setDomains((prev) =>
              prev.map((d) =>
                d.id === payload.new.id ? (payload.new as Domain) : d
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setDomains((prev) =>
              prev.filter((d) => d.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <div>
      {domains.map((domain) => (
        <div key={domain.id}>{domain.name}</div>
      ))}
    </div>
  );
}
```

---

## ⚠️ 주의사항

### 1. 환경 변수 검증
모든 클라이언트 함수는 환경 변수를 자동으로 검증합니다. 누락된 경우 명확한 에러 메시지를 제공합니다.

### 2. NEXT_PUBLIC_ 접두사
- `NEXT_PUBLIC_SUPABASE_URL`: 클라이언트에 노출됨 ✅
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 클라이언트에 노출됨 ✅
- `SUPABASE_SERVICE_ROLE_KEY`: 서버 전용, 절대 노출 금지 ⚠️

### 3. Admin 클라이언트 사용 시 주의
`createAdminClient()`는 Row Level Security를 우회합니다. 신중하게 사용하고, 반드시 서버 측에서만 호출하세요.

### 4. 쿠키 설정 에러
서버 컴포넌트에서 쿠키를 설정할 때 에러가 발생할 수 있습니다. 이는 정상적인 동작이며, middleware에서 세션을 갱신하면 해결됩니다.

---

## 📚 참고 자료

- [Supabase Next.js 공식 가이드](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase JavaScript 클라이언트 문서](https://supabase.com/docs/reference/javascript)
- [Next.js 15 App Router 문서](https://nextjs.org/docs/app)
