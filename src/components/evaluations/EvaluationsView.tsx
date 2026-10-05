import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  StudentEvaluation, 
  EvaluationPeriodType, 
  Student, 
  UserRole 
} from '../../types';
import { 
  MessageSquare, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Filter, 
  Check, 
  X, 
  Calendar, 
  Clock, 
  User, 
  Sparkles, 
  Award, 
  AlertCircle, 
  BookOpen, 
  CheckCircle2, 
  Printer, 
  History, 
  Users, 
  Tag,
  ChevronRight,
  Smile,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { formatDateVN } from '../../utils/exportUtils';

const QUICK_TEMPLATES = [
  { text: 'Chăm chỉ học tập, tích cực phát biểu xây dựng bài trong tuần.', category: 'Học tập', rating: 'Xuất sắc' },
  { text: 'Làm bài tập về nhà đầy đủ, hoàn thành tốt nhiệm vụ được giao.', category: 'Học tập', rating: 'Tốt' },
  { text: 'Chấp hành nghiêm túc nội quy trường lớp, đồng phục khăn quàng chỉnh tề.', category: 'Nề nếp & Kỷ luật', rating: 'Tốt' },
  { text: 'Trực nhật đúng giờ, vệ sinh lớp sạch sẽ, có tinh thần trách nhiệm cao.', category: 'Đạo đức & Ý thức', rating: 'Xuất sắc' },
  { text: 'Nhiệt tình tham gia các hoạt động phong trào văn thể mỹ của lớp.', category: 'Văn thể mỹ', rating: 'Xuất sắc' },
  { text: 'Có nhiều tiến bộ rõ rệt trong ý thức học tập và kỷ luật so với tuần trước.', category: 'Chung', rating: 'Tốt' },
  { text: 'Còn nói chuyện riêng, làm việc riêng trong giờ học, cần chú ý nghiêm túc hơn.', category: 'Nề nếp & Kỷ luật', rating: 'Cần cố gắng' },
  { text: 'Chưa làm bài tập về nhà đầy đủ, cần tăng cường tự học và nhờ bạn hỗ trợ.', category: 'Học tập', rating: 'Cần cố gắng' },
  { text: 'Đi học muộn hoặc thiếu khăn quàng/đồng phục, cần chấn chỉnh ngay.', category: 'Nề nếp & Kỷ luật', rating: 'Nhắc nhở' },
];

const RATING_CONFIG: Record<string, { label: string; color: string; badge: string; icon: any }> = {
  'Xuất sắc': { label: 'Xuất sắc', color: 'text-amber-800', badge: 'bg-amber-100 text-amber-900 border-amber-300 font-bold', icon: Award },
  'Tốt': { label: 'Tốt', color: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold', icon: CheckCircle2 },
  'Khá': { label: 'Khá', color: 'text-blue-800', badge: 'bg-blue-50 text-blue-800 border-blue-200', icon: Smile },
  'Cần cố gắng': { label: 'Cần cố gắng', color: 'text-orange-800', badge: 'bg-orange-100 text-orange-900 border-orange-300 font-bold', icon: AlertCircle },
  'Nhắc nhở': { label: 'Nhắc nhở', color: 'text-rose-800', badge: 'bg-rose-100 text-rose-900 border-rose-300 font-bold', icon: AlertTriangle },
};

export const EvaluationsView: React.FC = () => {
  const { 
    data, 
    currentUser, 
    addEvaluation, 
    updateEvaluation, 
    deleteEvaluation, 
    openConfirm, 
    showToast 
  } = useApp();

  // Period Filter States
  const [periodType, setPeriodType] = useState<EvaluationPeriodType>('tuan');
  const [selectedWeek, setSelectedWeek] = useState<number>(data.config.currentWeek || 5);
  const [selectedMonth, setSelectedMonth] = useState<number>(data.config.currentMonth || 10);
  const [selectedSemester, setSelectedSemester] = useState<string>('HK1');

  // Secondary filters
  const [teamFilter, setTeamFilter] = useState<number | 'all'>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEval, setEditingEval] = useState<StudentEvaluation | null>(null);
  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);
  const [isBatchModeOpen, setIsBatchModeOpen] = useState(false);

  // Add/Edit Form State
  const [formStudentId, setFormStudentId] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<'Học tập' | 'Nề nếp & Kỷ luật' | 'Đạo đức & Ý thức' | 'Văn thể mỹ' | 'Chung'>('Học tập');
  const [formRating, setFormRating] = useState<'Xuất sắc' | 'Tốt' | 'Khá' | 'Cần cố gắng' | 'Nhắc nhở'>('Tốt');

  // Batch Mode State
  const [batchRemarks, setBatchRemarks] = useState<Record<string, { content: string; rating: 'Xuất sắc' | 'Tốt' | 'Khá' | 'Cần cố gắng' | 'Nhắc nhở'; category: any }>>({});

  // Computed Current Period Value & Label
  const currentPeriodValue = useMemo(() => {
    if (periodType === 'tuan') return selectedWeek;
    if (periodType === 'thang') return selectedMonth;
    return selectedSemester;
  }, [periodType, selectedWeek, selectedMonth, selectedSemester]);

  const currentPeriodLabel = useMemo(() => {
    if (periodType === 'tuan') return `Tuần ${selectedWeek}`;
    if (periodType === 'thang') return `Tháng ${selectedMonth}`;
    if (selectedSemester === 'HK1') return 'Học kỳ 1';
    if (selectedSemester === 'HK2') return 'Học kỳ 2';
    return 'Cả năm học';
  }, [periodType, selectedWeek, selectedMonth, selectedSemester]);

  // Filtered Evaluations for current period
  const periodEvaluations = useMemo(() => {
    const list = data.evaluations || [];
    return list.filter(e => e.periodType === periodType && String(e.periodValue) === String(currentPeriodValue));
  }, [data.evaluations, periodType, currentPeriodValue]);

  // Evaluations matching active filters
  const filteredEvaluations = useMemo(() => {
    return periodEvaluations.filter(e => {
      if (teamFilter !== 'all' && e.teamId !== teamFilter) return false;
      if (ratingFilter !== 'all' && e.rating !== ratingFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = e.studentName.toLowerCase().includes(q);
        const matchContent = e.content.toLowerCase().includes(q);
        const matchAuthor = e.authorName.toLowerCase().includes(q);
        if (!matchName && !matchContent && !matchAuthor) return false;
      }
      return true;
    });
  }, [periodEvaluations, teamFilter, ratingFilter, searchQuery]);

  // Map of studentId -> evaluations in current period
  const studentEvalMap = useMemo(() => {
    const map = new Map<string, StudentEvaluation[]>();
    periodEvaluations.forEach(e => {
      const arr = map.get(e.studentId) || [];
      arr.push(e);
      map.set(e.studentId, arr);
    });
    return map;
  }, [periodEvaluations]);

  // Count evaluated students in current period
  const evaluatedStudentsCount = studentEvalMap.size;
  const totalStudents = data.students.length;
  const progressPercent = totalStudents > 0 ? Math.round((evaluatedStudentsCount / totalStudents) * 100) : 0;

  // Rating distribution counts
  const ratingCounts = useMemo(() => {
    const counts: Record<string, number> = { 'Xuất sắc': 0, 'Tốt': 0, 'Khá': 0, 'Cần cố gắng': 0, 'Nhắc nhở': 0 };
    periodEvaluations.forEach(e => {
      if (e.rating && counts[e.rating] !== undefined) {
        counts[e.rating]++;
      }
    });
    return counts;
  }, [periodEvaluations]);

  // Open single add modal
  const handleOpenAdd = (defaultStudentId?: string) => {
    setEditingEval(null);
    setFormStudentId(defaultStudentId || (data.students[0]?.id || ''));
    setFormContent('');
    setFormCategory('Học tập');
    setFormRating('Tốt');
    setIsAddModalOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (evalItem: StudentEvaluation) => {
    setEditingEval(evalItem);
    setFormStudentId(evalItem.studentId);
    setFormContent(evalItem.content);
    setFormCategory(evalItem.category || 'Chung');
    setFormRating(evalItem.rating || 'Tốt');
    setIsAddModalOpen(true);
  };

  // Submit Single Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentId || !formContent.trim()) {
      showToast('Vui lòng chọn học sinh và nhập nội dung nhận xét.', 'warning');
      return;
    }

    const targetStudent = data.students.find(s => s.id === formStudentId);
    if (!targetStudent) return;

    if (editingEval) {
      await updateEvaluation(editingEval.id, {
        content: formContent.trim(),
        category: formCategory,
        rating: formRating,
        periodType,
        periodValue: currentPeriodValue,
        periodLabel: currentPeriodLabel,
      });
    } else {
      await addEvaluation({
        studentId: formStudentId,
        studentName: targetStudent.name,
        teamId: targetStudent.teamId,
        periodType,
        periodValue: currentPeriodValue,
        periodLabel: currentPeriodLabel,
        content: formContent.trim(),
        category: formCategory,
        rating: formRating,
      });
    }

    setIsAddModalOpen(false);
  };

  // Open Batch Remarks
  const handleOpenBatchMode = () => {
    const initialMap: Record<string, any> = {};
    const relevantStudents = teamFilter === 'all' 
      ? data.students 
      : data.students.filter(s => s.teamId === teamFilter);

    relevantStudents.forEach(s => {
      const existing = studentEvalMap.get(s.id)?.[0];
      initialMap[s.id] = {
        content: existing ? existing.content : '',
        rating: existing ? existing.rating || 'Tốt' : 'Tốt',
        category: existing ? existing.category || 'Chung' : 'Chung',
      };
    });

    setBatchRemarks(initialMap);
    setIsBatchModeOpen(true);
  };

  // Submit Batch Mode
  const handleSaveBatchRemarks = async () => {
    let savedCount = 0;
    const entries = Object.entries(batchRemarks);

    for (const [sId, remarkObj] of entries) {
      if (remarkObj.content && remarkObj.content.trim()) {
        const student = data.students.find(s => s.id === sId);
        if (student) {
          const existing = studentEvalMap.get(sId)?.[0];
          if (existing) {
            await updateEvaluation(existing.id, {
              content: remarkObj.content.trim(),
              rating: remarkObj.rating,
              category: remarkObj.category,
            });
          } else {
            await addEvaluation({
              studentId: sId,
              studentName: student.name,
              teamId: student.teamId,
              periodType,
              periodValue: currentPeriodValue,
              periodLabel: currentPeriodLabel,
              content: remarkObj.content.trim(),
              rating: remarkObj.rating,
              category: remarkObj.category,
            });
          }
          savedCount++;
        }
      }
    }

    setIsBatchModeOpen(false);
    showToast(`Đã lưu nhận xét cho ${savedCount} học sinh!`, 'success');
  };

  // Print summary of remarks
  const handlePrintSummary = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-24 space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-indigo-700 to-indigo-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-xs rounded-full text-xs font-semibold mb-2">
            <MessageSquare className="w-3.5 h-3.5 text-teal-300" />
            <span>Sổ Theo Dõi Đánh Giá Học Sinh</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            NHẬN XÉT HỌC SINH LỚP {data.config.className}
          </h1>
          <p className="text-indigo-100 text-xs sm:text-sm mt-1">
            Dành cho Giáo viên chủ nhiệm, Lớp trưởng, Lớp phó và Tổ trưởng đánh giá rèn luyện theo Tuần / Tháng / Học kỳ.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenAdd()}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Viết nhận xét</span>
          </button>

          <button
            onClick={handleOpenBatchMode}
            className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2 backdrop-blur-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Nhận xét nhanh cả tổ</span>
          </button>

          <button
            onClick={handlePrintSummary}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer"
            title="In sổ nhận xét"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Period Navigation Bar & Scope Selectors */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          {/* Period Type Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
            <button
              onClick={() => setPeriodType('tuan')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                periodType === 'tuan' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📅 Theo Tuần
            </button>
            <button
              onClick={() => setPeriodType('thang')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                periodType === 'thang' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🗓️ Theo Tháng
            </button>
            <button
              onClick={() => setPeriodType('hoc_ky')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                periodType === 'hoc_ky' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🎓 Theo Học kỳ
            </button>
          </div>

          {/* Specific Period Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đang xem:</span>
            {periodType === 'tuan' && (
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold text-xs sm:text-sm rounded-xl focus:outline-none"
              >
                {Array.from({ length: 35 }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={w}>
                    Tuần {w} {w === data.config.currentWeek ? '— (Tuần hiện tại)' : ''}
                  </option>
                ))}
              </select>
            )}

            {periodType === 'thang' && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold text-xs sm:text-sm rounded-xl focus:outline-none"
              >
                {[9, 10, 11, 12, 1, 2, 3, 4, 5].map((m) => (
                  <option key={m} value={m}>
                    Tháng {m} {m === data.config.currentMonth ? '— (Tháng hiện tại)' : ''}
                  </option>
                ))}
              </select>
            )}

            {periodType === 'hoc_ky' && (
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold text-xs sm:text-sm rounded-xl focus:outline-none"
              >
                <option value="HK1">Học kỳ 1 (Tháng 9 - Tháng 1)</option>
                <option value="HK2">Học kỳ 2 (Tháng 1 - Tháng 5)</option>
                <option value="CaNam">Đánh giá Cả năm học</option>
              </select>
            )}
          </div>
        </div>

        {/* Progress & Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 col-span-2 sm:col-span-1">
            <div className="text-[11px] text-slate-500 font-bold">Tiến độ nhận xét</div>
            <div className="text-xl sm:text-2xl font-black text-indigo-700 mt-0.5">
              {evaluatedStudentsCount}/{totalStudents}
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div 
                className="bg-indigo-600 h-full transition-all" 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3">
            <div className="text-[11px] text-amber-900 font-bold">Xuất sắc</div>
            <div className="text-xl font-black text-amber-800 mt-0.5">{ratingCounts['Xuất sắc'] || 0}</div>
            <div className="text-[10px] text-amber-700">Gương mẫu</div>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3">
            <div className="text-[11px] text-emerald-900 font-bold">Tốt</div>
            <div className="text-xl font-black text-emerald-800 mt-0.5">{ratingCounts['Tốt'] || 0}</div>
            <div className="text-[10px] text-emerald-700">Tích cực</div>
          </div>

          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3">
            <div className="text-[11px] text-blue-900 font-bold">Khá</div>
            <div className="text-xl font-black text-blue-800 mt-0.5">{ratingCounts['Khá'] || 0}</div>
            <div className="text-[10px] text-blue-700">Ổn định</div>
          </div>

          <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3">
            <div className="text-[11px] text-rose-900 font-bold">Cần cố gắng / Nhắc nhở</div>
            <div className="text-xl font-black text-rose-800 mt-0.5">
              {(ratingCounts['Cần cố gắng'] || 0) + (ratingCounts['Nhắc nhở'] || 0)}
            </div>
            <div className="text-[10px] text-rose-700">Cần đôn đốc</div>
          </div>
        </div>

        {/* Secondary Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Team filter pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 mr-1">Tổ:</span>
            {(['all', 1, 2, 3, 4] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTeamFilter(t)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  teamFilter === t 
                    ? 'bg-indigo-600 text-white shadow-2xs' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t === 'all' ? 'Tất cả tổ' : `Tổ ${t}`}
              </button>
            ))}
          </div>

          {/* Rating filter */}
          <div className="flex items-center gap-2">
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-xs rounded-xl focus:outline-none"
            >
              <option value="all">Tất cả xếp loại</option>
              <option value="Xuất sắc">⭐ Xuất sắc</option>
              <option value="Tốt">✓ Tốt</option>
              <option value="Khá">Khá</option>
              <option value="Cần cố gắng">⚠️ Cần cố gắng</option>
              <option value="Nhắc nhở">🚨 Nhắc nhở</option>
            </select>

            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm học sinh, nội dung..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Evaluations List & Student Cards */}
      {filteredEvaluations.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
          <MessageSquare className="w-14 h-14 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">
            Chưa có nhận xét nào trong {currentPeriodLabel}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
            Bạn có thể bấm nút "Viết nhận xét" để nhận xét từng học sinh hoặc "Nhận xét nhanh cả tổ" để nhập nhận xét hàng loạt theo tuần/tháng.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => handleOpenAdd()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Viết nhận xét đầu tiên</span>
            </button>
            <button
              onClick={handleOpenBatchMode}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Nhận xét nhanh cả tổ ({currentPeriodLabel})</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvaluations.map((ev) => {
            const studentObj = data.students.find(s => s.id === ev.studentId);
            const ratingConf = ev.rating && RATING_CONFIG[ev.rating] ? RATING_CONFIG[ev.rating] : RATING_CONFIG['Tốt'];
            const RatingIcon = ratingConf.icon;

            const canEdit = currentUser.role === 'admin' || currentUser.id === ev.authorId;

            return (
              <div 
                key={ev.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Student Header */}
                  <div className="flex items-start justify-between gap-3 mb-2.5 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-sm shrink-0">
                        {ev.studentName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{ev.studentName}</span>
                          <span className="bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.2 rounded text-[10px]">
                            Tổ {ev.teamId}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{ev.periodLabel}</span>
                          {ev.category && (
                            <>
                              <span>•</span>
                              <span className="text-slate-600 font-medium">🏷️ {ev.category}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${ratingConf.badge}`}>
                        <RatingIcon className="w-3 h-3" />
                        <span>{ratingConf.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Evaluation Content */}
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal bg-slate-50/70 p-3 rounded-xl border border-slate-100 italic">
                    "{ev.content}"
                  </p>
                </div>

                {/* Footer: Author info & Action buttons */}
                <div className="flex items-center justify-between gap-2 mt-3 pt-2 text-[11px] text-slate-500 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-700 truncate">{ev.authorName}</span>
                    <span>• {formatDateVN(ev.createdAt)}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {studentObj && (
                      <button
                        type="button"
                        onClick={() => setHistoryStudent(studentObj)}
                        className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg font-bold text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                        title="Xem toàn bộ sổ nhận xét của học sinh này"
                      >
                        <History className="w-3 h-3" />
                        <span>Lịch sử</span>
                      </button>
                    )}

                    {canEdit && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(ev)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                          title="Sửa nhận xét"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            openConfirm({
                              title: 'Xóa nhận xét này?',
                              message: `Bạn có chắc chắn muốn xóa nhận xét của học sinh ${ev.studentName} (${ev.periodLabel})?`,
                              confirmText: 'Xóa nhận xét',
                              isDestructive: true,
                              onConfirm: () => deleteEvaluation(ev.id),
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Xóa nhận xét"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. MODAL: ADD / EDIT SINGLE EVALUATION */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden transform animate-in zoom-in-95">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-700 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-teal-200" />
                <h3 className="font-bold text-base sm:text-lg">
                  {editingEval ? 'Chỉnh Sửa Nhận Xét' : `Nhận Xét Học Sinh (${currentPeriodLabel})`}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-xl transition-colors cursor-pointer text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-4 sm:p-6 overflow-y-auto space-y-4">
              {/* Select Student */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Chọn học sinh *
                </label>
                <select
                  required
                  value={formStudentId}
                  onChange={(e) => setFormStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                >
                  {data.students.map((s) => (
                    <option key={s.id} value={s.id}>
                      STT {s.stt}: {s.name} ({s.teamId ? `Tổ ${s.teamId}` : 'Chưa chia tổ'}) — {s.roleTitle}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category & Rating */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Lĩnh vực / Tiêu chí
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  >
                    <option value="Học tập">📚 Học tập</option>
                    <option value="Nề nếp & Kỷ luật">📏 Nề nếp & Kỷ luật</option>
                    <option value="Đạo đức & Ý thức">🤝 Đạo đức & Ý thức</option>
                    <option value="Văn thể mỹ">🎨 Văn thể mỹ</option>
                    <option value="Chung">⭐ Đánh giá chung</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Xếp loại đánh giá
                  </label>
                  <select
                    value={formRating}
                    onChange={(e) => setFormRating(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  >
                    <option value="Xuất sắc">⭐ Xuất sắc</option>
                    <option value="Tốt">✓ Tốt</option>
                    <option value="Khá">Khá</option>
                    <option value="Cần cố gắng">⚠️ Cần cố gắng</option>
                    <option value="Nhắc nhở">🚨 Nhắc nhở</option>
                  </select>
                </div>
              </div>

              {/* Quick Template Chips */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Gợi ý nhận xét mẫu (Bấm để chèn nhanh):
                  </label>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-100">
                  {QUICK_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setFormContent(tmpl.text);
                        setFormCategory(tmpl.category as any);
                        setFormRating(tmpl.rating as any);
                      }}
                      className="text-left text-[11px] px-2.5 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      {tmpl.text}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nội dung nhận xét chi tiết *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Nhập nhận xét về sự tiến bộ, ưu điểm hoặc điểm cần lưu ý..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingEval ? 'Cập nhật' : 'Lưu nhận xét'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: BATCH REMARKS (Nhận xét nhanh theo danh sách tổ/cả lớp) */}
      {isBatchModeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden transform animate-in zoom-in-95">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-800 via-indigo-700 to-teal-700 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>Nhận Xét Nhanh Cả Danh Sách ({currentPeriodLabel})</span>
                </h3>
                <p className="text-xs text-indigo-100">
                  Nhập nhận xét và xếp loại đồng thời cho học sinh {teamFilter !== 'all' ? `Tổ ${teamFilter}` : 'cả lớp'}
                </p>
              </div>
              <button
                onClick={() => setIsBatchModeOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-xl transition-colors cursor-pointer text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100">
              {(teamFilter === 'all' ? data.students : data.students.filter(s => s.teamId === teamFilter)).map((s) => {
                const currentObj = batchRemarks[s.id] || { content: '', rating: 'Tốt', category: 'Chung' };

                return (
                  <div key={s.id} className="py-3 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-start">
                    <div className="sm:col-span-4">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">
                        {s.stt}. {s.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {s.teamId ? `Tổ ${s.teamId}` : 'Chưa gán'} • {s.roleTitle}
                      </div>
                    </div>

                    <div className="sm:col-span-3 flex items-center gap-1.5">
                      <select
                        value={currentObj.rating}
                        onChange={(e) => {
                          setBatchRemarks({
                            ...batchRemarks,
                            [s.id]: { ...currentObj, rating: e.target.value as any }
                          });
                        }}
                        className="w-full px-2.5 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                      >
                        <option value="Xuất sắc">⭐ Xuất sắc</option>
                        <option value="Tốt">✓ Tốt</option>
                        <option value="Khá">Khá</option>
                        <option value="Cần cố gắng">⚠️ Cần cố gắng</option>
                        <option value="Nhắc nhở">🚨 Nhắc nhở</option>
                      </select>
                    </div>

                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        placeholder="Nhập nhận xét về em này..."
                        value={currentObj.content}
                        onChange={(e) => {
                          setBatchRemarks({
                            ...batchRemarks,
                            [s.id]: { ...currentObj, content: e.target.value }
                          });
                        }}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsBatchModeOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveBatchRemarks}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Lưu toàn bộ nhận xét</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: STUDENT REMARKS PORTFOLIO / HISTORY */}
      {historyStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden transform animate-in zoom-in-95">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-700 to-blue-700 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base sm:text-lg">
                  Sổ Nhận Xét Học Sinh: {historyStudent.name}
                </h3>
                <p className="text-xs text-indigo-100">
                  Tổ {historyStudent.teamId || 'Chưa chia'} • STT: {historyStudent.stt} • {historyStudent.roleTitle}
                </p>
              </div>
              <button
                onClick={() => setHistoryStudent(null)}
                className="p-1.5 hover:bg-white/20 rounded-xl transition-colors cursor-pointer text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
              {(() => {
                const studentHistory = (data.evaluations || []).filter(e => e.studentId === historyStudent.id);

                if (studentHistory.length === 0) {
                  return (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      Chưa có lời nhận xét nào được ghi nhận cho học sinh này.
                    </div>
                  );
                }

                return studentHistory.map(ev => {
                  const ratingConf = ev.rating && RATING_CONFIG[ev.rating] ? RATING_CONFIG[ev.rating] : RATING_CONFIG['Tốt'];
                  const RatingIcon = ratingConf.icon;

                  return (
                    <div key={ev.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded-md">
                            {ev.periodLabel}
                          </span>
                          {ev.category && (
                            <span className="text-[11px] text-slate-500">🏷️ {ev.category}</span>
                          )}
                        </div>

                        <span className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${ratingConf.badge}`}>
                          <RatingIcon className="w-3 h-3" />
                          <span>{ratingConf.label}</span>
                        </span>
                      </div>

                      <p className="text-xs text-slate-800 font-medium italic leading-relaxed">
                        "{ev.content}"
                      </p>

                      <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200/60">
                        <span>Người nhận xét: <strong>{ev.authorName}</strong></span>
                        <span>{formatDateVN(ev.createdAt)}</span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  const sId = historyStudent.id;
                  setHistoryStudent(null);
                  handleOpenAdd(sId);
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm nhận xét mới cho em này</span>
              </button>

              <button
                type="button"
                onClick={() => setHistoryStudent(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
