import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole, UserAccount } from '../../types';
import { 
  UserCheck, 
  Shield, 
  ShieldCheck,
  KeyRound, 
  Lock, 
  Unlock, 
  History, 
  PlusCircle, 
  X, 
  Check, 
  AlertCircle,
  User,
  Edit3,
  Phone,
  Mail,
  Briefcase,
  Sliders
} from 'lucide-react';
import { formatDateVN } from '../../utils/exportUtils';
import { ProfileEditModal } from '../auth/ProfileEditModal';
import { PasswordChangeModal } from '../auth/LoginModal';
import { PermissionsModal } from './PermissionsModal';

export const AccountsView: React.FC = () => {
  const { data, currentUser, addAccount, toggleLockAccount, changePassword, openConfirm, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'accounts' | 'audit_log'>('accounts');

  // Modal profile & pass change for current user
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPassChangeOpen, setIsPassChangeOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);

  // Modal create account
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('123456');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('to_truong');
  const [newTeamId, setNewTeamId] = useState<number>(1);
  const [newStudentId, setNewStudentId] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newTitle, setNewTitle] = useState<string>('');

  // Modal reset password
  const [resettingUser, setResettingUser] = useState<UserAccount | null>(null);
  const [adminNewPass, setAdminNewPass] = useState('123456');

  // Handle select cadre student
  const handleSelectCadreStudent = (studentId: string) => {
    setNewStudentId(studentId);
    const s = data.students.find(item => item.id === studentId);
    if (!s) return;

    setNewTeamId(s.teamId || 1);
    setNewPhone(s.parentPhone || '');

    const roleLower = s.roleTitle.toLowerCase();
    if (roleLower.includes('lớp trưởng')) {
      setNewRole('lop_truong');
      setNewUsername('loptruong');
      setNewDisplayName(`${s.name} (Lớp trưởng)`);
      setNewTitle('Quản lý chung lớp 9A1 & thi đua');
    } else if (roleLower.includes('học tập')) {
      setNewRole('lop_pho_ht');
      setNewUsername('loppho_ht');
      setNewDisplayName(`${s.name} (LP Học tập)`);
      setNewTitle('Theo dõi bài tập & kiểm tra đầu giờ');
    } else if (roleLower.includes('nề nếp')) {
      setNewRole('lop_pho_nn');
      setNewUsername('loppho_nn');
      setNewDisplayName(`${s.name} (LP Nề nếp)`);
      setNewTitle('Theo dõi đi muộn, đồng phục, vệ sinh');
    } else if (roleLower.includes('văn thể')) {
      setNewRole('lop_pho_vtm');
      setNewUsername('loppho_vtm');
      setNewDisplayName(`${s.name} (LP Văn thể mỹ)`);
      setNewTitle('Phong trào văn nghệ & thể thao');
    } else if (roleLower.includes('tổ trưởng')) {
      setNewRole('to_truong');
      setNewUsername(`totruong${s.teamId}`);
      setNewDisplayName(`${s.name} (Tổ trưởng ${s.teamId})`);
      setNewTitle(`Quản lý nề nếp Tổ ${s.teamId}`);
    } else if (roleLower.includes('tổ phó')) {
      setNewRole('to_pho');
      setNewUsername(`topho${s.teamId}`);
      setNewDisplayName(`${s.name} (Tổ phó ${s.teamId})`);
      setNewTitle(`Hỗ trợ quản lý Tổ ${s.teamId}`);
    } else {
      setNewRole('hoc_sinh');
      const cleanName = s.name.split(' ').pop()?.toLowerCase() || 'hocsinh';
      setNewUsername(`hs_${cleanName}_${s.stt}`);
      setNewDisplayName(s.name);
      setNewTitle('Học sinh Lớp 9A1');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newDisplayName.trim() || !newPassword.trim()) return;

    await addAccount({
      username: newUsername.trim().toLowerCase(),
      passwordHash: newPassword,
      displayName: newDisplayName.trim(),
      role: newRole,
      teamId: newRole === 'to_truong' || newRole === 'to_pho' ? newTeamId : undefined,
      studentId: newStudentId || undefined,
      phone: newPhone.trim(),
      title: newTitle.trim(),
    });

    setIsCreateOpen(false);
    setNewUsername('');
    setNewDisplayName('');
    setNewPassword('123456');
    setNewPhone('');
    setNewTitle('');
    setNewStudentId('');
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || !adminNewPass) return;

    await changePassword(resettingUser.id, '', adminNewPass, true);
    setResettingUser(null);
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'Giáo viên CN (Toàn quyền)';
      case 'lop_truong': return 'Lớp trưởng';
      case 'lop_pho_ht': return 'Lớp phó Học tập';
      case 'lop_pho_nn': return 'Lớp phó Nề nếp';
      case 'lop_pho_vtm': return 'Lớp phó Văn thể mỹ';
      case 'to_truong': return 'Tổ trưởng';
      case 'to_pho': return 'Tổ phó';
      case 'hoc_sinh': return 'Học sinh';
      case 'phu_huynh': return 'Phụ huynh';
      default: return role;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 pb-24 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-indigo-950 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-xs rounded-full text-xs font-bold mb-2">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>Phân Quyền & Bảo Mật Hệ Thống</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            QUẢN LÝ TÀI KHOẢN & NHẬT KÝ
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Quản trị tài khoản cán sự lớp, phân quyền theo chức năng và giám sát toàn bộ vết thao tác (Audit Log).
          </p>
        </div>

        {currentUser.role === 'admin' && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsPermissionsModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 cursor-pointer transition-transform"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Thiết lập phân quyền chi tiết</span>
            </button>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 cursor-pointer transition-transform"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tạo tài khoản cán sự mới</span>
            </button>
          </div>
        )}
      </div>

      {/* Your Personal Account Card */}
      <div className="bg-white rounded-2xl border border-indigo-100 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white font-black text-xl flex items-center justify-center shadow-md shrink-0">
            {currentUser.displayName ? currentUser.displayName.charAt(0) : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900 text-base sm:text-lg">
                {currentUser.displayName}
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                currentUser.role === 'admin'
                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                  : 'bg-indigo-100 text-indigo-800 border-indigo-200'
              }`}>
                {getRoleLabel(currentUser.role)}
              </span>
            </div>
            <div className="text-xs text-slate-500 font-mono mt-0.5">
              Tên đăng nhập: <strong>@{currentUser.username}</strong>
              {currentUser.phone && <span className="ml-2 font-sans font-medium text-slate-600">• SĐT: {currentUser.phone}</span>}
              {currentUser.title && <span className="ml-2 font-sans font-medium text-indigo-700">• {currentUser.title}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsProfileOpen(true)}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Đổi thông tin cá nhân</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPassChangeOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-slate-500" />
            <span>Đổi mật khẩu</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`pb-2.5 px-4 font-bold text-sm transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'accounts'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Danh Sách Tài Khoản ({data.accounts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit_log')}
          className={`pb-2.5 px-4 font-bold text-sm transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'audit_log'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Nhật Ký Thao Tác (Audit Log)</span>
        </button>
      </div>

      {/* TAB 1: ACCOUNTS LIST */}
      {activeTab === 'accounts' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="py-3 px-3 text-center w-12">STT</th>
                  <th className="py-3 px-3">Họ tên & Nhiệm vụ</th>
                  <th className="py-3 px-3">Tên đăng nhập</th>
                  <th className="py-3 px-3">Vai trò</th>
                  <th className="py-3 px-3 text-center">Phạm vi</th>
                  <th className="py-3 px-3">Liên hệ</th>
                  <th className="py-3 px-3 text-center">Trạng thái</th>
                  <th className="py-3 px-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.accounts.map((acc, idx) => (
                  <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                    
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{acc.displayName}</div>
                      {acc.title ? (
                        <div className="text-[11px] text-indigo-600 font-medium">{acc.title}</div>
                      ) : (
                        <div className="text-[11px] text-slate-400">
                          Tạo lúc: {formatDateVN(acc.createdAt)}
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">
                      @{acc.username}
                    </td>

                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        acc.role === 'admin'
                          ? 'bg-rose-100 text-rose-800 font-bold'
                          : acc.role.includes('lop_truong')
                          ? 'bg-indigo-100 text-indigo-800'
                          : acc.role.includes('to_truong')
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {getRoleLabel(acc.role)}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      {acc.teamId ? (
                        <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-xs">
                          Tổ {acc.teamId}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Toàn lớp</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-xs text-slate-600">
                      <div>{acc.phone || '—'}</div>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      {acc.isLocked ? (
                        <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Đã khóa
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <Unlock className="w-3 h-3" /> Hoạt động
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      {currentUser.role === 'admin' && acc.role !== 'admin' ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setIsPermissionsModalOpen(true)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Phân quyền chi tiết cho tài khoản"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setResettingUser(acc);
                              setAdminNewPass('123456');
                            }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Đặt lại mật khẩu"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              openConfirm({
                                title: acc.isLocked ? `Mở khóa tài khoản @${acc.username}?` : `Khóa tài khoản @${acc.username}?`,
                                message: acc.isLocked
                                  ? 'Tài khoản này sẽ có thể đăng nhập lại bình thường.'
                                  : 'Tài khoản này sẽ bị chặn đăng nhập ngay lập tức.',
                                confirmText: acc.isLocked ? 'Mở khóa' : 'Khóa tài khoản',
                                isDestructive: !acc.isLocked,
                                onConfirm: () => toggleLockAccount(acc.id),
                              });
                            }}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              acc.isLocked
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                            title={acc.isLocked ? 'Mở khóa' : 'Khóa tài khoản'}
                          >
                            {acc.isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Quản trị viên</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOG */}
      {activeTab === 'audit_log' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 font-bold">
            <span>Nhật ký ghi nhận hệ thống ({data.auditLogs.length} sự kiện)</span>
            <span className="text-[11px] text-slate-400 font-normal">Tự động lưu vết mọi thao tác thêm/sửa/xóa</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {data.auditLogs.map((log) => (
              <div key={log.id} className="p-3.5 hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.userName}</span>
                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold text-[10px]">
                      {log.role}
                    </span>
                    <span className="text-indigo-600 font-bold">• {log.action}</span>
                  </div>
                  <p className="text-slate-700 leading-snug">{log.details}</p>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                  {formatDateVN(log.timestamp)} {new Date(log.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE ACCOUNT MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base">Cấp Tài Khoản Mới</h3>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Họ tên người dùng *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Vũ Quốc Bảo (Tổ trưởng 1)"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tên đăng nhập *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: totruong1"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mật khẩu khởi tạo
                  </label>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Vai trò *
                  </label>
                  <select
                    value={newRole}
                    onChange={(e: any) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  >
                    <option value="lop_truong">Lớp trưởng</option>
                    <option value="lop_pho_ht">Lớp phó học tập</option>
                    <option value="lop_pho_nn">Lớp phó nề nếp</option>
                    <option value="lop_pho_vtm">Lớp phó văn thể mỹ</option>
                    <option value="to_truong">Tổ trưởng</option>
                    <option value="to_pho">Tổ phó</option>
                    <option value="hoc_sinh">Học sinh</option>
                    <option value="phu_huynh">Phụ huynh</option>
                  </select>
                </div>

                {(newRole === 'to_truong' || newRole === 'to_pho') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Thuộc Tổ *
                    </label>
                    <select
                      value={newTeamId}
                      onChange={(e) => setNewTeamId(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                    >
                      <option value={1}>Tổ 1</option>
                      <option value={2}>Tổ 2</option>
                      <option value={3}>Tổ 3</option>
                      <option value={4}>Tổ 4</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Liên kết tới học sinh (tùy chọn)
                </label>
                <select
                  value={newStudentId}
                  onChange={(e) => {
                    const sid = e.target.value;
                    if (sid) {
                      handleSelectCadreStudent(sid);
                    } else {
                      setNewStudentId('');
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                >
                  <option value="">-- Không liên kết hồ sơ --</option>
                  {data.students.map(s => (
                    <option key={s.id} value={s.id}>
                      #{s.stt} - {s.name} (Tổ {s.teamId} • {s.roleTitle})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <h3 className="font-bold text-slate-900 text-base mb-1">Đặt Lại Mật Khẩu</h3>
            <p className="text-xs text-slate-600 mb-4">
              Cấp mật khẩu mới cho tài khoản: <strong>@{resettingUser.username}</strong> ({resettingUser.displayName})
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật khẩu mới:
                </label>
                <input
                  type="text"
                  required
                  value={adminNewPass}
                  onChange={(e) => setAdminNewPass(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md cursor-pointer"
                >
                  Lưu mật khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Personal Profile Modal */}
      <ProfileEditModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onOpenChangePassword={() => setIsPassChangeOpen(true)}
      />

      {/* Change Password Modal */}
      <PasswordChangeModal
        isOpen={isPassChangeOpen}
        onClose={() => setIsPassChangeOpen(false)}
      />

      {/* Permissions Configuration Modal */}
      <PermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
      />
    </div>
  );
};
