import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  FileText, 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Calendar, 
  Award, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2, 
  Edit3 
} from 'lucide-react';
import { exportMultiSheetExcel, exportToWordDoc, formatDateVN } from '../../utils/exportUtils';

export const ReportsView: React.FC = () => {
  const { data, getTeamLeaderboard, getStudentLeaderboard, showToast } = useApp();

  const [selectedWeek, setSelectedWeek] = useState<number>(data.config.currentWeek);
  const [reportType, setReportType] = useState<'week' | 'month' | 'semester'>('week');
  const [teacherNotes, setTeacherNotes] = useState<string>(
    'Tuần qua đa số học sinh lớp 9A1 chấp hành nghiêm túc nội quy nề nếp của nhà trường. 100% học sinh đeo khăn quàng đỏ, trang phục đúng quy định. Ban cán sự lớp và các tổ trưởng hoạt động rất tích cực, đôn đốc tốt. Tuy nhiên còn một vài bạn hay đi học sát giờ và quên làm bài tập về nhà môn Tiếng Anh, yêu cầu các tổ trưởng tiếp tục theo dõi sát sao.'
  );

  const teamScores = getTeamLeaderboard(selectedWeek);
  const studentScores = getStudentLeaderboard(undefined, selectedWeek);

  const topStudents = studentScores.slice(0, 5);
  let curTopRank = 1;
  const rankedTopStudents = topStudents.map((s, idx, arr) => {
    if (idx > 0 && s.currentPoints < arr[idx - 1].currentPoints) {
      curTopRank = idx + 1;
    }
    return {
      ...s,
      rank: curTopRank,
      isTied: studentScores.filter(o => o.currentPoints === s.currentPoints).length > 1,
    };
  });
  const warnedStudents = [...studentScores]
    .filter(s => s.violationCount > 0)
    .sort((a, b) => b.violationCount - a.violationCount)
    .slice(0, 5);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    exportMultiSheetExcel(data, selectedWeek);
    showToast(`Đã xuất file Excel đa sheet Tuần ${selectedWeek}!`, 'success');
  };

  const handleExportWord = () => {
    const classMonitor = data.students.find(s => s.roleTitle?.toLowerCase().includes('lớp trưởng'))?.name || 'Tạ Thục Quyên';
    exportToWordDoc(data, {
      weekNumber: selectedWeek,
      teacherNotes,
      classMonitor,
    });
    showToast(`Đã xuất file Word Báo cáo thi đua Tuần ${selectedWeek}!`, 'success');
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 pb-24 space-y-6">
      {/* Top Banner & Export Actions */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-xs rounded-full text-xs font-bold mb-2">
            <FileText className="w-3.5 h-3.5" />
            <span>Trung Tâm Báo Cáo & Thống Kê</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            XUẤT BÁO CÁO THI ĐUA LỚP 9A1
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100 mt-1">
            Tổng hợp kết quả thi đua, nề nếp học tập theo tuần, tháng và học kỳ. Hỗ trợ xuất file Excel 6 Sheet và Word chuẩn mẫu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md flex items-center gap-2 transition-transform active:scale-98 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Excel Đa Sheet</span>
          </button>

          <button
            onClick={handleExportWord}
            className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md flex items-center gap-2 transition-transform active:scale-98 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Xuất Báo Cáo Word (.doc)</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In</span>
          </button>
        </div>
      </div>

      {/* Report Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Chọn tuần báo cáo
          </label>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {Array.from({ length: 35 }, (_, i) => i + 1).map(w => (
                <option key={w} value={w}>
                  Tuần {w} {w === data.config.currentWeek ? '(Tuần hiện tại)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Phạm vi tổng hợp
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setReportType('week')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                reportType === 'week' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Theo Tuần
            </button>
            <button
              onClick={() => setReportType('month')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                reportType === 'month' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Theo Tháng
            </button>
            <button
              onClick={() => setReportType('semester')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                reportType === 'semester' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Cả Học Kỳ
            </button>
          </div>
        </div>
      </div>

      {/* Teacher Comments Editor (Editable before Word Export) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-indigo-600" />
            <span>Nhận Xét Của Giáo Viên Chủ Nhiệm (Sẽ in vào báo cáo Word)</span>
          </label>
          <span className="text-[11px] text-slate-400">Có thể chỉnh sửa trước khi xuất Word</span>
        </div>
        <textarea
          rows={3}
          value={teacherNotes}
          onChange={(e) => setTeacherNotes(e.target.value)}
          placeholder="Nhập nhận xét tổng quát về nề nếp, học tập của lớp trong tuần..."
          className="w-full p-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
        />
      </div>

      {/* Live Preview Paper Container (Official School Document Style) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-10 space-y-6 text-slate-900 print:shadow-none print:border-none print:p-0">
        {/* Document Letterhead */}
        <div className="flex flex-col sm:flex-row justify-between text-center sm:text-left gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="text-xs font-semibold uppercase text-slate-500">UBND phường Vân Hà</div>
            <div className="text-sm font-black uppercase tracking-tight text-slate-900">Trường THCS Vân Hà 2</div>
            <div className="text-xs text-slate-600">Lớp 9A1 • Năm học {data.config.schoolYear}</div>
          </div>

          <div className="text-center">
            <div className="text-xs font-black uppercase text-slate-900">Cộng Hòa Xã Hội Chủ Nghĩa Việt Nam</div>
            <div className="text-xs font-bold text-slate-700">Độc lập – Tự do – Hạnh phúc</div>
            <div className="w-24 h-0.5 bg-slate-400 mx-auto mt-1" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center py-2">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
            BÁO CÁO THI ĐUA NỀ NẾP & HỌC TẬP
          </h3>
          <p className="text-xs font-semibold text-slate-500 mt-1 italic">
            Tuần thứ {selectedWeek} • GVCN: {data.config.teacherName} • Sĩ số: {data.students.length} học sinh
          </p>
        </div>

        {/* Section 1: Team Standings */}
        <div>
          <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
            <span>I. Bảng Xếp Hạng Thi Đua 4 Tổ</span>
          </h4>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 font-bold text-slate-700">
                <tr>
                  <th className="py-2 px-3 text-center w-14">Hạng</th>
                  <th className="py-2 px-3">Tên Tổ</th>
                  <th className="py-2 px-3">Tổ trưởng</th>
                  <th className="py-2 px-3 text-center">Sĩ số</th>
                  <th className="py-2 px-3 text-center">Điểm cộng</th>
                  <th className="py-2 px-3 text-center">Điểm trừ</th>
                  <th className="py-2 px-3 text-center font-black">Điểm TB</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamScores.map((t, idx) => (
                  <tr key={t.teamId} className={idx === 0 ? 'bg-amber-50/40 font-bold' : ''}>
                    <td className="py-2 px-3 text-center font-black">{idx + 1}</td>
                    <td className="py-2 px-3">{t.teamName}</td>
                    <td className="py-2 px-3">{t.leader?.name || '—'}</td>
                    <td className="py-2 px-3 text-center">{t.studentCount}</td>
                    <td className="py-2 px-3 text-center text-emerald-600">+{t.totalCong}</td>
                    <td className="py-2 px-3 text-center text-rose-600">-{t.totalTru}</td>
                    <td className="py-2 px-3 text-center font-black text-slate-900">{t.avgPoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Highlights & Reminders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Top 5 Tiêu biểu */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-800 mb-2 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>II. Gương Sáng Tiêu Biểu Trong Tuần</span>
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 font-bold text-slate-600">
                  <tr>
                    <th className="py-2 px-3 text-center w-14">Hạng</th>
                    <th className="py-2 px-3">Học sinh</th>
                    <th className="py-2 px-3 text-center">Tổ</th>
                    <th className="py-2 px-3 text-center">Điểm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rankedTopStudents.map((s) => (
                    <tr key={s.student.id}>
                      <td className="py-1.5 px-3 text-center font-bold text-slate-700">
                        {s.rank === 1 ? '🥇' : s.rank === 2 ? '🥈' : s.rank === 3 ? '🥉' : `#${s.rank}`}
                        {s.isTied && <span className="text-[9px] text-amber-700 font-semibold block leading-tight">đồng #{s.rank}</span>}
                      </td>
                      <td className="py-1.5 px-3 font-bold text-slate-800">{s.student.name}</td>
                      <td className="py-1.5 px-3 text-center">Tổ {s.student.teamId}</td>
                      <td className="py-1.5 px-3 text-center font-black text-emerald-700">
                        {s.currentPoints}đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top 5 Cần đôn đốc */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-rose-800 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>III. Học Sinh Cần Lưu Ý Đôn Đốc</span>
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 font-bold text-slate-600">
                  <tr>
                    <th className="py-2 px-3 text-center w-10">STT</th>
                    <th className="py-2 px-3">Học sinh</th>
                    <th className="py-2 px-3 text-center">Tổ</th>
                    <th className="py-2 px-3 text-center">Số lỗi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {warnedStudents.length > 0 ? (
                    warnedStudents.map((s, idx) => (
                      <tr key={s.student.id}>
                        <td className="py-1.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="py-1.5 px-3 font-bold text-slate-800">{s.student.name}</td>
                        <td className="py-1.5 px-3 text-center">Tổ {s.student.teamId}</td>
                        <td className="py-1.5 px-3 text-center font-black text-rose-700">
                          {s.violationCount} lỗi
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400 italic">
                        Không có học sinh vi phạm nhiều trong tuần.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section 3: Teacher notes */}
        <div>
          <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-2">
            IV. Nhận Xét & Chỉ Đạo Của Giáo Viên Chủ Nhiệm
          </h4>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm leading-relaxed text-slate-700 italic">
            "{teacherNotes}"
          </div>
        </div>

        {/* Signature Box */}
        <div className="pt-6 grid grid-cols-2 text-center text-xs">
          <div>
            <div className="font-bold uppercase text-slate-900">LỚP TRƯỞNG</div>
            <div className="text-[11px] text-slate-400 mt-1">(Ký và ghi rõ họ tên)</div>
            <div className="mt-14 font-black text-slate-900 text-sm">
              {data.students.find(s => s.roleTitle?.toLowerCase().includes('lớp trưởng'))?.name || 'Tạ Thục Quyên'}
            </div>
          </div>

          <div>
            <div className="text-slate-500 italic">
              Vân Hà, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
            </div>
            <div className="font-bold uppercase text-slate-900 mt-1">GIÁO VIÊN CHỦ NHIỆM</div>
            <div className="text-[11px] text-slate-400 mt-1">(Ký và ghi rõ họ tên)</div>
            <div className="mt-12 font-black text-slate-900 text-sm">{data.config.teacherName}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
