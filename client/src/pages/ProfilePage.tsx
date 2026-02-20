import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getRanking } from '@/services/api';

const LEVEL_NAMES: Record<number, string> = {
  1: '새내기',
  2: '초보 클리커',
  3: '품앗이 견습생',
  4: '활발한 교환러',
  5: '품앗이 고수',
};

export default function ProfilePage() {
  const { user, logout } = useAuth();

  const { data: rankingData } = useQuery({
    queryKey: ['ranking'],
    queryFn: getRanking,
    staleTime: 1000 * 60 * 5,
  });

  if (!user) return null;

  const levelName = LEVEL_NAMES[user.level] ?? `Lv.${user.level}`;
  const ranking = rankingData?.ranking ?? [];
  const myRank = ranking.findIndex((r) => r.id === user.id) + 1;

  return (
    <div className="px-4 py-5">
      {/* Profile Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-2xl">
            👤
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user.nickname}</h2>
            <p className="text-sm text-indigo-600">{levelName}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-slate-900">{user.credits}</p>
            <p className="text-xs text-slate-500">크레딧</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-slate-900">{user.total_exchanges}</p>
            <p className="text-xs text-slate-500">총 교환</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-slate-900">
              {myRank > 0 ? `#${myRank}` : '-'}
            </p>
            <p className="text-xs text-slate-500">랭킹</p>
          </div>
        </div>
      </div>

      {/* Ranking */}
      <h3 className="text-lg font-bold text-slate-900 mb-3">교환 랭킹 TOP 10</h3>

      {ranking.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <p>아직 랭킹 데이터가 없어요</p>
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          {ranking.slice(0, 10).map((r, i) => (
            <div
              key={r.id}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                r.id === user.id ? 'bg-indigo-50 border border-indigo-200' : 'bg-white border border-slate-100'
              }`}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                  i < 3 ? 'bg-amber-400 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {i + 1}
              </span>
              <span className="flex-1 text-sm font-medium text-slate-800">{r.nickname}</span>
              <span className="text-sm text-slate-500">{r.total_exchanges}회</span>
            </div>
          ))}
        </div>
      )}

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
      >
        로그아웃
      </button>
    </div>
  );
}
