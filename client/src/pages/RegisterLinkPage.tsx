import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { createLink, getApps } from '@/services/api';

export default function RegisterLinkPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [appName, setAppName] = useState('');
  const [customAppName, setCustomAppName] = useState('');
  const [url, setUrl] = useState('');
  const [rewardInfo, setRewardInfo] = useState('');
  const [description, setDescription] = useState('');

  const { data: appsData } = useQuery({
    queryKey: ['apps'],
    queryFn: getApps,
  });

  const mutation = useMutation({
    mutationFn: () =>
      createLink({
        userId: user!.id,
        appName: appName === '__custom' ? customAppName : appName,
        url,
        rewardInfo: rewardInfo || undefined,
        description: description || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myLinks'] });
      navigate('/my-links');
    },
  });

  const selectedApp = appName === '__custom' ? customAppName : appName;
  const canSubmit = selectedApp && url.startsWith('http');

  return (
    <div className="px-4 py-5">
      <h2 className="text-xl font-bold text-slate-900 mb-5">새 링크 등록</h2>

      <div className="space-y-5">
        {/* App Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">앱 선택</label>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {(appsData?.apps ?? []).map((app) => (
              <button
                key={app.id}
                onClick={() => setAppName(app.name)}
                className={`py-2 px-3 rounded-xl text-sm border transition-colors ${
                  appName === app.name
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                }`}
              >
                {app.name}
              </button>
            ))}
            <button
              onClick={() => setAppName('__custom')}
              className={`py-2 px-3 rounded-xl text-sm border transition-colors ${
                appName === '__custom'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
              }`}
            >
              직접 입력
            </button>
          </div>
          {appName === '__custom' && (
            <input
              type="text"
              placeholder="앱 이름 입력"
              value={customAppName}
              onChange={(e) => setCustomAppName(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          )}
        </div>

        {/* URL */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">추천 링크</label>
          <input
            type="url"
            placeholder="https://toss.im/invite/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Reward Info */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            보상 정보 <span className="text-slate-400 font-normal">(선택)</span>
          </label>
          <input
            type="text"
            placeholder='예: "쌍방 1,000원"'
            value={rewardInfo}
            onChange={(e) => setRewardInfo(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            설명 <span className="text-slate-400 font-normal">(선택)</span>
          </label>
          <textarea
            placeholder="이벤트 참여 방법이나 주의사항 등"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* Submit */}
        <button
          onClick={() => mutation.mutate()}
          disabled={!canSubmit || mutation.isPending}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {mutation.isPending ? '등록 중...' : '링크 등록'}
        </button>

        {mutation.isError && (
          <p className="text-red-500 text-sm text-center">
            {(mutation.error as Error).message}
          </p>
        )}

        <p className="text-xs text-slate-400 text-center">
          등록 후 크레딧을 투입해야 다른 사람에게 노출됩니다
        </p>
      </div>
    </div>
  );
}
