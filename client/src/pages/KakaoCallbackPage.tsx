import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { loginWithKakaoCode } from '@/services/api';

const KAKAO_REDIRECT_URI = `${window.location.origin}/auth/kakao/callback`;

export default function KakaoCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      alert('카카오 로그인이 취소되었습니다');
      navigate('/', { replace: true });
      return;
    }

    if (!code) {
      navigate('/', { replace: true });
      return;
    }

    // 같은 code로 중복 호출 방지
    const key = `kakao_code_${code}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');

    loginWithKakaoCode(code, KAKAO_REDIRECT_URI)
      .then(({ user }) => {
        setUser(user);
        navigate('/feed', { replace: true });
      })
      .catch((err) => {
        sessionStorage.removeItem(key);
        console.error('Login failed:', err);
        alert('로그인 실패: ' + err.message);
        navigate('/', { replace: true });
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-4" />
      <p className="text-slate-500">로그인 처리 중...</p>
    </div>
  );
}
