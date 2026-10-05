import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  FileText, 
  FileSpreadsheet, 
  Printer, 
  Calendar, 
  Award, 
  AlertTriangle, 
  Edit3, 
  ListFilter,
  CheckCircle2,
  Users,
  ShieldCheck,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { exportMultiSheetExcel, exportToWordDoc } from '../../utils/exportUtils';
import { getWeekDateRange } from '../../utils/weekUtils';

type ReportScope = 'week' | 'month' | 'semester';
type StudentViewMode = 'all' | 'by_team' | 'top_bottom';

export const ReportsView: React.FC = () => {
  const { data, getTeamLeaderboard, getStudentLeaderboard, showToast } = useApp();

  // Control state
  const [reportScope, setReportScope] = useState<ReportScope>('week');
  const [selectedWeek, setSelectedWeek] = useState<number>(data.config.currentWeek || 5);
  const [selectedMonth, setSelectedMonth] = useState<number>(data.config.currentMonth || 10);
  const [selectedSemester, setSelectedSemester] = useState<'HK1' | 'HK2' | 'CaNam'>('HK1');
  const [studentViewMode, setStudentViewMode] = useState<StudentViewMode>('all');
  const [studentSortBy, setStudentSortBy] = useState<'rank' | 'stt'>('rank');

  const [teacherNotes, setTeacherNotes] = useState<string>(
    'Tuần qua đa số học sinh lớp 9A1 chấp hành nghiêm túc nội quy nề nếp của nhà trường. 100% học sinh đeo khăn quàng đỏ, trang phục đúng quy định. Ban cán sự lớp và các tổ trưởng hoạt động tích cực, duy trì tốt kỷ cương nề nếp. Cần tiếp tục đôn đốc một số bạn hay đi học sát giờ và nhắc nhở làm bài tập về nhà đầy đủ trước khi đến lớp.'
  );

  // Quick preset notes
  const presetNotes = [
    {
      label: 'Nề nếp tốt & Chăm ngoan',
      text: 'Đa số học sinh chấp hành nghiêm túc nội quy nề nếp, trang phục đúng quy định. 100% học sinh chuẩn bị bài chu đáo trước khi đến lớp. Ban cán sự lớp và các tổ trưởng hoạt động rất trách nhiệm, gương mẫu.'
    },
    {
      label: 'Đôn đốc chuyên cần & bài vở',
      text: 'Nề nếp lớp cơ bản ổn định, tuy nhiên còn một vài học sinh đi học sát giờ và quên làm bài tập về nhà môn Tiếng Anh và Toán. Yêu cầu các tổ trưởng tăng cường kiểm tra 15 phút đầu giờ và đôn đốc các bạn.'
    },
    {
      label: 'Cao điểm thi đua 20-11',
      text: 'Toàn thể học sinh lớp 9A1 tích cực hưởng ứng đợt thi đua cao điểm chào mừng ngày Nhà giáo Việt Nam 20-11: Giữ vững hoa điểm 10, vệ sinh lớp sạch sẽ, tập luyện văn nghệ sôi nổi, giữ vững vị trí dẫn đầu toàn trường.'
    }
  ];

  // Dynamic Class Monitor
  const classMonitorName = useMemo(() => {
    return data.students.find(s => s.roleTitle?.toLowerCase().includes('lớp trưởng'))?.name || 'Tạ Thục Quyên';
  }, [data.students]);

  // Date range for current week
  const weekDateRange = useMemo(() => {
    return getWeekDateRange(selectedWeek);
  }, [selectedWeek]);

  // Title description based on scope
  const reportSubtitle = useMemo(() => {
    if (reportScope === 'week') {
      return `TUẦN THỨ ${selectedWeek} (${weekDateRange.rangeLabel} • NĂM HỌC ${data.config.schoolYear})`;
    }
    if (reportScope === 'month') {
      return `TỔNG KẾT THÁNG ${selectedMonth} (NĂM HỌC ${data.config.schoolYear})`;
    }
    return selectedSemester === 'HK1' 
      ? `SƠ KẾT HỌC KỲ I (NĂM HỌC ${data.config.schoolYear})` 
      : selectedSemester === 'HK2' 
        ? `SƠ KẾT HỌC KỲ II (NĂM HỌC ${data.config.schoolYear})` 
        : `TỔNG KẾT CẢ NĂM HỌC ${data.config.schoolYear}`;
  }, [reportScope, selectedWeek, selectedMonth, selectedSemester, weekDateRange, data.config.schoolYear]);

  // Standings data based on scope
  const targetWeekFilter = reportScope === 'week' ? selectedWeek : undefined;

  const teamScores = useMemo(() => {
    return getTeamLeaderboard(targetWeekFilter);
  }, [getTeamLeaderboard, targetWeekFilter]);

  const rawStudentScores = useMemo(() => {
    return getStudentLeaderboard(undefined, targetWeekFilter);
  }, [getStudentLeaderboard, targetWeekFilter]);

  // Rank calculations with ties
  let curRank = 1;
  const rankedStudentScores = useMemo(() => {
    return rawStudentScores.map((item, idx, arr) => {
      if (idx > 0 && item.currentPoints < arr[idx - 1].currentPoints) {
        curRank = idx + 1;
      }
      const isTied = arr.filter(o => o.currentPoints === item.currentPoints).length > 1;
      return {
        ...item,
        rank: curRank,
        isTied,
      };
    });
  }, [rawStudentScores]);

  // Sorted students according to view control
  const displayStudentScores = useMemo(() => {
    if (studentSortBy === 'stt') {
      return [...rankedStudentScores].sort((a, b) => a.student.stt - b.student.stt);
    }
    return rankedStudentScores;
  }, [rankedStudentScores, studentSortBy]);

  // Commendations list in period
  const commendationList = useMemo(() => {
    return data.transactions.filter(t => {
      if (t.status !== 'approved') return false;
      if (reportScope === 'week' && t.weekNumber !== selectedWeek) return false;
      if (reportScope === 'month' && t.month !== selectedMonth) return false;
      return t.type === 'bieu_duong' || (t.type === 'cong' && t.points >= 2);
    }).slice(0, 15);
  }, [data.transactions, reportScope, selectedWeek, selectedMonth]);

  // Warnings / Violations list in period
  const violationList = useMemo(() => {
    return data.transactions.filter(t => {
      if (t.status !== 'approved') return false;
      if (reportScope === 'week' && t.weekNumber !== selectedWeek) return false;
      if (reportScope === 'month' && t.month !== selectedMonth) return false;
      return t.type === 'tru';
    }).slice(0, 15);
  }, [data.transactions, reportScope, selectedWeek, selectedMonth]);

  // Category statistics
  const categoryStats = useMemo(() => {
    const categories = [
      { key: 'hoc_tap', name: 'Học tập & Chuẩn bị bài' },
      { key: 'ne_nep', name: 'Nề nếp, Chuyên cần & Trang phục' },
      { key: 've_sinh', name: 'Vệ sinh & Trực nhật lớp' },
      { key: 'phong_trao', name: 'Văn thể mỹ & Hoạt động phong trào' }
    ];

    const periodTxs = data.transactions.filter(t => {
      if (t.status !== 'approved') return false;
      if (reportScope === 'week' && t.weekNumber !== selectedWeek) return false;
      if (reportScope === 'month' && t.month !== selectedMonth) return false;
      return true;
    });

    return categories.map((cat, idx) => {
      const matchedTxs = periodTxs.filter(t => {
        const catStr = (t.category || '').toLowerCase();
        if (cat.key === 'hoc_tap') return catStr.includes('học tập');
        if (cat.key === 'ne_nep') return catStr.includes('nề nếp') || catStr.includes('kỷ luật');
        if (cat.key === 've_sinh') return catStr.includes('vệ sinh') || catStr.includes('lao động') || catStr.includes('trực nhật');
        return catStr.includes('văn thể') || catStr.includes('chung') || catStr.includes('phong trào');
      });

      const congCount = matchedTxs.filter(t => t.type === 'cong' || t.type === 'bieu_duong').length;
      const truCount = matchedTxs.filter(t => t.type === 'tru').length;
      const netPoints = matchedTxs.reduce((sum, t) => sum + t.points, 0);
      const assessment = truCount === 0 ? 'Xuất sắc (100%)' : truCount <= 2 ? 'Tốt (95%)' : 'Cần đôn đốc';

      return {
        stt: idx + 1,
        name: cat.name,
        congCount,
        truCount,
        netPoints,
        assessment,
      };
    });
  }, [data.transactions, reportScope, selectedWeek, selectedMonth]);

  // Class aggregates
  const classTotalStudents = data.students.length;
  const classTotalCong = useMemo(() => rawStudentScores.reduce((acc, s) => acc + s.totalCong, 0), [rawStudentScores]);
  const classTotalTru = useMemo(() => rawStudentScores.reduce((acc, s) => acc + s.totalTru, 0), [rawStudentScores]);
  const classTotalSum = useMemo(() => rawStudentScores.reduce((acc, s) => acc + s.currentPoints, 0), [rawStudentScores]);
  const classAvgScore = classTotalStudents > 0 ? (classTotalSum / classTotalStudents).toFixed(2) : '100.00';

  // Export handlers
  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    exportMultiSheetExcel(data, selectedWeek);
    showToast(`Đã xuất file Excel đa sheet Tuần ${selectedWeek}!`, 'success');
  };

  const handleExportWord = () => {
    exportToWordDoc(data, {
      weekNumber: selectedWeek,
      month: selectedMonth,
      teacherNotes,
      classMonitor: classMonitorName,
    });
    showToast(`Đã xuất file Word Báo cáo thi đua Tuần ${selectedWeek}!`, 'success');
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 pb-28 space-y-6">
      {/* Top Banner & Export Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-indigo-900/50 no-print">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-xs rounded-full text-xs font-semibold mb-2 text-indigo-200">
            <FileText className="w-3.5 h-3.5" />
            <span>Hệ Thống Báo Cáo & Bảng Biểu Thi Đua</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            BÁO CÁO THI ĐUA NỀ NẾP LỚP 9A1
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Kẻ khung bảng chuẩn mực hành chính sư phạm, cân đối cột số liệu, đồng bộ 41 học sinh và 4 tổ. Hỗ trợ xuất file Excel đa sheet và bản in Word chuẩn quy cách.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer hover:shadow-lg"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Excel 6 Sheet</span>
          </button>

          <button
            onClick={handleExportWord}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer hover:shadow-lg"
          >
            <FileText className="w-4 h-4" />
            <span>Xuất Báo Cáo Word</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs sm:text-sm font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer"
            title="In trực tiếp hoặc Lưu file PDF (Phím tắt: Ctrl + P)"
          >
            <Printer className="w-4 h-4 text-indigo-600" />
            <span>In Báo Cáo (PDF)</span>
          </button>
        </div>
      </div>

      {/* Control Panel: Filters & Presets */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Scope Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              1. Phạm vi thời gian
            </label>
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setReportScope('week')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  reportScope === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Theo Tuần
              </button>
              <button
                type="button"
                onClick={() => setReportScope('month')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  reportScope === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Theo Tháng
              </button>
              <button
                type="button"
                onClick={() => setReportScope('semester')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  reportScope === 'semester' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Theo Học Kỳ
              </button>
            </div>
          </div>

          {/* Time Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              2. Chọn mốc thời gian
            </label>
            {reportScope === 'week' && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs sm:text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {Array.from({ length: 35 }, (_, i) => i + 1).map(w => (
                    <option key={w} value={w}>
                      Tuần {w} {w === data.config.currentWeek ? '⭐ (Tuần hiện tại)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {reportScope === 'month' && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs sm:text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {[9, 10, 11, 12, 1, 2, 3, 4, 5].map(m => (
                    <option key={m} value={m}>
                      Tháng {m} {m === data.config.currentMonth ? '(Tháng hiện tại)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {reportScope === 'semester' && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs sm:text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="HK1">Học kỳ I (Tuần 1 - Tuần 18)</option>
                  <option value="HK2">Học kỳ II (Tuần 19 - Tuần 35)</option>
                  <option value="CaNam">Cả năm học 2026 - 2027</option>
                </select>
              </div>
            )}
          </div>

          {/* Student Table View Mode */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              3. Chế độ xem danh sách HS
            </label>
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setStudentViewMode('all')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  studentViewMode === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Đầy đủ 41 HS
              </button>
              <button
                type="button"
                onClick={() => setStudentViewMode('by_team')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  studentViewMode === 'by_team' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Chia theo 4 Tổ
              </button>
              <button
                type="button"
                onClick={() => setStudentViewMode('top_bottom')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  studentViewMode === 'top_bottom' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Top Tiêu Biểu
              </button>
            </div>
          </div>
        </div>

        {/* Teacher Comments Editor with Presets */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Edit3 className="w-4 h-4 text-indigo-600" />
              <span>Nhận Xét & Chỉ Đạo Của Giáo Viên Chủ Nhiệm (In vào văn bản)</span>
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Gợi ý mẫu:</span>
              {presetNotes.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTeacherNotes(p.text)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <textarea
            rows={2}
            value={teacherNotes}
            onChange={(e) => setTeacherNotes(e.target.value)}
            placeholder="Nhập nội dung nhận xét của GVCN về nề nếp, học tập và phương hướng tuần tới..."
            className="w-full p-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-sans"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LIVE PREVIEW PAPER (OFFICIAL VIETNAMESE SCHOOL PEDAGOGICAL DOCUMENT STYLE) */}
      {/* ========================================================================= */}
      <div 
        id="printable-report"
        className="bg-white rounded-3xl border border-slate-300 shadow-lg p-6 sm:p-10 space-y-7 text-slate-900 font-sans print:shadow-none print:border-none print:p-0 print:m-0"
      >
        {/* Document Letterhead (Tiêu ngữ & Quốc hiệu chuẩn quy chuẩn hành chính) */}
        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-300 print:border-black">
          {/* Cột trái: Đơn vị quản lý */}
          <div className="text-center">
            <div className="text-xs font-semibold uppercase tracking-tight text-slate-700 print:text-black">
              UBND PHƯỜNG VÂN HÀ
            </div>
            <div className="text-sm font-black uppercase tracking-tight text-slate-900 print:text-black">
              TRƯỜNG THCS VÂN HÀ 2
            </div>
            <div className="text-xs font-semibold text-slate-800 print:text-black">
              Lớp 9A1 • Năm học {data.config.schoolYear}
            </div>
            <div className="w-24 h-0.5 bg-slate-900 print:bg-black mx-auto mt-1" />
          </div>

          {/* Cột phải: Quốc hiệu & Tiêu ngữ */}
          <div className="text-center">
            <div className="text-xs font-black uppercase text-slate-900 print:text-black">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </div>
            <div className="text-xs font-bold text-slate-800 print:text-black">
              Độc lập – Tự do – Hạnh phúc
            </div>
            <div className="w-32 h-0.5 bg-slate-900 print:bg-black mx-auto mt-1" />
          </div>
        </div>

        {/* Title & Metadata */}
        <div className="text-center space-y-1">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight print:text-xl print:text-black">
            BÁO CÁO THI ĐUA NỀ NẾP & HỌC TẬP
          </h3>
          <p className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider print:text-xs">
            {reportSubtitle}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1 text-xs text-slate-600 print:text-slate-800 italic">
            <span><strong>Giáo viên chủ nhiệm:</strong> {data.config.teacherName}</span>
            <span>•</span>
            <span><strong>Lớp trưởng:</strong> {classMonitorName}</span>
            <span>•</span>
            <span><strong>Sĩ số:</strong> {classTotalStudents} học sinh</span>
            <span>•</span>
            <span><strong>Điểm chuẩn đầu kỳ:</strong> 100 điểm</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MỤC I: BẢNG TỔNG HỢP XẾP HẠNG THI ĐUA 4 TỔ (KẺ KHUNG ĐẦY ĐỦ) */}
        {/* ========================================================= */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-sm uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <span>I. Bảng Xếp Hạng Thi Đua Các Tổ</span>
            </h4>
            <span className="text-[11px] text-slate-500 italic no-print">Đánh giá trung bình theo sĩ số</span>
          </div>

          <div className="overflow-x-auto">
            <table className="report-table w-full text-xs border-collapse border border-slate-400 print:border-black">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold print:bg-slate-100">
                  <th className="border border-slate-400 print:border-black py-2.5 px-2 text-center w-14 uppercase">
                    Hạng
                  </th>
                  <th className="border border-slate-400 print:border-black py-2.5 px-3 text-left w-24 uppercase">
                    Tên Tổ
                  </th>
                  <th className="border border-slate-400 print:border-black py-2.5 px-3 text-left uppercase">
                    Tổ trưởng
                  </th>
                  <th className="border border-slate-400 print:border-black py-2.5 px-2 text-center w-16 uppercase">
                    Sĩ số
                  </th>
                  <th className="border border-slate-400 print:border-black py-2.5 px-2 text-center w-24 uppercase text-emerald-800 print:text-black">
                    Điểm cộng (+)
                  </th>
                  <th className="border border-slate-400 print:border-black py-2.5 px-2 text-center w-24 uppercase text-rose-800 print:text-black">
                    Điểm trừ (-)
                  </th>
                  <th className="border border-slate-400 print:border-black py-2.5 px-2 text-center w-24 uppercase font-black text-slate-900 print:text-black">
                    Tổng điểm
                  </th>
                  <th className="border border-slate-400 print:border-black py-2.5 px-2 text-center w-24 uppercase font-black bg-slate-200/80 text-slate-900 print:text-black">
                    Điểm TB
                  </th>
                  <th className="border border-slate-400 print:border-black py-2.5 px-2 text-center w-24 uppercase">
                    Xếp loại
                  </th>
                </tr>
              </thead>
              <tbody>
                {teamScores.map((t, idx) => {
                  const rankIcon = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1;
                  const rankBadge = t.avgPoints >= 105 ? 'Xuất sắc' : t.avgPoints >= 95 ? 'Tốt' : t.avgPoints >= 85 ? 'Khá' : 'Cần cố gắng';
                  
                  return (
                    <tr 
                      key={t.teamId} 
                      className={idx === 0 ? 'bg-amber-50/50 print:bg-transparent font-semibold' : 'even:bg-slate-50/50 print:bg-transparent'}
                    >
                      <td className="border border-slate-300 print:border-black py-2 px-2 text-center font-black text-sm">
                        {rankIcon}
                      </td>
                      <td className="border border-slate-300 print:border-black py-2 px-3 font-bold text-slate-900">
                        {t.teamName}
                      </td>
                      <td className="border border-slate-300 print:border-black py-2 px-3 text-slate-800">
                        {t.leader?.name || '—'}
                      </td>
                      <td className="border border-slate-300 print:border-black py-2 px-2 text-center font-mono">
                        {t.studentCount}
                      </td>
                      <td className="border border-slate-300 print:border-black py-2 px-2 text-center font-bold text-emerald-700 print:text-black font-mono">
                        +{t.totalCong}
                      </td>
                      <td className="border border-slate-300 print:border-black py-2 px-2 text-center font-bold text-rose-700 print:text-black font-mono">
                        -{t.totalTru}
                      </td>
                      <td className="border border-slate-300 print:border-black py-2 px-2 text-center font-bold text-slate-900 font-mono">
                        {t.totalPoints}
                      </td>
                      <td className="border border-slate-300 print:border-black py-2 px-2 text-center font-black text-slate-900 bg-slate-100/70 print:bg-transparent font-mono text-sm">
                        {t.avgPoints}
                      </td>
                      <td className="border border-slate-300 print:border-black py-2 px-2 text-center font-bold">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${
                          rankBadge === 'Xuất sắc' ? 'text-indigo-800 bg-indigo-50 font-black' :
                          rankBadge === 'Tốt' ? 'text-emerald-800 bg-emerald-50' :
                          rankBadge === 'Khá' ? 'text-slate-800 bg-slate-100' : 'text-rose-800 bg-rose-50'
                        }`}>
                          {rankBadge}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {/* Hàng tổng cộng lớp */}
                <tr className="bg-slate-100 print:bg-slate-100 font-black text-slate-900 border-t-2 border-slate-400 print:border-black">
                  <td className="border border-slate-400 print:border-black py-2.5 px-2 text-center uppercase">
                    Tổng
                  </td>
                  <td className="border border-slate-400 print:border-black py-2.5 px-3 uppercase">
                    Toàn lớp 9A1
                  </td>
                  <td className="border border-slate-400 print:border-black py-2.5 px-3">
                    Ban cán sự lớp
                  </td>
                  <td className="border border-slate-400 print:border-black py-2.5 px-2 text-center font-mono">
                    {classTotalStudents}
                  </td>
                  <td className="border border-slate-400 print:border-black py-2.5 px-2 text-center text-emerald-800 print:text-black font-mono">
                    +{classTotalCong}
                  </td>
                  <td className="border border-slate-400 print:border-black py-2.5 px-2 text-center text-rose-800 print:text-black font-mono">
                    -{classTotalTru}
                  </td>
                  <td className="border border-slate-400 print:border-black py-2.5 px-2 text-center font-mono">
                    {classTotalSum}
                  </td>
                  <td className="border border-slate-400 print:border-black py-2.5 px-2 text-center font-mono text-sm bg-slate-200/80">
                    {classAvgScore}
                  </td>
                  <td className="border border-slate-400 print:border-black py-2.5 px-2 text-center uppercase text-emerald-800">
                    Đạt chuẩn
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MỤC II: BẢNG ĐIỂM CHI TIẾT 41 HỌC SINH TOÀN LỚP (CĂN CHỈNH KHOA HỌC & CÂN ĐỐI) */}
        {/* ========================================================================= */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="font-black text-sm uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <span>II. Bảng Điểm Thi Đua Chi Tiết 41 Học Sinh</span>
            </h4>

            {/* Toggle Sort / View mode controls (hidden in print) */}
            <div className="flex items-center gap-2 no-print">
              <span className="text-[11px] text-slate-500 font-medium">Sắp xếp:</span>
              <button
                type="button"
                onClick={() => setStudentSortBy('rank')}
                className={`px-2 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                  studentSortBy === 'rank' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Theo Thứ hạng
              </button>
              <button
                type="button"
                onClick={() => setStudentSortBy('stt')}
                className={`px-2 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                  studentSortBy === 'stt' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Theo STT (1..41)
              </button>
            </div>
          </div>

          {studentViewMode === 'by_team' ? (
            /* Chế độ xem theo 4 Tổ */
            <div className="space-y-4">
              {[1, 2, 3, 4].map(tId => {
                const teamStudents = displayStudentScores.filter(s => s.student.teamId === tId);
                return (
                  <div key={tId} className="space-y-1">
                    <div className="font-bold text-xs text-indigo-900 print:text-black uppercase">
                      Tổ {tId} (Sĩ số: {teamStudents.length} học sinh)
                    </div>
                    <div className="overflow-x-auto">
                      <table className="report-table w-full text-xs border-collapse border border-slate-400 print:border-black">
                        <thead>
                          <tr className="bg-slate-100 text-slate-900 font-bold">
                            <th className="border border-slate-400 print:border-black py-2 px-1 text-center w-12 uppercase">STT</th>
                            <th className="border border-slate-400 print:border-black py-2 px-3 text-left uppercase">Họ và tên</th>
                            <th className="border border-slate-400 print:border-black py-2 px-2 text-center w-24 uppercase">Chức vụ</th>
                            <th className="border border-slate-400 print:border-black py-2 px-2 text-center w-16 uppercase text-emerald-800">Cộng (+)</th>
                            <th className="border border-slate-400 print:border-black py-2 px-2 text-center w-16 uppercase text-rose-800">Trừ (-)</th>
                            <th className="border border-slate-400 print:border-black py-2 px-2 text-center w-20 uppercase font-black">Điểm</th>
                            <th className="border border-slate-400 print:border-black py-2 px-2 text-center w-14 uppercase">Hạng</th>
                            <th className="border border-slate-400 print:border-black py-2 px-2 text-center w-20 uppercase">Xếp loại</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teamStudents.map((item) => (
                            <tr key={item.student.id} className="even:bg-slate-50/50 print:bg-transparent">
                              <td className="border border-slate-300 print:border-black py-1.5 px-1 text-center font-bold text-slate-500">
                                {item.student.stt}
                              </td>
                              <td className="border border-slate-300 print:border-black py-1.5 px-3 font-bold text-slate-900">
                                {item.student.name}
                              </td>
                              <td className="border border-slate-300 print:border-black py-1.5 px-2 text-center text-slate-600">
                                {item.student.roleTitle || 'Thành viên'}
                              </td>
                              <td className="border border-slate-300 print:border-black py-1.5 px-2 text-center font-bold text-emerald-700 font-mono">
                                {item.totalCong > 0 ? `+${item.totalCong}` : '0'}
                              </td>
                              <td className="border border-slate-300 print:border-black py-1.5 px-2 text-center font-bold text-rose-700 font-mono">
                                {item.totalTru > 0 ? `-${item.totalTru}` : '0'}
                              </td>
                              <td className="border border-slate-300 print:border-black py-1.5 px-2 text-center font-black text-slate-900 bg-slate-50/80 font-mono">
                                {item.currentPoints}
                              </td>
                              <td className="border border-slate-300 print:border-black py-1.5 px-2 text-center font-bold text-slate-700">
                                #{item.rank}
                              </td>
                              <td className="border border-slate-300 print:border-black py-1.5 px-2 text-center font-bold">
                                {item.rankTitle}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : studentViewMode === 'top_bottom' ? (
            /* Chế độ xem Top tiêu biểu & Đôn đốc */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-bold text-emerald-800 uppercase mb-1">Top 5 Gương mặt tiêu biểu</div>
                <table className="report-table w-full text-xs border-collapse border border-slate-400 print:border-black">
                  <thead>
                    <tr className="bg-emerald-50 text-emerald-950 font-bold">
                      <th className="border border-slate-400 print:border-black py-2 px-2 text-center w-12">Hạng</th>
                      <th className="border border-slate-400 print:border-black py-2 px-3 text-left">Họ và tên</th>
                      <th className="border border-slate-400 print:border-black py-2 px-2 text-center w-14">Tổ</th>
                      <th className="border border-slate-400 print:border-black py-2 px-2 text-center w-16">Điểm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankedStudentScores.slice(0, 5).map(item => (
                      <tr key={item.student.id} className="even:bg-slate-50/50">
                        <td className="border border-slate-300 print:border-black py-1.5 px-2 text-center font-black">
                          {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `#${item.rank}`}
                        </td>
                        <td className="border border-slate-300 print:border-black py-1.5 px-3 font-bold text-slate-900">
                          {item.student.name}
                        </td>
                        <td className="border border-slate-300 print:border-black py-1.5 px-2 text-center">
                          Tổ {item.student.teamId}
                        </td>
                        <td className="border border-slate-300 print:border-black py-1.5 px-2 text-center font-black text-emerald-700">
                          {item.currentPoints}đ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <div className="text-xs font-bold text-rose-800 uppercase mb-1">Học sinh cần lưu ý đôn đốc</div>
                <table className="report-table w-full text-xs border-collapse border border-slate-400 print:border-black">
                  <thead>
                    <tr className="bg-rose-50 text-rose-950 font-bold">
                      <th className="border border-slate-400 print:border-black py-2 px-2 text-center w-12">STT</th>
                      <th className="border border-slate-400 print:border-black py-2 px-3 text-left">Họ và tên</th>
                      <th className="border border-slate-400 print:border-black py-2 px-2 text-center w-14">Tổ</th>
                      <th className="border border-slate-400 print:border-black py-2 px-2 text-center w-20">Vi phạm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankedStudentScores.filter(s => s.violationCount > 0).slice(0, 5).map((item, idx) => (
                      <tr key={item.student.id} className="even:bg-slate-50/50">
                        <td className="border border-slate-300 print:border-black py-1.5 px-2 text-center font-bold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="border border-slate-300 print:border-black py-1.5 px-3 font-bold text-slate-900">
                          {item.student.name}
                        </td>
                        <td className="border border-slate-300 print:border-black py-1.5 px-2 text-center">
                          Tổ {item.student.teamId}
                        </td>
                        <td className="border border-slate-300 print:border-black py-1.5 px-2 text-center font-bold text-rose-700">
                          {item.violationCount} lỗi (-{item.totalTru}đ)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Chế độ xem toàn bộ 41 học sinh (Mặc định cho in ấn lưu hồ sơ) */
            <div className="overflow-x-auto">
              <table className="report-table w-full text-xs border-collapse border border-slate-400 print:border-black">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold print:bg-slate-100">
                    <th className="border border-slate-400 print:border-black py-2 px-1 text-center w-12 uppercase">
                      STT
                    </th>
                    <th className="border border-slate-400 print:border-black py-2 px-3 text-left uppercase">
                      Họ và tên học sinh
                    </th>
                    <th className="border border-slate-400 print:border-black py-2 px-2 text-center w-14 uppercase">
                      Tổ
                    </th>
                    <th className="border border-slate-400 print:border-black py-2 px-2 text-center w-28 uppercase">
                      Chức vụ
                    </th>
                    <th className="border border-slate-400 print:border-black py-2 px-2 text-center w-16 uppercase text-slate-600 print:text-black">
                      Điểm gốc
                    </th>
                    <th className="border border-slate-400 print:border-black py-2 px-2 text-center w-18 uppercase text-emerald-800 print:text-black">
                      Cộng (+)
                    </th>
                    <th className="border border-slate-400 print:border-black py-2 px-2 text-center w-18 uppercase text-rose-800 print:text-black">
                      Trừ (-)
                    </th>
                    <th className="border border-slate-400 print:border-black py-2 px-2 text-center w-20 uppercase font-black text-slate-900 print:text-black">
                      Tổng điểm
                    </th>
                    <th className="border border-slate-400 print:border-black py-2 px-2 text-center w-16 uppercase">
                      Hạng
                    </th>
                    <th className="border border-slate-400 print:border-black py-2 px-2 text-center w-24 uppercase">
                      Xếp loại
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayStudentScores.map((item) => (
                    <tr 
                      key={item.student.id} 
                      className={`even:bg-slate-50/50 print:bg-transparent ${
                        item.rank === 1 ? 'bg-amber-50/40 print:bg-transparent font-medium' : ''
                      }`}
                    >
                      <td className="border border-slate-300 print:border-black py-1.5 px-1 text-center font-bold text-slate-500 print:text-black">
                        {item.student.stt}
                      </td>
                      <td className="border border-slate-300 print:border-black py-1.5 px-3 font-bold text-slate-900 print:text-black">
                        {item.student.name}
                      </td>
                      <td className="border border-slate-300 print:border-black py-1.5 px-2 text-center text-slate-700 print:text-black">
                        Tổ {item.student.teamId}
                      </td>
                      <td className="border border-slate-300 print:border-black py-1.5 px-2 text-center text-slate-600 print:text-black">
                        {item.student.roleTitle || 'Thành viên'}
                      </td>
                      <td className="border border-slate-300 print:border-black py-1.5 px-2 text-center text-slate-500 print:text-black font-mono">
                        100
                      </td>
                      <td className="border border-slate-300 print:border-black py-1.5 px-2 text-center font-bold text-emerald-700 print:text-black font-mono">
                        {item.totalCong > 0 ? `+${item.totalCong}` : '0'}
                      </td>
                      <td className="border border-slate-300 print:border-black py-1.5 px-2 text-center font-bold text-rose-700 print:text-black font-mono">
                        {item.totalTru > 0 ? `-${item.totalTru}` : '0'}
                      </td>
                      <td className="border border-slate-300 print:border-black py-1.5 px-2 text-center font-black text-slate-900 bg-slate-50/70 print:bg-transparent font-mono">
                        {item.currentPoints}
                      </td>
                      <td className="border border-slate-300 print:border-black py-1.5 px-2 text-center font-bold text-slate-800 print:text-black">
                        #{item.rank} {item.isTied ? '*' : ''}
                      </td>
                      <td className="border border-slate-300 print:border-black py-1.5 px-2 text-center font-bold">
                        <span className={`px-1.5 py-0.5 rounded text-[11px] ${
                          item.rankTitle === 'Xuất sắc' ? 'text-indigo-800 font-black' :
                          item.rankTitle === 'Tốt' ? 'text-emerald-800' :
                          item.rankTitle === 'Khá' ? 'text-slate-800' : 'text-rose-800 font-bold'
                        }`}>
                          {item.rankTitle}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* MỤC III: THỐNG KÊ NỀ NẾP THEO CHUYÊN MỤC (KẺ KHUNG RÕ RÀNG) */}
        {/* ========================================================= */}
        <div className="space-y-2">
          <h4 className="font-black text-sm uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <span>III. Thống Kê Nề Nếp & Hoạt Động Theo Chuyên Mục</span>
          </h4>

          <div className="overflow-x-auto">
            <table className="report-table w-full text-xs border-collapse border border-slate-400 print:border-black">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold">
                  <th className="border border-slate-400 print:border-black py-2 px-2 text-center w-12 uppercase">STT</th>
                  <th className="border border-slate-400 print:border-black py-2 px-3 text-left uppercase">Chuyên mục đánh giá</th>
                  <th className="border border-slate-400 print:border-black py-2 px-2 text-center w-28 uppercase text-emerald-800">Lượt cộng (+)</th>
                  <th className="border border-slate-400 print:border-black py-2 px-2 text-center w-28 uppercase text-rose-800">Lượt trừ (-)</th>
                  <th className="border border-slate-400 print:border-black py-2 px-2 text-center w-28 uppercase">Điểm chênh lệch</th>
                  <th className="border border-slate-400 print:border-black py-2 px-2 text-center w-36 uppercase">Đánh giá chung</th>
                </tr>
              </thead>
              <tbody>
                {categoryStats.map(c => (
                  <tr key={c.stt} className="even:bg-slate-50/50 print:bg-transparent">
                    <td className="border border-slate-300 print:border-black py-1.5 px-2 text-center font-bold text-slate-500">
                      {c.stt}
                    </td>
                    <td className="border border-slate-300 print:border-black py-1.5 px-3 font-bold text-slate-900">
                      {c.name}
                    </td>
                    <td className="border border-slate-300 print:border-black py-1.5 px-2 text-center font-bold text-emerald-700 font-mono">
                      +{c.congCount}
                    </td>
                    <td className="border border-slate-300 print:border-black py-1.5 px-2 text-center font-bold text-rose-700 font-mono">
                      -{c.truCount}
                    </td>
                    <td className="border border-slate-300 print:border-black py-1.5 px-2 text-center font-black font-mono">
                      {c.netPoints > 0 ? `+${c.netPoints}` : c.netPoints}đ
                    </td>
                    <td className="border border-slate-300 print:border-black py-1.5 px-2 text-center font-semibold text-slate-800">
                      {c.assessment}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MỤC IV: GƯƠNG SÁNG BIỂU DƯƠNG TRONG TUẦN */}
        {/* ========================================================= */}
        <div className="space-y-2">
          <h4 className="font-black text-sm uppercase tracking-wider text-slate-900 flex items-center gap-1.5 text-emerald-900 print:text-black">
            <Award className="w-4 h-4 text-emerald-600 print:hidden" />
            <span>IV. Gương Sáng Tiêu Biểu Trong Tuần (Biểu Dương)</span>
          </h4>

          {commendationList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="report-table w-full text-xs border-collapse border border-slate-400 print:border-black">
                <thead>
                  <tr className="bg-emerald-50 text-emerald-950 font-bold print:bg-slate-100 print:text-black">
                    <th className="border border-slate-400 print:border-black py-2 px-2 text-center w-12 uppercase">STT</th>
                    <th className="border border-slate-400 print:border-black py-2 px-3 text-left w-44 uppercase">Họ và tên</th>
                    <th className="border border-slate-400 print:border-black py-2 px-2 text-center w-16 uppercase">Tổ</th>
                    <th className="border border-slate-400 print:border-black py-2 px-3 text-left uppercase">Hành động / Thành tích biểu dương</th>
                    <th className="border border-slate-400 print:border-black py-2 px-2 text-center w-24 uppercase">Điểm thưởng</th>
                    <th className="border border-slate-400 print:border-black py-2 px-2 text-center w-28 uppercase">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {commendationList.map((c, i) => (
                    <tr key={c.id || i} className="even:bg-slate-50/50 print:bg-transparent">
                      <td className="border border-slate-300 print:border-black py-1.5 px-2 text-center font-bold text-slate-500">
                        {i + 1}
                      </td>
                      <td className="border border-slate-300 print:border-black py-1.5 px-3 font-bold text-slate-900">
                        {c.studentName}
                      </td>
                      <td className="border border-slate-300 print:border-black py-1.5 px-2 text-center">
                        Tổ {c.teamId}
                      </td>
                      <td className="border border-slate-300 print:border-black py-1.5 px-3 text-slate-800">
                        {c.title} {c.notes ? <span className="text-slate-500 italic">({c.notes})</span> : ''}
                      </td>
                      <td className="border border-slate-300 print:border-black py-1.5 px-2 text-center font-bold text-emerald-700 font-mono">
                        +{c.points}đ
                      </td>
                      <td className="border border-slate-300 print:border-black py-1.5 px-2 text-center text-slate-600 font-mono text-[11px]">
                        {c.occurredDate || (c.createdAt ? c.createdAt.slice(0, 10) : '—')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 italic">
              Chưa có ghi nhận biểu dương đặc biệt mới trong tuần này.
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* MỤC V: HỌC SINH CẦN LƯU Ý ĐÔN ĐỐC, NHẮC NHỞ */}
        {/* ========================================================= */}
        <div className="space-y-2">
          <h4 className="font-black text-sm uppercase tracking-wider text-slate-900 flex items-center gap-1.5 text-rose-900 print:text-black">
            <AlertTriangle className="w-4 h-4 text-rose-600 print:hidden" />
            <span>V. Học Sinh Cần Lưu Ý Đôn Đốc, Nhắc Nhở Vi Phạm</span>
          </h4>

          {violationList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="report-table w-full text-xs border-collapse border border-slate-400 print:border-black">
                <thead>
                  <tr className="bg-rose-50 text-rose-950 font-bold print:bg-slate-100 print:text-black">
                    <th className="border border-slate-400 print:border-black py-2 px-2 text-center w-12 uppercase">STT</th>
                    <th className="border border-slate-400 print:border-black py-2 px-3 text-left w-44 uppercase">Họ và tên</th>
                    <th className="border border-slate-400 print:border-black py-2 px-2 text-center w-16 uppercase">Tổ</th>
                    <th className="border border-slate-400 print:border-black py-2 px-3 text-left uppercase">Lỗi vi phạm cụ thể</th>
                    <th className="border border-slate-400 print:border-black py-2 px-2 text-center w-24 uppercase">Điểm trừ</th>
                    <th className="border border-slate-400 print:border-black py-2 px-3 text-left w-48 uppercase">Biện pháp phối hợp</th>
                  </tr>
                </thead>
                <tbody>
                  {violationList.map((w, i) => (
                    <tr key={w.id || i} className="even:bg-slate-50/50 print:bg-transparent">
                      <td className="border border-slate-300 print:border-black py-1.5 px-2 text-center font-bold text-slate-500">
                        {i + 1}
                      </td>
                      <td className="border border-slate-300 print:border-black py-1.5 px-3 font-bold text-slate-900">
                        {w.studentName}
                      </td>
                      <td className="border border-slate-300 print:border-black py-1.5 px-2 text-center">
                        Tổ {w.teamId}
                      </td>
                      <td className="border border-slate-300 print:border-black py-1.5 px-3 text-slate-800">
                        {w.title} {w.notes ? <span className="text-slate-500 italic">({w.notes})</span> : ''}
                      </td>
                      <td className="border border-slate-300 print:border-black py-1.5 px-2 text-center font-bold text-rose-700 font-mono">
                        {w.points}đ
                      </td>
                      <td className="border border-slate-300 print:border-black py-1.5 px-3 text-slate-600 text-[11px]">
                        Tổ trưởng đôn đốc & ghi sổ nhắc nhở
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
              ✓ Tuần qua cả lớp chấp hành nề nếp rất tốt, không có trường hợp vi phạm nề nếp nặng.
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* MỤC VI: NHẬN XÉT CỦA GIÁO VIÊN CHỦ NHIỆM */}
        {/* ========================================================= */}
        <div className="space-y-2">
          <h4 className="font-black text-sm uppercase tracking-wider text-slate-900">
            VI. Nhận Xét, Đánh Giá & Kế Hoạch Của Giáo Viên Chủ Nhiệm
          </h4>
          <div className="p-4 bg-slate-50 print:bg-transparent rounded-2xl border border-slate-300 print:border-black text-xs sm:text-sm leading-relaxed text-slate-800 italic font-serif">
            "{teacherNotes}"
          </div>
        </div>

        {/* ========================================================= */}
        {/* CHỮ KÝ XÁC NHẬN CHUẨN MẪU HÀNH CHÍNH (CÂN ĐỐI 2 BÊN) */}
        {/* ========================================================= */}
        <div className="pt-6 grid grid-cols-2 text-center text-xs print:pt-8 print-avoid-break">
          {/* Cột trái: Lớp trưởng */}
          <div className="space-y-1">
            <div className="font-black uppercase tracking-tight text-slate-900 print:text-black text-sm">
              LỚP TRƯỞNG
            </div>
            <div className="text-[11px] text-slate-500 italic print:text-black">
              (Ký và ghi rõ họ tên)
            </div>
            <div className="h-16 flex items-center justify-center font-serif text-slate-400 italic">
              {/* Vùng ký tên */}
            </div>
            <div className="font-black text-slate-900 print:text-black text-sm uppercase tracking-tight">
              {classMonitorName}
            </div>
          </div>

          {/* Cột phải: Giáo viên chủ nhiệm */}
          <div className="space-y-1">
            <div className="text-slate-600 print:text-black italic text-[11px]">
              Vân Hà, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
            </div>
            <div className="font-black uppercase tracking-tight text-slate-900 print:text-black text-sm">
              GIÁO VIÊN CHỦ NHIỆM
            </div>
            <div className="text-[11px] text-slate-500 italic print:text-black">
              (Ký và ghi rõ họ tên)
            </div>
            <div className="h-14 flex items-center justify-center font-serif text-slate-400 italic">
              {/* Vùng ký tên */}
            </div>
            <div className="font-black text-slate-900 print:text-black text-sm uppercase tracking-tight">
              {data.config.teacherName}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
