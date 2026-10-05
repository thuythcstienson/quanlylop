import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, 
  Trophy, 
  MinusCircle, 
  PlusCircle, 
  Award, 
  FileSpreadsheet, 
  FileText, 
  Bell, 
  UserCheck, 
  Settings, 
  FileUp, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  LogIn,
  Edit3,
  X,
  Medal,
  Flag,
  ChevronRight
} from 'lucide-react';
import { exportMultiSheetExcel, exportToWordDoc } from '../../utils/exportUtils';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
  onOpenExcelImport: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenExcelImport
}) => {
  const { 
    data, 
    currentUser, 
    getTeamLeaderboard, 
    getStudentLeaderboard, 
    getTodayStats, 
    getPendingTransactions,
    updateConfig,
    showToast
  } = useApp();

  const currentWeek = data.config.currentWeek || 5;
  const todayStats = getTodayStats();
  const teamScores = getTeamLeaderboard(currentWeek);
  const allStudentScores = getStudentLeaderboard(undefined, currentWeek);
  const pendingTransactions = getPendingTransactions();

  // Top 5 commended students with tie-awareness (đồng hạng khi bằng điểm nhau)
  const topScoreVal = allStudentScores[0]?.currentPoints ?? 100;
  const topTiedCount = allStudentScores.filter(s => s.currentPoints === topScoreVal).length;

  const rankedTopStars = React.useMemo(() => {
    let curRank = 1;
    return allStudentScores.slice(0, 10).map((item, idx, arr) => {
      if (idx > 0 && item.currentPoints < arr[idx - 1].currentPoints) {
        curRank = idx + 1;
      }
      return {
        ...item,
        rank: curRank,
        isTied: allStudentScores.filter(o => o.currentPoints === item.currentPoints).length > 1,
      };
    }).slice(0, 5);
  }, [allStudentScores]);

  // Top 5 needing reminder (lowest points or most violations)
  const needingReminder = [...allStudentScores]
    .filter(s => s.violationCount > 0 || s.currentPoints < 98)
    .sort((a, b) => b.violationCount - a.violationCount || a.currentPoints - b.currentPoints)
    .slice(0, 5);

  // Average class points
  const avgClassPoints = allStudentScores.length > 0
    ? (allStudentScores.reduce((acc, curr) => acc + curr.currentPoints, 0) / allStudentScores.length).toFixed(1)
    : '100.0';

  // School Rank Tracking State (Thứ tự của lớp trong toàn trường)
  const [isRankModalOpen, setIsRankModalOpen] = useState(false);
  const [rankInput, setRankInput] = useState<number | string>(data.config.schoolRank ?? 1);
  const [totalClassesInput, setTotalClassesInput] = useState<number | string>(data.config.schoolTotalClasses ?? 24);
  const [isSavingRank, setIsSavingRank] = useState(false);

  const handleSaveSchoolRank = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingRank(true);
    await updateConfig({
      schoolRank: Number(rankInput) || 1,
      schoolTotalClasses: Number(totalClassesInput) || 24,
    });
    setIsSavingRank(false);
    setIsRankModalOpen(false);
    showToast(`Đã lưu thứ tự lớp toàn trường: Hạng ${rankInput}/${totalClassesInput}`, 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-24 space-y-6">
      {/* Public Guest Notification Banner */}
      {currentUser.role === 'guest' && (
        <div className="bg-gradient-to-r from-amber-500 via-indigo-600 to-indigo-700 text-white rounded-3xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center font-bold shrink-0">
              <Trophy className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <div className="font-bold text-sm sm:text-base flex items-center gap-2">
                <span>Chế độ Xem Điểm Thi Đua Công Khai</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 uppercase tracking-wider">Không cần đăng nhập</span>
              </div>
              <div className="text-xs text-indigo-100 mt-0.5">
                Bạn có thể tự do theo dõi bảng xếp hạng tổ, điểm thi đua 41 học sinh, điểm cộng/trừ và biểu dương. Nếu muốn ghi điểm, duyệt điểm hoặc quản lý lớp, vui lòng đăng nhập tài khoản.
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('quick-entry')}
            className="px-4 py-2.5 bg-white text-indigo-900 hover:bg-indigo-50 active:scale-98 rounded-xl font-bold text-xs sm:text-sm shadow-md shrink-0 flex items-center justify-center gap-1.5 cursor-pointer transition-transform"
          >
            <LogIn className="w-4 h-4 text-indigo-600" />
            <span>Đăng nhập để có các quyền</span>
          </button>
        </div>
      )}

      {/* 1. Header Banner & Class Status */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-xs rounded-full text-xs font-semibold mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Học kỳ I • Tuần thứ {data.config.currentWeek}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              BẢNG QUẢN LÝ LỚP {data.config.className}
            </h1>
            <p className="text-indigo-100 text-xs sm:text-sm mt-1">
              Trường {data.config.schoolName} • Giáo viên chủ nhiệm: <strong>{data.config.teacherName}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('quick-entry')}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Ghi điểm nhanh</span>
            </button>
            <button
              onClick={() => exportMultiSheetExcel(data)}
              className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2 backdrop-blur-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>Xuất Excel</span>
            </button>
          </div>
        </div>

        {/* Quick KPI stats pill row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 mt-6 pt-5 border-t border-white/10 text-center">
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3">
            <div className="text-xs text-indigo-200 font-medium">Sĩ số lớp</div>
            <div className="text-2xl sm:text-3xl font-black mt-0.5">{data.students.length}</div>
            <div className="text-[11px] text-indigo-200">4 tổ thi đua</div>
          </div>

          {/* Thứ tự lớp toàn trường */}
          <div 
            onClick={() => currentUser.role === 'admin' ? setIsRankModalOpen(true) : null}
            className={`bg-white/10 backdrop-blur-xs rounded-2xl p-3 transition-all relative ${
              currentUser.role === 'admin' ? 'hover:bg-white/20 cursor-pointer group' : ''
            }`}
            title={currentUser.role === 'admin' ? 'Bấm để cập nhật thứ tự của lớp trong toàn trường' : undefined}
          >
            <div className="text-xs text-indigo-200 font-medium flex items-center justify-center gap-1">
              <span>Hạng toàn trường</span>
              {currentUser.role === 'admin' && (
                <Edit3 className="w-3 h-3 text-amber-300 opacity-70 group-hover:opacity-100" />
              )}
            </div>
            <div className="text-2xl sm:text-3xl font-black mt-0.5 text-amber-300 flex items-center justify-center gap-1">
              <span>Hạng {data.config.schoolRank ?? 1}</span>
            </div>
            <div className="text-[11px] text-indigo-200">
              {data.config.schoolTotalClasses ? `Trên ${data.config.schoolTotalClasses} lớp` : 'Toàn trường'}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3">
            <div className="text-xs text-indigo-200 font-medium">Điểm TB Lớp</div>
            <div className="text-2xl sm:text-3xl font-black mt-0.5 text-emerald-300">{avgClassPoints}</div>
            <div className="text-[11px] text-indigo-200">Gốc: {data.config.basePoints} điểm</div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3">
            <div className="text-xs text-indigo-200 font-medium">Hôm nay ghi nhận</div>
            <div className="text-2xl sm:text-3xl font-black mt-0.5 text-emerald-300">
              +{todayStats.totalCongPoints} / -{todayStats.totalTruPoints}
            </div>
            <div className="text-[11px] text-indigo-200">{todayStats.todayCount} lượt đánh giá</div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 col-span-2 sm:col-span-1">
            <div className="text-xs text-indigo-200 font-medium">Chờ duyệt</div>
            <div className="text-2xl sm:text-3xl font-black mt-0.5 text-rose-300">
              {pendingTransactions.length}
            </div>
            <div className="text-[11px] text-indigo-200">
              {pendingTransactions.length > 0 ? (
                <button
                  onClick={() => onNavigate('approval')}
                  className="underline text-amber-200 hover:text-white cursor-pointer font-bold"
                >
                  Duyệt ngay
                </button>
              ) : (
                'Đã cập nhật hết'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Big Action Grid (As requested in prompt XXI) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span>Bảng Chức Năng Nhanh</span>
          </h2>
          <span className="text-xs text-slate-500">Bấm để truy cập trực tiếp</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {/* 1. Học sinh */}
          <button
            onClick={() => onNavigate('students')}
            className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-2xs hover:shadow-sm text-left flex flex-col items-center justify-center text-center transition-all group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-800">HỌC SINH</span>
            <span className="text-[10px] text-slate-500">41 thành viên</span>
          </button>

          {/* 2. Các tổ */}
          <button
            onClick={() => onNavigate('students')}
            className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-2xs hover:shadow-sm text-left flex flex-col items-center justify-center text-center transition-all group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-800">CÁC TỔ</span>
            <span className="text-[10px] text-slate-500">4 tổ thi đua</span>
          </button>

          {/* 3. Thi đua */}
          <button
            onClick={() => onNavigate('competition')}
            className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-2xs hover:shadow-sm text-left flex flex-col items-center justify-center text-center transition-all group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Trophy className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-800">THI ĐUA</span>
            <span className="text-[10px] text-slate-500">Xếp hạng tuần</span>
          </button>

          {/* 4. Cộng điểm */}
          <button
            onClick={() => onNavigate('quick-entry')}
            className="p-3.5 bg-emerald-50/70 hover:bg-emerald-50 border border-emerald-200 rounded-2xl shadow-2xs hover:shadow-sm text-left flex flex-col items-center justify-center text-center transition-all group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-500 text-white flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-xs">
              <PlusCircle className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-emerald-900">CỘNG ĐIỂM</span>
            <span className="text-[10px] text-emerald-700">Thưởng thành tích</span>
          </button>

          {/* 5. Trừ điểm */}
          <button
            onClick={() => onNavigate('quick-entry')}
            className="p-3.5 bg-rose-50/70 hover:bg-rose-50 border border-rose-200 rounded-2xl shadow-2xs hover:shadow-sm text-left flex flex-col items-center justify-center text-center transition-all group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-rose-500 text-white flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-xs">
              <MinusCircle className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-rose-900">TRỪ ĐIỂM</span>
            <span className="text-[10px] text-rose-700">Lỗi vi phạm</span>
          </button>

          {/* 6. Biểu dương */}
          <button
            onClick={() => onNavigate('commendation')}
            className="p-3.5 bg-amber-50/70 hover:bg-amber-50 border border-amber-200 rounded-2xl shadow-2xs hover:shadow-sm text-left flex flex-col items-center justify-center text-center transition-all group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-xs">
              <Award className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-amber-950">BIỂU DƯƠNG</span>
            <span className="text-[10px] text-amber-700">Gương sáng tuần</span>
          </button>

          {/* 6b. Cuộc thi & Chiến dịch */}
          <button
            onClick={() => onNavigate('campaigns')}
            className="p-3.5 bg-amber-50/90 hover:bg-amber-100 border border-amber-300 rounded-2xl shadow-2xs hover:shadow-sm text-left flex flex-col items-center justify-center text-center transition-all group cursor-pointer relative"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-xs">
              <Trophy className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-amber-950">CUỘC THI</span>
            <span className="text-[10px] text-amber-800">Chiến dịch & nộp bài</span>
            {(data.campaigns || []).filter(c => c.status === 'active').length > 0 && (
              <span className="absolute top-2 right-2 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-600 text-white">
                {(data.campaigns || []).filter(c => c.status === 'active').length}
              </span>
            )}
          </button>

          {/* 7. Báo cáo */}
          <button
            onClick={() => onNavigate('reports')}
            className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-2xs hover:shadow-sm text-left flex flex-col items-center justify-center text-center transition-all group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-800">BÁO CÁO</span>
            <span className="text-[10px] text-slate-500">Tổng kết tuần/tháng</span>
          </button>

          {/* 8. Nhập Excel */}
          <button
            onClick={onOpenExcelImport}
            className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-2xs hover:shadow-sm text-left flex flex-col items-center justify-center text-center transition-all group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <FileUp className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-800">NHẬP EXCEL</span>
            <span className="text-[10px] text-slate-500">Tải lên danh sách</span>
          </button>

          {/* 9. Xuất Excel */}
          <button
            onClick={() => {
              exportMultiSheetExcel(data);
              showToast('Đã tải xuống file Excel đa sheet!', 'success');
            }}
            className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-2xs hover:shadow-sm text-left flex flex-col items-center justify-center text-center transition-all group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-800">XUẤT EXCEL</span>
            <span className="text-[10px] text-slate-500">Đầy đủ 6 Sheet</span>
          </button>

          {/* 10. Xuất Word */}
          <button
            onClick={() => {
              exportToWordDoc(data, { weekNumber: data.config.currentWeek });
              showToast('Đã xuất file Word báo cáo thi đua!', 'success');
            }}
            className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-2xs hover:shadow-sm text-left flex flex-col items-center justify-center text-center transition-all group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-800">XUẤT WORD</span>
            <span className="text-[10px] text-slate-500">Chuẩn mẫu Bộ GD</span>
          </button>

          {/* 11. Thông báo: Chỉ hiển thị cho Giáo viên chủ nhiệm */}
          {currentUser.role === 'admin' && (
            <button
              onClick={() => onNavigate('announcements')}
              className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-2xs hover:shadow-sm text-left flex flex-col items-center justify-center text-center transition-all group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Bell className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-800">THÔNG BÁO</span>
              <span className="text-[10px] text-slate-500">Gửi phụ huynh</span>
            </button>
          )}

          {/* 12. Tài khoản / Cài đặt */}
          <button
            onClick={() => onNavigate(currentUser.role === 'admin' ? 'accounts' : 'settings')}
            className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-2xs hover:shadow-sm text-left flex flex-col items-center justify-center text-center transition-all group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              {currentUser.role === 'admin' ? <UserCheck className="w-6 h-6" /> : <Settings className="w-6 h-6" />}
            </div>
            <span className="text-xs font-bold text-slate-800">
              {currentUser.role === 'admin' ? 'TÀI KHOẢN' : 'CÀI ĐẶT'}
            </span>
            <span className="text-[10px] text-slate-500">Phân quyền & quy chế</span>
          </button>
        </div>
      </div>

      {/* 3. Section: Bảng thi đua các tổ & Biểu đồ thanh */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Bảng thi đua 4 Tổ */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>Bảng Thi Đua 4 Tổ – Tuần {data.config.currentWeek}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Xếp hạng căn cứ vào Điểm trung bình mỗi thành viên</p>
            </div>
            <button
              onClick={() => onNavigate('competition')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Xem chi tiết</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {teamScores.map((team, idx) => {
              // Medal colors
              const medalColors = [
                'bg-amber-400 text-amber-950 ring-amber-200',
                'bg-slate-300 text-slate-800 ring-slate-200',
                'bg-amber-700 text-white ring-amber-600',
                'bg-slate-100 text-slate-600 ring-slate-200',
              ];

              return (
                <div key={team.teamId} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ring-2 ${medalColors[idx]}`}>
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <span>{team.teamName}</span>
                          <span className="text-xs text-slate-500 font-normal">
                            ({team.studentCount} HS • Tổ trưởng: {team.leader?.name || 'Chưa gán'})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-slate-900 text-base">{team.avgPoints}</span>
                      <span className="text-xs text-slate-400 ml-1">điểm TB</span>
                    </div>
                  </div>

                  {/* Progress bar visual */}
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx === 0
                          ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                          : idx === 1
                          ? 'bg-gradient-to-r from-indigo-500 to-blue-600'
                          : 'bg-gradient-to-r from-slate-400 to-slate-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(10, (team.avgPoints / 120) * 100))}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1.5 font-medium">
                    <span>Tổng điểm tổ: {team.totalPoints}đ</span>
                    <span>+{team.totalCong}đ cộng / -{team.totalTru}đ trừ</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Pending Reviews or Quick Rule Notice */}
        <div className="space-y-4">
          {/* Pending approval card */}
          {pendingTransactions.length > 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Đang chờ duyệt ({pendingTransactions.length})
                </span>
                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => onNavigate('approval')}
                    className="text-xs font-bold text-amber-800 underline cursor-pointer"
                  >
                    Xem tất cả
                  </button>
                )}
              </div>
              <p className="text-xs text-amber-700 leading-relaxed mb-3">
                Các đề xuất cộng/trừ điểm từ cán sự lớp đang chờ cô kiểm duyệt để ghi vào sổ thi đua chính thức.
              </p>
              <div className="space-y-1.5">
                {pendingTransactions.slice(0, 3).map(tx => (
                  <div key={tx.id} className="bg-white p-2 rounded-lg border border-amber-200 text-xs flex justify-between items-center">
                    <div className="truncate pr-2">
                      <div className="font-bold text-slate-800">{tx.studentName}</div>
                      <div className="text-slate-500 truncate">{tx.title}</div>
                    </div>
                    <span className={`font-black ${tx.points > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.points > 0 ? `+${tx.points}` : tx.points}đ
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Nề Nếp Ổn Định</span>
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Tất cả các lượt chấm điểm đã được đồng bộ và cập nhật chính thức.
              </p>
            </div>
          )}

          {/* Quick Notice Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-indigo-600" />
                <span>Thông Báo Lớp Mới</span>
              </h4>
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => onNavigate('announcements')}
                  className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
                >
                  Tất cả
                </button>
              )}
            </div>

            {data.announcements.length > 0 ? (
              <div className="space-y-2">
                {data.announcements.slice(0, 2).map(ann => (
                  <div key={ann.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="font-bold text-slate-800 leading-snug">{ann.title}</div>
                    <p className="text-slate-500 line-clamp-2 mt-1">{ann.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">Chưa có thông báo nào.</div>
            )}
          </div>

          {/* School Rank Card Widget */}
          <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 rounded-2xl p-4 text-white shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/20 backdrop-blur-xs rounded-full text-[10px] font-bold">
                <Medal className="w-3 h-3 text-amber-200" />
                <span>Thi Đua Toàn Trường</span>
              </div>
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => setIsRankModalOpen(true)}
                  className="text-[11px] font-bold text-amber-100 hover:text-white underline cursor-pointer flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" /> Nhập thứ tự
                </button>
              )}
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black tracking-tight text-white">
                Hạng {data.config.schoolRank ?? 1}
              </span>
              <span className="text-xs text-amber-100 font-semibold">
                / {data.config.schoolTotalClasses ?? 24} lớp toàn trường
              </span>
            </div>

            <p className="text-xs text-amber-100 mt-1.5 leading-snug">
              {Number(data.config.schoolRank) === 1
                ? 'Xuất sắc! Lớp 9A1 đang dẫn đầu phong trào thi đua toàn trường.'
                : Number(data.config.schoolRank) <= 3
                ? 'Tuyệt vời! Lớp 9A1 thuộc Top 3 lớp thi đua tốt nhất trường.'
                : `Lớp 9A1 đang xếp thứ ${data.config.schoolRank} trong toàn trường.`}
            </p>
          </div>

          {/* Access History & Online Members Widget (Chỉ hiển thị cho GVCN) */}
          {currentUser.role === 'admin' && (
            <div className="bg-white rounded-2xl border border-indigo-200 bg-indigo-50/15 p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Lịch Sử Truy Cập Thành Viên</span>
                </h4>
                <button
                  onClick={() => onNavigate('access-logs')}
                  className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  <span>Chi tiết</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Tổng số lượt</div>
                  <div className="text-base sm:text-lg font-black text-slate-900 font-mono mt-0.5">
                    {(data.accessLogs || []).length} lượt
                  </div>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                  <div className="text-[10px] font-bold text-emerald-700 uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Đang online</span>
                  </div>
                  <div className="text-base sm:text-lg font-black text-emerald-800 font-mono mt-0.5">
                    {(data.accessLogs || []).filter(l => l.isOnline).length} người
                  </div>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Số lần, trong bao lâu, ngày, giờ</span>
                <button
                  onClick={() => onNavigate('access-logs')}
                  className="font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer flex items-center gap-0.5"
                >
                  <span>Mở nhật ký</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Active Campaigns Widget */}
          <div className="bg-white rounded-2xl border border-amber-200 bg-amber-50/15 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-600" />
                <span>Cuộc Thi & Phong Trào Đang Mở</span>
              </h4>
              <button
                onClick={() => onNavigate('campaigns')}
                className="text-xs text-amber-700 font-bold hover:underline cursor-pointer"
              >
                Xem chi tiết
              </button>
            </div>

            {(data.campaigns || []).filter(c => c.status === 'active').length > 0 ? (
              <div className="space-y-2">
                {(data.campaigns || []).filter(c => c.status === 'active').slice(0, 2).map(camp => {
                  const total = camp.participants.length;
                  const submitted = camp.participants.filter(p => p.status === 'da_nop' || p.status === 'xuat_sac' || p.status === 'nop_muon').length;
                  const percent = total > 0 ? Math.round((submitted / total) * 100) : 0;

                  return (
                    <div 
                      key={camp.id} 
                      onClick={() => onNavigate('campaigns')}
                      className="p-2.5 rounded-xl bg-white border border-amber-200/80 hover:border-amber-400 transition-all text-xs cursor-pointer shadow-2xs group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                          {camp.title}
                        </span>
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded shrink-0 ml-1">
                          Hạn: {camp.endDate.slice(5)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
                        <span>Đã nộp: <strong className="text-slate-800 font-mono">{submitted}/{total}</strong> HS</span>
                        <span className="font-bold text-amber-700 font-mono">{percent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                        <div 
                          style={{ width: `${percent}%` }} 
                          className="h-full bg-amber-500 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">Hiện không có cuộc thi nào đang diễn ra.</div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Top 5 Stars (Biểu dương) & Top 5 Reminders (Cần đôn đốc) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top 5 Tiêu Biểu */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>Top Gương Mặt Tiêu Biểu Tuần</span>
              </h3>
              <p className="text-xs text-slate-500">
                {topTiedCount > 1 
                  ? (topTiedCount >= allStudentScores.length 
                      ? `Cả lớp cùng đạt ${topScoreVal}đ gốc (Đồng Hạng 1)` 
                      : `Có ${topTiedCount} học sinh cùng dẫn đầu Hạng 1 (${topScoreVal}đ)`)
                  : 'Điểm thi đua cao nhất lớp'}
              </p>
            </div>
            <button
              onClick={() => onNavigate('competition')}
              className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
            >
              Xem BXH
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {rankedTopStars.map((item) => (
              <div key={item.student.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-lg font-black flex items-center justify-center text-xs ${
                    item.rank === 1 ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                    item.rank === 2 ? 'bg-slate-200 text-slate-800' :
                    item.rank === 3 ? 'bg-amber-50 text-amber-800' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `#${item.rank}`}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                      <span>{item.student.name}</span>
                      {item.isTied && (
                        <span className="text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1 rounded">
                          Đồng #{item.rank}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Tổ {item.student.teamId} • {item.student.roleTitle}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-black text-emerald-700 text-sm">
                    {item.currentPoints} điểm
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
                    +{item.totalCong}đ
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 Cần đôn đốc */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <span>Học Sinh Cần Lưu Ý Đôn Đốc</span>
              </h3>
              <p className="text-xs text-slate-500">Có lỗi vi phạm cần GVCN & Cán sự nhắc nhở</p>
            </div>
            <button
              onClick={() => onNavigate('competition')}
              className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
            >
              Chi tiết
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {needingReminder.length > 0 ? (
              needingReminder.map((item, idx) => (
                <div key={item.student.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-700 font-black flex items-center justify-center text-xs">
                      !
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">{item.student.name}</div>
                      <div className="text-[11px] text-slate-400">
                        Tổ {item.student.teamId} • {item.student.roleTitle}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-rose-600 text-sm">
                      {item.currentPoints} điểm
                    </div>
                    <span className="text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-bold">
                      -{item.totalTru}đ ({item.violationCount} lỗi)
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 italic">
                Tuyệt vời! Không có học sinh nào bị nhắc nhở trong tuần này.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: NHẬP VÀ CẬP NHẬT THỨ TỰ LỚP TOÀN TRƯỜNG */}
      {isRankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Medal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Thứ Tự Lớp Toàn Trường</h3>
                  <p className="text-xs text-slate-500">Thi đua cấp trường THCS Vân Hà 2</p>
                </div>
              </div>
              <button
                onClick={() => setIsRankModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSchoolRank} className="space-y-4 text-xs">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs leading-relaxed">
                Thứ tự của lớp trong toàn trường được cập nhật định kỳ sau các buổi chào cờ / đánh giá tuần để theo dõi vị trí thi đua của lớp 9A1 và đính kèm vào tin nhắn báo cáo gửi phụ huynh.
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                  Thứ tự / Xếp hạng lớp trong toàn trường *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={rankInput}
                    onChange={(e) => setRankInput(e.target.value)}
                    placeholder="VD: 1 (Hạng nhất), 2 (Hạng nhì)..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                    Hạng {rankInput || '?'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                  Tổng số lớp toàn trường
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={totalClassesInput}
                  onChange={(e) => setTotalClassesInput(e.target.value)}
                  placeholder="VD: 24"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Hiển thị dạng: <strong>Hạng {rankInput || 1}/{totalClassesInput || 24}</strong> toàn trường.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRankModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingRank}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Medal className="w-4 h-4" />
                  <span>{isSavingRank ? 'Đang lưu...' : 'Lưu Thứ Hạng'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
