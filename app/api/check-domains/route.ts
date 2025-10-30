import { createServerSupabaseClient } from '@/lib/supabase/server';
import { checkDomainAvailability } from '@/lib/domainsduck';
import { resend } from '@/lib/resend';
import { NextResponse } from 'next/server';
import type { Domain } from '@/types/database';

/**
 * GitHub Actions CRON Job에서 호출하는 도메인 체크 API
 * 
 * 스케줄: 매일 오전 9시, 오후 9시 (KST)
 * 인증: Authorization Bearer 토큰 (CRON_SECRET)
 * 
 * @example
 * ```bash
 * curl -X GET \
 *   -H "Authorization: Bearer ${CRON_SECRET}" \
 *   https://your-app.vercel.app/api/check-domains
 * ```
 */
export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    // ============================================
    // 1. 필수 환경 변수 검증
    // ============================================
    const requiredEnvVars = {
      CRON_SECRET: process.env.CRON_SECRET,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      DOMAINSDUCK_API_KEY: process.env.DOMAINSDUCK_API_KEY,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
      NOTIFICATION_EMAIL: process.env.NOTIFICATION_EMAIL,
    };

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      console.error('[CRON] Missing required environment variables:', missingVars);
      return NextResponse.json(
        {
          success: false,
          error: 'Configuration error',
          message: `Missing required environment variables: ${missingVars.join(', ')}`,
          missingVars,
        },
        { status: 500 }
      );
    }

    console.log('[CRON] Environment variables validated');

    // ============================================
    // 2. CRON_SECRET 인증 검증
    // ============================================
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (!authHeader || authHeader !== expectedAuth) {
      console.error('[CRON] Unauthorized request attempt');
      return NextResponse.json(
        { 
          success: false,
          error: 'Unauthorized',
          message: 'Invalid or missing authorization token'
        },
        { status: 401 }
      );
    }

    console.log('[CRON] Authentication successful');

    // ============================================
    // 3. Supabase 클라이언트 생성
    // ============================================
    const supabase = await createServerSupabaseClient();

    // ============================================
    // 4. 활성화된 도메인 조회
    // ============================================
    const { data: domains, error: fetchError } = await supabase
      .from('domains')
      .select('*')
      .eq('active', true)
      .order('last_checked', { ascending: true }); // 오래된 것부터 체크

    if (fetchError) {
      console.error('[CRON] Error fetching domains:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database error',
          message: fetchError.message,
        },
        { status: 500 }
      );
    }

    if (!domains || domains.length === 0) {
      console.log('[CRON] No active domains to check');
      return NextResponse.json({
        success: true,
        message: 'No active domains to check',
        checked: 0,
        available: 0,
        domains: [],
        duration: Date.now() - startTime,
      });
    }

    console.log(`[CRON] Found ${domains.length} active domains to check`);

    // ============================================
    // 5. 각 도메인 체크 (Vercel 10초 제한 고려)
    // ============================================
    const results: Array<{
      domain: string;
      status: 'registered' | 'available';
      changed: boolean;
      previousStatus?: string;
      error?: string;
    }> = [];

    const availableDomains: Domain[] = [];
    const checkPromises = domains.map(async (domain) => {
      try {
        // 타임아웃 체크 (9초 이내로 제한)
        if (Date.now() - startTime > 9000) {
          console.warn(`[CRON] Timeout approaching, skipping ${domain.name}`);
          return;
        }

        // 도메인 가용성 체크
        const result = await checkDomainAvailability(domain.name);

        const newStatus = result.available ? 'available' : 'registered';
        const statusChanged = domain.status !== newStatus;

        // Supabase 업데이트
        const { error: updateError } = await supabase
          .from('domains')
          .update({
            status: newStatus,
            last_checked: new Date().toISOString(),
          })
          .eq('id', domain.id);

        if (updateError) {
          console.error(`[CRON] Error updating domain ${domain.name}:`, updateError);
        }

        // 결과 기록
        results.push({
          domain: domain.name,
          status: newStatus,
          changed: statusChanged,
          previousStatus: statusChanged ? domain.status : undefined,
        });

        // 사용 가능한 도메인 발견 시
        if (result.available) {
          availableDomains.push(domain);

          // 상태가 변경된 경우에만 이메일 발송
          if (statusChanged) {
            console.log(`[CRON] 🎉 Domain became available: ${domain.name}`);
            await sendAvailabilityNotification(domain, supabase);
          }
        }

        console.log(`[CRON] ✓ Checked ${domain.name}: ${newStatus}${statusChanged ? ' (changed)' : ''}`);
      } catch (error) {
        console.error(`[CRON] Error checking domain ${domain.name}:`, error);
        results.push({
          domain: domain.name,
          status: 'registered',
          changed: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // 모든 도메인 체크 완료 대기 (병렬 처리)
    await Promise.all(checkPromises);

    // ============================================
    // 6. 응답 반환
    // ============================================
    const duration = Date.now() - startTime;
    
    console.log(`[CRON] ✅ Check completed: ${results.length} domains in ${duration}ms`);
    console.log(`[CRON] Available: ${availableDomains.length} domains`);

    return NextResponse.json({
      success: true,
      checked: results.length,
      available: availableDomains.length,
      domains: results,
      duration,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[CRON] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * 도메인 사용 가능 알림 이메일 발송
 */
async function sendAvailabilityNotification(
  domain: Domain,
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
) {
  try {
    const notificationEmail = process.env.NOTIFICATION_EMAIL;
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (!notificationEmail || !fromEmail) {
      console.error('[CRON] Missing email configuration:', {
        hasNotificationEmail: !!notificationEmail,
        hasFromEmail: !!fromEmail,
      });
      return;
    }

    // 이메일 발송
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: notificationEmail,
      subject: `🎉 Domain Available: ${domain.name}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .domain { font-size: 24px; font-weight: bold; color: #667eea; margin: 20px 0; }
              .info { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
              .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">🎉 도메인 사용 가능!</h1>
              </div>
              <div class="content">
                <p>안녕하세요!</p>
                <p>모니터링 중이던 도메인을 이제 등록할 수 있습니다:</p>
                
                <div class="domain">${domain.name}</div>
                
                <div class="info">
                  <strong>상태:</strong> 사용 가능 ✅<br>
                  <strong>확인 시간:</strong> ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}<br>
                  <strong>모니터링 시작:</strong> ${new Date(domain.created_at).toLocaleDateString('ko-KR')}
                </div>
                
                <p>지금 바로 도메인을 등록하세요!</p>
                
                <a href="https://www.namecheap.com/domains/registration/results/?domain=${domain.name}" class="button">
                  도메인 등록하기
                </a>
                
                <div class="footer">
                  <p>Domain Checker - 자동 알림 시스템</p>
                  <p style="font-size: 12px; color: #9ca3af;">
                    이 이메일은 자동으로 발송되었습니다.
                  </p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (emailError) {
      console.error(`[CRON] Email send failed for ${domain.name}:`, emailError);
      
      // 알림 실패 기록
      await supabase.from('email_notifications').insert({
        domain_id: domain.id,
        status: 'failed',
        error_message: emailError.message,
      });

      return;
    }

    console.log(`[CRON] ✉️  Email sent for ${domain.name}:`, emailData?.id);

    // 알림 성공 기록
    await supabase.from('email_notifications').insert({
      domain_id: domain.id,
      status: 'sent',
    });

  } catch (error) {
    console.error(`[CRON] Error sending notification for ${domain.name}:`, error);
  }
}

/**
 * POST 메서드는 허용하지 않음
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET instead.' },
    { status: 405 }
  );
}

/**
 * 헬스체크용 (인증 불필요)
 * 
 * @example
 * ```bash
 * curl https://your-app.vercel.app/api/check-domains/health
 * ```
 */
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
