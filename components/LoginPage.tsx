import React, { useState } from 'react';
import { Judge, UserRole } from '../types';
import { KeyRound, ShieldCheck, UserCircle2 } from 'lucide-react';

interface LoginPageProps {
  judges: Judge[];
  onLoginSuccess: (role: UserRole, id?: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ judges, onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'admin' | 'judge'>('judge');
  const [adminPassword, setAdminPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Hardcoded admin password for demo purposes
    if (adminPassword === 'admin@123') {
      onLoginSuccess(UserRole.ADMIN);
    } else {
      setError('Mật khẩu quản trị không đúng (Mặc định: admin)');
    }
  };

  const handleJudgeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const judge = judges.find(j => j.accessCode === accessCode.trim());
    if (judge) {
      onLoginSuccess(UserRole.JUDGE, judge.id);
    } else {
      setError('Mã truy cập không hợp lệ. Vui lòng liên hệ BTC.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-t-4 border-orange-500">
        {/* Header */}
        <div className="bg-orange-600 p-8 text-center">
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">TTT-TI TÂN TIÊN 2026</h1>
          <p className="text-orange-100 text-sm">Hệ thống chấm điểm thi văn nghệ</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            className={`flex-1 py-4 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${activeTab === 'judge' ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => { setActiveTab('judge'); setError(''); setAccessCode(''); }}
          >
            <UserCircle2 size={18} /> Giám Khảo
          </button>
          <button
            className={`flex-1 py-4 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${activeTab === 'admin' ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => { setActiveTab('admin'); setError(''); setAdminPassword(''); }}
          >
            <ShieldCheck size={18} /> Ban Tổ Chức
          </button>
        </div>

        {/* Form */}
        <div className="p-8">
          {activeTab === 'judge' ? (
            <form onSubmit={handleJudgeLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Mã truy cập (Access Code)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 placeholder-slate-400 font-mono text-lg tracking-widest bg-white text-slate-900"
                    placeholder="Nhập mã..."
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">Nhập mã truy cập do Ban tổ chức cung cấp.</p>
              </div>
              
              {error && <div className="text-red-500 text-sm font-medium text-center bg-red-50 p-2 rounded">{error}</div>}

              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all active:scale-95"
              >
                Vào Chấm Thi
              </button>
            </form>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Mật khẩu quản trị</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ShieldCheck className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 placeholder-slate-400 bg-white text-slate-900"
                    placeholder="••••••"
                  />
                </div>
              </div>

              {error && <div className="text-red-500 text-sm font-medium text-center bg-red-50 p-2 rounded">{error}</div>}

              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all active:scale-95"
              >
                Đăng Nhập Admin
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;