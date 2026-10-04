import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  GraduationCap, 
  Shield, 
  UserCheck, 
  Users, 
  Bell, 
  KeyRound, 
  LogOut, 
  ChevronDown, 
  Sparkles,
  RotateCcw,
  User,
  Database,
  Trophy,
  MessageSquare,
  LogIn,
  Settings
} from 'lucide-react';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenLogin: () => void;
  onOpenPasswordModal: () => void;
  onOpenProfileModal: () => void;
  onOpenBackupModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenLogin,
  onOpenPasswordModal,
  onOpenProfileModal,
  onOpenBackupModal
}) => {
  const { data, currentUser, logout, getPendingTransactions, openConfirm, resetDemoData, hasPermission } = useApp();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const pendingCount = getPendingTransactions().length;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Giáo viên CN', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'lop_truong':
        return { label: 'Lớp trưởng', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'lop_pho_ht':
        return { label: 'LP Học tập', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'lop_pho_nn':
        return { label: 'LP Nề nếp', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'lop_pho_vtm':
        return { label: 'LP Văn thể mỹ', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'to_truong':
        return { label: `Tổ trưởng ${currentUser.teamId ? 'T' + currentUser.teamId : ''}`, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'to_pho':
        return { label: `Tổ phó ${currentUser.teamId ? 'T' + currentUser.teamId : ''}`, color: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'hoc_sinh':
        return { label: 'Học sinh', color: 'bg-slate-50 text-slate-700 border-slate-200' };
      case 'phu_huynh':
        return { label: 'Phụ huynh', color: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'guest':
        return { label: 'Khách xem', color: 'bg-slate-100 text-slate-600 border-slate-200' };
      default:
        return { label: 'Cán sự', color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const roleInfo = getRoleBadge(currentUser.role);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top micro banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white px-3 sm:px-6 py-1.5 flex items-center justify-between text-xs font-medium">
        <div className="flex items-center gap-2 truncate">
          <GraduationCap className="w-4 h-4 shrink-0 text-indigo-200" />
          <span className="truncate">
            <strong className="font-semibold">{data.config.schoolName}</strong> • Năm học {data.config.schoolYear}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenBackupModal}
            title="Sao lưu & Khôi phục dữ liệu an toàn"
            className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1.5 text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
          >
            <Database className="w-3.5 h-3.5 text-emerald-300" />
            <span>Sao lưu dữ liệu</span>
          </button>
          <span className="bg-amber-400 text-amber-950 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
            DỮ LIỆU DEMO
          </span>
          {currentUser.role === 'admin' && (
            <button
              onClick={() => {
                openConfirm({
                  title: 'Đặt lại dữ liệu mẫu Demo?',
                  message: 'Hệ thống sẽ nạp lại toàn bộ dữ liệu 41 học sinh mẫu và các giao dịch mẫu ban đầu.',
                  confirmText: 'Đặt lại ngay',
                  onConfirm: resetDemoData,
                });
              }}
              title="Đặt lại dữ liệu mẫu ban đầu"
              className="text-indigo-100 hover:text-white flex items-center gap-1 text-[11px] underline underline-offset-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Đặt lại
            </button>
          )}
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Logo and class brand */}
        <div 
          onClick={() => onNavigate('dashboard')} 
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-md group-hover:scale-105 transition-transform">
            9A1
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-slate-900 text-base sm:text-lg leading-tight tracking-tight">
                QUẢN LÝ LỚP 9A1
              </h1>
              <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md">
                THCS Vân Hà 2
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
              GVCN: {data.config.teacherName} • Sĩ số: {data.students.length} HS
            </p>
          </div>
        </div>

        {/* Desktop Quick Nav Menu */}
        <nav className="hidden lg:flex items-center gap-1 text-sm font-semibold text-slate-600">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              currentView === 'dashboard'
                ? 'bg-indigo-50 text-indigo-700 font-bold'
                : 'hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Tổng quan
          </button>

          {/* Nhập nhanh: nếu chưa đăng nhập thì bấm vào sẽ mở form Đăng nhập */}
          <button
            onClick={() => currentUser.role === 'guest' ? onOpenLogin() : onNavigate('quick-entry')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              currentView === 'quick-entry'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
            title={currentUser.role === 'guest' ? 'Đăng nhập để ghi nhận điểm' : 'Ghi nhận điểm nhanh'}
          >
            <Sparkles className="w-4 h-4" />
            <span>Nhập nhanh</span>
            {currentUser.role === 'guest' && <span className="text-[10px] bg-emerald-200/60 text-emerald-800 px-1 rounded">Cần ĐN</span>}
          </button>

          <button
            onClick={() => onNavigate('competition')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              currentView === 'competition'
                ? 'bg-indigo-50 text-indigo-700 font-bold'
                : 'hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Bảng tổng hợp
          </button>

          <button
            onClick={() => onNavigate('campaigns')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              currentView === 'campaigns'
                ? 'bg-amber-100 text-amber-900 font-bold'
                : 'hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-600" />
            <span>Cuộc thi & Phong trào</span>
            {(data.campaigns || []).filter(c => c.status === 'active').length > 0 && (
              <span className="bg-amber-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {(data.campaigns || []).filter(c => c.status === 'active').length}
              </span>
            )}
          </button>

          <button
            onClick={() => onNavigate('students')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              currentView === 'students'
                ? 'bg-indigo-50 text-indigo-700 font-bold'
                : 'hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Học sinh & Tổ
          </button>

          <button
            onClick={() => onNavigate('evaluations')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              currentView === 'evaluations'
                ? 'bg-teal-50 text-teal-800 font-bold'
                : 'hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-teal-600" />
            <span>Nhận xét</span>
          </button>

          <button
            onClick={() => onNavigate('commendation')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              currentView === 'commendation'
                ? 'bg-indigo-50 text-indigo-700 font-bold'
                : 'hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Biểu dương
          </button>

          <button
            onClick={() => onNavigate('reports')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              currentView === 'reports'
                ? 'bg-indigo-50 text-indigo-700 font-bold'
                : 'hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Báo cáo & Xuất file
          </button>

          {/* Duyệt điểm: Chỉ hiển thị cho tài khoản có quyền canReviewPoints */}
          {(currentUser.role === 'admin' || hasPermission('canReviewPoints')) && pendingCount > 0 && (
            <button
              onClick={() => onNavigate('approval')}
              className="relative px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 font-bold hover:bg-amber-100 flex items-center gap-1.5 cursor-pointer animate-pulse"
            >
              <span>Duyệt điểm</span>
              <span className="bg-amber-600 text-white text-xs px-1.5 py-0.2 rounded-full">
                {pendingCount}
              </span>
            </button>
          )}

          {/* Quản lý tài khoản: Chỉ hiển thị khi được phân quyền canManageAccounts */}
          {(currentUser.role === 'admin' || hasPermission('canManageAccounts')) && (
            <button
              onClick={() => onNavigate('accounts')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentView === 'accounts'
                  ? 'bg-emerald-50 text-emerald-800 font-bold'
                  : 'hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Tài khoản</span>
            </button>
          )}

          {/* Cài đặt: Chỉ hiển thị khi được phân quyền canManageRules */}
          {(currentUser.role === 'admin' || hasPermission('canManageRules')) && (
            <button
              onClick={() => onNavigate('settings')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentView === 'settings'
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Settings className="w-4 h-4 text-slate-600" />
              <span>Cài đặt</span>
            </button>
          )}
        </nav>

        {/* User Role Profile & Fast Switcher */}
        <div className="relative flex items-center gap-2">
          {currentUser.role === 'guest' ? (
            /* Guest / Public Mode */
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Xem công khai</span>
              </span>
              <button
                onClick={onOpenLogin}
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập</span>
              </button>
            </div>
          ) : (
            /* Logged-in Cadre / Teacher Profile Pill */
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(prev => !prev)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all text-left cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  {currentUser.displayName.charAt(0)}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[130px]">
                    {currentUser.displayName}
                  </div>
                  <div className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-sm border inline-block ${roleInfo.color}`}>
                    {roleInfo.label}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Profile Dropdown */}
              {showRoleMenu && (
                <div 
                  className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95"
                  onMouseLeave={() => setShowRoleMenu(false)}
                >
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                    <div className="text-[11px] text-slate-400 font-medium">Tài khoản đang đăng nhập:</div>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">{currentUser.displayName}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${roleInfo.color}`}>
                        {roleInfo.label}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">@{currentUser.username}</span>
                    </div>
                  </div>

                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        onOpenProfileModal();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <User className="w-4 h-4 text-indigo-600" />
                      <span>Hồ sơ & Thông tin cá nhân</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        onOpenPasswordModal();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <KeyRound className="w-4 h-4 text-slate-500" />
                      <span>Đổi mật khẩu</span>
                    </button>

                    {(currentUser.role === 'admin' || hasPermission('canBackupRestore')) && (
                      <button
                        onClick={() => {
                          setShowRoleMenu(false);
                          onOpenBackupModal();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-emerald-800 hover:bg-emerald-50 flex items-center gap-2.5 cursor-pointer transition-colors"
                      >
                        <Database className="w-4 h-4 text-emerald-600" />
                        <span>Sao lưu & Khôi phục dữ liệu</span>
                      </button>
                    )}

                    <div className="border-t border-slate-100 my-1 pt-1">
                      <button
                        onClick={() => {
                          setShowRoleMenu(false);
                          logout();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-rose-600" />
                        <span>Đăng xuất (Về xem công khai)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
