'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';

interface AddDomainFormProps {
  onSuccess?: () => void;
}

export default function AddDomainForm({ onSuccess }: AddDomainFormProps) {
  const [domain, setDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supabase = createClient();

  /**
   * 도메인 형식 검증
   * 예: example.com, sub.example.com
   */
  const validateDomain = (input: string): boolean => {
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return domainRegex.test(input);
  };

  /**
   * 도메인 정규화 (http://, https://, www. 제거)
   */
  const normalizeDomain = (input: string): string => {
    let normalized = input.trim().toLowerCase();
    
    // http://, https:// 제거
    normalized = normalized.replace(/^https?:\/\//, '');
    
    // www. 제거
    normalized = normalized.replace(/^www\./, '');
    
    // 마지막 슬래시 제거
    normalized = normalized.replace(/\/$/, '');
    
    return normalized;
  };

  /**
   * 중복 도메인 체크
   */
  const checkDuplicate = async (domainName: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('domains')
        .select('id')
        .eq('name', domainName)
        .maybeSingle();  // single() 대신 maybeSingle() 사용

      if (error) {
        console.error('[AddDomainForm] Duplicate check error:', error);
        throw new Error(`중복 확인 실패: ${error.message}`);
      }

      return !!data; // data가 있으면 중복
    } catch (err) {
      console.error('[AddDomainForm] Duplicate check exception:', err);
      throw new Error(err instanceof Error ? err.message : '중복 확인 중 알 수 없는 오류가 발생했습니다.');
    }
  };

  /**
   * 폼 제출 핸들러
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 초기화
    setError(null);
    setSuccess(null);

    // 빈 값 체크
    if (!domain.trim()) {
      setError('도메인을 입력해주세요.');
      return;
    }

    // 도메인 정규화
    const normalizedDomain = normalizeDomain(domain);

    // 도메인 형식 검증
    if (!validateDomain(normalizedDomain)) {
      setError('올바른 도메인 형식이 아닙니다. (예: example.com)');
      return;
    }

    setIsLoading(true);

    try {
      // 중복 체크
      const isDuplicate = await checkDuplicate(normalizedDomain);
      if (isDuplicate) {
        setError('이미 등록된 도메인입니다.');
        setIsLoading(false);
        return;
      }

      // Supabase에 도메인 저장
      const { error: insertError } = await supabase
        .from('domains')
        .insert({
          name: normalizedDomain,
          status: 'unknown',
          active: true,
        });

      if (insertError) {
        console.error('[AddDomainForm] Insert error:', insertError);
        
        // 구체적인 에러 메시지
        if (insertError.code === '23505') {
          throw new Error('이미 등록된 도메인입니다.');
        } else if (insertError.code === 'PGRST116') {
          throw new Error('데이터베이스 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
        } else {
          throw new Error(`도메인 저장 실패: ${insertError.message}`);
        }
      }

      // 성공
      setSuccess(`✅ ${normalizedDomain} 도메인이 추가되었습니다!`);
      setDomain('');
      
      // 성공 콜백
      if (onSuccess) {
        onSuccess();
      }

      // 3초 후 성공 메시지 제거
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('[AddDomainForm] Error adding domain:', err);
      
      // 사용자 친화적 에러 메시지
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError('도메인 추가 중 알 수 없는 오류가 발생했습니다. 네트워크 연결을 확인해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 제목 */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
            도메인 추가
          </h2>
          <p className="text-sm text-slate-400">
            모니터링할 도메인을 입력하세요. 등록 가능 여부를 확인합니다.
          </p>
        </div>

        {/* 입력 필드 */}
        <div>
          <label htmlFor="domain" className="block text-sm font-semibold text-white mb-2">
            도메인 이름
          </label>
          <div className="relative">
            <input
              type="text"
              id="domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              disabled={isLoading}
              className="w-full px-4 py-3.5 bg-slate-900/60 border-2 border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-600/30 transition-all duration-200 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-inner"
            />
            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/5 pointer-events-none"></div>
          </div>
          <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span className="text-slate-400">💡</span>
            http://, www. 는 자동으로 제거됩니다.
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="relative p-4 bg-red-500/10 border-l-4 border-red-500 rounded-xl backdrop-blur-sm shadow-lg">
            <div className="absolute inset-0 rounded-xl bg-red-500/5"></div>
            <p className="text-sm font-medium text-red-400 relative">❌ {error}</p>
          </div>
        )}

        {/* 성공 메시지 */}
        {success && (
          <div className="relative p-4 bg-emerald-500/10 border-l-4 border-emerald-500 rounded-xl backdrop-blur-sm shadow-lg">
            <div className="absolute inset-0 rounded-xl bg-emerald-500/5"></div>
            <p className="text-sm font-medium text-emerald-400 relative">{success}</p>
          </div>
        )}

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={isLoading}
          className="relative w-full px-6 py-3.5 bg-linear-to-br from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white font-bold rounded-xl border-2 border-slate-600/50 hover:border-slate-500 shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-black/30 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-slate-700 disabled:hover:to-slate-600 disabled:hover:scale-100 overflow-hidden group"
        >
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
          <span className="relative">
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                추가 중...
              </span>
            ) : (
              '도메인 추가'
            )}
          </span>
        </button>
      </form>

      {/* 안내 사항 */}
      <div className="relative mt-6 p-5 bg-slate-700/30 border border-slate-600/50 rounded-xl backdrop-blur-sm shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-slate-600/10 to-transparent"></div>
        <h3 className="text-sm font-bold text-white mb-3 relative flex items-center gap-2">
          <span className="text-base">📋</span>
          안내사항
        </h3>
        <ul className="text-xs text-slate-400 space-y-2 relative">
          <li className="flex items-start gap-2">
            <span className="text-slate-500 mt-0.5">•</span>
            <span>도메인은 하루 2회 (오전 9시, 오후 9시) 자동으로 확인됩니다.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-slate-500 mt-0.5">•</span>
            <span>도메인이 사용 가능해지면 이메일로 알림을 받습니다.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-slate-500 mt-0.5">•</span>
            <span>중복된 도메인은 추가할 수 없습니다.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
