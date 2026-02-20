import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getMyLinks, updateLink, spendCredits } from '@/services/api';
import type { ReferralLink } from '@/services/api';

export default function MyLinksPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['myLinks', user?.id],
    queryFn: () => getMyLinks(user!.id),
    enabled: !!user,
  });

  const toggleMutation = useMutation({
    mutationFn: (link: ReferralLink) =>
      updateLink(link.id, { is_active: !link.is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myLinks'] });
    },
  });

  const boostMutation = useMutation({
    mutationFn: ({ linkId, amount }: { linkId: string; amount: number }) =>
      spendCredits(user!.id, linkId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myLinks'] });
      queryClient.invalidateQueries({ queryKey: ['credits'] });
    },
  });

  const handleBoost = (linkId: string) => {
    const amount = Number(prompt('투입할 크레딧 수:', '1'));
    if (!amount || amount < 1) return;
    if (amount > (user?.credits ?? 0)) {
      alert('크레딧이 부족합니다');
      return;
    }
    boostMutation.mutate({ linkId, amount });
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
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900">내 링크</h2>
          <p className="text-sm text-slate-500">{links.length}개 등록됨</p>
        </div>
        <Link
          to="/register"
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
        >
          + 새 링크
        </Link>
      </div>

      {links.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-4xl mb-3">🔗</p>
          <p>등록한 링크가 없어요</p>
          <Link to="/register" className="text-indigo-600 text-sm mt-2 inline-block">
            첫 링크 등록하기
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link) => (
            <div
              key={link.id}
              className={`border rounded-2xl p-4 ${
                link.is_active ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {link.app_name}
                </span>
                <button
                  onClick={() => toggleMutation.mutate(link)}
                  className={`text-xs px-2 py-1 rounded-lg ${
                    link.is_active
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {link.is_active ? '활성' : '비활성'}
                </button>
              </div>

              {link.reward_info && (
                <p className="text-slate-900 font-semibold text-sm mb-2">{link.reward_info}</p>
              )}

              <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                <span>클릭 {link.click_count}회</span>
                <span>남은 크레딧 {link.credits_remaining}</span>
              </div>

              <button
                onClick={() => handleBoost(link.id)}
                disabled={!link.is_active}
                className="w-full py-2 bg-amber-50 text-amber-700 rounded-xl text-sm font-semibold hover:bg-amber-100 disabled:opacity-50 transition-colors"
              >
                💰 크레딧 투입하기
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
