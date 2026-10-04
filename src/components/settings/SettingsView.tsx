import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { PointRule, PointType } from '../../types';
import { 
  Settings, 
  PlusCircle, 
  Trash2, 
  Download, 
  Upload, 
  RotateCcw, 
  Save, 
  AlertTriangle, 
  MinusCircle, 
  CheckCircle2, 
  Award,
  ShieldAlert,
  ShieldCheck,
  Database,
  Edit3,
  X,
  Lock
} from 'lucide-react';
import { BackupRestoreModal } from '../common/BackupRestoreModal';
import { PermissionsModal } from '../accounts/PermissionsModal';
import { AccessDeniedView } from '../common/AccessDeniedView';

export const SettingsView: React.FC = () => {
  const { 
    data, 
    currentUser, 
    updateConfig, 
    addRule, 
    updateRule,
    deleteRule, 
    clearPeriodTransactions,
    restoreBackup, 
    resetDemoData, 
    openConfirm, 
    showToast,
    hasPermission
  } = useApp();

  const backupInputRef = useRef<HTMLInputElement>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);

  // Edit Rule State (Chỉ GVCN)
  const [editingRule, setEditingRule] = useState<PointRule | null>(null);
  const [editRuleTitle, setEditRuleTitle] = useState('');
  const [editRulePoints, setEditRulePoints] = useState<number>(2);
  const [editRuleType, setEditRuleType] = useState<PointType>('tru');
  const [editRuleCategory, setEditRuleCategory] = useState<PointRule['category']>('Nề nếp');

  // Period Clear State
  const [clearPeriodType, setClearPeriodType] = useState<'week' | 'month'>('week');
  const [targetClearWeek, setTargetClearWeek] = useState<number>(data.config.currentWeek || 4);
  const [targetClearMonth, setTargetClearMonth] = useState<number>(data.config.currentMonth || 10);

  // Form config
  const [configForm, setConfigForm] = useState({
    schoolName: data.config.schoolName,
    className: data.config.className,
    schoolYear: data.config.schoolYear,
    teacherName: data.config.teacherName,
    basePoints: data.config.basePoints,
    requireApproval: data.config.requireApproval,
    allowStudentViewRank: data.config.allowStudentViewRank,
    allowParentViewRank: data.config.allowParentViewRank,
    currentWeek: data.config.currentWeek,
    schoolRank: data.config.schoolRank ?? 1,
    schoolTotalClasses: data.config.schoolTotalClasses ?? 24,
  });

  // New rule form
  const [newRuleType, setNewRuleType] = useState<PointType>('tru');
  const [newRuleTitle, setNewRuleTitle] = useState('');
  const [newRulePoints, setNewRulePoints] = useState<number>(2);
  const [newRuleCategory, setNewRuleCategory] = useState<'Học tập' | 'Nề nếp' | 'Văn thể mỹ' | 'Vệ sinh - Trực nhật' | 'Hoạt động chung'>('Nề nếp');

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateConfig({
      schoolName: configForm.schoolName.trim(),
      className: configForm.className.trim(),
      schoolYear: configForm.schoolYear.trim(),
      teacherName: configForm.teacherName.trim(),
      basePoints: Number(configForm.basePoints),
      requireApproval: configForm.requireApproval,
      allowStudentViewRank: configForm.allowStudentViewRank,
      allowParentViewRank: configForm.allowParentViewRank,
      currentWeek: Number(configForm.currentWeek),
      schoolRank: Number(configForm.schoolRank) || 1,
      schoolTotalClasses: Number(configForm.schoolTotalClasses) || 24,
    });
  };

  const handleAddRuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleTitle.trim()) return;

    await addRule({
      type: newRuleType,
      title: newRuleTitle.trim(),
      points: Number(newRulePoints),
      category: newRuleCategory,
    });

    setNewRuleTitle('');
  };

  const handleStartEditRule = (rule: PointRule) => {
    setEditingRule(rule);
    setEditRuleTitle(rule.title);
    setEditRulePoints(rule.points);
    setEditRuleType(rule.type);
    setEditRuleCategory(rule.category);
  };

  const handleSaveEditRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule || !editRuleTitle.trim()) return;

    await updateRule(editingRule.id, {
      title: editRuleTitle.trim(),
      points: Number(editRulePoints),
      type: editRuleType,
      category: editRuleCategory,
    });

    setEditingRule(null);
  };

  // Route Guard: Chỉ GVCN hoặc tài khoản được phân quyền mới có thể truy cập Cài đặt
  if (currentUser.role !== 'admin' && !hasPermission('canManageRules')) {
    return (
      <AccessDeniedView 
        target="Cài Đặt Quy Chế & Thang Điểm" 
        onNavigateHome={() => window.location.reload()}
      />
    );
  }

  const handleDownloadBackup = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SaoLuu_Lop9A1_THCSVanHa2_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống file sao lưu hệ thống!', 'success');
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.config || !parsed.students) {
          showToast('File sao lưu không đúng định dạng của hệ thống!', 'error');
          return;
        }

        openConfirm({
          title: 'Khôi phục dữ liệu từ bản sao lưu?',
          message: 'Toàn bộ dữ liệu hiện tại sẽ được thay thế bằng dữ liệu trong file sao lưu. Hành động này không thể hoàn tác.',
          confirmText: 'Khôi phục ngay',
          isDestructive: true,
          onConfirm: () => restoreBackup(parsed),
        });
      } catch {
        showToast('Không thể đọc file JSON sao lưu!', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 pb-24 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-700 via-indigo-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-xs rounded-full text-xs font-bold mb-2">
            <Settings className="w-3.5 h-3.5 text-indigo-300" />
            <span>Thiết Lập Hệ Thống</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            CÀI ĐẶT THI ĐUA & SAO LƯU DỮ LIỆU
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Tùy biến quy chế điểm số, bật/tắt duyệt điểm và quản lý sao lưu an toàn.
          </p>
        </div>
      </div>

      {/* SECTION 1: CẤU HÌNH LỚP & CHẾ ĐỘ THI ĐUA */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
          <Settings className="w-4 h-4 text-indigo-600" />
          <span>1. Thông Tin Lớp Học & Chế Độ Duyệt Điểm</span>
        </h3>

        <form onSubmit={handleSaveConfig} className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tên trường học</label>
              <input
                type="text"
                value={configForm.schoolName}
                onChange={(e) => setConfigForm({ ...configForm, schoolName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tên lớp</label>
              <input
                type="text"
                value={configForm.className}
                onChange={(e) => setConfigForm({ ...configForm, className: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Năm học</label>
              <input
                type="text"
                value={configForm.schoolYear}
                onChange={(e) => setConfigForm({ ...configForm, schoolYear: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Giáo viên chủ nhiệm</label>
              <input
                type="text"
                value={configForm.teacherName}
                onChange={(e) => setConfigForm({ ...configForm, teacherName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Điểm gốc đầu kỳ (Mặc định)
              </label>
              <input
                type="number"
                min="0"
                max="200"
                value={configForm.basePoints}
                onChange={(e) => setConfigForm({ ...configForm, basePoints: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-bold text-indigo-700"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Điểm hiện tại = Điểm gốc + Tổng điểm cộng – Tổng điểm trừ
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tuần thi đua hiện tại
              </label>
              <input
                type="number"
                min="1"
                max="35"
                value={configForm.currentWeek}
                onChange={(e) => setConfigForm({ ...configForm, currentWeek: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Thứ tự / Xếp hạng lớp toàn trường
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={configForm.schoolRank}
                onChange={(e) => setConfigForm({ ...configForm, schoolRank: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-bold text-amber-700"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Ví dụ: Hạng 1, Hạng 2... theo dõi thi đua toàn trường
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tổng số lớp trong toàn trường
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={configForm.schoolTotalClasses}
                onChange={(e) => setConfigForm({ ...configForm, schoolTotalClasses: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-bold text-slate-800"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Tổng số lớp (VD: 24 lớp) để hiển thị Hạng {configForm.schoolRank}/{configForm.schoolTotalClasses}
              </span>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="pt-2 space-y-3">
            {/* Approval Mode Toggle */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={configForm.requireApproval}
                onChange={(e) => setConfigForm({ ...configForm, requireApproval: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded mt-0.5 cursor-pointer"
              />
              <div>
                <div className="font-bold text-slate-900 text-xs sm:text-sm">
                  Chế độ kiểm duyệt điểm: Yêu cầu Giáo viên chủ nhiệm duyệt trước khi lưu
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Khi bật: Cán sự lớp nhập điểm sẽ ở trạng thái "Chờ duyệt", GVCN vào mục Duyệt điểm để phê duyệt chính thức.
                </div>
              </div>
            </label>

            {/* Student View Rank */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={configForm.allowStudentViewRank}
                onChange={(e) => setConfigForm({ ...configForm, allowStudentViewRank: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded mt-0.5 cursor-pointer"
              />
              <div>
                <div className="font-bold text-slate-900 text-xs sm:text-sm">
                  Cho phép Học sinh và Phụ huynh xem Bảng xếp hạng thứ bậc
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Tạo động lực thi đua lành mạnh hoặc tắt nếu không muốn công khai thứ bậc.
                </div>
              </div>
            </label>
          </div>

          {currentUser.role === 'admin' && (
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md flex items-center gap-2 cursor-pointer transition-transform"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Cấu Hình Thi Đua</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* SECTION 2: THIẾT LẬP PHÂN QUYỀN CHI TIẾT & BẢO VỆ DỮ LIỆU */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base uppercase tracking-wider">
                2. Phân Quyền Chi Tiết & Bảo Vệ Dữ Liệu Ban Cán Sự
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Quy định quyền tạo cuộc thi, ghi nhận điểm, đánh giá học sinh; khóa quyền xóa dữ liệu đối với ban cán sự.
              </p>
            </div>
          </div>

          {currentUser.role === 'admin' && (
            <button
              onClick={() => setIsPermissionsModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow-md flex items-center gap-2 cursor-pointer transition-transform shrink-0"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Thiết lập phân quyền chi tiết</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="font-bold text-indigo-300 mb-1">Quyền tạo cuộc thi / phong trào</div>
            <div className="text-slate-300 text-[11px]">
              Cho phép GVCN, Lớp trưởng, các Lớp phó khởi tạo cuộc thi và điểm danh nộp bài.
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="font-bold text-amber-300 mb-1">Chỉ GVCN xóa & sửa điểm</div>
            <div className="text-slate-300 text-[11px]">
              Chỉ Giáo viên chủ nhiệm mới có quyền sửa nội dung, sửa mức điểm và xóa cuộc thi.
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="font-bold text-rose-300 mb-1">Khóa quyền xóa dữ liệu</div>
            <div className="text-slate-300 text-[11px]">
              Ban cán sự không có quyền xóa điểm, xóa thi đua hay xóa học sinh để đảm bảo an toàn tuyệt đối.
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: QUẢN LÝ DANH MỤC QUY CHẾ ĐIỂM (CỘNG / TRỪ / BIỂU DƯƠNG) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>2. Danh Mục Lỗi Vi Phạm & Điểm Cộng Quy Chuẩn</span>
          </h3>
          <span className="text-xs text-slate-400">({data.rules.length} quy chế đã thiết lập)</span>
        </div>

        {/* Add New Rule Form (Chỉ dành riêng cho Giáo viên chủ nhiệm) */}
        {currentUser.role === 'admin' ? (
          <form onSubmit={handleAddRuleSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
            <div className="sm:col-span-3">
              <label className="block font-bold text-slate-700 mb-1">Loại quy chế</label>
              <select
                value={newRuleType}
                onChange={(e: any) => setNewRuleType(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold"
              >
                <option value="tru">Lỗi vi phạm (Trừ điểm)</option>
                <option value="cong">Điểm cộng (Khuyến khích)</option>
                <option value="bieu_duong">Biểu dương (Khen thưởng)</option>
              </select>
            </div>

            <div className="sm:col-span-4">
              <label className="block font-bold text-slate-700 mb-1">Tên hành vi / Lỗi *</label>
              <input
                type="text"
                required
                placeholder="VD: Không mặc đồng phục..."
                value={newRuleTitle}
                onChange={(e) => setNewRuleTitle(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Số điểm</label>
              <input
                type="number"
                min="1"
                max="20"
                required
                value={newRulePoints}
                onChange={(e) => setNewRulePoints(Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Lĩnh vực</label>
              <select
                value={newRuleCategory}
                onChange={(e: any) => setNewRuleCategory(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg"
              >
                <option value="Học tập">Học tập</option>
                <option value="Nề nếp">Nề nếp</option>
                <option value="Văn thể mỹ">Văn thể mỹ</option>
                <option value="Vệ sinh - Trực nhật">Vệ sinh</option>
                <option value="Hoạt động chung">Chung</option>
              </select>
            </div>

            <div className="sm:col-span-1 flex items-end">
              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center justify-center cursor-pointer shadow-xs"
                title="Thêm quy chế mới"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-amber-50/70 border border-amber-200 text-amber-900 text-xs p-3 rounded-xl flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Chức năng thêm, chỉnh sửa thang điểm và xóa quy chế chỉ dành riêng cho <strong>Giáo viên chủ nhiệm</strong>.</span>
          </div>
        )}

        {/* Rules Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Loại</th>
                <th className="py-2.5 px-3">Nội dung quy chế</th>
                <th className="py-2.5 px-3">Lĩnh vực</th>
                <th className="py-2.5 px-3 text-center">Số điểm</th>
                {currentUser.role === 'admin' && <th className="py-2.5 px-3 text-center">Thao tác (GVCN)</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.rules.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      r.type === 'tru' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {r.type === 'tru' ? 'Trừ điểm' : r.type === 'cong' ? 'Cộng điểm' : 'Biểu dương'}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-900">{r.title}</td>
                  <td className="py-2 px-3 text-slate-500">{r.category}</td>
                  <td className="py-2 px-3 text-center font-black">
                    {r.type === 'tru' ? `-${r.points}đ` : `+${r.points}đ`}
                  </td>
                  {currentUser.role === 'admin' && (
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEditRule(r)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                          title="Chỉnh sửa thang điểm & nội dung"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            openConfirm({
                              title: `Xóa quy chế: ${r.title}?`,
                              message: 'Bạn có chắc chắn muốn xóa quy chế này khỏi danh mục tính điểm không?',
                              confirmText: 'Xóa ngay',
                              isDestructive: true,
                              onConfirm: () => deleteRule(r.id),
                            });
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                          title="Xóa quy chế này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: XÓA DỮ LIỆU THI ĐUA THEO TUẦN / THÁNG */}
      {(currentUser.role === 'admin' || hasPermission('canDeletePeriodPoints')) && (
        <div className="bg-white rounded-2xl border border-rose-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-rose-100 pb-3">
            <h3 className="font-bold text-rose-950 text-sm uppercase tracking-wider flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>3. Xóa Dữ Liệu Thi Đua Của 1 Tuần / Tháng</span>
            </h3>
            <span className="text-[11px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
              Thao tác an toàn • Không ảnh hưởng tuần khác
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Chức năng cho phép xóa toàn bộ các điểm cộng, điểm trừ, biểu dương phát sinh trong một <strong>Tuần</strong> hoặc một <strong>Tháng</strong> cụ thể (ví dụ khi kết thúc tuần hoặc khi muốn nhập lại dữ liệu thi đua của kỳ đó từ đầu).
          </p>

          <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">Loại kỳ cần xóa</label>
              <select
                value={clearPeriodType}
                onChange={(e) => setClearPeriodType(e.target.value as 'week' | 'month')}
                className="w-full px-3 py-2 text-xs font-bold bg-white border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="week">📅 Theo Tuần thi đua</option>
                <option value="month">🗓️ Theo Tháng</option>
              </select>
            </div>

            {clearPeriodType === 'week' ? (
              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">Chọn Tuần cần xóa dữ liệu</label>
                <select
                  value={targetClearWeek}
                  onChange={(e) => setTargetClearWeek(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-bold bg-white border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {Array.from({ length: 35 }, (_, i) => i + 1).map((w) => {
                    const countInWeek = (data.transactions || []).filter(t => t.weekNumber === w).length;
                    return (
                      <option key={w} value={w}>
                        Tuần {w} {w === data.config.currentWeek ? '(Tuần hiện tại)' : ''} — [{countInWeek} lượt ghi điểm]
                      </option>
                    );
                  })}
                </select>
              </div>
            ) : (
              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">Chọn Tháng cần xóa dữ liệu</label>
                <select
                  value={targetClearMonth}
                  onChange={(e) => setTargetClearMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-bold bg-white border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {[9, 10, 11, 12, 1, 2, 3, 4, 5].map((m) => {
                    const countInMonth = (data.transactions || []).filter(t => t.month === m).length;
                    return (
                      <option key={m} value={m}>
                        Tháng {m} {m === data.config.currentMonth ? '(Tháng hiện tại)' : ''} — [{countInMonth} lượt ghi điểm]
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <div className="sm:col-span-5 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  const label = clearPeriodType === 'week' ? `Tuần ${targetClearWeek}` : `Tháng ${targetClearMonth}`;
                  const count = (data.transactions || []).filter(t => 
                    clearPeriodType === 'week' ? t.weekNumber === targetClearWeek : t.month === targetClearMonth
                  ).length;

                  openConfirm({
                    title: `Xác nhận xóa thi đua ${label}?`,
                    message: `Bạn đang chọn xóa toàn bộ ${count} lượt ghi nhận điểm cộng/trừ/biểu dương của ${label}. Điểm gốc và dữ liệu của các tuần/tháng khác sẽ được giữ nguyên an toàn.`,
                    confirmText: `Xóa thi đua ${label}`,
                    isDestructive: true,
                    onConfirm: async () => {
                      await clearPeriodTransactions(clearPeriodType, clearPeriodType === 'week' ? targetClearWeek : targetClearMonth);
                    }
                  });
                }}
                className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa thi đua {clearPeriodType === 'week' ? `Tuần ${targetClearWeek}` : `Tháng ${targetClearMonth}`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: SAO LƯU & KHÔI PHỤC DỮ LIỆU */}
      {currentUser.role === 'admin' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldAlert className="w-4 h-4 text-emerald-600" />
            <span>4. An Toàn Dữ Liệu: Sao Lưu & Khôi Phục</span>
          </h3>

          <p className="text-xs text-slate-600 leading-relaxed">
            Dữ liệu lớp 9A1 được lưu bền vững trên máy chủ. Bạn có thể tải bản sao lưu về máy tính hoặc khôi phục bất cứ lúc nào.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
            {/* Open Full Snapshot Manager Modal */}
            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="p-4 rounded-xl border-2 border-indigo-200 hover:border-indigo-500 bg-indigo-50/50 hover:bg-indigo-50 text-left transition-all cursor-pointer flex flex-col justify-between shadow-2xs group"
            >
              <div>
                <Database className="w-5 h-5 text-indigo-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <div className="font-bold text-slate-800 text-xs sm:text-sm">Quản Lý Sao Lưu</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Tạo điểm khôi phục & xem các bản lưu trữ</div>
              </div>
            </button>

            {/* Backup Button */}
            <button
              onClick={handleDownloadBackup}
              className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/40 text-left transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <Download className="w-5 h-5 text-indigo-600 mb-1.5" />
                <div className="font-bold text-slate-800 text-xs sm:text-sm">Tải File .JSON</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Xuất toàn bộ học sinh & điểm số về máy</div>
              </div>
            </button>

            {/* Restore Button */}
            <div
              onClick={() => backupInputRef.current?.click()}
              className="p-4 rounded-xl border border-slate-200 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50/40 text-left transition-all cursor-pointer flex flex-col justify-between"
            >
              <input
                ref={backupInputRef}
                type="file"
                accept=".json"
                onChange={handleRestoreFile}
                className="hidden"
              />
              <div>
                <Upload className="w-5 h-5 text-emerald-600 mb-1.5" />
                <div className="font-bold text-slate-800 text-xs sm:text-sm">Nạp File .JSON</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Khôi phục từ file sao lưu trên máy tính</div>
              </div>
            </div>

            {/* Reset Demo */}
            <button
              onClick={() => {
                openConfirm({
                  title: 'Đặt lại dữ liệu mẫu Demo?',
                  message: 'Hệ thống sẽ nạp lại toàn bộ danh sách 41 học sinh mẫu Lớp 9A1 và dữ liệu thi đua ban đầu.',
                  confirmText: 'Đặt lại mẫu',
                  isDestructive: true,
                  onConfirm: resetDemoData,
                });
              }}
              className="p-4 rounded-xl border border-slate-200 hover:border-rose-400 bg-slate-50 hover:bg-rose-50/40 text-left transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <RotateCcw className="w-5 h-5 text-rose-600 mb-1.5" />
                <div className="font-bold text-slate-800 text-xs sm:text-sm">Dữ Liệu Demo Gốc</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Khởi tạo lại 41 học sinh Lớp 9A1</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Backup & Restore Modal */}
      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />

      {/* Edit Rule Modal (Chỉ dành riêng cho GVCN) */}
      {editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">Chỉnh Sửa Thang Điểm & Quy Chế</h3>
                  <p className="text-[11px] text-slate-500">Dành riêng cho Giáo viên chủ nhiệm</p>
                </div>
              </div>
              <button
                onClick={() => setEditingRule(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditRule} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Loại quy chế</label>
                <select
                  value={editRuleType}
                  onChange={(e: any) => setEditRuleType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="tru">Lỗi vi phạm (Trừ điểm)</option>
                  <option value="cong">Điểm cộng (Khuyến khích)</option>
                  <option value="bieu_duong">Biểu dương (Khen thưởng)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên hành vi / Nội dung quy chế *</label>
                <input
                  type="text"
                  required
                  value={editRuleTitle}
                  onChange={(e) => setEditRuleTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder="Nhập tên lỗi hoặc điểm cộng..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số điểm thang quy đổi</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={editRulePoints}
                    onChange={(e) => setEditRulePoints(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lĩnh vực</label>
                  <select
                    value={editRuleCategory}
                    onChange={(e: any) => setEditRuleCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Học tập">Học tập</option>
                    <option value="Nề nếp">Nề nếp</option>
                    <option value="Văn thể mỹ">Văn thể mỹ</option>
                    <option value="Vệ sinh - Trực nhật">Vệ sinh</option>
                    <option value="Hoạt động chung">Chung</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Thang Điểm</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      <PermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
      />
    </div>
  );
};
