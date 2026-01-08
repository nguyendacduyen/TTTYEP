import React, { useState, useEffect } from 'react';
import { Performance, Score } from '../types';
import { generateCommentSuggestion } from '../services/geminiService';
import { Sparkles, Send, Edit3, Loader2, Minus, Plus, Tag, Cloud, CloudOff } from 'lucide-react';

interface JudgeViewProps {
  judgeId: string;
  activePerformance: Performance | null;
  existingScore: Score | undefined;
  onSubmitScore: (score: Score) => void;
  maxScore: number;
}

const QUICK_COMMENTS = [
  "Sáng tạo độc đáo", "Biểu cảm tốt", "Kỹ thuật điêu luyện", 
  "Trang phục đẹp", "Dàn dựng công phu", "Cần tự tin hơn", 
  "Chọn bài phù hợp", "Phối hợp ăn ý"
];

const JudgeView: React.FC<JudgeViewProps> = ({
  judgeId,
  activePerformance,
  existingScore,
  onSubmitScore,
  maxScore
}) => {
  const [score, setScore] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(false);

  // Load state from Existing Score OR Draft
  useEffect(() => {
    if (existingScore) {
      setScore(existingScore.value);
      setComment(existingScore.comment || '');
      setSubmitted(true);
      setIsDraftSaved(true); // Treat existing as saved
    } else if (activePerformance) {
      // Try to load Draft if not submitted
      const draftKey = `draft_${judgeId}_${activePerformance.id}`;
      const savedDraft = localStorage.getItem(draftKey);
      
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          setScore(parsed.score || 0);
          setComment(parsed.comment || '');
        } catch (e) {
          console.error("Failed to parse draft", e);
        }
      } else {
        // Reset if no draft and no existing score
        setScore(0);
        setComment('');
      }
      setSubmitted(false);
      setIsDraftSaved(true);
    } else {
      setScore(0);
      setComment('');
      setSubmitted(false);
    }
  }, [existingScore, activePerformance?.id, judgeId]);

  // Auto-save Draft logic
  useEffect(() => {
    if (!activePerformance || submitted) return;

    const draftKey = `draft_${judgeId}_${activePerformance.id}`;
    const timer = setTimeout(() => {
      localStorage.setItem(draftKey, JSON.stringify({ score, comment }));
      setIsDraftSaved(true);
    }, 500); // Debounce save every 500ms

    setIsDraftSaved(false);

    return () => clearTimeout(timer);
  }, [score, comment, activePerformance, judgeId, submitted]);

  const handleAiSuggest = async () => {
    if (!activePerformance) return;
    setIsAiLoading(true);
    const suggestion = await generateCommentSuggestion(score, activePerformance.name, maxScore);
    setComment(suggestion);
    setIsAiLoading(false);
  };

  const addQuickComment = (text: string) => {
    if (comment.includes(text)) return;
    const newComment = comment ? `${comment}, ${text}` : text;
    setComment(newComment);
  };

  const adjustScore = (delta: number) => {
    setScore(prev => {
      const newValue = prev + delta;
      return Math.min(Math.max(newValue, 0), maxScore);
    });
  };

  const handleSubmit = () => {
    if (!activePerformance) return;
    const newScore: Score = {
      performanceId: activePerformance.id,
      judgeId,
      value: score,
      comment,
      timestamp: Date.now(),
    };
    
    // Clear draft on success
    localStorage.removeItem(`draft_${judgeId}_${activePerformance.id}`);
    
    onSubmitScore(newScore);
    setSubmitted(true);
  };

  if (!activePerformance) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100 mx-4 mt-4">
        <div className="bg-orange-50 p-6 rounded-full mb-6 animate-pulse">
          <Sparkles className="w-12 h-12 text-orange-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Đang chờ tiết mục...</h2>
        <p className="text-slate-500 text-sm">Vui lòng đợi quản trị viên kích hoạt tiết mục tiếp theo.</p>
      </div>
    );
  }

  if (submitted && existingScore) {
    return (
      <div className="max-w-md mx-auto bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center mt-4 mx-4">
        <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Send size={28} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-1">Đã chấm điểm!</h2>
        <p className="text-slate-600 text-sm mb-6">Tiết mục: <strong>{activePerformance.name}</strong></p>
        
        <div className="bg-slate-50 rounded-xl p-6 mb-6 border border-slate-100">
          <div className="text-5xl font-black text-orange-600 mb-2">{existingScore.value}</div>
          <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">trên thang điểm {maxScore}</div>
          {existingScore.comment && (
             <div className="mt-4 pt-4 border-t border-slate-200 text-slate-700 italic text-sm">
               "{existingScore.comment}"
             </div>
          )}
        </div>

        <button 
          onClick={() => setSubmitted(false)}
          className="text-orange-600 hover:text-orange-800 text-sm font-bold flex items-center justify-center gap-2 mx-auto py-2 px-4 rounded-lg hover:bg-orange-50 transition-colors"
        >
          <Edit3 size={16} /> Chỉnh sửa kết quả này
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white sm:rounded-2xl shadow-lg overflow-hidden border-x-0 sm:border border-slate-200 flex flex-col h-[calc(100vh-80px)] sm:h-auto sm:min-h-0">
      {/* Header with Performance Info - Compact on Mobile */}
      <div className="relative h-40 sm:h-56 bg-slate-900 shrink-0">
        <img 
          src={activePerformance.imageUrl} 
          alt={activePerformance.name} 
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-4 sm:p-6 text-white w-full">
          <div className="flex items-end justify-between gap-2">
            <div className="flex-1 min-w-0">
              <span className="inline-block bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">
                SBD: {activePerformance.order}
              </span>
              <h2 className="text-xl sm:text-3xl font-bold leading-tight truncate">{activePerformance.name}</h2>
              <p className="text-sm sm:text-lg text-orange-200 truncate font-medium">{activePerformance.performer}</p>
            </div>
            {/* Auto-save indicator */}
            <div className="mb-1">
              {isDraftSaved ? (
                 <span className="flex items-center gap-1 text-[10px] sm:text-xs text-emerald-400 font-medium bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm">
                   <Cloud size={12} /> Đã lưu nháp
                 </span>
              ) : (
                 <span className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-300 font-medium bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm">
                   <CloudOff size={12} /> Đang lưu...
                 </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8 bg-white">
        {/* Scoring Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
             <label className="text-sm sm:text-lg font-bold text-slate-700 uppercase tracking-wide">Điểm số</label>
             <span className="text-5xl sm:text-6xl font-black text-orange-600 leading-none tracking-tighter">{score}</span>
          </div>
          
          {/* Slider & Fine Tune Buttons */}
          <div className="flex items-center gap-3">
             <button 
               onClick={() => adjustScore(-0.5)}
               className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-orange-100 hover:text-orange-600 transition active:scale-95 shrink-0"
             >
               <Minus size={20} strokeWidth={3} />
             </button>
             
             <div className="flex-1 relative h-10 flex items-center">
                <input 
                  type="range" 
                  min="0" 
                  max={maxScore} 
                  step={maxScore > 20 ? 1 : 0.5}
                  value={score}
                  onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val <= maxScore) setScore(val);
                  }}
                  className="w-full h-4 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-600 touch-none"
                />
             </div>

             <button 
               onClick={() => adjustScore(0.5)}
               className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-orange-100 hover:text-orange-600 transition active:scale-95 shrink-0"
             >
               <Plus size={20} strokeWidth={3} />
             </button>
          </div>
          <div className="flex justify-between text-[10px] sm:text-xs text-slate-400 font-bold px-14 sm:px-16 uppercase">
             <span>Min: 0</span>
             <span>Max: {maxScore}</span>
          </div>
        </div>

        {/* Comment Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm sm:text-lg font-bold text-slate-700 uppercase tracking-wide">Nhận xét</label>
            <button 
              onClick={handleAiSuggest}
              disabled={isAiLoading}
              className="flex items-center gap-1.5 text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 py-1.5 rounded-full shadow-sm hover:shadow-md transition disabled:opacity-50"
            >
              {isAiLoading ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12} />}
              AI Gợi ý
            </button>
          </div>
          
          {/* Quick Comment Chips */}
          <div className="flex flex-wrap gap-2 mb-2">
            {QUICK_COMMENTS.map((qc, idx) => (
              <button
                key={idx}
                onClick={() => addQuickComment(qc)}
                className="text-xs bg-slate-100 hover:bg-orange-100 text-slate-600 hover:text-orange-700 px-3 py-1.5 rounded-md border border-slate-200 transition-colors flex items-center gap-1 active:scale-95"
              >
                <Tag size={10} /> {qc}
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Nhập nhận xét chi tiết (không bắt buộc)..."
            className="w-full h-24 sm:h-32 p-3 sm:p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none bg-white text-slate-900 text-sm sm:text-base"
          />
        </div>
      </div>

      {/* Footer Submit Action - Sticky on Mobile */}
      <div className="p-4 sm:p-6 border-t border-slate-100 bg-white sticky bottom-0 z-10 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] sm:shadow-none">
        <button
          onClick={handleSubmit}
          className="w-full py-3.5 sm:py-4 bg-orange-600 hover:bg-orange-700 text-white text-base sm:text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
        >
          <Send size={20} /> Gửi Điểm & Nhận Xét
        </button>
      </div>
    </div>
  );
};

export default JudgeView;