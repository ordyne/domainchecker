// Domainsduck API client for domain availability checking
import type { DomainCheckResult } from '@/types';

/**
 * Domainsduck API 설정
 */
const DOMAINSDUCK_CONFIG = {
  apiUrl: process.env.DOMAINSDUCK_API_URL || 'https://eu.domainsduck.com',
  apiKey: process.env.DOMAINSDUCK_API_KEY,
  timeout: 8000, // 8초 타임아웃 (Vercel 10초 제한 고려)
  rateLimit: {
    maxRequests: 30,
    perHour: 1,
  },
};

/**
 * API 설정 검증
 */
function validateConfig(): { apiUrl: string; apiKey: string } {
  if (!DOMAINSDUCK_CONFIG.apiUrl) {
    throw new Error('DOMAINSDUCK_API_URL environment variable is not set');
  }
  if (!DOMAINSDUCK_CONFIG.apiKey) {
    throw new Error('DOMAINSDUCK_API_KEY environment variable is not set');
  }
  return {
    apiUrl: DOMAINSDUCK_CONFIG.apiUrl,
    apiKey: DOMAINSDUCK_CONFIG.apiKey,
  };
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = DOMAINSDUCK_CONFIG.timeout
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 단일 도메인 가용성 체크
 * 
 * @param domain - 체크할 도메인 (예: "example.com")
 * @returns 도메인 사용 가능 여부 (true = 사용 가능, false = 등록됨)
 * 
 * @example
 * ```typescript
 * const isAvailable = await checkDomain('example.com');
 * if (isAvailable) {
 *   console.log('도메인 사용 가능!');
 * }
 * ```
 */
export async function checkDomain(domain: string): Promise<boolean> {
  try {
    const { apiUrl, apiKey } = validateConfig();
    const url = `${apiUrl}/api/get/?domain=${encodeURIComponent(domain)}&apikey=${apiKey}`;

    console.log(`[Domainsduck] Checking domain: ${domain}`);

    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`API request failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    // Domainsduck API 응답 형식:
    // { "availability": "true" | "false" | "premium domain" | "reserved" | "bad tld" }
    const availability = data.availability?.toString().toLowerCase();
    const isAvailable = availability === 'true' || availability === 'premium domain';
    
    console.log(`[Domainsduck] ${domain}: ${isAvailable ? 'Available ✅' : 'Registered ❌'} (${availability})`);
    
    return isAvailable;

  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error(`[Domainsduck] Timeout checking ${domain}`);
        throw new Error(`Domain check timeout for ${domain}`);
      }
      console.error(`[Domainsduck] Error checking ${domain}:`, error.message);
      throw error;
    }
    throw new Error(`Unknown error checking ${domain}`);
  }
}

/**
 * 여러 도메인을 한 번에 체크 (Bulk API)
 * 
 * @param domains - 체크할 도메인 배열
 * @returns Map<도메인, 사용가능여부>
 * 
 * @example
 * ```typescript
 * const domains = ['example.com', 'test.com', 'demo.io'];
 * const results = await checkDomainsBulk(domains);
 * 
 * results.forEach((available, domain) => {
 *   console.log(`${domain}: ${available ? 'Available' : 'Registered'}`);
 * });
 * ```
 */
export async function checkDomainsBulk(domains: string[]): Promise<Map<string, boolean>> {
  try {
    if (domains.length === 0) {
      return new Map();
    }

    console.log(`[Domainsduck] Bulk checking ${domains.length} domains (using individual calls)`);

    // Domainsduck에 Bulk API가 없으므로 개별 호출
    // 하지만 병렬로 처리하여 성능 향상
    const results = await Promise.all(
      domains.map(async (domain) => {
        try {
          const available = await checkDomain(domain);
          return { domain, available };
        } catch (error) {
          console.error(`[Domainsduck] Error checking ${domain}:`, error);
          return { domain, available: false };
        }
      })
    );

    const resultsMap = new Map<string, boolean>();
    results.forEach(({ domain, available }) => {
      resultsMap.set(domain, available);
    });

    console.log(`[Domainsduck] Bulk check completed: ${resultsMap.size} results`);
    
    return resultsMap;

  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('[Domainsduck] Bulk check timeout');
        throw new Error('Bulk domain check timeout');
      }
      console.error('[Domainsduck] Bulk check error:', error.message);
      throw error;
    }
    throw new Error('Unknown error during bulk domain check');
  }
}

/**
 * 도메인 가용성 체크 (상세 정보 포함)
 * 
 * @param domain - 체크할 도메인
 * @returns DomainCheckResult 객체
 * 
 * @example
 * ```typescript
 * const result = await checkDomainAvailability('example.com');
 * console.log(result.domain);      // "example.com"
 * console.log(result.available);   // true/false
 * console.log(result.status);      // "available" / "registered"
 * console.log(result.checkedAt);   // Date 객체
 * ```
 */
export async function checkDomainAvailability(domain: string): Promise<DomainCheckResult> {
  try {
    const available = await checkDomain(domain);
    
    return {
      domain,
      available,
      status: available ? 'available' : 'registered',
      checkedAt: new Date(),
    };
  } catch (error) {
    console.error(`[Domainsduck] Error in checkDomainAvailability for ${domain}:`, error);
    
    return {
      domain,
      available: false,
      status: 'registered',
      checkedAt: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 여러 도메인의 가용성 체크 (상세 정보 포함)
 * 
 * @param domains - 체크할 도메인 배열
 * @returns DomainCheckResult 배열
 * 
 * @example
 * ```typescript
 * const results = await checkDomainsAvailability(['example.com', 'test.com']);
 * results.forEach(result => {
 *   console.log(`${result.domain}: ${result.status}`);
 * });
 * ```
 */
export async function checkDomainsAvailability(
  domains: string[]
): Promise<DomainCheckResult[]> {
  try {
    const resultsMap = await checkDomainsBulk(domains);
    
    return domains.map(domain => ({
      domain,
      available: resultsMap.get(domain) ?? false,
      status: (resultsMap.get(domain) ?? false) ? 'available' : 'registered',
      checkedAt: new Date(),
    }));
  } catch (error) {
    console.error('[Domainsduck] Error in checkDomainsAvailability:', error);
    
    // Fallback: 개별 체크
    console.log('[Domainsduck] Falling back to individual checks');
    
    const results = await Promise.all(
      domains.map(domain => checkDomainAvailability(domain))
    );
    
    return results;
  }
}

/**
 * Rate limiting 헬퍼 함수
 * 
 * 간단한 in-memory rate limiter
 * 프로덕션에서는 Redis 등을 사용하는 것이 좋습니다.
 */
class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    // 시간 윈도우 밖의 요청 제거
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    
    return false;
  }

  getNextAvailableTime(): Date {
    if (this.requests.length === 0) {
      return new Date();
    }
    
    const oldestRequest = Math.min(...this.requests);
    return new Date(oldestRequest + this.windowMs);
  }
}

// Rate limiter 인스턴스 (30 요청/시간)
export const rateLimiter = new RateLimiter(30, 60 * 60 * 1000);

/**
 * Rate limit을 고려한 도메인 체크
 * 
 * @param domain - 체크할 도메인
 * @returns DomainCheckResult 또는 null (rate limit 초과 시)
 */
export async function checkDomainWithRateLimit(
  domain: string
): Promise<DomainCheckResult | null> {
  if (!rateLimiter.canMakeRequest()) {
    const nextAvailable = rateLimiter.getNextAvailableTime();
    console.warn(
      `[Domainsduck] Rate limit exceeded. Next available: ${nextAvailable.toLocaleString()}`
    );
    return null;
  }

  return checkDomainAvailability(domain);
}
