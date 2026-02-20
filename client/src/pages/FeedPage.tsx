import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getFeed, confirmClick } from '@/services/api';
import type { ReferralLink } from '@/services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function FeedPage() {
  const { user } = useAuth();
  const [clickingId, setClickingId] = useState<string | null>(null);
  const [clickTimers, setClickTimers] = useState<Record<string, number>>({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['feed', user?.id],
    queryFn: () => getFeed(user!.id),
    enabled: !!user,
    staleTime: 0,
  });

  const handleClick = async (link: ReferralLink) => {
    if (!user) return;

    // 클릭 시작 시간 기록
    const startTime = Date.now();
    setClickingId(link.id);
    setClickTimers((prev) => ({ ...prev, [link.id]: startTime }));

    // 새 탭에서 리다이렉트 URL 열기
    window.open(`${API_URL}/go/${link.short_code}?userId=${user.id}`, '_blank');
  };

  const handleConfirm = async (link: ReferralLink) => {
    if (!user) return;

    const startTime = clickTimers[link.id];
    if (!startTime) return;

    const stayDuration = Math.floor((Date.now() - startTime) / 1000);

    try {
      // click_log id는 서버에서 가져와야 하지만 MVP에서는 간소화
      // 실제로는 /go/:shortCode 응답에서 clickLogId를 받아야 함
      await confirmClick(user.id, link.id, stayDuration);
      alert(`크레딧 1개 획득! (체류 ${stayDuration}초)`);
      setClickingId(null);
      refetch();
    } catch (err: any) {
      alert(err.message || '확인 실패');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const links = data?.links ?? [];

  return (
    <div className="px-4 py-5">
      <h2 className="text-xl font-bold text-slate-900 mb-1">추천 링크 피드</h2>
      <p className="text-sm text-slate-500 mb-5">링크를 클릭하고 크레딧을 받으세요</p>

      {links.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-4xl mb-3">📭</p>
          <p>아직 클릭할 링크가 없어요</p>
          <p className="text-xs mt-1">다른 사람이 링크를 등록하면 여기에 표시됩니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              isClicking={clickingId === link.id}
              onOpenLink={() => handleClick(link)}
              onConfirm={() => handleConfirm(link)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LinkCard({
  link,
  isClicking,
  onOpenLink,
  onConfirm,
}: {
  link: ReferralLink;
  isClicking: boolean;
  onOpenLink: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium px-2.5 py-0.5 rounded-full">
          {link.app_name}
        </span>
        <span className="text-xs text-slate-400">
          {link.users?.nickname ?? '익명'}
        </span>
      </div>

      {/* Reward */}
      {link.reward_info && (
        <p className="text-slate-900 font-semibold mb-1">{link.reward_info}</p>
      )}

      {/* Description */}
      {link.description && (
        <p className="text-sm text-slate-500 mb-3">{link.description}</p>
      )}

      {/* Action */}
      {!isClicking ? (
        <button
          onClick={onOpenLink}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
        >
          링크 열기 (+1 크레딧)
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-amber-600 text-center">
            링크를 열고 30초 이상 머물러주세요
          </p>
          <button
            onClick={onConfirm}
            className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
          >
            돌아왔어요! 크레딧 받기
          </button>
        </div>
      )}
    </div>
  );
}
