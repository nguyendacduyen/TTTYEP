import React, { useState, useMemo, useRef } from 'react';
import { Performance, Score, Judge } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Trash2, Edit2, PlayCircle, StopCircle, Upload, X, UserPlus, Users, Save, ListMusic, Trophy, User, Eye, Settings, CheckCircle, KeyRound, Copy, AlertTriangle, FileSpreadsheet, Download } from 'lucide-react';

interface AdminDashboardProps {
  performances: Performance[];
  scores: Score[];
  judges: Judge[];
  activePerformanceId: string | null;
  maxScore: number;
  onAddPerformance: (p: Performance) => void;
  onUpdatePerformance: (p: Performance) => void;
  onDeletePerformance: (id: string) => void;
  onSetActivePerformance: (id: string | null) => void;
  onAddJudge: (name: string) => void;
  onUpdateJudge: (id: string, name: string) => void;
  onDeleteJudge: (id: string) => void;
  onMaxScoreChange: (score: number) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  performances,
  scores,
  judges,
  activePerformanceId,
  maxScore,
  onAddPerformance,
  onUpdatePerformance,
  onDeletePerformance,
  onSetActivePerformance,
  onAddJudge,
  onUpdateJudge,
  onDeleteJudge,
  onMaxScoreChange
}) => {
  // Changed activeTab state to support 4 distinct tabs
  const [activeTab, setActiveTab] = useState<'performances' | 'judges' | 'results' | 'settings'>('performances');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingDetailsId, setViewingDetailsId] = useState<string | null>(null);
  
  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'performance' | 'judge', id: string, name: string } | null>(null);

  // Performance Form State
  const [formName, setFormName] = useState('');
  const [formPerformer, setFormPerformer] = useState('');
  const [formImage, setFormImage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Judge Management State
  const [newJudgeName, setNewJudgeName] = useState('');
  const [editingJudgeId, setEditingJudgeId] = useState<string | null>(null);
  const [editingJudgeName, setEditingJudgeName] = useState('');
  
  // Settings State
  const [tempMaxScore, setTempMaxScore] = useState(maxScore);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // --- Helper to convert file to base64 ---
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Vui lòng chọn ảnh có kích thước dưới 2MB");
        return;
      }
      try {
        const base64 = await convertFileToBase64(file);
        setFormImage(base64);
      } catch (error) {
        console.error("Lỗi khi tải ảnh", error);
        alert("Có lỗi xảy ra khi xử lý ảnh.");
      }
    }
  };

  // --- Performance Handlers ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPerf: Performance = {
      id: editingId || crypto.randomUUID(),
      name: formName,
      performer: formPerformer,
      imageUrl: formImage || `https://picsum.photos/400/300?random=${Math.random()}`,
      order: performances.length + 1,
    };

    if (editingId) {
      onUpdatePerformance(newPerf);
      setEditingId(null);
    } else {
      onAddPerformance(newPerf);
    }
    resetForm();
  };

  const editPerformance = (p: Performance) => {
    setEditingId(p.id);
    setFormName(p.name);
    setFormPerformer(p.performer);
    setFormImage(p.imageUrl);
  };

  const resetForm = () => {
    setFormName('');
    setFormPerformer('');
    setFormImage('');
    setEditingId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // --- Judge Handlers ---
  const handleAddJudgeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newJudgeName.trim()) {
      onAddJudge(newJudgeName.trim());
      setNewJudgeName('');
    }
  };

  const startEditJudge = (judge: Judge) => {
    setEditingJudgeId(judge.id);
    setEditingJudgeName(judge.name);
  };

  const saveJudgeName = (id: string) => {
    if (editingJudgeName.trim()) {
      onUpdateJudge(id, editingJudgeName.trim());
      setEditingJudgeId(null);
    }
  };
  
  // --- Settings Handlers ---
  const handleSaveSettings = (e: React.FormEvent) => {
      e.preventDefault();
      if (tempMaxScore > 0) {
          onMaxScoreChange(tempMaxScore);
          setSettingsSaved(true);
          setTimeout(() => setSettingsSaved(false), 3000);
      }
  };

  // --- Confirm Delete Wrappers ---
  const handleDeleteClick = (type: 'performance' | 'judge', id: string, name: string) => {
      setDeleteConfirm({ type, id, name });
  };

  const executeDelete = () => {
      if (!deleteConfirm) return;
      
      if (deleteConfirm.type === 'performance') {
          onDeletePerformance(deleteConfirm.id);
      } else {
          onDeleteJudge(deleteConfirm.id);
      }
      setDeleteConfirm(null);
  };

  // --- Statistics ---
  const calculatedResults = useMemo(() => {
    return performances.map(perf => {
      const perfScores = scores.filter(s => s.performanceId === perf.id);
      const totalScore = perfScores.reduce((acc, curr) => acc + curr.value, 0);
      const avgScore = perfScores.length > 0 ? (totalScore / perfScores.length).toFixed(2) : '0.00';
      return {
        ...perf,
        totalScore,
        avgScore: parseFloat(avgScore),
        votes: perfScores.length
      };
    }).sort((a, b) => b.avgScore - a.avgScore);
  }, [performances, scores]);

  // --- Export Excel (CSV) Handler ---
  const handleExportCSV = () => {
    // 1. Define Headers
    const headers = [
      "Hạng",
      "Tiết mục",
      "Người trình bày/Nhóm",
      "Điểm Trung Bình",
      "Tổng Điểm",
      "Số Giám Khảo Đã Chấm"
    ];

    // 2. Format Rows
    const rows = calculatedResults.map((item, index) => [
      index + 1,
      `"${item.name.replace(/"/g, '""')}"`, // Escape quotes for CSV
      `"${item.performer.replace(/"/g, '""')}"`,
      item.avgScore.toFixed(2), // Standard format
      item.totalScore,
      item.votes
    ]);

    // 3. Combine with BOM for Vietnamese support in Excel
    const csvContent = "\ufeff" + [
      headers.join(","), 
      ...rows.map(r => r.join(","))
    ].join("\n");

    // 4. Create Download Link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `ket_qua_thi_van_nghe_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Updated colors to match Orange theme (Orange, Amber, Red, etc)
  const COLORS = ['#ea580c', '#f97316', '#fb923c', '#fdba74', '#e11d48', '#db2777'];

  return (
    <div className="p-6 space-y-8 bg-white rounded-xl shadow-sm border border-slate-200 relative">
      {/* Tabs Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-center border-b pb-4 gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Bảng điều khiển Admin</h2>
        <div className="flex flex-wrap gap-2 justify-center sm:justify-end w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('performances')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${activeTab === 'performances' ? 'bg-orange-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <ListMusic size={18} /> <span>Tiết mục</span>
          </button>
          <button
            onClick={() => setActiveTab('judges')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${activeTab === 'judges' ? 'bg-orange-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <Users size={18} /> <span>Giám khảo</span>
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${activeTab === 'results' ? 'bg-orange-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <Trophy size={18} /> <span>Kết quả</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${activeTab === 'settings' ? 'bg-slate-700 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <Settings size={18} /> <span>Cài đặt</span>
          </button>
        </div>
      </div>
      
      {/* Tab: Settings */}
      {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
             <div className="bg-slate-50 p-8 rounded-xl border border-slate-200 shadow-sm">
                 <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                     <Settings className="text-slate-600" /> Cấu hình hệ thống
                 </h3>
                 
                 <form onSubmit={handleSaveSettings} className="space-y-6">
                     <div>
                         <label className="block text-sm font-bold text-slate-700 mb-2">
                             Thang điểm tối đa (Max Score)
                         </label>
                         <p className="text-sm text-slate-500 mb-3">
                             Điểm số cao nhất mà giám khảo có thể chấm cho mỗi tiết mục (Mặc định: 10).
                         </p>
                         <div className="flex items-center gap-4">
                             <input 
                               type="number" 
                               min="1" 
                               max="1000"
                               step="1"
                               value={tempMaxScore}
                               onChange={(e) => setTempMaxScore(parseInt(e.target.value) || 0)}
                               className="w-32 p-3 text-lg font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-center bg-white text-slate-900"
                             />
                             <span className="text-slate-500 font-medium">điểm</span>
                         </div>
                     </div>
                     
                     <div className="pt-4 border-t border-slate-200 flex items-center gap-4">
                         <button 
                           type="submit" 
                           className="bg-orange-600 text-white px-6 py-2.5 rounded-lg hover:bg-orange-700 font-bold shadow-sm transition-colors flex items-center gap-2"
                         >
                             <Save size={18} /> Lưu cấu hình
                         </button>
                         {settingsSaved && (
                             <span className="text-green-600 font-medium flex items-center gap-1 animate-in fade-in">
                                 <CheckCircle size={18} /> Đã lưu thành công!
                             </span>
                         )}
                     </div>
                 </form>
             </div>
             
             <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                 <strong>Lưu ý:</strong> Việc thay đổi thang điểm sẽ ảnh hưởng đến giao diện chấm thi của các giám khảo. Các điểm số đã chấm trước đó sẽ được giữ nguyên giá trị (không tự động quy đổi).
             </div>
          </div>
      )}

      {/* Tab: Judges Management */}
      {activeTab === 'judges' && (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
           {/* Add New Judge Card */}
           <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm">
             <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
               <UserPlus size={22} className="text-orange-600" /> Thêm Giám Khảo Mới
             </h3>
             <form onSubmit={handleAddJudgeSubmit} className="flex gap-3 items-end">
               <div className="flex-1">
                 <input 
                   type="text" 
                   value={newJudgeName}
                   onChange={(e) => setNewJudgeName(e.target.value)}
                   placeholder="Nhập tên giám khảo (ví dụ: Thầy Hiệu Trưởng)..."
                   className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-slate-800 shadow-sm bg-white"
                 />
                 <p className="text-xs text-slate-500 mt-1 pl-1">Hệ thống sẽ tự động tạo mã truy cập cho giám khảo.</p>
               </div>
               <button 
                 type="submit"
                 disabled={!newJudgeName.trim()}
                 className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 disabled:opacity-50 font-medium shadow-sm transition-colors"
               >
                 Thêm
               </button>
             </form>
           </div>

           {/* Judge List */}
           <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                <span className="font-semibold text-slate-700">Danh sách Ban Giám Khảo</span>
                <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2.5 py-0.5 rounded-full">{judges.length} thành viên</span>
              </div>
              
              <div className="divide-y divide-slate-100">
                {judges.length === 0 && (
                  <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                    <Users size={48} className="text-slate-300 mb-2" />
                    <p>Chưa có giám khảo nào.</p>
                  </div>
                )}
                {judges.map(judge => (
                  <div key={judge.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 relative">
                    {editingJudgeId === judge.id ? (
                      <div className="flex items-center gap-3 flex-1 relative z-20">
                        <input 
                          autoFocus
                          type="text" 
                          value={editingJudgeName}
                          onChange={(e) => setEditingJudgeName(e.target.value)}
                          className="flex-1 p-2 border border-orange-300 rounded-md outline-none focus:ring-2 focus:ring-orange-200 bg-white text-slate-900"
                        />
                        <button onClick={() => saveJudgeName(judge.id)} className="bg-green-100 text-green-700 p-2 rounded-md hover:bg-green-200 transition" title="Lưu">
                          <Save size={18}/>
                        </button>
                        <button onClick={() => setEditingJudgeId(null)} className="bg-red-100 text-red-700 p-2 rounded-md hover:bg-red-200 transition" title="Hủy">
                          <X size={18}/>
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-4 flex-1 min-w-0 mr-4">
                           <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                             {judge.name.charAt(0).toUpperCase()}
                           </div>
                           <div className="flex flex-col overflow-hidden">
                               <span className="font-semibold text-slate-800 text-lg truncate">{judge.name}</span>
                               <div className="flex items-center gap-2 text-xs text-slate-500">
                                   <KeyRound size={12} className="shrink-0" />
                                   Code: <span className="font-mono font-bold bg-slate-100 px-1 rounded">{judge.accessCode}</span>
                               </div>
                           </div>
                        </div>
                        <div className="flex gap-2 shrink-0 relative z-10">
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); startEditJudge(judge); }} 
                            className="p-3 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition cursor-pointer"
                            title="Đổi tên"
                          >
                            <Edit2 size={18} className="pointer-events-none" />
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDeleteClick('judge', judge.id, judge.name); }} 
                            className="p-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Xóa"
                          >
                            <Trash2 size={18} className="pointer-events-none" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
           </div>
        </div>
      )}

      {/* Tab: Performances Management */}
      {activeTab === 'performances' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
          
          {/* Left Column: Form */}
          <div className="lg:col-span-1 space-y-6">
            <form onSubmit={handleSubmit} className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm sticky top-6">
              <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                {editingId ? <Edit2 size={20} className="text-orange-600"/> : <ListMusic size={20} className="text-orange-600"/>}
                {editingId ? 'Chỉnh sửa tiết mục' : 'Thêm tiết mục mới'}
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tên tiết mục <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-shadow bg-white text-slate-900"
                    placeholder="Ví dụ: Múa Sen"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Người trình bày / Nhóm <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="text"
                    value={formPerformer}
                    onChange={e => setFormPerformer(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-shadow bg-white text-slate-900"
                    placeholder="Ví dụ: Lớp 12A1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Hình ảnh minh họa</label>
                  
                  {/* Image Preview Area */}
                  <div className="mt-1 mb-3">
                    {formImage ? (
                      <div className="relative group w-full h-48 rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm">
                        <img src={formImage} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => {
                            setFormImage('');
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-700"
                          title="Xóa ảnh"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                       <div className="w-full h-28 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 gap-2 bg-white">
                         <Upload size={24} />
                         <span className="text-xs">Chưa chọn ảnh</span>
                       </div>
                    )}
                  </div>

                  {/* File Input */}
                  <div className="relative">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label 
                      htmlFor="image-upload"
                      className="flex items-center justify-center gap-2 w-full p-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors text-sm font-semibold shadow-sm"
                    >
                      <Upload size={18} />
                      {formImage ? 'Thay đổi ảnh' : 'Tải ảnh lên'}
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-200 mt-2">
                  <button type="submit" className="flex-1 bg-orange-600 text-white py-2.5 rounded-lg hover:bg-orange-700 font-semibold shadow-md transition-transform active:scale-95">
                    {editingId ? 'Lưu cập nhật' : 'Thêm mới'}
                  </button>
                  {editingId && (
                    <button type="button" onClick={resetForm} className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-semibold transition-colors">
                      Hủy
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Performance List */}
          <div className="lg:col-span-2 space-y-4">
             <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold text-slate-800">Danh sách tiết mục</h3>
                <span className="bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-full">{performances.length} tiết mục</span>
             </div>
             
             <div className="grid gap-4">
               {performances.length === 0 && (
                  <div className="bg-white p-12 rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
                    <ListMusic size={48} className="mx-auto text-slate-300 mb-3"/>
                    <p>Chưa có tiết mục nào. Hãy thêm tiết mục đầu tiên!</p>
                  </div>
               )}
               {performances.map((perf) => {
                 const isActive = activePerformanceId === perf.id;
                 const voteCount = scores.filter(s => s.performanceId === perf.id).length;
                 const progress = judges.length > 0 ? (voteCount / judges.length) * 100 : 0;

                 return (
                   <div key={perf.id} className={`flex flex-col sm:flex-row items-start sm:items-center p-4 bg-white border rounded-xl shadow-sm transition-all ${isActive ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50' : 'hover:border-orange-300 hover:shadow-md'}`}>
                     <div className="relative w-full sm:w-20 h-20 shrink-0 mb-3 sm:mb-0">
                       <img src={perf.imageUrl} alt={perf.name} className="w-full h-full object-cover rounded-lg bg-slate-200 shadow-sm" />
                       <div className="absolute top-0 right-0 bg-slate-900 text-white text-xs font-bold px-1.5 py-0.5 rounded-bl-lg rounded-tr-lg opacity-80">
                         #{perf.order}
                       </div>
                     </div>
                     
                     <div className="sm:ml-4 flex-1 min-w-0 w-full sm:w-auto">
                       <h4 className="font-bold text-slate-800 text-lg leading-tight mb-1 truncate">{perf.name}</h4>
                       <p className="text-sm font-medium text-slate-600 mb-3 flex items-center gap-1 truncate">
                         <User size={14}/> {perf.performer}
                       </p>
                       
                       <div className="flex items-center gap-3">
                         <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-700 ${progress === 100 ? 'bg-green-500' : 'bg-orange-600'}`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
                         </div>
                         <span className="text-xs font-bold text-slate-600 min-w-[80px] text-right">
                           {voteCount}/{judges.length} đã chấm
                         </span>
                       </div>
                     </div>

                     <div className="flex items-center gap-2 mt-4 sm:mt-0 sm:ml-4 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 relative z-10">
                        {isActive ? (
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onSetActivePerformance(null); }}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-bold transition-colors"
                          >
                            <StopCircle size={18} className="pointer-events-none" /> <span className="sm:hidden pointer-events-none">Dừng</span>
                          </button>
                        ) : (
                          <button 
                             type="button"
                             onClick={(e) => { e.stopPropagation(); onSetActivePerformance(perf.id); }}
                             className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 text-sm font-bold transition-colors"
                          >
                            <PlayCircle size={18} className="pointer-events-none" /> <span className="sm:hidden pointer-events-none">Bắt đầu</span>
                          </button>
                        )}
                        <div className="w-px h-8 bg-slate-200 hidden sm:block mx-1"></div>
                        
                        <button type="button" onClick={(e) => { e.stopPropagation(); setViewingDetailsId(perf.id); }} className="p-3 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer" title="Xem chi tiết điểm">
                          <Eye size={18} className="pointer-events-none" />
                        </button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); editPerformance(perf); }} className="p-3 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition cursor-pointer" title="Sửa">
                          <Edit2 size={18} className="pointer-events-none" />
                        </button>
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); handleDeleteClick('performance', perf.id, perf.name); }} 
                          className="p-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer" 
                          title="Xóa"
                        >
                          <Trash2 size={18} className="pointer-events-none" />
                        </button>
                     </div>
                   </div>
                 );
               })}
             </div>
          </div>
        </div>
      )}

      {/* Tab: Results & Statistics */}
      {activeTab === 'results' && (
        <div className="space-y-8 animate-in fade-in duration-300">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold mb-6 text-center text-slate-800 flex items-center justify-center gap-2">
                  <BarChart className="text-orange-600"/> Xếp hạng (Điểm trung bình)
                </h3>
                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={calculatedResults} layout="vertical" margin={{ top: 5, right: 40, left: 40, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#cbd5e1" />
                      <XAxis type="number" domain={[0, maxScore]} hide />
                      <YAxis type="category" dataKey="name" width={150} tick={{fontSize: 12, fill: '#334155', fontWeight: 500}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                        cursor={{fill: '#f1f5f9'}}
                        formatter={(value: number) => [value, 'Điểm']}
                      />
                      <Bar dataKey="avgScore" name="Điểm trung bình" radius={[0, 4, 4, 0]} barSize={32}>
                        {calculatedResults.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             </div>
             
             <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                <div className="bg-orange-600 text-white p-4 font-bold text-lg flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Trophy size={20} className="text-yellow-300"/> Bảng Kết Quả Chi Tiết
                  </div>
                  <button 
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 bg-white text-orange-600 hover:bg-orange-50 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-colors"
                  >
                    <Download size={16} /> Xuất Excel
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-4 font-bold text-slate-600 text-sm uppercase tracking-wider">Hạng</th>
                        <th className="p-4 font-bold text-slate-600 text-sm uppercase tracking-wider">Tiết mục</th>
                        <th className="p-4 font-bold text-slate-600 text-sm uppercase tracking-wider hidden sm:table-cell">Biểu diễn</th>
                        <th className="p-4 font-bold text-slate-600 text-sm uppercase tracking-wider text-center">ĐTB</th>
                        <th className="p-4 font-bold text-slate-600 text-sm uppercase tracking-wider text-center hidden sm:table-cell">Tổng</th>
                        <th className="p-4 font-bold text-slate-600 text-sm uppercase tracking-wider text-center">Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculatedResults.map((item, index) => (
                        <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="p-4">
                             <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold shadow-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-300' : index === 1 ? 'bg-slate-200 text-slate-700 ring-2 ring-slate-300' : index === 2 ? 'bg-orange-100 text-orange-800 ring-2 ring-orange-200' : 'text-slate-500 bg-slate-50'}`}>
                               {index + 1}
                             </span>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-800">{item.name}</div>
                            <div className="text-xs text-slate-500 sm:hidden">{item.performer}</div>
                          </td>
                          <td className="p-4 text-slate-600 font-medium hidden sm:table-cell">{item.performer}</td>
                          <td className="p-4 text-center">
                            <span className="inline-block px-3 py-1 bg-orange-50 text-orange-700 rounded-full font-bold">
                              {item.avgScore.toFixed(2)}
                            </span>
                          </td>
                          <td className="p-4 text-center text-slate-500 font-medium hidden sm:table-cell">{item.totalScore}</td>
                          <td className="p-4 text-center">
                            <button 
                              onClick={() => setViewingDetailsId(item.id)}
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded-full transition-colors"
                              title="Xem chi tiết điểm"
                            >
                              <Eye size={20} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
           </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
             <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                   <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Xác nhận xóa?</h3>
                <p className="text-slate-600 mb-6">
                   Bạn có chắc chắn muốn xóa {deleteConfirm.type === 'performance' ? 'tiết mục' : 'giám khảo'} <span className="font-bold text-slate-800">"{deleteConfirm.name}"</span> không?
                   <br/>
                   <span className="text-sm text-red-500 block mt-2">Hành động này không thể hoàn tác và sẽ xóa tất cả điểm số liên quan.</span>
                </p>
                <div className="flex gap-3">
                   <button 
                     onClick={() => setDeleteConfirm(null)}
                     className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition-colors"
                   >
                     Hủy
                   </button>
                   <button 
                     onClick={executeDelete}
                     className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-md"
                   >
                     Xóa ngay
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {viewingDetailsId && (() => {
        const perf = performances.find(p => p.id === viewingDetailsId);
        if (!perf) return null;
        
        const perfScores = scores.filter(s => s.performanceId === perf.id);
        const details = judges.map(j => {
            const s = perfScores.find(score => score.judgeId === j.id);
            return { judge: j, score: s };
        });

        const totalScore = perfScores.reduce((acc, s) => acc + s.value, 0);
        const avgScore = perfScores.length ? (totalScore / perfScores.length).toFixed(2) : "0.00";

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewingDetailsId(null)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{perf.name}</h3>
                  <p className="text-slate-600 font-medium flex items-center gap-2 mt-1">
                    <User size={16}/> {perf.performer}
                  </p>
                </div>
                <button onClick={() => setViewingDetailsId(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                 <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-orange-50 p-4 rounded-lg text-center border border-orange-100">
                       <div className="text-sm text-orange-600 font-bold uppercase tracking-wide">Điểm Trung Bình</div>
                       <div className="text-3xl font-black text-orange-700">{avgScore}</div>
                    </div>
                     <div className="bg-slate-50 p-4 rounded-lg text-center border border-slate-200">
                       <div className="text-sm text-slate-600 font-bold uppercase tracking-wide">Tổng Điểm</div>
                       <div className="text-3xl font-black text-slate-700">{totalScore}</div>
                    </div>
                 </div>

                 <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Users size={18} className="text-slate-500"/> Chi tiết điểm số ({perfScores.length}/{judges.length})
                 </h4>
                 
                 <div className="space-y-3">
                   {details.map(({ judge, score }) => (
                     <div key={judge.id} className="flex items-start p-3 rounded-lg border border-slate-100 hover:border-orange-200 transition bg-white shadow-sm">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600 shrink-0 mr-3">
                            {judge.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                           <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-slate-700">{judge.name}</span>
                              {score ? (
                                <span className="bg-green-100 text-green-700 font-bold px-2.5 py-0.5 rounded-md text-sm border border-green-200">
                                  {score.value} điểm
                                </span>
                              ) : (
                                <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded-md italic">
                                  Chưa chấm
                                </span>
                              )}
                           </div>
                           {score?.comment ? (
                             <p className="text-sm text-slate-600 italic bg-slate-50 p-2 rounded border border-slate-100 mt-2">
                               "{score.comment}"
                             </p>
                           ) : (
                              score && <span className="text-xs text-slate-400 italic">Không có nhận xét</span>
                           )}
                        </div>
                     </div>
                   ))}
                 </div>
              </div>
              
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button onClick={() => setViewingDetailsId(null)} className="px-5 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium transition">
                  Đóng
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default AdminDashboard;