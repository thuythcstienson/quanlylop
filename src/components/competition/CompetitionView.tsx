import React, { useState, useMemo } from 'react';
import { useApp, StudentScoreSummary } from '../../context/AppContext';
import { PointType } from '../../types';
import { 
  Trophy, 
  Search, 
  Filter, 
  Calendar, 
  Award, 
  MinusCircle, 
  PlusCircle, 
  User, 
  X, 
  Trash2, 
  CheckCircle2, 
  Users,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  Sparkles,
  Plus,
  Check
} from 'lucide-react';
import { exportMultiSheetExcel, formatDateVN } from '../../utils/exportUtils';
import { 
  getAcademicWeek, 
  getWeekDateRange, 
  getAcademicWeeksList, 
  getDaysOfWeekForAcademicWeek,
  DAYS_OF_WEEK_VN,
  toISODateString,
  formatDDMMYYYY, 
  parseDateLocal 
} from '../../utils/weekUtils';

export const CompetitionView: React.FC = () => {
  const { 
    data, 
    currentUser, 
    getStudentLeaderboard, 
    getTeamLeaderboard, 
    deleteTransaction, 
    addTransaction,
    clearAllTransactions,
    addRule,
    openConfirm,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'individual' | 'teams'>('individual');
  // 0 means All Weeks, otherwise 1..35
  const [selectedWeek, setSelectedWeek] = useState<number>(() => data.config.currentWeek || 5);
  const [filterTeam, setFilterTeam] = useState<number | 'all'>('all');
  const [searchName, setSearchName] = useState('');
  const [sortBy, setSortBy] = useState<'points' | 'stt' | 'name' | 'violations'>('points');
  const [viewingStudentId, setViewingStudentId] = useState<string | null>(null);
  const [isClearPointsModalOpen, setIsClearPointsModalOpen] = useState(false);

  // Inline Quick Scoring state inside Student Modal
  const [showInlineScoring, setShowInlineScoring] = useState(false);
  const [modalPointType, setModalPointType] = useState<PointType>('tru');
  const [modalRuleId, setModalRuleId] = useState<string>('custom');
  const [modalSaveAsRule, setModalSaveAsRule] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalPoints, setModalPoints] = useState<number>(2);
  const [modalCategory, setModalCategory] = useState<string>('Nề nếp');
  const [modalNotes, setModalNotes] = useState('');
  const [modalDate, setModalDate] = useState<string>(() => toISODateString(new Date()));
  const [modalDayOfWeek, setModalDayOfWeek] = useState<string>('Thứ Bảy');
  const [isSubmittingModalScore, setIsSubmittingModalScore] = useState(false);

  const weeksList = useMemo(() => getAcademicWeeksList(35), []);
  const currentWeekNum = data.config.currentWeek || 5;
  const currentRange = useMemo(() => {
    if (selectedWeek === 0) return { rangeLabel: 'Toàn bộ năm học (Tất cả các tuần)' };
    return getWeekDateRange(selectedWeek);
  }, [selectedWeek]);

  // Counts of students per team
  const teamCounts = useMemo(() => {
    return {
      all: data.students.length,
      1: data.students.filter(s => s.teamId === 1).length,
      2: data.students.filter(s => s.teamId === 2).length,
      3: data.students.filter(s => s.teamId === 3).length,
      4: data.students.filter(s => s.teamId === 4).length,
    };
  }, [data.students]);

  // Days of week for the active modal week
  const modalWeekEffective = selectedWeek === 0 ? currentWeekNum : selectedWeek;
  const modalWeekDays = useMemo(() => getDaysOfWeekForAcademicWeek(modalWeekEffective), [modalWeekEffective]);

  // Handle day select inside modal
  const handleModalDaySelect = (dayIndex: number) => {
    const range = getWeekDateRange(modalWeekEffective);
    const target = new Date(range.startDate);
    const offset = dayIndex === 0 ? 6 : (dayIndex - 1);
    target.setDate(range.startDate.getDate() + offset);
    const iso = toISODateString(target);
    setModalDate(iso);
    setModalDayOfWeek(DAYS_OF_WEEK_VN[dayIndex]);
  };

  // Get student leaderboard for selected week (0 means all weeks)
  const studentScores = useMemo(() => {
    const teamArg = filterTeam === 'all' ? undefined : filterTeam;
    const weekArg = selectedWeek === 0 ? undefined : selectedWeek;
    let scores = getStudentLeaderboard(teamArg, weekArg);

    if (searchName.trim()) {
      const q = searchName.toLowerCase().trim();
      scores = scores.filter(s => 
        s.student.name.toLowerCase().includes(q) ||
        String(s.student.stt).includes(q)
      );
    }

    // Sorting
    if (sortBy === 'stt') {
      return [...scores].sort((a, b) => a.student.stt - b.student.stt);
    } else if (sortBy === 'name') {
      return [...scores].sort((a, b) => a.student.name.localeCompare(b.student.name, 'vi'));
    } else if (sortBy === 'violations') {
      return [...scores].sort((a, b) => b.totalTru - a.totalTru || a.currentPoints - b.currentPoints);
    }

    return scores; // already sorted by points descending
  }, [getStudentLeaderboard, filterTeam, selectedWeek, searchName, sortBy]);

  // Get team leaderboard
  const teamScores = useMemo(() => {
    const weekArg = selectedWeek === 0 ? undefined : selectedWeek;
    return getTeamLeaderboard(weekArg);
  }, [getTeamLeaderboard, selectedWeek]);

  // Quick KPI summaries
  const classAvgScore = useMemo(() => {
    if (studentScores.length === 0) return 100;
    const total = studentScores.reduce((acc, s) => acc + s.currentPoints, 0);
    return (total / studentScores.length).toFixed(1);
  }, [studentScores]);

  const topStudents = useMemo(() => {
    if (studentScores.length === 0) return [];
    const maxScore = Math.max(...studentScores.map(s => s.currentPoints));
    return studentScores.filter(s => s.currentPoints === maxScore);
  }, [studentScores]);

  const topStudent = topStudents[0] || null;
  const topScore = topStudents.length > 0 ? topStudents[0].currentPoints : 100;

  // Xếp hạng cá nhân chuẩn sư phạm với hỗ trợ Đồng Hạng khi bằng điểm nhau
  const rankedStudentScores = useMemo(() => {
    if (sortBy === 'points') {
      let currentRank = 1;
      return studentScores.map((item, idx, arr) => {
        if (idx > 0 && item.currentPoints < arr[idx - 1].currentPoints) {
          currentRank = idx + 1;
        }
        const tiedGroup = arr.filter(o => o.currentPoints === item.currentPoints);
        return {
          ...item,
          rank: currentRank,
          isTied: tiedGroup.length > 1,
          tiedCount: tiedGroup.length,
        };
      });
    }

    // Khi sắp xếp theo tiêu chí khác (STT, tên, vi phạm): vẫn tính đúng thứ hạng thi đua theo điểm số
    const pointsOrder = [...studentScores].sort((a, b) => b.currentPoints - a.currentPoints);
    const rankMap = new Map<string, { rank: number; isTied: boolean; tiedCount: number }>();
    let r = 1;
    pointsOrder.forEach((item, idx, arr) => {
      if (idx > 0 && item.currentPoints < arr[idx - 1].currentPoints) {
        r = idx + 1;
      }
      const tiedGroup = arr.filter(o => o.currentPoints === item.currentPoints);
      rankMap.set(item.student.id, { rank: r, isTied: tiedGroup.length > 1, tiedCount: tiedGroup.length });
    });

    return studentScores.map(item => {
      const info = rankMap.get(item.student.id) || { rank: 1, isTied: false, tiedCount: 1 };
      return {
        ...item,
        rank: info.rank,
        isTied: info.isTied,
        tiedCount: info.tiedCount,
      };
    });
  }, [studentScores, sortBy]);

  const excellentCount = useMemo(() => {
    return studentScores.filter(s => s.currentPoints >= 100).length;
  }, [studentScores]);

  // Details for currently viewed student modal
  const viewingSummary: StudentScoreSummary | undefined = useMemo(() => {
    if (!viewingStudentId) return undefined;
    const weekArg = selectedWeek === 0 ? undefined : selectedWeek;
    const scores = getStudentLeaderboard(undefined, weekArg);
    return scores.find(s => s.student.id === viewingStudentId);
  }, [viewingStudentId, getStudentLeaderboard, selectedWeek]);

  // Save inline score for student
  const handleSaveModalScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingStudentId || !modalTitle.trim()) return;

    setIsSubmittingModalScore(true);

    if (modalSaveAsRule && modalTitle.trim()) {
      try {
        await addRule({
          type: modalPointType,
          title: modalTitle.trim(),
          points: Math.max(1, modalPoints),
          category: (modalCategory as any) || 'Khác',
        });
      } catch (err) {
        console.warn(err);
      }
    }

    const ok = await addTransaction({
      studentId: viewingStudentId,
      type: modalPointType,
      title: modalTitle.trim(),
      points: modalPoints,
      category: modalCategory,
      notes: modalNotes.trim(),
      occurredDate: modalDate,
      dayOfWeek: modalDayOfWeek,
      weekNumber: modalWeekEffective,
    });
    setIsSubmittingModalScore(false);

    if (ok) {
      setModalTitle('');
      setModalNotes('');
      setModalSaveAsRule(false);
      setShowInlineScoring(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-24 space-y-4">
      {/* 1. TOP HEADER & WEEK NAVIGATOR */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                BẢNG TỔNG HỢP THI ĐUA NỀ NẾP & HỌC TẬP
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Năm học 2026–2027 • Bắt đầu: <strong className="text-slate-700">07/09/2026 (Tuần 1)</strong> • Hiện tại: <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">Tuần {currentWeekNum}</span>
              </p>
            </div>
          </div>
        </div>

        {/* WEEK CONTROLS */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Previous week button */}
          <button
            type="button"
            disabled={selectedWeek <= 1}
            onClick={() => setSelectedWeek(prev => Math.max(1, prev - 1))}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Tuần trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Week Dropdown */}
          <div className="flex items-center gap-1.5 bg-indigo-50/80 border border-indigo-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              className="text-xs font-bold text-indigo-900 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value={0}>🌟 Cả học kỳ (Tất cả các tuần)</option>
              {weeksList.map(w => (
                <option key={w.weekNumber} value={w.weekNumber}>
                  Tuần {w.weekNumber} ({w.rangeLabel}){w.weekNumber === currentWeekNum ? ' • Hiện tại' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Next week button */}
          <button
            type="button"
            disabled={selectedWeek >= 35 || selectedWeek === 0}
            onClick={() => setSelectedWeek(prev => Math.min(35, prev + 1))}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Tuần sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Quick jump to current week button */}
          {selectedWeek !== currentWeekNum && (
            <button
              type="button"
              onClick={() => setSelectedWeek(currentWeekNum)}
              className="px-2.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 cursor-pointer shadow-xs transition-colors"
            >
              Về Tuần {currentWeekNum}
            </button>
          )}

          {/* Export Excel button */}
          <button
            type="button"
            onClick={() => exportMultiSheetExcel(data, selectedWeek || undefined)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Xuất Excel</span>
          </button>

          {/* GVCN: Xóa toàn bộ điểm cộng/trừ */}
          {currentUser.role === 'admin' && (
            <button
              type="button"
              onClick={() => setIsClearPointsModalOpen(true)}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Xóa điểm cộng/trừ cho tuần hoặc toàn bộ"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span className="hidden sm:inline">Xóa điểm cộng/trừ</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. SIMPLE KPI METRIC STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Thời gian xem</div>
          <div className="text-base sm:text-lg font-black text-indigo-900 mt-0.5 truncate">
            {selectedWeek === 0 ? 'Cả học kỳ' : `Tuần ${selectedWeek}`}
          </div>
          <div className="text-[11px] text-slate-500 font-medium truncate">
            {currentRange.rangeLabel}
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Điểm trung bình</div>
          <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
            {classAvgScore} <span className="text-xs font-normal text-slate-400">/ 100đ</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">
            Điểm gốc: {data.config.basePoints} điểm
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Dẫn đầu lớp</span>
            {topStudents.length > 1 && (
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-md border border-amber-300">
                Đồng hạng 1 ({topStudents.length} HS)
              </span>
            )}
          </div>
          <div className="text-base sm:text-lg font-black text-amber-600 mt-0.5 truncate" title={topStudents.map(s => s.student.name).join(', ')}>
            {topStudents.length > 1 
              ? `${topStudents.length} học sinh cùng dẫn đầu`
              : (topStudent ? topStudent.student.name : '—')}
          </div>
          <div className="text-[11px] text-slate-500 font-medium truncate" title={topStudents.map(s => s.student.name).join(', ')}>
            🥇 {topScore} điểm {topStudents.length > 1 
              ? `(${topStudents.map(s => s.student.name).slice(0, 2).join(', ')}${topStudents.length > 2 ? ` và ${topStudents.length - 2} bạn khác` : ''})` 
              : `(${topStudent?.rankTitle || 'Xuất sắc'})`}
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sĩ số theo dõi</div>
          <div className="text-base sm:text-lg font-black text-emerald-700 mt-0.5">
            {studentScores.length} <span className="text-xs font-normal text-slate-400">học sinh</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Từ 100đ: {excellentCount} HS ({studentScores.length > 0 ? Math.round((excellentCount / studentScores.length) * 100) : 100}%)
          </div>
        </div>
      </div>

      {/* 3. TABS: CÁ NHÂN vs CÁC TỔ */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('individual')}
          className={`pb-2.5 px-4 font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'individual'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Bảng Điểm Cá Nhân ({studentScores.length} HS)</span>
        </button>

        <button
          onClick={() => setActiveTab('teams')}
          className={`pb-2.5 px-4 font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'teams'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Xếp Hạng 4 Tổ Thi Đua</span>
        </button>
      </div>

      {/* TAB 1: BẢNG TỔNG HỢP CÁ NHÂN (ĐÃ BỐ TRÍ LẠI ĐƠN GIẢN, DỄ NHÌN) */}
      {activeTab === 'individual' && (
        <div className="space-y-3">
          {/* Controls bar: Search + Team Filter + Sort Toggle */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative w-full lg:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm tên học sinh hoặc STT..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Team Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              <span className="text-xs text-slate-400 font-bold shrink-0 hidden sm:inline">Lọc tổ:</span>
              <button
                type="button"
                onClick={() => setFilterTeam('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  filterTeam === 'all'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Cả lớp ({teamCounts.all})
              </button>
              {[1, 2, 3, 4].map(tId => (
                <button
                  key={tId}
                  type="button"
                  onClick={() => setFilterTeam(tId)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    filterTeam === tId
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tổ {tId} ({teamCounts[tId as 1 | 2 | 3 | 4] || 0})
                </button>
              ))}
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center gap-1.5 self-end lg:self-auto shrink-0">
              <span className="text-xs text-slate-400 font-bold">Xếp theo:</span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="px-2.5 py-1 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-700 cursor-pointer"
              >
                <option value="points">Điểm cao nhất ▾</option>
                <option value="stt">Theo số thứ tự (STT)</option>
                <option value="name">Theo tên A - Z</option>
                <option value="violations">Nhiều lỗi vi phạm nhất</option>
              </select>
            </div>
          </div>

          {/* Simple Clean Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 font-bold text-xs uppercase tracking-wider sticky top-0 backdrop-blur-xs z-10">
                    <th className="py-3 px-3 text-center w-14 border border-slate-200">Hạng</th>
                    <th className="py-3 px-2 text-center w-12 border border-slate-200">STT</th>
                    <th className="py-3 px-3 border border-slate-200">Họ và tên</th>
                    <th className="py-3 px-3 text-center w-16 border border-slate-200">Tổ</th>
                    <th className="py-3 px-3 text-center hidden md:table-cell text-slate-500 w-16 border border-slate-200">Gốc</th>
                    <th className="py-3 px-3 text-center text-emerald-800 font-black w-20 border border-slate-200">Cộng (+)</th>
                    <th className="py-3 px-3 text-center text-rose-800 font-black w-20 border border-slate-200">Trừ (-)</th>
                    <th className="py-3 px-3 text-center font-black text-slate-900 bg-slate-200/70 w-24 border border-slate-200">Tổng điểm</th>
                    <th className="py-3 px-3 text-center w-24 border border-slate-200">Xếp loại</th>
                    <th className="py-3 px-3 text-center w-28 border border-slate-200">Chi tiết & Nhập</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedStudentScores.map((item) => {
                    const isTopRank = item.rank <= 3;
                    const rankMedal = item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : item.rank;

                    let rankBadge = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                    if (item.rankTitle === 'Xuất sắc') rankBadge = 'bg-indigo-50 text-indigo-800 border-indigo-200 font-black';
                    else if (item.rankTitle === 'Tốt') rankBadge = 'bg-blue-50 text-blue-800 border-blue-200';
                    else if (item.rankTitle === 'Khá') rankBadge = 'bg-slate-50 text-slate-700 border-slate-200';
                    else if (item.rankTitle === 'Cần cố gắng') rankBadge = 'bg-rose-50 text-rose-800 border-rose-200 font-bold';

                    return (
                      <tr 
                        key={item.student.id} 
                        className={`hover:bg-indigo-50/40 transition-colors ${
                          item.rank === 1 ? 'bg-amber-50/40' : isTopRank ? 'bg-slate-50/70' : 'even:bg-slate-50/30'
                        }`}
                      >
                        {/* Hạng (Hỗ trợ đồng hạng chuẩn sư phạm) */}
                        <td className="py-2.5 px-3 text-center font-black text-sm border border-slate-200/80">
                          {sortBy === 'points' ? (
                            isTopRank ? (
                              <div className="flex flex-col items-center justify-center">
                                <span className="text-base select-none leading-none">{rankMedal}</span>
                                {item.isTied && (
                                  <span className="text-[9px] text-amber-900 font-bold bg-amber-100/90 border border-amber-300 px-1 rounded mt-0.5 leading-tight">
                                    Đồng #{item.rank}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center">
                                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 inline-flex items-center justify-center text-xs font-bold">
                                  {item.rank}
                                </span>
                                {item.isTied && (
                                  <span className="text-[9px] text-slate-400 font-medium">
                                    đồng #{item.rank}
                                  </span>
                                )}
                              </div>
                            )
                          ) : (
                            <div className="flex flex-col items-center justify-center">
                              <span className="text-xs font-bold text-slate-700">#{item.rank}</span>
                              {item.isTied && <span className="text-[9px] text-slate-400">đồng hạng</span>}
                            </div>
                          )}
                        </td>

                        {/* STT */}
                        <td className="py-2.5 px-2 text-center font-bold text-slate-500 text-xs border border-slate-200/80">
                          {item.student.stt}
                        </td>

                        {/* Họ và tên */}
                        <td className="py-2.5 px-3 border border-slate-200/80">
                          <button
                            type="button"
                            onClick={() => setViewingStudentId(item.student.id)}
                            className="font-bold text-slate-900 hover:text-indigo-600 text-left cursor-pointer transition-colors block leading-tight"
                          >
                            {item.student.name}
                          </button>
                          {item.student.roleTitle && item.student.roleTitle !== 'Thành viên' && (
                            <span className="text-[10px] font-semibold text-indigo-600">
                              {item.student.roleTitle}
                            </span>
                          )}
                        </td>

                        {/* Tổ */}
                        <td className="py-2.5 px-3 text-center border border-slate-200/80">
                          {item.student.teamId > 0 ? (
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              item.student.teamId === 1 ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60' :
                              item.student.teamId === 2 ? 'bg-blue-50 text-blue-700 border border-blue-200/60' :
                              item.student.teamId === 3 ? 'bg-amber-50 text-amber-800 border border-amber-200/60' :
                              'bg-orange-50 text-orange-800 border border-orange-200/60'
                            }`}>
                              Tổ {item.student.teamId}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Chưa chia</span>
                          )}
                        </td>

                        {/* Điểm gốc */}
                        <td className="py-2.5 px-3 text-center hidden md:table-cell text-slate-500 text-xs font-mono border border-slate-200/80">
                          {data.config.basePoints}
                        </td>

                        {/* Điểm cộng */}
                        <td className="py-2.5 px-3 text-center font-bold text-emerald-700 font-mono text-sm border border-slate-200/80">
                          {item.totalCong > 0 ? `+${item.totalCong}` : <span className="text-slate-300 font-normal">0</span>}
                        </td>

                        {/* Điểm trừ */}
                        <td className="py-2.5 px-3 text-center font-bold text-rose-700 font-mono text-sm border border-slate-200/80">
                          {item.totalTru > 0 ? `-${item.totalTru}` : <span className="text-slate-300 font-normal">0</span>}
                        </td>

                        {/* Tổng điểm */}
                        <td className="py-2.5 px-3 text-center bg-slate-100/50 border border-slate-200/80">
                          <span className={`font-black text-base font-mono px-2 py-0.5 rounded-lg ${
                            item.currentPoints >= 100 
                              ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/50' 
                              : item.currentPoints >= 95 
                              ? 'text-slate-800 bg-slate-100' 
                              : 'text-rose-700 bg-rose-50 border border-rose-200/50'
                          }`}>
                            {item.currentPoints}
                          </span>
                        </td>

                        {/* Xếp loại */}
                        <td className="py-2.5 px-3 text-center border border-slate-200/80">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full border inline-block ${rankBadge}`}>
                            {item.rankTitle}
                          </span>
                        </td>

                        {/* Thao tác */}
                        <td className="py-2.5 px-3 text-center border border-slate-200/80">
                          <button
                            type="button"
                            onClick={() => {
                              setViewingStudentId(item.student.id);
                              setShowInlineScoring(false);
                            }}
                            className="text-xs px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-indigo-600 hover:text-white font-bold text-slate-700 transition-all cursor-pointer shadow-2xs"
                          >
                            Xem ({item.transactions.length})
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: XẾP HẠNG 4 TỔ (ĐƠN GIẢN, TRỰC QUAN) */}
      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {teamScores.map((team, idx) => (
            <div
              key={team.teamId}
              className={`rounded-2xl border p-4 shadow-xs transition-all flex flex-col justify-between ${
                idx === 0
                  ? 'bg-gradient-to-b from-amber-500/10 via-white to-white border-amber-300 ring-2 ring-amber-300/40'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shadow-xs ${
                      idx === 0 ? 'bg-amber-400 text-amber-950' :
                      idx === 1 ? 'bg-slate-300 text-slate-800' :
                      idx === 2 ? 'bg-amber-700 text-white' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      #{team.rank}
                    </span>
                    <div>
                      <h3 className="font-black text-slate-900 text-base">{team.teamName}</h3>
                      <p className="text-[11px] text-slate-500">
                        TT: <strong>{team.leader?.name || 'Chưa gán'}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-black text-indigo-700 font-mono">{team.avgPoints}</div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">TB / em</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 py-2.5 border-y border-slate-100 text-center text-xs">
                  <div className="bg-slate-50 p-1.5 rounded-lg">
                    <div className="text-slate-400 text-[10px]">Sĩ số</div>
                    <div className="font-bold text-slate-800 mt-0.5">{team.studentCount} HS</div>
                  </div>
                  <div className="bg-emerald-50 p-1.5 rounded-lg">
                    <div className="text-emerald-700 text-[10px]">Cộng</div>
                    <div className="font-bold text-emerald-800 mt-0.5">+{team.totalCong}</div>
                  </div>
                  <div className="bg-rose-50 p-1.5 rounded-lg">
                    <div className="text-rose-700 text-[10px]">Trừ</div>
                    <div className="font-bold text-rose-800 mt-0.5">-{team.totalTru}</div>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">Tổng điểm tổ:</span>
                <span className="font-black text-slate-900 font-mono">{team.totalPoints} đ</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. MODAL CHI TIẾT HỌC SINH ("HỒ SƠ THI ĐUA") */}
      {viewingSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden transform animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-700 to-blue-700 text-white flex items-center justify-between">
              <div>
                <div className="text-xs text-indigo-200 font-semibold uppercase tracking-wider">
                  HỒ SƠ THI ĐUA NỀ NẾP & HỌC TẬP
                </div>
                <h3 className="text-lg sm:text-xl font-black mt-0.5 flex items-center gap-2">
                  <span>{viewingSummary.student.name}</span>
                  <span className="text-xs font-bold px-2 py-0.5 bg-white/20 rounded-md">
                    Tổ {viewingSummary.student.teamId}
                  </span>
                  {viewingSummary.student.roleTitle && viewingSummary.student.roleTitle !== 'Thành viên' && (
                    <span className="text-xs font-bold px-2 py-0.5 bg-amber-400 text-amber-950 rounded-md">
                      {viewingSummary.student.roleTitle}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-indigo-100 mt-0.5">
                  STT: #{viewingSummary.student.stt} • {selectedWeek === 0 ? 'Cả học kỳ' : `Tuần ${selectedWeek} (${currentRange.rangeLabel})`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewingStudentId(null)}
                className="p-1.5 hover:bg-white/20 rounded-xl transition-colors cursor-pointer text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Formula Strip & Quick Score Action Button */}
            <div className="bg-slate-50 border-b border-slate-200 p-3 sm:p-4 space-y-3">
              <div className="grid grid-cols-4 text-center text-xs">
                <div>
                  <div className="text-slate-400 font-medium">Điểm gốc</div>
                  <div className="font-bold text-slate-800 text-sm mt-0.5 font-mono">{viewingSummary.basePoints}</div>
                </div>
                <div>
                  <div className="text-emerald-600 font-medium">Điểm cộng</div>
                  <div className="font-bold text-emerald-600 text-sm mt-0.5 font-mono">+{viewingSummary.totalCong}</div>
                </div>
                <div>
                  <div className="text-rose-600 font-medium">Điểm trừ</div>
                  <div className="font-bold text-rose-600 text-sm mt-0.5 font-mono">-{viewingSummary.totalTru}</div>
                </div>
                <div className="bg-indigo-50/90 rounded-xl py-1">
                  <div className="text-indigo-700 font-bold">Tổng điểm</div>
                  <div className="font-black text-indigo-900 text-base font-mono">{viewingSummary.currentPoints}</div>
                </div>
              </div>

              {/* Toggle Inline Quick Scoring Button */}
              {currentUser.role !== 'phu_huynh' && (
                <div className="pt-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowInlineScoring(!showInlineScoring)}
                    className="w-full py-2 px-3 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{showInlineScoring ? 'Đóng form ghi điểm' : 'Ghi nhận điểm / trừ điểm nhanh cho em này'}</span>
                  </button>
                </div>
              )}

              {/* Inline Quick Scoring Form */}
              {showInlineScoring && (
                <form onSubmit={handleSaveModalScore} className="p-3 bg-white border border-indigo-200 rounded-2xl shadow-xs space-y-3 animate-in zoom-in-95">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 pb-1 border-b border-slate-100">
                    <span className="flex items-center gap-1 text-indigo-700">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Nhập điểm nhanh: {viewingSummary.student.name}</span>
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Tuần {modalWeekEffective}
                    </span>
                  </div>

                  {/* 3 tabs: Trừ / Cộng / Biểu dương */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => { setModalPointType('tru'); setModalCategory('Nề nếp'); setModalPoints(2); }}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        modalPointType === 'tru' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Trừ lỗi (-)
                    </button>
                    <button
                      type="button"
                      onClick={() => { setModalPointType('cong'); setModalCategory('Học tập'); setModalPoints(1); }}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        modalPointType === 'cong' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Cộng điểm (+)
                    </button>
                    <button
                      type="button"
                      onClick={() => { setModalPointType('bieu_duong'); setModalCategory('Học tập'); setModalPoints(3); }}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        modalPointType === 'bieu_duong' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Biểu dương
                    </button>
                  </div>

                  {/* Day of Week Selection (Thứ 2 .. Chủ Nhật) */}
                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
                      <span>Chọn thứ trong tuần:</span>
                      <span className="text-indigo-700 font-bold">{modalDayOfWeek} ({modalDate})</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {modalWeekDays.map(d => (
                        <button
                          key={d.dateStr}
                          type="button"
                          onClick={() => handleModalDaySelect(d.dayIndex)}
                          className={`py-1 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                            modalDate === d.dateStr
                              ? 'bg-indigo-600 text-white ring-1 ring-indigo-400'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          <div>{d.shortDay}</div>
                          <div className="text-[9px] opacity-80">{d.displayDate}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preset Rules or Custom Reason Selector */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Chọn lý do từ quy chế hoặc nhập tự do:</label>
                    <select
                      value={modalRuleId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setModalRuleId(id);
                        if (id === 'custom') {
                          setModalTitle('');
                        } else {
                          const r = data.rules.find(rule => rule.id === id);
                          if (r) {
                            setModalTitle(r.title);
                            setModalPoints(r.points);
                            setModalCategory(r.category);
                          }
                        }
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="custom">-- Nhập lý do riêng / lý do khác ngoài danh sách --</option>
                      {data.rules.filter(r => r.type === modalPointType).map(r => (
                        <option key={r.id} value={r.id}>
                          {r.title} ({modalPointType === 'tru' ? `-${r.points}đ` : `+${r.points}đ`} • {r.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Title & Points row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600">Nội dung ghi nhận:</label>
                      <input
                        type="text"
                        placeholder="VD: Đi học muộn, Phát biểu bài..."
                        value={modalTitle}
                        onChange={(e) => {
                          setModalTitle(e.target.value);
                          if (modalRuleId !== 'custom') setModalRuleId('custom');
                        }}
                        required
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600">Số điểm:</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={modalPoints}
                        onChange={(e) => setModalPoints(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Category & Save as Rule Checkbox (when custom title is typed) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-[11px] text-slate-500">Lĩnh vực:</span>
                      <select
                        value={modalCategory}
                        onChange={(e) => setModalCategory(e.target.value)}
                        className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                      >
                        <option value="Học tập">Học tập</option>
                        <option value="Nề nếp">Nề nếp</option>
                        <option value="Văn thể mỹ">Văn thể mỹ</option>
                        <option value="Vệ sinh - Trực nhật">Vệ sinh</option>
                        <option value="Hoạt động chung">Chung</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>

                    {modalTitle.trim() && modalRuleId === 'custom' && (
                      <label className="flex items-center gap-1.5 text-[11px] text-indigo-700 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={modalSaveAsRule}
                          onChange={(e) => setModalSaveAsRule(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span>Lưu thành quy chế chung của lớp</span>
                      </label>
                    )}
                  </div>

                  {/* Submit */}
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowInlineScoring(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingModalScore || !modalTitle.trim()}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingModalScore ? 'Đang lưu...' : 'Lưu ghi nhận ngay'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Transactions History List */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                <span>Nhật ký ghi nhận ({viewingSummary.transactions.length} lượt)</span>
                <span className="text-[11px] text-slate-400 font-normal">Hiển thị thứ, ngày và người nhập</span>
              </div>

              {viewingSummary.transactions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-60" />
                  <span>Chưa có ghi nhận cộng hoặc trừ điểm nào trong tuần này.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {viewingSummary.transactions.map((t) => (
                    <div
                      key={t.id}
                      className={`p-3 rounded-2xl border text-xs flex items-start justify-between gap-3 ${
                        t.type === 'tru'
                          ? 'bg-rose-50/50 border-rose-200'
                          : t.type === 'cong'
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-amber-50/50 border-amber-200'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-black text-sm font-mono px-2 py-0.2 rounded ${
                            t.type === 'tru'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {t.points > 0 ? `+${t.points}` : t.points}đ
                          </span>
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">
                            {t.title}
                          </span>
                          <span className="bg-white border border-slate-200 text-slate-600 px-1.5 py-0.2 rounded text-[10px]">
                            {t.category}
                          </span>
                        </div>

                        {t.notes && (
                          <p className="text-slate-600 text-xs italic bg-white/70 p-1.5 rounded-lg border border-slate-200/50">
                            &quot;{t.notes}&quot;
                          </p>
                        )}

                        <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-0.5">
                          <span className="font-semibold text-indigo-700">
                            {t.dayOfWeek ? `${t.dayOfWeek}` : ''} {t.occurredDate ? `(${formatDateVN(t.occurredDate)})` : formatDateVN(t.createdAt)}
                          </span>
                          <span>• Tuần {t.weekNumber}</span>
                          <span>• Người nhập: <strong>{t.createdByName}</strong></span>
                        </div>
                      </div>

                      {currentUser.role === 'admin' && (
                        <button
                          type="button"
                          onClick={() => {
                            openConfirm({
                              title: 'Xóa giao dịch điểm này?',
                              message: `Bạn muốn xóa: ${t.title} (${t.points > 0 ? '+' : ''}${t.points}đ) của học sinh ${t.studentName}?`,
                              confirmText: 'Xóa',
                              isDestructive: true,
                              onConfirm: () => deleteTransaction(t.id),
                            });
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Xóa giao dịch này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingStudentId(null)}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: XÓA TOÀN BỘ ĐIỂM CỘNG/TRỪ DÀNH CHO GVCN */}
      {isClearPointsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Xóa Điểm Cộng / Trừ Thi Đua</h3>
                  <p className="text-xs text-slate-500">Chức năng quản trị dành riêng cho Giáo viên chủ nhiệm</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsClearPointsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có thể xóa toàn bộ điểm cộng/trừ của tuần hiện tại để chấm lại, hoặc xóa trắng điểm của tất cả các tuần để bắt đầu chu kỳ tính điểm mới.
            </p>

            <div className="space-y-3">
              {/* Option 1: Xóa điểm theo tuần đang chọn */}
              <div className="p-4 rounded-2xl border-2 border-slate-200 hover:border-amber-300 bg-slate-50/70 hover:bg-amber-50/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span>Xóa toàn bộ điểm Tuần {selectedWeek === 0 ? currentWeekNum : selectedWeek}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Chỉ xóa các lượt chấm điểm trong Tuần {selectedWeek === 0 ? currentWeekNum : selectedWeek}. Các tuần khác giữ nguyên.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const targetW = selectedWeek === 0 ? currentWeekNum : selectedWeek;
                    openConfirm({
                      title: `Xác nhận xóa điểm Tuần ${targetW}?`,
                      message: `Bạn có chắc muốn xóa TOÀN BỘ điểm cộng và trừ trong Tuần ${targetW}? Thao tác này không thể hoàn tác!`,
                      confirmText: `Xóa điểm Tuần ${targetW}`,
                      isDestructive: true,
                      onConfirm: async () => {
                        await clearAllTransactions(targetW);
                        setIsClearPointsModalOpen(false);
                      },
                    });
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                >
                  Xóa Tuần {selectedWeek === 0 ? currentWeekNum : selectedWeek}
                </button>
              </div>

              {/* Option 2: Xóa toàn bộ tất cả các tuần */}
              <div className="p-4 rounded-2xl border-2 border-rose-200 hover:border-rose-400 bg-rose-50/40 hover:bg-rose-50/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-rose-950 text-sm flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>Xóa sạch điểm TẤT CẢ các tuần</span>
                  </div>
                  <div className="text-xs text-rose-800/80 mt-0.5">
                    Xóa sạch toàn bộ giao dịch. Toàn bộ học sinh về 100 điểm gốc ban đầu.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    openConfirm({
                      title: 'XÓA SẠCH TOÀN BỘ ĐIỂM TẤT CẢ CÁC TUẦN?',
                      message: 'Bạn có chắc chắn muốn xóa TOÀN BỘ điểm cộng và trừ của TẤT CẢ các tuần trong năm học? Tất cả học sinh sẽ trở về 100 điểm ban đầu. Thao tác này KHÔNG thể hoàn tác!',
                      confirmText: 'Xóa sạch tất cả các tuần',
                      isDestructive: true,
                      onConfirm: async () => {
                        await clearAllTransactions('all');
                        setIsClearPointsModalOpen(false);
                      },
                    });
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                >
                  Xóa toàn bộ
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsClearPointsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
