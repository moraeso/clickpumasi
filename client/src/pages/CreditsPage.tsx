import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getCredits } from '@/services/api';

const TYPE_LABELS: Record<string, string> = {
  click: '클릭 보상',
  spend: '링크 노출',
  bonus: '보너스',
  purchase: '구매',
};

const TYPE_COLORS: Record<string, string> = {
  click: 'text-emerald-600',
  spend: 'text-red-500',
  bonus: 'text-indigo-600',
  purchase: 'text-indigo-600',
};

export default function CreditsPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['credits', user?.id],
    queryFn: () => getCredits(user!.id),
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const credits = data?.credits ?? 0;
  const history = data?.history ?? [];

  return (
    <div className="px-4 py-5">
      {/* Balance Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white mb-6">
        <p className="text-indigo-200 text-sm mb-1">보유 크레딧</p>
        <p className="text-4xl font-extrabold">{credits}</p>
        <p className="text-indigo-200 text-xs mt-2">
          다른 사람의 링크를 클릭하면 크레딧을 획득합니다
        </p>
      </div>

      {/* History */}
      <h3 className="text-lg font-bold text-slate-900 mb-3">거래 내역</h3>

      {history.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <p>아직 거래 내역이 없어요</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between bg-white border border-slate-100 rounded-xl p-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {TYPE_LABELS[tx.type] ?? tx.type}
                </p>
                <p className="text-xs text-slate-400">
                  {new Date(tx.created_at).toLocaleString('ko-KR', {
                    timeZone: 'Asia/Seoul',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <span
                className={`text-lg font-bold ${
                  tx.amount > 0 ? 'text-emerald-600' : 'text-red-500'
                }`}
              >
                {tx.amount > 0 ? '+' : ''}{tx.amount}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
