'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { Domain } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface DomainListProps {
  refreshTrigger?: number; // 외부에서 새로고침 트리거
}

export default function DomainList({ refreshTrigger }: DomainListProps) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const supabase = createClient();

  /**
   * 도메인 목록 가져오기
   */
  const fetchDomains = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('domains')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('[DomainList] Supabase error:', fetchError);
        
        // 구체적인 에러 메시지
        if (fetchError.code === 'PGRST116') {
          throw new Error('데이터베이스 연결에 실패했습니다. 네트워크 연결을 확인해주세요.');
        } else if (fetchError.code === '42P01') {
          throw new Error('데이터베이스 테이블을 찾을 수 없습니다. 관리자에게 문의하세요.');
        } else {
          throw new Error(`데이터 조회 실패: ${fetchError.message}`);
        }
      }

      setDomains(data || []);
    } catch (err) {
      console.error('[DomainList] Error fetching domains:', err);
      
      // 사용자 친화적 에러 메시지
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError('도메인 목록을 불러오는 중 알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 도메인 삭제
   */
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 도메인을 삭제하시겠습니까?`)) {
      return;
    }

    setDeletingId(id);

    try {
      const { error: deleteError } = await supabase
        .from('domains')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('[DomainList] Delete error:', deleteError);
        
        // 구체적인 에러 메시지
        if (deleteError.code === 'PGRST116') {
          throw new Error('데이터베이스 연결에 실패했습니다.');
        } else {
          throw new Error(`삭제 실패: ${deleteError.message}`);
        }
      }

      // 목록에서 제거
      setDomains((prev) => prev.filter((domain) => domain.id !== id));
    } catch (err) {
      console.error('[DomainList] Error deleting domain:', err);
      
      // 사용자 친화적 에러 메시지
      const errorMessage = err instanceof Error 
        ? err.message 
        : '도메인 삭제 중 알 수 없는 오류가 발생했습니다.';
      
      alert(`❌ ${errorMessage}\n\n잠시 후 다시 시도해주세요.`);
    } finally {
      setDeletingId(null);
    }
  };

  /**
   * 도메인 활성화/비활성화 토글
   */
  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('domains')
        .update({ active: !currentActive })
        .eq('id', id);

      if (updateError) {
        console.error('[DomainList] Toggle active error:', updateError);
        
        // 구체적인 에러 메시지
        if (updateError.code === 'PGRST116') {
          throw new Error('데이터베이스 연결에 실패했습니다.');
        } else {
          throw new Error(`상태 변경 실패: ${updateError.message}`);
        }
      }

      // 목록 업데이트
      setDomains((prev) =>
        prev.map((domain) =>
          domain.id === id ? { ...domain, active: !currentActive } : domain
        )
      );
    } catch (err) {
      console.error('[DomainList] Error toggling domain active status:', err);
      
      // 사용자 친화적 에러 메시지
      const errorMessage = err instanceof Error 
        ? err.message 
        : '도메인 상태 변경 중 알 수 없는 오류가 발생했습니다.';
      
      alert(`❌ ${errorMessage}\n\n잠시 후 다시 시도해주세요.`);
    }
  };

  /**
   * 상태별 배지 스타일
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
            ✅ 사용 가능
          </span>
        );
      case 'registered':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
            ❌ 등록됨
          </span>
        );
      case 'unknown':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-600/20 text-gray-400 border border-gray-600/30">
            ❓ 확인 중
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
            {status}
          </span>
        );
    }
  };

  /**
   * 시간 포맷팅
   */
  const formatLastChecked = (lastChecked: string | null) => {
    if (!lastChecked) return '아직 확인 안 됨';
    
    try {
      return formatDistanceToNow(new Date(lastChecked), {
        addSuffix: true,
        locale: ko,
      });
    } catch {
      return '날짜 오류';
    }
  };

  /**
   * 초기 로딩 & Realtime 구독
   */
  useEffect(() => {
    fetchDomains();

    // Supabase Realtime 구독
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
          console.log('Realtime update:', payload);

          if (payload.eventType === 'INSERT') {
            setDomains((prev) => [payload.new as Domain, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setDomains((prev) =>
              prev.map((domain) =>
                domain.id === payload.new.id ? (payload.new as Domain) : domain
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setDomains((prev) =>
              prev.filter((domain) => domain.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * 외부 트리거로 새로고침
   */
  useEffect(() => {
    if (refreshTrigger) {
      fetchDomains();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-slate-700/50 border border-slate-600/30 rounded-xl backdrop-blur-sm"></div>
          <div className="h-24 bg-slate-700/50 border border-slate-600/30 rounded-xl backdrop-blur-sm"></div>
          <div className="h-24 bg-slate-700/50 border border-slate-600/30 rounded-xl backdrop-blur-sm"></div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="p-6 bg-red-500/10 border-2 border-red-500/30 rounded-xl backdrop-blur-sm shadow-lg">
          <p className="text-sm font-medium text-red-400">❌ {error}</p>
          <button
            onClick={() => fetchDomains()}
            className="mt-4 px-5 py-2.5 bg-red-500/20 border border-red-500/30 text-red-400 font-semibold rounded-xl hover:bg-red-500/30 shadow-lg hover:shadow-xl transition-all"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 빈 목록
  if (domains.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="p-12 text-center bg-slate-800/30 border-2 border-dashed border-slate-600/50 rounded-xl backdrop-blur-sm">
          <svg
            className="mx-auto h-14 w-14 text-slate-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-bold text-white">
            등록된 도메인이 없습니다
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            위 폼에서 모니터링할 도메인을 추가해보세요.
          </p>
        </div>
      </div>
    );
  }

  // 도메인 목록 표시
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white tracking-tight">
          모니터링 중인 도메인 <span className="text-slate-400">({domains.length})</span>
        </h2>
        <button
          onClick={() => fetchDomains()}
          className="px-4 py-2 text-sm font-semibold text-slate-300 bg-slate-700/50 border border-slate-600/50 rounded-xl hover:bg-slate-700 hover:border-slate-500 hover:text-white shadow-lg hover:shadow-xl transition-all backdrop-blur-sm"
        >
          🔄 새로고침
        </button>
      </div>

      <div className="space-y-4">
        {domains.map((domain) => (
          <div
            key={domain.id}
            className={`group relative p-6 bg-slate-800/50 border border-slate-700/60 rounded-2xl backdrop-blur-sm hover:border-slate-600/70 hover:shadow-xl hover:shadow-black/10 transition-all duration-300 ${
              !domain.active ? 'opacity-60' : ''
            }`}
          >
            <div className="absolute inset-0 bg-linear-to-br from-slate-700/10 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity pointer-events-none"></div>
            <div className="flex items-start justify-between relative">
              {/* 왼쪽: 도메인 정보 */}
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-lg font-bold text-white">
                    {domain.name}
                  </h3>
                  {getStatusBadge(domain.status)}
                  {!domain.active && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                      ⏸️ 비활성
                    </span>
                  )}
                </div>
                
                <div className="mt-3 flex items-center gap-4 text-sm text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="text-slate-500">🕒</span>
                    마지막 확인: {formatLastChecked(domain.last_checked)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-slate-500">📅</span>
                    추가일: {new Date(domain.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>

              {/* 오른쪽: 액션 버튼 */}
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleToggleActive(domain.id, domain.active)}
                  className={`px-3.5 py-2 text-sm font-semibold rounded-xl border transition-all shadow-lg hover:shadow-xl ${
                    domain.active
                      ? 'bg-slate-700/50 text-slate-300 border-slate-600/50 hover:bg-slate-700 hover:border-slate-500'
                      : 'bg-slate-600/50 text-slate-300 border-slate-500/50 hover:bg-slate-600 hover:border-slate-400'
                  }`}
                  title={domain.active ? '모니터링 중지' : '모니터링 시작'}
                >
                  {domain.active ? '⏸️ 중지' : '▶️ 시작'}
                </button>
                
                <button
                  onClick={() => handleDelete(domain.id, domain.name)}
                  disabled={deletingId === domain.id}
                  className="px-3.5 py-2 text-sm font-semibold bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/30 hover:border-red-500/40 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="도메인 삭제"
                >
                  {deletingId === domain.id ? '삭제 중...' : '🗑️ 삭제'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 안내 메시지 */}
      <div className="relative mt-6 p-5 bg-slate-700/30 border border-slate-600/50 rounded-xl backdrop-blur-sm shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-slate-600/10 to-transparent"></div>
        <p className="text-xs text-slate-400 relative flex items-start gap-2">
          <span className="text-slate-500 mt-0.5">💡</span>
          <span>도메인은 매일 오전 9시, 오후 9시에 자동으로 확인됩니다. 실시간 업데이트가 활성화되어 있어 변경사항이 자동으로 반영됩니다.</span>
        </p>
      </div>
    </div>
  );
}
