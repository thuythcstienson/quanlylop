import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Student, Gender } from '../../types';
import { 
  Users, 
  Search, 
  UserPlus, 
  FileUp, 
  FileSpreadsheet, 
  Download,
  Edit3, 
  Trash2, 
  ArrowRightLeft, 
  Phone, 
  Calendar,
  X,
  Check,
  Sparkles,
  AlertTriangle,
  CheckSquare,
  Square,
  HelpCircle,
  Award,
  UserCheck,
  UserX,
  Crown,
  ShieldCheck
} from 'lucide-react';
import { exportMultiSheetExcel, downloadSampleExcelTemplate } from '../../utils/exportUtils';

interface StudentsViewProps {
  onOpenExcelImport: () => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({ onOpenExcelImport }) => {
  const { 
    data, 
    currentUser, 
    addStudent, 
    updateStudent, 
    deleteStudent, 
    clearAllStudents,
    batchDeleteStudents,
    autoDivideTeams,
    batchAssignTeam,
    getStudentScore, 
    openConfirm,
    showToast
  } = useApp();

  const [activeTeamTab, setActiveTeamTab] = useState<number | 'all' | 'unassigned'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected student IDs for batch actions
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDivideModalOpen, setIsDivideModalOpen] = useState(false);
  const [divideMode, setDivideMode] = useState<'round_robin' | 'sequential' | 'balance_gender'>('round_robin');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [movingStudent, setMovingStudent] = useState<Student | null>(null);
  const [targetTeamId, setTargetTeamId] = useState<number>(1);

  // Appointing / Dismissing officer state
  const [appointingStudent, setAppointingStudent] = useState<Student | null>(null);
  const [customRoleText, setCustomRoleText] = useState('');

  // Form state for add/edit
  const [formData, setFormData] = useState({
    name: '',
    gender: 'Nam' as Gender,
    birthDate: '',
    birthPlace: '',
    permanentAddress: '',
    teamId: 1,
    roleTitle: 'Thành viên',
    parentName: '',
    parentPhone: '',
    notes: '',
  });

  // Count unassigned students (teamId === 0 or undefined)
  const unassignedCount = useMemo(() => {
    return data.students.filter(s => !s.teamId || s.teamId === 0).length;
  }, [data.students]);

  // Current officers in class
  const classOfficers = useMemo(() => {
    return data.students.filter(s => s.roleTitle && s.roleTitle !== 'Thành viên');
  }, [data.students]);

  // Filtered list
  const filteredStudents = useMemo(() => {
    let list = data.students;
    if (activeTeamTab === 'unassigned') {
      list = list.filter(s => !s.teamId || s.teamId === 0);
    } else if (activeTeamTab !== 'all') {
      list = list.filter(s => s.teamId === activeTeamTab);
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(s => 
      s.name.toLowerCase().includes(q) ||
      String(s.stt).includes(q) ||
      s.roleTitle.toLowerCase().includes(q) ||
      (s.birthPlace && s.birthPlace.toLowerCase().includes(q)) ||
      (s.permanentAddress && s.permanentAddress.toLowerCase().includes(q)) ||
      (s.parentPhone && s.parentPhone.includes(q))
    );
  }, [data.students, activeTeamTab, searchQuery]);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map(s => s.id));
    }
  };

  // Open add student modal
  const handleOpenAdd = () => {
    setFormData({
      name: '',
      gender: 'Nam',
      birthDate: '2011-01-01',
      birthPlace: '',
      permanentAddress: '',
      teamId: activeTeamTab === 'all' || activeTeamTab === 'unassigned' ? 0 : Number(activeTeamTab),
      roleTitle: 'Thành viên',
      parentName: '',
      parentPhone: '',
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      gender: student.gender,
      birthDate: student.birthDate || '',
      birthPlace: student.birthPlace || '',
      permanentAddress: student.permanentAddress || '',
      teamId: student.teamId || 1,
      roleTitle: student.roleTitle,
      parentName: student.parentName || '',
      parentPhone: student.parentPhone || '',
      notes: student.notes || '',
    });
    setIsAddModalOpen(true);
  };

  // Direct Officer Appointment / Dismissal (1-click inline)
  const handleDirectAppoint = async (student: Student, newRole: string) => {
    if (student.roleTitle === newRole) return;
    await updateStudent(student.id, { roleTitle: newRole });
    if (newRole === 'Thành viên') {
      showToast(`Đã bãi nhiệm cán sự của ${student.name} (chuyển về Thành viên).`, 'info');
    } else {
      showToast(`✓ Đã bổ nhiệm ${student.name} giữ chức vụ "${newRole}"!`, 'success');
    }
  };

  // Batch Appoint / Dismiss for multiple selected students
  const handleBatchAppoint = async (newRole: string) => {
    if (selectedStudentIds.length === 0) return;
    for (const sId of selectedStudentIds) {
      await updateStudent(sId, { roleTitle: newRole });
    }
    if (newRole === 'Thành viên') {
      showToast(`Đã bãi nhiệm cán sự của ${selectedStudentIds.length} học sinh được chọn.`, 'info');
    } else {
      showToast(`✓ Đã bổ nhiệm ${selectedStudentIds.length} học sinh thành "${newRole}"!`, 'success');
    }
    setSelectedStudentIds([]);
  };

  // Submit Add or Edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingStudent) {
      await updateStudent(editingStudent.id, {
        name: formData.name.trim(),
        gender: formData.gender,
        birthDate: formData.birthDate,
        birthPlace: formData.birthPlace.trim(),
        permanentAddress: formData.permanentAddress.trim(),
        teamId: Number(formData.teamId),
        roleTitle: formData.roleTitle,
        parentName: formData.parentName,
        parentPhone: formData.parentPhone,
        notes: formData.notes,
      });
      setEditingStudent(null);
    } else {
      await addStudent({
        name: formData.name.trim(),
        gender: formData.gender,
        birthDate: formData.birthDate,
        birthPlace: formData.birthPlace.trim(),
        permanentAddress: formData.permanentAddress.trim(),
        teamId: Number(formData.teamId),
        roleTitle: formData.roleTitle,
        parentName: formData.parentName,
        parentPhone: formData.parentPhone,
        notes: formData.notes,
      });
      setIsAddModalOpen(false);
    }
  };

  // Move student to another team
  const handleConfirmMoveTeam = async () => {
    if (!movingStudent) return;
    await updateStudent(movingStudent.id, { teamId: targetTeamId });
    setMovingStudent(null);
  };

  // Batch assign selected to a team
  const handleBatchAssign = async (tId: number) => {
    if (selectedStudentIds.length === 0) return;
    await batchAssignTeam(selectedStudentIds, tId);
    setSelectedStudentIds([]);
  };

  // Batch delete selected students
  const handleBatchDelete = () => {
    if (selectedStudentIds.length === 0) return;
    openConfirm({
      title: `Xóa ${selectedStudentIds.length} học sinh đã chọn?`,
      message: 'Hệ thống sẽ xóa vĩnh viễn các học sinh này cùng toàn bộ điểm số và lịch sử thi đua liên quan.',
      confirmText: 'Xóa các em đã chọn',
      isDestructive: true,
      onConfirm: async () => {
        await batchDeleteStudents(selectedStudentIds);
        setSelectedStudentIds([]);
      }
    });
  };

  // Clear all students
  const handleClearAll = () => {
    openConfirm({
      title: 'Xóa toàn bộ học sinh của lớp?',
      message: `CẢNH BÁO: Toàn bộ ${data.students.length} học sinh và dữ liệu thi đua sẽ bị xóa trắng để bạn nạp danh sách lớp mới từ đầu. Bạn có chắc chắn muốn thực hiện?`,
      confirmText: 'Xác nhận xóa hết',
      cancelText: 'Hủy bỏ',
      isDestructive: true,
      onConfirm: async () => {
        await clearAllStudents();
        setSelectedStudentIds([]);
      }
    });
  };

  // Run auto divide
  const handleRunAutoDivide = async () => {
    await autoDivideTeams(divideMode);
    setIsDivideModalOpen(false);
  };

  const handleDownloadTemplate = () => {
    downloadSampleExcelTemplate();
    showToast('Đã tải xuống file Excel mẫu (Mau_Danh_Sach_Hoc_Sinh_Lop9A1.xlsx)!', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-24 space-y-5">
      {/* Top Bar with actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600 shrink-0" />
            <span>Quản Lý Học Sinh & Chia Tổ</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Lớp 9A1 • Sĩ số: <strong>{data.students.length} học sinh</strong> • {unassignedCount > 0 ? (
              <span className="text-amber-700 font-bold">{unassignedCount} em chưa chia tổ</span>
            ) : (
              <span className="text-emerald-700 font-bold">100% đã được phân vào 4 tổ</span>
            )}
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {currentUser.role === 'admin' && (
            <>
              {/* Tải file Excel mẫu */}
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Tải file mẫu Excel chuẩn để điền danh sách học sinh"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>File Excel Mẫu</span>
              </button>

              {/* Nhập từ Excel */}
              <button
                type="button"
                onClick={onOpenExcelImport}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileUp className="w-4 h-4 text-indigo-600" />
                <span>Nhập Excel</span>
              </button>

              {/* Chia tổ tự động */}
              {data.students.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsDivideModalOpen(true)}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="Chia đều danh sách học sinh cả lớp vào 4 tổ"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Chia tổ tự động</span>
                </button>
              )}

              {/* Thêm 1 học sinh thủ công */}
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Thêm học sinh</span>
              </button>

              {/* Xóa toàn bộ học sinh */}
              {data.students.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Xóa sạch toàn bộ học sinh để làm mới danh sách lớp"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Xóa toàn bộ</span>
                </button>
              )}
            </>
          )}

          {/* Xuất Excel */}
          <button
            type="button"
            onClick={() => exportMultiSheetExcel(data)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* Ban Cán Sự Lớp Summary Widget */}
      {classOfficers.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50/90 via-indigo-50/70 to-slate-50 border border-purple-200 rounded-2xl p-3 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-purple-700" />
              <span className="font-bold text-xs sm:text-sm text-purple-950">
                Ban Cán Sự Lớp & Ban Cán Sự Tổ ({classOfficers.length} cán sự)
              </span>
            </div>
            {currentUser.role === 'admin' && (
              <span className="text-[11px] text-purple-700 font-medium hidden sm:inline">
                💡 Bấm vào menu chức vụ trên từng dòng hoặc nút 🎖️ để bổ nhiệm / bãi nhiệm nhanh
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {classOfficers.map(officer => (
              <div
                key={officer.id}
                className="bg-white border border-purple-200/90 rounded-xl px-2.5 py-1.5 flex items-center gap-2 text-xs shadow-2xs hover:shadow-xs transition-shadow"
              >
                <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-800 font-bold flex items-center justify-center text-[10px] shrink-0">
                  {officer.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-slate-900 leading-tight truncate max-w-[120px] sm:max-w-[150px]">{officer.name}</div>
                  <div className="text-[10px] text-purple-700 font-semibold flex items-center gap-1">
                    <span>{officer.roleTitle}</span>
                    {officer.teamId > 0 && <span className="text-slate-400 font-normal">• Tổ {officer.teamId}</span>}
                  </div>
                </div>

                {currentUser.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setAppointingStudent(officer);
                      setCustomRoleText('');
                    }}
                    title={`Đổi chức vụ hoặc bãi nhiệm ${officer.name}`}
                    className="p-1 hover:bg-purple-100 text-purple-600 rounded-lg cursor-pointer transition-colors ml-0.5"
                  >
                    <Award className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Tabs + Unassigned Tab */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTeamTab('all')}
          className={`pb-2.5 px-3 font-bold text-xs sm:text-sm whitespace-nowrap transition-all border-b-2 cursor-pointer ${
            activeTeamTab === 'all'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Cả lớp ({data.students.length})
        </button>

        {[1, 2, 3, 4].map(tId => {
          const count = data.students.filter(s => s.teamId === tId).length;
          return (
            <button
              key={tId}
              onClick={() => setActiveTeamTab(tId)}
              className={`pb-2.5 px-3 font-bold text-xs sm:text-sm whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                activeTeamTab === tId
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Tổ {tId} ({count} HS)
            </button>
          );
        })}

        {unassignedCount > 0 && (
          <button
            onClick={() => setActiveTeamTab('unassigned')}
            className={`pb-2.5 px-3 font-bold text-xs sm:text-sm whitespace-nowrap transition-all border-b-2 cursor-pointer ${
              activeTeamTab === 'unassigned'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-amber-600 hover:text-amber-800'
            }`}
          >
            ⚠️ Chưa chia tổ ({unassignedCount})
          </button>
        )}
      </div>

      {/* Prominent banner for dividing students into teams */}
      {unassignedCount > 0 && currentUser.role === 'admin' && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm">
                Danh sách có <span className="underline font-black">{unassignedCount} học sinh</span> chưa được phân vào tổ!
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                Sau khi có đầy đủ danh sách cả lớp, bạn có thể bấm &quot;Chia tổ tự động&quot; để hệ thống chia đều vào 4 tổ theo vòng tròn hoặc cân bằng giới tính, hoặc chọn từng em để gán tổ.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsDivideModalOpen(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chia 4 tổ tự động ngay</span>
            </button>
          </div>
        </div>
      )}

      {/* Search Input & Select All Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên học sinh, STT, SĐT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          />
        </div>

        {/* Selected count info */}
        {currentUser.role === 'admin' && filteredStudents.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <button
              onClick={handleSelectAll}
              className="font-bold text-indigo-600 hover:underline cursor-pointer flex items-center gap-1"
            >
              {selectedStudentIds.length === filteredStudents.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả danh sách này'}
            </button>
            <span>• Đang chọn {selectedStudentIds.length}/{filteredStudents.length} em</span>
          </div>
        )}
      </div>

      {/* Floating Batch Action Bar for Quick Team Assignment, Officer Appoint/Dismiss & Bulk Delete */}
      {selectedStudentIds.length > 0 && currentUser.role === 'admin' && (
        <div className="sticky top-16 z-30 bg-slate-900 text-white p-3 sm:px-4 rounded-2xl shadow-xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center font-black text-xs">
              {selectedStudentIds.length}
            </span>
            <span className="text-xs sm:text-sm font-bold">
              Đã chọn {selectedStudentIds.length} học sinh
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Chuyển tổ */}
            <span className="text-[11px] text-slate-400 font-semibold hidden md:inline ml-1">Chuyển:</span>
            {[1, 2, 3, 4].map(tId => (
              <button
                key={tId}
                type="button"
                onClick={() => handleBatchAssign(tId)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer"
              >
                Tổ {tId}
              </button>
            ))}

            {/* Bãi nhiệm hàng loạt */}
            <button
              type="button"
              onClick={() => {
                openConfirm({
                  title: `Bãi nhiệm ${selectedStudentIds.length} học sinh đã chọn?`,
                  message: `Chuyển chức vụ của ${selectedStudentIds.length} em về "Thành viên" (không giữ chức vụ cán sự).`,
                  confirmText: 'Bãi nhiệm về Thành viên',
                  onConfirm: () => handleBatchAppoint('Thành viên'),
                });
              }}
              className="px-3 py-1.5 bg-amber-600/90 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1 ml-1"
              title="Bãi nhiệm chức vụ các em đã chọn"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Bãi nhiệm ({selectedStudentIds.length})</span>
            </button>

            {/* Xóa hàng loạt */}
            <button
              type="button"
              onClick={handleBatchDelete}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1 ml-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa ({selectedStudentIds.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStudentIds([])}
              className="p-1.5 text-slate-400 hover:text-white cursor-pointer ml-1"
              title="Bỏ chọn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Students Roster Table */}
      {data.students.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
          <Users className="w-14 h-14 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">Danh sách học sinh đang trống</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
            Bạn có thể tải file Excel mẫu về điền thông tin cả lớp, sau đó bấm nút "Nhập Excel" để đưa danh sách vào hệ thống.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Tải file Excel mẫu (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={onOpenExcelImport}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <FileUp className="w-4 h-4" />
              <span>Tải danh sách Excel lên</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold">
                  {currentUser.role === 'admin' && (
                    <th className="py-3 px-3 text-center w-10 border border-slate-200">
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="py-3 px-3 text-center w-12 border border-slate-200">STT</th>
                  <th className="py-3 px-3 border border-slate-200">Họ và tên</th>
                  <th className="py-3 px-3 text-center w-16 border border-slate-200">Tổ</th>
                  <th className="py-3 px-3 border border-slate-200">Chức vụ</th>
                  <th className="py-3 px-3 text-center hidden md:table-cell w-20 border border-slate-200">Giới tính</th>
                  <th className="py-3 px-3 hidden lg:table-cell border border-slate-200">Phụ huynh & SĐT</th>
                  <th className="py-3 px-3 text-center w-28 border border-slate-200">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s, idx) => {
                  const isSelected = selectedStudentIds.includes(s.id);

                  return (
                    <tr 
                      key={s.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-indigo-50/50' : 'even:bg-slate-50/30'
                      }`}
                    >
                      {currentUser.role === 'admin' && (
                        <td className="py-2.5 px-3 text-center border border-slate-200/80">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(s.id)}
                            className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                          />
                        </td>
                      )}

                      <td className="py-2.5 px-3 text-center font-bold text-slate-500 border border-slate-200/80">{s.stt || idx + 1}</td>
                      
                      <td className="py-2.5 px-3 border border-slate-200/80">
                        <div className="font-bold text-slate-900">{s.name}</div>
                        <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span>{s.birthDate ? s.birthDate : 'Chưa có ngày sinh'}</span>
                          {s.birthPlace && (
                            <>
                              <span>•</span>
                              <span className="text-slate-500 font-medium" title="Nơi sinh">📍 {s.birthPlace}</span>
                            </>
                          )}
                          {s.permanentAddress && (
                            <>
                              <span>•</span>
                              <span className="text-slate-500 truncate max-w-[180px]" title={`Nơi thường trú: ${s.permanentAddress}`}>🏠 {s.permanentAddress}</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-center border border-slate-200/80">
                        {s.teamId && s.teamId > 0 ? (
                          <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded text-xs border border-indigo-200/60">
                            Tổ {s.teamId}
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[11px]">
                            Chưa gán
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 border border-slate-200/80">
                        {currentUser.role === 'admin' ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={s.roleTitle}
                              onChange={(e) => handleDirectAppoint(s, e.target.value)}
                              className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                                s.roleTitle.includes('Lớp trưởng')
                                  ? 'bg-purple-100 text-purple-900 border-purple-300 font-extrabold'
                                  : s.roleTitle.includes('Lớp phó')
                                  ? 'bg-blue-100 text-blue-900 border-blue-300 font-bold'
                                  : s.roleTitle.includes('Tổ trưởng')
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold'
                                  : s.roleTitle.includes('Tổ phó')
                                  ? 'bg-teal-100 text-teal-900 border-teal-300 font-semibold'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                              title="Bấm để bổ nhiệm hoặc bãi nhiệm chức vụ trực tiếp"
                            >
                              <option value="Thành viên">Thành viên (Không chức vụ)</option>
                              <optgroup label="Ban Cán Sự Lớp">
                                <option value="Lớp trưởng">⭐ Lớp trưởng</option>
                                <option value="Lớp phó học tập">📘 Lớp phó học tập</option>
                                <option value="Lớp phó nề nếp">🛡️ Lớp phó nề nếp</option>
                                <option value="Lớp phó văn thể mỹ">🎨 Lớp phó văn thể mỹ</option>
                                <option value="Lớp phó lao động">🌿 Lớp phó lao động</option>
                              </optgroup>
                              <optgroup label={`Ban Cán Sự Tổ (Tổ ${s.teamId || 1})`}>
                                <option value="Tổ trưởng">🚩 Tổ trưởng</option>
                                <option value="Tổ phó">🌱 Tổ phó</option>
                              </optgroup>
                              {s.roleTitle && !['Thành viên', 'Lớp trưởng', 'Lớp phó học tập', 'Lớp phó nề nếp', 'Lớp phó văn thể mỹ', 'Lớp phó lao động', 'Tổ trưởng', 'Tổ phó'].includes(s.roleTitle) && (
                                <option value={s.roleTitle}>🔹 {s.roleTitle}</option>
                              )}
                            </select>

                            {/* Quick 1-click dismiss button */}
                            {s.roleTitle !== 'Thành viên' && (
                              <button
                                type="button"
                                onClick={() => {
                                  openConfirm({
                                    title: `Bãi nhiệm chức vụ?`,
                                    message: `Bãi nhiệm chức vụ "${s.roleTitle}" của ${s.name} về lại Thành viên thông thường?`,
                                    confirmText: 'Bãi nhiệm',
                                    isDestructive: true,
                                    onConfirm: () => handleDirectAppoint(s, 'Thành viên'),
                                  });
                                }}
                                title={`Bãi nhiệm chức vụ ${s.roleTitle} của ${s.name}`}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer shrink-0"
                              >
                                <UserX className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            s.roleTitle.includes('Lớp trưởng')
                              ? 'bg-purple-100 text-purple-800'
                              : s.roleTitle.includes('Lớp phó')
                              ? 'bg-blue-100 text-blue-800'
                              : s.roleTitle.includes('Tổ trưởng')
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.roleTitle.includes('Tổ phó')
                              ? 'bg-teal-100 text-teal-800'
                              : 'text-slate-600'
                          }`}>
                            {s.roleTitle}
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center hidden md:table-cell text-slate-600 border border-slate-200/80">
                        {s.gender}
                      </td>

                      <td className="py-2.5 px-3 hidden lg:table-cell text-xs text-slate-600 border border-slate-200/80">
                        <div>{s.parentName || 'Chưa cập nhật'}</div>
                        {s.parentPhone && (
                          <div className="text-slate-400 font-mono text-[11px]">{s.parentPhone}</div>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center border border-slate-200/80">
                        <div className="flex items-center justify-center gap-1">
                          {currentUser.role === 'admin' ? (
                            <>
                              {/* Nút Bổ nhiệm / Bãi nhiệm chi tiết */}
                              <button
                                onClick={() => {
                                  setAppointingStudent(s);
                                  setCustomRoleText('');
                                }}
                                title={`Bổ nhiệm / Bãi nhiệm chức vụ cán sự cho ${s.name}`}
                                className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Award className="w-3.5 h-3.5" />
                              </button>

                              {/* Nút chuyển tổ */}
                              <button
                                onClick={() => {
                                  setMovingStudent(s);
                                  setTargetTeamId(s.teamId === 4 ? 1 : (s.teamId || 0) + 1);
                                }}
                                title="Chuyển sang tổ khác"
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                              </button>

                              {/* Nút sửa thông tin */}
                              <button
                                onClick={() => handleOpenEdit(s)}
                                title="Sửa thông tin học sinh"
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Nút xóa từng học sinh */}
                              <button
                                onClick={() => {
                                  openConfirm({
                                    title: `Xóa học sinh ${s.name}?`,
                                    message: `Bạn có chắc chắn muốn xóa học sinh ${s.name} (Tổ ${s.teamId || 'Chưa chia'})? Điểm và lịch sử của em này sẽ bị xóa khỏi hệ thống.`,
                                    confirmText: 'Xóa học sinh',
                                    isDestructive: true,
                                    onConfirm: () => deleteStudent(s.id),
                                  });
                                }}
                                title={`Xóa học sinh ${s.name}`}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Chỉ xem</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: CHIA TỔ TỰ ĐỘNG */}
      {isDivideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Chia Tổ Tự Động Cả Lớp</h3>
                  <p className="text-xs text-slate-500">Áp dụng cho {data.students.length} học sinh</p>
                </div>
              </div>
              <button onClick={() => setIsDivideModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Chọn phương thức để hệ thống tự động phân bố đều {data.students.length} học sinh vào 4 tổ (mỗi tổ khoảng {Math.round(data.students.length / 4)} em):
            </p>

            <div className="space-y-2.5 mb-5 text-xs">
              {/* Option 1: Round Robin */}
              <label className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                divideMode === 'round_robin' ? 'border-indigo-600 bg-indigo-50/60 font-semibold' : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="divideMode"
                  checked={divideMode === 'round_robin'}
                  onChange={() => setDivideMode('round_robin')}
                  className="mt-0.5 text-indigo-600"
                />
                <div>
                  <div className="font-bold text-slate-900">Chia vòng tròn xen kẽ (Khuyên dùng)</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Học sinh 1 $\rightarrow$ Tổ 1, 2 $\rightarrow$ Tổ 2, 3 $\rightarrow$ Tổ 3, 4 $\rightarrow$ Tổ 4, 5 $\rightarrow$ Tổ 1... Cân bằng học lực và ngẫu nhiên.
                  </div>
                </div>
              </label>

              {/* Option 2: Balance Gender */}
              <label className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                divideMode === 'balance_gender' ? 'border-indigo-600 bg-indigo-50/60 font-semibold' : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="divideMode"
                  checked={divideMode === 'balance_gender'}
                  onChange={() => setDivideMode('balance_gender')}
                  className="mt-0.5 text-indigo-600"
                />
                <div>
                  <div className="font-bold text-slate-900">Cân bằng giới tính Nam / Nữ</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Tách riêng danh sách nam và nữ, chia đều tỉ lệ nam và nữ vào từng tổ.
                  </div>
                </div>
              </label>

              {/* Option 3: Sequential */}
              <label className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                divideMode === 'sequential' ? 'border-indigo-600 bg-indigo-50/60 font-semibold' : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="divideMode"
                  checked={divideMode === 'sequential'}
                  onChange={() => setDivideMode('sequential')}
                  className="mt-0.5 text-indigo-600"
                />
                <div>
                  <div className="font-bold text-slate-900">Chia theo thứ tự số thứ tự (STT)</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Các em đầu danh sách vào Tổ 1, tiếp theo vào Tổ 2, Tổ 3, Tổ 4.
                  </div>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDivideModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleRunAutoDivide}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tiến hành chia tổ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT STUDENT MODAL */}
      {(isAddModalOpen || editingStudent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden transform animate-in zoom-in-95">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-700 to-blue-700 text-white flex items-center justify-between">
              <h3 className="font-bold text-base sm:text-lg">
                {editingStudent ? `Cập Nhật Học Sinh: ${editingStudent.name}` : 'Thêm Học Sinh Mới'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingStudent(null);
                }}
                className="p-1.5 hover:bg-white/20 rounded-xl transition-colors cursor-pointer text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-4 sm:p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Họ và tên học sinh *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nguyễn Văn An"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tổ thi đua
                  </label>
                  <select
                    value={formData.teamId}
                    onChange={(e) => setFormData({ ...formData, teamId: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  >
                    <option value={0}>Chưa phân tổ (Chờ chia sau)</option>
                    <option value={1}>Tổ 1</option>
                    <option value={2}>Tổ 2</option>
                    <option value={3}>Tổ 3</option>
                    <option value={4}>Tổ 4</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Giới tính
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Chức vụ trong lớp
                  </label>
                  <select
                    value={formData.roleTitle}
                    onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  >
                    <option value="Thành viên">Thành viên</option>
                    <option value="Lớp trưởng">Lớp trưởng</option>
                    <option value="Lớp phó học tập">Lớp phó học tập</option>
                    <option value="Lớp phó nề nếp">Lớp phó nề nếp</option>
                    <option value="Lớp phó văn thể mỹ">Lớp phó văn thể mỹ</option>
                    <option value="Tổ trưởng">Tổ trưởng</option>
                    <option value="Tổ phó">Tổ phó</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nơi sinh (Tỉnh / TP)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Việt Yên, Bắc Giang"
                    value={formData.birthPlace}
                    onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nơi thường trú (Thôn / Xã / TX)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Thôn Vân Cốc 1, Xã Vân Hà"
                    value={formData.permanentAddress}
                    onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Họ tên Phụ huynh
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Bác Nguyễn Văn Bình"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    SĐT Phụ huynh
                  </label>
                  <input
                    type="tel"
                    placeholder="VD: 0912345678"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ghi chú
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú về học sinh nếu có..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingStudent(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  {editingStudent ? 'Lưu thay đổi' : 'Thêm học sinh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOVE TEAM MODAL (CHUYỂN TỔ TỪNG EM) */}
      {movingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <h3 className="font-bold text-slate-900 text-base mb-1">Chuyển Tổ Học Sinh</h3>
            <p className="text-xs text-slate-600 mb-4">
              Chuyển học sinh <strong>{movingStudent.name}</strong> (hiện tại: <strong>{movingStudent.teamId ? `Tổ ${movingStudent.teamId}` : 'Chưa chia'}</strong>) sang tổ:
            </p>

            <div className="grid grid-cols-5 gap-1.5 mb-5">
              <button
                type="button"
                onClick={() => setTargetTeamId(0)}
                className={`py-2.5 rounded-xl font-bold text-xs border cursor-pointer ${
                  targetTeamId === 0
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Chưa chia
              </button>
              {[1, 2, 3, 4].map(tId => (
                <button
                  key={tId}
                  type="button"
                  onClick={() => setTargetTeamId(tId)}
                  className={`py-2.5 rounded-xl font-bold text-xs border cursor-pointer ${
                    targetTeamId === tId
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Tổ {tId}
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMovingStudent(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmMoveTeam}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md cursor-pointer"
              >
                Chuyển sang {targetTeamId > 0 ? `Tổ ${targetTeamId}` : 'Chưa phân tổ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPOINT / DISMISS OFFICER MODAL (BỔ NHIỆM / BÃI NHIỆM CÁN SỰ) */}
      {appointingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Bổ Nhiệm / Bãi Nhiệm Cán Sự</h3>
                  <p className="text-xs text-slate-500">
                    Học sinh: <strong className="text-indigo-700">{appointingStudent.name}</strong> • STT: {appointingStudent.stt}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAppointingStudent(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Status Box */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500">Chức vụ hiện tại:</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{appointingStudent.roleTitle || 'Thành viên'}</div>
              </div>
              <div className="text-right">
                <span className="text-slate-500">Tổ sinh hoạt:</span>
                <div className="font-bold text-indigo-700 mt-0.5">
                  {appointingStudent.teamId ? `Tổ ${appointingStudent.teamId}` : 'Chưa phân tổ'}
                </div>
              </div>
            </div>

            {/* Section 1: Ban Cán Sự Lớp */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>1. Ban Cán Sự Lớp</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { role: 'Lớp trưởng', icon: '⭐', color: 'hover:border-purple-500 hover:bg-purple-50 text-purple-900' },
                  { role: 'Lớp phó học tập', icon: '📘', color: 'hover:border-blue-500 hover:bg-blue-50 text-blue-900' },
                  { role: 'Lớp phó nề nếp', icon: '🛡️', color: 'hover:border-indigo-500 hover:bg-indigo-50 text-indigo-900' },
                  { role: 'Lớp phó văn thể mỹ', icon: '🎨', color: 'hover:border-pink-500 hover:bg-pink-50 text-pink-900' },
                  { role: 'Lớp phó lao động', icon: '🌿', color: 'hover:border-emerald-500 hover:bg-emerald-50 text-emerald-900' },
                ].map((item) => {
                  const isCurrent = appointingStudent.roleTitle === item.role;
                  return (
                    <button
                      key={item.role}
                      type="button"
                      onClick={async () => {
                        await handleDirectAppoint(appointingStudent, item.role);
                        setAppointingStudent(null);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-xs ring-2 ring-purple-300'
                          : `border-slate-200 bg-white ${item.color}`
                      }`}
                    >
                      <span className="truncate">{item.icon} {item.role}</span>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Ban Cán Sự Tổ */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>2. Ban Cán Sự Tổ (Tổ {appointingStudent.teamId || 1})</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { role: 'Tổ trưởng', icon: '🚩', color: 'hover:border-emerald-500 hover:bg-emerald-50 text-emerald-900' },
                  { role: 'Tổ phó', icon: '🌱', color: 'hover:border-teal-500 hover:bg-teal-50 text-teal-900' },
                ].map((item) => {
                  const isCurrent = appointingStudent.roleTitle === item.role;
                  return (
                    <button
                      key={item.role}
                      type="button"
                      onClick={async () => {
                        await handleDirectAppoint(appointingStudent, item.role);
                        setAppointingStudent(null);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs ring-2 ring-emerald-300'
                          : `border-slate-200 bg-white ${item.color}`
                      }`}
                    >
                      <span>{item.icon} {item.role}</span>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Chức vụ tùy chỉnh */}
            <div className="space-y-1.5 pt-1">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                3. Chức vụ đặc biệt khác
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="VD: Thủ quỹ, Quản ca, Đội viên cờ đỏ..."
                  value={customRoleText}
                  onChange={(e) => setCustomRoleText(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  type="button"
                  disabled={!customRoleText.trim()}
                  onClick={async () => {
                    if (!customRoleText.trim()) return;
                    await handleDirectAppoint(appointingStudent, customRoleText.trim());
                    setAppointingStudent(null);
                  }}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors shrink-0"
                >
                  Bổ nhiệm
                </button>
              </div>
            </div>

            {/* Section 4: Bãi nhiệm cán sự */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              {appointingStudent.roleTitle !== 'Thành viên' ? (
                <button
                  type="button"
                  onClick={async () => {
                    await handleDirectAppoint(appointingStudent, 'Thành viên');
                    setAppointingStudent(null);
                  }}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <UserX className="w-4 h-4 text-rose-600" />
                  <span>Bãi nhiệm chức vụ $\rightarrow$ Về Thành viên</span>
                </button>
              ) : (
                <div className="text-xs text-slate-400 italic">Học sinh đang là Thành viên thông thường</div>
              )}

              <button
                type="button"
                onClick={() => setAppointingStudent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
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
