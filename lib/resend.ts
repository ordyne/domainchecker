// Resend email client configuration
import { Resend } from 'resend';

/**
 * Resend 설정 검증
 */
function validateResendConfig(): { apiKey: string; fromEmail: string; notificationEmail: string } {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const notificationEmail = process.env.NOTIFICATION_EMAIL;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }
  if (!fromEmail) {
    throw new Error('RESEND_FROM_EMAIL environment variable is not set');
  }
  if (!notificationEmail) {
    throw new Error('NOTIFICATION_EMAIL environment variable is not set');
  }

  return { apiKey, fromEmail, notificationEmail };
}

// Resend 클라이언트 초기화 (lazy)
let resendInstance: Resend | null = null;

function getResendClient(): Resend {
  if (!resendInstance) {
    const { apiKey } = validateResendConfig();
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

export const resend = getResendClient();

/**
 * 사용 가능한 도메인 목록을 이메일로 발송
 * 
 * @param domains - 사용 가능한 도메인 배열
 * @returns Promise<{ success: boolean; emailId?: string; error?: string }>
 * 
 * @example
 * ```typescript
 * const result = await sendAvailableDomainsEmail(['example.com', 'test.com']);
 * if (result.success) {
 *   console.log('Email sent:', result.emailId);
 * }
 * ```
 */
export async function sendAvailableDomainsEmail(
  domains: string[]
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  // 사용 가능한 도메인이 없으면 이메일을 보내지 않음
  if (domains.length === 0) {
    console.log('[Resend] No available domains, skipping email');
    return { success: true };
  }

  const { fromEmail, notificationEmail } = validateResendConfig();
  const client = getResendClient();

  const subject = domains.length === 1
    ? `✅ ${domains[0]} 사용 가능`
    : `✅ ${domains.length}개 도메인 사용 가능`;
  
  const html = generateAvailableDomainsEmailHTML(domains);

  try {
    console.log(`[Resend] Sending email for ${domains.length} available domain(s)`);
    
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: notificationEmail,
      subject,
      html,
    });

    if (error) {
      console.error('[Resend] Email send failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log(`[Resend] ✉️  Email sent successfully:`, data?.id);
    return {
      success: true,
      emailId: data?.id,
    };
  } catch (error) {
    console.error('[Resend] Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 사용 가능한 도메인 이메일 HTML 생성 (심플 버전)
 */
function generateAvailableDomainsEmailHTML(domains: string[]): string {
  const domainList = domains
    .map(domain => `
      <li style="margin: 8px 0; padding: 12px 16px; background: #f3f4f6; border-radius: 6px; font-size: 15px; color: #1f2937;">
        ${domain}
      </li>
    `)
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="ko">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          
          <!-- Header -->
          <div style="background: #4f46e5; color: white; padding: 30px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 600;">
              ${domains.length === 1 ? '✅ 도메인 사용 가능' : `✅ ${domains.length}개 도메인 사용 가능`}
            </h1>
          </div>
          
          <!-- Content -->
          <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            
            <!-- Domain List -->
            <ul style="list-style: none; padding: 0; margin: 0 0 20px 0;">
              ${domainList}
            </ul>
            
            <!-- Timestamp -->
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">
              ${new Date().toLocaleString('ko-KR', { 
                timeZone: 'Asia/Seoul',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; margin-top: 20px; padding: 15px;">
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
              Domain Checker - 자동 알림
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * 테스트 이메일 발송
 * 
 * @example
 * ```typescript
 * await sendTestEmail();
 * ```
 */
export async function sendTestEmail(): Promise<void> {
  const { fromEmail, notificationEmail } = validateResendConfig();
  const client = getResendClient();

  try {
    console.log('[Resend] Sending test email...');
    
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: notificationEmail,
      subject: '✅ Domain Checker - 테스트 이메일',
      html: `
        <!DOCTYPE html>
        <html lang="ko">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: #4f46e5; color: white; padding: 30px; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 22px; font-weight: 600;">✅ 테스트 이메일</h1>
              </div>
              <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                <p style="margin: 0 0 15px 0; font-size: 15px; color: #374151;">
                  이메일 설정이 올바르게 작동하고 있습니다!
                </p>
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">
                  ${new Date().toLocaleString('ko-KR', { 
                    timeZone: 'Asia/Seoul',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
              <div style="text-align: center; margin-top: 20px; padding: 15px;">
                <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                  Domain Checker - 자동 알림
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('[Resend] Test email failed:', error);
      throw new Error(`Failed to send test email: ${error.message}`);
    }

    console.log('[Resend] ✉️  Test email sent successfully:', data?.id);
  } catch (error) {
    console.error('[Resend] Error sending test email:', error);
    throw error;
  }
}
