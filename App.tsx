import React, { useState, useEffect } from 'react';
import { Performance, Score, UserRole, Judge } from './types';
import AdminDashboard from './components/AdminDashboard';
import JudgeView from './components/JudgeView';
import LoginPage from './components/LoginPage';
import { LayoutDashboard, LogOut } from 'lucide-react';
import { databaseService } from './services/database';

const App: React.FC = () => {
  // --- Global State ---
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [activePerformanceId, setActivePerformanceId] = useState<string | null>(null);
  const [maxScore, setMaxScore] = useState<number>(10);
  const [loading, setLoading] = useState(true);

  // --- Auth State (Vẫn giữ local cho phiên đăng nhập) ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [currentJudgeId, setCurrentJudgeId] = useState<string | null>(null);

  // --- Data Subscription (Thay thế polling) ---
  useEffect(() => {
    // Auth Check
    const storedAuth = localStorage.getItem('artscore_auth');
    if (storedAuth) {
      const auth = JSON.parse(storedAuth);
      setIsAuthenticated(true);
      setCurrentUserRole(auth.role);
      setCurrentJudgeId(auth.judgeId || null);
    }

    // Subscribe to Data Service (Firebase or LocalStorage handled inside)
    // unsubscribe function returned by databaseService.subscribe handles cleanup
    const unsubscribe = databaseService.subscribe((data) => {
      setPerformances(data.performances);
      setScores(data.scores);
      setJudges(data.judges);
      setActivePerformanceId(data.activePerformanceId);
      setMaxScore(data.maxScore);
      setLoading(false);
    });

    return () => {
       // Cleanup listener
       if (typeof unsubscribe === 'function') unsubscribe(); 
    };
  }, []);

  // --- Auth Actions ---
  const handleLoginSuccess = (role: UserRole, id?: string) => {
    setIsAuthenticated(true);
    setCurrentUserRole(role);
    setCurrentJudgeId(id || null);
    
    localStorage.setItem('artscore_auth', JSON.stringify({
      role,
      judgeId: id
    }));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUserRole(null);
    setCurrentJudgeId(null);
    localStorage.removeItem('artscore_auth');
  };

  // --- Data Actions (Delegated to Service) ---
  const handleAddPerformance = (p: Performance) => databaseService.addPerformance(p);
  const handleUpdatePerformance = (p: Performance) => databaseService.updatePerformance(p);
  const handleDeletePerformance = (id: string) => databaseService.deletePerformance(id);
  
  const handleSetActivePerformance = (id: string | null) => databaseService.setActivePerformance(id);
  const handleMaxScoreChange = (score: number) => databaseService.setMaxScore(score);

  const handleSubmitScore = (newScore: Score) => databaseService.submitScore(newScore);

  const handleAddJudge = (name: string) => databaseService.addJudge(name);
  const handleUpdateJudge = (id: string, name: string) => databaseService.updateJudge(id, name);
  const handleDeleteJudge = (id: string) => databaseService.deleteJudge(id);

  // --- RENDER LOGIC ---

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Đang tải dữ liệu...</div>;
  }

  // 1. Not Authenticated
  if (!isAuthenticated) {
    return <LoginPage judges={judges} onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. Admin View
  if (currentUserRole === UserRole.ADMIN) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <header className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-50 flex justify-between items-center border-b border-orange-600">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-orange-600 rounded-lg">
                <LayoutDashboard size={20} className="text-white"/>
             </div>
             <div>
                <h1 className="font-bold text-lg leading-none">TTT-TI TÂN TIÊN 2026</h1>
                <span className="text-xs text-slate-400">Quản lý cuộc thi</span>
             </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-700"
          >
            <LogOut size={16} /> Đăng xuất
          </button>
        </header>
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <AdminDashboard 
            performances={performances}
            scores={scores}
            judges={judges}
            activePerformanceId={activePerformanceId}
            maxScore={maxScore}
            onAddPerformance={handleAddPerformance}
            onUpdatePerformance={handleUpdatePerformance}
            onDeletePerformance={handleDeletePerformance}
            onSetActivePerformance={handleSetActivePerformance}
            onAddJudge={handleAddJudge}
            onUpdateJudge={handleUpdateJudge}
            onDeleteJudge={handleDeleteJudge}
            onMaxScoreChange={handleMaxScoreChange}
          />
        </div>
      </div>
    );
  }

  // 3. Judge View
  const activePerformance = performances.find(p => p.id === activePerformanceId) || null;
  const currentJudgeName = judges.find(j => j.id === currentJudgeId)?.name || 'Giám khảo';

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-40 border-t-4 border-t-orange-500">
        <div>
           <div className="flex items-center gap-2">
             <h1 className="font-bold text-xl text-slate-800 tracking-tight">TTT-TI TÂN TIÊN 2026</h1>
             <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
             </span>
           </div>
           <p className="text-xs text-slate-500 font-medium">Xin chào, <span className="text-orange-600">{currentJudgeName}</span></p>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
          title="Đăng xuất"
        >
          <LogOut size={20} />
        </button>
      </header>
      
      <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full">
         {currentJudgeId && (
            <JudgeView 
              judgeId={currentJudgeId}
              activePerformance={activePerformance}
              existingScore={scores.find(s => s.judgeId === currentJudgeId && s.performanceId === activePerformanceId)}
              onSubmitScore={handleSubmitScore}
              maxScore={maxScore}
            />
         )}
      </main>
    </div>
  );
};

export default App;