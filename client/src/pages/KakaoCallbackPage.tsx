import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { loginWithKakaoCode } from '@/services/api';

const KAKAO_REDIRECT_URI = `${window.location.origin}/auth/kakao/callback`;

export default function KakaoCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('Kakao auth error:', error, searchParams.get('error_description'));
      alert('카카오 로그인이 취소되었습니다');
      navigate('/', { replace: true });
      return;
    }

    if (!code) {
      navigate('/', { replace: true });
      return;
    }

    loginWithKakaoCode(code, KAKAO_REDIRECT_URI)
      .then(({ user }) => {
        setUser(user);
        navigate('/feed', { replace: true });
      })
      .catch((err) => {
        console.error('Login failed:', err);
        alert('로그인 실패: ' + err.message);
        navigate('/', { replace: true });
      });
  }, [searchParams, navigate, setUser]);

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-4" />
      <p className="text-slate-500">로그인 처리 중...</p>
    </div>
  );
}
