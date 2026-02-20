import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { loginDev } from '@/services/api';

export default function LandingPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  // 이미 로그인되어 있으면 피드로
  if (user) {
    navigate('/feed', { replace: true });
    return null;
  }

  const handleDevLogin = async () => {
    if (!nickname.trim()) return;
    setLoading(true);
    try {
      const { user } = await loginDev(nickname.trim());
      setUser(user);
      navigate('/feed');
    } catch (err) {
      alert('로그인 실패');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-3">
          클릭<span className="text-indigo-600">품앗이</span>
        </h1>
        <p className="text-slate-500 text-lg">
          추천 링크를 주고, 클릭을 받자
        </p>
      </div>

      {/* How it works */}
      <div className="w-full max-w-sm space-y-3 mb-10">
        {[
          { step: '1', text: '다른 사람의 추천 링크를 클릭' },
          { step: '2', text: '크레딧 획득' },
          { step: '3', text: '내 링크에 크레딧 사용' },
          { step: '4', text: '다른 사람이 내 링크를 클릭!' },
        ].map(({ step, text }) => (
          <div key={step} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
            <span className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
              {step}
            </span>
            <span className="text-slate-700">{text}</span>
          </div>
        ))}
      </div>

      {/* Dev Login */}
      <div className="w-full max-w-sm space-y-3">
        <input
          type="text"
          placeholder="닉네임 입력"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleDevLogin()}
          className="w-full px-4 py-3 border border-slate-300 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={handleDevLogin}
          disabled={loading || !nickname.trim()}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? '로그인 중...' : '시작하기'}
        </button>
        <p className="text-xs text-slate-400 text-center">
          개발용 간편 로그인 (MVP)
        </p>
      </div>
    </div>
  );
}
