import React, { useState } from 'react';
import { signIn, signUp } from '../services/supabaseClient';
import { User } from '@supabase/supabase-js';

interface Props {
  onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      if (isSignUpMode) {
        // 회원가입
        if (password.length < 6) {
          setError('비밀번호는 6자 이상이어야 합니다.');
          setIsLoading(false);
          return;
        }

        const result = await signUp(email, password);
        if (result.success) {
          if (result.error) {
            setMessage(result.error);
          } else {
            setMessage('회원가입이 완료되었습니다. 로그인해주세요.');
          }
          setIsSignUpMode(false);
          setPassword('');
        } else {
          setError(result.error || '회원가입 실패');
        }
      } else {
        // 로그인
        const result = await signIn(email, password);
        if (result.success && result.user) {
          onLogin(result.user);
        } else {
          setError(result.error || '로그인 실패');
          setPassword('');
        }
      }
    } catch (err) {
      setError('오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-slate-700/50">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              신성오토텍
            </h1>
            <p className="text-indigo-400 text-lg font-semibold">
              개발 대시보드
            </p>
          </div>

          {/* Messages */}
          {message && (
            <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-400 text-sm text-center">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
              ⚠️ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="이메일"
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="비밀번호"
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  처리 중...
                </span>
              ) : (
                isSignUpMode ? '계정 등록' : '시스템 접속'
              )}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUpMode(!isSignUpMode);
                setError('');
                setMessage('');
              }}
              className="text-slate-400 hover:text-white transition-colors text-sm"
              disabled={isLoading}
            >
              {isSignUpMode ? '← 로그인으로 돌아가기' : '계정 등록 →'}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-slate-500 text-xs">
            🔒 Supabase Auth 보안 인증
          </div>
        </div>
      </div>
    </div>
  );
};
