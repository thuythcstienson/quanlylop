import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Home, 
  Sparkles, 
  Trophy, 
  Users, 
  Menu
} from 'lucide-react';

interface BottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenMenu: () => void;
  onOpenLogin?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenMenu,
  onOpenLogin
}) => {
  const { data, currentUser, getPendingTransactions } = useApp();
  const pendingCount = getPendingTransactions().length;
  const activeCampaignsCount = (data.campaigns || []).filter(c => c.status === 'active').length;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* 1. Trang chủ */}
        <button
          onClick={() => onNavigate('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors cursor-pointer ${
            currentView === 'dashboard'
              ? 'text-indigo-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Trang chủ</span>
        </button>

        {/* 2. Nhập nhanh (Prominent for mobile phone cadres!) */}
        <button
          onClick={() => {
            if (currentUser.role === 'guest' && onOpenLogin) {
              onOpenLogin();
            } else {
              onNavigate('quick-entry');
            }
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            currentView === 'quick-entry'
              ? 'text-white bg-indigo-600 shadow-md font-bold'
              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-semibold'
          }`}
        >
          <Sparkles className="w-5 h-5 mb-0.5 animate-pulse" />
          <span className="text-[10px]">Nhập nhanh</span>
        </button>

        {/* 3. Bảng tổng hợp thi đua */}
        <button
          onClick={() => onNavigate('competition')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors cursor-pointer ${
            currentView === 'competition'
              ? 'text-indigo-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Trophy className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Tổng hợp</span>
        </button>

        {/* 4. Học sinh & Tổ */}
        <button
          onClick={() => onNavigate('students')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors cursor-pointer ${
            currentView === 'students'
              ? 'text-indigo-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Học sinh</span>
        </button>

        {/* 5. Menu mở rộng */}
        <button
          onClick={onOpenMenu}
          className="relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Thêm</span>
          {(currentUser.role === 'admin' && pendingCount > 0) ? (
            <span className="absolute top-1 right-2 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
          ) : activeCampaignsCount > 0 ? (
            <span className="absolute top-1 right-2 w-2 h-2 bg-amber-500 rounded-full" />
          ) : null}
        </button>
      </div>
    </nav>
  );
};
