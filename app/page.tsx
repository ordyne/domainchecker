"use client";

import { useState } from "react";
import AddDomainForm from "@/components/AddDomainForm";
import DomainList from "@/components/DomainList";

export default function Home() {
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	const handleDomainAdded = () => {
		// 도메인 추가 성공 시 리스트 새로고침
		setRefreshTrigger((prev) => prev + 1);
	};

	return (
		<div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
			{/* 헤더 */}
			<header className="bg-slate-800/80 backdrop-blur-xl border-b border-slate-700/60 sticky top-0 z-50 shadow-xl shadow-black/10">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-4xl font-bold text-white tracking-tight">
								🌐 Domain Checker
							</h1>
							<p className="mt-2 text-sm text-slate-400 font-medium">
								도메인 등록 가능 여부를 자동으로 모니터링하고
								알림을 받으세요
							</p>
						</div>

						{/* 상태 표시 */}
						<div className="hidden md:flex items-center gap-3 px-5 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-full backdrop-blur-sm shadow-lg shadow-black/5">
							<div className="relative">
								<div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></div>
								<div className="absolute inset-0 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping opacity-75"></div>
							</div>
							<span className="text-sm font-semibold text-slate-200">
								모니터링 활성화
							</span>
						</div>
					</div>
				</div>
			</header>

			{/* 메인 콘텐츠 */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<div className="space-y-8">
					{/* 사용 방법 안내 */}
					<section className="relative bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/60 p-6 sm:p-8 overflow-hidden shadow-xl shadow-black/10">
						<div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-slate-600 via-slate-500 to-slate-600"></div>
						<h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
							<span className="text-xl">📚</span>
							사용 방법
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
							<div className="flex items-start gap-3 group">
								<div className="shrink-0 w-8 h-8 bg-linear-to-br from-slate-700 to-slate-600 border border-slate-600/50 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all">
									1
								</div>
								<div className="flex-1 min-w-0">
									<p className="font-semibold text-white text-sm mb-0.5">
										도메인 추가
									</p>
									<p className="text-xs text-slate-400 leading-relaxed">
										모니터링할 도메인 입력
									</p>
								</div>
							</div>

							<div className="flex items-start gap-3 group">
								<div className="shrink-0 w-8 h-8 bg-linear-to-br from-slate-700 to-slate-600 border border-slate-600/50 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all">
									2
								</div>
								<div className="flex-1 min-w-0">
									<p className="font-semibold text-white text-sm mb-0.5">
										자동 모니터링
									</p>
									<p className="text-xs text-slate-400 leading-relaxed">
										하루 2회 자동 확인
									</p>
								</div>
							</div>

							<div className="flex items-start gap-3 group">
								<div className="shrink-0 w-8 h-8 bg-linear-to-br from-slate-700 to-slate-600 border border-slate-600/50 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all">
									3
								</div>
								<div className="flex-1 min-w-0">
									<p className="font-semibold text-white text-sm mb-0.5">
										알림 받기
									</p>
									<p className="text-xs text-slate-400 leading-relaxed">
										이메일로 즉시 알림
									</p>
								</div>
							</div>

							<div className="flex items-start gap-3 group">
								<div className="shrink-0 w-8 h-8 bg-linear-to-br from-slate-700 to-slate-600 border border-slate-600/50 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all">
									4
								</div>
								<div className="flex-1 min-w-0">
									<p className="font-semibold text-white text-sm mb-0.5">
										도메인 등록
									</p>
									<p className="text-xs text-slate-400 leading-relaxed">
										빠르게 등록 완료
									</p>
								</div>
							</div>
						</div>
					</section>
					{/* 도메인 추가 섹션 */}
					<section className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/60 p-8 sm:p-10 shadow-2xl shadow-black/20 hover:border-slate-600/60 hover:shadow-3xl hover:shadow-black/30 transition-all duration-300">
						<AddDomainForm onSuccess={handleDomainAdded} />
					</section>

					{/* 도메인 목록 섹션 */}
					<section className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/60 p-8 sm:p-10 shadow-2xl shadow-black/20 hover:border-slate-600/60 hover:shadow-3xl hover:shadow-black/30 transition-all duration-300">
						<DomainList refreshTrigger={refreshTrigger} />
					</section>
				</div>
			</main>

			{/* 푸터 */}
			<footer className="mt-20 bg-slate-800/40 backdrop-blur-xl border-t border-slate-700/60">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
					<div className="text-center">
						<p className="text-sm font-semibold text-slate-300">
							© 2025 Domain Checker. 모든 권리 보유.
						</p>
						<p className="mt-2 text-xs text-slate-500">
							Powered by{" "}
							<span className="font-semibold text-slate-400">
								Next.js
							</span>
							,{" "}
							<span className="font-semibold text-slate-400">
								Supabase
							</span>
							,{" "}
							<span className="font-semibold text-slate-400">
								Resend
							</span>
							, and{" "}
							<span className="font-semibold text-slate-400">
								Domainsduck API
							</span>
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}

