import React, { useState } from 'react';
import { Lock } from 'lucide-react';

interface Props {
  onLogin: () => void;
}

export const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password === 'SSAT2026') {
      localStorage.setItem('apqp_authenticated', 'true');
      onLogin();
    } else {
      setError('비밀번호가 올바르지 않습니다');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-slate-700/50">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-4 rounded-full">
              <Lock className="text-white" size={32} />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            개발(APQP)현황 관리
          </h1>
          <p className="text-slate-400 text-center mb-8 text-sm">
            Access Password Required
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="비밀번호를 입력하세요"
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm text-red-400 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              접속
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-slate-500 text-xs">
            IATF 16949 Compliant System
          </div>
        </div>
      </div>
    </div>
  );
};
