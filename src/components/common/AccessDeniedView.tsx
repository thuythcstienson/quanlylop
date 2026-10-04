import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldAlert, ArrowLeft, LogIn, Trophy } from 'lucide-react';

interface AccessDeniedViewProps {
  target: string;
  onNavigateHome?: () => void;
  onOpenLogin?: () => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  target,
  onNavigateHome,
  onOpenLogin,
}) => {
  const { currentUser } = useApp();

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl mx-auto flex items-center justify-center border border-rose-200 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 uppercase tracking-wider">
            Khu Vực Giới Hạn Quyền Hạn
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Bạn Không Có Quyền Truy Cập {target}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            {currentUser.role === 'guest' ? (
              <>
                Bạn đang truy cập ở chế độ <strong>Khách xem công khai</strong>. Mục <strong>{target}</strong> chỉ dành riêng cho Giáo viên chủ nhiệm hoặc tài khoản đã được phân quyền quản trị.
              </>
            ) : (
              <>
                Tài khoản của bạn (<strong>{currentUser.displayName}</strong> - vai trò <em>{currentUser.role}</em>) chưa được Giáo viên chủ nhiệm phân quyền truy cập mục <strong>{target}</strong>.
              </>
            )}
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs text-slate-500 space-y-1 text-left max-w-md mx-auto">
          <div className="font-bold text-slate-700">Quy tắc bảo mật hệ thống Lớp 9A1:</div>
          <div>• Chỉ Giáo viên chủ nhiệm mới có quyền cài đặt quy chế, sửa thang điểm và phân quyền.</div>
          <div>• Khách xem và học sinh có thể theo dõi tự do Bảng thi đua, Điểm cộng/trừ và Vinh danh mà không cần đăng nhập.</div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onOpenLogin && (
            <button
              onClick={onOpenLogin}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md flex items-center gap-2 cursor-pointer transition-transform"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập tài khoản GVCN</span>
            </button>
          )}

          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-transform"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về Trang Tổng Quan</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
