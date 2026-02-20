import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { loginDev } from '@/services/api';

const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID;
const KAKAO_REDIRECT_URI = `${window.location.origin}/auth/kakao/callback`;
const isDev = import.meta.env.DEV;

export default function LandingPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDevLogin, setShowDevLogin] = useState(false);

  if (user) {
    navigate('/feed', { replace: true });
    return null;
  }

  const handleKakaoLogin = () => {
    if (!KAKAO_CLIENT_ID) {
      alert('VITE_KAKAO_CLIENT_ID가 설정되지 않았습니다');
      return;
    }

    const params = new URLSearchParams({
      client_id: KAKAO_CLIENT_ID,
      redirect_uri: KAKAO_REDIRECT_URI,
      response_type: 'code',
    });

    window.location.href = `https://kauth.kakao.com/oauth/authorize?${params}`;
  };

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

      {/* Login Buttons */}
      <div className="w-full max-w-sm space-y-3">
        {/* Kakao Login */}
        <button
          onClick={handleKakaoLogin}
          disabled={loading}
          className="w-full py-3 bg-[#FEE500] text-[#191919] rounded-xl font-semibold hover:bg-[#FADA0A] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M9 0.5C4.029 0.5 0 3.588 0 7.39C0 9.797 1.558 11.911 3.932 13.186L2.933 16.773C2.844 17.08 3.213 17.326 3.478 17.145L7.694 14.322C8.123 14.368 8.558 14.393 9 14.393C13.971 14.393 18 11.305 18 7.503C18 3.7 13.971 0.5 9 0.5Z"
              fill="#191919"
            />
          </svg>
          카카오 로그인
        </button>

        {!KAKAO_CLIENT_ID && (
          <p className="text-xs text-amber-600 text-center">
            VITE_KAKAO_CLIENT_ID가 설정되지 않았습니다
          </p>
        )}

        {/* Dev Login Toggle */}
        {isDev && (
          <>
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-slate-200" />
              <button
                onClick={() => setShowDevLogin(!showDevLogin)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                {showDevLogin ? '접기' : '개발용 로그인'}
              </button>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {showDevLogin && (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="닉네임 입력"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDevLogin()}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-center text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleDevLogin}
                  disabled={loading || !nickname.trim()}
                  className="w-full py-2.5 bg-slate-700 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  개발용 로그인
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
