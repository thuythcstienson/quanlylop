import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Phone, Mail, FileText, Briefcase, KeyRound, X, Check, Shield } from 'lucide-react';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChangePassword?: () => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  onOpenChangePassword,
}) => {
  const { currentUser, updateUserProfile } = useApp();

  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      setDisplayName(currentUser.displayName || '');
      setPhone(currentUser.phone || '');
      setEmail(currentUser.email || '');
      setTitle(currentUser.title || '');
      setNotes(currentUser.notes || '');
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setIsSaving(true);
    await updateUserProfile({
      displayName: displayName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      title: title.trim(),
      notes: notes.trim(),
    });
    setIsSaving(false);
    onClose();
  };

  const getRoleBadge = () => {
    switch (currentUser.role) {
      case 'admin':
        return { label: 'Giáo viên Chủ nhiệm', color: 'bg-rose-100 text-rose-800 border-rose-200' };
      case 'lop_truong':
        return { label: 'Lớp trưởng', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'lop_pho_ht':
        return { label: 'Lớp phó Học tập', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'lop_pho_nn':
        return { label: 'Lớp phó Nề nếp', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'lop_pho_vtm':
        return { label: 'Lớp phó Văn thể mỹ', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'to_truong':
        return { label: `Tổ trưởng (Tổ ${currentUser.teamId || 1})`, color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'to_pho':
        return { label: `Tổ phó (Tổ ${currentUser.teamId || 1})`, color: 'bg-teal-100 text-teal-800 border-teal-200' };
      case 'hoc_sinh':
        return { label: 'Học sinh', color: 'bg-slate-100 text-slate-800 border-slate-200' };
      case 'phu_huynh':
        return { label: 'Phụ huynh', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' };
      default:
        return { label: currentUser.role, color: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  const roleBadge = getRoleBadge();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 overflow-hidden transform animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white font-black text-lg flex items-center justify-center shadow-md">
              {currentUser.displayName ? currentUser.displayName.charAt(0) : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                  Thông Tin Cá Nhân
                </h3>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${roleBadge.color}`}>
                  {roleBadge.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Tài khoản: @{currentUser.username}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Display Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Họ và tên hiển thị <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Nhập họ và tên..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
            {currentUser.role === 'admin' && (
              <p className="text-[11px] text-slate-500 mt-1">
                Tên GVCN sẽ tự động đồng bộ lên tiêu đề lớp, báo cáo và xuất file.
              </p>
            )}
          </div>

          {/* Title / Role Assignment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Chức danh / Nhiệm vụ phụ trách
            </label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Quản lý chung nề nếp, theo dõi bài tập..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Two Columns: Phone and Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Số điện thoại liên hệ
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09xx..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Ghi chú cá nhân
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú về phân công, thời gian trực nhật..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Quick link to Change Password */}
          {onOpenChangePassword && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                <KeyRound className="w-4 h-4 text-indigo-600" />
                <span>Bảo mật: Mật khẩu đăng nhập</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenChangePassword();
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 cursor-pointer"
              >
                Đổi mật khẩu ngay
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:bg-slate-300"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
